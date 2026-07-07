const assert = require("node:assert/strict");

globalThis.StructuraDomain = require("../src/modules/structura-domain.js");
const schema = require("../src/modules/product-schema.js");

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

test("normalize document extraction into canonical product", () => {
  const product = schema.fromExtraction({
    productName: "Phoenix Worst-of LVMH Airbus",
    isin: "FR001400TEST",
    type: "Phoenix",
    issuer: "BNP Paribas",
    underlying: "LVMH; Airbus",
    couponPct: 8,
    couponPeriod: "trimestriel",
    barrierPct: 60,
    recallPct: 100,
    maturityDate: "2030-06-16",
    nominal: 1000000,
    scheduleData: [{ date: "2027-06-16", recallLevel: 100 }],
  });

  assert.equal(product.schemaVersion, schema.SCHEMA_VERSION);
  assert.equal(product.classification.productFamily, "phoenix");
  assert.equal(product.economics.couponPerPeriodPct, 2);
  assert.equal(product.barriers.protectionPct, 60);
  assert.equal(product.underlyings.length, 2);
  assert.equal(product.quality.isImportable, true);
});

test("remove non-applicable barrier mechanics from CLN", () => {
  const product = schema.fromExtraction({
    type: "Credit Linked Note",
    issuer: "Morgan Stanley",
    referenceEntity: "Renault SA",
    couponPct: 5.5,
    barrierPct: 60,
    maturityDate: "2029-12-31",
  });

  assert.equal(product.classification.productFamily, "cln");
  assert.equal(product.barriers.protectionPct, null);
  assert.equal(product.quality.errors.length, 0);
  assert.match(product.quality.warnings.join(" "), /ISIN absent/);
});

test("convert canonical product to current portfolio shape", () => {
  const product = schema.fromManualForm({
    name: "Athena Euro Stoxx 50",
    type: "Athena",
    issuer: "Société Générale",
    underlying: "EURO STOXX 50",
    annualCouponPct: 9,
    frequency: "annuel",
    nominal: 500000,
    maturityDate: "2031-01-15",
  });
  const legacy = schema.canonicalToPortfolioProduct(product, {
    id: 42,
    helpers: {
      isoDate: (date) => new Date(date).toISOString().slice(0, 10),
      addMonths: (date) => date,
      addYears: (date) => date,
    },
  });

  assert.equal(legacy.id, 42);
  assert.equal(legacy.name, "Athena Euro Stoxx 50");
  assert.equal(legacy.emetteur, "Société Générale");
  assert.equal(legacy.cpnNum, 9);
  assert.equal(legacy.canonicalProduct.schemaVersion, schema.SCHEMA_VERSION);
});
