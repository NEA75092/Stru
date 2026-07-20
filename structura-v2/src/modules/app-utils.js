(function initStructuraUtils(root, factory) {
  const api = factory(root);
  root.StructuraUtils = api;
  root.setText = api.setText;
  root.moneyShort = api.moneyShort;
  root.notify = api.notify;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(
  typeof globalThis !== "undefined" ? globalThis : this,
  function createStructuraUtils() {
    function setText(id, value) {
      const el = document.getElementById(id);
      if (el) el.textContent = value;
    }

    function moneyShort(value) {
      const n = Number(value) || 0;
      if (Math.abs(n) >= 1000000)
        return `${(n / 1000000).toLocaleString("fr-FR", { maximumFractionDigits: 1 })}M€`;
      if (Math.abs(n) >= 1000)
        return `${Math.round(n / 1000).toLocaleString("fr-FR")}k€`;
      return `${Math.round(n).toLocaleString("fr-FR")}€`;
    }

    function escapeHtml(value) {
      return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    }

    /** Deterministic seeded PRNG (mulberry32) — same seed always gives
     * the same sequence, so a synthetic series stays stable across
     * re-renders instead of jittering every repaint. */
    function seededRng(seedStr) {
      let h = 1779033703 ^ String(seedStr || "").length;
      for (let i = 0; i < String(seedStr || "").length; i++) {
        h = Math.imul(h ^ String(seedStr).charCodeAt(i), 3432918353);
        h = (h << 13) | (h >>> 19);
      }
      let state = h >>> 0;
      return function rng() {
        state |= 0;
        state = (state + 0x6d2b79f5) | 0;
        let t = Math.imul(state ^ (state >>> 15), 1 | state);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }

/**
     * Deterministic Brownian bridge between startValue and endValue,
     * seeded so the same seed always retraces the same path (stable
     * across re-renders instead of random noise on every repaint).
     * Shared primitive behind buildSyntheticLevelSeries (drawer chart)
     * and sparkline series (table/KPI trend previews) — same "no real
     * history yet" caveat applies to every caller.
     */
    function buildBridgeSeries(seed, startValue, endValue, numPoints = 24) {
      const rng = seededRng(seed);
      const gauss = () => {
        // Box-Muller, using the seeded rng instead of Math.random so the
        // whole path stays deterministic for a given seed.
        const u1 = Math.max(rng(), 1e-6);
        const u2 = rng();
        return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      };
      const volatility = Math.max(2, Math.abs(startValue - endValue) * 0.35);
      let walk = 0;
      const raw = [0];
      for (let i = 1; i <= numPoints; i++) {
        walk += gauss();
        raw.push(walk);
      }
      const n = numPoints;
      const points = raw.map((w, i) => {
        const frac = i / n;
        // Brownian bridge: pin the random walk to 0 at both ends so the
        // line still starts at startValue and ends at endValue.
        const bridge = w - frac * raw[n];
        const value = startValue + (endValue - startValue) * frac + bridge * (volatility / Math.max(1, Math.sqrt(n / 4)));
        return { t: frac, value };
      });
      points[0].value = startValue;
      points[n].value = endValue;
      return points;
    }

    /**
     * Synthetic historical level series for a product's underlying, in
     * the same base-100 scale as its barrier fields (--color-* levels
     * are all "% of initial", not absolute index points). No real
     * historical feed is wired up yet (see vl-registry.js) — this is a
     * deterministic Brownian bridge from 100 (initial fixing) to the
     * level implied by the product's current barrier/dist, seeded by
     * ISIN so it's stable across re-renders rather than random noise.
     * Returns null when there's nothing meaningful to plot (no barrier
     * concept, e.g. capital-guaranteed products).
     */
    function buildSyntheticLevelSeries(product, numPoints = 48) {
      const barrier = Number(product?.barrier);
      const dist = Number(product?.dist);
      if (!Number.isFinite(barrier) || barrier <= 0 || !Number.isFinite(dist)) {
        return null;
      }
      const startLevel = 100;
      const currentLevel = barrier * (1 + dist / 100);
      const bridge = buildBridgeSeries(product.isin || product.id, startLevel, currentLevel, numPoints);
      const points = bridge.map((pt) => ({ t: pt.t, level: pt.value }));
      return { points, startLevel, currentLevel, barrierLevel: barrier };
    }

    /**
     * Inline sparkline: a tiny SVG trend line (no axes, no grid) from a
     * deterministic bridge series — same synthetic-data caveat as
     * buildSyntheticLevelSeries. seed should be unique per row (e.g. an
     * ISIN or `${id}:pnl`) so different metrics on the same product
     * don't draw an identical wiggle.
     */
    /** Renders a values array (any real or synthetic series) as a tiny
     * axis-free SVG trend line — the shared drawing step behind
     * buildSparklineSvg, also usable directly with real computed data
     * (e.g. buildPerfSeries) instead of the synthetic bridge. */
    function buildSparklineFromValues(values, opts = {}) {
      const {
        width = 48,
        height = 20,
        color = "var(--color-aegean)",
        strokeWidth = 1.5,
      } = opts;
      if (!Array.isArray(values) || values.length < 2) return "";
      const min = Math.min(...values);
      const max = Math.max(...values);
      const spread = max - min || 1;
      const pad = strokeWidth;
      const plotH = height - pad * 2;
      const xAt = (i) => (i / (values.length - 1)) * width;
      const yAt = (v) => pad + plotH - ((v - min) / spread) * plotH;
      const path = values
        .map((v, i) => `${i === 0 ? "M" : "L"}${xAt(i).toFixed(1)},${yAt(v).toFixed(1)}`)
        .join(" ");
      return `<svg class="spark" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" preserveAspectRatio="none" aria-hidden="true"><path d="${path}" fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg>`;
    }

    /** Synthetic sparkline (Brownian bridge from startValue to
     * endValue) — see buildBridgeSeries for the "no real history yet"
     * caveat. Use buildSparklineFromValues directly when real computed
     * data is already available (e.g. buildPerfSeries). */
    function buildSparklineSvg(seed, startValue, endValue, opts = {}) {
      if (!Number.isFinite(startValue) || !Number.isFinite(endValue)) return "";
      const numPoints = opts.numPoints || 20;
      const series = buildBridgeSeries(seed, startValue, endValue, numPoints);
      return buildSparklineFromValues(series.map((pt) => pt.value), opts);
    }

    /** "12,3M€" → 12.3 ; "-7.4%" → -7.4 ; non-numeric text → NaN. */
    function parseLooseNumber(text) {
      return parseFloat(String(text).replace(/[^\d.,-]/g, "").replace(",", "."));
    }

    /** null = unchanged, else "up" | "down" | "neutral". */
    function valueFlashDirection(prevText, nextText) {
      if (prevText == null || prevText === nextText) return null;
      const pn = parseLooseNumber(prevText);
      const nn = parseLooseNumber(nextText);
      if (Number.isFinite(pn) && Number.isFinite(nn) && nn !== pn) {
        return nn > pn ? "up" : "down";
      }
      return "neutral";
    }

    function applyFlash(el, dir) {
      if (!el || !dir) return;
      el.classList.remove("flash-up", "flash-down", "flash-neutral");
      // Re-trigger the animation even if the same class was applied moments ago.
      void el.offsetWidth;
      el.classList.add(`flash-${dir}`);
      el.addEventListener(
        "animationend",
        () => el.classList.remove(`flash-${dir}`),
        { once: true },
      );
    }

    /**
     * Sets el's text to value; if it changed, briefly flashes a semantic
     * background (up/down/neutral) so the update reads as a signal
     * instead of a silent swap. Pass invert:true for values where a
     * rise is bad news (breach/alert counts) so it flashes danger
     * instead of success.
     */
    function flashText(el, value, { invert = false } = {}) {
      if (!el) return;
      const prev = el.textContent;
      const next = String(value);
      let dir = valueFlashDirection(prev, next);
      if (invert && (dir === "up" || dir === "down")) {
        dir = dir === "up" ? "down" : "up";
      }
      el.textContent = next;
      applyFlash(el, dir);
    }

    function setTextFlash(id, value, opts) {
      flashText(document.getElementById(id), value, opts);
    }

    /**
     * Rebuilds tbody.innerHTML from rowHtml (each row must carry
     * data-row-key="<key>"). Three things are preserved across the
     * rebuild instead of snapping straight to the new markup:
     *  - any .bar-fill width change FLIPs (jump to the old width with
     *    transitions suppressed, release to the new width next frame)
     *    so the gauge glides instead of jumping;
     *  - any [data-flip-border] cell whose border-left-color changed
     *    (e.g. row-warn → row-breach) FLIPs the same way, so a status
     *    escalation transitions instead of snapping;
     *  - any [data-flash="<key>"] cell whose text changed gets a brief
     *    semantic flash (see flashText) instead of a silent swap.
     */
    function renderRowsWithGaugeTransition(tbody, rowHtml) {
      if (!tbody) return;
      const oldWidths = new Map();
      const oldBorderColor = new Map();
      const oldFlashText = new Map();
      tbody.querySelectorAll("[data-row-key]").forEach((tr) => {
        const key = tr.dataset.rowKey;
        const fill = tr.querySelector(".bar-fill");
        if (fill) oldWidths.set(key, fill.style.width);
        const borderCell = tr.querySelector("[data-flip-border]");
        if (borderCell) {
          oldBorderColor.set(key, getComputedStyle(borderCell).borderLeftColor);
        }
        tr.querySelectorAll("[data-flash]").forEach((cell) => {
          oldFlashText.set(`${key}::${cell.dataset.flash}`, cell.textContent);
        });
      });
      tbody.innerHTML = rowHtml;
      tbody.querySelectorAll("[data-row-key]").forEach((tr) => {
        const key = tr.dataset.rowKey;
        const fill = tr.querySelector(".bar-fill");
        if (fill) {
          const oldWidth = oldWidths.get(key);
          const newWidth = fill.style.width;
          if (oldWidth != null && oldWidth !== newWidth) {
            fill.style.setProperty("transition", "none", "important");
            fill.style.width = oldWidth;
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                fill.style.removeProperty("transition");
                fill.style.width = newWidth;
              });
            });
          }
        }
        const borderCell = tr.querySelector("[data-flip-border]");
        if (borderCell) {
          const oldColor = oldBorderColor.get(key);
          const newColor = getComputedStyle(borderCell).borderLeftColor;
          if (oldColor != null && oldColor !== newColor) {
            borderCell.style.setProperty("transition", "none", "important");
            borderCell.style.setProperty("border-left-color", oldColor, "important");
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                borderCell.style.removeProperty("transition");
                borderCell.style.removeProperty("border-left-color");
              });
            });
          }
        }
        tr.querySelectorAll("[data-flash]").forEach((cell) => {
          const prev = oldFlashText.get(`${key}::${cell.dataset.flash}`);
          applyFlash(cell, valueFlashDirection(prev, cell.textContent));
        });
      });
    }

    function notify(msg, type = "ok") {
      if (typeof document === "undefined") return;
      const d = document.createElement("div");
      d.className = `notif notif-${type}`;
      d.textContent = msg;
      document.body.appendChild(d);
      setTimeout(() => {
        d.style.opacity = "0";
        d.style.transition = "opacity .3s";
        setTimeout(() => d.remove(), 300);
      }, 2800);
    }

    return {
      setText,
      moneyShort,
      escapeHtml,
      notify,
      renderRowsWithGaugeTransition,
      flashText,
      setTextFlash,
      buildSyntheticLevelSeries,
      buildSparklineSvg,
      buildSparklineFromValues,
    };
  },
);
