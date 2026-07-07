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

    return { setText, moneyShort, escapeHtml, notify };
  },
);
