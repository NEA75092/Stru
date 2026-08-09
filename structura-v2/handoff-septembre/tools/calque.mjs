// calque.mjs — compare le rendu de l'app à celui de la maquette, propriété par
// propriété, dans le même navigateur et à la même largeur.
//
// Raison d'être : les défauts du 06/08 (échelle des barres d'écart, calibre de trame,
// étiquettes dans la barre empilée) sont tous passés par le même trou — une maquette
// traduite en prose, puis la prose retraduite en code. Ce script supprime les deux
// traductions : la maquette est lue telle qu'elle rend.
//
//   node tools/calque.mjs --app http://localhost:5173
//   node tools/calque.mjs --app http://localhost:5173 --only 2.2
//
// ── Règle d'écriture de ce fichier, apprise en le cassant ────────────────────────
// La v1 du plan portait `n: 5` sur § 2.1, chiffre recopié du rapport de sonde — qui
// décrit L'APP. La maquette en montre 3. Le plan affirmait donc sur la maquette une
// chose lue ailleurs : la faute même que l'outil doit rendre impossible, commise dans
// l'outil. D'où l'invariant :
//
//   LE PLAN NE CONTIENT AUCUN CHIFFRE. Il nomme des éléments et des propriétés.
//   Toute valeur attendue est lue sur la maquette à l'exécution.
//
// Un chiffre écrit ici est une régression, quelle que soit sa justesse apparente.

import { chromium } from "playwright";
import { pathToFileURL, fileURLToPath } from "node:url";
import { resolve, dirname } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
// La maquette est désormais l'app entière (`Structura.dc.html`), une vue à la
// fois, Dashboard par défaut — d'où la disparition des préfixes `data-screen-label`
// dans le plan : les ancres § 2.1 à § 2.3 sont toutes sur la vue de départ.
const MAQUETTE = pathToFileURL(
  resolve(HERE, "../maquette/Structura.dc.html"),
).href;
const LARGEUR = 1560; // largeur de dessin de la maquette ($preview)

const args = Object.fromEntries(
  process.argv.slice(2).reduce((a, v, i, arr) => {
    if (v.startsWith("--")) a.push([v.slice(2), arr[i + 1]?.startsWith("--") ? true : arr[i + 1]]);
    return a;
  }, []),
);
if (!args.app) {
  console.error("usage : node tools/calque.mjs --app <url de l'app> [--only 2.2]");
  process.exit(2);
}

// ── Ce qui est comparé ───────────────────────────────────────────────────────────
//
// `forme`   : propriétés comparées SANS tenir compte du nombre d'éléments. On vérifie
//             que l'app n'emploie aucune valeur que la maquette n'emploie pas. C'est
//             la bonne comparaison quand la maquette illustre 3 lignes et que l'app en
//             affiche 5 : la hauteur d'une rainure ne dépend pas du nombre de rainures.
//
// `loi`     : invariant de proportion (largeur ∝ valeur). Indépendant du jeu de
//             données affiché, donc comparable entre une maquette de démo et une app
//             en service — ce qu'une largeur en pixels n'est pas.
//
// `compte`  : "exact" quand le nombre est lui-même l'invariant (§ 2.3 : aucune
//             étiquette dans la barre). "libre" partout ailleurs.

// ── Le contrat de nommage ───────────────────────────────────────────────────────
//
// UNE SEULE ANCRE PAR CAS, la même des deux côtés : `data-calque="…"`.
//
// La v1 nommait des classes CSS côté app (`.protection-row`, `.risk-stack`) devinées
// depuis la spec. L'app emploie `.cap-row`, `.dash-risk-*` : les sélecteurs ne
// correspondaient à rien, et le script s'est tu au lieu de crier — § 2.1 et § 2.3 ont
// affiché « rien à signaler » sur des cartes qu'il n'avait pas trouvées (relevé par
// Claude Code le 06/08). Deviner un nom de classe couple le contrôle à un détail que
// personne ne s'est engagé à stabiliser.
//
// L'app porte donc les mêmes `data-calque` que la maquette. C'est le seul contrat de
// nommage entre les deux, il est explicite, et un renommage CSS ne peut plus le casser.
// Corollaire appliqué plus bas : un sélecteur sans correspondance côté app est une
// DIVERGENCE, jamais un silence.

