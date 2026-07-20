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
     * data-row-key="<key>"). Two things are preserved across the
     * rebuild instead of snapping straight to the new markup:
     *  - any .bar-fill width change FLIPs (jump to the old width with
     *    transitions suppressed, release to the new width next frame)
     *    so the gauge glides instead of jumping;
     *  - any [data-flash="<key>"] cell whose text changed gets a brief
     *    semantic flash (see flashText) instead of a silent swap.
     */
    function renderRowsWithGaugeTransition(tbody, rowHtml) {
      if (!tbody) return;
      const oldWidths = new Map();
      const oldFlashText = new Map();
      tbody.querySelectorAll("[data-row-key]").forEach((tr) => {
        const key = tr.dataset.rowKey;
        const fill = tr.querySelector(".bar-fill");
        if (fill) oldWidths.set(key, fill.style.width);
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
    };
  },
);
