import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildReport, writeReport } from '../scripts/render-report.mjs';
const scanPath = new URL('../examples/scan.json', import.meta.url);
const analysisPath = new URL('../examples/analysis.json', import.meta.url);
const raw = readFileSync(scanPath, 'utf8');
const analysis = () => JSON.parse(readFileSync(analysisPath, 'utf8'));
const payload = html => JSON.parse(html.match(/<script type="application\/json" id="report-data">([\s\S]*?)<\/script>/)[1]);

test('embedded and downloadable JSON preserve input exactly; reports are not overwritten', () => {
  const dir = mkdtempSync(join(tmpdir(), 'geiger-report-test-'));
  try {
    const out = join(dir, 'report.html');
    writeReport(scanPath, analysisPath, out);
    assert.equal(readFileSync(join(dir, 'scan.json'), 'utf8'), raw);
    assert.equal(payload(readFileSync(out, 'utf8')).rawJson, raw);
    assert.throws(() => writeReport(scanPath, analysisPath, out), /already exists/);
    writeFileSync(join(dir, 'scan.json'), '{}');
    assert.throws(() => writeReport(scanPath, analysisPath, join(dir, 'other.html')), /different scan/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('missing findings and broken source/action links cannot produce a report', () => {
  const a = analysis(); a.findings.pop();
  assert.throws(() => buildReport(raw, a), /Every scan finding/);
  const b = analysis(); b.actions[0].findingId = 'F99';
  assert.throws(() => buildReport(raw, b), /real finding/);
  const c = analysis(); c.findings[0].sourceId = 'R99';
  assert.throws(() => buildReport(raw, c), /Missing source/);
});

test('embedded data cannot close the script element and URLs must be non-executable', () => {
  const attack = '</script><img src=x onerror="globalThis.INJECTED=true">&';
  const scan = JSON.parse(raw); scan.findings[0].name = attack;
  const a = analysis(); a.headline = attack;
  const html = buildReport(JSON.stringify(scan), a);
  assert.ok(!html.includes(attack));
  assert.equal(payload(html).analysis.headline, attack);
  assert.equal(JSON.parse(payload(html).rawJson).findings[0].name, attack);
  a.sources[0].url = 'javascript:alert(1)';
  assert.throws(() => buildReport(raw, a), /http\(s\)/);
});

test('an empty scan needs no invented cards, actions or repositories', () => {
  const a = analysis(); a.findings = []; a.actions = []; a.sources = [];
  const scan = JSON.stringify({ meta: { schemaVersion: 1 }, findings: [], diagnostics: [] });
  assert.equal(payload(buildReport(scan, a)).analysis.findings.length, 0);
});