const A = (nom) => `[data-calque="${nom}"]`;

const PLAN = [
  {
    id: "2.1",
    nom: "Sous la protection du capital — rainure",
    cas: [
      {
        quoi: "rainure",
        maq: A("groove"),
        app: A("groove"),
        forme: ["height", "borderRadius", "backgroundColor"],
      },
      {
        quoi: "segment franchi",
        maq: A("breach"),
        app: A("breach"),
        // `backgroundImage` porte C3 : trame ou aplat. La largeur dépend de la donnée
        // de chaque ligne — hors de portée d'une comparaison de forme.
        forme: ["height", "backgroundImage", "boxShadow"],
      },
      {
        quoi: "encoche de barrière",
        maq: A("notch"),
        app: A("notch"),
        forme: ["width", "opacity", "backgroundColor"],
      },
    ],
  },
  {
    id: "2.2",
    nom: "Écarts de VL",
    cas: [
      {
        quoi: "ligne",
        maq: A("vl-row"),
        app: A("vl-row"),
        forme: ["height", "gap"],
      },
      {
        quoi: "barre d'écart",
        maq: A("vl-bar"),
        app: A("vl-bar"),
        forme: ["height", "backgroundImage", "boxShadow"],
      },
      {
        // C1 ne demande pas une largeur, il demande une LOI : largeur ∝ |écart|.
        // Comparer des largeurs en pixels entre la maquette (jeu de démo fixe) et
        // l'app (données réelles) ne compare pas deux calculs, ça compare deux jeux :
        // ça diverge toujours, donc ça finit ignoré. Le rapport largeur/|écart| est
        // constant quel que soit le jeu — c'est ça, l'invariant, et il se vérifie
        // d'abord sur la maquette avant d'être exigé de l'app.
        quoi: "loi d'échelle des barres",
        maq: A("vl-row"),
        app: A("vl-row"),
        loi: {
          barre: A("vl-bar"),
          valeur: A("vl-val"),
          plancher: 3, // px — les barres au plancher sortent légitimement de la loi
        },
      },
    ],
  },
  {
    id: "2.3",
    nom: "Distribution du risque",
    cas: [
      {
        quoi: "segment de barre empilée",
        maq: A("risk-seg"),
        app: A("risk-seg"),
        forme: ["height", "backgroundImage", "boxShadow"],
      },
      {
        // Correctif 01 · C4 : aucun texte dans la barre empilée.
        //
        // La v1 comptait les éléments portant une ancre `risk-seg-label` et exigeait
        // le même nombre des deux côtés. Elle sortait 0 = 0 pendant que l'app affichait
        // « 85,2 % » au milieu du segment : le pourcentage est un nœud texte DIRECT du
        // segment, pas un élément dédié. Le test prouvait l'absence d'une balise que
        // personne n'avait écrite, jamais l'absence du texte (relevé par Claude Code,
        // capture à l'appui, 06/08).
        //
        // On lit donc le texte, pas le balisage. Une ancre qu'il suffit de ne pas poser
        // pour passer le test ne teste rien.
        quoi: "texte dans la barre empilée",
        maq: A("risk-seg"),
        app: A("risk-seg"),
        texteVide: true,
      },
      // La pastille de légende est RETIRÉE du plan : « Où est l'encours » désigne
      // désormais ses zones par la couleur du libellé, plus par un carré de trame.
      // Viser un élément qui n'existe plus fait sortir l'outil rouge à chaque
      // passage, et un rapport toujours rouge finit par ne plus être lu.
    ],
  },
  // § 2.4 n'est pas câblé : la maquette n'a pas encore de `data-calque` sur le gabarit
  // de contrôles. Il est vérifié conforme par la sonde du 06/08 ; à instrumenter quand
  // on y retouchera. Un plan qui prétend couvrir ce qu'il ne couvre pas est pire que
  // rien — c'est la faute que cet outil existe pour supprimer.
];

