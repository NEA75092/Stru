/**
 * STRUCTURA — Registre VL émetteur (lookup par ISIN)
 * ===================================================
 * La VL est publiée par la banque émettrice / le teneur de compte.
 * Aucun calcul local ne remplace cette donnée.
 *
 * Branchement futur : flux émetteur, portail PRIIPs, import CSV desk.
 */
(function initStructuraVlRegistry(root, factory) {
  const api = factory(root);
  root.StructuraVlRegistry = api;
  root.fetchByISIN = api.fetchProductVlByIsin;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(
  typeof globalThis !== "undefined" ? globalThis : this,
  function createStructuraVlRegistry(root) {
    // MOCK DATA — VL émetteur simulées pour démo locale (ISIN DEMO-* et exemples)
    const ISSUER_VL_BY_ISIN = {
      FR00140016F3: {
        vlPct: 99.12,
        valorisation: null,
        asOf: "2026-06-13",
        source: "Morgan Stanley — KID / flux émetteur",
        issuerId: "MS",
      },
      FR001400ABC1: {
        vlPct: 101.85,
        valorisation: null,
        asOf: "2026-06-13",
        source: "BNP Paribas — portail VL",
        issuerId: "BNP",
      },
    };

    function normalizeIsin(isin) {
      return String(isin || "")
        .trim()
        .toUpperCase()
        .replace(/\s/g, "");
    }

    function isDemoIsin(isin) {
      return /^DEMO-\d{5}$/.test(normalizeIsin(isin));
    }

    /**
     * MOCK DATA — génère une VL émetteur stable pour les ISIN de démo uniquement.
     */
    function buildDemoIssuerVl(isin) {
      const key = normalizeIsin(isin);
      let h = 0;
      for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) % 100000;
      const vlPct = Number((92 + (h % 1600) / 100).toFixed(2));
      return {
        vlPct,
        valorisation: null,
        asOf: new Date().toISOString().slice(0, 10),
        source: "MOCK DATA — VL émetteur simulée (mode démo)",
        issuerId: null,
        isMock: true,
      };
    }

    function lookupIssuerVl(isin) {
      const key = normalizeIsin(isin);
      if (!key) return null;
      if (ISSUER_VL_BY_ISIN[key]) {
        return { ...ISSUER_VL_BY_ISIN[key], isMock: false };
      }
      if (isDemoIsin(key)) return buildDemoIssuerVl(key);
      return null;
    }

    function applyIssuerValorisation(product, issuerVl) {
      if (!product || !issuerVl) return product;
      const nominal = Number(product.nominal) || 0;
      if (
        issuerVl.valorisation != null &&
        issuerVl.valorisation !== "" &&
        Number.isFinite(Number(issuerVl.valorisation))
      ) {
        product.val = Math.round(Number(issuerVl.valorisation));
      } else if (
        nominal > 0 &&
        issuerVl.vlPct != null &&
        Number.isFinite(Number(issuerVl.vlPct))
      ) {
        // Application standard de la VL émetteur (% nominal) — pas un calcul de VL locale
        product.val = Math.round((nominal * Number(issuerVl.vlPct)) / 100);
      }
      product.pnl = product.val - nominal;
      product.pnlPct = nominal
        ? ((product.val - nominal) / nominal) * 100
        : 0;
      return product;
    }

    function enrichProduct(product) {
      if (!product) return product;
      const key = normalizeIsin(product.isin);
      if (!key) {
        product.vlPct = null;
        product.vlAsOf = null;
        product.vlSource = null;
        product.vlStatus = "no_isin";
        return product;
      }

      const issuerVl = lookupIssuerVl(key);
      if (!issuerVl) {
        product.vlPct =
          product.vlStatus === "issuer" && Number.isFinite(Number(product.vlPct))
            ? Number(product.vlPct)
            : null;
        if (!issuerVl && product.vlStatus !== "issuer") {
          product.vlAsOf = null;
          product.vlSource = null;
          product.vlStatus = "missing";
        }
        return product;
      }

      product.vlPct = Number(issuerVl.vlPct);
      product.vlAsOf = issuerVl.asOf || null;
      product.vlSource = issuerVl.source || null;
      product.vlStatus = issuerVl.isMock ? "mock" : "issuer";
      product.vlIssuerId = issuerVl.issuerId || null;
      applyIssuerValorisation(product, issuerVl);
      return product;
    }

    function enrichProducts(products = []) {
      return products.map((p) => enrichProduct({ ...p }));
    }

    async function fetchProductVlByIsin(isin) {
      const key = normalizeIsin(isin);
      if (!key) {
        return { ok: false, message: "ISIN requis", isin: key };
      }

      const local = lookupIssuerVl(key);
      if (local) {
        return {
          ok: true,
          isin: key,
          data: local,
          origin: local.isMock ? "mock" : "registry",
        };
      }

      // Point d'extension : appel API émetteur / import desk
      return {
        ok: false,
        isin: key,
        message:
          "VL émetteur non disponible pour cet ISIN — branchez le flux banque émettrice",
      };
    }

    function syncPortfolioVl(products, saveFn) {
      if (!Array.isArray(products) || !products.length) return 0;
      let updated = 0;
      products.forEach((p) => {
        const before = `${p.vlPct}|${p.vlStatus}|${p.val}`;
        enrichProduct(p);
        const after = `${p.vlPct}|${p.vlStatus}|${p.val}`;
        if (before !== after) updated += 1;
      });
      if (updated > 0 && typeof saveFn === "function") saveFn(products);
      return updated;
    }

    if (root.StructuraAppState?.PRODUCTS) {
      syncPortfolioVl(
        root.StructuraAppState.PRODUCTS,
        root.StructuraAppState.saveProducts,
      );
    }

    return {
      normalizeIsin,
      lookupIssuerVl,
      enrichProduct,
      enrichProducts,
      fetchProductVlByIsin,
      syncPortfolioVl,
    };
  },
);
