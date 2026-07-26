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
      // Réduit à un mappage vers les classes de pastille de tables.css
      // (passe 4) : la couleur elle-même n'est plus jamais posée en JS,
      // seul le nom de classe voyage.
      ST_COLOR: {
        breach: "st-breach",
        crit: "st-crit",
        warn: "st-warn",
        safe: "st-safe",
        none: "st-none",
        unknown: "st-unknown",
      },
      ST_LABEL_SHORT: {
        breach: "FRANCHIE",
        crit: "CRITIQUE",
        warn: "ALERTE",
        safe: "SAIN",
        none: "GARANTI",
        unknown: "A CONF.",
      },
      TYPE_NAMES,
    };
  },
);
