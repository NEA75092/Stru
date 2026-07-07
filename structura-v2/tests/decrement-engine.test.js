const assert = require("node:assert/strict");

const {
  DECREMENT_UNIVERSE,
  STATIC_WEIGHTS,
  calculateDecrementScore,
} = require("../src/modules/decrement-engine.js");

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

test("static JS weights expose Python 9-criterion allocation", () => {
  assert.deepEqual(STATIC_WEIGHTS, {
    coverage: 0.2,
    drag: 0.2,
    stress: 0.15,
    recall: 0.12,
    dividendStability: 0.08,
    trend: 0.05,
    capitalLossSeverity: 0.1,
    pathDependency: 0.05,
    dividendTrend: 0.05,
  });
});

test("static universe includes fixed dividend actions", () => {
  const names = DECREMENT_UNIVERSE.map((item) => item.name);
  assert.equal(DECREMENT_UNIVERSE.length, 13);
  assert(names.includes("TotalEnergies Dec"));
  assert(names.includes("BNP Paribas Dec"));
  assert(names.includes("Siemens Dec"));
  assert(!names.some((name) => name.includes("LVMH")));
  assert(!names.some((name) => name.includes("World ESG")));
});

test("calculate decrement score returns bounded composite score", () => {
  const score = calculateDecrementScore(DECREMENT_UNIVERSE[0]);
  assert(score.total >= 0);
  assert(score.total <= 100);
  assert(["A", "B", "C", "D", "E"].includes(score.grade));
});

test("EUR action decrement pct uses configured reference spot", () => {
  const tte = DECREMENT_UNIVERSE.find((item) => item.id === "TTE_DEC_2_10");
  assert(tte);
  const score = calculateDecrementScore(tte);
  assert.equal(score.decPctAnnual, 3.39);
  assert.match(score.decPctRefNote, /Cours de référence 62€ au 06\/2025/);
});

test("index decrement pct has no reference spot note", () => {
  const score = calculateDecrementScore(DECREMENT_UNIVERSE[0]);
  assert.equal(score.decPctRefNote, null);
});
