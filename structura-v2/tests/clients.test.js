const assert = require("node:assert/strict");

function resetGlobals() {
  delete global.StructuraAppState;
  delete global.StructuraUtils;
  delete global.StructuraClients;
}

function clearModule(modulePath) {
  delete require.cache[require.resolve(modulePath)];
}

function test(name, fn) {
  try {
    fn();
    console.log(`OK  ${name}`);
  } catch (error) {
    console.error(`KO  ${name}`);
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    resetGlobals();
  }
}

test("client stats aggregate products by dossier", () => {
  global.localStorage = {
    store: {},
    getItem(key) {
      return this.store[key] || null;
    },
    setItem(key, value) {
      this.store[key] = value;
    },
    removeItem(key) {
      delete this.store[key];
    },
  };

  clearModule("../src/modules/app-utils.js");
  clearModule("../src/modules/app-state.js");
  clearModule("../src/modules/app-clients.js");

  require("../src/modules/app-utils.js");
  const state = require("../src/modules/app-state.js");
  state.PRODUCTS.length = 0;
  state.CLIENTS.length = 0;
  state.CLIENTS.push(
    state.normalizeClient({ id: 1, name: "Client Test", segment: "Patrimonial" }),
  );
  state.PRODUCTS.push(
    state.normalizeProduct({
      id: 1,
      name: "Phoenix Test",
      type: "AC",
      emetteur: "BNP Paribas",
      nominal: 1000000,
      val: 1100000,
      dist: 12,
      clientId: 1,
      clientAllocations: [
        {
          clientId: 1,
          nominal: 1000000,
          subDate: "2024-03-15",
          envelope: "cto",
          channel: "cgp",
        },
      ],
      origin: "user",
    }),
  );

  const clients = require("../src/modules/app-clients.js");
  const stats = clients.clientStats(1);
  const product = state.PRODUCTS[0];
  const alloc = state.getProductAllocations(product)[0];

  assert.equal(alloc.envelope, "cto");
  assert.equal(alloc.channel, "cgp");
  assert.equal(alloc.subDate, "2024-03-15");

  assert.equal(stats.count, 1);
  assert.equal(stats.nominal, 1000000);
  assert.equal(stats.val, 1100000);
});
