# HAVEN Environment Variables

This document lists required runtime configuration. Store production values in Supabase secrets, Vercel environment variables, EAS secrets or the relevant secret manager.

## Supabase / deployment

| Variable | Used by | Purpose |
|---|---|---|
| `SUPABASE_ACCESS_TOKEN` | deploy script | Supabase CLI deployment |
| `SUPABASE_PROJECT_REF` | deploy script | target Supabase project |
| `HAVEN_ENV` | all functions | environment label such as staging or production |
| `SUPABASE_URL` | Edge Functions | Supabase API URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Edge Functions | server-only Supabase service key |

## Elder app public config

| Variable | Purpose |
|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `EXPO_PUBLIC_ENV` | app environment |
| `EXPO_PUBLIC_LOCALE` | default locale |
| `EXPO_PUBLIC_TZ` | timezone, expected `Europe/Amsterdam` |

## AI / voice

| Variable | Purpose |
|---|---|
| `OPENAI_API_KEY` | Whisper, embeddings and LLM responses |
| `OPENAI_CHAT_MODEL` | optional chat model override |
| `ELEVENLABS_API_KEY` | text-to-speech |
| `ELEVENLABS_VOICE_ID_NL` | Dutch HAVEN voice |
| `ELEVENLABS_VOICE_ID_EN` | English HAVEN voice |

## Notifications / observability

| Variable | Purpose |
|---|---|
| `EXPO_ACCESS_TOKEN` | Expo push service integration |
| `SENTRY_DSN` | Sentry error capture |
| `LOG_DRAIN_TOKEN` | log drain provider token when enabled |
| `SLACK_WEBHOOK_URL` | SLO alert notifications when enabled |

## External integrations

| Variable | Purpose |
|---|---|
| `PSD2_WEBHOOK_SECRET` | PSD2 webhook HMAC verification |
| `MEDMIJ_CLIENT_ID` | MedMij/FHIR integration |
| `MEDMIJ_CLIENT_SECRET` | MedMij/FHIR integration |
| `GSTANDAARD_CLIENT_ID` | G-Standaard/Z-Index integration when legal gate is met |
| `CARE_SYSTEM_CLIENT_ID` | ONS/Nedap/Careweb integration |
| `CARE_SYSTEM_CLIENT_SECRET` | ONS/Nedap/Careweb integration |

## Security rules

- Never expose `SUPABASE_SERVICE_ROLE_KEY` to client apps.
- Never commit secrets to the repository.
- Rotate secrets after a suspected leak.
- Use separate staging and production values.
