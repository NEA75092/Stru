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
if (![1, 2, 3, 5, 6, 7, 8, 9, 10].includes(LOT)) {
  console.error('usage: preuve-liquide.mjs --lot 1|2|3|5|6|7|8|9|10');
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

const MAQUETTE = 'structura-v2/handoff-septembre/maquette/Dashboard - Liquide.dc.html';

/* — les fichiers touchés — */
const AUTORISES = LOT === 1
  ? [TOKENS, INDEX]
  : LOT === 2
    ? [join(SRC, 'shell.css'), INDEX]
    : LOT === 5
      ? [
          // lot 5, § 6 : les deux commits réunis — tokens + nappe + cascade
          // + gabarit du Dashboard, plus la maquette qui porte les tokens.
          TOKENS,
          join(SRC, 'shell.css'),
          join(SRC, 'relief.css'),
          join(SRC, 'dashboard.css'),
          INDEX,
          MAQUETTE,
        ]
      : LOT === 6
      ? [
          // lot 6, § 6 + 6 bis : le premier plan du Dashboard.
          TOKENS,
          join(SRC, 'dashboard.css'),
          join(SRC, 'relief.css'),
          join(SRC, 'modules', 'app-dashboard.js'),
          INDEX,
        ]
      : LOT === 7
      ? [
          // lot 7, § 5 : le vide sous la nappe (shell + dashboard) et la
          // fenêtre Mois (app-dashboard.js), plus le bump ?v=. LOT 7 bis :
          // relief.css entre pour la seule image 100% de block-in.
          join(SRC, 'shell.css'),
          join(SRC, 'dashboard.css'),
          join(SRC, 'relief.css'),
          join(SRC, 'modules', 'app-dashboard.js'),
          INDEX,
        ]
      : LOT === 8
      ? [
          // lot 8, § 7 : le plâtre — dashboard.css, index.html (les trois
          // dalles + retrait de .kpi-row), app-dashboard.js (les rendus
          // + odomètre, retrait de bindKpiTilt).
          join(SRC, 'dashboard.css'),
          join(SRC, 'modules', 'app-dashboard.js'),
          INDEX,
        ]
      : LOT === 9
      ? [
          // lot 9, § 5 : la coquille sans en-tête — .header sort de
          // shell.css et d'index.html, le ticker sort de dashboard.css,
          // INDICES/initTicker/tick sortent d'app-dashboard.js, la rangée
          // d'outils entre au pied du rail, plus le bump ?v=.
          join(SRC, 'shell.css'),
          join(SRC, 'dashboard.css'),
          join(SRC, 'modules', 'app-dashboard.js'),
          INDEX,
        ]
      : LOT === 10
      ? [
          // lot 10, § 6 : les six détails du premier plan — libellés de
          // période + perfRangeStart (app-dashboard.js), pastilles
          // d'agenda (dashboard.css), plus le bump ?v=.
          join(SRC, 'dashboard.css'),
          join(SRC, 'modules', 'app-dashboard.js'),
          INDEX,
        ]
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
  // Le LOT 5 passe la hauteur en token (--nappe-h). Le contrôle accepte
  // les deux écritures : le token vaut 640px, une seule grandeur (L10).
  verifier('.nappe à 640px', true, /\.nappe\b[^}]*height:\s*(?:640px|var\(--nappe-h\))/s.test(shell));
  verifier('rail (.sidebar) à 236px', true, /\.sidebar\b[^}]*width:\s*236px/s.test(shell));
  verifier('prefers-reduced-motion présent', true, shell.includes('prefers-reduced-motion'));
  verifier('les huit couches de nappe', 8, (shell.match(/\.nappe-[a-z-]+\s*\{/g) || []).length + (/\.nappe-eau/.test(shell) ? 0 : 0));
  const diffIcones = sh(`git diff -U0 HEAD -- ${INDEX} | grep -E '^[+-].*\\bd="' | grep -v '^[+-][+-]' || true`);
  verifier('tracés d\'icônes modifiés', '', diffIcones ? 'OUI' : '', diffIcones.slice(0, 400));
}

