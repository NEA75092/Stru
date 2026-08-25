#!/usr/bin/env node
/* preuve-liquide.mjs — remplit tout seul la table de preuve des lots Liquide.
 *
 *   node structura-v2/handoff-septembre/tools/preuve-liquide.mjs --lot 1
 *   node structura-v2/handoff-septembre/tools/preuve-liquide.mjs --lot 2
 *
 * Lancer depuis la RACINE DU DÉPÔT. Sort 0 si tout passe, 1 sinon.
 * Ce script ne corrige rien : il constate et il nomme le fichier fautif.
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join } from 'node:path';

const LOT = Number((process.argv[process.argv.indexOf('--lot') + 1]) || 0);
if (LOT !== 1 && LOT !== 2) {
  console.error('usage: preuve-liquide.mjs --lot 1|2');
  process.exit(2);
}

const SRC = 'structura-v2/src';
const TOKENS = join(SRC, 'design-tokens.css');
const INDEX = 'structura-v2/index.html';

const marcher = (dir, out = []) => {
  if (!existsSync(dir)) return out;
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    statSync(p).isDirectory() ? marcher(p, out) : out.push(p);
  }
  return out;
};
const lire = (p) => (existsSync(p) ? readFileSync(p, 'utf8') : '');
const sh = (c) => { try { return execSync(c, { encoding: 'utf8' }).trim(); } catch { return ''; } };

const fichiers = marcher(SRC).filter((f) => /\.(css|js)$/.test(f));
const resultats = [];
const verifier = (nom, attendu, obtenu, detail = '') =>
  resultats.push({ nom, attendu: String(attendu), obtenu: String(obtenu), ok: String(attendu) === String(obtenu), detail });

/* — les fichiers touchés — */
const AUTORISES = LOT === 1
  ? [TOKENS, INDEX]
  : [join(SRC, 'shell.css'), INDEX];
const touches = sh('git diff --name-only HEAD').split('\n').filter(Boolean);
const horsPerimetre = touches.filter((f) => !AUTORISES.includes(f));
verifier('fichiers hors périmètre', 0, horsPerimetre.length, horsPerimetre.join(', '));

/* — tokens de la passe 8 : plus aucune occurrence — */
const MORTS = ['--chaux', '--mer', '--olive', '--ocre', '--terracotta', '--lumiere', '--grain', '--blur-enter'];
for (const t of MORTS) {
  const hits = fichiers.filter((f) => lire(f).includes(t));
  verifier(`occurrences de \${t}`, 0, hits.length, hits.join(', '));
}

/* — la couche d'alias ne contient aucun littéral — */
const src = lire(TOKENS);
const debut = src.indexOf('couche 2');
if (debut > -1) {
  const couche2 = src.slice(debut);
  const litteraux = couche2.match(/#[0-9a-f]{3,8}\b|\brgba?\(|\boklch\(/gi) || [];
  // #fff dans un color-mix de nuit est toléré, il est nommé dans la spec.
  const durs = litteraux.filter((l) => !/^#fff/i.test(l));
  verifier('littéraux dans la couche 2', 0, durs.length, durs.join(' '));
} else {
  verifier('couche 2 repérable', 'oui', 'non', 'le commentaire « couche 2 » est absent de design-tokens.css');
}

/* — aucune ombre, sauf la surface flottante — */
const ombres = [];
for (const f of fichiers) {
  lire(f).split('\n').forEach((l, i) => {
    if (/box-shadow/.test(l) && !/--shadow-float|none/.test(l)) ombres.push(`\${f}:\${i + 1}`);
  });
}
verifier('box-shadow hors --shadow-float', 0, ombres.length, ombres.join(', '));

/* — rayons littéraux — */
const rayons = [];
for (const f of fichiers) {
  lire(f).split('\n').forEach((l, i) => {
    const m = l.match(/border-radius:\s*([^;]+)/);
    if (m && !/var\(--r-|var\(--radius-|^\s*0(px)?\s*$|50%|999px|inherit/.test(m[1])) rayons.push(`\${f}:\${i + 1} → \${m[1].trim()}`);
  });
}
verifier('border-radius littéral', 0, rayons.length, rayons.join(' | '));

/* — polices mortes — */
for (const p of ['Newsreader', 'IBM Plex']) {
  const hits = [...fichiers, INDEX].filter((f) => lire(f).includes(p));
  verifier(`occurrences de \${p}`, 0, hits.length, hits.join(', '));
}

/* — le thème garde son nom — */
const nuit = [...fichiers, INDEX].filter((f) => lire(f).includes('data-theme="nuit"'));
verifier('data-theme="nuit"', 0, nuit.length, nuit.join(', '));

/* — couleurs écrites en dur dans les écrans : compté, pas jugé — */
const enDur = {};
for (const f of fichiers.filter((f) => f !== TOKENS && f.endsWith('.css'))) {
  const n = (lire(f).match(/:\s*#[0-9a-f]{3,8}\b|:\s*rgba?\(/gi) || []).length;
  if (n) enDur[f] = n;
}
const totalDur = Object.values(enDur).reduce((a, b) => a + b, 0);

/* — lot 02 : la coquille — */
if (LOT === 2) {
  const shell = lire(join(SRC, 'shell.css'));
  verifier('.nappe à 640px', true, /\.nappe\b[^}]*height:\s*640px/s.test(shell));
  verifier('.rail à 236px', true, /\.rail\b[^}]*width:\s*236px/s.test(shell));
  verifier('prefers-reduced-motion présent', true, shell.includes('prefers-reduced-motion'));
  verifier('les huit couches de nappe', 8, (shell.match(/\.nappe-[a-z-]+\s*\{/g) || []).length + (/\.nappe-eau/.test(shell) ? 0 : 0));
  const diffIcones = sh(`git diff -U0 HEAD -- \${INDEX} | grep -E '^[+-].*\\bd="' | grep -v '^[+-][+-]' || true`);
  verifier('tracés d\'icônes modifiés', '', diffIcones ? 'OUI' : '', diffIcones.slice(0, 400));
}

/* — rapport — */
const large = Math.max(...resultats.map((r) => r.nom.length));
console.log(`\n=== preuve — lot Liquide 0\${LOT} ===\n`);
for (const r of resultats) {
  console.log(`\${r.ok ? ' OK ' : 'ÉCHEC'}  \${r.nom.padEnd(large)}  attendu \${r.attendu.padEnd(6)} obtenu \${r.obtenu}`);
  if (!r.ok && r.detail) console.log(`        └─ \${r.detail}`);
}

console.log(`\n--- couleurs écrites en dur dans les écrans (compté, non bloquant) ---`);
if (totalDur === 0) console.log('  aucune.');
else for (const [f, n] of Object.entries(enDur).sort((a, b) => b[1] - a[1])) console.log(`  \${String(n).padStart(4)}  \${f}`);
console.log(`  total : \${totalDur}`);
console.log(`\nCe total est la réponse à la question du lot 01 : ce sont les règles\nqui ne se repeindront PAS par les alias. Ne pas les corriger ici.\n`);

const echecs = resultats.filter((r) => !r.ok).length;
console.log(echecs === 0 ? '✓ toutes les preuves passent.\n' : `✗ \${echecs} preuve(s) en échec.\n`);
process.exit(echecs === 0 ? 0 : 1);
