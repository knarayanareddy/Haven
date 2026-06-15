import { admin, corsHeaders, dispatchNotification, json, readRequestBody, recordMetric, requireFields, safeErrorMessage, sha256 } from "../_shared/core.ts";
import { withIdempotency } from "../_shared/idempotency.ts";
import { captureException } from "../_shared/sentry.ts";
import { verifyHmacSha256 } from "../_shared/webhook.ts";
import { asyncWrapper } from "../_shared/async_wrapper.ts";

Deno.serve(asyncWrapper("fn-transaction-intercept", async (req: Request) => {
  const raw = await readRequestBody(req);
  const body = JSON.parse(raw) as Record<string, unknown>;

  const isInternalCall = !!(req.headers.get('x-haven-internal-key') || req.headers.get('x-internal-key'));
  const secret = Deno.env.get('PSD2_WEBHOOK_SECRET');
  const isLocal = Deno.env.get('HAVEN_ENV') === 'local' || Deno.env.get('ENVIRONMENT') === 'local';

  if (isInternalCall) {
    const { requireInternalAccess } = await import("../_shared/internal.ts");
    requireInternalAccess(req);
    await admin().from('webhook_receipts').insert({
      integration_key: 'psd2',
      signature_valid: null,
      body_hash: await sha256(raw),
      event_type: 'transaction_internal',
    });
  } else {
    // Closure Test 3: Fails closed if dependency call fails unexpectedly
    if (!secret && !isLocal) {
      throw new Error('PSD2_WEBHOOK_SECRET must be configured for non-local transaction webhooks');
    }
    if (secret) {
      const valid = await verifyHmacSha256(raw, req.headers.get('x-haven-signature') ?? req.headers.get('x-tink-signature'), secret);
      await admin().from('webhook_receipts').insert({
        integration_key: 'psd2',
        signature_valid: valid,
        body_hash: await sha256(raw),
        event_type: 'transaction',
      });
      if (!valid) throw new Error('403: Invalid PSD2 webhook signature');
    }
  }

  requireFields(body, ["elder_id", "account_id_masked", "amount_cents", "transaction_date"]);
  const idem = (req.headers.get('idempotency-key') ?? body.idempotency_key ?? body.raw_reference) as string | undefined;

  const result = await withIdempotency({
    key: idem,
    functionName: 'fn-transaction-intercept',
    elderId: String(body.elder_id),
    requestBody: body,
    run: async () => {
      const db = admin();
      const amount = Number(body.amount_cents);
      const newPayee = Boolean(body.is_new_payee) || !body.counterparty_iban_masked;
      const anomaly = Math.min(100, (Math.abs(amount) > Number(body.alert_threshold_cents ?? 20000) ? 45 : 0) + (newPayee ? 35 : 0) + (body.scam_event_id ? 35 : 0));
      const flagged = anomaly >= 70;
      
      const { data: tx, error } = await db.from("financial_transactions").insert({
        elder_id: body.elder_id, financial_account_id: body.financial_account_id,
        account_id_masked: body.account_id_masked, bank_name: body.bank_name ? String(body.bank_name) : null,
        amount_cents: amount, currency: body.currency ? String(body.currency) : "EUR",
        counterparty_name: body.counterparty_name ? String(body.counterparty_name) : null,
        counterparty_iban_masked: body.counterparty_iban_masked ? String(body.counterparty_iban_masked) : null,
        description: body.description ? String(body.description) : null, transaction_date: String(body.transaction_date),
        anomaly_score: anomaly, flagged,
        linked_scam_event_id: body.scam_event_id ? String(body.scam_event_id) : null, intercepted: flagged,
        source_provider: body.source_provider ? String(body.source_provider) : "psd2",
        raw_reference_hash: body.raw_reference ? await sha256(String(body.raw_reference)) : null,
        is_internal: isInternalCall,
      }).select().single();

      if (error) throw error;

      if (flagged) {
        const { data: family } = await db.from("family_relationships").select("family_member_id").eq("elder_id", body.elder_id).eq("elder_consented", true).eq("is_active", true).eq("can_view_financials", true);
        await Promise.all((family ?? []).map((f) => dispatchNotification({
          recipient_id: String(f.family_member_id), elder_id: String(body.elder_id),
          notification_type: "scam_zwart", title_nl: "Ongewone betaling", title_en: "Unusual payment",
          body_nl: "HAVEN ziet een ongewone betaling. Bel rustig even mee.",
          body_en: "HAVEN sees an unusual payment. Please calmly check in.",
          data: { transaction_id: tx.id },
        })));
      }
      return { body: { success: true, transaction_id: tx.id, anomaly_score: anomaly, flagged, intercepted: flagged } };
    },
  });

  return json(result.body, result.status ?? 200, req);
}));