/**
 * STRUCTURA Index Registry
 * =========================
 * Mappage des indices par émetteur / calculateur
 * Sources BMR (Benchmark Regulation UE 2016/1011) obligatoires
 *
 * Chaque indice a :
 *   - id, name, ticker, isin
 *   - administrator (banque qui gère)
 *   - calculator (Solactive, Qontigo, S&P, etc.) ou null si propriétaire
 *   - urls de publication BMR (niveaux quotidiens gratuits)
 *   - decrementPts si applicable (indice décrément)
 *   - type: 'decrement' | 'total_return' | 'price_return' | 'custom'
 */

const INDEX_REGISTRY = {
  version: '2026-05-26',
  administrators: {
    SG: {
      label: 'Société Générale',
      portal: 'https://sgindex.com',
      bmrStatement: 'https://www.sgindex.com/regulatory',
      apiEndpoint: 'https://sgindex.com/api/v1/indices',
    },
    BNP: {
      label: 'BNP Paribas',
      portal: 'https://indices.bnpparibas.com',
      bmrStatement: 'https://indices.bnpparibas.com/regulatory-bmr',
    },
    CACIB: {
      label: 'Crédit Agricole CIB',
      portal: 'https://indices.ca-cib.com',
      bmrStatement: 'https://indices.ca-cib.com/benchmark-regulation',
    },
    NATIXIS: {
      label: 'Natixis',
      portal: null, // utilise Solactive/Qontigo
      bmrStatement: null,
    },
    GS: {
      label: 'Goldman Sachs',
      portal: 'https://www.goldmansachs.com/what-we-do/ficc-and-equities/custody-solutions/our-solutions/institutional-grade-solutions',
    },
    JPM: {
      label: 'JP Morgan',
      portal: 'https://si.jpmorgan.com/spweb/',
    },
    MS: {
      label: 'Morgan Stanley',
      portal: 'https://www.morganstanley.com/structuredinvestments/',
    },
    DB: {
      label: 'Deutsche Bank',
      portal: 'https://www.xmarkets.db.com/',
    },
    BARC: {
      label: 'Barclays',
      portal: null,
    },
    HSBC: {
      label: 'HSBC',
      portal: null,
    },
  },

  calculators: {
    SOLACTIVE: {
      label: 'Solactive AG',
      portal: 'https://www.solactive.com/indices/',
      apiEndpoint: 'https://www.solactive.com/api/v1/indices/',
      searchUrl: (q) => `https://www.solactive.com/indices/?search=${encodeURIComponent(q)}`,
    },
    QONTIGO: {
      label: 'Qontigo / STOXX',
      portal: 'https://www.qontigo.com',
      apiEndpoint: 'https://www.stoxx.com/data-service/',
      searchUrl: (q) => `https://www.stoxx.com/search?search=${encodeURIComponent(q)}`,
    },
    SPDJI: {
      label: 'S&P Dow Jones Indices',
      portal: 'https://www.spglobal.com/spdji/',
      searchUrl: (q) => `https://www.spglobal.com/spdji/en/search/?query=${encodeURIComponent(q)}`,
    },
    MSCI: {
      label: 'MSCI',
      portal: 'https://www.msci.com/end-of-day-data-search',
    },
    EURONEXT: {
      label: 'Euronext Indices',
      portal: 'https://www.euronext.com/en/indices',
    },
    BLOOMBERG: {
      label: 'Bloomberg Indices',
      portal: 'https://www.bloombergindices.com/',
    },
  },

  indices: [
    // ──────────── SOCIÉTÉ GÉNÉRALE (SGI) ────────────
    {
      id: 'SGI_CAC40_DEC',
      name: 'CAC 40 Decrement 50 pts',
      ticker: 'SGI-DCAC50',
      isin: null,
      administrator: 'SG',
      calculator: null,
      decrementPts: 50,
      bmrUrl: 'https://sgindex.com/index/SGI-DCAC50',
      type: 'decrement',
      currency: 'EUR',
    },
    {
      id: 'SGI_EUROSTOXX50_DEC',
      name: 'EURO STOXX 50 Decrement 50 pts',
      ticker: 'SGI-DSX550',
      isin: null,
      administrator: 'SG',
      calculator: null,
      decrementPts: 50,
      bmrUrl: 'https://sgindex.com/index/SGI-DSX550',
      type: 'decrement',
      currency: 'EUR',
    },
    {
      id: 'SGI_CAC40_DEC_100',
      name: 'CAC 40 Decrement 100 pts',
      ticker: 'SGI-DCAC100',
      isin: null,
      administrator: 'SG',
      calculator: null,
      decrementPts: 100,
      bmrUrl: 'https://sgindex.com/index/SGI-DCAC100',
      type: 'decrement',
      currency: 'EUR',
    },

    // ──────────── BNP PARIBAS ────────────
    {
      id: 'BNP_CAC40_TR',
      name: 'BNP CAC 40 Total Return Index',
      ticker: 'BNP-CAC40-TR',
      isin: null,
      administrator: 'BNP',
      calculator: null,
      decrementPts: null,
      bmrUrl: 'https://indices.bnpparibas.com/index/BNP-CAC40-TR',
      type: 'total_return',
      currency: 'EUR',
    },
    {
      id: 'BNP_CAC40_DEC_50',
      name: 'BNP CAC 40 Decrement 50 pts',
      ticker: 'BNP-CAC40-D50',
      isin: null,
      administrator: 'BNP',
      calculator: null,
      decrementPts: 50,
      bmrUrl: 'https://indices.bnpparibas.com/index/BNP-CAC40-D50',
      type: 'decrement',
      currency: 'EUR',
    },

    // ──────────── CRÉDIT AGRICOLE CIB ────────────
    {
      id: 'CACIB_CAC40_TR',
      name: 'CACIB CAC 40 TR Index',
      ticker: 'CACIB-CAC40-TR',
      isin: null,
      administrator: 'CACIB',
      calculator: null,
      decrementPts: null,
      bmrUrl: 'https://indices.ca-cib.com/index/CACIB-CAC40-TR',
      type: 'total_return',
      currency: 'EUR',
    },

    // ──────────── SOLACTIVE (utilisé par beaucoup) ────────────
    {
      id: 'SOL_CAC40_DEC_50',
      name: 'CAC 40 Decrement 50 pts (Solactive)',
      ticker: 'SOL-DCAC50',
      isin: 'DE000SOL0DC5',
      administrator: 'NATIXIS',
      calculator: 'SOLACTIVE',
      decrementPts: 50,
      bmrUrl: 'https://www.solactive.com/indices/?index=DE000SOL0DC5',
      type: 'decrement',
      currency: 'EUR',
    },
    {
      id: 'SOL_EUROSTOXX50_DEC_50',
      name: 'EURO STOXX 50 Decrement 50 pts (Solactive)',
      ticker: 'SOL-DSX550',
      isin: 'DE000SOL0DS3',
      administrator: 'NATIXIS',
      calculator: 'SOLACTIVE',
      decrementPts: 50,
      bmrUrl: 'https://www.solactive.com/indices/?index=DE000SOL0DS3',
      type: 'decrement',
      currency: 'EUR',
    },
    {
      id: 'SOL_DAX40_DEC_75',
      name: 'DAX 40 Decrement 75 pts (Solactive)',
      ticker: 'SOL-DDAX75',
      isin: 'DE000SOL0D75',
      administrator: 'NATIXIS',
      calculator: 'SOLACTIVE',
      decrementPts: 75,
      bmrUrl: 'https://www.solactive.com/indices/?index=DE000SOL0D75',
      type: 'decrement',
      currency: 'EUR',
    },

    // ──────────── INDICES STANDARD (référence) ────────────
    {
      id: 'CAC40',
      name: 'CAC 40',
      ticker: '^FCHI',
      isin: 'FR0003500008',
      administrator: 'EURONEXT',
      calculator: 'EURONEXT',
      decrementPts: null,
      bmrUrl: 'https://www.euronext.com/en/indices/components/FR0003500008',
      type: 'price_return',
      currency: 'EUR',
    },
    {
      id: 'EUROSTOXX50',
      name: 'EURO STOXX 50',
      ticker: '^STOXX50E',
      isin: 'EU0009658145',
      administrator: 'QONTIGO',
      calculator: 'QONTIGO',
      decrementPts: null,
      bmrUrl: 'https://www.stoxx.com/index-details?symbol=SX5E',
      type: 'price_return',
      currency: 'EUR',
    },
    {
      id: 'DAX40',
      name: 'DAX 40',
      ticker: '^GDAXI',
      isin: 'DE0008469008',
      administrator: 'QONTIGO',
      calculator: 'QONTIGO',
      decrementPts: null,
      bmrUrl: 'https://www.stoxx.com/index-details?symbol=DAX',
      type: 'total_return',
      currency: 'EUR',
    },
    {
      id: 'S&P500',
      name: 'S&P 500',
      ticker: '^GSPC',
      isin: 'US78378X1072',
      administrator: 'SPDJI',
      calculator: 'SPDJI',
      decrementPts: null,
      bmrUrl: 'https://www.spglobal.com/spdji/en/indices/equity/sp-500/',
      type: 'price_return',
      currency: 'USD',
    },
    {
      id: 'FTSE100',
      name: 'FTSE 100',
      ticker: '^FTSE',
      isin: 'GB0001383545',
      administrator: 'BLOOMBERG',
      calculator: 'BLOOMBERG',
      decrementPts: null,
      bmrUrl: 'https://www.bloombergindices.com/indices/equity/ftse-100/',
      type: 'price_return',
      currency: 'GBP',
    },
    {
      id: 'NIKKEI225',
      name: 'Nikkei 225',
      ticker: '^N225',
      isin: 'JP9010C00002',
      administrator: 'QONTIGO',
      calculator: 'QONTIGO',
      decrementPts: null,
      bmrUrl: 'https://www.stoxx.com/index-details?symbol=NKY',
      type: 'price_return',
      currency: 'JPY',
    },
    {
      id: 'SMI',
      name: 'SMI',
      ticker: '^SSMI',
      isin: 'CH0009980894',
      administrator: 'QONTIGO',
      calculator: 'QONTIGO',
      decrementPts: null,
      bmrUrl: 'https://www.stoxx.com/index-details?symbol=SMI',
      type: 'price_return',
      currency: 'CHF',
    },
    {
      id: 'IBEX35',
      name: 'IBEX 35',
      ticker: '^IBEX',
      isin: 'ES0SI0000005',
      administrator: 'QONTIGO',
      calculator: 'QONTIGO',
      decrementPts: null,
      bmrUrl: 'https://www.stoxx.com/index-details?symbol=IBEX',
      type: 'price_return',
      currency: 'EUR',
    },
    {
      id: 'STOXX_BANKS',
      name: 'STOXX Europe 600 Banks',
      ticker: '^STXBP',
      isin: 'EU0009658202',
      administrator: 'QONTIGO',
      calculator: 'QONTIGO',
      decrementPts: null,
      bmrUrl: 'https://www.stoxx.com/index-details?symbol=SX7P',
      type: 'price_return',
      currency: 'EUR',
    },
    {
      id: 'SBF120',
      name: 'SBF 120',
      ticker: '^SBF120',
      isin: 'FR0003999481',
      administrator: 'EURONEXT',
      calculator: 'EURONEXT',
      decrementPts: null,
      bmrUrl: 'https://www.euronext.com/en/indices/components/FR0003999481',
      type: 'price_return',
      currency: 'EUR',
    },
  ],

  /**
   * Trouver un indice par son ticker, ISIN ou nom
   */
  find(query) {
    if (!query) return null;
    const q = String(query).toLowerCase().trim();
    return (
      this.indices.find(
        (idx) =>
          idx.ticker?.toLowerCase() === q ||
          idx.isin?.toLowerCase() === q ||
          idx.name?.toLowerCase().includes(q) ||
          idx.id?.toLowerCase() === q
      ) || null
    );
  },

  /**
   * Chercher par similarité (plus flexible)
   */
  search(query) {
    if (!query) return [];
    const q = String(query).toLowerCase().trim();
    const words = q.split(/\s+/);
    return this.indices.filter((idx) => {
      const haystack = `${idx.name} ${idx.ticker || ''} ${idx.id} ${idx.isin || ''}`.toLowerCase();
      return words.some((w) => w.length > 2 && haystack.includes(w));
    });
  },

  /**
   * Indices par administrateur
   */
  byAdministrator(adminId) {
    return this.indices.filter((idx) => idx.administrator === adminId);
  },

  /**
   * Indices par calculateur
   */
  byCalculator(calcId) {
    return this.indices.filter((idx) => idx.calculator === calcId);
  },

  /**
   * Indices décrément uniquement
   */
  getDecrementIndices() {
    return this.indices.filter((idx) => idx.type === 'decrement' && idx.decrementPts != null);
  },

  /**
   * Récupérer l'URL de scraping pour un indice donné
   */
  getScrapingUrl(indexId) {
    const idx = this.find(indexId);
    if (!idx) return null;
    if (idx.bmrUrl) return idx.bmrUrl;
    // fallback : construire l'URL depuis l'administrateur
    const admin = this.administrators[idx.administrator];
    if (admin?.portal) return `${admin.portal}/index/${idx.ticker || idx.id}`;
    // fallback : calculateur
    const calc = this.calculators[idx.calculator];
    if (calc?.searchUrl) return calc.searchUrl(idx.name);
    return null;
  },

  /**
   * Détecter si un indice est utilisé dans un produit à partir du term sheet
   */
  detectFromText(text) {
    if (!text) return [];
    const found = [];
    const lower = text.toLowerCase();
    for (const idx of this.indices) {
      const nameLower = idx.name.toLowerCase();
      const tickerLower = (idx.ticker || '').toLowerCase();
      if (lower.includes(nameLower) || lower.includes(tickerLower) || lower.includes(idx.id.toLowerCase())) {
        found.push(idx);
      }
    }
    return found;
  },

  /**
   * Construire le mapping produit → indice pour l'affichage
   */
  buildProductIndexMap(products) {
    if (!Array.isArray(products)) return [];
    return products.map((p) => {
      const raw = (p.underlying || p.name || '');
      const match = this.search(raw);
      return {
        productId: p.id,
        productName: p.name,
        rawUnderlying: raw,
        matchedIndex: match.length > 0 ? match[0] : null,
        alternatives: match.slice(1, 4),
        source: match.length > 0 ? this.getScrapingUrl(match[0].id) : null,
      };
    });
  },
};

// Exposer globalement
if (typeof globalThis !== 'undefined') {
  globalThis.STRUCTURA_INDEX_REGISTRY = INDEX_REGISTRY;
}

// Export Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { INDEX_REGISTRY };
}