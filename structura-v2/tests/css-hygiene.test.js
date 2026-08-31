/* ============================================================
   CSS HYGIENE — la barrière, pas le brief.
   Ce test échoue tant que la refonte n'est pas réellement faite.
   Lancé par `npm test`, donc impossible de déclarer une passe
   terminée avec ce fichier en rouge.

   Une passe se termine en ajoutant son fichier à MIGRATED et en
   passant son drapeau à true dans STAGES. Rien d'autre.
   ============================================================ */

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");
const SRC = path.join(ROOT, "src");

/* Feuilles réécrites depuis design-tokens.css. Y ajouter un fichier
   signifie : il ne contient aucun !important, aucune couleur
   littérale, aucun sélecteur en doublon. */
const MIGRATED = [
  "shell.css",
  "relief.css",
  "tables.css",
  "overlays.css",
  "controls.css",
  "views.css",
  "passe7.css",
];

/* Passe validée = ses règles héritées ont été SUPPRIMÉES des
   anciennes feuilles, pas surchargées. */
const STAGES = {
  shell: true, // passe 1 — sidebar, header, nav, profil, boutons
  dashboard: true, // passe 2 — KPI, perf, Top/Flop, exposition
  relief: true, // passe 3 — logo, ombres teintées, grain, mouvement
  views: true, // passe 4 — tableaux, KPI barrières, accueil, perf
};

/* Noms de variables de l'ancienne charte. Interdits partout :
   c'est par eux que l'orange revient là où on ne l'attend pas.
   --terracotta retiré le 01/08 (passe 8) : redéfini intentionnellement
   dans design-tokens.css comme un des onze tokens de rôle (terre —
   barrière franchie), avec sa propre valeur oklch et son propre usage
   strict. Ce n'est plus une référence morte vers l'ancien accent
   décoratif — c'est une source de vérité à part entière. */
const DEAD_TOKENS = [
  "--gold",
  "--gold2",
  "--sand",
  "--purple",
  "--sea",
  "--sea-light",
  "--blue2",
  "--red2",
  "--orange2",
];

function test(name, fn) {
  try {
    fn();
    console.log(`OK  ${name}`);
  } catch (error) {
    console.error(`KO  ${name}`);
    console.error(error.message);
    process.exitCode = 1;
  }
}

function read(file) {
  return fs.readFileSync(path.join(SRC, file), "utf8");
}

function exists(file) {
  return fs.existsSync(path.join(SRC, file));
}

function cssFiles() {
  return fs
    .readdirSync(SRC)
    .filter((f) => f.endsWith(".css"))
    .sort();
}

/* Décommente les commentaires puis relève chaque sélecteur déclaré,
   fichier par fichier. Volontairement simple : on ne cherche pas à
   parser le CSS, seulement à repérer un même sélecteur déclaré deux
   fois — ce qui suffit à attraper la cause de tous les bugs
   d'alignement de l'audit du 25/07. */
