const assert = require("node:assert/strict");
const { JSDOM } = require("jsdom");

function installDom(html) {
  const dom = new JSDOM(html, { url: "http://localhost" });
  global.window = dom.window;
  global.document = dom.window.document;
  global.localStorage = dom.window.localStorage;
  global.navigator = dom.window.navigator;
  global.HTMLElement = dom.window.HTMLElement;
  global.Node = dom.window.Node;
  global.setInterval = () => 0;
  global.setTimeout = () => 0;
  global.clearInterval = () => {};
  global.clearTimeout = () => {};
  return dom;
}

function resetGlobals() {
  delete global.window;
  delete global.document;
  delete global.localStorage;
  delete global.navigator;
  delete global.HTMLElement;
  delete global.Node;
  delete global.StructuraAppState;
  delete global.StructuraNavigation;
  delete global.StructuraExports;
  delete global.renderPf;
  delete global.renderBarriers;
  delete global.renderAnalytics;
  delete global.renderCalendar;
  delete global.runScreener;
  delete global.nav;
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

test("render dashboard summary with seeded products", () => {
  installDom(`
    <div id="mode-toggle"></div>
    <div id="cnt-bar"></div>
    <div id="kpi-total-val"></div>
    <div id="kpi-total-sub"></div>
    <div id="kpi-breach-val"></div>
    <div id="kpi-breach-sub"></div>
    <div id="kpi-watch-val"></div>
    <div id="kpi-watch-sub"></div>
    <div id="kpi-count-val"></div>
    <div id="kpi-count-sub"></div>
    <div id="ticker"></div>
    <div id="clk"></div>
    <div id="dt-str"></div>
    <div id="client-scope-select"></div>
    <div id="clients-list"></div>
    <div id="clients-detail"></div>
    <div id="client-dossier-ov"></div>
    <div id="alerts-list"></div>
    <div id="events-list"></div>
    <div id="perf-nominal"></div>
    <div id="perf-valuation"></div>
    <div id="perf-change"></div>
    <div id="perf-change-abs"></div>
    <div id="perf-change-label"></div>
    <div id="perf-chart-note"></div>
    <div id="perf-cgp"></div>
    <svg id="perf-history-svg"></svg>
    <div id="issuer-exposure"></div>
    <div id="dashboard-timeline"></div>
    <div id="vl-top-flop"></div>
  `);
  clearModule("../src/modules/app-state.js");
  clearModule("../src/modules/vl-registry.js");
  clearModule("../src/modules/app-navigation.js");
  clearModule("../src/modules/app-exports.js");
  clearModule("../src/modules/app-utils.js");
  clearModule("../src/modules/app-portfolio-constants.js");
  clearModule("../src/modules/app-dashboard.js");
  clearModule("../src/modules/app-clients.js");
  clearModule("../src/modules/app-portfolio.js");
  clearModule("../src/modules/app-calendar.js");
  clearModule("../src/modules/app-analytics.js");
  clearModule("../src/modules/decrement-engine.js");
  clearModule("../src/modules/app-screener.js");
  clearModule("../src/app.js");

  const app = require("../src/app.js");
  app.renderDashboardSummary();
  global.renderEvents();
  global.renderAlerts();

  assert.match(document.getElementById("kpi-total-val").textContent, /€/);
  assert.match(
    document.getElementById("kpi-count-sub").textContent,
    /types .* émetteurs/i,
  );
  assert.match(document.getElementById("alerts-list").innerHTML, /openDrawer/);
  assert.doesNotMatch(
    document.getElementById("alerts-list").innerHTML,
    /Phoenix CAC40 – Mars 2024/,
  );
  assert.match(
    global.StructuraDashboard.evHtml([
      {
        productId: 1,
        d: "15",
        m: "JUN",
        type: "obs",
        name: "Observation produit",
        desc: "Détail",
        amt: "—",
      },
    ]),
    /openDrawer\(1\)/,
  );
});

test("dashboard alerts stay empty in production without risky products", () => {
  installDom(`<div id="alerts-list"></div>`);
  clearModule("../src/modules/app-state.js");
  clearModule("../src/modules/app-utils.js");
  clearModule("../src/modules/app-dashboard.js");
  clearModule("../src/modules/app-clients.js");

  require("../src/modules/app-utils.js");
  const state = require("../src/modules/app-state.js");
  state.PRODUCTS.length = 0;
  state.PRODUCTS.push(
    state.normalizeProduct({
      id: 99,
      name: "Note taux EUR",
      type: "NT",
      emetteur: "BNP Paribas",
      nominal: 1000000,
      val: 1010000,
      dist: 42,
      underlying: "EUR",
      origin: "user",
    }),
  );
  global.localStorage.setItem(state.APP_MODE_KEY, "prod");

  const dashboard = require("../src/modules/app-dashboard.js");
  dashboard.renderAlerts();

  assert.match(
    document.getElementById("alerts-list").innerHTML,
    /Rien d'urgent/,
  );
  assert.doesNotMatch(
    document.getElementById("alerts-list").innerHTML,
    /Phoenix CAC40/,
  );
});

test("ingest term sheet returns a stable local result", () => {
  installDom(`
    <div id="mode-toggle"></div>
    <div id="cnt-bar"></div>
    <div id="kpi-total-val"></div>
    <div id="kpi-total-sub"></div>
    <div id="kpi-breach-val"></div>
    <div id="kpi-breach-sub"></div>
    <div id="kpi-watch-val"></div>
    <div id="kpi-watch-sub"></div>
    <div id="kpi-count-val"></div>
    <div id="kpi-count-sub"></div>
    <div id="ticker"></div>
    <div id="clk"></div>
    <div id="dt-str"></div>
    <div id="client-scope-select"></div>
    <div id="clients-list"></div>
    <div id="clients-detail"></div>
    <div id="client-dossier-ov"></div>
    <div id="events-list"></div>
  `);
  clearModule("../src/modules/app-state.js");
  clearModule("../src/modules/vl-registry.js");
  clearModule("../src/modules/app-navigation.js");
  clearModule("../src/modules/app-exports.js");
  clearModule("../src/modules/app-utils.js");
  clearModule("../src/modules/app-portfolio-constants.js");
  clearModule("../src/modules/app-dashboard.js");
  clearModule("../src/modules/app-clients.js");
  clearModule("../src/modules/app-portfolio.js");
  clearModule("../src/modules/app-calendar.js");
  clearModule("../src/modules/app-analytics.js");
  clearModule("../src/modules/decrement-engine.js");
  clearModule("../src/modules/app-screener.js");
  clearModule("../src/app.js");

  const app = require("../src/app.js");
  const result = app.ingestTermSheet("term-sheet.pdf");

  assert.equal(result.ok, true);
  assert.equal(result.message, "Extraction initialisée");
  assert.equal(result.input, "term-sheet.pdf");
});

test("navigation toggles active tab and updates runtime state", () => {
  installDom(`
    <div class="nav-tab active" id="tab-dashboard"></div>
    <div class="nav-tab" id="tab-portfolio"></div>
    <div class="view active" id="view-dashboard"></div>
    <div class="view" id="view-portfolio"></div>
  `);
  global.StructuraAppState = { runtime: { currentView: "dashboard" } };
  let portfolioRendered = 0;
  global.renderPf = () => {
    portfolioRendered += 1;
  };

  clearModule("../src/modules/app-navigation.js");
  const navigation = require("../src/modules/app-navigation.js");
  navigation.nav("portfolio");

  assert.equal(global.StructuraAppState.runtime.currentView, "portfolio");
  assert.equal(
    document.getElementById("tab-portfolio").classList.contains("active"),
    true,
  );
  assert.equal(
    document.getElementById("view-portfolio").classList.contains("active"),
    true,
  );
  assert.equal(portfolioRendered, 1);
});
