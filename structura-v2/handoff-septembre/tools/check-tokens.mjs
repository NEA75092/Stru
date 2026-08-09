#!/usr/bin/env node
// check-tokens — le garde-fou partagé designer / implémenteur.
//
// Deux contrôles, nés de deux erreurs réelles :
//
//  1. Nom inexistant. Le 05/08, une spec a nommé quatre tokens qui n'existaient
//     pas (--arete, --creux, --chaux-haut, --encre-douce). L'implémenteur s'est
//     arrêté au titre de R6, ce qui était juste, mais l'aller-retour a coûté une
//     demi-journée.
//  2. Token du système absent du bloc local d'une maquette. Le même jour,
//     Portefeuille.dc.html employait var(--color-border) sans le déclarer : les
//     14 séparateurs du gabarit de contrôles retombaient à `0px none`, sans
//     erreur console, sans rien à voir dans le code. La maquette de référence
//     contredisait la spec qu'elle illustrait.
//
// Le contrôle 1 seul n'aurait pas attrapé le second cas : --color-border EST
// déclaré dans le système. C'est pour ça qu'il y en a deux.
// Ce script rend la faute impossible à livrer : il refuse tout nom de token de
// couleur qui n'est pas déclaré dans src/design-tokens.css.
//
//   node handoff-septembre/tools/check-tokens.mjs
//   node handoff-septembre/tools/check-tokens.mjs handoff-septembre/specs/dashboard.md src/dashboard.css
//
// Sans argument : vérifie toutes les specs + toutes les feuilles de src/.
// Sortie 0 = vert. Sortie 1 = un nom n'existe pas, avec fichier et ligne.
//
// 09/08 — passage d'une liste noire à une liste blanche. La liste noire
// laissait passer deux bruits : la notation générique de prose (`--color-*`,
// `--color-surface-*`, écrite en toutes lettres dans une spec ou un
// commentaire) et les propriétés CSS locales posées à l'exécution par JS
// (`--tone`, `--dot`, `--at`, `--mx`, `--my`, `--pitch-header-h`,
// `--view-enter-y`, `--dur`) — ce ne sont pas des tokens de design, elles
// n'ont jamais eu à être déclarées dans design-tokens.css.

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const TOKENS_FILE = "src/design-tokens.css";

// Liste blanche : seuls ces noms sont des tokens de rôle, donc les seuls
// que ce script contrôle. Tout le reste (propriétés locales posées par JS,
// notation générique de prose) est hors de son périmètre par construction.
const ALLOWED_PREFIXES = ["--color-", "--font-", "--space-", "--radius-"];
const ALLOWED_EXACT = new Set(["--lumiere", "--chaux", "--encre", "--mer", "--ocre", "--terracotta", "--olive", "--rule", "--grain"]);

function isRoleToken(name) {
  if (name.endsWith("-") || name.includes("*")) return false; // notation générique de prose
  return ALLOWED_PREFIXES.some((p) => name.startsWith(p)) || ALLOWED_EXACT.has(name);
}

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name.startsWith(".")) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(css|md|js|mjs|html)$/.test(name)) out.push(p);
  }
  return out;
}

let src;
try {
  src = readFileSync(join(ROOT, TOKENS_FILE), "utf8");
} catch {
  console.error(`✗ ${TOKENS_FILE} introuvable. Lance ce script depuis structura-v2/.`);
  process.exit(1);
}

const declared = new Set([...src.matchAll(/^\s*(--[a-z0-9-]+)\s*:/gim)].map((m) => m[1]));
if (declared.size === 0) {
  console.error(`✗ Aucun token déclaré trouvé dans ${TOKENS_FILE}. Le script est cassé, pas le code.`);
  process.exit(1);
}

const args = process.argv.slice(2);
const files = args.length
  ? args
  : [...walk(join(ROOT, "src")), ...walk(join(ROOT, "handoff-septembre"))].filter((p) => !p.endsWith("check-tokens.mjs"));

const problems = [];
const localProblems = [];
for (const file of files) {
  const text = readFileSync(file, "utf8");
  text.split("\n").forEach((line, i) => {
    for (const m of line.matchAll(/--[a-z0-9*-]{2,}/g)) {
      const name = m[0];
      if (!isRoleToken(name)) continue;
      if (declared.has(name)) continue;
      // Une ligne de mapping documente volontairement un nom fautif.
      if (/nom fautif|à utiliser|à ajouter|fautif \(v1\)/i.test(line)) continue;
      problems.push({ file: relative(ROOT, file), line: i + 1, name, text: line.trim().slice(0, 110) });
    }
  });

  // Second contrôle — une maquette .dc.html est autonome : elle ne charge pas
  // design-tokens.css. Tout var(--x) qu'elle emploie doit être déclaré DANS le
  // fichier, sinon la propriété est invalide et retombe silencieusement à sa
  // valeur initiale (constat du 05/08 : 14 bordures du gabarit de contrôles à
  // 0px none parce que --color-border manquait au bloc local).
  if (file.endsWith(".dc.html")) {
    const localDecl = new Set([...text.matchAll(/(--[a-z0-9-]+)\s*:/g)].map((m) => m[1]));
    const counts = new Map();
    for (const m of text.matchAll(/var\((--[a-z0-9-]+)/g)) counts.set(m[1], (counts.get(m[1]) || 0) + 1);
    for (const [name, count] of counts) {
      if (!isRoleToken(name)) continue;
      if (localDecl.has(name)) continue;
      localProblems.push({ file: relative(ROOT, file), name, count });
    }
  }
}

if (problems.length === 0 && localProblems.length === 0) {
  console.log(`✓ check-tokens vert — ${declared.size} tokens déclarés, ${files.length} fichiers scannés, aucun nom inconnu, aucune maquette incomplète.`);
  process.exit(0);
}

if (problems.length) {
  console.error(`✗ check-tokens rouge — ${problems.length} référence(s) à un token non déclaré dans ${TOKENS_FILE} :\n`);
  for (const p of problems) console.error(`  ${p.file}:${p.line}  ${p.name}\n      ${p.text}`);
  console.error(`\nDeux issues, pas trois : soit le nom est faux (corrige-le), soit le token doit`);
  console.error(`exister (déclare-le dans ${TOKENS_FILE} avec son rôle en commentaire). Ne devine pas — R6.`);
}

if (localProblems.length) {
  console.error(`\n✗ check-tokens rouge — ${localProblems.length} token(s) du système employé(s) dans une maquette sans y être déclaré(s) :\n`);
  for (const p of localProblems) console.error(`  ${p.file}  var(${p.name}) × ${p.count} — absent du bloc de tokens de la maquette`);
  console.error(`\nUn .dc.html est autonome : il ne charge pas design-tokens.css. Un var() non déclaré`);
  console.error(`localement ne tombe pas en erreur, il rend la propriété invalide et silencieusement`);
  console.error(`inerte — une bordure disparaît sans que rien ne le signale (constat 05/08, Portefeuille :`);
  console.error(`14 séparateurs du gabarit de contrôles à 0px none). Recopie la déclaration depuis`);
  console.error(`${TOKENS_FILE}, à l'identique.`);
}

process.exit(1);
