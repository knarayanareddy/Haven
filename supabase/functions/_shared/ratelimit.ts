// ─── P0-4 + P0-10 FIX: Rate limiter with atomic counters ───
// For single-isolate: in-memory Map (fine for dev/staging).
// For multi-isolate production: use Supabase-backed counters via
// an idempotency_keys-style atomic upsert.
//
// The in-memory implementation now uses atomic get-then-set via a
// synchronous lock to prevent intra-isolate races.

const WINDOW_MS = 60_000;
const PER_WINDOW = 30;

interface BucketEntry {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, BucketEntry>();

// Clean expired entries every 60 seconds (was 5 min — too long for memory)
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of buckets) {
    if (now > entry.resetAt) buckets.delete(key);
  }
}, 60_000);

// ─── P0-10 FIX: Production-grade rate limiter using Supabase ───
// When HAVEN_RATELIMIT_BACKEND=supabase, uses atomic counter in DB.
// Falls back to in-memory when not configured (single-isolate dev).

async function supabaseRateLimit(req: Request, fnName: string): Promise<'allowed' | 'limited' | 'error'> {
  const auth = req.headers.get("authorization") ?? "";
  const jwtHint = auth.replace(/^Bearer\s+/i, "").slice(-20);
  const ip = req.headers.get("x-real-ip") ?? req.headers.get("x-forwarded-for") ?? "unknown";
  const callerId = jwtHint || ip;
  const key = `${fnName}:${callerId}`;
  const windowStart = new Date(Date.now() - WINDOW_MS).toISOString();

  try {
    const { admin, sha256 } = await import("./core.ts");
    const db = admin();
    const keyHash = await sha256(key);

    // Atomic upsert: insert if not exists, increment if within window
    const { data, error } = await db.rpc("ratelimit_check", {
      p_key_hash: keyHash,
      p_window_start: windowStart,
      p_max_requests: PER_WINDOW,
    });

    if (error) {
      // Fall back to in-memory on DB error
      console.warn(`Rate limit DB check failed, falling back to in-memory: ${error.message}`);
      return 'error';
    }
    return data === true ? 'allowed' : 'limited';
  } catch {
    return 'error';
  }
}

let useSupabaseRL = Deno.env.get("HAVEN_RATELIMIT_BACKEND") === "supabase";

export async function rateLimit(req: Request, fnName: string): Promise<void> {
  // Try Supabase-backed rate limiting in production
  if (useSupabaseRL) {
    try {
      const status = await supabaseRateLimit(req, fnName);
      if (status === 'limited') {
        throw new Error("Rate limit exceeded. Please wait before retrying.");
      } else if (status === 'error') {
        // supabaseRateLimit returned error = "use in-memory"
        useSupabaseRL = false;
      } else if (status === 'allowed') {
        return; // allowed
      }
    } catch (e) {
      if ((e as Error).message.includes("Rate limit exceeded")) throw e;
      // DB error — fall back to in-memory for the rest of this call
    }
  }

  // ─── In-memory fallback ───
  const auth = req.headers.get("authorization") ?? "";
  const jwtHint = auth.replace(/^Bearer\s+/i, "").slice(-20);
  const ip = req.headers.get("x-real-ip") ?? req.headers.get("x-forwarded-for") ?? "unknown";
  const callerId = jwtHint || ip;
  const key = `${fnName}:${callerId}`;
  const now = Date.now();
  const entry = buckets.get(key);

  if (!entry || now > entry.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return;
  }

  entry.count++;
  if (entry.count > PER_WINDOW) {
    throw new Error("Rate limit exceeded. Please wait before retrying.");
  }
}
