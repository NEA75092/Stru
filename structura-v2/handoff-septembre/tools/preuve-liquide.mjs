#!/usr/bin/env node
/* preuve-liquide.mjs — remplit tout seul la table de preuve des lots Liquide.
 *
 *   node structura-v2/handoff-septembre/tools/preuve-liquide.mjs --lot 1
 *   node structura-v2/handoff-septembre/tools/preuve-liquide.mjs --lot 2
 *   node structura-v2/handoff-septembre/tools/preuve-liquide.mjs --lot 3
 *
 * Lancer depuis la RACINE DU DÉPÔT. Sort 0 si tout passe, 1 sinon.
 * Ce script ne corrige rien : il constate et il nomme le fichier fautif.
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join } from 'node:path';

const LOT = Number((process.argv[process.argv.indexOf('--lot') + 1]) || 0);
if (LOT !== 1 && LOT !== 2 && LOT !== 3) {
  console.error('usage: preuve-liquide.mjs --lot 1|2|3');
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
  : LOT === 2
    ? [join(SRC, 'shell.css'), INDEX]
    : [
        // lot 3, § 5 : sept fichiers d'écran, plus design-tokens.css
        // pour la seule suppression de --shadow-float, plus index.html
        // pour le bump ?v=.
        join(SRC, 'controls.css'),
        join(SRC, 'dashboard.css'),
        join(SRC, 'overlays.css'),
        join(SRC, 'passe7.css'),
        join(SRC, 'tables.css'),
        join(SRC, 'views.css'),
        join(SRC, 'modules', 'app-portfolio.js'),
        TOKENS,
        INDEX,
      ];
const touches = sh('git diff --name-only HEAD').split('\n').filter(Boolean);
const horsPerimetre = touches.filter((f) => !AUTORISES.includes(f));
verifier('fichiers hors périmètre', 0, horsPerimetre.length, horsPerimetre.join(', '));

/* — tokens de la passe 8 : plus aucune occurrence —
   Emplacements, pas seulement fichiers (lot 3, § 2 : « ajoute-les à
   l'affichage, c'est un fichier d'outillage, tu y as droit »).
   --grain et --blur-enter ne sont PAS dans cette liste : le lot 03 § 4
   dit qu'ils restent (ils servent la nappe du LOT 2). Ils sont comptés
   plus bas, pour mémoire, jamais bloquants. */
const MORTS = ['--chaux', '--mer', '--olive', '--ocre', '--terracotta', '--lumiere'];
for (const t of MORTS) {
  const emplacements = [];
  for (const f of fichiers) {
    lire(f).split('\n').forEach((l, i) => {
      if (l.includes(t)) emplacements.push(`${f}:${i + 1}`);
    });
  }
  verifier(`occurrences de ${t}`, 0, emplacements.length, emplacements.join(', '));
}

/* — la couche d'alias ne contient aucun littéral —
   La spec place la couche 2 deux fois (après la couche 1 jour, puis après
   la couche 1 nuit dans :root[data-theme="dark"] — § 4 : « trois lignes
   seulement, tout le reste hérite »). Un simple indexOf+slice-to-end
   avalerait donc aussi les littéraux de la couche 1 nuit, qui vit après le
   premier repère. On borne chaque tronçon de couche 2 au repère « couche 1 »
   suivant, insensible à la casse. */