function selectorsOf(css) {
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const found = [];
  const re = /(^|\}|\{)\s*([^{}@][^{}]{0,300}?)\s*\{/g;
  let match;
  while ((match = re.exec(clean))) {
    match[2]
      .split(",")
      .map((s) => s.trim().replace(/\s+/g, " "))
      .filter((s) => s && !s.includes(":root") && !s.startsWith("@") && !s.includes("%"))
      .forEach((s) => found.push(s));
  }
  return found;
}

/* ── 1. Zéro !important dans les feuilles migrées ──────────── */
test("les feuilles migrées ne contiennent aucun !important", () => {
  for (const file of MIGRATED) {
    assert.ok(exists(file), `${file} est listé dans MIGRATED mais absent de src/`);
    const hits = (read(file).match(/!important/g) || []).length;
    assert.equal(hits, 0, `${file} contient ${hits} !important — une feuille unique n'a rien à battre`);
  }
});

/* ── 2. Zéro couleur littérale hors design-tokens.css ──────── */
test("les feuilles migrées n'écrivent aucune couleur littérale", () => {
  for (const file of MIGRATED) {
    const clean = read(file).replace(/\/\*[\s\S]*?\*\//g, "");
    const hex = clean.match(/#[0-9a-f]{3,8}\b/gi) || [];
    /* rgb(255 255 255 / a) sur du blanc pur est toléré : c'est un
       voile d'opacité sur un fond déjà coloré par un token, pas une
       couleur de marque. Toute autre valeur littérale est un bug de
       mode nuit en attente. */
    const rgba = (clean.match(/rgba?\([^)]*\)/gi) || []).filter(
      (v) => !/^rgba?\(\s*255[\s,]+255[\s,]+255/i.test(v),
    );
    assert.equal(hex.length, 0, `${file} : couleurs en dur ${hex.slice(0, 5).join(", ")}`);
    assert.equal(rgba.length, 0, `${file} : couleurs en dur ${rgba.slice(0, 5).join(", ")}`);
  }
});

/* ── 3. Un sélecteur par élément ───────────────────────────── */
test("aucun sélecteur déclaré deux fois dans une feuille migrée", () => {
  for (const file of MIGRATED) {
    const counts = new Map();
    for (const sel of selectorsOf(read(file))) {
      counts.set(sel, (counts.get(sel) || 0) + 1);
    }
    const dupes = [...counts].filter(([, n]) => n > 1).map(([s, n]) => `${s} (${n}x)`);
    assert.equal(dupes.length, 0, `${file} : sélecteurs en doublon — ${dupes.slice(0, 5).join(", ")}`);
  }
});

/* ── 4. Un sélecteur ne vit que dans une seule feuille ─────── */
test("aucun sélecteur migré n'est encore déclaré dans une ancienne feuille", () => {
  const migrated = new Set();
  for (const file of MIGRATED) selectorsOf(read(file)).forEach((s) => migrated.add(s));

  for (const file of cssFiles()) {
    if (MIGRATED.includes(file) || file === "design-tokens.css") continue;
    const collisions = [...new Set(selectorsOf(read(file)))].filter((s) => migrated.has(s));
    assert.equal(
      collisions.length,
      0,
      `${file} redéclare ${collisions.length} sélecteur(s) déjà migré(s) — à SUPPRIMER, pas à surcharger : ${collisions.slice(0, 6).join(", ")}`,
    );
  }
});

/* ── 5. Les alias de l'ancienne charte ont disparu ─────────── */
test("aucun alias de l'ancienne charte n'est utilisé", () => {
  const targets = [
    ...cssFiles().map((f) => ["src/" + f, read(f)]),
    ["index.html", fs.readFileSync(path.join(ROOT, "index.html"), "utf8")],
  ];
  for (const [label, content] of targets) {
    for (const token of DEAD_TOKENS) {
      const re = new RegExp(`var\\(\\s*${token}\\s*[,)]`, "g");
      const hits = (content.match(re) || []).length;
      assert.equal(hits, 0, `${label} utilise ${token} (${hits}x) — alias mort de l'ancienne charte`);
    }
  }
});

/* ── 6. La couleur ne s'écrit pas dans le HTML ─────────────── */
test("index.html ne pose aucune couleur en attribut style", () => {
  const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
  const hits = html.match(/style="[^"]*(?:color|background)[^"]*"/gi) || [];
  assert.equal(
    hits.length,
    0,
    `${hits.length} attribut(s) style= de couleur dans index.html — la couleur passe par classe : ${hits.slice(0, 3).join(" | ")}`,
  );
});

/* ── 7. Le corail n'est jamais un fond de bouton ───────────── */
test("aucun bouton n'a de fond corail", () => {
  assert.ok(!exists("styles.css") || !read("styles.css").includes(".btn-gold"), "styles.css déclare encore .btn-gold");
  const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
  assert.ok(!html.includes("btn-gold"), "index.html utilise encore .btn-gold — renommer en .btn-primary (bleu)");
});

/* ── 8. Le logo est l'image de marque du client, en 2 variantes ──
   Sens inversé le 26/07 : le client a restauré son logo d'origine
   depuis sa sauvegarde. La marque redevient une image. */
test("la marque est l'image du client, avec sa variante sombre", () => {
  const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
  assert.ok(html.includes("sidebar-brand-img"), "index.html n'utilise pas .sidebar-brand-img");
  assert.ok(
    !html.includes("sidebar-wordmark"),
    "index.html contient encore le wordmark typographique — remplacé par le logo du client",
  );
  assert.ok(html.includes("sr-only"), "le nom accessible de la marque a disparu du DOM");
  for (const f of ["structura-lockup.png", "structura-lockup-dark.png", "structura-mark.png"]) {
    assert.ok(fs.existsSync(path.join(ROOT, "assets", f)), `assets/${f} manquant`);
  }
});

/* ── 8 bis. Le relief passe par les tokens, jamais en dur ───── */
test("relief.css ne déclare aucune ombre ni animation en littéral", () => {
  if (!exists("relief.css")) return;
  const clean = read("relief.css").replace(/\/\*[\s\S]*?\*\//g, "");
  const shadows = (clean.match(/box-shadow:\s*[^;]+/gi) || []).filter(
    (v) => !/var\(--/.test(v) && !/\b(none|inherit)\b/.test(v),
  );
  assert.equal(
    shadows.length,
    0,
    `relief.css écrit des ombres en dur : ${shadows.slice(0, 3).join(" | ")} — passer par --shadow-*`,
  );
});

/* ── 9. Une information, un endroit ────────────────────────── */
test("l'exposition émetteur n'est affichée qu'une fois", () => {
  const analytics = fs.readFileSync(path.join(SRC, "modules/app-analytics.js"), "utf8");
  assert.ok(
    !analytics.includes("Exposition émetteur max"),
    "app-analytics.js affiche encore « Exposition émetteur max » — décision du 25/07 : cette lecture reste sur le Dashboard uniquement",
  );
});

/* ── 10. Les anciennes feuilles finissent supprimées ───────── */
test("les feuilles héritées sont supprimées quand les 3 passes sont faites", () => {
  const done = Object.values(STAGES).every(Boolean);
  if (!done) {
    console.log("    (passes restantes : " + Object.entries(STAGES).filter(([, v]) => !v).map(([k]) => k).join(", ") + ")");
    return;
  }
  assert.ok(!exists("styles.css"), "styles.css existe encore alors que les 4 passes sont marquées faites");
  assert.ok(!exists("institutional-theme.css"), "institutional-theme.css existe encore");
  const total = cssFiles().reduce((n, f) => n + (read(f).match(/!important/g) || []).length, 0);
  assert.equal(total, 0, `${total} !important restants dans src/*.css`);
});

/* ── 11. La couleur ne s'écrit pas dans le JS ──────────────
   Le test 6 ne regardait qu'index.html : les modules ont continué
   à poser des couleurs en attribut style pendant trois passes. */
test("aucun module ne pose de couleur en attribut style", () => {
  const dir = path.join(SRC, "modules");
  const offenders = [];
  for (const f of fs.readdirSync(dir).filter((n) => n.endsWith(".js"))) {
    const src = fs.readFileSync(path.join(dir, f), "utf8");
    const hits = src.match(/style="[^"]*(?:color|background)\s*:/gi) || [];
    if (hits.length) offenders.push(`${f} (${hits.length}x) — ex. ${hits[0]}`);
  }
  assert.equal(
    offenders.length,
    0,
    `couleur posée en JS — passer par une classe :\n  ${offenders.join("\n  ")}`,
  );
});

/* ── 12. Chaque token de couleur existe dans les deux thèmes ── */
test("aucun token de couleur n'est absent du thème sombre", () => {
  const css = read("design-tokens.css");
  const light = css.slice(css.indexOf(":root"), css.indexOf('[data-theme="dark"]'));
  const dark = css.slice(css.indexOf('[data-theme="dark"]'));
  const names = (s) => new Set((s.match(/--color-[a-z0-9-]+(?=\s*:)/gi) || []));
  const missing = [...names(light)].filter((n) => !names(dark).has(n));
  assert.equal(
    missing.length,
    0,
    `tokens sans valeur en sombre (valeur du thème clair sur fond sombre) : ${missing.join(", ")}`,
  );
});

/* ── 13. Les overlays ne vivent pas dans le flux ────────────
   Régression passe 4 : la modale et le calendrier s'affichaient
   empilés en bas de chaque page, faute de position fixed. */
test("chaque primitive d'overlay est positionnée hors du flux", () => {
  const css = read("overlays.css");
  for (const sel of [".overlay-scrim", ".modal", ".drawer"]) {
    const block = css.slice(css.indexOf(sel));
    const decl = block.slice(0, block.indexOf("}"));
    assert.match(decl, /position:\s*fixed/, `${sel} n'est pas en position: fixed`);
    assert.match(decl, /z-index:/, `${sel} n'a pas de z-index`);
  }
});

/* ── 14. Un état fermé sort réellement du flux ──────────────── */
test("les overlays fermés sont en display: none", () => {
  const css = read("overlays.css");
  assert.match(css, /\.modal(?![\w-])[^{]*\{[^}]*display:\s*none/,
    "la modale fermée doit être en display: none, pas seulement transparente");
});

/* ── 15. Une feuille CSS modifiée bumpe son ?v= ─────────────
   Passe 7C-3 : views.css réécrit, ?v= laissé à l'identique. Le
   navigateur/CDN a continué à servir l'ancienne feuille — la carte
   Coupons rendait des tirets de 1px, pas les barres livrées. Le
   correctif était juste ; ce test l'aurait attrapé avant le commit. */
test("toute feuille CSS modifiée depuis HEAD a un ?v= différent de HEAD", () => {
  const { execSync } = require("node:child_process");
  // "./index.html" (et non "index.html") : la racine git peut être un
  // dossier parent (ce dépôt vit dans un repo englobant) — le préfixe
  // le résout relativement à cwd plutôt qu'à la racine du dépôt.
  const git = (args) =>
    execSync(`git ${args}`, { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });

  let baseHtml;
  try {
    baseHtml = git("show HEAD:./index.html");
  } catch {
    return; // pas de commit précédent à comparer — rien à vérifier
  }

  const versionsOf = (html) => {
    const map = new Map();
    for (const m of html.matchAll(/href="\.\/src\/([\w.-]+\.css)\?v=([\w.-]+)"/g)) {
      map.set(m[1], m[2]);
    }
    return map;
  };
  const before = versionsOf(baseHtml);
  const after = versionsOf(fs.readFileSync(path.join(ROOT, "index.html"), "utf8"));

  let changedFiles = [];
  try {
    changedFiles = git("diff HEAD --name-only -- src/*.css")
      .split("\n")
      .map((line) => path.basename(line.trim()))
      .filter(Boolean);
  } catch {
    return;
  }

  const offenders = changedFiles.filter(
    (file) => before.has(file) && after.has(file) && before.get(file) === after.get(file),
  );
  assert.equal(
    offenders.length,
    0,
    `${offenders.join(", ")} : contenu modifié sans que son ?v= change dans index.html — bumper la version dans le même commit`,
  );
});
