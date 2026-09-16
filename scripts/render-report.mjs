#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync, existsSync, realpathSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const templatePath = new URL('../assets/report-template.html', import.meta.url);
const brandAssets = {
  __ULTRA_INTER_REGULAR__: 'inter-400.woff2',
  __ULTRA_INTER_BOLD__: 'inter-700.woff2',
  __ULTRA_MONO__: 'jetbrains-mono-400.woff2',
  __ULTRA_ICON__: 'ultra-icon.png',
};
const priorities = new Set(['review', 'confirm', 'clear']);
const statuses = new Set(['Verified source link', 'Possible match', 'No public repo identified', 'Lookup unavailable']);
const requireValue = (ok, message) => { if (!ok) throw new Error(message); };
const text = (value, label) => requireValue(typeof value === 'string' && value.trim().length > 0, `${label} must be nonempty text`);

export function buildReport(rawJson, analysis) {
  const scan = JSON.parse(rawJson);
  requireValue(scan.meta?.schemaVersion === 1 && Array.isArray(scan.findings), 'Expected Geiger schema-v1 JSON');
  requireValue(scan.diagnostics === undefined || Array.isArray(scan.diagnostics), 'diagnostics must be an array');
  for (const key of ['headline', 'summary', 'context', 'coverage', 'scope']) text(analysis[key], key);
  for (const key of ['actions', 'findings', 'sources']) requireValue(Array.isArray(analysis[key]), `${key} must be an array`);
  requireValue(analysis.actions.length <= 3, 'Use at most three next steps');
  requireValue(analysis.synthetic === undefined || typeof analysis.synthetic === 'boolean', 'synthetic must be boolean');
  requireValue(analysis.rawNote === undefined || typeof analysis.rawNote === 'string', 'rawNote must be text');
  const sources = new Set();
  for (const s of analysis.sources) {
    requireValue(/^R\d{2,}$/.test(s.id) && !sources.has(s.id), 'Source IDs must be unique R01-style identifiers');
    sources.add(s.id);
    for (const k of ['name', 'basis']) text(s[k], `Source ${s.id} ${k}`);
    requireValue(statuses.has(s.status), `Invalid source status for ${s.id}`);
    if (s.url) {
      const u = new URL(s.url);
      requireValue(['http:', 'https:'].includes(u.protocol) && !u.username && !u.password, 'Source links must be http(s) URLs without credentials');
    }
  }
  const expected = new Set(scan.findings.map((_, i) => `F${String(i + 1).padStart(2, '0')}`));
  const found = new Set();
  for (const f of analysis.findings) {
    requireValue(expected.has(f.id) && !found.has(f.id), 'Finding IDs must match scan order exactly once');
    found.add(f.id);
    requireValue(priorities.has(f.priority), `Invalid priority for ${f.id}`);
    requireValue(sources.has(f.sourceId), `Missing source for ${f.id}`);
    for (const k of ['description', 'access', 'why', 'sourceExplanation', 'nextStep']) text(f[k], `${f.id} ${k}`);
  }
  requireValue(found.size === expected.size, 'Every scan finding must have a report card');
  for (const a of analysis.actions) {
    text(a.title, 'Action title'); text(a.body, 'Action body');
    requireValue(found.has(a.findingId), 'Action must link to a real finding');
  }
  for (const id of sources) requireValue(analysis.findings.some(f => f.sourceId === id), `Unused source ${id}`);
  const payload = JSON.stringify({ analysis, rawJson })
    .replace(/</g, '\\u003c').replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
  let template = readFileSync(templatePath, 'utf8');
  for (const [token, filename] of Object.entries(brandAssets)) {
    template = template.replace(token, readFileSync(new URL('../assets/brand/' + filename, import.meta.url)).toString('base64'));
  }
  // Retain required font notices inside portable reports as well as in the skill package.
  const licenses = ['Inter-LICENSE.txt', 'JetBrainsMono-OFL.txt'].map(name =>
    readFileSync(new URL('../assets/brand/' + name, import.meta.url), 'utf8')).join('\n\n');
  template = template.replace('</head>', '<!-- Bundled font licenses\n' + licenses.replace(/--/g, '—') + '\n--></head>');
  requireValue(template.split('__GEIGER_REPORT_DATA__').length === 2, 'Template must contain one data placeholder');
  return template.replace('__GEIGER_REPORT_DATA__', () => payload);
}

export function writeReport(scanPath, analysisPath, outputPath) {
  const rawJson = readFileSync(scanPath, 'utf8');
  const html = buildReport(rawJson, JSON.parse(readFileSync(analysisPath, 'utf8')));
  const out = resolve(outputPath), jsonOut = join(dirname(out), 'scan.json');
  requireValue(out !== jsonOut, 'HTML output must not be scan.json');
  requireValue(!existsSync(out), 'Output already exists; choose a fresh report directory');
  if (existsSync(jsonOut)) requireValue(readFileSync(jsonOut, 'utf8') === rawJson, 'Output directory contains a different scan.json');
  mkdirSync(dirname(out), { recursive: true });
  if (!existsSync(jsonOut)) writeFileSync(jsonOut, rawJson, { flag: 'wx', mode: 0o600 });
  writeFileSync(out, html, { flag: 'wx', mode: 0o600 });
  return { html: out, json: jsonOut };
}

if (process.argv[1] && existsSync(process.argv[1]) && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) {
  try {
    requireValue(process.argv.length === 5, 'Usage: node render-report.mjs <scan.json> <analysis.json> <output.html>');
    console.log(JSON.stringify(writeReport(...process.argv.slice(2)), null, 2));
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
