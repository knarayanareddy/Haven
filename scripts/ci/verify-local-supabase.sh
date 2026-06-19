#!/usr/bin/env bash
set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$DIR"
if [ "${CI:-}" != "true" ]; then
  export PATH="$DIR/bin:$PATH"
fi
./scripts/check-local-supabase.sh
HAVEN_LIVE_RLS=1 corepack pnpm run test:integration:live
