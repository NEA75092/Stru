(function initStructuraCalendar(root, factory) {
  const api = factory(root);
  Object.assign(root, api);
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(
  typeof globalThis !== "undefined" ? globalThis : this,
  function createStructuraCalendar(root) {
    const { setText, moneyShort, escapeHtml } = root.StructuraUtils;
    const { productsForScope, addDays, isoDate, productMatchesClientSearch } =
      root.StructuraAppState;

    function monthShortFR(date) {
      return date
        .toLocaleDateString("fr-FR", { month: "short" })
        .replace(".", "")
        .toUpperCase();
    }

    function evHtml(evs) {
      return evs
        .map(
          (e) => `<div class="ev ev-${e.type}">
    <div class="ev-date-box"><div class="ev-day">${escapeHtml(e.d)}</div><div class="ev-mon">${escapeHtml(e.m)}</div></div>
    <div><div class="ev-name">${escapeHtml(e.name)}</div><div class="ev-desc">${escapeHtml(e.desc)}</div></div>
    <div class="ev-amt ${e.type === "coupon" ? "up" : ""}">${escapeHtml(e.amt || "—")}</div>
  </div>`,
        )
        .join("");
    }

    const dashboardApi = root.StructuraDashboard || {};
    const monthShortFRRef = dashboardApi.monthShortFR || monthShortFR;
    const evHtmlRef = dashboardApi.evHtml || evHtml;
    let calendarSearch = "";
    const calendarState = {
      mode: "month",
      date: isoDate(new Date()),
      week: null,
      month: null,
      year: String(new Date().getFullYear()),
      start: null,
      end: null,
      rollingDays: 30,
    };

    const CALENDAR_MODE_LABELS = {
      day: "Vue jour",
      week: "Vue semaine",
      month: "Vue mois",
      year: "Vue année",
      range: "Plage personnalisée",
      rolling: "Période glissante",
    };

    function eventMatchesSearch(event, query) {
      const q = String(query || "").trim().toLowerCase();
      if (!q) return true;
      const product = productsForScope().find((p) => p.id === event.productId);
      return [
        event.name,
        event.desc,
        product?.name,
        product?.isin,
        product?.emetteur,
        product?.underlying,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q));
    }

    function couponCashflowAmount(product) {
      const couponPerPeriod =
        product?.characteristics?.couponPerPeriodPct ??
        root.StructuraDomain?.couponPerPeriod?.(
          product?.cpnNum,
          product?.characteristics?.frequency || product?.frequency || "annuel",
        ) ??
        ((Number(product?.cpnNum) || 0) / 12);
      return ((Number(product?.nominal) || 0) * (Number(couponPerPeriod) || 0)) / 100;
    }

    function monthTitleFR(date) {
      const label = date.toLocaleDateString("fr-FR", {
        month: "long",
        year: "numeric",
      });
      return label.charAt(0).toUpperCase() + label.slice(1);
    }

    function classifyEventType(label = "") {
      const t = label.toLowerCase();
      if (t.includes("matur")) return "mat";
      if (t.includes("rappel") || t.includes("obs") || t.includes("constat"))
        return "obs";
      if (t.includes("coupon")) return "coupon";
      return "obs";
    }

    function findProductsMatchingSearch(query) {
      const q = String(query || "").trim().toLowerCase();
      if (!q) return [];
      return productsForScope().filter((product) => {
        if (productMatchesClientSearch?.(product, q)) return true;
        return [product.name, product.isin, product.emetteur, product.underlying]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(q));
      });
    }

    function frequencyMonths(freq) {
      const f = String(freq || "").toLowerCase();
      if (f.includes("mens")) return 1;
      if (f.includes("trim")) return 3;
      if (f.includes("semest")) return 6;
      if (f.includes("ann")) return 12;
      return 3;
    }

    function pushScheduleEvent(events, seen, product, dateIso, label, type, amt) {
      if (!dateIso) return;
      const key = `${product.id}|${dateIso}|${type}|${label}`;
      if (seen.has(key)) return;
      seen.add(key);
      const d = new Date(`${dateIso}T00:00:00`);
      if (Number.isNaN(d.getTime())) return;
      events.push({
        productId: product.id,
        _dateIso: dateIso,
        d: String(d.getDate()).padStart(2, "0"),
        m: monthShortFRRef(d),
        _monthKey: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
        type: type || classifyEventType(label),
        name: `${product.name} — ${label}`,
        desc: `${product.underlying || "—"} · ${product.emetteur || "—"}`,
        amt: amt || "—",
      });
    }

    function buildProductFullSchedule(product) {
      const events = [];
      const seen = new Set();

      if (Array.isArray(product.scheduleData) && product.scheduleData.length) {
        product.scheduleData.forEach((row) => {
          const label = row.label || row.event || row.type || row.l || "Observation";
          const dateIso = row.date || row._dateIso;
          pushScheduleEvent(
            events,
            seen,
            product,
            dateIso,
            label,
            classifyEventType(label),
            row.amount || product.coupon,
          );
        });
      } else {
        const start = product.issueDate || product.subDate;
        const end = product.maturity;
        const freq = product.characteristics?.frequency || product.frequency || "trimestriel";
        const step = frequencyMonths(freq);
        const isCouponProduct =
          /coupon/i.test(product.nextEvt || "") || Number(product.cpnNum) > 0;

        if (start) {
          pushScheduleEvent(events, seen, product, start, "Date d'émission", "obs", "—");
        }
        if (start && end) {
          const cursor = new Date(`${start}T00:00:00`);
          const endDate = new Date(`${end}T00:00:00`);
          cursor.setMonth(cursor.getMonth() + step);
          while (cursor < endDate) {
            const iso = isoDate(cursor);
            const label = isCouponProduct ? "Coupon / observation" : "Observation";
            pushScheduleEvent(
              events,
              seen,
              product,
              iso,
              label,
              isCouponProduct ? "coupon" : "obs",
              product.coupon,
            );
            cursor.setMonth(cursor.getMonth() + step);
          }
        }
        if (product.nextEvtDate) {
          pushScheduleEvent(
            events,
            seen,
            product,
            product.nextEvtDate,
            product.nextEvt || "Prochaine observation",
            classifyEventType(product.nextEvt || ""),
            product.coupon,
          );
        }
      }

      if (product.maturity) {
        pushScheduleEvent(
          events,
          seen,
          product,
          product.maturity,
          "Maturité",
          "mat",
          product.nominal ? moneyShort(product.nominal) : "—",
        );
      }

      return events.sort((a, b) => a._dateIso.localeCompare(b._dateIso));
    }

    function renderProductFocus(products) {
      const focusEl = document.getElementById("cal-product-focus");
      const periodEl = document.getElementById("cal-period-view");
      const listEl = document.getElementById("cal-product-focus-list");
      const metaEl = document.getElementById("cal-product-focus-meta");
      if (!focusEl || !listEl) return;

      focusEl.hidden = false;
      if (periodEl) periodEl.hidden = true;

      const todayStr = isoDate(new Date());
      const query = calendarSearch.trim();
      if (metaEl) {
        metaEl.textContent =
          products.length === 1
            ? `${products[0].name} · échéancier complet indépendant de la période`
            : `${products.length} produits pour « ${query} » · échéanciers complets`;
      }

      setText("cal-context-title", "Recherche produit");
      setText("cal-context-mode", "Échéancier complet");
      setText(
        "cal-context-sub",
        "Toutes les échéances passées et futures — la sélection jour / mois / année n'applique pas ici.",
      );

      listEl.innerHTML = products
        .map((product) => {
          const schedule = buildProductFullSchedule(product);
          const past = schedule.filter((event) => event._dateIso < todayStr).length;
          const future = schedule.filter((event) => event._dateIso >= todayStr).length;
          return `<div class="cal-product-card panel">
            <div class="cal-product-card-hdr">
              <div class="cal-product-card-copy">
                <div class="cal-product-card-kicker">${escapeHtml(product.isin || "—")} · ${escapeHtml(product.emetteur || "—")}</div>
                <button type="button" class="cal-product-card-title" onclick="openDrawer(${product.id})">${escapeHtml(product.name)}</button>
                <div class="cal-product-card-sub">${escapeHtml(product.underlying || "—")} · ${moneyShort(product.nominal || 0)} nominal</div>
              </div>
              <div class="cal-product-card-stats">
                <span>${schedule.length} échéance${schedule.length > 1 ? "s" : ""}</span>
                <small>${past} passée${past > 1 ? "s" : ""} · ${future} à venir</small>
              </div>
            </div>
            <div class="cal-product-timeline">
              ${
                schedule.length
                  ? evHtmlRef(schedule)
                  : `<div class="cal-product-empty">Aucune échéance reconstituable pour ce produit.</div>`
              }
            </div>
          </div>`;
        })
        .join("");
    }

    function buildProductCalendarEvents() {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = isoDate(today);
      const horizon = isoDate(addDays(today, 370));
      const events = [];

      productsForScope().forEach((p) => {
        if (p.nextEvtDate && p.nextEvtDate >= todayStr && p.nextEvtDate <= horizon) {
          const d = new Date(p.nextEvtDate + "T00:00:00");
          events.push({
            productId: p.id,
            _dateIso: p.nextEvtDate,
            d: String(d.getDate()).padStart(2, "0"),
            m: monthShortFRRef(d),
            _monthKey: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
            type: classifyEventType(p.nextEvt || ""),
            name: `${p.name} — ${p.nextEvt || "Observation"}`,
            desc: `${p.underlying || "—"} · ${p.emetteur || "—"}`,
            amt: p.coupon || "—",
          });
        }
        if (p.maturity && p.maturity >= todayStr && p.maturity <= horizon) {
          const d = new Date(p.maturity + "T00:00:00");
          events.push({
            productId: p.id,
            _dateIso: p.maturity,
            d: String(d.getDate()).padStart(2, "0"),
            m: monthShortFRRef(d),
            _monthKey: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
            type: "mat",
            name: `${p.name} — Maturité`,
            desc: `Remboursement · ${p.underlying || "—"}`,
            amt: p.nominal ? moneyShort(p.nominal) : "—",
          });
        }
      });

      return events.sort((a, b) => a._dateIso.localeCompare(b._dateIso));
    }

    function parseIsoDate(value) {
      const date = new Date(`${value || ""}T00:00:00`);
      return Number.isNaN(date.getTime()) ? new Date() : date;
    }

    function rangeForMode() {
      const base = parseIsoDate(calendarState.date);
      const day = isoDate(base);
      if (calendarState.mode === "day") return { start: day, end: day, title: `Jour sélectionné · ${base.toLocaleDateString("fr-FR")}` };
      if (calendarState.mode === "week") {
        const start = calendarState.week ? weekInputToDate(calendarState.week) : new Date(base);
        const offset = (start.getDay() + 6) % 7;
        start.setDate(start.getDate() - offset);
        const end = addDays(start, 6);
        return { start: isoDate(start), end: isoDate(end), title: `Semaine du ${start.toLocaleDateString("fr-FR")}` };
      }
      if (calendarState.mode === "month") {
        const monthValue = calendarState.month || day.slice(0, 7);
        const [year, month] = monthValue.split("-").map(Number);
        const start = new Date(year, month - 1, 1);
        const end = new Date(year, month, 0);
        return { start: isoDate(start), end: isoDate(end), title: monthTitleFR(start) };
      }
      if (calendarState.mode === "year") {
        const year = Number(calendarState.year) || base.getFullYear();
        return {
          start: `${year}-01-01`,
          end: `${year}-12-31`,
          title: `Année ${year}`,
        };
      }
      if (calendarState.mode === "rolling") {
        const start = new Date(base);
        const days = Number(calendarState.rollingDays) || 30;
        const end = addDays(start, days - 1);
        return {
          start: isoDate(start),
          end: isoDate(end),
          title: `${days} jours glissants · dès ${start.toLocaleDateString("fr-FR")}`,
        };
      }
      const start = calendarState.start || day;
      const end = calendarState.end || start;
      return {
        start: start <= end ? start : end,
        end: start <= end ? end : start,
        title: `Période du ${parseIsoDate(start).toLocaleDateString("fr-FR")} au ${parseIsoDate(end).toLocaleDateString("fr-FR")}`,
      };
    }

    function filterEventsByRange(events, start, end) {
      return events.filter((event) => event._dateIso >= start && event._dateIso <= end);
    }

    function weekInputToDate(value) {
      const match = String(value || "").match(/^(\d{4})-W(\d{2})$/);
      if (!match) return parseIsoDate(calendarState.date);
      const year = Number(match[1]);
      const week = Number(match[2]);
      const jan4 = new Date(year, 0, 4);
      const jan4Day = (jan4.getDay() + 6) % 7;
      const monday = new Date(jan4);
      monday.setDate(jan4.getDate() - jan4Day + (week - 1) * 7);
      return monday;
    }

    function dateToWeekInput(date) {
      const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
      const day = d.getUTCDay() || 7;
      d.setUTCDate(d.getUTCDate() + 4 - day);
      const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
      const week = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
      return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
    }

    function updateCalendarKpis(periodEvents) {
      const allEvents = buildProductCalendarEvents().filter((event) =>
        eventMatchesSearch(event, calendarSearch),
      );
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const in30 = isoDate(addDays(today, 30));
      const todayStr = isoDate(today);
      const upcoming = allEvents.filter(
        (e) => e._dateIso >= todayStr && e._dateIso <= in30,
      );
      const coupons = upcoming.filter((e) => e.type === "coupon");
      const mats = upcoming.filter((e) => e.type === "mat");
      const obs = upcoming.filter((e) => e.type === "obs");

      const couponAmt = coupons.reduce((sum, e) => {
        const p = productsForScope().find((x) => x.id === e.productId);
        if (!p?.cpnNum || !p?.nominal) return sum;
        return sum + couponCashflowAmount(p);
      }, 0);

      const matAmt = mats.reduce((sum, e) => {
        const p = productsForScope().find((x) => x.id === e.productId);
        return sum + (Number(p?.nominal) || 0);
      }, 0);

      setText(
        "cal-kpi-coupon-val",
        couponAmt ? moneyShort(couponAmt) : "—",
      );
      setText(
        "cal-kpi-coupon-sub",
        `${coupons.length} versement${coupons.length > 1 ? "s" : ""} attendu${coupons.length > 1 ? "s" : ""}`,
      );
      setText("cal-kpi-mat-val", matAmt ? moneyShort(matAmt) : "—");
      setText(
        "cal-kpi-mat-sub",
        `${mats.length} produit${mats.length > 1 ? "s" : ""} à maturité`,
      );
      setText("cal-kpi-obs-val", String(obs.length));
      setText("cal-kpi-obs-sub", "Dates de constatation");
      setText("cal-kpi-bar-val", String(periodEvents.length));
      const range = rangeForMode();
      setText(
        "cal-kpi-bar-sub",
        periodEvents.length
          ? `Du ${parseIsoDate(range.start).toLocaleDateString("fr-FR")} au ${parseIsoDate(range.end).toLocaleDateString("fr-FR")}`
          : "Sur la période affichée",
      );
    }

    function drawFluxChart() {
      const container = document.getElementById("cal-flux-chart");
      if (!container) return;
      const selectedRange = rangeForMode();
      const events = buildProductCalendarEvents()
        .filter((event) => eventMatchesSearch(event, calendarSearch))
        .filter(
          (e) =>
            e.type === "coupon" &&
            e._dateIso >= selectedRange.start &&
            e._dateIso <= selectedRange.end,
        );
      const buckets = new Map();
      events.forEach((e) => {
        const d = new Date(e._dateIso + "T00:00:00");
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        const p = productsForScope().find((x) => x.id === e.productId);
        if (!p?.cpnNum || !p?.nominal) return;
        buckets.set(key, (buckets.get(key) || 0) + couponCashflowAmount(p));
      });
      const entries = [...buckets.entries()].sort((a, b) => a[0].localeCompare(b[0]));
      const meta = document.getElementById("cal-flux-meta");
      const title = document.getElementById("cal-flux-title");
      if (title) title.textContent = "Flux de coupons";
      if (meta) {
        meta.textContent = entries.length
          ? `${selectedRange.title} · ${entries.length} mois avec flux`
          : selectedRange.title;
      }
      if (!entries.length) {
        container.innerHTML = `<div class="cal-flux-empty">Aucun coupon sur cette période.</div>`;
        return;
      }
      const max = Math.max(...entries.map(([, v]) => v), 1);
      container.innerHTML = entries
        .map(([key, amount]) => {
          const [year, month] = key.split("-").map(Number);
          const label = new Date(year, month - 1, 1).toLocaleDateString("fr-FR", {
            month: "short",
          });
          const height = Math.max(8, Math.round((amount / max) * 88));
          const display =
            amount >= 1e6
              ? `${(amount / 1e6).toFixed(2)} M€`
              : amount >= 1e3
                ? `${Math.round(amount / 1e3)} k€`
                : `${Math.round(amount)} €`;
          return `<div class="cal-flux-bar-wrap">
            <span class="cal-flux-bar-val">${escapeHtml(display)}</span>
            <div class="cal-flux-bar" style="height:${height}px" title="${escapeHtml(display)}"></div>
            <span class="cal-flux-bar-label">${escapeHtml(label)}</span>
          </div>`;
        })
        .join("");
    }

    function updateCalendarContext(selectedRange, periodEvents, day) {
      const refDate = parseIsoDate(day);
      const modeLabel = CALENDAR_MODE_LABELS[calendarState.mode] || "Calendrier";
      setText("cal-context-title", selectedRange.title);
      setText("cal-context-mode", modeLabel);
      setText(
        "cal-context-sub",
        `Date de référence : ${refDate.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} · ${periodEvents.length} événement${periodEvents.length > 1 ? "s" : ""} sur la période affichée`,
      );
      setText(
        "cal-period-hint",
        calendarState.mode === "day"
          ? "Mode jour : un seul panneau liste les événements du jour sélectionné."
          : calendarState.mode === "rolling"
            ? `Fenêtre glissante de ${calendarState.rollingDays || 30} jours à partir de la date de référence.`
            : "Colonne de gauche = focus sur la date de référence · colonne de droite = période affichée.",
      );
      setText(
        "cal-events-meta",
        `${selectedRange.title} · du ${parseIsoDate(selectedRange.start).toLocaleDateString("fr-FR")} au ${parseIsoDate(selectedRange.end).toLocaleDateString("fr-FR")}`,
      );
      const periodMeta = document.getElementById("cal-period-meta");
      if (periodMeta) {
        periodMeta.textContent =
          calendarState.mode === "day"
            ? "Même jour que la date de référence"
            : `${periodEvents.length} événement${periodEvents.length > 1 ? "s" : ""}`;
      }
    }

    function renderCalendar() {
      const productMatches = findProductsMatchingSearch(calendarSearch);
      const isProductSearch = Boolean(calendarSearch.trim() && productMatches.length);

      if (isProductSearch) {
        renderProductFocus(productMatches);
        syncCalendarControls();
        return;
      }

      const focusEl = document.getElementById("cal-product-focus");
      const periodEl = document.getElementById("cal-period-view");
      if (focusEl) focusEl.hidden = true;
      if (periodEl) periodEl.hidden = false;

      const allEvents = buildProductCalendarEvents().filter((event) =>
        eventMatchesSearch(event, calendarSearch),
      );
      const selectedRange = rangeForMode();
      const day = calendarState.date || isoDate(new Date());
      const dayEvents = filterEventsByRange(allEvents, day, day);
      const periodEvents = filterEventsByRange(allEvents, selectedRange.start, selectedRange.end);
      updateCalendarKpis(periodEvents);
      updateCalendarContext(selectedRange, periodEvents, day);
      if (calendarSearch.trim() && !productMatches.length) {
        setText(
          "cal-context-sub",
          `Aucun produit trouvé pour « ${calendarSearch.trim()} ». Affichage des événements sur la période sélectionnée.`,
        );
      }
      syncCalendarControls();
      const isDayMode = calendarState.mode === "day";
      const eventsGrid = document.getElementById("cal-events-grid");
      const dayCol = document.getElementById("cal-day-col");
      if (eventsGrid) eventsGrid.classList.toggle("cal-events-day", isDayMode);
      if (dayCol) dayCol.style.display = isDayMode ? "none" : "";
      const dayTitle = document.getElementById("cal-day-title");
      const periodTitle = document.getElementById("cal-period-title");
      if (dayTitle) {
        dayTitle.textContent = isDayMode
          ? `Événements du ${parseIsoDate(day).toLocaleDateString("fr-FR")}`
          : `Jour de référence · ${parseIsoDate(day).toLocaleDateString("fr-FR")}`;
      }
      if (periodTitle) {
        periodTitle.textContent = isDayMode
          ? selectedRange.title
          : selectedRange.title;
      }
      const dayContainer = document.getElementById("cal-day");
      const periodContainer = document.getElementById("cal-period");
      const emptyMsg = `<div style="text-align:center;color:var(--text3);padding:20px;font-size:11px;">Aucun événement produit sur cette période</div>`;
      if (dayContainer) dayContainer.innerHTML = dayEvents.length ? evHtmlRef(dayEvents) : emptyMsg;
      if (periodContainer) periodContainer.innerHTML = periodEvents.length ? evHtmlRef(periodEvents) : emptyMsg;
      drawFluxChart();
    }

    function syncCalendarControls() {
      const dateEl = document.getElementById("cal-date");
      const weekEl = document.getElementById("cal-week");
      const monthEl = document.getElementById("cal-month-picker");
      const yearEl = document.getElementById("cal-year");
      const modeEl = document.getElementById("cal-mode");
      const startEl = document.getElementById("cal-start");
      const endEl = document.getElementById("cal-end");
      const rollingEl = document.getElementById("cal-rolling");
      const baseDate = parseIsoDate(calendarState.date);
      calendarState.week = calendarState.week || dateToWeekInput(baseDate);
      calendarState.month = calendarState.month || calendarState.date.slice(0, 7);
      document.querySelectorAll("[data-calendar-mode]").forEach((button) => {
        button.classList.toggle("on", button.dataset.calendarMode === calendarState.mode);
      });
      if (dateEl) {
        dateEl.value = calendarState.date;
        dateEl.disabled = false;
      }
      if (weekEl) {
        weekEl.value = calendarState.week;
        weekEl.style.display = calendarState.mode === "week" ? "" : "none";
      }
      if (monthEl) {
        monthEl.value = calendarState.month;
        monthEl.style.display = calendarState.mode === "month" ? "" : "none";
      }
      if (yearEl) {
        yearEl.value = calendarState.year;
        yearEl.style.display = calendarState.mode === "year" ? "" : "none";
      }
      if (modeEl) modeEl.value = calendarState.mode;
      if (rollingEl) {
        rollingEl.value = String(calendarState.rollingDays || 30);
        rollingEl.style.display = calendarState.mode === "rolling" ? "" : "none";
      }
      if (startEl) {
        startEl.value = calendarState.start || calendarState.date;
        startEl.style.display = calendarState.mode === "range" ? "" : "none";
      }
      if (endEl) {
        endEl.value = calendarState.end || calendarState.date;
        endEl.style.display = calendarState.mode === "range" ? "" : "none";
      }
    }

    function filterCalendar(value) {
      calendarSearch = value || "";
      renderCalendar();
    }

    function setCalendarDate(value) {
      calendarState.date = value || isoDate(new Date());
      calendarState.month = calendarState.date.slice(0, 7);
      calendarState.year = calendarState.date.slice(0, 4);
      calendarState.week = dateToWeekInput(parseIsoDate(calendarState.date));
      if (calendarState.mode === "range") {
        calendarState.start = calendarState.start || calendarState.date;
        calendarState.end = calendarState.end || calendarState.date;
      }
      renderCalendar();
    }

    function setCalendarMode(value) {
      calendarState.mode = value || "month";
      if (calendarState.mode === "range") {
        calendarState.start = calendarState.start || calendarState.date;
        calendarState.end = calendarState.end || calendarState.date;
      }
      renderCalendar();
    }

    function resetCalendarView() {
      const today = isoDate(new Date());
      calendarState.mode = "month";
      calendarState.date = today;
      calendarState.week = dateToWeekInput(parseIsoDate(today));
      calendarState.month = today.slice(0, 7);
      calendarState.year = today.slice(0, 4);
      calendarState.start = null;
      calendarState.end = null;
      calendarState.rollingDays = 30;
      renderCalendar();
    }

    function setCalendarWeek(value) {
      calendarState.week = value || dateToWeekInput(new Date());
      renderCalendar();
    }

    function setCalendarMonth(value) {
      calendarState.month = value || isoDate(new Date()).slice(0, 7);
      calendarState.year = calendarState.month.slice(0, 4);
      renderCalendar();
    }

    function setCalendarYear(value) {
      const year = Number(value) || new Date().getFullYear();
      calendarState.year = String(year);
      calendarState.month = `${calendarState.year}-01`;
      renderCalendar();
    }

    function setCalendarRange() {
      calendarState.mode = "range";
      calendarState.start = document.getElementById("cal-start")?.value || calendarState.date;
      calendarState.end = document.getElementById("cal-end")?.value || calendarState.start;
      renderCalendar();
    }

    function setCalendarRolling(value) {
      calendarState.mode = "rolling";
      calendarState.rollingDays = Number(value) || 30;
      renderCalendar();
    }

    root.buildProductCalendarEvents = buildProductCalendarEvents;
    root.buildProductFullSchedule = buildProductFullSchedule;

    return {
      buildProductCalendarEvents,
      buildProductFullSchedule,
      renderCalendar,
      drawFluxChart,
      filterCalendar,
      setCalendarDate,
      setCalendarMode,
      setCalendarWeek,
      setCalendarMonth,
      setCalendarYear,
      setCalendarRange,
      setCalendarRolling,
      resetCalendarView,
    };
  },
);
