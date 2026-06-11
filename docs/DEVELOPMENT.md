# HAVEN Development Guide

## Prerequisites

Required for full local backend execution:

- Node.js 20+
- npm 10+
- Supabase CLI
- Docker

Optional for app development:

- pnpm 9+
- Expo CLI / EAS CLI
- Xcode for iOS simulator/device builds
- Android Studio for Android emulator/device builds

## Install

```bash
npm install
```

## Validate repository

```bash
npm run validate:suite
```

## Run tests

```bash
npm test
```

## Preview static surfaces

```bash
npm run preview:iphone
npm run preview:family
```

## Run local Supabase

```bash
./scripts/check-local-supabase.sh
```

## Elder app

```bash
cd apps/elder
npm install
npm run start
```

## Family app

```bash
cd apps/family
npm install
npm run dev
```

## Adding a new feature

1. Add or update migration.
2. Add Edge Function if needed.
3. Add contract/types.
4. Add app surface or schema entry.
5. Add tests.
6. Update feature matrix.
7. Run `npm test`.

## Definition of done

- Feature is represented in `FEATURE_IMPLEMENTATION_MATRIX.json`.
- Data access is RLS/consent safe.
- Edge Function validates input.
- Sensitive data is not logged.
- English and Dutch copy are present where user-facing.
- Tests pass.
