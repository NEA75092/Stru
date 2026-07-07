(function initStructuraPortfolioConstants(root, factory) {
  const api = factory(root);
  root.StructuraPortfolioConstants = api;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(
  typeof globalThis !== "undefined" ? globalThis : this,
  function createStructuraPortfolioConstants(root) {
    const TYPE_NAMES = root.StructuraAppState?.TYPE_NAMES || {
      AC: "Autocall / Phoenix",
      CG: "Capital Garanti",
      RC: "Reverse Convertible",
      LV: "Levier",
    };

    return {
      TYPE_CLASS: { AC: "tp-ac", CG: "tp-cg", RC: "tp-rc", LV: "tp-lv" },
      TYPE_SHORT: {
        AC: "Autocall",
        CG: "Cap. Garanti",
        RC: "Rev. Conv.",
        LV: "Levier",
      },
      ST_COLOR: {
        breach: "var(--red)",
        crit: "var(--red)",
        warn: "var(--orange)",
        safe: "var(--green)",
        unknown: "var(--text3)",
      },
      ST_LABEL_SHORT: {
        breach: "FRANCHIE",
        crit: "CRITIQUE",
        warn: "ALERTE",
        safe: "SAIN",
        unknown: "A CONF.",
      },
      TYPE_NAMES,
    };
  },
);