// ── Lecture ──────────────────────────────────────────────────────────────────────

const releve = (page, sel, props) =>
  page.$$eval(
    sel,
    (els, props) =>
      els.map((el) => {
        const cs = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        const o = { width: Math.round(r.width), height: Math.round(r.height) };
        for (const p of props) {
          o[p] = p === "textContent" ? el.textContent.trim().replace(/\s+/g, " ") : cs[p];
        }
        return o;
      }),
    props,
  );

// Une trame se compare par sa nature, pas par sa chaîne : le correctif ne pose qu'une
// question sur ce fond — trame ou aplat.
const nature = (v) =>
  typeof v === "string" && v.includes("gradient")
    ? v.includes("repeating-linear-gradient")
      ? "TRAME"
      : "APLAT"
    : String(v);

const proche = (a, b, tol) => {
  const na = parseFloat(a), nb = parseFloat(b);
  if (Number.isFinite(na) && Number.isFinite(nb) && String(a).match(/^[\d.-]+px$|^[\d.-]+$/))
    return Math.abs(na - nb) <= (tol ?? 0);
  return nature(a) === nature(b);
};

// Relevé d'une loi d'échelle : pour chaque ligne, la valeur écrite et la largeur de sa
// barre. On ne lit aucune valeur attendue — on lit ce que la page montre, des deux
// côtés, et on vérifie que le rapport est le même partout.
const releveLoi = (page, selLigne, selBarre, selValeur, plancher) =>
  page.$$eval(
    selLigne,
    (lignes, [selBarre, selValeur, plancher]) =>
      lignes
        .map((ligne) => {
          const b = ligne.querySelector(selBarre);
          const v = ligne.querySelector(selValeur);
          if (!b || !v) return null;
          // − U+2212, virgule décimale, espaces fines : format français de la spec.
          const n = parseFloat(
            v.textContent.trim().replace(/\u2212|–/g, "-").replace(",", ".").replace(/[^\d.-]/g, ""),
          );
          const w = b.getBoundingClientRect().width;
          if (!Number.isFinite(n) || n === 0 || w <= plancher + 0.5) return null;
          return { v: Math.abs(n), w };
        })
        .filter(Boolean),
    [selBarre, selValeur, plancher],
  );

// Écart relatif du rapport largeur/|valeur| — 0 si la loi est parfaitement suivie.
const dispersion = (paires) => {
  if (paires.length < 2) return 0;
  const r = paires.map((p) => p.w / p.v);
  const moy = r.reduce((a, b) => a + b, 0) / r.length;
  return moy === 0 ? 0 : (Math.max(...r) - Math.min(...r)) / moy;
};

// ── Préparation des pages ─────────────────────────────────────────────────────────
//
// Les barres portent `animation: scan 680ms ... both` avec `transform-origin: right`,
// et § 2.1 y ajoute un délai par ligne. Un rectangle lu pendant l'animation est un
// rectangle sous `scaleX` : on mesurerait la transition au lieu du dessin, sur la
// propriété même que ce correctif traite. Animations neutralisées, puis attendues.

async function poser(page, url) {
  await page.goto(url, { waitUntil: "networkidle" });
  await page.addStyleTag({
    content: `*, *::before, *::after {
      animation-duration: 0s !important; animation-delay: 0s !important;
      transition-duration: 0s !important; transition-delay: 0s !important;
    }`,
  });
  await page.evaluate(() =>
    Promise.all(document.getAnimations().map((a) => a.finished.catch(() => {}))),
  );
  await page.evaluate(() => new Promise(requestAnimationFrame));
}

// ── Exécution ────────────────────────────────────────────────────────────────────

const nav = await chromium.launch();
const ctx = await nav.newContext({
  viewport: { width: LARGEUR, height: 1400 },
  reducedMotion: "reduce",
});
const [pm, pa] = [await ctx.newPage(), await ctx.newPage()];

