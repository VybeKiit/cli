#!/usr/bin/env node
/**
 * safety-scan.mjs — the safety check that runs before you go live.
 *
 * It reads your project (never sends it anywhere), looks for the leaks in safety-catalog.mjs,
 * and writes one report you can actually understand, in your language. Every finding points at
 * the exact file and line, so you can click it open and see for yourself that it is real.
 *
 * This is a plain, readable script on purpose. You do not have to trust an agent that it checked;
 * you can read exactly what it checks, right here. The catalog (what counts as a leak) and this
 * scanner are the same in every vybekiit project. The one part that changes per stack lives in
 * safety-profile.mjs next to this file: it says how your kind of app ships code to people.
 *
 * Usage (from your project root):
 *   node scripts/safety-scan.mjs                 # scan, print a plain summary
 *   node scripts/safety-scan.mjs --html          # also write an HTML report and open it
 *   node scripts/safety-scan.mjs --lang he       # report in Hebrew (default: en)
 *   node scripts/safety-scan.mjs --root <dir>    # scan a different folder
 *   node scripts/safety-scan.mjs --report-only   # never exit non-zero (for a soft check)
 *
 * Exit code is non-zero when something critical is unresolved, so the online checker can gate on it.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join, relative, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { CASES, LEAK_PATHS, LIGHT, SECRET_FAMILIES, secretFinding } from './safety-catalog.mjs';
import { PROFILE } from './safety-profile.mjs';

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};

const templateRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const root = resolve(opt('root', templateRoot));
const lang = opt('lang', 'en') === 'he' ? 'he' : 'en';
const pick = (loc) => (loc && typeof loc === 'object' ? (loc[lang] ?? loc.en) : loc);
const say = (en, he) => (lang === 'he' ? he : en);

// Folders and files that are noise, never a leak, or this scan's own code.
const SKIP_DIRS = new Set([
  'node_modules',
  '.git',
  '.next',
  '.turbo',
  '.vercel',
  'dist',
  'out',
  'build',
  '.output', // WXT extension build output
  '.wxt', // WXT generated types
  '.expo', // Expo cache
  '.vite', // Vite cache
  'coverage',
  'playwright-report',
  'test-results',
  '.cache',
  '.vscode',
  '.idea',
]);
const SCAN_EXT = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.json',
  '.yml',
  '.yaml',
  '.astro',
  '.vue',
  '.svelte',
  '.html',
]);
const isEnvFile = (name) => /^\.env(\.|$)/.test(name);
const isExampleEnv = (name) => /\.(example|sample|template)$/.test(name);
const isOwnScript = (name) => name.startsWith('safety-');
const isConfigFile = (name) => /\.config\.[cm]?[jt]s$/.test(name);

/**
 * A line whose secret is visible to your visitors. Per stack (see safety-profile.mjs):
 * an env name starting with the public prefix is shipped on purpose, and on stacks that ship
 * their whole bundle (a single-page app, a mobile app, an extension) any key written into the
 * code travels to everyone. A server ships nothing to a visitor, so its profile has no prefix.
 */
const isPublicName = (line) => (PROFILE.publicPrefix ? PROFILE.publicPrefix.test(line) : false);

/** Files git already tracks (so a committed .env is a real leak, an untracked one is not). */
const trackedFiles = (() => {
  try {
    const out = execFileSync('git', ['ls-files'], {
      cwd: root,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return new Set(out.split('\n').filter(Boolean));
  } catch {
    return new Set();
  }
})();
const isTracked = (abs) => trackedFiles.has(relative(root, abs));

/** Walk the project, yielding readable text files worth scanning. */
function* files(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (
      entry.name.startsWith('.') &&
      !isEnvFile(entry.name) &&
      entry.isDirectory() &&
      SKIP_DIRS.has(entry.name)
    )
      continue;
    const abs = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) yield* files(abs);
      continue;
    }
    if (isOwnScript(entry.name)) continue;
    const ext = entry.name.includes('.') ? entry.name.slice(entry.name.lastIndexOf('.')) : '';
    if (isEnvFile(entry.name) || SCAN_EXT.has(ext)) yield abs;
  }
}

