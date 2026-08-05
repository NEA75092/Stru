const assert = require("node:assert/strict");

globalThis.StructuraDomain = require("../src/modules/structura-domain.js");
require("../src/modules/app-utils.js");
const schema = require("../src/modules/product-schema.js");
const state = require("../src/modules/app-state.js");
const calendar = require("../src/modules/app-calendar.js");

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

// Régression exacte du bug relevé passe 8, §3.6 : une observation
// d'autocall avec seuil de rappel produit le libellé "Obs. rappel
// (65%)" (product-schema.js, nextEvent()) — ce libellé contient
// "rappel" et se classait donc en Rappel par simple correspondance de
// texte, alors que normalizeEvents() avait déjà typé l'événement
// "autocall_observation" (une Constatation qui n'a pas encore eu lieu,
// pas un rappel confirmé). C'est justement ce que la taxonomie par
// donnée doit rendre impossible : le type vient de la source, jamais
// du texte du libellé.
test("autocall observation with recall level stays a constatation, never a rappel", () => {
  const canonical = schema.fromExtraction({
    productName: "Phoenix Worst-of LVMH",
    type: "Phoenix",
    issuer: "BNP Paribas",
    underlying: "LVMH",
    couponPct: 8,
    barrierPct: 60,
    recallPct: 100,
    maturityDate: "2030-06-16",
    nominal: 1000000,
    scheduleData: [{ date: "2027-06-16", recallLevel: 65 }],
  });
  const legacy = schema.canonicalToPortfolioProduct(canonical, { id: 1 });

  // La source produit bien le libellé piégeux et le type structuré.
  assert.equal(legacy.nextEvt, "Obs. rappel (65 %)");
  assert.equal(legacy.nextEvtType, "autocall_observation");

  const product = state.normalizeProduct(legacy);
  const schedule = calendar.buildProductFullSchedule(product);
  const event = schedule.find((e) => e._dateIso === product.nextEvtDate);

  assert.ok(event, "l'événement de nextEvtDate doit exister dans l'échéancier");
  assert.equal(event.type, "obs", "doit être classé Constatation, pas Rappel");
  assert.equal(
    event.cashflow,
    undefined,
    "une Constatation ne porte jamais de capital/coupon/total",
  );
});

test("a confirmed coupon event still carries its cash amount", () => {
  const legacy = state.normalizeProduct({
    id: 2,
    name: "Note Test",
    type: "AC",
    nominal: 1000000,
    cpnNum: 8,
    barrier: 60,
    dist: 12,
    maturity: "2030-01-01",
    nextEvt: "Coupon conditionnel",
    nextEvtType: "coupon",
    nextEvtDate: "2027-01-01",
    underlying: "CAC 40",
  });
  const schedule = calendar.buildProductFullSchedule(legacy);
  const event = schedule.find((e) => e._dateIso === "2027-01-01");

  assert.ok(event, "l'événement du 2027-01-01 doit exister");
  assert.equal(event.type, "coupon");
  assert.ok(event.amt, "un Coupon doit porter un montant");
  assert.equal(event.level, undefined, "un Coupon ne porte jamais de niveau");
});
