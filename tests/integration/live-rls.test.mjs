import assert from 'node:assert/strict';

const required = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'HAVEN_TEST_ELDER_JWT', 'HAVEN_TEST_FAMILY_JWT', 'HAVEN_TEST_UNRELATED_JWT', 'HAVEN_TEST_ELDER_ID'];
const enabled = process.env.HAVEN_LIVE_RLS === '1';

if (!enabled) {
  console.log('live RLS tests skipped; set HAVEN_LIVE_RLS=1 with Supabase test JWTs to run');
  process.exit(0);
}

for (const name of required) assert.ok(process.env[name], `${name} is required`);

const url = process.env.SUPABASE_URL;
const anon = process.env.SUPABASE_ANON_KEY;
const elderId = process.env.HAVEN_TEST_ELDER_ID;

async function rest(jwt, path) {
  const response = await fetch(`${url}/rest/v1/${path}`, {
    headers: { apikey: anon, authorization: `Bearer ${jwt}` },
  });
  const text = await response.text();
  let body;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  return { status: response.status, body };
}

const elderMemory = await rest(process.env.HAVEN_TEST_ELDER_JWT, `companion_memory?elder_id=eq.${elderId}&select=id,elder_id`);
assert.ok([200, 206].includes(elderMemory.status), 'elder can query own companion memory');

const familyMemory = await rest(process.env.HAVEN_TEST_FAMILY_JWT, `companion_memory?elder_id=eq.${elderId}&select=id,elder_id`);
assert.ok([200, 206].includes(familyMemory.status), 'family query should not error');
assert.equal(Array.isArray(familyMemory.body) ? familyMemory.body.length : 0, 0, 'family must not see companion memory');

const unrelatedMeds = await rest(process.env.HAVEN_TEST_UNRELATED_JWT, `medications?elder_id=eq.${elderId}&select=id,elder_id`);
assert.ok([200, 206].includes(unrelatedMeds.status), 'unrelated query should not error');
assert.equal(Array.isArray(unrelatedMeds.body) ? unrelatedMeds.body.length : 0, 0, 'unrelated user must not see elder medications');

const familyLocation = await rest(process.env.HAVEN_TEST_FAMILY_JWT, `family_location_events?elder_id=eq.${elderId}&select=*`);
assert.ok([200, 206].includes(familyLocation.status), 'family can query fuzzed location view if consented');
assert.ok(!JSON.stringify(familyLocation.body).includes('location_precise'), 'family location view must not expose precise location');

console.log('live RLS tests passed');
