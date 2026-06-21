# HAVEN — Voice-First Elder Care Companion

**Your parent's guardian. Your peace of mind.**

HAVEN is a privacy-first, voice-first elder-care platform for older adults in the Netherlands and the families and care professionals who support them. It combines fraud protection, medication support, family connection, cognitive/orientation safety, a warm voice companion and professional care workflows into one coherent product suite.

---

## What HAVEN Does

HAVEN provides **three connected mobile apps** that work together in real-time:

| App | For | Key Capabilities |
|---|---|---|
| **Elder** (Ouderen) | The elderly person | Voice companion, medication tracking with reminders, SOS emergency dial, family messaging, daily wellness check-ins, scam protection |
| **Carer** (Verzorger) | Professional caregivers | Visit logging, medication administration (MAR), handover notes to next shift, safeguarding reports, offline-first workflow |
| **Family** (Familie) | Family members | Live dashboard with medication adherence %, wellness scores, shield (anti-fraud) score, send hearts/check-ins, manage medications, privacy consent toggles |

### Live Cross-App Sync

When a carer completes a visit → the Elder's Zorg tab updates in real-time → the Family dashboard reflects the new data. All powered by Supabase Realtime subscriptions.

### Bilingual (NL/EN)

Every screen supports both Dutch and English with a one-tap language toggle.

---

## Current Build Status

| Check | Status |
|---|---|
| TypeScript (all 3 apps) | Passing |
| ESLint | Passing |
| CI (quality-security-gate, static-suite-validation, browser-e2e, supabase-db-test, supabase-layout-check) | Passing |
| EAS Preview builds | Configured (Android APK) |

### Working Features

- **Authentication** — Login screens with phone OTP (Elder), email magic link + biometric (Carer), email (Family)
- **Medication management** — Elder can view, confirm, snooze, and add medications; Family can add medications; Carer logs administration (MAR)
- **SOS emergency** — Confirmation dialog → real phone dialer opens to 112
- **Family messaging** — Elder sends hearts/thumbs-up → Family receives in real-time
- **Carer visit logging** — Complete visit → saves to Supabase → Elder/Family see the update live
- **Carer handover** — Submit notes → share with Familie or next shift
- **Scam protection (SCHILD)** — Scam event detection pipeline with alerting
- **Privacy consent toggles** — Family manages data sharing permissions, persisted to Supabase
- **Voice AI companion (STEM)** — VAPI-powered real-time voice conversations with Dutch STT/TTS
- **Offline-first** — Actions queue locally when offline, sync when back online
- **Bottom tab navigation** — Consistent across all 3 apps
- **Daily wellness check-ins** — Morning/midday/evening mood tracking

### Security & Privacy

- Row-Level Security (RLS) enforced on all user-data tables
- Elder owns their data; family/carer access requires consent
- BSN is never stored, processed, or transmitted
- Companion memory is elder-private
- GDPR right-to-erasure and data-export implemented
- All Edge Functions use JWT + relationship-based authorization
- P0 security audit completed with trust-boundary hardening

---

## Haven-build-ui: Vision UI Implementation

This repository (`Haven-build-ui`) extends the original Haven-build codebase with a complete **havenUIvision** design implementation, targeting **Android APK builds** with bilingual **EN/NL** support across all three mobile apps.

### Vision UI screens

| App | Screens | Features |
|---|---|---|
| **Elder** (11 screens) | Home, Pills, Shield, Family, Stem, Today, Buurt, Kompas, Wacht, Settings, More | Personalized greeting, medication cards with OCR, scam protection with risk levels, voice companion with recording, daily check-in, neighbourhood connector, safe zones, care status |
| **Carer** (5 tabs) | Vandaag, Handover, MAR-light, Veiligheid, Bezoeken | Daily checklist, handover notes with BSN guard, medication administration, meldcode 5-step safeguarding, visit history |
| **Family Dashboard** (6 tabs) | Overview, Medications, Alerts, Care, Voice, Privacy | Daily status pill, medication adherence %, trust signal panel, care timeline, VAPI Familiar Voice (wired to fn-voice-profile-create/test/revoke), consent toggles |

