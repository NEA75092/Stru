const assert = require("node:assert/strict");

const {
  calculateDegressivity,
  couponPerPeriod,
  couponProtectionLevel,
  describeUnderlyingBasket,
  formatPctFr,
  initialLevelWording,
  joinFr,
  normalizeCharacteristics,
  normalizeProductFamily,
  ordinalFr,
} = require("../src/modules/structura-domain.js");

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

test("format French percentages and ordinals", () => {
  assert.equal(formatPctFr(1.5), "1,50%");
  assert.equal(formatPctFr(null), "XX%");
  assert.equal(ordinalFr(1), "1ère");
  assert.equal(ordinalFr(2), "2ème");
});

test("compute coupon per period from annual coupon", () => {
  assert.equal(couponPerPeriod(8, "trimestriel"), 2);
  assert.equal(couponPerPeriod(9, "semestriel"), 4.5);
  assert.equal(couponPerPeriod(12, "mensuel"), 1);
});

test("join French lists and describe basket structures", () => {
  assert.equal(joinFr(["A", "B"]), "A et B");
  assert.equal(joinFr(["A", "B", "C"]), "A, B et C");
  assert.equal(
    describeUnderlyingBasket(["LVMH", "Airbus", "TotalEnergies"], "worstof", "actions"),
    "action la moins performante entre LVMH, Airbus et TotalEnergies",
  );
  assert.match(
    describeUnderlyingBasket(["CAC 40", "DAX 40"], "equipondere", "indices"),
    /50,00%/,
  );
});

test("normalize product family and characteristics", () => {
  assert.equal(normalizeProductFamily("Autocall Phoenix"), "phoenix");
  assert.equal(normalizeProductFamily("Capital Garanti", "CG"), "athena");
  assert.equal(normalizeProductFamily("Credit Linked Note"), "cln");

  const characteristics = normalizeCharacteristics(
    {
      type: "phoenix",
      couponPct: 8,
      couponPeriod: "trimestriel",
      memoryEffect: "oui",
      putLeveraged: "oui",
      putLeveragedValue: "50",
      underlying: "Euro Stoxx 50",
      barrierPct: 60,
      recallPct: 100,
    },
    "phoenix",
  );

  assert.equal(characteristics.productFamily, "phoenix");
  assert.equal(characteristics.couponPerPeriodPct, 2);
  assert.equal(characteristics.hasMemory, true);
  assert.equal(characteristics.putLeveragedMultiplier, 2);
  assert.deepEqual(characteristics.underlyings, ["Euro Stoxx 50"]);
  assert.equal(characteristics.finalThreshold, 60);
  assert.equal(characteristics.fixedRecallThreshold, 100);
});

test("build initial level wording", () => {
  assert.equal(
    initialLevelWording({
      initialLevelType: "moyenne",
      initialLevelDates: ["01/01/2026", "31/01/2026"],
    }),
    "moyenne des cours de clôture du 01/01/2026 au 31/01/2026",
  );
  assert.equal(
    initialLevelWording({
      initialLevelType: "minimum",
      initialLevelDates: ["01/01/2026", "02/01/2026", "03/01/2026"],
    }),
    "le plus bas des cours de clôture du 01/01/2026, 02/01/2026 et 03/01/2026",
  );
});

test("calculate degressive autocall threshold table", () => {
  const table = calculateDegressivity({
    maturityMonths: 12,
    periodicity: "Trimestriel",
    degressivityPerPeriod: 1,
    floor: 98,
    startMonth: 3,
  });
  assert.deepEqual(table, [
    { month: 0, threshold: 100 },
    { month: 3, threshold: 100 },
    { month: 6, threshold: 99 },
    { month: 9, threshold: 98 },
    { month: 12, threshold: 98 },
  ]);
});

test("calculate degressive table with configured barriers", () => {
  const table = calculateDegressivity({
    maturityMonths: 12,
    periodicity: "Trimestriel",
    firstThreshold: 95,
    degressivityPerPeriod: 10,
    floor: 80,
    startMonth: 3,
    couponBarrier: 85,
    oxygenBarrier: 90,
  });
  assert.deepEqual(table, [
    { month: 0, threshold: 100 },
    { month: 3, threshold: 95 },
    { month: 6, threshold: 85 },
    { month: 9, threshold: 85 },
    { month: 12, threshold: 90 },
  ]);
});

test("calculate coupon protection priority", () => {
  assert.equal(couponProtectionLevel({ type: "bearish_taux", bearishCouponBarrier: 120 }), 120);
  assert.equal(couponProtectionLevel({ oxygenBarrier: 80, couponBarrier: 65 }), 80);
  assert.equal(couponProtectionLevel({ couponBarrier: 65, finalThreshold: 50 }), 65);
});