await pm.goto(MAQUETTE, { waitUntil: "networkidle" });
await pm.waitForSelector("[data-calque]", { timeout: 15000 });
await poser(pm, MAQUETTE);
await poser(pa, args.app);

let divergences = 0;
const dire = (s) => (divergences++, console.log(s));
const note = (s) => console.log(s);

for (const sec of PLAN) {
  if (args.only && args.only !== true && sec.id !== args.only) continue;
  console.log(`\n§ ${sec.id} — ${sec.nom}`);

  for (const c of sec.cas) {
    // ── Texte interdit ───────────────────────────────────────────────────────────
    // L'invariant est lu sur la maquette : si elle ne met aucun texte dans l'élément,
    // l'app n'en met pas non plus. Aucune valeur écrite dans le plan.
    if (c.texteVide) {
      const lire = (page, sel) =>
        page.$$eval(sel, (els) =>
          els.map((el) =>
            [...el.childNodes]
              .filter((n) => n.nodeType === 3)
              .map((n) => n.textContent)
              .join(" ")
              .trim()
              .replace(/\s+/g, " "),
          ),
        );
      const tm = await lire(pm, c.maq);
      const ta = await lire(pa, c.app);
      if (tm.length === 0) {
        dire(`  ⚠ ${c.quoi} : introuvable dans la MAQUETTE (${c.maq}). Corriger le plan.`);
        continue;
      }
      if (ta.length === 0) {
        dire(`  ✗ ${c.quoi} : 0 dans l'app, ${tm.length} dans la maquette (${c.app}).`);
        continue;
      }
      const pleinsM = tm.filter(Boolean);
      if (pleinsM.length) {
        dire(`  ⚠ ${c.quoi} : la MAQUETTE porte du texte (${pleinsM.join(" | ")}).`);
        dire(`     L'invariant ne tient plus — c'est la maquette ou le plan qu'il faut reprendre.`);
        continue;
      }
      const pleinsA = ta.filter(Boolean);
      if (pleinsA.length)
        dire(
          `  ✗ ${c.quoi} · ${pleinsA.length} segment(s) sur ${ta.length} portent du texte : ` +
            pleinsA.map((t) => `« ${t} »`).join("  ") +
            `\n     La maquette n'en met aucun. La légende porte les nombres (C4).`,
        );
      continue;
    }

    // ── Loi d'échelle ──────────────────────────────────────────────────────
    if (c.loi) {
      const { barre, valeur, plancher } = c.loi;
      const pm_ = await releveLoi(pm, c.maq, barre, valeur, plancher);
      const pa_ = await releveLoi(pa, c.app, barre, valeur, plancher);

      if (pm_.length < 2) {
        dire(`  ⚠ ${c.quoi} : la maquette n'expose pas 2 barres mesurables (${c.maq}).`);
        dire(`     Sans référence, la loi ne peut pas être établie — corriger le plan.`);
        continue;
      }
      const dm = dispersion(pm_);
      if (dm > 0.02) {
        dire(`  ⚠ ${c.quoi} : la MAQUETTE elle-même ne suit pas la loi (dispersion ${(dm * 100).toFixed(1)} %).`);
        dire(`     C'est la maquette ou le plan qui est en faute, pas l'app. Ne rien corriger côté app.`);
        continue;
      }
      if (pa_.length < 2) {
        dire(`  ✗ ${c.quoi} : 0 ou 1 barre mesurable dans l'app (${c.app} › ${barre}).`);
        continue;
      }
      const da = dispersion(pa_);
      if (da > 0.02) {
        dire(
          `  ✗ ${c.quoi} · largeur non proportionnelle à l'écart.\n` +
            `     maquette : rapport constant à ${(dm * 100).toFixed(1)} % près sur ${pm_.length} barres\n` +
            `     app      : dispersion ${(da * 100).toFixed(1)} % sur ${pa_.length} barres\n` +
            `     échantillon app (écart → px) : ` +
            pa_.slice(0, 4).map((p) => `${p.v}→${Math.round(p.w)}`).join("  "),
        );
      }
      continue;
    }

    const props = [...(c.forme ?? []), ...(c.rangee ?? [])];
    const [m, a] = [await releve(pm, c.maq, props), await releve(pa, c.app, props)];

    if (m.length === 0 && c.compte !== "exact") {
      dire(`  ⚠ ${c.quoi} : introuvable dans la MAQUETTE (${c.maq}).`);
      dire(`     Ancrage data-calque absent ou renommé — corriger le plan, pas l'app.`);
      continue;
    }
    if (c.compte === "exact" && a.length !== m.length) {
      dire(`  ✗ ${c.quoi} : ${a.length} dans l'app, ${m.length} dans la maquette.`);
      continue;
    }
    // Absence n'est pas conformité. Sans ce test, un sélecteur côté app qui ne
    // correspond à rien donne un tableau vide, donc aucun fautif, donc un silence que
    // le total final compte comme un succès. C'est exactement la faute que R7 nomme —
    // « la carte mesurée n'existe nulle part » — reproduite dans l'outil censé
    // l'empêcher. Relevé par Claude Code le 06/08 sur § 2.1 et § 2.3.
    if (a.length === 0 && m.length > 0) {
      dire(`  ✗ ${c.quoi} : 0 dans l'app, ${m.length} dans la maquette.`);
      dire(`     Sélecteur « ${c.app} » sans correspondance. Soit l'élément manque,`);
      dire(`     soit le plan vise un nom de classe que l'app n'emploie pas.`);
      continue;
    }

    // Forme — indépendante du nombre. L'app ne doit employer aucune valeur absente
    // du vocabulaire de la maquette.
    for (const p of ["height", ...(c.forme ?? [])]) {
      const vocab = [...new Set(m.map((x) => nature(x[p])))];
      const fautifs = [...new Set(a.map((x) => nature(x[p])))].filter(
        (v) => !vocab.some((w) => proche(w, v, c.tol?.[p])),
      );
      if (fautifs.length)
        dire(
          `  ✗ ${c.quoi} · ${p}\n` +
            `     maquette : ${vocab.join(" | ")}\n` +
            `     app      : ${fautifs.join(" | ")}`,
        );
    }

    // Rang par rang — seulement si les deux côtés montrent le même jeu.
    if (c.rangee?.length) {
      if (m.length !== a.length) {
        note(
          `  · ${c.quoi} : ${m.length} dans la maquette, ${a.length} dans l'app —` +
            ` comparaison rang par rang sautée (${c.rangee.join(", ")}).`,
        );
        if (c.etale) {
          // À défaut de comparer rang par rang, on vérifie au moins que la propriété
          // VARIE quand la maquette la fait varier. C'est ce contrôle-là qui aurait
          // attrapé les dix barres identiques.
          const varieM = new Set(m.map((x) => x[c.etale])).size > 1;
          const varieA = new Set(a.map((x) => x[c.etale])).size > 1;
          if (varieM && !varieA)
            dire(
              `  ✗ ${c.quoi} · ${c.etale} constant sur les ${a.length} éléments de l'app,` +
                ` variable dans la maquette.\n` +
                `     Une barre qui ne varie pas avec sa valeur ne porte aucune information.`,
            );
        }
      } else {
        for (let i = 0; i < m.length; i++)
          for (const p of c.rangee)
            if (!proche(m[i][p], a[i][p], c.tol?.[p]))
              dire(
                `  ✗ ${c.quoi} [${i}] · ${p} — maquette ${nature(m[i][p])}, app ${nature(a[i][p])}`,
              );
      }
    }
  }
}

await nav.close();

console.log(
  divergences === 0
    ? "\n✓ L'app calque la maquette sur tout ce que le plan couvre.\n"
    : `\n${divergences} divergence(s). Chacune est un point où l'app et la maquette ne montrent pas la même chose.\n`,
);
process.exit(divergences === 0 ? 0 : 1);
