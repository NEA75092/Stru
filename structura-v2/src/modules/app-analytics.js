(function initStructuraAnalytics(root, factory) {
  const api = factory(root);
  Object.assign(root, api);
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(
  typeof globalThis !== "undefined" ? globalThis : this,
  function createStructuraAnalytics(root) {
    const { moneyShort, pctFr, escapeHtml } = root.StructuraUtils;
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

    // Même composant que les KPI Barrières (.kpi-row-accent-top) : filet
    // supérieur coloré par niveau, --gradient-card-lit, jamais d'aplat.
    const ACCENT_CLASS = { crit: "kpi-accent-danger", warn: "kpi-accent-warning", safe: "kpi-accent-safe", neutral: "" };

    function renderKpiCard(label, value, sub, pct, level) {
      const width = Math.min(100, Math.max(0, Number(pct) || 0));
      return `<div class="kpi ${ACCENT_CLASS[level] || ""}">
        <div class="kpi-lbl">${escapeHtml(label)}</div>
        <div class="kpi-val" style="font-size: 26px">${escapeHtml(value)}</div>
        <div class="kpi-sub">
          <div class="kpi-proportion"><div class="kpi-proportion-fill" style="width:${width}%"></div></div>
          <span>${escapeHtml(sub)}</span>
        </div>
      </div>`;
    }

    // Type de produit → classe de couleur : mêmes tp-ac/tp-cg/tp-rc/tp-lv
    // que .pill-category (tables.css), pour qu'un segment de l'histogramme
    // se reconnaisse comme la même famille que sa pastille dans les
    // tableaux. La couleur ne s'écrit jamais en style="" (règle CLAUDE.md).
    const TYPE_CLASS = { AC: "tp-ac", CG: "tp-cg", RC: "tp-rc", LV: "tp-lv" };

    function renderRiskMetrics() {
      const m = computePortfolioMetrics();
      const metricsEl = document.getElementById("ana-metrics");
      if (metricsEl) {
        metricsEl.innerHTML = [
          renderKpiCard(
            "Concentration produit max",
            m.maxProductPct ? pctFr(m.maxProductPct) : "—",
            m.maxProductName || "—",
            m.maxProductPct,
            concentrationLevel(m.maxProductPct),
          ),
          renderKpiCard(
            "Coupon moyen pondéré",
            m.weightedCoupon ? `${pctFr(m.weightedCoupon, 2)}/an` : "—",
            "Pondéré par l'encours valorisé du portefeuille",
            Math.min(100, (m.weightedCoupon / 12) * 100),
            "neutral",
          ),
          renderKpiCard(
            "Concentration émetteur max",
            m.maxIssuerPct ? pctFr(m.maxIssuerPct) : "—",
            m.maxIssuer || "—",
            m.maxIssuerPct,
            concentrationLevel(m.maxIssuerPct),
          ),
        ].join("");
      }

      const typeEl = document.getElementById("ana-type-breakdown");
      if (typeEl) {
        const labels = { AC: "Autocall", CG: "Cap. Garanti", RC: "Rev. Conv.", LV: "Levier" };
        const total = Object.values(m.byType).reduce((sum, n) => sum + n, 0);
        const entries = Object.entries(m.byType).filter(([, n]) => n > 0);
        if (!entries.length) {
          typeEl.innerHTML = `<div class="pilotage-preview-empty">Aucun produit dans le périmètre.</div>`;
        } else {
          const segments = entries
            .map(([t, n]) => {
              const pct = total ? (n / total) * 100 : 0;
              return `<span class="pilotage-type-segment ${TYPE_CLASS[t] || ""}" style="width:${pct.toFixed(1)}%" title="${escapeHtml(labels[t] || t)} · ${n} · ${pct.toFixed(0)}%"></span>`;
            })
            .join("");
          const legend = entries
            .map(([t, n]) => {
              const pct = total ? (n / total) * 100 : 0;
              return `<span class="pilotage-type-legend-item"><span class="pilotage-type-dot ${TYPE_CLASS[t] || ""}"></span>${escapeHtml(labels[t] || t)} · ${pct.toFixed(0)}%</span>`;
            })
            .join("");
          typeEl.innerHTML = `<div class="pilotage-type-histogram">${segments}</div><div class="pilotage-type-legend">${legend}</div>`;
        }
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
      const maxNominal = Math.max(...rows.slice(0, 5).map((row) => row.nominal), 1);
      container.innerHTML = `${rows.slice(0, 5).map((row) => {
        const weight = totalNom ? ((row.nominal / totalNom) * 100).toFixed(1) : "0.0";
        const share = Math.max(2, (row.nominal / maxNominal) * 100);
        return `<button type="button" class="pilotage-preview-row" onclick="openClientWorkspace(${row.client.id})">
          <span class="pilotage-preview-top">
            <span class="pilotage-preview-main">
              <span class="pilotage-preview-name">${escapeHtml(row.client.name)}</span>
              <small>${row.products} produit${row.products > 1 ? "s" : ""} · ${weight}% du cabinet</small>
            </span>
            <span class="pilotage-preview-metric">${moneyShort(row.nominal)}</span>
          </span>
          <span class="pilotage-preview-bar-track"><span class="pilotage-preview-bar-fill" style="width:${share.toFixed(1)}%"></span></span>
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
