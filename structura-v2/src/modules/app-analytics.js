(function initStructuraAnalytics(root, factory) {
  const api = factory(root);
  Object.assign(root, api);
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(
  typeof globalThis !== "undefined" ? globalThis : this,
  function createStructuraAnalytics(root) {
    const { moneyShort, escapeHtml } = root.StructuraUtils;
    const {
      productsForScope,
      getProductAllocations,
      getClientById,
    } = root.StructuraAppState;

    function computePortfolioMetrics() {
      const data = productsForScope();
      const totalVal = data.reduce((s, p) => s + (Number(p.val) || 0), 0);

      const weightedCoupon = totalVal
        ? data.reduce((s, p) => s + (Number(p.cpnNum) || 0) * (Number(p.val) || 0), 0) /
          totalVal
        : 0;

      const byIssuer = {};
      data.forEach((p) => {
        const key = p.emetteur || "Inconnu";
        byIssuer[key] = (byIssuer[key] || 0) + (Number(p.val) || 0);
      });
      let maxIssuer = "—";
      let maxIssuerPct = 0;
      Object.entries(byIssuer).forEach(([name, val]) => {
        const pct = totalVal ? (val / totalVal) * 100 : 0;
        if (pct > maxIssuerPct) {
          maxIssuerPct = pct;
          maxIssuer = name;
        }
      });

      let maxProductPct = 0;
      let maxProductName = "—";
      data.forEach((p) => {
        const pct = totalVal ? ((Number(p.val) || 0) / totalVal) * 100 : 0;
        if (pct > maxProductPct) {
          maxProductPct = pct;
          maxProductName = p.name || "—";
        }
      });

      const byType = {};
      data.forEach((p) => {
        byType[p.type] = (byType[p.type] || 0) + 1;
      });

      return {
        weightedCoupon,
        maxIssuer,
        maxIssuerPct,
        maxProductPct,
        maxProductName,
        byType,
      };
    }

    function computeClientConcentration() {
      const rows = new Map();
      productsForScope().forEach((product) => {
        getProductAllocations(product).forEach((alloc) => {
          const client = getClientById(alloc.clientId);
          if (!client) return;
          const row = rows.get(client.id) || {
            client,
            nominal: 0,
            valShare: 0,
            products: 0,
            alerts: 0,
          };
          row.nominal += Number(alloc.nominal) || 0;
          const share =
            Number(product.nominal) > 0
              ? (Number(alloc.nominal) || 0) / Number(product.nominal)
              : 0;
          row.valShare += (Number(product.val) || 0) * share;
          row.products += 1;
          if (["breach", "crit", "warn"].includes(product.st?.s)) row.alerts += 1;
          rows.set(client.id, row);
        });
      });
      return [...rows.values()].sort((a, b) => b.nominal - a.nominal);
    }

    function concentrationLevel(pct) {
      if (pct >= 25) return "crit";
      if (pct >= 15) return "warn";
      return "safe";
    }

    function renderMetricCard(label, value, sub, pct, level) {
      const width = Math.min(100, Math.max(0, Number(pct) || 0));
      return `<div class="pilotage-metric pilotage-metric-${level}">
        <div class="pilotage-metric-top">
          <span class="pilotage-metric-label">${escapeHtml(label)}</span>
          <span class="pilotage-metric-value">${escapeHtml(value)}</span>
        </div>
        <div class="pilotage-metric-bar"><span style="width:${width}%"></span></div>
        <div class="pilotage-metric-sub">${escapeHtml(sub)}</div>
      </div>`;
    }

    function renderRiskMetrics() {
      const m = computePortfolioMetrics();
      const metricsEl = document.getElementById("ana-metrics");
      if (metricsEl) {
        metricsEl.innerHTML = [
          renderMetricCard(
            "Exposition émetteur max",
            m.maxIssuerPct ? `${m.maxIssuerPct.toFixed(1)}%` : "—",
            m.maxIssuer || "Aucun émetteur identifié",
            m.maxIssuerPct,
            concentrationLevel(m.maxIssuerPct),
          ),
          renderMetricCard(
            "Concentration produit max",
            m.maxProductPct ? `${m.maxProductPct.toFixed(1)}%` : "—",
            m.maxProductName || "—",
            m.maxProductPct,
            concentrationLevel(m.maxProductPct),
          ),
          renderMetricCard(
            "Coupon moyen pondéré",
            m.weightedCoupon ? `${m.weightedCoupon.toFixed(2)}%/an` : "—",
            "Pondéré par l'encours valorisé du portefeuille",
            Math.min(100, (m.weightedCoupon / 12) * 100),
            "neutral",
          ),
        ].join("");
      }

      const typeEl = document.getElementById("ana-type-breakdown");
      if (typeEl) {
        const labels = { AC: "Autocall", CG: "Cap. Garanti", RC: "Rev. Conv.", LV: "Levier" };
        const total = Object.values(m.byType).reduce((sum, n) => sum + n, 0);
        typeEl.innerHTML = Object.entries(m.byType).length
          ? Object.entries(m.byType)
              .map(([t, n]) => {
                const pct = total ? (n / total) * 100 : 0;
                return `<div class="pilotage-type-row">
                  <span class="pilotage-type-name">${labels[t] || t}</span>
                  <span class="pilotage-type-bar"><span style="width:${pct.toFixed(0)}%"></span></span>
                  <span class="pilotage-type-count num">${n}</span>
                </div>`;
              })
              .join("")
          : `<div class="pilotage-preview-empty">Aucun produit dans le périmètre.</div>`;
      }
    }

    function renderClientPreview() {
      const container = document.getElementById("ana-client-preview");
      if (!container) return;
      const rows = computeClientConcentration();
      const totalNom = rows.reduce((sum, row) => sum + row.nominal, 0);
      if (!rows.length) {
        container.innerHTML = `<div class="pilotage-preview-empty">Aucun encours rattaché à un dossier client.</div>`;
        return;
      }
      container.innerHTML = `${rows.slice(0, 5).map((row) => {
        const weight = totalNom ? ((row.nominal / totalNom) * 100).toFixed(1) : "0.0";
        return `<button type="button" class="pilotage-preview-row" onclick="openClientWorkspace(${row.client.id})">
          <span class="pilotage-preview-main">
            <span class="pilotage-preview-name">${escapeHtml(row.client.name)}</span>
            <small>${row.products} produit${row.products > 1 ? "s" : ""} · ${weight}% du cabinet</small>
          </span>
          <span class="pilotage-preview-metric">${moneyShort(row.nominal)}</span>
        </button>`;
      }).join("")}
      <button type="button" class="btn pilotage-preview-all" onclick="nav('clients')">Voir tous les dossiers</button>`;
    }

    function renderAnalytics() {
      renderRiskMetrics();
      renderClientPreview();
    }

    function sortAnalytics() {
      renderAnalytics();
    }

    return { renderAnalytics, computePortfolioMetrics, sortAnalytics };
  },
);