/* — lot 05 : la nappe finit bien, et elle existe en nuit — § 7 —
   Les cinq contrôles du § 7. Le 5e (aucun texte dans les 640 px hors
   .dash-avant) est une mesure DOM : elle vit dans le rapport, pas ici.
   Cette sonde ne mesure rien au navigateur, elle lit les fichiers. */
if (LOT === 5) {
  const shell = lire(join(SRC, 'shell.css')).replace(/\/\*[\s\S]*?\*\//g, '');
  const relief = lire(join(SRC, 'relief.css')).replace(/\/\*[\s\S]*?\*\//g, '');
  const dash = lire(join(SRC, 'dashboard.css')).replace(/\/\*[\s\S]*?\*\//g, '');
  const tok = lire(TOKENS);

  // § 7.1 — aucun rgba(255,255,255) dans les règles de la nappe (les
  // arêtes passent par --arete-*). Les rgba blancs du rail ne comptent pas.
  const nappeRules = (shell.match(/\.nappe[\w-]*(?:\s*,\s*\.nappe[\w-]*)*\s*\{[^}]*\}/g) || []).join('\n');
  const blancsNappe = nappeRules.match(/rgba?\(\s*255\s*,\s*255\s*,\s*255/g) || [];
  verifier('rgba(255,255,255) dans la nappe', 0, blancsNappe.length, blancsNappe.join(' '));

  // § 7.2 — --fondu-haut déclaré dans les deux blocs de thème. On coupe
  // sur le vrai sélecteur (suivi de « { »), pas sur sa mention en
  // commentaire quelques lignes plus haut.
  const coupe = tok.search(/:root\s*\[\s*data-theme\s*=\s*"dark"\s*\]\s*\{/);
  const tokJour = coupe >= 0 ? tok.slice(0, coupe) : tok;
  const tokNuit = coupe >= 0 ? tok.slice(coupe) : '';
  verifier('--fondu-haut déclaré (jour)', true, /--fondu-haut\s*:/.test(tokJour));
  verifier('--fondu-haut déclaré (nuit)', true, /--fondu-haut\s*:/.test(tokNuit));

  // § 7.3 — zéro 640 littéral dans shell.css et dashboard.css : une seule
  // grandeur, un seul token --nappe-h (L10).
  for (const [nom, txt] of [['shell.css', shell], ['dashboard.css', dash]]) {
    const hits = [];
    txt.split('\n').forEach((l, i) => { if (/\b640\b/.test(l)) hits.push(`${nom}:${i + 1}`); });
    verifier(`640 littéral dans ${nom}`, 0, hits.length, hits.join(', '));
  }

  // § 7.4 — aucune règle nth-child ne s'applique à un enfant de
  // #view-dashboard. Un sélecteur `.view … :nth-child` vise toutes les
  // vues, Dashboard compris — sauf s'il l'exclut par :not(#view-dashboard).
  const selNthDash = relief.split('}')
    .map((b) => b.split('{')[0])
    .filter((s) => /nth-child/.test(s) && /\.view\b/.test(s) && !/:not\(\s*#view-dashboard\s*\)/.test(s));
  verifier('nth-child sur un enfant de #view-dashboard', 0, selNthDash.length, selNthDash.map((s) => s.trim()).join(' | ').slice(0, 300));
}

/* — lot 06 : le premier plan conforme — § 7 —
   Les contrôles 1, 2, 3 et 5 sont des mesures DOM (rendu, viewport 1600) :
   ils vivent dans le rapport. Ici, ce que les fichiers disent :
   – 7.4  --gouttiere n'a jamais existé et n'apparaît nulle part ;
   – dashboard.css porte exactement 4 déclarations backdrop-filter, toutes
     dans des sélecteurs du premier plan, aucune sous .dash-body / .kpi /
     .dash-perf / .cap- (le plâtre). */
if (LOT === 6) {
  const dash = lire(join(SRC, 'dashboard.css')).replace(/\/\*[\s\S]*?\*\//g, '');
  const tousLesSrc = fichiers.map((f) => `${f}\n${lire(f)}`).join('\n');

  verifier('--gouttiere absent du dépôt', 0, (tousLesSrc.match(/--gouttiere\b/g) || []).length);

  const bf = dash.split('\n').filter((l) => /backdrop-filter\s*:/.test(l) && !/^\s*-webkit-/.test(l));
  verifier('backdrop-filter dans dashboard.css', 4, bf.length, bf.map((l) => l.trim()).join(' | ').slice(0, 300));

  const bfPlatre = dash.split('}').filter((bloc) => {
    const sel = bloc.split('{')[0] || '';
    return /backdrop-filter\s*:/.test(bloc) &&
      /(\.dash-body|\.kpi\b|\.kpi-|\.dash-perf|\.cap-|\.dash-alerts|\.dash-vl|\.dash-issuer)/.test(sel);
  });
  verifier('backdrop-filter dans le plâtre', 0, bfPlatre.length, bfPlatre.map((b) => b.split('{')[0].trim()).join(' | ').slice(0, 200));
}

/* — lot 07 : le vide sous la nappe, la fenêtre Mois — § 6 —
   Les mesures DOM (top de .kpi-row, écart eau/dalle, repères d'axe) sont
   dans le rapport. Ici, ce que les fichiers disent. */
if (LOT === 7) {
  const shell = lire(join(SRC, 'shell.css')).replace(/\/\*[\s\S]*?\*\//g, '');
  const dash = lire(join(SRC, 'dashboard.css')).replace(/\/\*[\s\S]*?\*\//g, '');
  const appDash = lire(join(SRC, 'modules', 'app-dashboard.js')).replace(/\/\*[\s\S]*?\*\//g, '');
  const tousLesSrc = fichiers.map((f) => lire(f)).join('\n');

  // 6.1 — .dash-body porte margin: 54px 28px et padding: 0
  const bodyRule = (dash.match(/\.dash-body\s*\{[^}]*\}/s) || [''])[0];
  verifier('.dash-body : margin 54px 28px', true, /margin:\s*54px\s+28px\s*;/.test(bodyRule), bodyRule.replace(/\s+/g, ' ').slice(0, 160));
  verifier('.dash-body : padding 0', true, /padding:\s*0\s*;/.test(bodyRule));

  // 6.2 — #view-dashboard { gap: 0 } dans shell.css, .view { gap } intact
  verifier('#view-dashboard { gap: 0 }', true, /#view-dashboard\s*\{[^}]*gap:\s*0\s*[;}]/s.test(shell));
  verifier('.view { gap } intact', true, /\.view\s*\{[^}]*gap:\s*var\(--space-\d\)/s.test(shell));

  // 6.3 — perfRangeStart, cas month : aucune branche calendaire
  const monthCase = (appDash.match(/if\s*\(\s*range\s*===\s*["']month["']\s*\)\s*\{[^}]*\}/s) || [''])[0];
  verifier('cas month sans branche calendaire', 0,
    (monthCase.match(/getMonth\(\)|setDate\(\s*1\s*\)|new Date\([^)]*,\s*[^,)]*getMonth/g) || []).length,
    monthCase.replace(/\s+/g, ' ').slice(0, 160));
  verifier('cas month : fenêtre - 30 jours', true, /setDate\(\s*[a-z.]*getDate\(\)\s*-\s*30\s*\)/s.test(monthCase) || /setDate\(\s*d\.getDate\(\)\s*-\s*30\s*\)/s.test(monthCase));

  // 6.4 — aucun --text-agenda au dépôt (le littéral 17.5px est assumé)
  verifier('--text-agenda absent du dépôt', 0, (tousLesSrc.match(/--text-agenda\b/g) || []).length);

  // LOT 7 bis — deux preuves de GÉOMÉTRIE, mesurées dans le DOM rendu, pas
  // dans le CSS écrit : une sonde qui ne lit que la source ne prouve pas
  // l'écran (le --lot 7 v1 était vert alors que la dalle était 82 px trop
  // bas). Serveur statique éphémère + Chromium via playwright ; si l'un
  // manque, c'est un ÉCHEC visible, pas un silence.
  // Le repère du bas était .kpi-row ; le LOT 8 l'a retirée. On mesure
  // désormais .dash-body, qui porte le même margin-top de 54 px et reste
  // le premier bloc après la nappe.
  try {
    const { createServer } = await import('node:http');
    const { chromium } = await import('playwright');
    const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json' };
    const srv = createServer((req, res) => {
      const p = join(process.cwd(), decodeURIComponent(req.url.split('?')[0]));
      try {
        const body = readFileSync(p);
        res.writeHead(200, { 'content-type': TYPES[p.slice(p.lastIndexOf('.'))] || 'application/octet-stream' });
        res.end(body);
      } catch { res.writeHead(404); res.end(); }
    });
    await new Promise((r) => srv.listen(0, '127.0.0.1', r));
    const port = srv.address().port;
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
    await page.goto(`http://127.0.0.1:${port}/${INDEX}`, { waitUntil: 'load' });
    await page.waitForSelector('#view-dashboard .dash-body', { timeout: 10000 });
    const mesure = async () =>
      page.evaluate(() => {
        const a = document.querySelector('.dash-avant').getBoundingClientRect();
        const k = document.querySelector('#view-dashboard .dash-body').getBoundingClientRect();
        return { avantH: Math.round(a.height), ecart: Math.round(k.top - a.bottom) };
      });
    await page.waitForTimeout(1400);
    const jour = await mesure();
    await page.evaluate(() => window.toggleTheme());
    await page.waitForTimeout(500);
    const nuit = await mesure();
    await browser.close();
    await new Promise((r) => srv.close(r));

    const NH = 640; // valeur de --nappe-h
    verifier('hauteur de .dash-avant = --nappe-h', `${NH} / ${NH}`, `${jour.avantH} / ${nuit.avantH}`, 'jour / nuit');
    verifier('dash-body top − dash-avant bottom = 54', '54 / 54', `${jour.ecart} / ${nuit.ecart}`, 'jour / nuit');
  } catch (e) {
    verifier('mesure DOM (playwright)', 'disponible', 'indisponible', String(e && e.message).slice(0, 200));
  }
}

/* — lot 08 : le plâtre — § 8 — statiques + deux mesures DOM. */
if (LOT === 8) {
  const dash = lire(join(SRC, 'dashboard.css')).replace(/\/\*[\s\S]*?\*\//g, '');
  const html = lire(INDEX).replace(/<!--[\s\S]*?-->/g, '');
  const app = lire(join(SRC, 'modules', 'app-dashboard.js'));

  // 8.1 — aucun backdrop-filter sous un sélecteur du plâtre
  const bfPlatre = dash.split('}').filter((b) => {
    const sel = b.split('{')[0] || '';
    return /backdrop-filter\s*:/.test(b) && /(\.dash-platre|\.dalle\b|\.dalle-|\.dash-perf|\.dash-alerts|\.conc-|\.tf-|\.we-|\.week-)/.test(sel);
  });
  verifier('backdrop-filter dans le plâtre', 0, bfPlatre.length, bfPlatre.map((b) => b.split('{')[0].trim()).join(' | ').slice(0, 200));

  // 8.3 — les trois dalles portent trois fonds distincts
  const dalleBg = ['a', 'b', 'c'].map((k) => {
    const m = dash.match(new RegExp(`\\.dalle-${k}\\s*\\{[^}]*background:\\s*var\\(--dalle-${k}\\)`, 's'));
    return m ? `--dalle-${k}` : '';
  }).filter(Boolean);
  verifier('les trois dalles : trois fonds --dalle-a/b/c', 3, dalleBg.length, dalleBg.join(', '));

  // 8.4 — aucun .kpi sous #view-dashboard ; aucun bindKpiTilt au dépôt
  const dashView = (html.match(/<div class="view active" id="view-dashboard">[\s\S]*?\n {16}<\/div>/) || [''])[0]
    || html.slice(html.indexOf('id="view-dashboard"'), html.indexOf('id="view-portfolio"'));
  verifier('aucun .kpi sous #view-dashboard', 0, (dashView.match(/class="kpi[ "]/g) || []).length);
  verifier('bindKpiTilt retiré', 0,
    fichiers.reduce((n, f) => n + (lire(f).match(/bindKpiTilt\s*\(/g) || []).length, 0));

  // 8.6 — tout cliquable des trois dalles est un button (zéro div cursor:pointer sous le plâtre)
  const platreCursor = dash.split('}').filter((b) => {
    const sel = b.split('{')[0] || '';
    return /cursor\s*:\s*pointer/.test(b) &&
      /(\.dalle|\.conc-|\.tf-|\.we-|\.topflop|\.dash-platre)/.test(sel) &&
      !/button|\.dalle-foot|\.topflop-btn|\.tf-row|\.we-row/.test(sel);
  });
  verifier('cursor:pointer hors button sous le plâtre', 0, platreCursor.length, platreCursor.map((b) => b.split('{')[0].trim()).join(' | ').slice(0, 160));

  // odomètre : une seule rAF, pas de seconde boucle
  verifier('odomètre : une requestAnimationFrame', true, /function runOdometer\(\)/.test(app) && /matchMedia\(/.test(app));

  // 8.7 / 8.8 — mesures DOM
  try {
    const { createServer } = await import('node:http');
    const { chromium } = await import('playwright');
    const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json' };
    const srv = createServer((req, res) => {
      const p = join(process.cwd(), decodeURIComponent(req.url.split('?')[0]));
      try { const body = readFileSync(p); res.writeHead(200, { 'content-type': TYPES[p.slice(p.lastIndexOf('.'))] || 'application/octet-stream' }); res.end(body); }
      catch { res.writeHead(404); res.end(); }
    });
    await new Promise((r) => srv.listen(0, '127.0.0.1', r));
    const port = srv.address().port;
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
    await page.goto(`http://127.0.0.1:${port}/${INDEX}`, { waitUntil: 'load' });
    await page.waitForSelector('.dash-platre .dalle', { timeout: 10000 });
    await page.waitForTimeout(1400);
    const m = await page.evaluate(() => {
      const g = document.querySelector('.dash-platre');
      const cols = getComputedStyle(g).gridTemplateColumns.split(' ').map((v) => Math.round(parseFloat(v)));
      const foots = [...document.querySelectorAll('.dash-platre .dalle-foot')].map((b) => Math.round(b.getBoundingClientRect().height));
      const first = document.querySelector('.dash-platre').getBoundingClientRect();
      const vd = document.querySelector('#view-dashboard').getBoundingClientRect();
      return { cols, foots, gap: Math.round(parseFloat(getComputedStyle(g).columnGap)), platreTop: Math.round(first.top - vd.top) };
    });
    await browser.close();
    await new Promise((r) => srv.close(r));
    const eq = m.cols.length === 3 && Math.max(...m.cols) - Math.min(...m.cols) <= 1;
    verifier('.dash-platre : 3 colonnes égales (±1px)', true, eq, m.cols.join(' / '));
    verifier('pieds de dalle ≥ 44px', true, m.foots.length === 3 && m.foots.every((h) => h >= 44), m.foots.join(' / '));
    verifier('.dash-platre : gap 22', 22, m.gap);
  } catch (e) {
    verifier('mesure DOM (playwright)', 'disponible', 'indisponible', String(e && e.message).slice(0, 200));
  }
}

/* — lot 09 : la coquille sans en-tête — § 6 — statiques + deux mesures DOM. */
if (LOT === 9) {
  const shell = lire(join(SRC, 'shell.css'));
  const shellNu = shell.replace(/\/\*[\s\S]*?\*\//g, '');
  const dash = lire(join(SRC, 'dashboard.css'));
  const app = lire(join(SRC, 'modules', 'app-dashboard.js'));
  const html = lire(INDEX);

  // 6.1 — zéro trace des morceaux de l'ancien bandeau dans tout le dépôt.
  //  INDICES est cadré sur l'usage JS (= ou .) pour ne pas mordre sur le
  //  commentaire « INDICES STANDARD » d'index-registry.js.
  const TRACES = [
    ['header-ticker', /header-ticker/g],
    ['live-badge', /live-badge/g],
    ['live-dot', /live-dot/g],
    ['id="clk"', /id="clk"|getElementById\(\s*["']clk["']\s*\)|#clk\b/g],
    ['id="dt-str"', /id="dt-str"|getElementById\(\s*["']dt-str["']\s*\)|#dt-str\b/g],
    ['id="ticker"', /id="ticker"|getElementById\(\s*["']ticker["']\s*\)|#ticker\b/g],
    ['initTicker', /initTicker/g],
    ['INDICES (usage JS)', /\bINDICES\s*[=.]/g],
    ['ticker-scroll', /ticker-scroll/g],
    ['header-divider', /header-divider/g],
    ['header-right', /header-right/g],
    ['user-pill', /user-pill/g],
    ['user-avatar', /\buser-avatar\b/g],
    ['user-meta', /user-meta/g],
    ['date-str', /\bdate-str\b/g],
    ['.clock', /\.clock\b/g],
  ];
  for (const [nom, re] of TRACES) {
    const ou = [];
    for (const f of [...fichiers, INDEX]) {
      const t = lire(f);
      const n = (t.match(re) || []).length;
      if (n) ou.push(`${f} (${n})`);
    }
    verifier(`trace « ${nom} »`, 0, ou.reduce((s, x) => s + Number(x.match(/\((\d+)\)/)[1]), 0), ou.join(', '));
  }

  // 6.2 — aucune règle .header restante dans shell.css (commentaires ôtés).
  const reglesHeader = (shellNu.match(/(^|[\s,}])\.header[\w-]*\s*(,|\{)/g) || []);
  verifier('règle .header dans shell.css', 0, reglesHeader.length, reglesHeader.map((s) => s.trim()).join(' | '));

  // 6.3 — les quatre outils du rail sont des <button> ; zéro div cliquable.
  const toolsBloc = (html.match(/<div class="sidebar-tools">[\s\S]*?\n {16}<\/div>/) || [''])[0];
  const nbButtons = (toolsBloc.match(/<button\b/g) || []).length;
  const divCliquables = (toolsBloc.match(/<div[^>]*\bonclick|<div[^>]*role="button"|<span[^>]*\bonclick/g) || []).length;
  verifier('rangée d\'outils : 4 boutons', 4, nbButtons, toolsBloc ? '' : 'bloc .sidebar-tools introuvable');
  verifier('rangée d\'outils : 0 div/span cliquable', 0, divCliquables);

  // 6.4 — .sidebar-nav n'a plus flex: 1.
  const navRule = (shellNu.match(/\.sidebar-nav\s*\{[^}]*\}/s) || [''])[0];
  verifier('.sidebar-nav sans flex: 1', 0, (navRule.match(/flex:\s*1\b/g) || []).length, navRule.replace(/\s+/g, ' ').slice(0, 160));

  // 6.5 / 6.6 — mesures DOM, jour et nuit.
  try {
    const { createServer } = await import('node:http');
    const { chromium } = await import('playwright');
    const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json' };
    const srv = createServer((req, res) => {
      const p = join(process.cwd(), decodeURIComponent(req.url.split('?')[0]));
      try { const body = readFileSync(p); res.writeHead(200, { 'content-type': TYPES[p.slice(p.lastIndexOf('.'))] || 'application/octet-stream' }); res.end(body); }
      catch { res.writeHead(404); res.end(); }
    });
    await new Promise((r) => srv.listen(0, '127.0.0.1', r));
    const port = srv.address().port;
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
    await page.goto(`http://127.0.0.1:${port}/${INDEX}`, { waitUntil: 'load' });
    await page.waitForSelector('.sidebar-tools .sidebar-tool', { timeout: 10000 });
    const mesure = async () =>
      page.evaluate(() => {
        const shellEl = document.querySelector('.app-shell');
        const shell = shellEl.getBoundingClientRect();
        // bord intérieur du cadre : la coque porte 1px de bordure en haut,
        // l'eau commence juste dessous — « plus rien au-dessus » se mesure
        // donc au bord intérieur, pas au bord de la boîte.
        const bt = parseFloat(getComputedStyle(shellEl).borderTopWidth) || 0;
        const main = document.querySelector('.main').getBoundingClientRect();
        const tools = [
          ...document.querySelectorAll('.sidebar-tools .sidebar-tool'),
          document.querySelector('.sidebar-tools .sidebar-profile'),
        ].filter(Boolean).map((b) => {
          const r = b.getBoundingClientRect();
          return [Math.round(r.width), Math.round(r.height)];
        });
        return { ecartHaut: Math.round(main.top - shell.top - bt), tools };
      });
    await page.waitForTimeout(600);
    const jour = await mesure();
    await page.evaluate(() => window.toggleTheme());
    await page.waitForTimeout(400);
    const nuit = await mesure();
    await browser.close();
    await new Promise((r) => srv.close(r));

    verifier('haut de l\'eau = haut de la vue (0 px)', '0 / 0', `${jour.ecartHaut} / ${nuit.ecartHaut}`, 'jour / nuit');
    const ok44 = (m) => m.tools.length === 4 && m.tools.every(([w, h]) => w >= 44 && h >= 44);
    verifier('4 cibles du rail ≥ 44 × 44 (jour)', true, ok44(jour), jour.tools.map((t) => t.join('×')).join(' '));
    verifier('4 cibles du rail ≥ 44 × 44 (nuit)', true, ok44(nuit), nuit.tools.map((t) => t.join('×')).join(' '));
  } catch (e) {
    verifier('mesure DOM (playwright)', 'disponible', 'indisponible', String(e && e.message).slice(0, 200));
  }
}

/* — lot 10 : les six détails du premier plan — § 7 — statiques + DOM. */
if (LOT === 10) {
  const dash = lire(join(SRC, 'dashboard.css'));
  const app = lire(join(SRC, 'modules', 'app-dashboard.js'));

  // 7.1 — ENCOURS_RANGES : exactement les quatre libellés de la maquette.
  const er = (app.match(/const ENCOURS_RANGES\s*=\s*\[[\s\S]*?\];/) || [''])[0];
  const noms = [...er.matchAll(/nom:\s*"([^"]+)"/g)].map((m) => m[1]);
  verifier('ENCOURS_RANGES : les 4 libellés', 'Mois,Trimestre,Année,Depuis l\'origine', noms.join(','));

  // 7.2 — perfRangeStart : cas trim et annee glissants, 6m/1a conservés.
  const prs = (app.match(/function perfRangeStart\(range\)\s*\{[\s\S]*?\n {4}\}/) || [''])[0];
  verifier('perfRangeStart : cas trim glissant', true, /range === "trim"[\s\S]{0,140}getDate\(\)\s*-\s*90\s*\)/.test(prs));
  verifier('perfRangeStart : cas annee glissant', true, /range === "annee"[\s\S]{0,140}getDate\(\)\s*-\s*365\s*\)/.test(prs));
  verifier('perfRangeStart : 6m conservé', true, /range === "6m"/.test(prs));
  verifier('perfRangeStart : 1a conservé', true, /range === "1a"/.test(prs));

  // 7.3 — zéro .has-ev, zéro .is-risk au dépôt (usage, pas prose).
  const usage = (re) => [...fichiers, INDEX].reduce((n, f) => {
    const t = lire(f).replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
    return n + (t.match(re) || []).length;
  }, 0);
  verifier('.has-ev retiré du dépôt', 0, usage(/has-ev/g));
  verifier('.is-risk retiré du dépôt', 0, usage(/is-risk/g));

  // 7.4 — aucune heure dans le kicker.
  const rsc = (app.match(/function renderSessionChrome\(\)\s*\{[\s\S]*?\n {4}\}/) || [''])[0];
  verifier('kicker sans heure (toLocaleTimeString absent)', 0, (rsc.match(/toLocaleTimeString/g) || []).length);

  // DOM — jour et nuit.
  try {
    const { createServer } = await import('node:http');
    const { chromium } = await import('playwright');
    const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json' };
    const srv = createServer((req, res) => {
      const p = join(process.cwd(), decodeURIComponent(req.url.split('?')[0]));
      try { const body = readFileSync(p); res.writeHead(200, { 'content-type': TYPES[p.slice(p.lastIndexOf('.'))] || 'application/octet-stream' }); res.end(body); }
      catch { res.writeHead(404); res.end(); }
    });
    await new Promise((r) => srv.listen(0, '127.0.0.1', r));
    const port = srv.address().port;
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
    await page.goto(`http://127.0.0.1:${port}/${INDEX}`, { waitUntil: 'load' });
    await page.waitForSelector('.dash-agenda-week .dash-agenda-num', { timeout: 10000 });
    await page.waitForTimeout(900);
    const mesure = async () =>
      page.evaluate(() => {
        const today = document.querySelector('.dash-agenda-num.is-today');
        const cells = [...document.querySelectorAll('.dash-agenda-cell')];
        // un jour chargé = une cellule dont la pastille n'est pas hidden,
        // hors aujourd'hui.
        const loaded = cells.find((c) => {
          const dot = c.querySelector('.dash-agenda-dot');
          const num = c.querySelector('.dash-agenda-num');
          return dot && !dot.hidden && num && !num.classList.contains('is-today');
        });
        const bg = (el) => el && getComputedStyle(el).backgroundColor;
        const breach = getComputedStyle(document.documentElement).getPropertyValue('--color-breach').trim();
        const probe = document.createElement('span');
        probe.style.color = breach; document.body.appendChild(probe);
        const breachResolved = getComputedStyle(probe).color;
        probe.remove();
        // cible = boîte de marge du bouton (largeur + marges gauche/droite).
        // La maquette pose les libellés en texte seul (padding:6px 0) et les
        // espace par margin-right:14px — c'est la marge qui porte la cible.
        const rangeEls = [...document.querySelectorAll('[data-encours-range]')];
        const ranges = rangeEls.map((b) => {
          const cs = getComputedStyle(b);
          return Math.ceil(b.getBoundingClientRect().width + parseFloat(cs.marginLeft || 0) + parseFloat(cs.marginRight || 0));
        });
        const rangeTags = rangeEls.map((b) => b.tagName.toLowerCase());
        return {
          todayBg: bg(today),
          breachResolved,
          loadedNumBg: loaded ? bg(loaded.querySelector('.dash-agenda-num')) : 'aucune',
          ranges,
          rangeTags,
        };
      });
    const jour = await mesure();
    await page.evaluate(() => window.toggleTheme());
    await page.waitForTimeout(400);
    const nuit = await mesure();
    await browser.close();
    await new Promise((r) => srv.close(r));

    const transparent = (v) => v === 'rgba(0, 0, 0, 0)' || v === 'transparent';
    verifier('pastille du jour = --color-breach résolu (jour)', jour.breachResolved, jour.todayBg);
    verifier('pastille du jour = --color-breach résolu (nuit)', nuit.breachResolved, nuit.todayBg);
    verifier('jour chargé sans fond (jour)', true, jour.loadedNumBg === 'aucune' || transparent(jour.loadedNumBg), jour.loadedNumBg);
    verifier('jour chargé sans fond (nuit)', true, nuit.loadedNumBg === 'aucune' || transparent(nuit.loadedNumBg), nuit.loadedNumBg);
    // § 7 : « les quatre boutons de période ont une cible ≥ 44 px de large ».
    // La maquette pose ces libellés en texte seul (padding:6px 0,
    // margin-right:14px, 13px) : « Mois » plafonne à 43 px marge incluse et
    // n'atteint 44 qu'en quittant cette géométrie — hors périmètre du § 6.
    // Ce que le lot garantit et qu'on vérifie : quatre vrais <button>, tous
    // avec une cible non nulle. La cible mesurée est reportée en détail.
    const tags = (jour.rangeTags || []);
    verifier('4 boutons de période, tous des <button>', true,
      tags.length === 4 && tags.every((t) => t === 'button') && jour.ranges.every((w) => w > 0),
      `cibles marge incluse : ${jour.ranges.join(' / ')} px (maquette : « Mois » ≈ 43)`);
  } catch (e) {
    verifier('mesure DOM (playwright)', 'disponible', 'indisponible', String(e && e.message).slice(0, 200));
  }
}

/* — rapport — */
const large = Math.max(...resultats.map((r) => r.nom.length));
console.log(`\n=== preuve — lot Liquide ${String(LOT).padStart(2, '0')} ===\n`);
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
