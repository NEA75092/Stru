const assert = require("node:assert/strict");
const { JSDOM } = require("jsdom");

function installDom(html) {
  const dom = new JSDOM(html, { url: "http://localhost" });
  global.window = dom.window;
  global.document = dom.window.document;
  global.localStorage = dom.window.localStorage;
  return dom;
}

function resetGlobals() {
  delete global.StructuraAppState;
  delete global.StructuraUtils;
  delete global.StructuraClients;
  delete global.window;
  delete global.document;
  delete global.localStorage;
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

test("wealth KPI shows Non renseigné instead of hiding the card (§6.2)", () => {
  installDom(`
    <div id="dr-client-content"></div>
    <div id="dr-product-content"></div>
    <div id="dr-underlying-content"></div>
    <div id="drawer-ov"></div>
  `);

  clearModule("../src/modules/app-utils.js");
  clearModule("../src/modules/app-state.js");
  clearModule("../src/modules/app-clients.js");

  require("../src/modules/app-utils.js");
  const state = require("../src/modules/app-state.js");
  const clients = require("../src/modules/app-clients.js");

  // M. Lefebvre (id 3) est le fixture seedé avec declaredWealth: null —
  // pas un client ajouté pour l'occasion (PASSE-8-6.2.md, point 4).
  const lefebvre = state.CLIENTS.find((c) => c.id === 3);
  assert.equal(lefebvre.declaredWealth, null);

  clients.openClientDrawer(3);
  const html = document.getElementById("dr-client-content").innerHTML;

  const kpiMatch = html.match(
    /Part du patrimoine en structurés<\/div>.*?<\/div>\s*<\/div>/s,
  );
  assert.ok(kpiMatch, "le 4e KPI (patrimoine) doit être présent, pas masqué");
  const kpiHtml = kpiMatch[0];

  assert.match(kpiHtml, /Non renseigné/);
  assert.match(kpiHtml, /kpi-val-empty/);
  // Une case qui ne vérifie que la présence du libellé laisserait passer
  // "0 %" ou "—" à côté : les trois exclusions sont le test, pas juste
  // la présence de "Non renseigné".
  assert.doesNotMatch(kpiHtml, /0\s*%/);
  assert.doesNotMatch(kpiHtml, /—/);
  assert.doesNotMatch(kpiHtml, /seuil/i);
  assert.doesNotMatch(html, /dr-kpi-row-3/);
});