### Supabase Edge Function wiring

All five "Must Be Real" features are wired to real Supabase Edge Functions with graceful fallback:

| Feature | UI Screen | Edge Function | Fallback |
|---|---|---|---|
| Medication confirm | Elder PillsScreen | `fn-voice-pipeline` + REST query | Mock data if unauthenticated |
| Voice pipeline | Elder StemScreen | `fn-voice-pipeline` (audio + text) | Alert if no session |
| Carer handover | Carer HandoverTab | `fn-carer-handover-note` | Offline IndexedDB queue |
| Family hello | Family OverviewTab | `fn-grandchild-message-send` | Silent skip if no token |
| Push notifications | All 3 apps | `fn-push-token-register` | Graceful skip if denied |

### Shared component library

Located in `packages/ui/src/`:

- `visionComponents.tsx` — GradientCard, StatusBadge, ProgressBar, MoodPicker, ConsentToggle, TimeSlotPill, StockIndicator
- `visionColors.ts` — Pillar gradient definitions
- `mockData.ts` — 482-line offline mock data layer
- `tokens.ts` — Design tokens (colors, spacing)

### Android APK builds

All 3 apps build as **release APKs** (not debug) for Android:

```bash
# From each app's android/ directory after expo prebuild:
cd apps/elder/android && ./gradlew assembleRelease
cd apps/carer/android && ./gradlew assembleRelease
cd apps/grandchild/android && ./gradlew assembleRelease
```

**Key build fixes applied:**
- `expo-linear-gradient` upgraded from `14.1.5` to `56.0.4` (fixed `LazyKType` crash)
- `unimodules-app-loader` forced to `56.0.1` via pnpm overrides
- All apps unified on Expo SDK 56 / React Native 0.85.3 / React 19.2.3

### VAPI Voice AI Integration

Haven uses **VAPI** as its voice AI platform for real-time bidirectional voice conversations. VAPI replaces the manual record-upload-wait flow with a seamless WebRTC-based real-time voice pipeline.

**Architecture:**

```text
Elder taps mic → VAPI SDK opens WebRTC stream → STT (Whisper) → LLM (GPT-4o-mini) → TTS (ElevenLabs) → elder hears response
                                                                                     ↓
                                                              fn-vapi-webhook receives tool calls
                                                              (medication confirm, crisis escalation, family messages)
```

**Components:**

| Layer | Component | Location |
|---|---|---|
| Client SDK | `VapiVoiceService` + `useVapiCall` hook | `packages/vapi/src/` |
| Elder voice orb | Real-time VAPI call with live transcript | `apps/elder/src/screens/vision/StemScreen.tsx` |
| Floating button | VAPI-enhanced with volume visualization | `apps/elder/src/components/FloatingVoiceButton.tsx` |
| Server webhook | Tool-call routing to Edge Functions | `supabase/functions/fn-vapi-webhook/` |
| Assistant setup | Creates NL + EN VAPI Assistants | `scripts/setup-vapi-assistant.ts` |
| Familiar Voice | Voice cloning via ElevenLabs + VAPI TTS | `apps/grandchild/src/screens/vision/VoiceTab.tsx` |

**VAPI features used:**

- Real-time STT via Whisper (optimized for Dutch)
- LLM conversation orchestration with GPT-4o-mini (elder-safe system prompts)
- TTS via ElevenLabs `eleven_multilingual_v2` (supports cloned voices)
- Server-side tool calling (medication, crisis, family messages, schedule lookup)
- Turn-taking and interruption handling
- Silence detection (30s timeout)
- Graceful fallback to record-upload-wait when VAPI is not configured

**Setup:**

```bash
# 1. Create VAPI assistants (requires VAPI API key)
VAPI_API_KEY=vapi_xxx SUPABASE_URL=https://xxx.supabase.co npx tsx scripts/setup-vapi-assistant.ts

# 2. Add output IDs to your .env files
EXPO_PUBLIC_VAPI_API_KEY=vapi_xxx
EXPO_PUBLIC_VAPI_ASSISTANT_ID_NL=<output-nl-id>
EXPO_PUBLIC_VAPI_ASSISTANT_ID_EN=<output-en-id>

# 3. Add VAPI key to Supabase secrets
supabase secrets set VAPI_API_KEY=vapi_xxx
```