const src = lire(TOKENS);
const reC2 = /couche 2/gi;
const debuts = [...src.matchAll(reC2)].map((m) => m.index);
if (debuts.length) {
  let couche2 = '';
  for (const d of debuts) {
    const reC1 = /couche 1/gi;
    reC1.lastIndex = d;
    const suite = reC1.exec(src);
    couche2 += src.slice(d, suite ? suite.index : src.length);
  }
  const litteraux = couche2.match(/#[0-9a-f]{3,8}\b|\brgba?\(|\boklch\(/gi) || [];
  // #fff dans un color-mix de nuit est toléré, il est nommé dans la spec.
  const durs = litteraux.filter((l) => !/^#fff/i.test(l));
  verifier('littéraux dans la couche 2', 0, durs.length, durs.join(' '));
} else {
  verifier('couche 2 repérable', 'oui', 'non', 'le commentaire « couche 2 » est absent de design-tokens.css');
}

/* — aucune ombre, sauf la surface flottante —
   `box-shadow` sans « : » n'est pas une déclaration : c'est le nom de
   propriété dans une liste `transition:` (ex. « box-shadow 120ms ease »).
   Une transition ne peint rien, elle ne viole pas « aucune ombre portée » —
   sans ce garde-fou, .btn (passe 1, hors périmètre du lot 3) comptait
   comme une ombre alors qu'il n'en pose aucune. */
const ombres = [];
for (const f of fichiers) {
  lire(f).split('\n').forEach((l, i) => {
    if (/box-shadow\s*:/.test(l) && !/--shadow-float|:\s*none/.test(l)) ombres.push(`${f}:${i + 1}`);
  });
}
verifier('box-shadow hors --shadow-float', 0, ombres.length, ombres.join(', '));

/* — rayons littéraux —
   Exception : la forme organique des dérives de nappe (lot 2, § 4) est un
   quadruplet de pourcentages (ex. 46% 54% 42% 58%). Aucun des cinq --r-*
   ne couvre une forme irrégulière ; ce n'est pas un rayon de composant qui
   a oublié son token, c'est une silhouette de fond décorative, prescrite
   telle quelle par la spec. */
const rayons = [];
const FORME_NAPPE = /^(\d{1,3}%\s*){4}$/;
for (const f of fichiers) {
  lire(f).split('\n').forEach((l, i) => {
    const m = l.match(/border-radius:\s*([^;]+)/);
    if (m && FORME_NAPPE.test(m[1].trim())) return;
    if (m && !/var\(--r-|var\(--radius-|^\s*0(px)?\s*$|50%|999px|inherit/.test(m[1])) rayons.push(`${f}:${i + 1} → ${m[1].trim()}`);
  });
}
verifier('border-radius littéral', 0, rayons.length, rayons.join(' | '));

/* — polices mortes — */
for (const p of ['Newsreader', 'IBM Plex']) {
  const emplacements = [];
  for (const f of [...fichiers, INDEX]) {
    lire(f).split('\n').forEach((l, i) => {
      if (l.includes(p)) emplacements.push(`${f}:${i + 1}`);
    });
  }
  verifier(`occurrences de ${p}`, 0, emplacements.length, emplacements.join(', '));
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

/* — --grain / --blur-enter : tolérés par le lot 03 § 4 (ils servent la
   nappe du LOT 2). Comptés pour mémoire, jamais bloquants. — */
const TOLERES = ['--grain', '--blur-enter'];
const memoire = {};
for (const t of TOLERES) {
  const ou = [];
  for (const f of fichiers) {
    lire(f).split('\n').forEach((l, i) => { if (l.includes(t)) ou.push(`${f}:${i + 1}`); });
  }
  if (ou.length) memoire[t] = ou;
}

/* — lot 02 : la coquille — */
if (LOT === 2) {
  // Deux corrections d'un faux négatif qui a menti pendant deux lots :
  //  1. shell.css décrit « le rail » en prose bien avant la règle — on
  //     strippe les /* */ pour que le regex de sélecteur n'y morde pas.
  //  2. la classe du rail de nav est .sidebar (index.html), pas .rail :
  //     l'ancien regex cherchait un sélecteur qui n'existe nulle part.
  const shell = lire(join(SRC, 'shell.css')).replace(/\/\*[\s\S]*?\*\//g, '');
  verifier('.nappe à 640px', true, /\.nappe\b[^}]*height:\s*640px/s.test(shell));
  verifier('rail (.sidebar) à 236px', true, /\.sidebar\b[^}]*width:\s*236px/s.test(shell));
  verifier('prefers-reduced-motion présent', true, shell.includes('prefers-reduced-motion'));
  verifier('les huit couches de nappe', 8, (shell.match(/\.nappe-[a-z-]+\s*\{/g) || []).length + (/\.nappe-eau/.test(shell) ? 0 : 0));
  const diffIcones = sh(`git diff -U0 HEAD -- ${INDEX} | grep -E '^[+-].*\\bd="' | grep -v '^[+-][+-]' || true`);
  verifier('tracés d\'icônes modifiés', '', diffIcones ? 'OUI' : '', diffIcones.slice(0, 400));
}

/* — rapport — */
const large = Math.max(...resultats.map((r) => r.nom.length));
console.log(`\n=== preuve — lot Liquide 0${LOT} ===\n`);
for (const r of resultats) {
  console.log(`${r.ok ? ' OK ' : 'ÉCHEC'}  ${r.nom.padEnd(large)}  attendu ${r.attendu.padEnd(6)} obtenu ${r.obtenu}`);
  if (!r.ok && r.detail) console.log(`        └─ ${r.detail}`);
}

console.log(`\n--- couleurs écrites en dur dans les écrans (compté, non bloquant) ---`);
if (totalDur === 0) console.log('  aucune.');
else for (const [f, n] of Object.entries(enDur).sort((a, b) => b[1] - a[1])) console.log(`  ${String(n).padStart(4)}  ${f}`);
console.log(`  total : ${totalDur}`);
console.log(`\nCe total est la réponse à la question du lot 01 : ce sont les règles\nqui ne se repeindront PAS par les alias. Ne pas les corriger ici.\n`);

console.log(`--- --grain / --blur-enter : tolérés (lot 03 § 4), comptés pour mémoire ---`);
if (!Object.keys(memoire).length) console.log('  aucune.');
else for (const [t, ou] of Object.entries(memoire)) console.log(`  ${t.padEnd(12)} ${String(ou.length).padStart(2)}  └─ ${ou.join(', ')}`);
console.log('');

/* Code de sortie : 1 dès qu'une preuve BLOQUANTE échoue, 0 sinon. Les
   compteurs « pour mémoire » (couleurs en dur, --grain / --blur-enter)
   ne sont pas dans `resultats`, donc jamais dans `echecs` : ils
   informent, ils ne font pas rougir la sonde. */
const echecs = resultats.filter((r) => !r.ok).length;
console.log(echecs === 0 ? '✓ toutes les preuves passent.\n' : `✗ ${echecs} preuve(s) en échec.\n`);
process.exit(echecs === 0 ? 0 : 1);