const redact = (value) => `${value.slice(0, 6)}…REDACTED`;

const findings = [];
const seen = new Set();
const claimedSecretLines = new Set(); // a specific family wins; the catch-all skips its line
const add = (finding) => {
  const key = `${finding.id}:${finding.proof?.file ?? ''}:${finding.proof?.line ?? ''}`;
  if (seen.has(key)) return;
  seen.add(key);
  findings.push(finding);
};

// ---- Rung 1: secrets, across leak paths -------------------------------------------------
for (const abs of files(root)) {
  const rel = relative(root, abs);
  const name = basename(abs);
  if (isEnvFile(name) && isExampleEnv(name)) continue; // placeholders, not real keys
  let text;
  try {
    text = readFileSync(abs, 'utf8');
  } catch {
    continue;
  }
  if (text.length > 2_000_000) continue; // skip huge generated blobs
  const lines = text.split('\n');
  for (const family of SECRET_FAMILIES) {
    const re = new RegExp(
      family.re,
      family.re.flags.includes('g') ? family.re.flags : `${family.re.flags}g`,
    );
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      re.lastIndex = 0;
      const match = re.exec(line);
      if (!match) continue;

      const posKey = `${rel}:${i + 1}`;
      if (family.id === 'named-secret' && claimedSecretLines.has(posKey)) continue; // a specific family already owns this line

      const paths = [];
      if (isEnvFile(name)) {
        if (isTracked(abs)) paths.push('git'); // a key committed inside an env file
        if (isPublicName(line)) paths.push('public'); // a real secret behind a public name gets baked into the client bundle
      } else {
        paths.push('code'); // a key sitting literally in a source file
        const shipsToClient =
          isPublicName(line) || (PROFILE.everythingShips && !isConfigFile(name));
        if (shipsToClient) paths.push('public'); // this stack ships its source to the visitor, or the name is public-prefixed
      }
      if (/console\.(log|debug|info|warn|error)/.test(line)) paths.push('logs');
      if (paths.length === 0) continue; // untracked .env with a private name is the right place, not a leak
      if (family.id !== 'named-secret') claimedSecretLines.add(posKey);

      const primary = ['public', 'git', 'code'].find((p) => paths.includes(p)) ?? 'code';
      const snippet = line.replace(match[0], redact(match[0])).trim().slice(0, 200);
      const finding = secretFinding(family, primary, {
        file: rel,
        line: i + 1,
        abs,
        snippet,
      });
      finding.leakPaths = paths;
      add(finding);
    }
  }
}

// ---- Rung 2 & 5: the config and code cases the scan checks today ------------------------
const caseById = Object.fromEntries(CASES.map((c) => [c.id, c]));
const emitCase = (id, proof) => {
  const c = caseById[id];
  if (!c) return;
  add({ ...c, proof });
};

const firstMatch = (rel, re) => {
  const abs = join(root, rel);
  if (!existsSync(abs)) return null;
  const lines = readFileSync(abs, 'utf8').split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (re.test(lines[i]))
      return { file: rel, line: i + 1, abs, snippet: lines[i].trim().slice(0, 200) };
  }
  return null;
};

// Source maps left public. Which config file and switch to look at is per stack (safety-profile.mjs).
for (const { file, re } of PROFILE.sourcemapConfigs) {
  const hit = firstMatch(file, re);
  if (hit) {
    emitCase('config.sourcemaps-public', hit);
    break;
  }
}

// A real .env committed into history.
for (const abs of files(root)) {
  const name = basename(abs);
  if (isEnvFile(name) && !isExampleEnv(name) && isTracked(abs)) {
    emitCase('config.env-committed', { file: relative(root, abs), line: 1, abs, snippet: '' });
    break;
  }
}