### Bilingual EN/NL

Every screen, button, label, alert, and placeholder supports both English and Dutch via a `locale` parameter (defaulting to `nl-NL`). The locale propagates through `ScreenContext` (elder), props (carer/family), and `I18nProvider`.

---

## Repository map

```text
Haven-build/
├── apps/
│   ├── iphone-suite/        # High-fidelity iPhone product suite preview
│   ├── family-dashboard/    # Static family dashboard preview
│   ├── admin-console/       # Compliance/release/admin console preview
│   ├── carer-portal/        # WACHT professional carer portal preview
│   ├── browser-shield/      # Browser Shield extension scaffold
│   ├── elder/               # Expo elder app
│   ├── carer/               # Expo carer app
│   ├── family/              # Next.js family dashboard
│   └── grandchild/          # Expo grandchild companion app
├── docs/
│   ├── api/                 # OpenAPI + Edge Function catalog
│   ├── implementation/      # audits, phase coverage, feature matrix
│   ├── release/             # store metadata, privacy, audits, safety protocols
│   └── runbooks/            # production runbook
├── ml/
│   ├── dataset/             # scam dataset schema and manifest
│   ├── heuristics/          # rule catalog
│   └── prompts/             # scam reasoning prompt
├── packages/
│   ├── contracts/           # TypeScript API/domain contracts
│   ├── database/            # typed database surface
│   ├── i18n/                # EN/NL product copy
│   ├── scam-engine/         # local scam scoring rules
│   ├── schema/              # screen schema + constitution validator
│   ├── ui/                  # design tokens and UI specs
│   └── vapi/                # VAPI voice AI client SDK (VapiVoiceService + useVapiCall hook)
├── scripts/
│   ├── deploy/              # Supabase deploy scripts
│   ├── check-local-supabase.sh
│   ├── validate-suite.mjs
│   └── setup-vapi-assistant.ts  # Creates VAPI NL+EN assistants
├── supabase/
│   ├── functions/           # 82 Edge Functions (including fn-vapi-webhook)
│   ├── migrations/          # timestamped schema/security/runtime migrations
│   ├── seed.sql             # synthetic local seed data
│   └── config.toml          # Supabase local function config
├── tests/
│   ├── edge/
│   ├── rls/
│   └── e2e/
├── .github/workflows/
├── .maestro/
├── designdoc.md             # source engineering design document
├── package.json
└── pnpm-workspace.yaml
```

---

## Product pillars

| Pillar | Purpose | Implemented surfaces |
|---|---|---|
| **SCHILD** | Fraud and scam protection | scam pipeline, call reputation, browser shield, document vault, transaction intercept, weekly digest |
| **ANKER** | Health, medication and rhythm | medication OCR, reminders, escalation, refill detection, tasks, hydration, nutrition, vitals, telehealth, transport, MedMij/FHIR, medication catalog sync |
| **KRING** | Family and community connection | family messages, voice/video hellos, life stories, memory lane, grandchild app, community events, skill exchange |
| **BUURT** | Privacy-safe neighbourhood connector | PC4 profiles, interest tags, anonymous counts, local events, walk buddy matching, double opt-in, opt-out cleanup |
| **KOMPAS** | Cognitive safety and orientation | safe zone, fuzzy location, emergency profile, night mode, cognitive check-ins, wandering/wearables, driving events, bereavement support |
| **STEM** | Voice companion | Whisper adapter, intent classification, LLM reply, VAPI TTS (preferred over ElevenLabs), **Familiar Voice (family clone, gated)**, companion memory, crisis detection, **repeat-back confirmation for medication intake** |
| **WACHT** | Professional care portal | carer portal with **handover notes + MAR-light + offline queue**, care plans, visit logs, incidents, safeguarding reports, external care sync |

---

## Application surfaces

### iPhone suite preview

Open:

```text
apps/iphone-suite/index.html
```

Includes:

