import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../../apps/iphone-suite/index.html', import.meta.url), 'utf8');
const appJs = readFileSync(new URL('../../apps/iphone-suite/app.js', import.meta.url), 'utf8');
const combined = html + appJs;
for (const label of ['SCHILD', 'STEM', 'KOMPAS', 'WACHT', 'De Buurtverbinder']) {
  assert.ok(combined.includes(label), `${label} should be visible in the iPhone suite`);
}
assert.ok(combined.includes("toggleLang"), 'language switching should be implemented');
assert.ok(combined.includes("confirmMedication"), 'medication confirmation should be implemented');
assert.ok(combined.includes("scamSignal"), 'scam simulation should be implemented');
assert.ok(html.includes('src="app.js"'), 'app.js should be referenced as external script');
console.log('iphone-suite smoke test passed');