// Abuse protection switched off.
const secOff = firstMatch('.env', /SECURITY_(RATE_LIMIT|ORIGIN_LOCK)\s*=\s*["']?off/i);
if (secOff) emitCase('config.security-off', secOff);

// A couple of risky-code patterns.
// Skip the vetted, mirrored UI folders listed in the profile (kit primitives and upstream copies,
// Biome-disabled). Rung 5 focuses on the buyer's own screens and logic, where a mistake is theirs.
// The secret check above still scans everything, everywhere — only these deeper checks narrow.
const isSkipped = (a) => PROFILE.skipPaths.some((p) => a.includes(p));
const walkSource = () =>
  [...files(root)].filter((a) => /\.(t|j)sx?$/.test(a) && !a.includes('.test.') && !isSkipped(a));
for (const abs of walkSource()) {
  const rel = relative(root, abs);
  const lines = readFileSync(abs, 'utf8').split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const proof = { file: rel, line: i + 1, abs, snippet: line.trim().slice(0, 200) };
    if (
      /dangerouslySetInnerHTML\s*=\s*\{\{\s*__html:\s*(?!['"`])/.test(line) &&
      !/JSON\.stringify/.test(line)
    ) {
      emitCase('sast.dangerous-html', proof); // raw HTML from a variable, not a constant or JSON-LD
    }
    if (/\beval\s*\(|\bnew Function\s*\(/.test(line)) emitCase('sast.eval', proof);
    if (/\$executeRaw|\$queryRaw`[^`]*\$\{/.test(line)) emitCase('sast.raw-sql', proof);
  }
}

// ---- Report ----------------------------------------------------------------------------
findings.sort((a, b) => a.rung - b.rung || a.severity.localeCompare(b.severity));
const reds = findings.filter((f) => LIGHT[f.severity] === 'red');
const ambers = findings.filter((f) => LIGHT[f.severity] === 'amber');
const kitWins = findings.filter((f) => f.kitPreventable).length;

const summary = {
  scannedRoot: root,
  stack: PROFILE.stack,
  lang,
  counts: {
    total: findings.length,
    red: reds.length,
    amber: ambers.length,
    kitPreventable: kitWins,
  },
  findings: findings.map((f) => ({
    id: f.id,
    rung: f.rung,
    severity: f.severity,
    leakPaths: f.leakPaths ?? [],
    proof: f.proof ? { file: f.proof.file, line: f.proof.line } : null,
    title: pick(f.plain.title),
  })),
};

const jsonPath = join(tmpdir(), 'vybekiit-safety-findings.json');
writeFileSync(jsonPath, JSON.stringify(summary, null, 2));

// Plain console summary (works with no browser).
const label = { critical: 'FIX NOW', high: 'FIX NOW', medium: 'soon', low: 'soon' };
if (findings.length === 0) {
  console.log('✅ Nothing to fix. Every check passed.');
} else {
  console.log(`🔴 ${reds.length} to fix before go-live   🟡 ${ambers.length} worth doing soon\n`);
  for (const f of findings) {
    const where = f.proof ? `  (${f.proof.file}:${f.proof.line})` : '';
    console.log(`  [${label[f.severity]}] ${pick(f.plain.title)}${where}`);
  }
  console.log(`\nDetails: ${jsonPath}`);
}

if (flag('html')) {
  const htmlPath = join(tmpdir(), 'vybekiit-safety-report.html');
  writeFileSync(htmlPath, renderHtml());
  console.log(`Report: ${htmlPath}`);
  try {
    execFileSync(process.platform === 'darwin' ? 'open' : 'xdg-open', [htmlPath], {
      stdio: 'ignore',
    });
  } catch {
    /* headless is fine; the path is printed above */
  }
}

const criticalUnresolved = reds.length > 0;
process.exit(criticalUnresolved && !flag('report-only') ? 1 : 0);

// ---- HTML rendering (self-contained, CDN-only, in the reader's language) ---------------
function esc(s) {
  return String(s).replace(
    /[&<>"]/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c],
  );
}

function leakChecklist(finding) {
  const display = [
    ...new Set([...(finding.leakPaths ?? []), 'code', 'public', 'apiReply', 'logs']),
  ].slice(0, 4);
  return display
    .map((p) => {
      const on = (finding.leakPaths ?? []).includes(p);
      const mark = on ? '✗' : '✓';
      const cls = on ? 'text-rose-500 font-bold' : 'text-emerald-500 font-bold';
      const vcls = on ? 'text-rose-500' : 'text-emerald-600';
      const v = on ? say('Yes', 'כן') : say('No', 'לא');
      return `<li class="flex items-center gap-2"><span class="${cls}">${mark}</span><span>${esc(pick(LEAK_PATHS[p].label))}</span><span class="${vcls} font-semibold ms-auto">${v}</span></li>`;
    })
    .join('');
}

function proofBlock(finding) {
  if (!finding.proof) return '';
  const { abs, line, file, snippet } = finding.proof;
  const cursor = `cursor://file//${abs}:${line}`;
  const vscode = `vscode://file//${abs}:${line}`;
  const cursorLogo = 'https://cdn.simpleicons.org/cursor/white';
  const vscodeLogo = 'https://api.iconify.design/logos:visual-studio-code.svg';
  const t = {
    en: {
      label: 'Here is exactly where we found it',
      c: 'Open in Cursor',
      v: 'Open in VS Code',
      hint: 'Opens the exact line, so you can see for yourself it is real.',
    },
    he: {
      label: 'הנה בדיוק איפה מצאנו את זה',
      c: 'פתח ב-Cursor',
      v: 'פתח ב-VS Code',
      hint: 'נפתח בדיוק בשורה, כדי שתוכל לראות בעצמך שזה אמיתי.',
    },
  }[lang];
  return `<div>
    <div class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">${t.label}</div>
    <pre dir="ltr" class="text-[11px] leading-relaxed bg-slate-900 text-slate-100 rounded-lg p-3 overflow-x-auto"><a href="${esc(cursor)}" class="text-sky-300 underline decoration-dotted hover:decoration-solid">${esc(file)}:${line}</a>
${esc(snippet)}</pre>
    <div class="flex flex-wrap items-center gap-2 mt-2">
      <a class="editorbtn" href="${esc(cursor)}"><img src="${cursorLogo}" alt="" width="15" height="15" onerror="this.style.display='none'"> ${t.c}</a>
      <a class="editorbtn" href="${esc(vscode)}"><img src="${vscodeLogo}" alt="" width="15" height="15" onerror="this.style.display='none'"> ${t.v}</a>
      <span class="text-xs text-slate-400">${t.hint}</span>
    </div>
  </div>`;
}

function card(finding) {
  const red = LIGHT[finding.severity] === 'red';
  const tone = red ? 'rose' : 'amber';
  const dot = red ? '🔴' : '🟡';
  const urgency = red
    ? say('Fix this before you go live', 'לתקן לפני העלייה לאוויר')
    : say('Worth doing soon', 'שווה לתקן בקרוב');
  const t = {
    en: {
      what: 'What could happen',
      where: 'Where we looked for it',
      fix: 'The one fix',
      extra: 'Extra safety (recommended)',
    },
    he: {
      what: 'מה יכול לקרות',
      where: 'איפה חיפשנו אותו',
      fix: 'התיקון האחד',
      extra: 'בטיחות נוספת (מומלץ)',
    },
  }[lang];
  const tip = finding.tooltip
    ? `<span class="tip" data-tip="${esc(pick(finding.tooltip))}">i</span>`
    : '';
  const checklist =
    finding.rung === 1
      ? `<div><div class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">${t.where}</div><ul class="text-sm space-y-1">${leakChecklist(finding)}</ul></div>`
      : '';
  const defense = finding.remediation?.defenseInDepth
    ? `<div class="rounded-lg bg-white/70 border border-${tone}-200 p-3"><div class="text-xs font-semibold text-${tone}-600 uppercase tracking-wide">🛡️ ${t.extra}</div><p class="text-sm text-slate-600 mt-1">${esc(pick(finding.remediation.defenseInDepth))}</p></div>`
    : '';
  return `<div class="card border-${tone}-500 rounded-xl bg-${tone}-50/60 p-5 space-y-4">
    <div class="text-xs font-bold uppercase tracking-wide text-${tone}-600 flex items-center gap-1.5">${dot} <span>${urgency}</span></div>
    <div class="flex items-center gap-2"><span class="font-bold text-lg">${esc(pick(finding.plain.title))}</span>${tip}</div>
    <p class="text-sm text-slate-600">${esc(pick(finding.plain.what))}</p>
    ${proofBlock(finding)}
    ${checklist}
    <div><div class="text-xs font-semibold text-slate-500 uppercase tracking-wide">${t.fix}</div><p class="text-sm text-slate-600">${esc(pick(finding.plain.fix))}</p></div>
    ${defense}
  </div>`;
}

function renderHtml() {
  const dir = lang === 'he' ? 'rtl' : 'ltr';
  const t = {
    en: {
      title: 'Is my app safe to go live?',
      red: `${reds.length} thing${reds.length === 1 ? '' : 's'} to fix before you go live`,
      amber: `${ambers.length} thing${ambers.length === 1 ? '' : 's'} worth doing soon`,
      green: 'Everything else looks safe',
      clean: 'Every check passed. Nothing to fix.',
    },
    he: {
      title: 'האם האפליקציה שלי בטוחה לעלייה לאוויר?',
      red: `${reds.length} לתקן לפני שאתה עולה לאוויר`,
      amber: `${ambers.length} שווה לתקן בקרוב`,
      green: 'כל השאר נראה בטוח',
      clean: 'כל הבדיקות עברו. אין מה לתקן.',
    },
  }[lang];
  const headline =
    findings.length === 0
      ? `<div class="flex items-center gap-3 text-lg font-bold text-emerald-600"><span class="text-2xl">🟢</span><span>${t.clean}</span></div>`
      : `<div class="space-y-2">
        ${reds.length ? `<div class="flex items-center gap-3 text-lg font-bold text-rose-600"><span class="text-2xl">🔴</span><span>${t.red}</span></div>` : ''}
        ${ambers.length ? `<div class="flex items-center gap-3 text-base font-semibold text-amber-600"><span class="text-xl">🟡</span><span>${t.amber}</span></div>` : ''}
        <div class="flex items-center gap-3 text-base font-semibold text-emerald-600"><span class="text-xl">🟢</span><span>${t.green}</span></div>
      </div>`;
  return `<!doctype html>
<html lang="${lang}" dir="${dir}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(t.title)}</title>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Heebo:wght@400;500;700;800&display=swap" rel="stylesheet">
<style>
  body { font-family: ${lang === 'he' ? "'Heebo'" : "'Inter'"}, system-ui, sans-serif; }
  .card { border-inline-start-width: 5px; }
  .tip { position:relative; display:inline-flex; align-items:center; justify-content:center; width:1.05rem; height:1.05rem; border-radius:9999px; background:#94a3b8; color:#0f172a; font-size:.7rem; font-weight:800; cursor:help; }
  .tip:hover::after { content: attr(data-tip); position:absolute; bottom:150%; inset-inline-start:0; width:17rem; max-width:72vw; background:#0f172a; color:#f1f5f9; font-weight:400; font-size:.75rem; line-height:1.35; padding:.55rem .7rem; border-radius:.55rem; z-index:40; box-shadow:0 8px 28px rgba(0,0,0,.3); }
  .editorbtn { display:inline-flex; align-items:center; gap:.3rem; padding:.25rem .6rem; border-radius:.4rem; background:#1e293b; color:#f1f5f9; font-size:.72rem; font-weight:600; text-decoration:none; }
  .editorbtn:hover { background:#334155; }
</style>
</head>
<body class="bg-slate-100 text-slate-800 min-h-screen">
  <div class="max-w-3xl mx-auto px-5 py-10 space-y-7">
    <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight">${esc(t.title)}</h1>
    ${headline}
    ${findings.map(card).join('\n')}
    <p class="text-center text-xs text-slate-400 pt-4">Ran on your machine. Nothing left your computer.</p>
  </div>
</body>
</html>`;
}
