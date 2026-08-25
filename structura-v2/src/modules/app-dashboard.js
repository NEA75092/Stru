(function initStructuraDashboard(root, factory) {
  const api = factory(root);
  root.StructuraDashboard = api;
  Object.assign(root, api);
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(
  typeof globalThis !== "undefined" ? globalThis : this,
  function createStructuraDashboard(root) {
    const { setText, setTextFlash, moneyShort, pctFr, shortDateFr, escapeHtml } =
      root.StructuraUtils;
    const {
      APP_MODE_KEY,
      productsForScope,
      isProdMode,
      CLIENTS,
      touchSession,
      sessionInitials,
      getProductAllocations,
      isoDate,
    } = root.StructuraAppState;

    const INDICES = [
      { l: "CAC 40", v: 7893.42, d: +0.48 },
      { l: "EURO STOXX 50", v: 4487.12, d: -0.31 },
      { l: "DAX 40", v: 17920.34, d: +0.62 },
      { l: "S&P 500", v: 5284.12, d: +0.22 },
      { l: "NASDAQ", v: 16742.8, d: +0.35 },
      { l: "VIX", v: 14.82, d: -5.2 },
      { l: "EUR/USD", v: 1.0841, d: +0.12 },
      { l: "OAT 10a", v: pctFr(3.12, 2), d: null },
      { l: "TOTAL", v: 62.41, d: +1.15 },
      { l: "LVMH", v: 742.3, d: -0.42 },
      { l: "NVIDIA", v: 875.2, d: +1.8 },
    ];

    const GUARANTOR_ALIASES = [
      { label: "Bank of America", re: /bank\s+of\s+america|bofa|merrill|\bbac\b/i },
      { label: "Barclays", re: /barclays/i },
      { label: "BBVA", re: /\bbbva\b/i },
      { label: "BNP Paribas", re: /\bbnp\b/i },
      { label: "CIBC", re: /\bcibc\b/i },
      { label: "Citigroup", re: /citigroup|\bciti\b/i },
      { label: "Crédit Agricole", re: /cr[ée]dit\s+agricole|credit\s+agricole|cacib/i },
      { label: "CIC", re: /cr[ée]dit\s+industriel|credit\s+industriel|\bcic\b/i },
      { label: "Crédit Mutuel Arkéa", re: /cr[ée]dit\s+mutuel\s+ark[ée]a|credit\s+mutuel\s+arkea/i },
      { label: "Deutsche Bank", re: /deutsche/i },
      { label: "Goldman Sachs", re: /goldman|\bgs\b/i },
      { label: "HSBC", re: /\bhsbc\b/i },
      { label: "JP Morgan", re: /j\.?p\.?\s*morgan|jpmorgan|chase/i },
      { label: "Morgan Stanley", re: /morgan\s+stanley|\bmsfl\b/i },
      { label: "Natixis", re: /natixis/i },
      { label: "Nomura", re: /nomura/i },
      { label: "Société Générale", re: /soci[ée]t[ée]\s+g[ée]n[ée]rale|\bsg\b/i },
      { label: "UBS", re: /\bubs\b/i },
    ];

    // Filtre breach/crit/warn : construit sur p.st, lui-même dérivé de
    // p.dist/p.barrier (statusFromDist, app-state.js) — le champ que
    // distProtectionCell (app-portfolio.js) documente explicitement comme
    // la distance à la barrière de PROTECTION du capital (PDI), pas une
    // barrière de rappel ou de coupon. Vérifié avant d'écrire cette
    // fonction, pas supposé : un CG (sans PDI) retombe sur "none" et sort
    // du filtre par construction, exactement le comportement attendu ici.
    // 3 positions (dashboard-correctif-02.md § 2, gagnant sur le
    // placeholder à 5 de la maquette — spec sur comportement d'écran).
    function buildPortfolioAlerts() {
      const severity = { breach: 0, crit: 1, warn: 2 };
      return productsForScope()
        .filter((p) => ["breach", "crit", "warn"].includes(p.st?.s))
        .sort(
          (a, b) =>
            (severity[a.st?.s] ?? 9) - (severity[b.st?.s] ?? 9) ||
            (Number(a.dist) || 0) - (Number(b.dist) || 0),
        )
        .slice(0, 3)
        .map((p) => {
          // p.barrier est le niveau barrière en % du spot initial (ex.
          // 72 = barrière à 72 % de l'initial) ; p.dist est l'écart au
          // niveau barrière *en % de ce niveau barrière* (0 = pile sur
          // la barrière), pas un écart au niveau initial. Même formule
          // que app-portfolio.js/app-calendar.js/app-utils.js :
          // current = barrier × (1 + dist/100). La carte § 2.1 a besoin
          // de la performance vs *initial* (perfVsInitial) et du niveau
          // barrière vs initial (barrierVsInitial) — deux valeurs
          // dérivées, pas p.dist/p.barrier directement.
          const hasBarrier = Number.isFinite(Number(p.barrier));
          const hasDist = Number.isFinite(Number(p.dist));
          const currentPctOfInitial = hasBarrier && hasDist ? Number(p.barrier) * (1 + Number(p.dist) / 100) : null;
          return {
            productId: p.id,
            lvl: p.st.s === "breach" || p.st.s === "crit" ? "crit" : "warn",
            statusCls: p.st.cls,
            statusLabel: p.st.label,
            name: p.name,
            context: `${p.underlying || "—"} · ${p.emetteur || "Émetteur à confirmer"}`,
            perfVsInitial: currentPctOfInitial !== null ? currentPctOfInitial - 100 : null,
            barrierVsInitial: hasBarrier ? Number(p.barrier) - 100 : null,
            initialSpot: p.initialSpot != null && Number.isFinite(Number(p.initialSpot)) ? Number(p.initialSpot) : null,
          };
        });
    }

    function bankGroupName(value) {
      const src = String(value || "");
      const match = GUARANTOR_ALIASES.find((entry) => entry.re.test(src));
      return match?.label || src.trim() || "Émetteur à confirmer";
    }

    // Couleurs de marque émetteur — une seule table (00-PROTOCOLE.md §8,
    // invariants transversaux). src/issuer-registry.js
    // (STRUCTURA_ISSUER_REGISTRY) est déjà la source des 17 hex de marque
    // (design-tokens.css --issuer-*), déjà lue par Pilotage
    // (app-analytics.js, issuerClassFor). On ne la duplique pas : ce
    // n'est qu'un second accesseur vers la même table, posé ici à côté de
    // GUARANTOR_ALIASES. Couleur jamais en dur dans le rendu — la classe
    // .issuer-<id> porte var(--issuer-<id>) en CSS (dashboard.css).
    function issuerBrandClass(rawLabel) {
      const issuers = root.STRUCTURA_ISSUER_REGISTRY?.issuers || [];
      const match = issuers.find((entry) =>
        (entry.aliases || []).some((re) => re.test(String(rawLabel || ""))),
      );
      return match ? `issuer-${match.id.toLowerCase()}` : "";
    }

    function initTicker() {
      const c = document.getElementById("ticker");
      if (!c) return;
      const items = INDICES.map(
        (i) =>
          `<div class="ticker-item"><span class="ticker-label">${i.l}</span><span class="ticker-val">${typeof i.v === "number" ? i.v.toLocaleString("fr-FR") : i.v}</span>${i.d !== null ? `<span class="ticker-chg ${i.d >= 0 ? "up" : "dn"}">${i.d >= 0 ? "▲" : "▼"}${pctFr(Math.abs(i.d), 2)}</span>` : ""}</div>`,
      ).join("");
      c.innerHTML = `<div class="ticker-track">${items}${items}</div>`;
    }

    // Date la plus récente de VL émetteur reçue sur le périmètre affiché —
    // pas une date arbitraire, celle du dernier flux réellement encaissé.
    // Vide en mode démo (vlAsOf n'est renseigné que pour les VL "issuer").
    function latestVlAsOf(data) {
      const dates = data.map((p) => p.vlAsOf).filter(Boolean).sort();
      return dates.length ? dates[dates.length - 1] : null;
    }

    function renderSessionChrome() {
      if (typeof document === "undefined") return;
      const { session, greeting, now } = touchSession();
      const data = productsForScope();
      const alerts = buildPortfolioAlerts();
      const breach = data.filter((p) => p.st?.s === "breach").length;
      const watch = data.filter((p) => ["crit", "warn"].includes(p.st?.s)).length;
      const totalVal = data.reduce((sum, p) => sum + (Number(p.val) || 0), 0);
      const vlAsOf = latestVlAsOf(data);
      const dateLabel = now.toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
      });

      setText(
        "session-date-line",
        vlAsOf ? `${dateLabel} · VL au ${shortDateFr(vlAsOf)}` : `${dateLabel} · VL non disponible`,
      );
      setText("session-user-name", session.advisorName || "Conseiller");
      setText("session-user-role", session.role || "CGP");
      setText("session-avatar", sessionInitials(session.advisorName));
      setText("session-headline", `${greeting} ${session.advisorName}`);
      setText(
        "session-subline",
        alerts.length
          ? `${alerts.length} point${alerts.length > 1 ? "s" : ""} à traiter sur le portefeuille.`
          : breach || watch
            ? `${breach + watch} produit${breach + watch > 1 ? "s" : ""} sous surveillance.`
            : `${data.length} produit${data.length > 1 ? "s" : ""} actifs · ${CLIENTS.length} dossier${CLIENTS.length > 1 ? "s" : ""} client.`,
      );
      setText("session-total-aum", moneyShort(totalVal));
      setText("session-total-alerts", String(alerts.length));
    }

    function renderDashboardSummary() {
      if (typeof document === "undefined") return;
      renderSessionChrome();
      const data = productsForScope();
      const totalVal = data.reduce((s, p) => s + (Number(p.val) || 0), 0);
      const totalNominal = data.reduce((s, p) => s + (Number(p.nominal) || 0), 0);
      const pnlPct = totalNominal
        ? ((totalVal - totalNominal) / totalNominal) * 100
        : 0;
      const breach = data.filter((p) => p.st?.s === "breach").length;
      const watch = data.filter((p) => ["crit", "warn"].includes(p.st?.s)).length;
      const types = new Set(data.map((p) => p.type).filter(Boolean)).size;
      const issuers = new Set(data.map((p) => p.emetteur).filter(Boolean)).size;
      // Le total figure déjà dans le bandeau d'accueil ("Encours géré") :
      // cette carte ne répète plus le même nombre à 40px d'écart, elle
      // porte l'information que les trois autres cartes donnent déjà —
      // un état, pas une somme (passe 6, section B.1).
      setText(
        "kpi-perf-val",
        totalNominal ? `${pnlPct > 0 ? "+" : ""}${pctFr(pnlPct, 2)}` : "—",
      );
      setText(
        "kpi-perf-sub",
        totalNominal
          ? `${totalVal - totalNominal > 0 ? "+" : ""}${moneyShort(totalVal - totalNominal)} vs encours initial`
          : "Import portefeuille requis",
      );
      const perfVal = document.getElementById("kpi-perf-val");
      const perfSub = document.getElementById("kpi-perf-sub");
      for (const el of [perfVal, perfSub]) {
        if (!el) continue;
        el.classList.toggle("up", totalNominal > 0 && pnlPct >= 0);
        el.classList.toggle("dn", totalNominal > 0 && pnlPct < 0);
      }
      setTextFlash("kpi-breach-val", breach, { invert: true });
      setText(
        "kpi-breach-sub",
        breach ? "Action immédiate requise" : "Aucun franchissement actif",
      );
      setTextFlash("kpi-watch-val", watch, { invert: true });
      setText(
        "kpi-watch-sub",
        watch ? "Critique < 5 % · alerte 5–15 %" : "Aucune zone critique",
      );
      setTextFlash("kpi-count-val", data.length);
      setText(
        "kpi-count-sub",
        data.length
          ? `${types} types · ${issuers} émetteurs`
          : "Mode production vide",
      );
      setText("cnt-bar", breach + watch);
      renderDashboardModules();
      drawPerfChart();
    }

    function updateAppModeUI() {
      const btn = document.getElementById("mode-toggle");
      if (btn) {
        btn.textContent = isProdMode() ? "MODE PROD" : "MODE DEMO";
        btn.classList.toggle("on", isProdMode());
      }
      renderDashboardSummary();
    }

    function toggleAppMode() {
      const next = isProdMode() ? "demo" : "prod";
      if (typeof localStorage !== "undefined")
        localStorage.setItem(APP_MODE_KEY, next);
      updateAppModeUI();
      root.renderPf?.();
      root.renderBarriers?.();
      root.renderAnalytics?.();
      root.renderCalendar?.();
      root.notify?.(
        next === "prod"
          ? "Mode production: produits demo masques"
          : "Mode demo: produits exemple visibles",
        "ok",
      );
    }

    function tick() {
      const n = new Date();
      const clk = document.getElementById("clk");
      const dt = document.getElementById("dt-str");
      if (clk) clk.textContent = n.toLocaleTimeString("fr-FR");
      if (dt)
        dt.textContent = n.toLocaleDateString("fr-FR", {
          weekday: "short",
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
    }

    let perfRange = "ytd";

    const PERF_RANGE_LABELS = {
      ytd: "YTD",
      "6m": "6 mois",
      "1a": "1 an",
      all: "depuis le début",
    };

    function productInceptionDate(product) {
      const subs = getProductAllocations(product)
        .map((alloc) => alloc.subDate)
        .filter(Boolean);
      const dates = [product.issueDate, product.subDate, ...subs].filter(Boolean).sort();
      return dates[0] || null;
    }

    function portfolioSnapshotAtDate(date, products) {
      const iso = isoDate(date);
      const now = new Date();
      let nominal = 0;
      let valuation = 0;
      products.forEach((product) => {
        const nom = Number(product.nominal) || 0;
        const val = Number(product.val) || 0;
        const inception = productInceptionDate(product);
        if (!inception || inception > iso) return;
        const returnPct = nom ? val / nom - 1 : 0;
        const start = new Date(`${inception}T00:00:00`);
        const totalMs = now.getTime() - start.getTime();
        const elapsedMs = Math.min(totalMs, date.getTime() - start.getTime());
        if (totalMs <= 0 || elapsedMs < 0) {
          nominal += nom;
          valuation += nom;
          return;
        }
        const frac = elapsedMs / totalMs;
        nominal += nom;
        valuation += nom * (1 + returnPct * frac);
      });
      return {
        nominal,
        valuation,
        index: nominal ? (valuation / nominal) * 100 : 100,
      };
    }

    function perfRangeStart(range) {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      if (range === "ytd") return new Date(now.getFullYear(), 0, 1);
      if (range === "6m") {
        const d = new Date(now);
        d.setMonth(d.getMonth() - 6);
        return d;
      }
      if (range === "1a") {
        const d = new Date(now);
        d.setFullYear(d.getFullYear() - 1);
        return d;
      }
      const products = productsForScope();
      const dates = products
        .flatMap((p) =>
          getProductAllocations(p)
            .map((alloc) => alloc.subDate)
            .concat([p.issueDate, p.subDate]),
        )
        .filter(Boolean)
        .sort();
      if (dates[0]) return new Date(`${dates[0]}T00:00:00`);
      const d = new Date(now);
      d.setFullYear(d.getFullYear() - 3);
      return d;
    }

    function buildPerfSeries(products, range) {
      const endDate = new Date();
      endDate.setHours(0, 0, 0, 0);
      const startDate = perfRangeStart(range);
      const months = [];
      const cursor = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
      while (cursor <= endDate) {
        months.push(new Date(cursor));
        cursor.setMonth(cursor.getMonth() + 1);
      }
      if (months.length < 2) {
        months.unshift(new Date(startDate));
        months.push(endDate);
      }
      const startSnap = portfolioSnapshotAtDate(startDate, products);
      const endSnap = portfolioSnapshotAtDate(endDate, products);
      const points = months.map((date) => {
        const snap = portfolioSnapshotAtDate(date, products);
        const displayIdx = startSnap.index
          ? (snap.index / startSnap.index) * 100
          : 100;
        return { date, idx: displayIdx, snap };
      });
      const periodPct = startSnap.index
        ? ((endSnap.index / startSnap.index) - 1) * 100
        : 0;
      const periodAbs = endSnap.valuation - startSnap.valuation;
      return { points, startSnap, endSnap, periodPct, periodAbs, startDate, endDate };
    }

    function drawPerfHistory(totalNom, _totalVal) {
      const svg = document.getElementById("perf-history-svg");
      if (!svg) return;
      const data = productsForScope();
      const series = buildPerfSeries(data, perfRange);
      const { points, periodPct, periodAbs, startDate, endDate } = series;
      const W = 800;
      const H = 180;
      const pad = { l: 44, r: 24, t: 22, b: 34 };
      const currentIdx = points[points.length - 1]?.idx || 100;
      const positive = periodPct >= 0;
      // Ce chart est dessiné en SVG via des attributs stroke/fill en dur
      // (pas de CSS, donc pas de var(--color-*)) : les recolorer à la
      // main selon le thème est le seul moyen de les faire suivre le
      // dark mode (2026-07-24). Refonte Dolce Vita Fintech (2026-07-25) :
      // la ligne est toujours bleue (plus de rouge/vert conditionnel sur
      // le tracé — la direction reste lisible via le %/montant textuels
      // à côté, en couleur sémantique, eux inchangés).
      const css = getComputedStyle(document.documentElement);
      const token = (name) => css.getPropertyValue(name).trim();
      const gridColor = token("--color-divider");
      const labelColor = token("--color-text-tertiary");
      const refLineColor = token("--color-border-strong");
      const lineColor = token("--color-ink");
      const vals = points.map((p) => p.idx);
      const minV = Math.min(98, ...vals, currentIdx) - 1.2;
      const maxV = Math.max(102, ...vals, currentIdx) + 1.2;
      const plotW = W - pad.l - pad.r;
      const plotH = H - pad.t - pad.b;
      const xAt = (i) => pad.l + (i / (points.length - 1 || 1)) * plotW;
      const yAt = (v) => pad.t + plotH - ((v - minV) / (maxV - minV || 1)) * plotH;
      const line = points
        .map((p, i) => `${i === 0 ? "M" : "L"}${xAt(i).toFixed(1)},${yAt(p.idx).toFixed(1)}`)
        .join(" ");
      const area = `${line} L${xAt(points.length - 1).toFixed(1)},${(pad.t + plotH).toFixed(1)} L${pad.l},${(pad.t + plotH).toFixed(1)} Z`;
      const refY = yAt(100);
      const gridStep = (maxV - minV) / 4;
      let grid = "";
      for (let i = 0; i <= 4; i += 1) {
        const v = minV + gridStep * i;
        const y = yAt(v);
        grid += `<line x1="${pad.l}" y1="${y.toFixed(1)}" x2="${W - pad.r}" y2="${y.toFixed(1)}" stroke="${gridColor}" stroke-width="1"/>`;
      }
      grid += `<text x="${pad.l - 6}" y="${refY.toFixed(1)}" text-anchor="end" dominant-baseline="middle" fill="${labelColor}" font-size="9" font-family="var(--font-mono-data)">100</text>`;
      const labelEvery = Math.max(1, Math.ceil(points.length / 5));
      const labels = points
        .filter((_, i) => i === 0 || i === points.length - 1 || i % labelEvery === 0)
        .map((p) => {
          const i = points.indexOf(p);
          const lbl = p.date.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });
          return `<text x="${xAt(i).toFixed(1)}" y="${H - 10}" text-anchor="middle" fill="${labelColor}" font-size="10" font-family="var(--font-mono-data)">${escapeHtml(lbl)}</text>`;
        })
        .join("");
      const markerRing = token("--color-surface-1");
      const endX = xAt(points.length - 1).toFixed(1);
      const endY = yAt(currentIdx).toFixed(1);
      svg.innerHTML = `
        <defs>
          <linearGradient id="perfAreaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="${lineColor}" stop-opacity="0.22"/>
            <stop offset="100%" stop-color="${lineColor}" stop-opacity="0"/>
          </linearGradient>
        </defs>
        ${grid}
        <line x1="${pad.l}" y1="${refY.toFixed(1)}" x2="${W - pad.r}" y2="${refY.toFixed(1)}" stroke="${refLineColor}" stroke-dasharray="5 4"/>
        <path d="${area}" fill="url(#perfAreaFill)"/>
        <path d="${line}" fill="none" stroke="${lineColor}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="${endX}" cy="${endY}" r="10" fill="${lineColor}" opacity="0.2"/>
        <circle cx="${endX}" cy="${endY}" r="6" fill="${lineColor}" stroke="${markerRing}" stroke-width="2"/>
        <text x="${W - pad.r}" y="${pad.t}" text-anchor="end" fill="${lineColor}" font-size="13" font-weight="600" font-family="var(--font-mono-data)">${currentIdx.toFixed(1)}</text>
        ${labels}`;

      const rangeLabel = PERF_RANGE_LABELS[perfRange] || perfRange;
      setText(
        "perf-change",
        totalNom ? `${positive ? "+" : ""}${pctFr(periodPct, 2)}` : "—",
      );
      setText(
        "perf-change-abs",
        totalNom
          ? `${positive ? "+" : ""}${moneyShort(periodAbs)} sur la période`
          : "—",
      );
      setText("perf-change-label", `Performance · ${rangeLabel}`);
      setText(
        "perf-chart-note",
        `Courbe indicative ${rangeLabel} · du ${startDate.toLocaleDateString("fr-FR")} au ${endDate.toLocaleDateString("fr-FR")} · base 100 au début de période`,
      );
      const changeEl = document.getElementById("perf-change");
      if (changeEl) {
        changeEl.classList.toggle("up", positive);
        changeEl.classList.toggle("dn", !positive && totalNom > 0);
      }
    }

    function drawPerfChart() {
      const data = productsForScope();
      const totalNom = data.reduce((s, p) => s + (Number(p.nominal) || 0), 0);
      const totalVal = data.reduce((s, p) => s + (Number(p.val) || 0), 0);

      setText("perf-nominal", totalNom ? moneyShort(totalNom) : "—");
      setText("perf-valuation", totalVal ? moneyShort(totalVal) : "—");

      const panel = document.getElementById("perf-cgp");
      if (panel) panel.classList.toggle("perf-empty", !totalNom);

      drawPerfHistory(totalNom, totalVal);
    }

    // Tableau part/encours (Dashboard v3, remplace l'anneau SVG de
    // dashboard-correctif-02.md § 3 — mesuré en DOM sur la maquette :
    // plus d'arcs, seulement le tableau) : top 5 nommés, puis une ligne
    // "N autres émetteurs". Couleur de marque jamais en style="" — la
    // classe .issuer-<id> porte var(--issuer-<id>) en CSS, sur le
    // swatch ET sur le trait souligné sous le nom (largeur = part réelle
    // du groupe dans l'encours, pas un décor).
    function buildIssuerTableRows(rows, total) {
      const top = rows.slice(0, 5);
      const rest = rows.slice(5);
      const restNominal = rest.reduce((sum, row) => sum + row.nominal, 0);
      const topHtml = top
        .map((row) => {
          const pct = (row.nominal / total) * 100;
          const cls = row.issuerClass ? ` ${row.issuerClass}` : "";
          return `<div class="issuer-table-row">
            <span class="issuer-swatch${cls}"></span>
            <span class="issuer-table-name-wrap">
              <span class="issuer-table-name">${escapeHtml(row.issuer)}</span>
              <span class="issuer-table-underline${cls}" style="width:${pct.toFixed(1)}%"></span>
            </span>
            <span class="issuer-table-amt">${moneyShort(row.nominal)}</span>
            <span class="issuer-table-pct">${pctFr(pct, 1)}</span>
          </div>`;
        })
        .join("");
      const restHtml = rest.length
        ? `<div class="issuer-table-row issuer-table-rest">
            <span class="issuer-swatch"></span>
            <span class="issuer-table-name-wrap">
              <span class="issuer-table-name">${rest.length} autres émetteurs</span>
              <span class="issuer-table-underline" style="width:${((restNominal / total) * 100).toFixed(1)}%"></span>
            </span>
            <span class="issuer-table-amt">${moneyShort(restNominal)}</span>
            <span class="issuer-table-pct">${pctFr((restNominal / total) * 100, 1)}</span>
          </div>`
        : "";
      return topHtml + restHtml;
    }

    function renderIssuerExposure() {
      const c = document.getElementById("issuer-exposure");
      if (!c) return;
      const data = productsForScope();
      if (!data.length) {
        c.innerHTML = `<div class="empty-inline">Aucune exposition à afficher.</div>`;
        return;
      }
      const rows = [...data.reduce((map, p) => {
        const issuer = bankGroupName(p.emetteur);
        const row = map.get(issuer) || { issuer, nominal: 0, issuerClass: issuerBrandClass(p.emetteur) };
        row.nominal += Number(p.nominal) || 0;
        map.set(issuer, row);
        return map;
      }, new Map()).values()].sort((a, b) => b.nominal - a.nominal);
      const total = rows.reduce((sum, row) => sum + row.nominal, 0) || 1;
      const head = `<div class="issuer-head-row">
          <span></span>
          <span class="dash-th">Émetteur</span>
          <span class="dash-th cap-col-right">Nominal</span>
          <span class="dash-th cap-col-right">Part</span>
        </div>`;
      c.innerHTML = `${head}${buildIssuerTableRows(rows, total)}`;
    }

    // Top/Flop VL (Passe 7 reprise, bloc 7b — rouvert après mesure de
    // Écarts de VL (specs/dashboard.md § 2.2, corrigé par
    // dashboard-correctif-01.md C1 + C6) : une seule liste, un axe
    // unique centré à 50 % de la zone de tracé (deux colonnes 1fr
    // égales), qui reste au centre quelles que soient les données — si
    // tout le portefeuille est sous 100, la moitié droite reste vide,
    // c'est l'information (C2). Nom sur une seule ligne (200px,
    // ellipsis), pas de sous-jacent empilé dessous. Valeur en points
    // d'écart à 100 (ex. +27,4), pas un pourcentage — ni %, ni
    // 2 décimales : pctFr ne convient pas ici, d'où ptsFr, formateur
    // dédié qui n'ajoute aucune unité (le signe suit la même convention
    // que pctFr/moneyShort : le "−" est géré ici, le "+" reste à la
    // charge de l'appelant). Encre partout, jamais mer ni terre (§ 2.2,
    // "le monochrome est correct et reste") : positif et négatif partagent
    // la même trame gravée (115°, 2px/5px) — Dashboard v3, mesurée
    // identique dans les deux sens, annule le remplissage plein côté
    // positif de dashboard-correctif-01.md C7.
    //
    // C6 — sélection : classer TOUS les produits par écart à 100
    // décroissant, prendre les 5 premiers et les 5 derniers, aucune
    // condition de signe (les "5 meilleurs" restent les 5 premiers du
    // classement même s'ils sont tous négatifs). Moins de 10 produits :
    // tout afficher, une seule fois chacun — slice(0,5)+slice(-5) se
    // chevauchent quand data.length < 10, le dédoublonnage par id après
    // coup absorbe le chevauchement sans jamais répéter une ligne.
    //
    // C1 — domaine : max(abs(écart)) sur les lignes AFFICHÉES (pas tout
    // le portefeuille), arrondi au point supérieur, plancher 4 points.
    // Recalculé à chaque rendu puisque `rows` change avec les données.
    // Largeur : abs(écart)/domaine en %, plancher 3px — CSS
    // max(3px, X%) directement, comme la maquette (pas de HEADROOM
    // arbitraire : l'arrondi au point supérieur donne déjà la marge).
    function ptsFr(value, digits = 1) {
      const n = Number(value) || 0;
      const sign = n < 0 ? "−" : "";
      return `${sign}${Math.abs(n).toFixed(digits).replace(".", ",")}`;
    }
    function renderVlTopFlop() {
      const c = document.getElementById("vl-top-flop");
      if (!c) return;
      const data = productsForScope()
        .filter(
          (p) =>
            Number.isFinite(Number(p.val)) &&
            Number.isFinite(Number(p.nominal)) &&
            Number(p.nominal) > 0,
        )
        .map((p) => ({
          ...p,
          vlLevel: Number.isFinite(Number(p.vlPct))
            ? Number(p.vlPct)
            : (Number(p.val) / Number(p.nominal)) * 100,
        }))
        .sort((a, b) => b.vlLevel - a.vlLevel);
      if (!data.length) {
        c.innerHTML = `<div class="empty-inline">Aucune VL exploitable.</div>`;
        return;
      }
      const rows = [...data.slice(0, 5), ...data.slice(-5)]
        .filter((p, i, arr) => arr.findIndex((q) => q.id === p.id) === i)
        .sort((a, b) => b.vlLevel - a.vlLevel);
      const domain = Math.max(4, Math.ceil(Math.max(...rows.map((p) => Math.abs(p.vlLevel - 100)))));
      const renderRow = (p) => {
        const delta = p.vlLevel - 100;
        const pos = delta >= 0;
        const barWidth = `max(3px, ${((Math.abs(delta) / domain) * 100).toFixed(1)}%)`;
        return `<button type="button" class="vl-diverge-row vl-row" data-topflop-row data-calque="vl-row" onclick="openDrawer(${p.id})">
          <span class="vl-diverge-main" data-topflop-name>${escapeHtml(p.name)}</span>
          <span class="vl-diverge-half vl-diverge-half-neg">${!pos ? `<span class="vl-diverge-bar" data-topflop-bar data-calque="vl-bar" style="width:${barWidth}"></span>` : ""}</span>
          <span class="vl-diverge-half vl-diverge-half-pos" data-topflop-axis>${pos ? `<span class="vl-diverge-bar" data-topflop-bar data-calque="vl-bar" style="width:${barWidth}"></span>` : ""}</span>
          <span class="vl-diverge-value" data-topflop-val data-calque="vl-val">${pos ? "+" : ""}${ptsFr(delta)}</span>
        </button>`;
      };
      c.innerHTML = `<div class="vl-head">
          <span>Produit</span>
          <span class="vl-head-neg">sous 100</span>
          <span>au-dessus</span>
          <span class="vl-head-neg">écart</span>
        </div>
        <div class="vl-rows">${rows.map(renderRow).join("")}</div>`;
    }

    function renderDashboardModules() {
      renderIssuerExposure();
      renderVlTopFlop();
    }

    // Sous la protection du capital (specs/dashboard.md § 2.1, remplace
    // l'ancienne jauge §1.4 sur axe −20/+40) : règle graduée dédiée, axe
    // −60 % à +20 % pour toute l'application (D2, tranché le 05/08) — le
    // niveau initial (0 %) est un repère INTÉRIEUR à 75 % de l'axe, pas
    // le bord droit : un produit qui a gagné a droit à une place sur la
    // règle. Rainure, encoche PDI (seuil), curseur (niveau réel), zone
    // franchie hachurée entre l'encoche et le curseur — l'encoche seule
    // ne dit pas l'ampleur du franchissement, la zone si. Plancher de
    // largeur (§2.1) : sous 3 % de l'axe (~9 px sur 300), la trame ne
    // rend plus qu'une hachure et devient invisible — un produit à peine
    // sous sa barrière est justement le cas qu'il faut voir.
    const CAP_AXIS_MIN = -60;
    const CAP_AXIS_MAX = 20;
    const CAP_ZONE_FLOOR_PCT = 3;
    function capAxisPct(value) {
      const clamped = Math.max(CAP_AXIS_MIN, Math.min(CAP_AXIS_MAX, Number(value) || 0));
      return ((clamped - CAP_AXIS_MIN) / (CAP_AXIS_MAX - CAP_AXIS_MIN)) * 100;
    }
    function renderAlerts() {
      const c = document.getElementById("alerts-list");
      const block = document.getElementById("dash-alerts-block");
      if (!c) return;
      const list = buildPortfolioAlerts();
      const meta = document.getElementById("alerts-meta");
      if (block) block.classList.toggle("is-empty", !list.length);
      if (meta) {
        meta.textContent = list.length
          ? `${list.length} position${list.length > 1 ? "s" : ""}`
          : "Aucune position sous la protection du capital";
      }
      if (!list.length) {
        c.innerHTML = '<div class="cap-empty">Rien d\'urgent — aucune position sous la protection du capital.</div>';
        return;
      }
      // Forme en tableau (Dashboard v3, remplace la forme en cartes de
      // dashboard-correctif-02.md § 2) : <ton> = breach si la position a
      // franchi (statusCls "st-breach"), watch sinon (crit ou warn, non
      // franchi) — posé sur .cap-row, lu par les descendants .cap-breach/
      // .cap-cursor/.cap-perf via .tone-watch. « depuis N j » n'est pas
      // rendu : aucun champ du modèle ne porte la date d'entrée dans
      // l'état breach/watch (RÈGLE ABSOLUE, trou nommé dans le rapport).
      const head = `<div class="cap-head-row">
          <span class="dash-th">Position</span>
          <span class="dash-th cap-col-right">Vs initial</span>
          <span class="dash-th cap-axis-labels"><span>${CAP_AXIS_MIN} %</span><span>+${CAP_AXIS_MAX} %</span></span>
          <span class="dash-th cap-col-right">Niveau initial</span>
          <span class="dash-th cap-col-right">Barrière</span>
        </div>`;
      const rows = list.map((a) => {
        const hasPerf = Number.isFinite(Number(a.perfVsInitial));
        const hasBarrier = Number.isFinite(Number(a.barrierVsInitial));
        const hasInitial = a.initialSpot != null && Number.isFinite(Number(a.initialSpot));
        const toneClass = a.statusCls === "st-breach" ? "" : " tone-watch";
        let rule = "";
        if (hasPerf && hasBarrier) {
          const spotPct = capAxisPct(a.perfVsInitial);
          const pdiPct = capAxisPct(a.barrierVsInitial);
          const zoneL = Math.min(spotPct, pdiPct);
          const zoneW = Math.max(CAP_ZONE_FLOOR_PCT, Math.abs(spotPct - pdiPct));
          rule = `<span class="cap-rule">
              <span class="cap-groove" data-calque="groove"></span>
              <span class="cap-breach" data-calque="breach" style="left:${zoneL.toFixed(2)}%;width:${zoneW.toFixed(2)}%"></span>
              <span class="cap-zero"></span>
              <span class="cap-notch" data-calque="notch" style="left:${pdiPct.toFixed(2)}%"></span>
              <span class="cap-cursor" style="left:${spotPct.toFixed(2)}%"></span>
            </span>`;
        }
        return `<div class="cap-row${toneClass}" onclick="openDrawer(${a.productId})">
            <span class="cap-name"><strong>${escapeHtml(a.name)}</strong><span class="cap-meta">${escapeHtml(a.context)}</span></span>
            <span class="cap-perf">${hasPerf ? `${a.perfVsInitial >= 0 ? "+" : ""}${pctFr(a.perfVsInitial, 1)}` : "\u2014"}</span>
            ${rule || '<span class="cap-rule"></span>'}
            <span class="cap-niveau">${hasInitial ? a.initialSpot.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "\u2014"}</span>
            <span class="cap-barriere">${hasBarrier ? `${a.barrierVsInitial >= 0 ? "+" : ""}${pctFr(a.barrierVsInitial, 0)}` : "\u2014"}</span>
          </div>`;
      }).join("");
      c.innerHTML = `<div class="cap-table">${head}${rows}</div>`;
    }

    function monthShortFR(date) {
      return date
        .toLocaleDateString("fr-FR", { month: "short" })
        .replace(".", "")
        .toUpperCase();
    }

    // La cellule montant découle du type de l'événement, jamais l'inverse
    // (passe 8, §3) : Constatation montre un état (distance, poids réduit,
    // §3 nuance validée à l'écran), Coupon un flux réel, Rappel/Maturité
    // saine un total décisionnel avec son détail, Maturité en
    // franchissement une exposition — nature différente, pas une couleur.
    function eventAmountCell(e) {
      // Capital garanti n'a pas de barrière : e.level.distance vaut 999
      // (sentinel, app-state.js:343, tone "st-none" — statusFromDist),
      // pas un écart réel.
      if (e.level && e.level.tone === "st-none") {
        return `<div class="timeline-amt">—</div>`;
      }
      if (e.level) {
        const sign = e.level.distance < 0 ? "−" : "+";
        const value = pctFr(Math.abs(e.level.distance), 1);
        return `<div class="timeline-amt timeline-level"><span class="timeline-level-sign ${escapeHtml(e.level.tone)}">${sign}</span><span class="timeline-level-value">${value}</span></div>`;
      }
      if (e.exposure) {
        return `<div class="timeline-amt timeline-exposure"><b>${escapeHtml(e.exposure)}</b><small>nominal exposé</small></div>`;
      }
      if (e.cashflow) {
        return `<div class="timeline-amt timeline-cashflow"><b>${escapeHtml(e.cashflow.total)}</b><small>${escapeHtml(e.cashflow.capital)} + ${escapeHtml(e.cashflow.coupon)}</small></div>`;
      }
      // Un montant de coupon reconstitué n'est jamais une donnée
      // confirmée (aucun flux de marché ni paiement réel suivi par
      // l'app, passé ou futur) — toujours affiché comme attendu, jamais
      // comme acquis, qu'importe la barrière ou la date (passe 8, §2).
      if (e.amt) {
        return `<div class="timeline-amt timeline-cashflow">${escapeHtml(e.amt)}<small class="timeline-conditional-note">conditionnel</small></div>`;
      }
      return `<div class="timeline-amt">—</div>`;
    }

    // Repère de lecture ("Aujourd'hui", "Date d'émission") : une frise,
    // pas une ligne d'événement — pas de nom de produit, pas de cellule
    // montant. data-landmark="today" permet au tiroir de s'y positionner
    // à l'ouverture (passe 8, §2).
    function timelineLandmarkHtml(e) {
      return `<div class="timeline-landmark"${e.marker === "today" ? ' data-landmark="today"' : ""}><span>${escapeHtml(e.name)}</span></div>`;
    }

    function evHtml(evs) {
      const todayStr = isoDate(new Date());
      return evs
        .map((e) => {
          if (e.type === "landmark") return timelineLandmarkHtml(e);
          const isPast = e._dateIso < todayStr;
          return `<div class="timeline-item ev-${e.type}${isPast ? " is-past" : ""}" ${e.productId ? `onclick="openDrawer(${e.productId})"` : ""}>
    <div class="timeline-date"><b>${escapeHtml(e.d)}</b><small>${escapeHtml(e.m)}</small></div>
    <div class="timeline-main"><b>${escapeHtml(e.name)}</b><small>${escapeHtml(e.desc)}</small></div>
    ${eventAmountCell(e)}
  </div>`;
        })
        .join("");
    }

    function setRange(el, range) {
      perfRange = range || "ytd";
      document.querySelectorAll(".perf-range-controls .pill-filter").forEach((chip) => {
        chip.classList.toggle(
          "on",
          chip === el || chip.dataset.perfRange === perfRange,
        );
      });
      drawPerfChart();
    }

    // Inclinaison au survol (passe 3) : cartes KPI du dashboard
    // uniquement, jusqu'à 3° d'après la position du curseur dans la
    // carte. Cartes statiques dans le HTML, liées une seule fois.
    function bindKpiTilt() {
      document.querySelectorAll("#view-dashboard .kpi.tilt").forEach((card) => {
        card.addEventListener("mousemove", (e) => {
          const r = card.getBoundingClientRect();
          const rx = ((e.clientY - r.top) / r.height - 0.5) * -3;
          const ry = ((e.clientX - r.left) / r.width - 0.5) * 3;
          card.style.transform =
            `perspective(900px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) translateY(-3px)`;
        });
        card.addEventListener("mouseleave", () => { card.style.transform = ""; });
      });
    }

    if (typeof document !== "undefined") {
      setInterval(tick, 1000);
      tick();
      initTicker();
      bindKpiTilt();
    }

    return {
      initTicker,
      renderDashboardSummary,
      updateAppModeUI,
      toggleAppMode,
      drawPerfChart,
      renderDashboardModules,
      renderIssuerExposure,
      renderVlTopFlop,
      renderAlerts,
      buildPortfolioAlerts,
      renderSessionChrome,
      evHtml,
      monthShortFR,
      setRange,
      bankGroupName,
    };
  },
);
