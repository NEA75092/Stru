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
      { l: "OAT 10a", v: "3.12%", d: null },
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

    function buildPortfolioAlerts() {
      const severity = { breach: 0, crit: 1, warn: 2 };
      return productsForScope()
        .filter((p) => ["breach", "crit", "warn"].includes(p.st?.s))
        .sort(
          (a, b) =>
            (severity[a.st?.s] ?? 9) - (severity[b.st?.s] ?? 9) ||
            (Number(a.dist) || 0) - (Number(b.dist) || 0),
        )
        .slice(0, 5)
        .map((p) => ({
          productId: p.id,
          lvl: p.st.s === "breach" || p.st.s === "crit" ? "crit" : "warn",
          statusCls: p.st.cls,
          statusLabel: p.st.label,
          name: p.name,
          // "Distance protection :" retiré : la valeur seule suffit
          // une fois qu'elle est à côté du nom du sous-jacent — le
          // libellé ne faisait que répéter ce que la colonne dit déjà
          // (passe 6, section B.3).
          context: `${p.underlying || "—"} · ${
            Number.isFinite(Number(p.dist))
              ? `${p.dist > 0 ? "+" : ""}${pctFr(p.dist)}`
              : "à confirmer"
          } · obs. ${shortDateFr(p.nextEvtDate)}`,
          amount: p.val,
        }));
    }

    function bankGroupName(value) {
      const src = String(value || "");
      const match = GUARANTOR_ALIASES.find((entry) => entry.re.test(src));
      return match?.label || src.trim() || "Émetteur à confirmer";
    }

    function initTicker() {
      const c = document.getElementById("ticker");
      if (!c) return;
      const items = INDICES.map(
        (i) =>
          `<div class="ticker-item"><span class="ticker-label">${i.l}</span><span class="ticker-val">${typeof i.v === "number" ? i.v.toLocaleString("fr-FR") : i.v}</span>${i.d !== null ? `<span class="ticker-chg ${i.d >= 0 ? "up" : "dn"}">${i.d >= 0 ? "▲" : "▼"}${Math.abs(i.d)}%</span>` : ""}</div>`,
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
      const isDarkTheme =
        typeof globalThis.getTheme === "function" && globalThis.getTheme() === "dark";
      const css = getComputedStyle(document.documentElement);
      const token = (name) => css.getPropertyValue(name).trim();
      const gridColor = isDarkTheme ? "rgba(255,255,255,0.10)" : "#f0ece0";
      const labelColor = token("--color-text-tertiary");
      const refLineColor = isDarkTheme ? "rgba(255,255,255,0.22)" : "#d9cba9";
      const lineColor = token("--color-aegean");
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
      grid += `<text x="${pad.l - 6}" y="${refY.toFixed(1)}" text-anchor="end" dominant-baseline="middle" fill="${labelColor}" font-size="9" font-family="IBM Plex Mono">100</text>`;
      const labelEvery = Math.max(1, Math.ceil(points.length / 5));
      const labels = points
        .filter((_, i) => i === 0 || i === points.length - 1 || i % labelEvery === 0)
        .map((p) => {
          const i = points.indexOf(p);
          const lbl = p.date.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });
          return `<text x="${xAt(i).toFixed(1)}" y="${H - 10}" text-anchor="middle" fill="${labelColor}" font-size="10" font-family="IBM Plex Mono">${escapeHtml(lbl)}</text>`;
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
        <text x="${W - pad.r}" y="${pad.t}" text-anchor="end" fill="${lineColor}" font-size="13" font-weight="700" font-family="IBM Plex Mono">${currentIdx.toFixed(1)}</text>
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

    // Donut de répartition (refonte Dolce Vita Fintech, 2026-07-25) :
    // regroupe les lignes déjà calculées par renderIssuerExposure en
    // top 3 + "Autres" (4 segments max, comme spécifié) — pure
    // présentation, aucun recalcul de nominal/poids, juste un regroupement
    // d'affichage des mêmes valeurs "rows"/"total" déjà agrégées.
    function buildIssuerDonutSvg(rows, total) {
      const css = getComputedStyle(document.documentElement);
      const token = (name) => css.getPropertyValue(name).trim();
      const PALETTE = [token("--color-aegean"), token("--color-coral"), token("--color-sky")];
      const REST_COLOR = token("--color-neutral-warm");
      const top = rows.slice(0, 3);
      const restNominal = rows.slice(3).reduce((sum, row) => sum + row.nominal, 0);
      const segments = [
        ...top.map((row, i) => ({
          label: row.issuer,
          value: row.nominal,
          color: PALETTE[i],
        })),
        ...(restNominal > 0
          ? [{ label: "Autres émetteurs", value: restNominal, color: REST_COLOR }]
          : []),
      ].filter((s) => s.value > 0);
      const r = 48;
      const cx = 60;
      const cy = 60;
      const circumference = 2 * Math.PI * r;
      let offset = 0;
      const arcs = segments
        .map((seg) => {
          const frac = seg.value / total;
          const len = frac * circumference;
          const dasharray = `${len.toFixed(2)} ${(circumference - len).toFixed(2)}`;
          const dashoffset = (-offset).toFixed(2);
          offset += len;
          return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${seg.color}" stroke-width="16" stroke-dasharray="${dasharray}" stroke-dashoffset="${dashoffset}" stroke-linecap="round"/>`;
        })
        .join("");
      const legend = segments
        .map((seg) => {
          const pct = ((seg.value / total) * 100).toFixed(1);
          return `<div class="donut-legend-item">
            <span class="donut-legend-dot" style="--dot:${seg.color}"></span>
            <span class="donut-legend-label">${escapeHtml(seg.label)}</span>
            <span class="donut-legend-value">${pct}%</span>
          </div>`;
        })
        .join("");
      const bankCount = rows.length;
      return `<div class="donut-wrap">
        <div class="donut-figure">
          <svg viewBox="0 0 120 120" class="donut-svg" transform="rotate(-90)" style="transform:rotate(-90deg)">${arcs}</svg>
          <div class="donut-center"><strong>${bankCount}</strong><span>banque${bankCount > 1 ? "s" : ""}</span></div>
        </div>
        <div class="donut-legend">${legend}</div>
      </div>`;
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
        const row = map.get(issuer) || { issuer, nominal: 0, val: 0, breach: 0, count: 0 };
        row.nominal += Number(p.nominal) || 0;
        row.val += Number(p.val) || 0;
        row.count += 1;
        if (["breach", "crit"].includes(p.st?.s)) row.breach += 1;
        map.set(issuer, row);
        return map;
      }, new Map()).values()].sort((a, b) => b.nominal - a.nominal);
      const total = rows.reduce((sum, row) => sum + row.nominal, 0) || 1;
      const donut = buildIssuerDonutSvg(rows, total);
      // Liste complète (plus de plafond à 8) : le donut au-dessus reste
      // lisible à 4 segments max quel que soit le nombre d'émetteurs
      // réels, mais la liste détaillée doit montrer TOUTES les banques
      // du portefeuille (5 comme 30) — un conteneur scrollable à
      // hauteur fixe absorbe la longueur au lieu de tronquer les
      // données ou de pousser la hauteur de la carte indéfiniment.
      const rowsHtml = rows.map((row) => {
        const weight = (row.nominal / total) * 100;
        const pnl = row.nominal ? ((row.val - row.nominal) / row.nominal) * 100 : 0;
        return `<div class="issuer-row">
          <div class="issuer-row-top">
            <span class="issuer-name">${escapeHtml(row.issuer)}</span>
            <span class="issuer-metric">${moneyShort(row.nominal)} · ${weight.toFixed(1)}%</span>
          </div>
          <div class="issuer-bar"><span style="width:${Math.max(2, Math.min(100, weight))}%"></span></div>
          <div class="issuer-row-sub">
            <span>${row.count} produit${row.count > 1 ? "s" : ""}</span>
            <span class="${pnl >= 0 ? "up" : "dn"}">${pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}% vs nominal</span>
            <span>${row.breach ? `${row.breach} critique${row.breach > 1 ? "s" : ""}` : "risque normal"}</span>
          </div>
        </div>`;
      }).join("");
      c.innerHTML = `${donut}<div class="issuer-list-scroll">${rowsHtml}</div>`;
    }

    function renderDashboardTimeline() {
      const c = document.getElementById("dashboard-timeline");
      if (!c) return;
      const events = (root.buildProductCalendarEvents?.() || [])
        .slice()
        .sort((a, b) => String(a._dateIso || "").localeCompare(String(b._dateIso || "")));
      const fallback = productsForScope()
        .slice()
        .sort((a, b) => new Date(a.nextEvtDate || a.maturity) - new Date(b.nextEvtDate || b.maturity))
        .map((p) => ({
          productId: p.id,
          _dateIso: p.nextEvtDate || p.maturity,
          name: p.nextEvt || "Constatation",
          desc: `${p.name} · ${p.underlying || "—"}`,
          type: p.st?.s === "breach" ? "bar" : p.nextEvt?.toLowerCase().includes("coupon") ? "coupon" : "obs",
        }));
      const list = (events.length ? events : fallback).slice(0, 7);
      if (!list.length) {
        c.innerHTML = `<div class="empty-inline">Aucune constatation à venir.</div>`;
        return;
      }
      c.innerHTML = list.map((e) => {
        const date = new Date(`${e._dateIso || e.date || e.iso || ""}T00:00:00`);
        const day = Number.isNaN(date.getTime()) ? "—" : String(date.getDate()).padStart(2, "0");
        const month = Number.isNaN(date.getTime()) ? "" : monthShortFR(date);
        return `<button class="timeline-item timeline-${escapeHtml(e.type || "obs")}" ${e.productId ? `onclick="openDrawer(${e.productId})"` : ""}>
          <span class="timeline-date"><b>${day}</b><small>${month}</small></span>
          <span class="timeline-main"><b>${escapeHtml(e.name || "Événement")}</b><small>${escapeHtml(e.desc || "")}</small></span>
        </button>`;
      }).join("");
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
      // Échelle réelle, pas 0-100 : les VL de ce portefeuille tiennent
      // sur un point et demi (92-94 % dans l'exemple client). Sur une
      // échelle 0-100 toutes les barres se ressembleraient — l'échelle
      // doit montrer l'écart réel (passe 6, section C).
      const levels = data.map((p) => p.vlLevel);
      const scaleMin = Math.min(...levels);
      const scaleMax = Math.max(...levels);
      const pctAt = (v) =>
        scaleMax > scaleMin ? ((v - scaleMin) / (scaleMax - scaleMin)) * 100 : 100;
      const renderRow = (p) => {
        const cls = p.vlLevel >= 100 ? "up" : "dn";
        return `<button type="button" class="vl-row" onclick="openDrawer(${p.id})">
          <span class="vl-row-top">
            <span class="vl-main"><b>${escapeHtml(p.name)}</b><small>${escapeHtml(p.underlying || p.emetteur || "—")}</small></span>
            <span class="vl-value ${cls}">${pctFr(p.vlLevel, 2)}</span>
          </span>
          <span class="vl-dist-track"><span class="vl-dist-fill ${cls}" style="width:${pctAt(p.vlLevel).toFixed(1)}%"></span></span>
        </button>`;
      };
      // Le montant disparaît (demande client) : ce classement n'est
      // pas une lecture d'encours, c'est une lecture de VL.
      const renderSide = (title, rows) => `<div class="vl-side">
        <div class="vl-side-title">${title}</div>
        <div class="vl-side-legend">VL en % du nominal · base 100 à l'émission</div>
        <div class="vl-rows">${rows.map(renderRow).join("")}</div>
      </div>`;
      c.innerHTML = `${renderSide("Top 5 VL", data.slice(0, 5))}${renderSide("Flop 5 VL", data.slice(-5).reverse())}`;
    }

    function renderDashboardModules() {
      renderIssuerExposure();
      renderDashboardTimeline();
      renderVlTopFlop();
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
          ? `${list.length} produit${list.length > 1 ? "s" : ""} à ouvrir`
          : "Risque barrière : aucune alerte active";
      }
      if (!list.length) {
        c.innerHTML =
          '<div class="al al-ok"><span class="al-rail"></span><div class="al-txt"><strong>Rien d\'urgent</strong><span class="al-context">Aucune alerte barrière ou surveillance sur le portefeuille.</span></div></div>';
        return;
      }
      c.innerHTML = list
        .map(
          (a) =>
            `<div class="al al-${a.lvl}" onclick="openDrawer(${a.productId})"><span class="al-rail"></span><div class="al-txt"><strong>${escapeHtml(a.name)}</strong><span class="al-context">${escapeHtml(a.context)}</span></div><span class="pill-status ${a.statusCls}">${escapeHtml(a.statusLabel)}</span><span class="al-amount">${moneyShort(a.amount)}<svg class="al-chevron" viewBox="0 0 20 20" aria-hidden="true"><path d="M7.5 4.5l6 5.5-6 5.5"/></svg></span></div>`,
        )
        .join("");
    }

    function monthShortFR(date) {
      return date
        .toLocaleDateString("fr-FR", { month: "short" })
        .replace(".", "")
        .toUpperCase();
    }

    function evHtml(evs) {
      return evs
        .map(
          (e) => `<div class="timeline-item ev-${e.type}" ${e.productId ? `onclick="openDrawer(${e.productId})"` : ""}>
    <div class="timeline-date"><b>${escapeHtml(e.d)}</b><small>${escapeHtml(e.m)}</small></div>
    <div class="timeline-main"><b>${escapeHtml(e.name)}</b><small>${escapeHtml(e.desc)}</small></div>
    <div class="timeline-amt">${escapeHtml(e.amt || "—")}</div>
  </div>`,
        )
        .join("");
    }

    function renderEvents() {
      renderDashboardTimeline();
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
      renderDashboardTimeline,
      renderVlTopFlop,
      renderAlerts,
      buildPortfolioAlerts,
      renderSessionChrome,
      renderEvents,
      evHtml,
      monthShortFR,
      setRange,
    };
  },
);
