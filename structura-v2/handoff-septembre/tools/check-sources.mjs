#!/usr/bin/env node
// check-sources — rend mécaniques R1 et R3, qui n'étaient que des promesses.
//
// Pourquoi ce fichier existe. Les constats A1 à A8 de l'audit du 09/08 sont la
// même panne répétée : le même contenu vit à deux endroits, et rien ne crie
// quand les deux divergent. Le gabarit spécifié deux fois (A1). La maquette de
// référence absente là où l'outil la cherche (A3). Le handoff en double, dépôt
// et poste (A7). La vérité recopiée trois fois (A6).
//
// Chaque fois, la réponse a été une règle de plus. Or une règle sans code de
// sortie est une promesse de lire le bon fichier, et les promesses ont échoué
// six fois. `check-tokens.mjs` est la seule qui ait tenu — parce qu'elle sort 1.
//
// Deux contrôles, un par panne qui a coûté une journée :
//
//  1. R1 — un chemin cité dans une spec doit exister depuis la racine du dépôs de lot disaient
//     `handoff-septembre/specs/…`, qui ne se résout pas depuis la racine.
//
//  2. R3 — un document déclaré périmé ne doit plus être là pour être trouvé.
//     Le § 4 du contrat gouverne ce qu'on DONNE, pas ce qu'on TROUVE. Un grep
//     sur « control-band » tombait sur PASSE-8.md, que la doctrine écrase.
//
// Sortie 0 = vert. Sortie 1 = un chemin ment, avec fichier et ligne.

import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

// Le script trouve la racine du dépôt lui-même, au lieu d'exiger un dossier de
// lancement. Exiger une origine, c'est refaire la panne A7 dans l'outil qui la
// contrôle : check-tokens.mjs veut structura-v2/, ce contrôle voulait la
// racine, et le contrat donnait la même commande pour les deux.
function trouveRacine() {
  let d = process.cwd();
  for (let i = 0; i < 8; i++) {
    if (existsSync(join(d, "structura-v2", "handoff-septembre"))) return d;
    if (existsSync(join(d, "handoff-septembre")) && /structura-v2$/.test(d)) return join(d, "..");
    const parent = join(d, "..");
    if (parent === d) break;
    d = parent;
  }
  return null;
}

const ROOT = trouveRacine();
if (!ROOT) {
  console.error("✗ Racine du dépôt introuvable — lance ce script depuis le dépôt (n'importe où dedans).");
  process.exit(1);
}

const HANDOFF = "structura-v2/handoff-septembre";

// ── Périmés. Un nom entre ici le jour où il est déclaré mort, et il n'en sort
//    jamais. La liste nomme, elle ne juge pas.
const PERIMES = [
  "structura-v2/PASSE-1.md", "structura-v2/PASSE-2.md", "structura-v2/PASSE-3.md",
  "structura-v2/PASSE-4.md", "structura-v2/PASSE-5.md", "structura-v2/PASSE-6.md",
  "structura-v2/PASSE-7A-corrections.md", "structura-v2/PASSE-7A-corrections-2.md",
  "structura-v2/handoff 7/PASSE-8.md", "structura-v2/handoff 7/REFERENCE-PRODUITS.md",
  "structura-v2/CLAUDE.md",
  `${HANDOFF}/specs/dashboard-correctif-01.md`,
];

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name.startsWith(".")) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(md|mjs)$/.test(name)) out.push(p);
  }
  return out;
}

const morts = PERIMES.filter((p) => existsSync(join(ROOT, p)));

// ── Contrôle 1 : les chemins cités dans les specs et messages de lot.
// On ne retient que ce qui ressemble sans ambiguïté à un chemin de ce dépôt.
// Trop large, le contrôle crie pour rien et on cesse de le lancer — c'est ainsi
// qu'un garde-fou meurt.
const CITATION = /`((?:structura-v2\/|handoff-septembre\/|specs\/|src\/|tools\/|maquette\/|tests\/)[A-Za-z0-9 _./-]+\.[a-z]{2,4})`/g;

const fantomes = [];
for (const file of walk(join(ROOT, HANDOFF))) {
  if (/check-sources\.mjs$/.test(file)) continue;
  const rel = relative(ROOT, file);
  readFileSync(file, "utf8").split("\n").forEach((line, i) => {
    if (/périmé|perime|à jeter|n'existe pas|jamais|supprim/i.test(line)) return;
    for (const m of line.matchAll(CITATION)) {
      const cite = m[1];
      if (existsSync(join(ROOT, cite))) continue;
      // Un chemin qui se résout depuis la racine OU depuis structura-v2/
      // désigne un fichier RÉEL : le lecteur le trouve. Ce n'est pas une panne,
      // c'est une convention d'écriture. Seul un chemin qui ne désigne AUCUN
      // fichier est une vraie erreur.
      if (existsSync(join(ROOT, "structura-v2", cite))) continue;
      fantomes.push({ rel, ligne: i + 1, cite });
    }
  });
}

if (!morts.length && !fantomes.length) {
  console.log("✓ check-sources vert — aucun périmé dans l'arbre, aucun chemin cité qui ne se résout pas depuis la racine.");
  process.exit(0);
}

if (morts.length) {
  console.error(`✗ check-sources rouge — ${morts.length} document(s) périmé(s) encore présent(s) :\n`);
  for (const m of morts) console.error(`  ${m}`);
  console.error(`\nLe § 4 du contrat gouverne ce qu'on DONNE, pas ce qu'on TROUVE.`);
  console.error(`Tant qu'ils sont là, un grep les trouve et ils contredisent la doctrine.`);
}

if (fantomes.length) {
  console.error(`\n✗ check-sources rouge — ${fantomes.length} chemin(s) cité(s) qui n'existe(nt) pas :\n`);
  for (const f of fantomes) {
    console.error(`  ${f.rel}:${f.ligne}  ${f.cite}`);
    console.error(`      → ne désigne aucun fichier, ni depuis la racine ni depuis structura-v2/.`);
    console.error(`        Soit il n'est pas commité (R1), soit le nom est faux.`);
  }
}

process.exit(1);
