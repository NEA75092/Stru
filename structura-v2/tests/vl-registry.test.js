const assert = require("node:assert/strict");

require("../src/modules/app-state.js");
require("../src/modules/vl-registry.js");

const {
  lookupIssuerVl,
  enrichProduct,
  fetchProductVlByIsin,
} = require("../src/modules/vl-registry.js");

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

test("lookup issuer VL by ISIN", () => {
  const hit = lookupIssuerVl("FR00140016F3");
  assert.equal(hit.vlPct, 99.12);
  assert.equal(hit.isMock, false);
});

test("mock demo ISIN only in demo mode data", () => {
  const hit = lookupIssuerVl("DEMO-00001");
  assert.ok(hit.isMock);
  assert.ok(hit.vlPct >= 92 && hit.vlPct <= 108);
});

test("unknown ISIN returns null lookup", async () => {
  const hit = lookupIssuerVl("FR9999999999");
  assert.equal(hit, null);
  const fetched = await fetchProductVlByIsin("FR9999999999");
  assert.equal(fetched.ok, false);
});

test("enrichProduct does not infer VL from valorisation", () => {
  const p = enrichProduct({
    isin: "FR9999999999",
    nominal: 1000000,
    val: 1050000,
  });
  assert.equal(p.vlPct, null);
  assert.equal(p.vlStatus, "missing");
  assert.equal(p.val, 1050000);
});

test("enrichProduct applies issuer VL to valorisation", () => {
  const p = enrichProduct({
    isin: "FR00140016F3",
    nominal: 1000000,
    val: 0,
  });
  assert.equal(p.vlStatus, "issuer");
  assert.equal(p.vlPct, 99.12);
  assert.equal(p.val, 991200);
});
