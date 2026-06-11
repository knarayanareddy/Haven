# HAVEN Architecture

## System context

HAVEN consists of:

- Elder app: Expo / React Native.
- Family dashboard: Next.js.
- Carer portal: WACHT role-scoped surface.
- Grandchild app: simplified Expo app.
- Browser Shield: Manifest V3 extension.
- Admin console: compliance and release operations.
- Backend: Supabase Postgres, Auth, Storage, Edge Functions, RLS, Realtime.
- AI providers: OpenAI and ElevenLabs.
- Optional integrations: PSD2, MedMij/FHIR, care systems and G-Standaard/Z-Index.

## Backend principles

1. Elder data ownership.
2. Forced RLS on user-data tables.
3. Consent-scoped family/carer access.
4. No BSN processing.
5. Fuzzed location by default.
6. Precise location TTL of 24 hours for active safety events only.
7. Storage buckets private by default.
8. Service-role access only inside Edge Functions.
9. Audit sensitive operations.
10. Human legal gates remain explicit.

## Data flow examples

### Voice interaction

1. Elder records audio.
2. `fn-voice-pipeline` transcribes via Whisper or accepts text input in local mode.
3. Intent is classified.
4. Medication/family/crisis/story action is executed.
5. Companion memory is retrieved and optionally updated.
6. Response is generated.
7. ElevenLabs creates TTS audio into `tts-cache`.
8. Signed audio URL is returned.

### Scam event

1. Signal enters `fn-scam-pipeline` or `fn-browser-shield`.
2. Input is validated and BSN-like text is rejected.
3. Risk is scored.
4. Event is stored with hashes and plain-language explanation.
5. Family is notified for red/black levels.
6. Audit and metrics are recorded.

### BUURT match

1. Elder opts into PC4 neighbourhood profile.
2. Interests are selected from fixed tags.
3. `fn-buurt-discover` returns counts only.
4. `fn-buurt-match` creates a hidden recipient request.
5. Identity is revealed only after double opt-in.
6. Opt-out deletes profile/tags and ends connections.

### Emergency profile

1. Elder creates token with `fn-emergency-profile`.
2. Token hash is stored.
3. First responder presents token/QR/NFC value.
4. `get_emergency_profile` returns narrow medical profile.
5. Access is logged.

## Observability

- `perf_metrics` stores function duration/status.
- `slo_alerts` stores operational alerts.
- `log_drain_configs` tracks Logflare/Axiom/Sentry/Slack drains.
- `fn-health-check` verifies operational basics.
- `fn-slo-measure` measures function p95 budgets.