- iPhone-sized interface
- English default with Dutch switch
- high contrast and large text controls
- SCHILD, ANKER, KRING, BUURT, KOMPAS, STEM, WACHT flows
- local state for demo interactions
- PWA manifest and service worker

### Elder app

Location:

```text
apps/elder
```

Includes (v1.2.1 baseline + vNext patch):

- Expo app config (SDK 56, RN 0.86, React 19.2.7)
- EAS build profiles (`development`, `preview`, `production`)
- EAS fail-fast validation for required public Supabase env values
- Native permission configuration for camera, microphone, speech, location, calendar, notifications and background modes
- React Navigation native-stack
- Supabase Auth provider with `expo-secure-store` session persistence
- **Schema-driven `ScreenRenderer`** rendering 10 production screens from `packages/schema/src/screenSchema.ts`
- **Daily check-in card** (morning/midday/evening mood options)
- **"Are you OK?" fall modal** triggered by `pending_confirmations(fall_response)`
- **Medication confirmation card** for repeat-back flow
- **Scam coaching button** calling `fn-scam-coaching`
- **Familiar Voice toggle** on STEM + SETTINGS screens (gated by `familiar_voice_enabled`)
- SQLite offline queue with `expo-sqlite` (`apps/elder/src/services/sqliteOfflineQueue.ts`)
- Voice recorder service (`expo-av`)
- Floating voice button wired to real recording and `fn-voice-pipeline` submission
- Document camera capture service (`expo-camera`)
- Push-token registration service (`expo-notifications`)
- Crisis phrase detection (`apps/elder/src/services/crisis.ts`)
- Local notification helper with quiet-hours support (`apps/elder/src/services/notifications.ts`)
- PII-safe logger (`apps/elder/src/services/security.ts`)
- Network resilience + offline sync machine (`apps/elder/src/state/*`)

The elder live action path uses the authenticated profile ID derived from the Supabase session token. It no longer sends live calls with a hardcoded demo elder UUID.

### Family dashboard

Location:

```text
apps/family
```

Includes (v1.2.1 baseline + vNext patch):

- Next.js 16 app with TypeScript and ESLint
- Security headers + middleware permission mapping
- Dashboard routes for medications, alerts, BUURT, location, WACHT, **Familiar Voice**
- **Daily status pill** (`apps/family/src/components/DailyStatusPill.tsx`) showing green/amber/red with "why" + "what next"
- **Trust signal panel** (`apps/family/src/components/TrustSignalPanel.tsx`) showing device last-seen, permissions last known, recent `device_health_events`
- **Two-way action buttons**: send heart, voice message, gentle check-in, video call
- **Consent-scoped dashboard RPC client** (`apps/family/src/services/dashboard.ts`) using `family_dashboard_summary`
- Server-side dashboard bootstrap via `HAVEN_FAMILY_ELDER_ID` and `HAVEN_FAMILY_ACCESS_TOKEN`; if missing, the dashboard shows a setup-required state instead of fake care data
- **Real-time subscriptions** (`apps/family/src/services/realtime.ts`)
- **Familiar Voice recording page** with privacy disclosure + sample sentences + record/test actions (`apps/family/src/app/dashboard/familiar-voice/page.tsx`)

### Browser Shield

Location:

```text
apps/browser-shield
```

Includes:

- Manifest V3 extension scaffold
- local page pattern scan
- compact risk event submission to `fn-browser-shield`
- no raw page storage

### Admin console

Location:

```text
apps/admin-console/index.html
```

Covers:

- DPIA status
- vendor register
- release checks
- incident response readiness

### Carer portal (WACHT)

Location:

```text
apps/carer-portal/index.html
```

Covers (v1.2.1 baseline + vNext patch):

- Care visits and care plans overview
- Safeguarding state with meldcode step indicator
- **Handover notes workflow** — carer writes appetite/mood/mobility/concerns/administered-med; calls `fn-carer-handover-note`; selects family recipients
- **Offline-first capture** — localStorage-backed queue with online/offline buttons
- **MAR-light** — administration logging linked to `medication_reminders`

### Carer app

Location:

```text
apps/carer
```

Includes:

- Expo app config and EAS build profiles
- Supabase Auth provider with secure session storage
- Visit list and shift summary screens that call `fn-shift-summary` for configured `EXPO_PUBLIC_CARER_ELDER_IDS`
- Visit completion path that calls `fn-care-visit-log`
- Handover form calling `fn-carer-handover-note`
- Offline queue fallback for handover and visit-log writes
- Setup-required states when no signed-in session or assigned elder IDs are configured

### Family (Grandchild) app

Location:

```text
apps/grandchild
```

Covers:

- 6-tab dashboard: Overview, Medications, Alerts (Meldingen), Care (Zorg), Voice (Stem), Privacy
- Live medication adherence scores, shield score, wellbeing average from Supabase
- Add/manage elder medications with Supabase CRUD
- Privacy consent toggles persisted to `consent_records`
- Family messaging via `fn-grandchild-message-send`
- Familiar Voice recording for voice cloning (VAPI + ElevenLabs)
- Supabase Auth with session-based API access

---

## Backend overview

### Supabase migrations

```text
supabase/migrations/
├── 20260611000001_haven_v121_production_schema.sql            # v1.2.1 canonical schema
├── 20260611000002_storage_rpc_security.sql                    # Storage RLS + column revoke
├── 20260611000003_full_feature_domain_tables.sql             # WACHT + ANKER extension
├── 20260611000004_production_automation_realtime.sql           # Realtime + auth hook
├── 20260611000005_compliance_care_release_ops.sql             # Compliance, DPIA, vendor register
├── 20260611000006_integrations_observability_grandchild.sql   # Grandchild + integration tracking
├── 20260611000007_grandchild_unique_fix.sql                   # One-line uniqueness fix
├── 20260611000008_phase3_safety_community_legacy.sql          # Wearables, BUURT extensions
├── 20260611000009_hardening_idempotency_integration_status.sql # Idempotency + webhook receipts
├── 20260613000010_edge_authz_hardening.sql                    # Companion memory + audit log RLS
├── 20260613000011_voice_interactions_self_write.sql           # voice_elder_insert/update
├── 20260613000012_data_lifecycle_expansion.sql               # GDPR export expansion + retention
├── 20260614000000_vnext_wellrounded_patch.sql                 # vNext patch: 14 new tables + flags
├── 20260620000001_fix_export_elder_data_recorded_at.sql       # export_elder_data runtime fix
└── 20260620000002_end_to_end_runtime_fixes.sql                # grants, function drift, lint/runtime fixes
```

The migrations implement:

- domain tables
- enums
- indexes
- forced RLS
- storage buckets and policies
- PostGIS location RPCs
- pgvector memory retrieval
- auth custom claims
- realtime publication registration
- retention jobs
- compliance tables
- release checks
- observability tables
- idempotency and webhook receipts

### Edge Functions

There are currently **81 Edge Functions** in `supabase/functions`. They are classified into explicit trust zones per `docs/implementation/EDGE_FUNCTION_TRUST_BOUNDARY_MATRIX.md`:

- user-scoped functions (`verify_jwt = true`) use the caller's JWT and relationship/permission checks
- admin/service functions use explicit admin bearer or service execution paths
- vendor-facing functions use HMAC/shared-secret validation
- internal scheduled/background functions require `HAVEN_INTERNAL_KEY`

A complete catalog is available here:

```text
docs/api/EDGE_FUNCTION_CATALOG.md
```

OpenAPI surface:

```text
docs/api/openapi.yaml
```

Major function groups:

- Voice and companion memory
- Scam/browser/call reputation
- Medication OCR/reminders/refills
- Document analysis
- Location/safe zone/wandering/driving
- BUURT discovery/matching/events
- Family/grandchild messages
- Care plans/visit logs/incidents
- Consent/preferences/erasure/export
- Compliance/release/breach/vendor registry
- Observability/SLO/log drains
- External integrations: PSD2, MedMij/FHIR, care systems

---

## Security and privacy model

HAVEN follows a privacy-first model from the design document:

