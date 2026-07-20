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
    const { setText, setTextFlash, moneyShort, escapeHtml } = root.StructuraUtils;
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
          ico: p.st.s === "breach" ? "🔴" : "🟡",
          name: p.name,
          desc: `${p.underlying || "—"} · Distance barrière : ${
            Number.isFinite(Number(p.dist))
              ? `${Number(p.dist).toFixed(1)}%`
              : "à confirmer"
          }`,
          time: p.nextEvtDate || "—",
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

    function renderSessionChrome() {
      if (typeof document === "undefined") return;
      const { session, greeting } = touchSession();
      const data = productsForScope();
      const alerts = buildPortfolioAlerts();
      const breach = data.filter((p) => p.st?.s === "breach").length;
      const watch = data.filter((p) => ["crit", "warn"].includes(p.st?.s)).length;

      setText("session-org-line", session.orgName || "Cabinet Structura");
      setText("session-user-name", session.advisorName || "Conseiller");
      setText("session-user-role", session.role || "CGP");
      setText("session-avatar", sessionInitials(session.advisorName));
      setText("session-headline", `${greeting}, ${session.advisorName}`);
      setText(
        "session-subline",
        alerts.length
          ? `${alerts.length} point${alerts.length > 1 ? "s" : ""} à traiter sur le portefeuille.`
          : breach || watch
            ? `${breach + watch} produit${breach + watch > 1 ? "s" : ""} sous surveillance.`
            : `${data.length} produit${data.length > 1 ? "s" : ""} actifs · ${CLIENTS.length} dossier${CLIENTS.length > 1 ? "s" : ""} client.`,
      );
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
      setTextFlash("kpi-total-val", totalVal ? moneyShort(totalVal) : "0€");
      setText(
        "kpi-total-sub",
        totalNominal
          ? `${pnlPct >= 0 ? "+" : ""}${pnlPct.toFixed(2)}% vs encours initial`
          : "Import portefeuille requis",
      );
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
        grid += `<line x1="${pad.l}" y1="${y.toFixed(1)}" x2="${W - pad.r}" y2="${y.toFixed(1)}" stroke="#e8eef4" stroke-width="1"/>`;
      }
      grid += `<text x="${pad.l - 6}" y="${refY.toFixed(1)}" text-anchor="end" dominant-baseline="middle" fill="#8fa0b3" font-size="9" font-family="IBM Plex Mono">100</text>`;
      const labelEvery = Math.max(1, Math.ceil(points.length / 5));
      const labels = points
        .filter((_, i) => i === 0 || i === points.length - 1 || i % labelEvery === 0)
        .map((p) => {
          const i = points.indexOf(p);
          const lbl = p.date.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });
          return `<text x="${xAt(i).toFixed(1)}" y="${H - 10}" text-anchor="middle" fill="#8fa0b3" font-size="10" font-family="IBM Plex Mono">${escapeHtml(lbl)}</text>`;
        })
        .join("");
      const stroke = positive ? "#2d9f6a" : "#d45a5a";
      const fill = positive ? "rgba(45,159,106,0.1)" : "rgba(212,90,90,0.08)";
      svg.innerHTML = `
        ${grid}
        <line x1="${pad.l}" y1="${refY.toFixed(1)}" x2="${W - pad.r}" y2="${refY.toFixed(1)}" stroke="#c5d2df" stroke-dasharray="5 4"/>
        <path d="${area}" fill="${fill}"/>
        <path d="${line}" fill="none" stroke="${stroke}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="${xAt(points.length - 1).toFixed(1)}" cy="${yAt(currentIdx).toFixed(1)}" r="4.5" fill="${stroke}" stroke="#fff" stroke-width="2"/>
        <text x="${W - pad.r}" y="${pad.t}" text-anchor="end" fill="${stroke}" font-size="12" font-weight="600" font-family="IBM Plex Mono">${currentIdx.toFixed(1)}</text>
        ${labels}`;

      const rangeLabel = PERF_RANGE_LABELS[perfRange] || perfRange;
      setText(
        "perf-change",
        totalNom ? `${positive ? "+" : ""}${periodPct.toFixed(2)}%` : "—",
      );
      setText(
        "perf-change-abs",
        totalNom
          ? `${positive ? "+" : ""}${moneyShort(Math.abs(periodAbs))} ${positive ? "sur la période" : "sur la période"}`
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
      c.innerHTML = rows.slice(0, 8).map((row) => {
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
      const renderSide = (title, rows, cls) => `<div class="vl-side vl-side-${cls}">
        <div class="vl-side-title">${title}</div>
        ${rows.map((p) => `<button class="vl-row" onclick="openDrawer(${p.id})">
          <span class="vl-main"><b>${escapeHtml(p.name)}</b><small>${escapeHtml(p.underlying || p.emetteur || "—")}</small></span>
          <span class="vl-values">
            <b class="${cls}">${p.vlLevel.toFixed(2)}%</b>
            <small>${moneyShort(p.val)}</small>
          </span>
        </button>`).join("")}
      </div>`;
      c.innerHTML = `${renderSide("Top 5 VL", data.slice(0, 5), "up")}${renderSide("Flop 5 VL", data.slice(-5).reverse(), "dn")}`;
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
          '<div class="al al-ok"><span class="al-ico">✅</span><div class="al-txt"><strong>Rien d\'urgent</strong>Aucune alerte barrière ou surveillance sur le portefeuille.</div><span class="al-time">—</span></div>';
        return;
      }
      c.innerHTML = list
        .map(
          (a) =>
            `<div class="al al-${a.lvl}" onclick="openDrawer(${a.productId})" style="cursor:pointer"><span class="al-ico">${escapeHtml(a.ico)}</span><div class="al-txt"><strong>${escapeHtml(a.name)}</strong>${escapeHtml(a.desc)}</div><span class="al-time">${escapeHtml(a.time)}</span></div>`,
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
          (e) => `<div class="ev ev-${e.type}" ${e.productId ? `onclick="openDrawer(${e.productId})" style="cursor:pointer"` : ""}>
    <div class="ev-date-box"><div class="ev-day">${escapeHtml(e.d)}</div><div class="ev-mon">${escapeHtml(e.m)}</div></div>
    <div><div class="ev-name">${escapeHtml(e.name)}</div><div class="ev-desc">${escapeHtml(e.desc)}</div></div>
    <div class="ev-amt ${e.type === "coupon" ? "up" : ""}">${escapeHtml(e.amt || "—")}</div>
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

    if (typeof document !== "undefined") {
      setInterval(tick, 1000);
      tick();
      initTicker();
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
