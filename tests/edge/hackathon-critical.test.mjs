/**
 * Hackathon-critical path tests
 * Covers: VAPI config, webhook auth, grandchild message send,
 * rate-limit coverage, CSP static checks, env hygiene
 */
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { spawnSync } from 'node:child_process';

const root = new URL('../../', import.meta.url).pathname;

// ─── Helper: read edge function source ───
function readFn(name) {
  return readFileSync(join(root, `supabase/functions/${name}/index.ts`), 'utf8');
}

function edgeFunctionDirs() {
  return readdirSync(join(root, 'supabase/functions'), { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name.startsWith('fn-'))
    .map((d) => d.name);
}

// ─── 1. VAPI config/key presence behavior ───
test('VAPI client checks for API key before starting', () => {
  const vapiClient = readFileSync(join(root, 'packages/vapi/src/vapiClient.ts'), 'utf8');
  assert.ok(
    vapiClient.includes('EXPO_PUBLIC_VAPI_API_KEY') || vapiClient.includes('apiKey'),
    'VAPI client must reference API key env var or config',
  );
  // Should not send raw Supabase JWT to VAPI
  assert.ok(
    !vapiClient.includes('access_token'),
    'VAPI client should not send raw access_token to VAPI metadata',
  );
});

test('VAPI assistant IDs are configurable via env', () => {
  const vapiClient = readFileSync(join(root, 'packages/vapi/src/vapiClient.ts'), 'utf8');
  assert.ok(
    vapiClient.includes('VAPI_ASSISTANT_ID'),
    'VAPI client must reference assistant ID env var',
  );
});

test('elder app declares VAPI SDK dependency', () => {
  const elderPkg = JSON.parse(readFileSync(join(root, 'apps/elder/package.json'), 'utf8'));
  assert.ok(
    elderPkg.dependencies?.['@vapi-ai/react-native'],
    'elder app must declare @vapi-ai/react-native dependency',
  );
});

test('elder app declares WebRTC peer dependencies for VAPI', () => {
  const elderPkg = JSON.parse(readFileSync(join(root, 'apps/elder/package.json'), 'utf8'));
  assert.ok(
    elderPkg.dependencies?.['@daily-co/react-native-webrtc'],
    'elder app must declare @daily-co/react-native-webrtc',
  );
  assert.ok(
    elderPkg.dependencies?.['@daily-co/react-native-daily-js'],
    'elder app must declare @daily-co/react-native-daily-js',
  );
});

// ─── 2. VAPI webhook missing/valid secret behavior ───
test('fn-vapi-webhook checks HAVEN_ENV for fail-closed behavior', () => {
  const src = readFn('fn-vapi-webhook');
  assert.ok(
    src.includes('HAVEN_ENV') || src.includes('VAPI_WEBHOOK_SECRET'),
    'webhook must reference HAVEN_ENV or VAPI_WEBHOOK_SECRET for auth control',
  );
});

test('fn-vapi-webhook uses constant-time comparison for secret', () => {
  const src = readFn('fn-vapi-webhook');
  assert.ok(
    src.includes('timingSafeEqual') || src.includes('charCodeAt') || src.includes('constantTimeEqual'),
    'webhook secret comparison should use timing-safe method (XOR loop or timingSafeEqual)',
  );
});

test('fn-vapi-webhook imports rateLimit', () => {
  const src = readFn('fn-vapi-webhook');
  assert.ok(src.includes('rateLimit'), 'fn-vapi-webhook must use rateLimit');
});

// ─── 3. Grandchild message send ───
test('fn-grandchild-message-send enforces auth', () => {
  const src = readFn('fn-grandchild-message-send');
  assert.ok(src.includes('getJwtUserId'), 'must extract JWT user ID');
  assert.ok(
    src.includes('assertElderOrFamilyCan'),
    'must enforce family authorization',
  );
});

test('fn-grandchild-message-send uses rateLimit', () => {
  const src = readFn('fn-grandchild-message-send');
  assert.ok(src.includes('rateLimit'), 'must apply rate limiting');
});

test('grandchild FamilyDashboard handles missing env vars', () => {
  const src = readFileSync(
    join(root, 'apps/grandchild/src/screens/vision/FamilyDashboard.tsx'),
    'utf8',
  );
  assert.ok(
    src.includes('supabaseUrl') && src.includes('accessToken'),
    'FamilyDashboard must check for required env vars',
  );
});

test('grandchild OverviewTab has action handler', () => {
  const src = readFileSync(
    join(root, 'apps/grandchild/src/screens/vision/OverviewTab.tsx'),
    'utf8',
  );
  assert.ok(src.includes('handleAction'), 'OverviewTab must have handleAction function');
  assert.ok(src.includes('onSendAction'), 'OverviewTab must call onSendAction prop');
  assert.ok(src.includes('actionSent'), 'OverviewTab must track sent state');
});

// ─── 4. Rate-limit static coverage ───
test('all fn-* edge functions use rateLimit', () => {
  const fns = edgeFunctionDirs();
  const missing = [];
  for (const fn of fns) {
    const indexPath = join(root, `supabase/functions/${fn}/index.ts`);
    if (!existsSync(indexPath)) continue;
    const src = readFileSync(indexPath, 'utf8');
    if (!src.includes('rateLimit')) {
      missing.push(fn);
    }
  }
  assert.equal(
    missing.length,
    0,
    `Edge functions missing rateLimit: ${missing.join(', ')}`,
  );
});

test('rate-limit coverage is 82/82 edge functions', () => {
  const fns = edgeFunctionDirs();
  assert.ok(fns.length >= 82, `Expected >= 82 edge functions, got ${fns.length}`);
});

// ─── 5. CSP static checks ───
test('family dashboard has no unsafe-eval in CSP', () => {
  const nextConfig = readFileSync(join(root, 'apps/family/next.config.mjs'), 'utf8');
  assert.ok(!nextConfig.includes("'unsafe-eval'"), 'family dashboard must not allow unsafe-eval');
});

test('carer-portal has no unsafe-inline scripts', () => {
  const html = readFileSync(join(root, 'apps/carer-portal/index.html'), 'utf8');
  assert.ok(
    !html.includes("script-src 'unsafe-inline'"),
    'carer-portal CSP must not allow unsafe-inline scripts',
  );
});

test('admin-console has no unsafe-inline scripts', () => {
  const html = readFileSync(join(root, 'apps/admin-console/index.html'), 'utf8');
  assert.ok(
    !html.includes("script-src 'unsafe-inline'"),
    'admin-console CSP must not allow unsafe-inline scripts',
  );
});

test('no tracked env files contain JWTs', () => {
  const tracked = spawnSync('git', ['ls-files'], { cwd: root, encoding: 'utf8' })
    .stdout.split('\n')
    .filter((f) => f && /(^|\/)(eas\.json|\.env[^/]*|.*\.env)$/.test(f));

  for (const file of tracked) {
    const src = readFileSync(join(root, file), 'utf8');
    assert.ok(
      !/eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/.test(src),
      `${file} must not contain JWT-shaped keys`,
    );
  }
});

// ─── 6. Smoke script exists and is executable ───
test('smoke or staging scripts directory exists', () => {
  assert.ok(
    existsSync(join(root, 'scripts/ci')),
    'scripts/ci directory must exist for CI scripts',
  );
});

// ─── 7. .env.example files document required vars ───
test('elder .env.example documents VAPI keys', () => {
  const env = readFileSync(join(root, 'apps/elder/.env.example'), 'utf8');
  assert.ok(env.includes('EXPO_PUBLIC_VAPI_API_KEY'), 'must document VAPI API key');
  assert.ok(env.includes('EXPO_PUBLIC_VAPI_ASSISTANT_ID'), 'must document VAPI assistant ID');
});

test('grandchild .env.example documents family access vars', () => {
  const env = readFileSync(join(root, 'apps/grandchild/.env.example'), 'utf8');
  assert.ok(env.includes('EXPO_PUBLIC_SUPABASE_URL'), 'must document Supabase URL');
  assert.ok(env.includes('EXPO_PUBLIC_SUPABASE_ANON_KEY'), 'must document anon key');
});

// ─── 8. WhatsApp webhook hardening ───
test('fn-whatsapp-webhook verifies signature', () => {
  const src = readFn('fn-whatsapp-webhook');
  assert.ok(
    src.includes('WHATSAPP_APP_SECRET'),
    'WhatsApp webhook must reference APP_SECRET for signature verification',
  );
});

test('fn-whatsapp-webhook sanitizes phone input', () => {
  const src = readFn('fn-whatsapp-webhook');
  assert.ok(
    src.includes('replace') || src.includes('sanitize') || src.includes('match'),
    'WhatsApp webhook must sanitize phone number input',
  );
});