- Row-Level Security enabled and forced on user-data tables.
- Elder owns their data.
- Family access requires consent and per-feature permissions.
- Carer access requires active relationship and elder consent.
- Companion memory is elder-private.
- Document vault is elder-only.
- BUURT never exposes third-party elder identity before double opt-in.
- Precise location is only stored for active safe-zone events and is nulled after 24 hours.
- Family location view is fuzzed only.
- BSN is not stored, processed or transmitted.
- DigiD is deferred and not implemented as auth.
- Audit logs track sensitive changes.
- Right to erasure and data export are implemented.

Detailed docs:

```text
docs/release/PRIVACY_POLICY_EN.md
docs/release/PRIVACY_POLICY_NL.md
docs/release/PENTEST_SCOPE.md
docs/release/ACCESSIBILITY_AUDIT_PROTOCOL.md
```

---

## Testing

Run all current tests:

```bash
corepack pnpm test
```

Individual test groups:

```bash
corepack pnpm run validate:suite
corepack pnpm run test:edge
corepack pnpm run test:rls
corepack pnpm run test:e2e
```

What these cover:

- repository structure
- required files
- function inventory
- migration feature coverage
- feature matrix completeness
- screen schema constitution
- scam rule behavior
- Edge Function hardening patterns
- RLS policy presence
- storage policy presence
- iPhone suite smoke behavior

Device/E2E assets:

```text
.maestro/elder-medication-confirmation.yaml
.maestro/shield-alert-flow.yaml
tests/e2e/family-dashboard.spec.ts
playwright.config.ts
```

---

## Local development

Install runtime dependencies from the monorepo root:

```bash
corepack pnpm install --frozen-lockfile
```

Run validation:

```bash
corepack pnpm run validate:suite
```

Run lint coverage:

```bash
corepack pnpm run lint
```

Run typecheck coverage:

```bash
corepack pnpm run typecheck
```

This currently checks:
- shared packages
- Expo elder app
- Expo grandchild app

The Next.js family app gets its TypeScript validation through the production build step:

```bash
corepack pnpm run build:family
```

Preview the static app surfaces:

```bash
corepack pnpm run preview:iphone
corepack pnpm run preview:family
```

Build the Next.js family dashboard:

```bash
corepack pnpm run build:family
```

Run the combined quality gate locally:

```bash
corepack pnpm run quality:check
```

Run the root engineering orchestration locally:

```bash
corepack pnpm run verify:core
```

Optional browser E2E coverage:

```bash
corepack pnpm exec playwright install chromium
corepack pnpm run verify:browser
```

Optional local Supabase orchestration:

```bash
corepack pnpm run verify:supabase:local
```

Hosted Supabase smoke test, after staging/production secrets and test JWTs are available:

```bash
SUPABASE_URL=... \
SUPABASE_ANON_KEY=... \
HAVEN_INTERNAL_KEY=... \
HAVEN_TEST_ELDER_ID=... \
HAVEN_TEST_ELDER_JWT=... \
corepack pnpm run smoke:hosted
```

Run all tests:

```bash
corepack pnpm test
```

### Supabase local reset

A real local reset requires Supabase CLI and Docker.

Run:

```bash
./scripts/check-local-supabase.sh
```

That script executes:

```bash
supabase start
supabase db reset
supabase db lint --level warning
```

---

## Deployment

Deployment scripts:

```text
scripts/deploy/check-production-env.sh
scripts/deploy/deploy-supabase.sh
```

Required deployment variables:

- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_PROJECT_REF`
- `HAVEN_ENV`

Deploy Supabase:

```bash
./scripts/deploy/deploy-supabase.sh
```

The script:

1. checks the deployment environment
2. links the Supabase project
3. pushes migrations
4. deploys Edge Functions
5. runs tests

CI workflow:

```text
.github/workflows/production-checks.yml
```

---

## External integration status

External integrations are represented in code and tracked in `integration_connections`.

| Integration | Code support | Real-world gate |
|---|---|---|
| OpenAI Whisper | implemented | API key + DPA/SCC |
| OpenAI embeddings/LLM | implemented | API key + DPA/SCC |
| ElevenLabs TTS | implemented | API key + DPA/SCC |
| Expo Push | implemented | Expo token + store setup |
| Supabase Storage signed URLs | implemented + hosted smoke script | Supabase project + test JWT |
| Sentry/log drains | implemented | DSN/log-drain config |
| PSD2/Tink | implemented with HMAC webhook support and encrypted refresh-token storage | provider contract, sandbox, `TINK_TOKEN_ENCRYPTION_KEY` |
| MedMij/FHIR | implemented importer | accreditation and credentials |
| G-Standaard/Z-Index | implemented with legal-basis gate | AGB-code/formal agreement |
| ONS/Nedap/Careweb | implemented sync scaffolds | partner access |

---

## Compliance and launch gates

The repository contains tables and docs for:

- DPIA assessments
- vendor register
- breach incident log
- release checks
- privacy policies
- accessibility protocol
- pentest scope
- older-adult usability protocol
- safety copy review

Important files:

```text
docs/implementation/HARDENING_CLOSURE_REPORT.md
docs/implementation/PHASE_COVERAGE_AUDIT.md
docs/implementation/DESIGN_DOC_DIFF.md
docs/release/ACCESSIBILITY_AUDIT_PROTOCOL.md
docs/release/PENTEST_SCOPE.md
docs/release/ELDER_USABILITY_PROTOCOL.md
docs/release/COPY_REVIEW.md
```

Human and hosted-runtime gates still required before real production launch:

1. Hosted Supabase staging/production smoke test passes.
2. Production secrets/vendor credentials provisioned.
3. Physical iOS/Android validation completed.
4. DPO signs DPIA.
5. Vendor DPAs/SCCs completed.
6. External penetration test completed.
7. Older-adult usability testing completed.
8. App Store / Play Store submissions approved.

---

## Implementation audits

Core audit docs:

```text
docs/implementation/DEEP_DIVE_AUDIT.md                       # Original gap analysis (closed by GAP_CLOSURE_REPORT.md)
docs/implementation/HARDENING_CLOSURE_REPORT.md             # v1.2.1 P0 trust-boundary closure
docs/implementation/DESIGN_DOC_DIFF.md                      # Design-doc-to-build diff
docs/implementation/PHASE_COVERAGE_AUDIT.md                 # Phase-by-phase coverage
docs/implementation/FEATURE_IMPLEMENTATION_MATRIX.md        # 60+ feature matrix
docs/implementation/FEATURE_IMPLEMENTATION_MATRIX.json      # Machine-readable matrix
docs/implementation/EDGE_FUNCTION_TRUST_BOUNDARY_MATRIX.md  # Edge Function trust zones
docs/implementation/RESIDUAL_HARDENING_REPORT.md            # Human-only remaining gates
docs/implementation/RELEASE_CANDIDATE_SUMMARY.md            # Honest RC label
docs/implementation/PRIORITIZED_REMAINING_ISSUES.md        # P0/P1/P2 backlog
docs/implementation/NEXT_10_GITHUB_ISSUES.md               # Suggested labels
docs/implementation/SESSION_HANDOFF_CHANGELOG.md            # Session-by-session changelog
docs/implementation/GAP_CLOSURE_REPORT.md                   # Earlier scaffold→real gap closure
docs/implementation/VNEXT_IMPLEMENTATION_REPORT.md         # vNext acceptance criteria + honest gaps
```

The feature matrix currently tracks all major features from the design document + the vNext extensions and their implementation status.

---

## Architecture Overview

HAVEN is built as a monorepo with clear separation of concerns:

- **Frontend**: 3 Expo React Native apps (Elder, Carer, Family) + Next.js web dashboard
- **Backend**: Supabase (PostgreSQL + Auth + Realtime + Storage + Edge Functions)
- **Voice AI**: VAPI for real-time voice conversations (WebRTC + Whisper STT + GPT-4o-mini + ElevenLabs TTS)
- **Offline**: SQLite queue (Elder/Carer) with automatic sync on reconnection
- **CI/CD**: GitHub Actions with typecheck, lint, security gate, E2E tests, EAS builds

The three apps communicate through Supabase Realtime subscriptions — changes in one app are immediately visible in the others without polling.

---

## License

This repository currently uses the original repository license. Confirm licensing before commercial production use.
