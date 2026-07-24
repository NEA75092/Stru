const StructuraAppState =
  typeof module !== "undefined" && module.exports
    ? require("./modules/app-state.js")
    : globalThis.StructuraAppState;
const StructuraNavigation =
  typeof module !== "undefined" && module.exports
    ? require("./modules/app-navigation.js")
    : globalThis.StructuraNavigation;
const StructuraExports =
  typeof module !== "undefined" && module.exports
    ? require("./modules/app-exports.js")
    : globalThis.StructuraExports;

const {
  STORAGE_KEY,
  APP_MODE_KEY,
  EMETTEURS,
  UNDERLYINGS,
  TYPE_NAMES,
  PRODUCTS,
  runtime: APP_RUNTIME,
  addDays,
  addMonths,
  addYears,
  isoDate,
  statusFromDist,
  normalizeProduct,
  saveProducts,
  getAppMode,
  isProdMode,
  activeProducts,
  productsForScope,
} = StructuraAppState;
const { nav } = StructuraNavigation;
const { exportCSV, exportXLSX } = StructuraExports;

// ===================== STATE =====================
const pfFilter = APP_RUNTIME.pfFilter;
const pfSort = APP_RUNTIME.pfSort;
let generatedPitch = APP_RUNTIME.generatedPitch;
let extractedDocumentData = APP_RUNTIME.extractedDocumentData;


// ===================== MODULE BRIDGE (browser + node) =====================
const StructuraUtils =
  typeof module !== "undefined" && module.exports
    ? require("./modules/app-utils.js")
    : globalThis.StructuraUtils;
const { setText, moneyShort, notify } = StructuraUtils;
const { TYPE_CLASS, TYPE_SHORT } =
  (typeof module !== "undefined" && module.exports
    ? require("./modules/app-portfolio-constants.js")
    : globalThis.StructuraPortfolioConstants) || {};

if (typeof module !== "undefined" && module.exports) {
  require("./modules/app-state.js");
  require("./modules/vl-registry.js");
  require("./modules/app-portfolio-constants.js");
  require("./modules/app-dashboard.js");
  require("./modules/app-clients.js");
  require("./modules/app-portfolio.js");
  require("./modules/app-calendar.js");
  require("./modules/app-analytics.js");
  require("./modules/decrement-engine.js");
  require("./modules/app-screener.js");
}

const {
  updateAppModeUI,
  toggleAppMode,
  renderDashboardSummary,
  renderAlerts,
  renderEvents,
  drawPerfChart,
  renderDashboardModules,
  renderPf,
  renderBarriers,
  renderAnalytics,
  renderCalendar,
  runScreener,
} = globalThis;

// ===================== MODAL =====================
function openModal() {
  globalThis.populateClientSelect?.("f-client", APP_RUNTIME.selectedClientDetailId);
  document.getElementById("modal-ov").classList.add("open");
}
function closeModal() {
  document.getElementById("modal-ov").classList.remove("open");
}
function closeModalOut(e) {
  if (e.target === document.getElementById("modal-ov")) closeModal();
}

function addProduct() {
  const name = document.getElementById("f-name").value.trim();
  if (!name) {
    document.getElementById("f-name").focus();
    notify("Le nom du produit est requis", "err");
    return;
  }
  const nom = parseFloat(document.getElementById("f-nom").value) || 1000000;
  const type = document.getElementById("f-type").value;
  const bar = parseFloat(document.getElementById("f-bar").value) || 60;
  const dist = null;
  const today = new Date();
  const underlying = document.getElementById("f-und").value || "—";
  // Lookup du spot initial depuis le store de marché
  const _mEntry =
    typeof MarketDataStore !== "undefined"
      ? MarketDataStore.get(underlying)
      : null;
  const initialSpot = _mEntry ? _mEntry.vl : null;
  const id = Math.max(0, ...PRODUCTS.map((x) => Number(x.id) || 0)) + 1;
  const canonical = globalThis.StructuraProductSchema?.fromManualForm?.({
    name,
    isin: document.getElementById("f-isin").value.trim(),
    type,
    issuer: document.getElementById("f-emit").value,
    nominal: nom,
    valuationAmount: nom,
    annualCouponPct: parseFloat(document.getElementById("f-cpn").value) || 0,
    barrierPct: type === "CG" ? null : bar,
    maturityDate: document.getElementById("f-mat").value || isoDate(addYears(today, 2)),
    underlying,
    nextEvtDate: isoDate(addMonths(today, 1)),
  });
  const p = canonical
    ? globalThis.StructuraProductSchema.canonicalToPortfolioProduct(canonical, {
        id,
        helpers: { isoDate, addMonths, addYears },
        normalizeProduct,
      })
    : normalizeProduct({
        id,
        name,
        isin: document.getElementById("f-isin").value.trim(),
        type,
        emetteur: document.getElementById("f-emit").value,
        nominal: nom,
        val: nom,
        coupon: (document.getElementById("f-cpn").value || "0") + "%",
        cpnNum: parseFloat(document.getElementById("f-cpn").value) || 0,
        barrier: bar,
        dist,
        initialSpot,
        maturity: document.getElementById("f-mat").value || isoDate(addYears(today, 2)),
        underlying,
        rating: document.getElementById("f-rat").value,
        nextEvt: "Prochaine observation",
        nextEvtDate: isoDate(addMonths(today, 1)),
      });
  p.rating = document.getElementById("f-rat").value;
  p.initialSpot = initialSpot;
  p.st = statusFromDist(dist, type);
  Object.assign(p, {
    origin: "user",
    dataQuality: "manual",
    clientId: Number(document.getElementById("f-client")?.value) || APP_RUNTIME.selectedClientDetailId || null,
  });
  PRODUCTS.unshift(p);
  saveProducts();
  closeModal();
  notify(`Produit "${name}" ajouté avec succès`, "ok");
  if (APP_RUNTIME.currentView === "portfolio") renderPf();
  updateAppModeUI();
}

// ===================== EXPORT =====================

// ===================== IA / INTEGRATIONS =====================
function ingestTermSheet(fileOrText) {
  return {
    ok: true,
    message: "Extraction initialisée",
    input: fileOrText ?? null,
  };
}

async function fetchByISIN(isin) {
  if (globalThis.StructuraVlRegistry?.fetchProductVlByIsin) {
    return globalThis.StructuraVlRegistry.fetchProductVlByIsin(isin);
  }
  return { ok: false, message: "Registre VL indisponible", isin };
}

function switchPitchTab(tab) {
  const slideTab = document.getElementById("ap-tab-slides");
  const rawTab = document.getElementById("ap-tab-raw");
  const preview = document.getElementById("ap-preview");
  const raw = document.getElementById("ap-raw");
  if (!slideTab || !rawTab || !preview || !raw) return;
  slideTab.classList.toggle("on", tab === "slides");
  rawTab.classList.toggle("on", tab === "raw");
  preview.style.display = tab === "slides" ? "block" : "none";
  raw.style.display = tab === "raw" ? "block" : "none";
}

function switchIngestNarrativeTab(tab) {
  document
    .querySelectorAll(".ing-story-tab")
    .forEach((btn) => btn.classList.toggle("active", btn.dataset.tab === tab));
  document
    .querySelectorAll(".ing-story-pane")
    .forEach((pane) =>
      pane.classList.toggle("active", pane.dataset.tab === tab),
    );
}

function formatPctFr(value, digits = 1) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "N/A";
  const fixed = n.toFixed(digits).replace(/\.0+$/, "").replace(".", ",");
  return `${fixed}%`;
}

function formatNominalFr(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "N/A";
  if (n >= 1000000)
    return `${(n / 1000000).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} M€`;
  if (n >= 1000)
    return `${(n / 1000).toLocaleString("fr-FR", { maximumFractionDigits: 0 })} K€`;
  return `${n.toLocaleString("fr-FR")} €`;
}

function gradeLabelFr(grade) {
  return (
    {
      HIGH: "Haute fiabilité",
      MEDIUM: "Fiabilité intermédiaire",
      LOW: "Lecture à confirmer",
    }[grade] || "Lecture à confirmer"
  );
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const STRUCTURA_MECHANISM_SPEC = {
  frequencies: [
    {
      id: "daily",
      label: "quotidienne",
      sellerLabel: "quotidienne / daily",
      patterns: [
        /\bquotidien(?:ne)?\b/i,
        /\bdaily\b/i,
        /par jour/i,
        /chaque jour/i,
        /journalier/i,
      ],
    },
    {
      id: "weekly",
      label: "hebdomadaire",
      sellerLabel: "hebdomadaire / weekly",
      patterns: [/\bhebdo/i, /\bweekly\b/i, /par semaine/i],
    },
    {
      id: "monthly",
      label: "mensuelle",
      sellerLabel: "mensuelle / monthly",
      patterns: [/\bmensuel(?:le)?\b/i, /\bmonthly\b/i, /chaque mois/i],
    },
    {
      id: "quarterly",
      label: "trimestrielle",
      sellerLabel: "trimestrielle / quarterly",
      patterns: [
        /\btrimestriel(?:le)?\b/i,
        /\bquarterly\b/i,
        /chaque trimestre/i,
      ],
    },
    {
      id: "semiannual",
      label: "semestrielle",
      sellerLabel: "semestrielle / semiannual",
      patterns: [
        /\bsemestriel(?:le)?\b/i,
        /\bsemi-?annual\b/i,
        /tous les six mois/i,
      ],
    },
    {
      id: "annual",
      label: "annuelle",
      sellerLabel: "annuelle / annual",
      patterns: [
        /\bannuel(?:le)?\b/i,
        /\bannual\b/i,
        /par an/i,
        /p\.a\./i,
        /per annum/i,
      ],
    },
  ],
  structures: [
    {
      id: "worst_of",
      label: "panier worst-of",
      patterns: [
        /\bworst[-\s]?of\b/i,
        /plus mauvaise performance/i,
        /least performing/i,
        /worst performing/i,
      ],
    },
    {
      id: "best_of",
      label: "panier best-of",
      patterns: [
        /\bbest[-\s]?of\b/i,
        /meilleure performance/i,
        /best performing/i,
      ],
    },
    {
      id: "basket",
      label: "panier multi-sous-jacents",
      patterns: [/\bbasket\b/i, /\bpanier\b/i, /reference assets/i],
    },
    { id: "single", label: "mono sous-jacent", patterns: [] },
  ],
  barrierObservation: [
    {
      id: "american",
      label: "barrière observée de façon continue / américaine",
      patterns: [
        /\bam[ée]ricaine\b/i,
        /barri[èe]re.{0,25}quotid/i,
        /daily closing/i,
        /chaque jour de bourse/i,
        /observ[éea].{0,25}continu/i,
      ],
    },
    {
      id: "european",
      label: "barrière observée uniquement à l’échéance / européenne",
      patterns: [
        /\beurop[ée]enne\b/i,
        /uniquement à l['’]échéance/i,
        /date finale/i,
        /final valuation/i,
        /observ[éea].{0,20}final/i,
      ],
    },
  ],
  settlement: [
    {
      id: "physical",
      label: "livraison physique possible",
      patterns: [
        /livraison physique/i,
        /physical settlement/i,
        /delivery of shares/i,
        /remise d['’]actions/i,
        /settled by delivery/i,
      ],
    },
    {
      id: "cash",
      label: "règlement en numéraire",
      patterns: [
        /cash settlement/i,
        /r[èe]glement en esp[èe]ces/i,
        /remboursement en num[ée]raire/i,
      ],
    },
  ],
  couponStyle: [
    {
      id: "memory",
      label: "coupon conditionnel avec effet mémoire",
      patterns: [
        /coupon m[ée]moire/i,
        /coupon m[ée]morisable/i,
        /memory coupon/i,
        /effet m[ée]moire/i,
        /rattrapage/i,
      ],
    },
    {
      id: "conditional",
      label: "coupon conditionnel",
      patterns: [
        /coupon conditionnel/i,
        /coupon contingent/i,
        /coupon vers[ée] si/i,
        /coupon payable if/i,
        /coupon due if/i,
      ],
    },
    {
      id: "fixed",
      label: "coupon fixe",
      patterns: [
        /coupon fixe/i,
        /coupon garanti/i,
        /fixed coupon/i,
        /guaranteed coupon/i,
      ],
    },
  ],
};

function humanizeDocType(docType) {
  return (
    {
      TERM_SHEET: "Term Sheet",
      TS: "Term Sheet",
      KID: "KID",
      BROCHURE: "Brochure",
      BC: "Brochure",
    }[docType] ||
    docType ||
    "Document"
  );
}

function normalizePeriodId(period) {
  const key = String(period || "")
    .toLowerCase()
    .trim();
  if (!key) return "";
  if (key.includes("daily") || key.includes("quotid")) return "daily";
  if (key.includes("weekly") || key.includes("hebdo")) return "weekly";
  if (key.includes("month") || key.includes("mens")) return "monthly";
  if (key.includes("quarter") || key.includes("trimes")) return "quarterly";
  if (key.includes("semi") || key.includes("semes")) return "semiannual";
  if (key.includes("annual") || key.includes("annuel") || key.includes("year"))
    return "annual";
  return "";
}

function normalizeNarrativeSourceDocs(rawDocuments = []) {
  return rawDocuments
    .filter((doc) => doc && doc.text)
    .map((doc) => ({
      docType: doc.docType || "UNKNOWN",
      text: String(doc.text || ""),
    }));
}

function buildEvidenceCorpus(rawDocuments = []) {
  const corpus = [];
  const seen = new Set();
  normalizeNarrativeSourceDocs(rawDocuments).forEach((doc) => {
    const seeded = doc.text
      .replace(/\u00a0/g, " ")
      .replace(/\r/g, "\n")
      .replace(/[•●▪◦·]/g, "\n")
      .replace(/\s+\|\s+/g, "\n")
      .replace(/;\s+/g, ";\n")
      .replace(/(?<=[.!?])\s+(?=[A-ZÀ-Ö0-9])/g, "\n");
    seeded
      .split(/\n+/)
      .map((line) => line.replace(/\s{2,}/g, " ").trim())
      .filter((line) => line.length >= 4)
      .forEach((segment) => {
        const key = `${doc.docType}:${segment.toLowerCase()}`;
        if (seen.has(key)) return;
        seen.add(key);
        corpus.push({ docType: doc.docType, segment });
      });
  });
  return corpus;
}

function clipEvidence(text, max = 170) {
  const raw = String(text || "")
    .replace(/\s+/g, " ")
    .trim();
  if (raw.length <= max) return raw;
  return `${raw.slice(0, max - 1).trim()}…`;
}

function findEvidenceMatch(corpus = [], patterns = [], valueFn = null) {
  for (const entry of corpus) {
    for (const re of patterns) {
      const match = entry.segment.match(re);
      if (match) {
        return {
          docType: entry.docType,
          snippet: clipEvidence(entry.segment),
          value:
            typeof valueFn === "function"
              ? valueFn(match, entry.segment)
              : match[1] || match[0],
          match,
        };
      }
    }
  }
  return null;
}

function collectEvidenceMatches(corpus = [], patterns = [], limit = 3) {
  const hits = [];
  const seen = new Set();
  for (const entry of corpus) {
    for (const re of patterns) {
      if (re.test(entry.segment)) {
        const key = `${entry.docType}:${entry.segment.toLowerCase()}`;
        if (seen.has(key)) break;
        seen.add(key);
        hits.push({
          docType: entry.docType,
          snippet: clipEvidence(entry.segment),
        });
        if (hits.length >= limit) return hits;
        break;
      }
    }
  }
  return hits;
}

function detectCatalogMatch(corpus, catalog, fallback = null) {
  for (const item of catalog) {
    if (!item.patterns?.length) continue;
    const evidence = findEvidenceMatch(corpus, item.patterns);
    if (evidence) return { ...item, evidence };
  }
  return fallback;
}

function buildDocumentCoverage(rawDocuments = []) {
  const docTypes = normalizeNarrativeSourceDocs(rawDocuments).map(
    (doc) => doc.docType,
  );
  const unique = [...new Set(docTypes)];
  const hasTS = unique.includes("TERM_SHEET");
  const hasKID = unique.includes("KID");
  const hasBC = unique.includes("BROCHURE");
  if (hasTS && hasKID && hasBC)
    return {
      id: "triple_source",
      label: "Term Sheet + KID + Brochure",
      score: 3,
    };
  if (hasTS && hasKID)
    return { id: "legal_regulatory", label: "Term Sheet + KID", score: 2.6 };
  if (hasKID && hasBC)
    return { id: "regulatory_commercial", label: "KID + Brochure", score: 2.2 };
  if (hasTS && hasBC)
    return {
      id: "legal_commercial",
      label: "Term Sheet + Brochure",
      score: 2.1,
    };
  if (hasTS) return { id: "legal_only", label: "Term Sheet seul", score: 1.5 };
  if (hasKID) return { id: "regulatory_only", label: "KID seul", score: 1.4 };
  if (hasBC)
    return { id: "commercial_only", label: "Brochure seule", score: 1 };
  return {
    id: "unknown",
    label: "Couverture documentaire à préciser",
    score: 0,
  };
}

function inferUnderlyingStructure(corpus, merged) {
  const direct = detectCatalogMatch(
    corpus,
    STRUCTURA_MECHANISM_SPEC.structures,
    null,
  );
  if (direct) return direct;
  const underlying = String(merged?.underlying || "");
  if (/[;,/]/.test(underlying) || /\bet\b|\band\b/i.test(underlying))
    return { id: "basket", label: "panier multi-sous-jacents", evidence: null };
  return { id: "single", label: "mono sous-jacent", evidence: null };
}

function inferFrequency(corpus, merged) {
  const direct = detectCatalogMatch(
    corpus,
    STRUCTURA_MECHANISM_SPEC.frequencies,
    null,
  );
  if (direct) return direct;
  const fallbackId = normalizePeriodId(merged?.couponPeriod);
  return (
    STRUCTURA_MECHANISM_SPEC.frequencies.find(
      (item) => item.id === fallbackId,
    ) || {
      id: "unknown",
      label: "à confirmer",
      sellerLabel: "à confirmer",
      evidence: null,
    }
  );
}

function inferBarrierObservation(corpus, merged) {
  const direct = detectCatalogMatch(
    corpus,
    STRUCTURA_MECHANISM_SPEC.barrierObservation,
    null,
  );
  if (direct) return direct;
  if (/am[ée]ricaine/i.test(String(merged?.barrierType || "")))
    return {
      id: "american",
      label: "barrière observée de façon continue / américaine",
      evidence: null,
    };
  if (/europ[ée]enne/i.test(String(merged?.barrierType || "")))
    return {
      id: "european",
      label: "barrière observée uniquement à l’échéance / européenne",
      evidence: null,
    };
  return {
    id: "unknown",
    label: "mode d’observation de la barrière à confirmer",
    evidence: null,
  };
}

function inferSettlementMode(corpus) {
  return detectCatalogMatch(corpus, STRUCTURA_MECHANISM_SPEC.settlement, {
    id: "unknown",
    label: "mode de remboursement à confirmer",
    evidence: null,
  });
}

function inferCouponStyle(corpus, merged) {
  const direct = detectCatalogMatch(
    corpus,
    STRUCTURA_MECHANISM_SPEC.couponStyle,
    null,
  );
  if (direct) return direct;
  if (merged?.hasMemory)
    return {
      id: "memory",
      label: "coupon conditionnel avec effet mémoire",
      evidence: null,
    };
  if (
    Number.isFinite(Number(merged?.couponPct)) &&
    Number.isFinite(Number(merged?.barrierPct))
  )
    return { id: "conditional", label: "coupon conditionnel", evidence: null };
  if (Number.isFinite(Number(merged?.couponPct)))
    return { id: "fixed", label: "coupon fixe", evidence: null };
  return {
    id: "unknown",
    label: "mécanique coupon à confirmer",
    evidence: null,
  };
}

function extractObservationSchedule(corpus = []) {
  const dateRe =
    /\b(\d{1,2}[\/.-]\d{1,2}[\/.-]20\d{2}|20\d{2}[\/.-]\d{1,2}[\/.-]\d{1,2}|(?:janvier|fevrier|février|mars|avril|mai|juin|juillet|aout|août|septembre|octobre|novembre|decembre|décembre|january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2},?\s+20\d{2})\b/i;
  const eventRe =
    /(observation|constatation|coupon|rappel|remboursement anticip|early redemption|autocall|maturity|maturit|echeance|échéance)/i;
  const rows = [];
  const seen = new Set();
  corpus.forEach((entry) => {
    if (!dateRe.test(entry.segment) || !eventRe.test(entry.segment)) return;
    const date = entry.segment.match(dateRe)?.[1] || "";
    const pct =
      entry.segment
        .match(/(\d{1,3}(?:[.,]\d+)?)\s*%/)?.[1]
        ?.replace(",", ".") || "";
    let kind = "Observation";
    if (/coupon/i.test(entry.segment)) kind = "Coupon";
    if (
      /rappel|remboursement anticip|early redemption|autocall/i.test(
        entry.segment,
      )
    )
      kind = "Rappel";
    if (/maturity|maturit|echeance|échéance/i.test(entry.segment))
      kind = "Maturité";
    const key = `${date}:${kind}:${pct}`;
    if (seen.has(key)) return;
    seen.add(key);
    rows.push({
      date,
      kind,
      level: pct ? `${pct}%` : "",
      source: entry.docType,
      snippet: clipEvidence(entry.segment, 140),
    });
  });
  return rows.slice(0, 12);
}

function buildStructuredProductIntelligence(options = {}) {
  const merged = options.merged || {};
  const descriptor = options.descriptor || {};
  const consensus = options.consensus || {};
  const alerts = options.alerts || [];
  const rawDocuments = normalizeNarrativeSourceDocs(options.rawDocuments || []);
  const corpus = buildEvidenceCorpus(rawDocuments);
  const combinedText = rawDocuments.map((doc) => doc.text).join("\n");
  const type =
    merged.type ||
    descriptor?.type?.label ||
    findSpecProductFamily(combinedText) ||
    "Produit structuré";
  const issuer = merged.issuer || "émetteur à confirmer";
  const underlying =
    cleanUnderlyingCandidate(merged.underlying) ||
    extractUnderlyingFromSpec(combinedText) ||
    "sous-jacent à confirmer";
  const coverage = buildDocumentCoverage(rawDocuments);
  const frequency = inferFrequency(corpus, merged);
  const structure = inferUnderlyingStructure(corpus, merged);
  const barrierObservation = inferBarrierObservation(corpus, merged);
  const settlement = inferSettlementMode(corpus);
  const couponStyle = inferCouponStyle(corpus, merged);
  const schedule = extractObservationSchedule(corpus);
  const maturity = merged.maturityDate
    ? new Date(`${merged.maturityDate}T00:00:00`).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;
  const maturityShort = merged.maturityDate
    ? new Date(`${merged.maturityDate}T00:00:00`).toLocaleDateString("fr-FR", {
        month: "short",
        year: "numeric",
      })
    : null;
  const coupon = Number.isFinite(Number(merged.couponPct))
    ? Number(merged.couponPct)
    : null;
  const barrier = Number.isFinite(Number(merged.barrierPct))
    ? Number(merged.barrierPct)
    : null;
  const recall = Number.isFinite(Number(merged.recallPct))
    ? Number(merged.recallPct)
    : null;
  const nominal = Number.isFinite(Number(merged.nominal))
    ? Number(merged.nominal)
    : null;
  const decrement =
    Number.isFinite(Number(merged.decrement)) && Number(merged.decrement) > 0
      ? Number(merged.decrement)
      : null;
  const downside = Number.isFinite(barrier) ? Math.max(0, 100 - barrier) : null;
  const riskScore = consensus?.data?.riskScore
    ? `${consensus.data.riskScore}/7`
    : null;

  const couponEvidence = findEvidenceMatch(corpus, [
    /(?:coupon|interest|yield|rendement)[^0-9%]{0,40}(\d{1,2}(?:[.,]\d+)?)\s*%/i,
    /(\d{1,2}(?:[.,]\d+)?)\s*%\s*(?:par an|p\.a|annual|annuel)/i,
  ]);
  const barrierEvidence = findEvidenceMatch(corpus, [
    /(?:barri[èe]re(?: de protection)?|buffer|downside threshold|capital protection)[^0-9%]{0,50}(\d{1,3}(?:[.,]\d+)?)\s*%/i,
  ]);
  const recallEvidence = findEvidenceMatch(corpus, [
    /(?:rappel automatique|remboursement anticip[ée]|autocall|early redemption)[^0-9%]{0,50}(\d{1,3}(?:[.,]\d+)?)\s*%/i,
  ]);
  const nominalEvidence = findEvidenceMatch(corpus, [
    /(?:nominal(?: unitaire)?|minimum denomination|denomination|principal amount)[^0-9]{0,30}([0-9][0-9\s.,$€]{1,})/i,
  ]);
  const maturityEvidence = findEvidenceMatch(corpus, [
    /(?:date d['’][ée]ch[ée]ance|maturity date|redemption date|maturit[ée])[^\n]{0,60}/i,
  ]);
  const decrementEvidence = findEvidenceMatch(corpus, [
    /(\d{1,2}(?:[.,]\d+)?)\s*(?:points|pts)\s*(?:decrement|de dividende)?/i,
    /decrement[^\n]{0,40}(\d{1,2}(?:[.,]\d+)?)/i,
  ]);

  const evidence = [
    couponEvidence
      ? {
          label: "Coupon",
          value:
            coupon !== null
              ? `${formatPctFr(coupon)} / an`
              : couponEvidence.value,
          docType: couponEvidence.docType,
          snippet: couponEvidence.snippet,
        }
      : null,
    barrierEvidence
      ? {
          label: "Barrière",
          value:
            barrier !== null ? formatPctFr(barrier, 0) : barrierEvidence.value,
          docType: barrierEvidence.docType,
          snippet: barrierEvidence.snippet,
        }
      : null,
    recallEvidence
      ? {
          label: "Rappel",
          value:
            recall !== null ? formatPctFr(recall, 0) : recallEvidence.value,
          docType: recallEvidence.docType,
          snippet: recallEvidence.snippet,
        }
      : null,
    maturityEvidence
      ? {
          label: "Échéance",
          value: maturity || merged.maturityDate || "N/A",
          docType: maturityEvidence.docType,
          snippet: maturityEvidence.snippet,
        }
      : null,
    decrementEvidence && decrement !== null
      ? {
          label: "Decrement",
          value: `${decrement.toLocaleString("fr-FR")} pts`,
          docType: decrementEvidence.docType,
          snippet: decrementEvidence.snippet,
        }
      : null,
    structure.evidence
      ? {
          label: "Structure sous-jacente",
          value: structure.label,
          docType: structure.evidence.docType,
          snippet: structure.evidence.snippet,
        }
      : null,
    barrierObservation.evidence
      ? {
          label: "Observation de barrière",
          value: barrierObservation.label,
          docType: barrierObservation.evidence.docType,
          snippet: barrierObservation.evidence.snippet,
        }
      : null,
    settlement.evidence
      ? {
          label: "Settlement",
          value: settlement.label,
          docType: settlement.evidence.docType,
          snippet: settlement.evidence.snippet,
        }
      : null,
  ]
    .filter(Boolean)
    .slice(0, 6);

  const facts = [
    { label: "Famille", value: type, meta: coverage.label },
    { label: "Sous-jacent", value: underlying, meta: structure.label },
    {
      label: "Coupon",
      value: coupon !== null ? `${formatPctFr(coupon)} / an` : "À confirmer",
      meta:
        frequency.label !== "à confirmer"
          ? `${couponStyle.label} · ${frequency.label}`
          : couponStyle.label,
    },
    {
      label: "Protection",
      value: barrier !== null ? formatPctFr(barrier, 0) : "À confirmer",
      meta: barrierObservation.label,
    },
    {
      label: "Rappel auto",
      value: recall !== null ? formatPctFr(recall, 0) : "Sans rappel identifié",
      meta: recall !== null ? "déclencheur de remboursement" : "non détecté",
    },
    {
      label: "Nominal",
      value: nominal !== null ? formatNominalFr(nominal) : "À confirmer",
      meta: settlement.label,
    },
    {
      label: "Échéance",
      value: maturity || "À confirmer",
      meta: maturityShort || "horizon à confirmer",
    },
    {
      label: "Risque SRI",
      value: riskScore || "N/A",
      meta: `${consensus?.status?.consensusPct || 0}% de consensus`,
    },
  ];

  const watchpoints = [];
  if (coverage.id === "commercial_only")
    watchpoints.push({
      level: "warning",
      message:
        "Lecture fondée sur une brochure seule: valider juridiquement le mécanisme sur le Term Sheet ou le KID avant onboarding produit.",
    });
  if (coverage.id === "regulatory_only")
    watchpoints.push({
      level: "info",
      message:
        "Lecture réglementaire correcte, mais une brochure ou un term sheet aidera à enrichir le wording commercial et le détail de la mécanique.",
    });
  if ((merged.sources || 0) < 2)
    watchpoints.push({
      level: "warning",
      message:
        "Une seule source a été chargée: le taux de certitude reste mécaniquement limité.",
    });
  if (merged.barrierFlag === "SUSPECT_EQUALS_RECALL")
    watchpoints.push({
      level: "error",
      message:
        "La barrière lue à 100% ressemble à un niveau de rappel et non à une vraie barrière de protection.",
    });
  if (!merged.isin)
    watchpoints.push({
      level: "warning",
      message:
        "ISIN non certifié: conserver le produit en attente de validation documentaire.",
    });
  if (!cleanUnderlyingCandidate(merged.underlying))
    watchpoints.push({
      level: "error",
      message:
        "Sous-jacent non fiabilisé: le produit ne doit pas être onboardé sans confirmation du support.",
    });
  if (structure.id === "worst_of")
    watchpoints.push({
      level: "info",
      message:
        "Structure worst-of: le risque réel se lit sur le moins bon sous-jacent, pas sur la moyenne du panier.",
    });
  if (settlement.id === "physical")
    watchpoints.push({
      level: "warning",
      message:
        "Remboursement par livraison physique possible: point vendeur à expliciter dès la phase d’onboarding.",
    });
  if (decrement !== null)
    watchpoints.push({
      level: "info",
      message: `Présence d’un decrement (${decrement.toLocaleString("fr-FR")} pts): bien expliquer l’écart entre coupon affiché et performance économique réelle du sous-jacent.`,
    });
  if ((consensus?.status?.consensusPct || 0) < 70)
    watchpoints.push({
      level: "warning",
      message: `Consensus documentaire limité à ${consensus?.status?.consensusPct || 0}%: lecture exploitable mais encore trop fragile pour une fiche produit finale.`,
    });
  alerts.forEach((alert) => {
    const message = typeof alert === "string" ? alert : alert?.message;
    if (message)
      watchpoints.push({
        level: typeof alert === "object" ? alert.level || "info" : "info",
        message,
      });
  });

  const uniqueWatchpoints = [];
  const seenWatchpoints = new Set();
  watchpoints.forEach((note) => {
    const key = `${note.level}:${note.message}`;
    if (seenWatchpoints.has(key)) return;
    seenWatchpoints.add(key);
    uniqueWatchpoints.push(note);
  });

  const retailLines = [];
  retailLines.push(
    `${merged.productName || type} se lit ici comme un ${type.toLowerCase()} ${issuer ? `émis par ${issuer}` : ""} ${underlying ? `sur ${underlying}` : ""}.`,
  );
  if (coupon !== null) {
    retailLines.push(
      `Pour un client retail, la promesse économique principale est de viser un coupon de ${formatPctFr(coupon)} par an, avec une observation ${frequency.label !== "à confirmer" ? frequency.label : "à confirmer"} et une mécanique ${couponStyle.label}.`,
    );
  } else {
    retailLines.push(
      `Le document décrit une structure de rendement, mais le niveau exact de coupon reste à confirmer dans la documentation source.`,
    );
  }
  if (recall !== null) {
    retailLines.push(
      `Le produit comporte un mécanisme de rappel automatique: si le sous-jacent revient à ${formatPctFr(recall, 0)} du niveau initial à une date d’observation, le remboursement anticipé peut être déclenché.`,
    );
  }
  if (barrier !== null) {
    const protectionText =
      barrier === 100 && /capital garanti|capital protected/i.test(type)
        ? "Le capital apparaît protégé à l’échéance."
        : `La protection reste conditionnelle: au-delà d’une baisse de ${downside}% du sous-jacent, l’investisseur redevient exposé au risque de perte en capital.`;
    retailLines.push(
      `${protectionText} À ce stade, la barrière est décrite comme ${barrierObservation.label}.`,
    );
  } else {
    retailLines.push(
      `Le seuil précis de protection n’est pas assez stabilisé pour être présenté tel quel à un client sans revue manuelle.`,
    );
  }
  if (settlement.id === "physical") {
    retailLines.push(
      `En scénario défavorable, le remboursement pourrait ne pas être purement en cash: la possibilité d’une livraison physique doit être explicitée au client.`,
    );
  }
  retailLines.push(
    `Lecture fondée sur ${coverage.label.toLowerCase()} avec un consensus actuel de ${consensus?.status?.consensusPct || 0}%.`,
  );

  const sellerRows = [
    ["Base documentaire", coverage.label],
    ["Famille détectée", type],
    ["ISIN", merged.isin || "À confirmer"],
    ["Émetteur", issuer],
    ["Sous-jacent", underlying],
    ["Structure sous-jacente", structure.label],
    ["Coupon", coupon !== null ? `${formatPctFr(coupon)} / an` : "À confirmer"],
    ["Style de coupon", couponStyle.label],
    ["Fréquence d’observation", frequency.sellerLabel || frequency.label],
    [
      "Rappel automatique",
      recall !== null
        ? `${formatPctFr(recall, 0)} du niveau initial`
        : "Non identifié",
    ],
    [
      "Barrière capital",
      barrier !== null
        ? `${formatPctFr(barrier, 0)} (${barrierObservation.label})`
        : "À confirmer",
    ],
    ["Nominal", nominal !== null ? formatNominalFr(nominal) : "À confirmer"],
    ["Échéance", maturity || "À confirmer"],
    ["Settlement", settlement.label],
    [
      "Calendrier détecté",
      schedule.length ? `${schedule.length} ligne(s)` : "Non détecté",
    ],
    [
      "Decrement",
      decrement !== null
        ? `${decrement.toLocaleString("fr-FR")} pts`
        : "Aucun détecté",
    ],
    [
      "Consensus",
      `${consensus?.status?.consensusPct || 0}% (${consensus?.status?.level || "LOW"})`,
    ],
  ];

  const literaryLines = [];
  literaryLines.push(
    `Le document laisse apparaître une structure de rendement plus sophistiquée qu’une simple obligation: ${type.toLowerCase()} ${issuer ? `signé ${issuer}` : ""}, elle s’organise autour de ${underlying}.`,
  );
  if (coupon !== null) {
    literaryLines.push(
      `Son rythme vient du coupon de ${formatPctFr(coupon)} par an, dont la lecture dépend d’une observation ${frequency.label !== "à confirmer" ? frequency.label : "encore à confirmer"} et ${couponStyle.id === "memory" ? "d’un effet mémoire" : "d’une condition de marché précise"}.`,
    );
  }
  if (barrier !== null) {
    literaryLines.push(
      `La ligne de défense se situe à ${formatPctFr(barrier, 0)}, avec une observation ${barrierObservation.id === "unknown" ? "encore à documenter" : barrierObservation.label.toLowerCase()}.`,
    );
  }
  if (maturity) {
    literaryLines.push(
      `L’horizon ${maturityShort || maturity} donne au produit une temporalité lisible pour une fiche d’onboarding, à condition de compléter la base documentaire avec les pièces juridiques manquantes.`,
    );
  }

  return {
    coverage,
    type,
    issuer,
    underlying,
    structure,
    frequency,
    barrierObservation,
    settlement,
    couponStyle,
    facts,
    evidence,
    schedule,
    watchpoints: uniqueWatchpoints,
    retailText: retailLines.join(" "),
    sellerRows,
    sellerNotes: uniqueWatchpoints.map((item) => item.message),
    literaryText: literaryLines.join(" "),
    heroLead:
      `${type} ${issuer ? `· ${issuer}` : ""} ${underlying ? `· ${underlying}` : ""}`
        .replace(/\s+/g, " ")
        .trim(),
  };
}

function buildRetailNarrative(merged, descriptor, consensus, intelligence) {
  if (intelligence?.retailText) return intelligence.retailText;
  const type = merged?.type || descriptor?.type?.label || "produit structuré";
  const issuer = merged?.issuer || "un émetteur à confirmer";
  const underlying = merged?.underlying || "un sous-jacent à confirmer";
  const coupon = Number.isFinite(Number(merged?.couponPct))
    ? formatPctFr(merged.couponPct)
    : null;
  const barrier = Number.isFinite(Number(merged?.barrierPct))
    ? formatPctFr(merged.barrierPct, 0)
    : null;
  const recall = Number.isFinite(Number(merged?.recallPct))
    ? formatPctFr(merged.recallPct, 0)
    : null;
  const maturity = merged?.maturityDate
    ? new Date(`${merged.maturityDate}T00:00:00`).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;
  const grade = gradeLabelFr(merged?.grade);
  const lines = [];
  lines.push(
    `${merged?.productName || descriptor?.short || type} est un ${type.toLowerCase()} émis par ${issuer}, construit autour de ${underlying}.`,
  );
  if (coupon)
    lines.push(
      `L’idée pour un client retail est simple: viser un rendement cible de ${coupon} par an tant que les conditions de marché restent dans la zone prévue.`,
    );
  if (barrier)
    lines.push(
      `La protection reste conditionnelle, avec un seuil de ${barrier}${recall ? ` et un niveau de rappel à ${recall}` : ""}.`,
    );
  if (maturity)
    lines.push(
      `Le produit se lit comme une solution de portage jusqu’au ${maturity}, avec une promesse de lecture plus accessible que purement technique.`,
    );
  lines.push(
    `Niveau de confiance actuel: ${grade.toLowerCase()} (${consensus?.status?.consensusPct || 0}% de consensus documentaire).`,
  );
  return lines.join(" ");
}

function buildSellerNarrative(
  merged,
  descriptor,
  consensus,
  alerts = [],
  intelligence = null,
) {
  if (intelligence?.sellerRows) {
    return {
      bullets: intelligence.sellerRows,
      notes: intelligence.sellerNotes || [],
    };
  }
  const bullets = [
    ["Type", merged?.type || descriptor?.type?.label || "N/A"],
    ["ISIN", merged?.isin || "N/A"],
    ["Émetteur", merged?.issuer || "N/A"],
    ["Sous-jacent", merged?.underlying || "N/A"],
    [
      "Coupon",
      Number.isFinite(Number(merged?.couponPct))
        ? `${formatPctFr(merged.couponPct)} / an`
        : "N/A",
    ],
    [
      "Barrière protection",
      Number.isFinite(Number(merged?.barrierPct))
        ? formatPctFr(merged.barrierPct, 0)
        : "N/A",
    ],
    [
      "Niveau de rappel",
      Number.isFinite(Number(merged?.recallPct))
        ? formatPctFr(merged.recallPct, 0)
        : "N/A",
    ],
    ["Nominal", formatNominalFr(merged?.nominal)],
    ["Maturité", merged?.maturityDate || "N/A"],
    [
      "Decrement",
      Number.isFinite(Number(merged?.decrement))
        ? `${Number(merged.decrement).toLocaleString("fr-FR")} pts`
        : "N/A",
    ],
    [
      "Consensus",
      `${consensus?.status?.consensusPct || 0}% (${consensus?.status?.level || "LOW"})`,
    ],
    ["Grade extraction", merged?.grade || "LOW"],
  ];
  const notes = alerts
    .map((a) => (typeof a === "string" ? a : a.message))
    .filter(Boolean);
  return { bullets, notes };
}

function buildLiteraryNarrative(merged, descriptor, intelligence = null) {
  if (intelligence?.literaryText) return intelligence.literaryText;
  const underlying = merged?.underlying || "un sous-jacent encore discret";
  const issuer = merged?.issuer || "un émetteur à préciser";
  const type = merged?.type || descriptor?.type?.label || "produit structuré";
  const coupon = Number.isFinite(Number(merged?.couponPct))
    ? formatPctFr(merged.couponPct)
    : null;
  const barrier = Number.isFinite(Number(merged?.barrierPct))
    ? formatPctFr(merged.barrierPct, 0)
    : null;
  const maturity = merged?.maturityDate
    ? new Date(`${merged.maturityDate}T00:00:00`).toLocaleDateString("fr-FR", {
        month: "long",
        year: "numeric",
      })
    : null;
  const lines = [];
  lines.push(
    `Pensé comme une traversée de marché plus qu’un pari brutal, ce ${type.toLowerCase()} signé ${issuer} cherche à capter le rythme de ${underlying} avec une lecture plus posée du risque.`,
  );
  if (coupon)
    lines.push(
      `Le coupon de ${coupon} donne son tempo au produit, tandis que ${barrier ? `la barrière à ${barrier}` : "la structure de protection"} dessine sa ligne de flottaison.`,
    );
  if (maturity)
    lines.push(
      `L’horizon ${maturity} installe une narration d’investissement plus lente, adaptée à un onboarding produit ou à un reporting qui doit rester intelligible et élégant.`,
    );
  return lines.join(" ");
}

function renderIngestionStory(payload = {}) {
  const el = document.getElementById("ing-story");
  if (!el) return;
  if (payload.empty) {
    el.className = "ing-story empty";
    el.innerHTML =
      payload.message ||
      "Importez un document pour générer une fiche onboarding.";
    return;
  }
  const merged = payload.merged || {};
  const descriptor = payload.descriptor || {};
  const consensus = payload.consensus || {};
  const alerts = payload.alerts || [];
  const intelligence = payload.intelligence || null;

  const retailText = buildRetailNarrative(
    merged,
    descriptor,
    consensus,
    intelligence,
  );
  const seller = buildSellerNarrative(
    merged,
    descriptor,
    consensus,
    alerts,
    intelligence,
  );
  const literaryText = buildLiteraryNarrative(merged, descriptor, intelligence);

  // ── Valeurs clés
  const couponVal =
    intelligence?.facts?.find((f) => f.label === "Coupon")?.value ||
    (merged.couponPct != null ? formatPctFr(merged.couponPct) + "/an" : null);
  const barrierVal =
    intelligence?.facts?.find((f) => f.label === "Protection")?.value ||
    (merged.barrierPct != null ? formatPctFr(merged.barrierPct, 0) : null);
  const recallVal =
    intelligence?.facts?.find((f) => f.label === "Rappel auto")?.value ||
    (merged.recallPct != null ? formatPctFr(merged.recallPct, 0) : null);
  const nominalVal =
    merged.nominal != null ? formatNominalFr(merged.nominal) : null;
  const maturityVal = merged.maturityDate
    ? new Date(merged.maturityDate + "T00:00:00").toLocaleDateString("fr-FR", {
        month: "short",
        year: "numeric",
      })
    : null;
  const consensusPct = consensus?.status?.consensusPct || 0;
  const grade = merged.grade || "LOW";
  const gradeColor =
    grade === "HIGH"
      ? "var(--green)"
      : grade === "MEDIUM"
        ? "var(--gold)"
        : "var(--orange)";
  const coverageLabel = intelligence?.coverage?.label || "Document source";

  // ── Métriques
  const metrics = [
    { label: "Coupon", value: couponVal, color: "var(--gold)" },
    { label: "Barrière", value: barrierVal, color: "var(--orange)" },
    { label: "Rappel", value: recallVal, color: "var(--cyan)" },
    { label: "Nominal", value: nominalVal, color: "var(--text)" },
    { label: "Maturité", value: maturityVal, color: "var(--text)" },
    {
      label: "Consensus",
      value: consensusPct + "%",
      color: consensusPct >= 70 ? "var(--green)" : "var(--orange)",
    },
  ];
  const metricsHtml = metrics
    .map(
      (m) => `
    <div class="ing-metric">
      <div class="ing-metric-val" style="color:${m.color}">${escapeHtml(m.value || "—")}</div>
      <div class="ing-metric-lbl">${m.label}</div>
    </div>`,
    )
    .join("");

  // Métriques secondaires
  const durationDays = merged.maturityDate
    ? Math.round(
        (new Date(merged.maturityDate + "T00:00:00") - new Date()) /
          (1000 * 60 * 60 * 24),
      )
    : null;
  const durationStr =
    durationDays != null
      ? durationDays > 365
        ? Math.round(durationDays / 365) + " ans"
        : durationDays + " j"
      : null;

  const vlEntry =
    typeof MarketDataStore !== "undefined" && merged.underlying
      ? MarketDataStore.get(merged.underlying)
      : null;
  const vlStr = vlEntry
    ? vlEntry.vl.toLocaleString("fr-FR", { maximumFractionDigits: 2 }) +
      (vlEntry.type === "action" ? " €" : " pts")
    : null;

  const freqLabel =
    intelligence?.frequency?.sellerLabel ||
    intelligence?.frequency?.label ||
    null;
  const barrObs = intelligence?.barrierObservation?.id;
  const barrObsShort =
    barrObs === "american"
      ? "Américaine"
      : barrObs === "european"
        ? "Européenne"
        : null;
  const memoire = merged.hasMemory
    ? "Oui"
    : merged.hasMemory === false
      ? "Non"
      : null;
  const decrementStr =
    merged.decrement && merged.decrement > 0 ? merged.decrement + " pts" : null;
  const nextSchedDate =
    Array.isArray(merged.scheduleData) && merged.scheduleData.length
      ? merged.scheduleData.find(
          (s) => s.date > new Date().toISOString().slice(0, 10),
        )?.date || null
      : null;

  const metrics2 = [
    {
      label: "VL actuelle",
      value: vlStr,
      color: vlStr ? "var(--cyan)" : undefined,
    },
    { label: "Durée", value: durationStr, color: "var(--text)" },
    { label: "Fréquence", value: freqLabel, color: "var(--text)" },
    {
      label: "Barrière type",
      value: barrObsShort,
      color: barrObsShort === "Américaine" ? "var(--orange)" : "var(--text)",
    },
    {
      label: "Mémoire",
      value: memoire,
      color: merged.hasMemory ? "var(--cyan)" : "var(--text3)",
    },
    { label: "Decrement", value: decrementStr, color: "var(--gold)" },
  ].filter((m) => m.value);

  const metrics2Html = metrics2.length
    ? metrics2
        .map(
          (m) => `
  <div class="ing-metric ing-metric-sm">
    <div class="ing-metric-val" style="color:${m.color || "var(--text2)"}; font-size:13px">${escapeHtml(m.value)}</div>
    <div class="ing-metric-lbl">${m.label}</div>
  </div>`,
        )
        .join("")
    : "";

  // ── Watchpoints compactes
  const watchpoints = intelligence?.watchpoints || [];
  const notesHtml = watchpoints
    .slice(0, 5)
    .map((w) => {
      const icon =
        w.level === "error" ? "⚠" : w.level === "warning" ? "◉" : "◎";
      const color =
        w.level === "error"
          ? "var(--red)"
          : w.level === "warning"
            ? "var(--orange)"
            : "var(--cyan)";
      return `<div class="ing-note-pill" style="border-color:${color}"><span style="color:${color}">${icon}</span> ${escapeHtml(w.message)}</div>`;
    })
    .join("");

  // ── Tableau technique vendeur
  const sellerBullets = seller.bullets
    .map(
      ([label, value]) =>
        `<div class="ing-tech-row"><span class="ing-tech-lbl">${escapeHtml(label)}</span><span class="ing-tech-val">${escapeHtml(value)}</span></div>`,
    )
    .join("");

  // ── Evidence cards
  const evidenceCards = (intelligence?.evidence || [])
    .map(
      (item) => `
    <div class="ing-evidence-item">
      <div class="ing-evidence-hdr">
        <span class="ing-evidence-field">${escapeHtml(item.label)}</span>
        <span class="ing-evidence-src">${escapeHtml(humanizeDocType(item.docType))}</span>
      </div>
      <div class="ing-evidence-val">${escapeHtml(item.value)}</div>
      <div class="ing-evidence-snippet">${escapeHtml(item.snippet)}</div>
    </div>`,
    )
    .join("");

  // ── Schedule
  const scheduleRows = (intelligence?.schedule || [])
    .map(
      (r) =>
        `<tr><td>${escapeHtml(r.date)}</td><td>${escapeHtml(r.kind)}</td><td>${escapeHtml(r.level || "—")}</td><td style="color:var(--text3);font-size:9px;">${escapeHtml(humanizeDocType(r.source))}</td></tr>`,
    )
    .join("");
  const scheduleBlock = scheduleRows
    ? `
    <details class="ing-schedule-details">
      <summary>Calendrier d'observations (${intelligence.schedule.length} entrées)</summary>
      <table class="ing-schedule-table">
        <thead><tr><th>Date</th><th>Événement</th><th>Niveau</th><th>Source</th></tr></thead>
        <tbody>${scheduleRows}</tbody>
      </table>
    </details>`
    : "";

  el.className = "ing-story ready";
  el.innerHTML = `
    <div class="ing-card">
      <div class="ing-card-header">
        <div class="ing-card-left">
          <div class="ing-card-name">${escapeHtml(merged.productName || descriptor.short || "Produit extrait")}</div>
          <div class="ing-card-meta">
            ${merged.isin ? `<span class="ing-isin">${escapeHtml(merged.isin)}</span>` : ""}
            ${merged.issuer ? `<span class="ing-issuer">· ${escapeHtml(merged.issuer)}</span>` : ""}
            ${merged.underlying ? `<span class="ing-underlying">sur ${escapeHtml(merged.underlying)}</span>` : ""}
          </div>
        </div>
        <div class="ing-card-badges">
          <span class="ing-badge-pill ing-badge-type">${escapeHtml(merged.type || "Produit")}</span>
          <span class="ing-badge-pill" style="background:${gradeColor}15;border-color:${gradeColor};color:${gradeColor};">${escapeHtml(gradeLabelFr(grade))}</span>
          <span class="ing-badge-pill ing-badge-source">${escapeHtml(coverageLabel)}</span>
        </div>
      </div>

      <div class="ing-metrics-band">
        ${metricsHtml}
      </div>
      ${metrics2Html ? `<div class="ing-metrics-band ing-metrics-band-sm">${metrics2Html}</div>` : ""}

      ${notesHtml ? `<div class="ing-notes-strip">${notesHtml}</div>` : ""}

      <div class="ing-story-tabs">
        <button class="ing-story-tab active" data-tab="retail" onclick="switchIngestNarrativeTab('retail')">Retail</button>
        <button class="ing-story-tab" data-tab="seller" onclick="switchIngestNarrativeTab('seller')">Fiche vendeur</button>
        <button class="ing-story-tab" data-tab="literary" onclick="switchIngestNarrativeTab('literary')">Version narrative</button>
      </div>

      <div class="ing-story-pane active" data-tab="retail">
        <p class="ing-narrative">${escapeHtml(retailText)}</p>
      </div>
      <div class="ing-story-pane" data-tab="seller">
        <div class="ing-tech-grid">${sellerBullets}</div>
      </div>
      <div class="ing-story-pane" data-tab="literary">
        <p class="ing-narrative ing-narrative-lit">${escapeHtml(literaryText)}</p>
      </div>

      ${
        evidenceCards
          ? `
      <details class="ing-evidence-details">
        <summary>Preuves documentaires (${intelligence?.evidence?.length || 0})</summary>
        <div class="ing-evidence-grid">${evidenceCards}</div>
      </details>`
          : ""
      }

      ${scheduleBlock}
    </div>
  `;
}

function setPitchLoading(on) {
  const e = document.getElementById("ap-loading");
  if (e) e.style.display = on ? "block" : "none";
}

function getPitchInput() {
  const safe = (id) => document.getElementById(id);
  if (!safe("ap-type")) return null;
  const value = (id, fallback = "") => safe(id)?.value?.trim?.() || fallback;
  const numberValue = (id, fallback = null) => {
    const n = Number(value(id, ""));
    return Number.isFinite(n) ? n : fallback;
  };
  const boolValue = (id) => value(id, "false") === "true";
  const typeValue = safe("ap-type").value;
  const productFamily =
    globalThis.StructuraDomain?.normalizeProductFamily?.(typeValue, typeValue) ||
    typeValue ||
    "phoenix";
  const coupon = numberValue("ap-coupon", 0);
  const hasMarketBarrier = ["phoenix", "athena", "bearish_taux"].includes(productFamily);
  const barrier = hasMarketBarrier ? numberValue("ap-barrier", 0) : null;
  const couponBarrier =
    productFamily === "phoenix" || productFamily === "bearish_taux"
      ? numberValue("ap-coupon-barrier", barrier)
      : null;
  const recall = hasMarketBarrier ? numberValue("ap-recall", 100) : null;
  const underlyings = value("ap-under", "Sous-jacent")
    .split(/[,;]+/)
    .map((item) => item.trim())
    .filter(Boolean);
  const underlyingCount = Math.max(
    numberValue("ap-underlying-count", underlyings.length || 1) || 1,
    underlyings.length || 1,
  );
  const basketStructure =
    underlyingCount > 1 ? value("ap-basket", "worstof") : "single";
  const frequency = value("ap-frequency", "annuel");
  const [capRaw, floorRaw] = value("ap-cap-floor", "")
    .split("/")
    .map((item) => item.trim());
  const capPct = capRaw ? Number(String(capRaw).replace(",", ".")) : null;
  const floorPct = floorRaw ? Number(String(floorRaw).replace(",", ".")) : null;
  const initialLevelDates = value("ap-initial-dates", "")
    .split(/[;,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
  const callDates = value("ap-call-dates", "")
    .split(/[;,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
  const characteristics = globalThis.StructuraDomain?.normalizeCharacteristics
    ? globalThis.StructuraDomain.normalizeCharacteristics(
        {
          productFamily,
          issueDate: value("ap-issue-date", ""),
          commercialisationEndDate: value("ap-commercial-end", ""),
          maturityDate: value("ap-maturity-date", ""),
          annualCouponPct: coupon,
          finalThreshold: barrier,
          couponBarrier,
          fixedRecallThreshold: recall,
          frequency,
          underlying: underlyings[0] || "Sous-jacent",
          underlyings,
          basketStructure: basketStructure === "single" ? null : basketStructure,
          underlyingType: value("ap-underlying-type", "indice"),
          hasMemory: boolValue("ap-memory"),
          initialLevelType: value("ap-initial-level", "coursDeCloture"),
          initialLevelDates,
          earlyRedemptionThresholdType: value("ap-recall-type", "fixe"),
          periodBeforeEarlyRedemption:
            productFamily === "athena" ? 1 : numberValue("ap-start-period"),
          couponStartPeriod:
            productFamily === "note"
              ? numberValue("ap-note-coupon-start-period")
              : numberValue("ap-start-period"),
          degressivityPerPeriod: numberValue("ap-degressivity"),
          floor: numberValue("ap-floor"),
          oxygenBarrier: numberValue("ap-oxygen-barrier"),
          putLeveraged: boolValue("ap-put-leveraged"),
          putLeveragedPdi: numberValue("ap-put-pdi"),
          putLeveragedMultiplier: numberValue("ap-put-multiplier"),
          callable: boolValue("ap-callable"),
          callStartPeriod: numberValue("ap-note-call-start-period"),
          callDates,
          callStartDate: value("ap-call-start", ""),
          callEndDate: value("ap-call-end", ""),
          callFrequency: value("ap-call-frequency", ""),
          callMode: value("ap-call-mode", ""),
          referenceEntity: value("ap-note-underlying", ""),
          noteUnderlying: value("ap-note-underlying", ""),
          rateType: value("ap-rate-type", "fixe"),
          noteVersion: value("ap-note-version", "distribue"),
          bearishSubType: value("ap-bearish-subtype", "phoenix"),
          bearishPhoenixVersion: value("ap-bearish-version", "distribue"),
          bearishCouponGuaranteed: boolValue("ap-bearish-guaranteed"),
          bearishCouponGuaranteedPeriod: value("ap-bearish-guaranteed-period", ""),
          bearishCouponGuaranteedAmount: numberValue("ap-bearish-guaranteed-amount"),
          bearishRecallBarrier:
            productFamily === "bearish_taux"
              ? numberValue("ap-bearish-recall-barrier", recall)
              : null,
          bearishCouponBarrier:
            productFamily === "bearish_taux"
              ? numberValue("ap-bearish-coupon-barrier", couponBarrier)
              : null,
          bearishPeriodBeforeRedemption: numberValue("ap-start-period"),
          bearishRedemptionFrequency: frequency,
          riskScore: numberValue("ap-sri"),
          sri: numberValue("ap-sri"),
          spreadPct: numberValue("ap-spread"),
          capPct: Number.isFinite(capPct) ? capPct : null,
          floorPct: Number.isFinite(floorPct) ? floorPct : null,
        },
        productFamily,
      )
    : {};
  return {
    client: value("ap-client", "Client"),
    type: typeValue,
    productFamily,
    characteristics,
    issueDate: value("ap-issue-date", ""),
    commercialisationEndDate: value("ap-commercial-end", ""),
    maturityDate: value("ap-maturity-date", ""),
    underlying: underlyings.join(", ") || "Sous-jacent",
    underlyings,
    underlyingCount,
    underlyingType: value("ap-underlying-type", "indice"),
    duration: value("ap-dur", "2 ans"),
    coupon,
    barrier,
    couponBarrier,
    recall,
    frequency,
    hasMemory: boolValue("ap-memory"),
    initialLevelType: value("ap-initial-level", "coursDeCloture"),
    initialLevelDates,
    recallType: value("ap-recall-type", "fixe"),
    startPeriod:
      productFamily === "athena"
        ? 1
        : productFamily === "note"
        ? numberValue("ap-note-coupon-start-period", 1)
        : numberValue("ap-start-period", 1),
    noteCouponStartPeriod: numberValue("ap-note-coupon-start-period", 1),
    degressivity: numberValue("ap-degressivity"),
    floor: numberValue("ap-floor"),
    oxygenBarrier: numberValue("ap-oxygen-barrier"),
    basketStructure,
    decrement: numberValue("ap-decrement"),
    decrementType: value("ap-decrement-type", "points"),
    putLeveraged: boolValue("ap-put-leveraged"),
    putLeveragedPdi: numberValue("ap-put-pdi"),
    putLeveragedMultiplier: numberValue("ap-put-multiplier"),
    callable: boolValue("ap-callable"),
    noteCallStartPeriod: numberValue("ap-note-call-start-period", 1),
    callStartPeriod: numberValue("ap-note-call-start-period"),
    rateType: value("ap-rate-type", "fixe"),
    noteVersion: value("ap-note-version", "distribue"),
    bearishSubType: value("ap-bearish-subtype", "phoenix"),
    bearishPhoenixVersion: value("ap-bearish-version", "distribue"),
    bearishCouponGuaranteed: boolValue("ap-bearish-guaranteed"),
    bearishCouponGuaranteedPeriod: value("ap-bearish-guaranteed-period", ""),
    bearishCouponGuaranteedAmount: numberValue("ap-bearish-guaranteed-amount"),
    bearishRecallBarrier: numberValue("ap-bearish-recall-barrier"),
    bearishCouponBarrier: numberValue("ap-bearish-coupon-barrier"),
    sri: numberValue("ap-sri"),
    noteUnderlying: value("ap-note-underlying", ""),
    spreadPct: numberValue("ap-spread"),
    capPct: Number.isFinite(capPct) ? capPct : null,
    floorPct: Number.isFinite(floorPct) ? floorPct : null,
    callDates,
    callStartDate: value("ap-call-start", ""),
    callEndDate: value("ap-call-end", ""),
    callFrequency: value("ap-call-frequency", ""),
    callMode: value("ap-call-mode", ""),
    liquidity: value("ap-liquidity", "Rachat possible au prix de marché fixé par l’émetteur"),
    issuer: value("ap-issuer", "Émetteur"),
    rating: value("ap-rating", "N/A"),
    objective: value("ap-objective", ""),
    context: value("ap-context", ""),
  };
}

function pitchTermCards(p) {
  const c = p.characteristics || {};
  const pct = (v, suffix = "%") =>
    v === null || v === undefined || v === "" || !Number.isFinite(Number(v))
      ? "—"
      : `${Number(v).toFixed(Number(v) % 1 === 0 ? 0 : 1)}${suffix}`;
  const basketLabel =
    globalThis.StructuraDomain?.describeUnderlyingBasket?.(
      p.underlyings?.length ? p.underlyings : [p.underlying],
      p.basketStructure === "single" ? null : p.basketStructure,
      "indices",
    ) || p.underlying;
  const ordinal =
    globalThis.StructuraDomain?.ordinalFr?.(p.startPeriod || c.periodBeforeEarlyRedemption || 1) ||
    `${p.startPeriod || 1}ème`;
  const rows = [
    {
      families: ["phoenix", "athena", "bearish_taux", "cln", "note"],
      label: "Famille",
      value: globalThis.StructuraDomain?.PRODUCT_FAMILIES?.[p.productFamily]?.label || p.productFamily,
      note: "mécanique de référence",
    },
    {
      families: ["phoenix", "athena", "bearish_taux", "cln", "note"],
      label: "Sous-jacent",
      value: basketLabel,
      note: p.decrement
        ? `décrément ${p.decrement}${p.decrementType === "percent" ? "%" : " pts"}`
        : globalThis.StructuraDomain?.UNDERLYING_TYPES?.[p.underlyingType] || "niveau de référence",
    },
    {
      families: ["phoenix", "athena"],
      label: "Niveau initial",
      value: globalThis.StructuraDomain?.initialLevelWording?.(c) || p.initialLevelType,
      note: "base de calcul des seuils",
    },
    {
      families: ["phoenix", "athena", "bearish_taux", "cln", "note"],
      label: "Date d'émission",
      value: c.issueDate || p.issueDate || "—",
      note: "début de vie du produit",
    },
    {
      families: ["phoenix", "athena", "bearish_taux", "cln", "note"],
      label: "Fin commercialisation",
      value: c.commercialisationEndDate || p.commercialisationEndDate || "—",
      note: "fenêtre de souscription",
    },
    {
      families: ["phoenix", "athena", "bearish_taux", "cln", "note"],
      label: "Date de maturité",
      value: c.maturityDate || p.maturityDate || "—",
      note: "échéance finale",
    },
    {
      families: ["phoenix", "bearish_taux", "cln", "note"],
      label: "Coupon",
      value: `${pct(p.coupon)}/an`,
      note: `${p.frequency || "annuel"}${p.hasMemory ? " · mémoire" : ""}`,
    },
    {
      families: ["phoenix", "bearish_taux"],
      label: "Barrière coupon",
      value: pct(p.couponBarrier),
      note: p.productFamily === "bearish_taux" ? "coupon si le taux clôture sous le seuil" : "condition de distribution",
    },
    {
      families: ["phoenix", "athena"],
      label: "PDI / protection",
      value: pct(p.barrier),
      note: `risque sous -${pct(100 - Number(p.barrier || 0))}`,
    },
    {
      families: ["phoenix", "athena", "bearish_taux"],
      label: "Rappel / non-call",
      value: pct(p.recall),
      note:
        p.recallType === "degressif"
          ? `non-call ${ordinal} période · dégressif ${pct(p.degressivity || 0)} / obs.`
          : `non-call ${ordinal} période`,
    },
    {
      families: ["phoenix", "athena"],
      label: "Floor rappel",
      value: pct(p.floor),
      note: "seuil minimum si dégressif",
    },
    {
      families: ["athena"],
      label: "Barrière oxygène",
      value: pct(p.oxygenBarrier),
      note: "seuil spécifique à maturité",
    },
    {
      families: ["phoenix"],
      label: "Put Leveraged",
      value: p.putLeveraged ? "Oui" : "Non",
      note: p.putLeveraged
        ? `PDI ${pct(p.putLeveragedPdi)} · perte x${p.putLeveragedMultiplier || "—"}`
        : "pas de levier de perte détecté",
    },
    {
      families: ["bearish_taux"],
      label: "Version Bearish",
      value: p.bearishSubType === "athena" ? "Bearish Athena" : "Bearish Phoenix",
      note: p.bearishCouponGuaranteed
        ? `${p.bearishPhoenixVersion === "in_fine" ? "in fine" : "distribué"} · coupon garanti ${pct(p.bearishCouponGuaranteedAmount)} ${p.bearishCouponGuaranteedPeriod || ""}`.trim()
        : `${p.bearishPhoenixVersion === "in_fine" ? "in fine" : "distribué"} · sans coupon garanti initial`,
    },
    {
      families: ["cln", "note"],
      label: "Taux / Crédit",
      value: p.noteUnderlying || "—",
      note:
        p.productFamily === "note"
          ? `spread ${pct(p.spreadPct)} · cap/floor ${pct(p.capPct)} / ${pct(p.floorPct)}`
          : p.productFamily === "cln"
            ? "entité de référence / événement crédit"
            : "N/A",
    },
    {
      families: ["note"],
      label: "Début coupon",
      value: `${pitchOrdinal(c.couponStartPeriod || p.noteCouponStartPeriod || 1)} période`,
      note: `${p.noteVersion === "in_fine" ? "enregistrement du coupon" : "distribution du coupon"} · ${pitchFrequencyLabel(p.frequency)}`,
    },
    {
      families: ["note"],
      label: "Début call",
      value: p.callable
        ? `${pitchOrdinal(c.callStartPeriod || p.callStartPeriod || p.noteCallStartPeriod || 1)} période`
        : "Non callable",
      note: p.callable
        ? `call émetteur distinct du démarrage coupon · ${pitchFrequencyLabel(p.callFrequency || p.frequency, "every")}`
        : "pas d'option de rappel émetteur",
    },
    {
      families: ["cln", "note"],
      label: "Callable émetteur",
      value: p.callable ? "Oui" : "Non",
      note: p.callable
        ? p.productFamily === "note"
          ? `à partir de la ${globalThis.StructuraDomain?.ordinalFr?.(p.callStartPeriod || p.noteCallStartPeriod || 1) || "1ère"} période · ${p.callFrequency || "fréq. N/A"}`
          : p.callMode === "dates"
            ? `dates fixes${p.callDates?.length ? ` · ${p.callDates.join(", ")}` : ""}`
            : `${p.callStartDate || "début N/A"} → ${p.callEndDate || "fin N/A"} · ${p.callFrequency || "fréq. N/A"}`
        : "pas de call émetteur",
    },
    { families: ["phoenix", "athena", "bearish_taux", "cln", "note"], label: "Émetteur", value: p.issuer, note: `notation ${p.rating}` },
  ];
  return rows
    .filter((row) => row.families.includes(p.productFamily))
    .filter((row) => row.value !== "—" && row.value !== null && row.value !== undefined);
}

function pitchEducationPoints(p) {
  const points = [
    "Le rendement affiché est conditionnel : il dépend du respect des seuils aux dates d’observation.",
    "La durée effective peut être plus courte que la maturité maximale en cas de rappel anticipé.",
  ];
  if (p.basketStructure === "worstof")
    points.push("Le worst-of concentre le risque sur le sous-jacent le moins performant.");
  if (p.decrement)
    points.push("L’indice décrémenté doit être contrôlé via le Decrement Score avant commercialisation.");
  if (p.recallType === "degressif")
    points.push("Le seuil de rappel dégressif doit être expliqué avec son floor et sa barrière coupon.");
  if (p.putLeveraged)
    points.push("Le Put Leveraged multiplie la perte en cas de franchissement de la PDI.");
  if (p.callable)
    points.push("Le call émetteur peut raccourcir la durée et modifier le portage attendu.");
  return points;
}

function pitchOrdinal(value, fallback = 1) {
  const n = Number(value || fallback);
  return globalThis.StructuraDomain?.ordinalFr?.(n) || `${n}${n === 1 ? "ère" : "ème"}`;
}

function pitchFrequencyLabel(frequency, mode = "period") {
  const labels = {
    annuel: { period: "année", every: "chaque année", per: "an" },
    semestriel: { period: "semestre", every: "chaque semestre", per: "semestre" },
    trimestriel: { period: "trimestre", every: "chaque trimestre", per: "trimestre" },
    mensuel: { period: "mois", every: "chaque mois", per: "mois" },
  };
  const normalized = globalThis.StructuraDomain?.normalizeFrequency?.(frequency) || frequency;
  return labels[normalized]?.[mode] || frequency || "période";
}

function formatPitchPct(value, digits = 2) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "XX%";
  return `${n.toFixed(digits).replace(".", ",")}%`;
}

function hydratePitchFromLastExtraction() {
  const data = APP_RUNTIME.extractedDocumentData || extractedDocumentData;
  if (!data) {
    notify("Aucun document lu à réutiliser", "err");
    return;
  }
  const c = data.characteristics || {};
  const set = (id, value) => {
    const el = document.getElementById(id);
    if (!el || value === null || value === undefined || value === "") return;
    el.value = value;
  };
  const family =
    globalThis.StructuraDomain?.normalizeProductFamily?.(
      data.productFamily || c.productFamily || data.type,
      data.type,
    ) || "phoenix";
  set("ap-type", family);
  set("ap-under", (c.underlyings?.length ? c.underlyings : [data.underlying]).filter(Boolean).join(", "));
  set("ap-coupon", c.annualCouponPct ?? data.couponPct);
  set("ap-issue-date", c.issueDate || data.issueDate);
  set("ap-commercial-end", c.commercialisationEndDate || data.commercialisationEndDate);
  set("ap-maturity-date", c.maturityDate || data.maturityDate);
  set("ap-barrier", c.finalThreshold ?? data.barrierPct);
  set("ap-coupon-barrier", c.couponBarrier ?? data.barrierPct);
  set("ap-recall", c.fixedRecallThreshold ?? data.recallPct);
  set("ap-frequency", c.frequency || data.couponPeriod);
  set("ap-memory", c.hasMemory || data.hasMemory ? "true" : "false");
  set("ap-initial-level", c.initialLevelType);
  set("ap-initial-dates", c.initialLevelDates?.join("; "));
  set("ap-underlying-count", c.underlyings?.length || 1);
  set("ap-underlying-type", c.underlyingType);
  set("ap-recall-type", c.earlyRedemptionThresholdType);
  set("ap-start-period", c.periodBeforeEarlyRedemption || c.couponStartPeriod || c.bearishPeriodBeforeRedemption);
  set("ap-note-coupon-start-period", c.couponStartPeriod);
  set("ap-degressivity", c.degressivityPerPeriod);
  set("ap-floor", c.floor);
  set("ap-oxygen-barrier", c.oxygenBarrier);
  set("ap-basket", c.basketStructure || "single");
  set("ap-decrement", data.decrement);
  set("ap-put-leveraged", c.putLeveraged ? "true" : "false");
  set("ap-put-pdi", c.putLeveragedPdi);
  set("ap-put-multiplier", c.putLeveragedMultiplier);
  set("ap-callable", c.callable ? "true" : "false");
  set("ap-note-call-start-period", c.callStartPeriod);
  set("ap-call-dates", c.callDates?.join("; "));
  set("ap-call-start", c.callStartDate);
  set("ap-call-end", c.callEndDate);
  set("ap-call-frequency", c.callFrequency);
  set("ap-call-mode", c.callMode || c.callDateMode);
  set("ap-note-underlying", c.noteUnderlying || c.referenceEntity);
  set("ap-rate-type", c.rateType);
  set("ap-note-version", c.noteVersion);
  set("ap-bearish-subtype", c.bearishSubType);
  set("ap-bearish-version", c.bearishPhoenixVersion);
  set("ap-bearish-guaranteed", c.bearishCouponGuaranteed ? "true" : "false");
  set("ap-bearish-guaranteed-period", c.bearishCouponGuaranteedPeriod);
  set("ap-bearish-guaranteed-amount", c.bearishCouponGuaranteedAmount);
  set("ap-bearish-recall-barrier", c.bearishRecallBarrier ?? data.recallPct);
  set("ap-bearish-coupon-barrier", c.bearishCouponBarrier ?? c.couponBarrier);
  set("ap-sri", data.riskScore ?? c.riskScore ?? c.sri);
  set("ap-spread", c.spreadPct);
  if (c.capPct || c.floorPct) set("ap-cap-floor", `${c.capPct || ""} / ${c.floorPct || ""}`);
  set("ap-issuer", data.issuer);
  set("ap-dur", c.maturityYears ? `${c.maturityYears} ans` : data.maturityDate || "");
  set(
    "ap-context",
    `Pitch généré depuis la lecture documentaire ${data.isin ? `(${data.isin})` : ""}. Paramètres à valider contre le KID/DIC et le term sheet.`,
  );
  notify("Pitch Engine prérempli depuis le dernier document", "ok");
  updatePitchProductFields();
}

const THEME_STORAGE_KEY = "structura.v2.theme";

function getTheme() {
  try {
    return typeof localStorage !== "undefined" &&
      localStorage.getItem(THEME_STORAGE_KEY) === "dark"
      ? "dark"
      : "light";
  } catch (e) {
    return "light";
  }
}

function applyTheme(theme) {
  if (typeof document === "undefined") return;
  const isDark = theme === "dark";
  if (isDark) {
    document.documentElement.setAttribute("data-theme", "dark");
  } else {
    document.documentElement.removeAttribute("data-theme");
  }
  const btn = document.getElementById("theme-toggle");
  if (btn) {
    btn.classList.toggle("is-dark", isDark);
    btn.setAttribute(
      "aria-label",
      isDark ? "Revenir au thème clair" : "Activer le thème sombre",
    );
    btn.title = isDark ? "Thème clair" : "Thème sombre";
  }
}

function toggleTheme() {
  const next = getTheme() === "dark" ? "light" : "dark";
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    }
  } catch (e) {}
  applyTheme(next);
}

const PITCH_WIZARD_STEP_COUNT = 5;
let pitchWizardCurrentStep = 1;

const PITCH_TYPE_LABELS = {
  phoenix: "Phoenix Autocall",
  athena: "Athena Autocall",
  bearish_taux: "Bearish Taux",
  cln: "CLN (Credit Linked Note)",
  note: "Note taux fixe/variable",
};
const PITCH_FREQUENCY_LABELS = {
  annuel: "Annuelle",
  semestriel: "Semestrielle",
  trimestriel: "Trimestrielle",
  mensuel: "Mensuelle",
};

function pitchWizardSummaryRow(step, label, value) {
  return `<div class="pitch-summary-row">
    <span class="pitch-summary-label">${escapeHtml(label)}</span>
    <span class="pitch-summary-value">${escapeHtml(value)}</span>
    <button type="button" class="pitch-summary-edit" onclick="pitchWizardGoTo(${step})">Modifier</button>
  </div>`;
}

function pitchWizardBuildSummary() {
  if (typeof document === "undefined") return;
  const el = document.getElementById("pitch-wizard-summary");
  if (!el) return;
  const val = (id) => document.getElementById(id)?.value || "";
  const family = val("ap-type") || "phoenix";
  const showsBarrier = ["phoenix", "athena", "bearish_taux"].includes(family);
  const rows = [
    pitchWizardSummaryRow(1, "Client", val("ap-client") || "—"),
    pitchWizardSummaryRow(1, "Type produit", PITCH_TYPE_LABELS[family] || family),
    pitchWizardSummaryRow(1, "Sous-jacent(s)", val("ap-under") || "—"),
    pitchWizardSummaryRow(1, "Durée", val("ap-dur") || "—"),
    pitchWizardSummaryRow(
      1,
      "Coupon",
      val("ap-coupon") ? `${val("ap-coupon")}%/an` : "—",
    ),
  ];
  if (showsBarrier) {
    rows.push(
      pitchWizardSummaryRow(
        1,
        "PDI / barrière protection",
        val("ap-barrier") ? `${val("ap-barrier")}%` : "—",
      ),
      pitchWizardSummaryRow(
        1,
        "Rappel",
        val("ap-recall") ? `${val("ap-recall")}%` : "—",
      ),
    );
  }
  rows.push(
    pitchWizardSummaryRow(
      2,
      "Fréquence",
      PITCH_FREQUENCY_LABELS[val("ap-frequency")] || "—",
    ),
    pitchWizardSummaryRow(2, "Date de maturité", val("ap-maturity-date") || "—"),
    pitchWizardSummaryRow(4, "Émetteur", val("ap-issuer") || "—"),
    pitchWizardSummaryRow(4, "Notation", val("ap-rating") || "—"),
    pitchWizardSummaryRow(4, "SRI (KID)", val("ap-sri") || "—"),
  );
  el.innerHTML = rows.join("");
}

function pitchWizardRender() {
  if (typeof document === "undefined") return;
  document.querySelectorAll("#view-autopitch .pitch-step").forEach((el) => {
    const step = Number(el.dataset.step) || 1;
    el.classList.toggle("active", step === pitchWizardCurrentStep);
  });
  document.querySelectorAll("#view-autopitch .pitch-wizard-step").forEach((btn) => {
    const step = Number(btn.dataset.stepBtn) || 1;
    btn.classList.toggle("active", step === pitchWizardCurrentStep);
    btn.classList.toggle("done", step < pitchWizardCurrentStep);
  });
  const prevBtn = document.getElementById("pitch-wizard-prev");
  const nextBtn = document.getElementById("pitch-wizard-next");
  const status = document.getElementById("pitch-wizard-status");
  if (prevBtn) prevBtn.disabled = pitchWizardCurrentStep === 1;
  if (nextBtn) nextBtn.hidden = pitchWizardCurrentStep === PITCH_WIZARD_STEP_COUNT;
  if (status) {
    status.textContent = `Étape ${pitchWizardCurrentStep} sur ${PITCH_WIZARD_STEP_COUNT}`;
  }
  if (pitchWizardCurrentStep === PITCH_WIZARD_STEP_COUNT) {
    pitchWizardBuildSummary();
  }
}

function pitchWizardGoTo(step) {
  pitchWizardCurrentStep = Math.min(
    PITCH_WIZARD_STEP_COUNT,
    Math.max(1, Number(step) || 1),
  );
  pitchWizardRender();
}

function pitchFieldErrorMessage(el) {
  if (el.validity.valueMissing) return "Champ requis";
  if (el.validity.rangeUnderflow) return `Minimum ${el.min}`;
  if (el.validity.rangeOverflow) return `Maximum ${el.max}`;
  if (el.validity.badInput || el.validity.typeMismatch) return "Valeur invalide";
  return "Valeur invalide";
}

function pitchValidateField(el) {
  if (!el || typeof el.checkValidity !== "function") return true;
  const valid = el.checkValidity();
  el.classList.toggle("f-inp-error", !valid);
  const host = el.parentElement;
  let msg = host?.querySelector(".pitch-field-error");
  if (!valid) {
    if (!msg && host) {
      msg = document.createElement("div");
      msg.className = "pitch-field-error";
      el.insertAdjacentElement("afterend", msg);
    }
    if (msg) msg.textContent = pitchFieldErrorMessage(el);
  } else if (msg) {
    msg.remove();
  }
  return valid;
}

function pitchWizardValidateStep(step) {
  if (typeof document === "undefined") return true;
  const stepEl = document.querySelector(
    `#view-autopitch .pitch-step[data-step="${step}"]`,
  );
  if (!stepEl) return true;
  let firstInvalid = null;
  stepEl.querySelectorAll(".f-inp, .f-sel").forEach((el) => {
    if (el.offsetParent === null) return;
    const valid = pitchValidateField(el);
    if (!valid && !firstInvalid) firstInvalid = el;
  });
  if (firstInvalid) {
    firstInvalid.focus();
    return false;
  }
  return true;
}

function pitchWizardSetupInlineValidation() {
  if (typeof document === "undefined") return;
  document.querySelectorAll("#view-autopitch .f-inp, #view-autopitch .f-sel").forEach((el) => {
    el.addEventListener("blur", () => pitchValidateField(el));
  });
}

function pitchWizardNext() {
  if (!pitchWizardValidateStep(pitchWizardCurrentStep)) return;
  pitchWizardGoTo(pitchWizardCurrentStep + 1);
}

function pitchWizardPrev() {
  pitchWizardGoTo(pitchWizardCurrentStep - 1);
}

function updatePitchProductFields() {
  if (typeof document === "undefined") return;
  const family =
    document.getElementById("ap-type")?.value ||
    globalThis.StructuraDomain?.normalizeProductFamily?.(
      document.getElementById("ap-type")?.value,
    ) ||
    "phoenix";
  const recallType = document.getElementById("ap-recall-type")?.value || "fixe";
  const putLeveraged = document.getElementById("ap-put-leveraged")?.value === "true";
  const rateType = document.getElementById("ap-rate-type")?.value || "fixe";
  const callable = document.getElementById("ap-callable")?.value === "true";
  const callMode = document.getElementById("ap-call-mode")?.value || "periode";
  const bearishSubType = document.getElementById("ap-bearish-subtype")?.value || "phoenix";
  const bearishGuaranteed =
    document.getElementById("ap-bearish-guaranteed")?.value === "true";
  const underlyingCount = Math.max(
    Number(document.getElementById("ap-underlying-count")?.value) || 1,
    String(document.getElementById("ap-under")?.value || "")
      .split(/[,;]+/)
      .map((item) => item.trim())
      .filter(Boolean).length || 1,
  );
  const basket = document.getElementById("ap-basket");
  if (basket && underlyingCount <= 1) basket.value = "single";

  document.querySelectorAll("#view-autopitch .pitch-field").forEach((el) => {
    const families = String(el.dataset.families || "")
      .split(/\s+/)
      .filter(Boolean);
    const familyVisible = !families.length || families.includes(family);
    const degressiveVisible =
      !el.classList.contains("pitch-degressive-field") || recallType === "degressif";
    const putVisible = !el.classList.contains("pitch-put-field") || putLeveraged;
    const noteVariableVisible =
      !el.classList.contains("pitch-note-variable-field") || rateType === "variable";
    const callVisible = !el.classList.contains("pitch-call-field") || callable;
    const clnCallDatesVisible =
      !el.classList.contains("pitch-cln-call-dates-field") || callMode === "dates";
    const clnCallPeriodVisible =
      !el.classList.contains("pitch-cln-call-period-field") || callMode !== "dates";
    const bearishPhoenixVisible =
      !el.classList.contains("pitch-bearish-phoenix-field") || bearishSubType === "phoenix";
    const bearishGuaranteedVisible =
      !el.classList.contains("pitch-bearish-guaranteed-field") || bearishGuaranteed;
    const multiUnderlyingVisible =
      !el.classList.contains("pitch-multi-underlying-field") || underlyingCount > 1;
    const noteReferenceVisible =
      !el.classList.contains("pitch-note-reference-field") ||
      family !== "note" ||
      rateType === "variable";
    el.style.display =
      familyVisible &&
      degressiveVisible &&
      putVisible &&
      noteVariableVisible &&
      callVisible &&
      clnCallDatesVisible &&
      clnCallPeriodVisible &&
      bearishPhoenixVisible &&
      bearishGuaranteedVisible &&
      multiUnderlyingVisible &&
      noteReferenceVisible
        ? ""
        : "none";
  });

  const labels = {
    phoenix: {
      coupon: "Coupon (%/an)",
      barrier: "PDI / protection (%)",
      recall: "Rappel (%)",
      underlying: "Sous-jacent(s)",
    },
    athena: {
      coupon: "Coupon accumulé (%/an)",
      barrier: "PDI (%)",
      recall: "Seuil de rappel (%)",
      underlying: "Sous-jacent(s)",
    },
    bearish_taux: {
      coupon: "Coupon bearish (%/an)",
      barrier: "Barrière finale (%)",
      recall: "Barrière de rappel (%)",
      underlying: "Sous-jacent taux",
    },
    cln: {
      coupon: "Coupon crédit (%/an)",
      barrier: "Risque crédit",
      recall: "Call / remboursement (%)",
      underlying: "Entité de référence",
    },
    note: {
      coupon: "Coupon / marge (%/an)",
      barrier: "Référence obligataire",
      recall: "Call émetteur (%)",
      underlying: "Référence taux",
    },
  }[family];
  const setLabel = (inputId, text) => {
    const input = document.getElementById(inputId);
    const label = input?.closest("div")?.querySelector("label");
    if (label && text) label.textContent = text;
  };
  if (labels) {
    setLabel("ap-coupon", labels.coupon);
    setLabel("ap-barrier", labels.barrier);
    setLabel("ap-recall", labels.recall);
    setLabel("ap-under", labels.underlying);
  }
}

function pitchFamilyConfig(p) {
  const family = p.productFamily || "phoenix";
  const c = p.characteristics || {};
  const couponFmt = `${Number(p.coupon || 0).toFixed(1)}%`;
  const barrierFmt = `${Number(p.barrier || 0).toFixed(0)}%`;
  const recallFmt = `${Number(p.recall || 100).toFixed(0)}%`;
  const downside = Math.max(0, 100 - Number(p.barrier || 0));
  const familyLabel =
    globalThis.StructuraDomain?.PRODUCT_FAMILIES?.[family]?.label ||
    "Produit structuré";
  const couponPerPeriod =
    c.couponPerPeriodPct ??
    globalThis.StructuraDomain?.couponPerPeriod?.(p.coupon, p.frequency) ??
    p.coupon;
  const couponPeriodFmt = `${Number(couponPerPeriod || 0).toFixed(2).replace(".", ",")}%`;
  const pctForText = (value) =>
    Number.isFinite(Number(value)) ? `${Number(value).toFixed(0)}%` : "XX%";
  const startOrdinal =
    globalThis.StructuraDomain?.ordinalFr?.(p.startPeriod || 1) || `${p.startPeriod || 1}ème`;
  const firstPeriodOrdinal = globalThis.StructuraDomain?.ordinalFr?.(1) || "1ère";
  const basket =
    globalThis.StructuraDomain?.describeUnderlyingBasket?.(
      c.underlyings?.length ? c.underlyings : [p.underlying],
      c.basketStructure || "worstof",
      c.underlyingType === "action_vanille" ? "actions" : "indices",
    ) || p.underlying;
  const couponPeriodLabel = pitchFrequencyLabel(p.frequency);
  const couponEveryLabel = pitchFrequencyLabel(p.frequency, "every");
  const couponPerLabel = pitchFrequencyLabel(p.frequency, "per");
  const callEveryLabel = pitchFrequencyLabel(p.callFrequency || p.frequency, "every");
  const callPerLabel = pitchFrequencyLabel(p.callFrequency || p.frequency, "per");
  const noteCouponStartOrdinal = pitchOrdinal(c.couponStartPeriod || p.noteCouponStartPeriod || 1);
  const noteCallStartOrdinal = pitchOrdinal(c.callStartPeriod || p.callStartPeriod || p.noteCallStartPeriod || 1);
  const bearishGuaranteedPeriod =
    p.bearishCouponGuaranteedPeriod || `${startOrdinal} période écoulée`;
  const bearishNextPeriod = pitchOrdinal(Number(p.startPeriod || c.bearishPeriodBeforeRedemption || 1) + 1);
  const clnReference = c.referenceEntity || p.noteUnderlying || p.underlying;
  const clnCallMode = c.callMode || p.callMode;
  const clnCallDates = p.callDates?.length ? p.callDates.join(", ") : "dates à confirmer";
  const clnCallWindow = `${p.callStartDate || "date de début à confirmer"} au ${
    p.callEndDate || "date de fin à confirmer"
  } inclus`;
  const clnCallWording =
    p.callable && clnCallMode === "dates"
      ? `Aux dates fixes suivantes (${clnCallDates}), l'émetteur peut rembourser le produit par anticipation à 100% du capital initial + un coupon de ${couponPeriodFmt} par ${couponPerLabel}.`
      : p.callable
        ? `${callEveryLabel.charAt(0).toUpperCase()}${callEveryLabel.slice(1)} du ${clnCallWindow}, l'émetteur peut rembourser le produit par anticipation à 100% du capital initial + un coupon de ${formatPitchPct(
            globalThis.StructuraDomain?.couponPerPeriod?.(p.coupon, p.callFrequency || p.frequency) ??
              couponPerPeriod,
          )} par ${callPerLabel} écoulé.`
        : "Aucune option de remboursement anticipé émetteur n'est renseignée.";

  const commonRisks = [
    ...(Number.isFinite(Number(p.sri))
      ? [
          {
            risk: "SRI (KID)",
            desc: `Indicateur de risque synthétique ${p.sri}/7 issu du document réglementaire`,
            level: Number(p.sri) <= 2 ? "Faible" : Number(p.sri) <= 4 ? "Modéré" : "Élevé",
          },
        ]
      : []),
    {
      risk: "Risque émetteur",
      desc: `Exposition à la signature ${p.issuer} (${p.rating})`,
      level: /AAA|AA\+|AA/.test(p.rating)
        ? "Faible"
        : /A-|A|A\+/.test(p.rating)
          ? "Modéré"
          : "Élevé",
    },
    {
      risk: "Liquidité secondaire",
      desc: "Sortie avant maturité dépendante des conditions de marché et de la banque",
      level: "Modéré",
    },
  ];

  const configs = {
    phoenix: {
      familyLabel,
      tagline: `Phoenix de rendement sur ${p.underlying}`,
      subtitle: `Coupon conditionnel ${couponFmt}/an · barrière coupon ${barrierFmt} · rappel ${recallFmt}`,
      summary: `Proposition Phoenix pour ${p.client}: l’objectif est de capter un coupon conditionnel régulier tant que ${basket} reste au-dessus de la barrière de coupon. Le rappel automatique à ${recallFmt} permet de raccourcir la durée si le marché se normalise.`,
      metrics: [
        { label: "Coupon par période", value: couponPeriodFmt, sub: `${p.frequency} · ${c.hasMemory ? "mémoire" : "non mémoire"}` },
        { label: "Barrière coupon", value: barrierFmt, sub: c.hasMemory ? "avec effet mémoire" : "sans mémoire explicite" },
        { label: "Rappel auto", value: recallFmt, sub: "observation périodique" },
        { label: "Protection finale", value: barrierFmt, sub: `risque capital sous -${downside}%` },
      ],
      description: `Le Phoenix observe ${basket}. À chaque date d’observation, le coupon est versé si le niveau est supérieur ou égal à ${barrierFmt}. Si le niveau atteint ${recallFmt}, le produit est remboursé par anticipation. À maturité, la perte en capital apparaît si la barrière finale est franchie.`,
      howItWorks: [
        `À partir de la ${firstPeriodOrdinal} période écoulée, coupon de ${couponPeriodFmt} si le sous-jacent clôture au-dessus de ${pctForText(p.couponBarrier || p.barrier)}`,
        c.hasMemory ? "Effet mémoire: les coupons non versés peuvent être rattrapés" : "Coupons non acquis si la condition n'est pas respectée",
        `Rappel automatique à partir de la ${startOrdinal} période si ${p.underlying} clôture à ${recallFmt} ou plus`,
        `Protection conditionnelle du capital jusqu'à une baisse de ${downside}%`,
      ],
      scenarios: {
        bull: { label: "Marché haussier", returnStr: `+${Math.max(p.coupon, p.coupon * 1.5).toFixed(1)}%`, desc: "Rappel probable avec coupon servi." },
        base: { label: "Marché latéral", returnStr: `~${couponPeriodFmt}/période`, desc: "Structure adaptée si le sous-jacent reste au-dessus de la barrière coupon." },
        bear: { label: "Marché baissier", returnStr: `Barrière ${barrierFmt}`, desc: "Coupons interrompus et risque capital si la barrière finale est franchie." },
      },
      risks: [
        { risk: "Risque de marché", desc: `Baisse de ${p.underlying} sous ${barrierFmt}`, level: downside >= 40 ? "Modéré" : "Élevé" },
        { risk: "Risque de coupon", desc: "Coupon non garanti, dépendant des observations", level: "Modéré" },
        ...commonRisks,
      ],
    },
    athena: {
      familyLabel,
      tagline: `Athena autocall sur ${p.underlying}`,
      subtitle: `Coupon accumulé ${couponFmt}/an · rappel ${recallFmt} · protection ${barrierFmt}`,
      summary: `Proposition Athena pour ${p.client}: la structure privilégie un gain au rappel ou à maturité plutôt qu’une distribution régulière. Elle convient à une conviction de stabilité ou de rebond du sous-jacent.`,
      metrics: [
        { label: "Gain par période", value: couponPeriodFmt, sub: "accumulé jusqu'au rappel ou maturité" },
        { label: "Seuil de rappel", value: recallFmt, sub: "déclencheur principal" },
        { label: "Protection finale", value: barrierFmt, sub: `risque sous -${downside}%` },
        { label: "Durée max.", value: p.duration, sub: "horizon de constatation" },
      ],
      description: `L’Athena verse le gain prévu lorsque ${p.underlying} atteint le seuil de rappel. Contrairement au Phoenix, le rendement est concentré au rappel ou à maturité, avec une protection finale conditionnelle.`,
      howItWorks: [
        `Rappel dès la 1ère année écoulée si ${p.underlying} clôture à ${recallFmt} ou plus`,
        `Remboursement anticipé à 100% du capital initial + ${couponPeriodFmt} par période écoulée si le seuil de rappel est respecté`,
        `Pas de logique de coupon périodique autonome`,
        `Capital conditionnellement protégé à maturité au-dessus de ${barrierFmt}`,
      ],
      scenarios: {
        bull: { label: "Rebond rapide", returnStr: `+${p.coupon.toFixed(1)}%/an`, desc: "Rappel anticipé et coupons accumulés cristallisés." },
        base: { label: "Stabilité", returnStr: "Gain différé", desc: "Le rendement dépend de la capacité à atteindre le seuil de rappel." },
        bear: { label: "Baisse durable", returnStr: `Risque sous ${barrierFmt}`, desc: "Capital exposé si le seuil final est franchi." },
      },
      risks: [
        { risk: "Risque de non-rappel", desc: "Le rendement peut rester latent jusqu'à maturité", level: "Modéré" },
        { risk: "Risque de marché", desc: `Perte si ${p.underlying} finit sous ${barrierFmt}`, level: downside >= 40 ? "Modéré" : "Élevé" },
        ...commonRisks,
      ],
    },
    bearish_taux: {
      familyLabel,
      tagline: `Bearish Taux sur ${p.underlying}`,
      subtitle: `Structure inverse · coupon ${couponFmt}/an · barrière rappel ${recallFmt}`,
      summary: `Proposition Bearish Taux pour ${p.client}: la structure est conçue pour un scénario de détente ou de non-remontée du taux de référence. La chronologie distingue le coupon garanti éventuel, le rappel dès la ${startOrdinal} période, puis le coupon conditionnel à partir de la ${bearishNextPeriod} période.`,
      metrics: [
        { label: "Coupon par période", value: couponPeriodFmt, sub: `${couponEveryLabel} · logique taux inversée` },
        { label: "Coupon garanti", value: p.bearishCouponGuaranteed ? formatPitchPct(p.bearishCouponGuaranteedAmount || couponPerPeriod) : "Non", sub: p.bearishCouponGuaranteed ? `fin de la ${bearishGuaranteedPeriod}` : "pas de période garantie" },
        { label: "Barrière rappel", value: pctForText(p.bearishRecallBarrier || p.recall), sub: "rappel si le taux est sous le seuil" },
        { label: "Coupon conditionnel", value: pctForText(p.bearishCouponBarrier || p.couponBarrier || p.barrier), sub: `à partir de la ${bearishNextPeriod} période` },
      ],
      description: `Le Bearish Taux fonctionne à l’envers d’un autocall actions: le rappel et le coupon sont favorisés si ${p.underlying} clôture sous les seuils définis. Pour un Bearish Phoenix, le rappel peut démarrer dès la période ${startOrdinal}, tandis que le coupon conditionnel démarre à la période suivante (${bearishNextPeriod}) lorsqu'un coupon garanti initial existe.`,
      howItWorks: [
        p.bearishCouponGuaranteed
          ? `Fin de la ${bearishGuaranteedPeriod}: ${
              p.bearishPhoenixVersion === "in_fine" ? "enregistré" : "distribué"
            } d'un coupon garanti de ${
              Number.isFinite(Number(p.bearishCouponGuaranteedAmount))
                ? pctForText(p.bearishCouponGuaranteedAmount)
                : couponPeriodFmt
            }`
          : `Pas de coupon garanti initial: le coupon reste conditionné au respect de la barrière coupon`,
        `À partir de la ${startOrdinal} période écoulée: remboursement anticipé à 100% du capital initial${p.bearishPhoenixVersion === "in_fine" ? " + coupons enregistrés" : ""} si ${p.underlying} clôture sous ${recallFmt}`,
        `À partir de la ${bearishNextPeriod} période: ${p.bearishPhoenixVersion === "in_fine" ? "enregistrement" : "distribution"} d'un coupon de ${couponPeriodFmt} si ${p.underlying} clôture sous ${pctForText(p.couponBarrier || p.barrier)}`,
        "Hausse forte du taux défavorable à la mécanique",
      ],
      scenarios: {
        bull: { label: "Taux en baisse", returnStr: `+${p.coupon.toFixed(1)}%/an`, desc: "Scénario favorable: coupon et rappel facilités." },
        base: { label: "Taux stables", returnStr: "Coupon possible", desc: "Le produit peut porter le rendement si les seuils sont respectés." },
        bear: { label: "Taux en hausse", returnStr: "Risque accru", desc: "Hausse du sous-jacent défavorable à la structure." },
      },
      risks: [
        { risk: "Risque de taux", desc: "Hausse du taux de référence au-dessus des seuils", level: "Élevé" },
        { risk: "Risque de lecture", desc: "Mécanique inverse à expliciter au client", level: "Modéré" },
        ...commonRisks,
      ],
    },
    cln: {
      familyLabel,
      tagline: `CLN sur ${clnReference}`,
      subtitle: `Coupon crédit ${couponFmt}/an · référence ${clnReference}`,
      summary: `Proposition CLN pour ${p.client}: le rendement rémunère principalement le risque de crédit de l’entité de référence. La mécanique de call est ${
        p.callable
          ? clnCallMode === "dates"
            ? "définie sur des dates fixes."
            : "définie sur une période récurrente avec début et fin inclus."
          : "non renseignée."
      }`,
      metrics: [
        { label: "Coupon crédit", value: couponPeriodFmt, sub: `par ${couponPerLabel} hors événement de crédit` },
        { label: "Entité de référence", value: clnReference, sub: "risque économique principal" },
        { label: "Mode de call", value: p.callable ? (clnCallMode === "dates" ? "Dates fixes" : "Période récurrente") : "Non callable", sub: p.callable ? (clnCallMode === "dates" ? clnCallDates : clnCallWindow) : "pas de call émetteur" },
        { label: "Maturité", value: p.duration, sub: "portage crédit" },
      ],
      description: `La CLN verse le coupon tant qu’aucun événement de crédit ne survient sur ${clnReference}. En cas d’événement de crédit, le remboursement dépend du recouvrement et des définitions documentaires applicables. ${clnCallWording}`,
      howItWorks: [
        `Coupon de ${couponPeriodFmt} par ${couponPerLabel} hors événement de crédit`,
        `Surveillance de l'entité de référence: ${clnReference}`,
        clnCallWording,
        `Définition événement de crédit: ${c.creditEventDefinition || "ISDA / documentation à confirmer"}`,
        `À maturité: remboursement du capital + coupon si aucun événement de crédit n'est survenu, sinon remboursement selon le taux de recouvrement fixé par l'ISDA.`,
      ],
      scenarios: {
        bull: { label: "Aucun événement crédit", returnStr: `+${p.coupon.toFixed(1)}%/an`, desc: "Coupon perçu jusqu'au remboursement." },
        base: { label: "Spread stable", returnStr: "Portage", desc: "La valeur secondaire peut bouger mais le portage reste central." },
        bear: { label: "Événement crédit", returnStr: "Perte possible", desc: "Remboursement lié au recouvrement." },
      },
      risks: [
        { risk: "Risque de crédit", desc: `Défaut ou événement crédit sur ${clnReference}`, level: "Élevé" },
        { risk: "Risque documentaire", desc: "Définitions ISDA, recouvrement et settlement à vérifier", level: "Modéré" },
        ...commonRisks,
      ],
    },
    note: {
      familyLabel,
      tagline: `Note ${c.rateType === "variable" ? "à taux variable" : "à taux fixe"} sur ${p.underlying}`,
      subtitle: `Coupon ${couponFmt}/an · ${c.callable ? "callable" : "non callable"} · maturité ${p.duration}`,
      summary: `Proposition Note pour ${p.client}: la lecture est obligataire. Le coupon démarre à la ${noteCouponStartOrdinal} période, tandis que le call émetteur ${
        c.callable ? `ne démarre qu'à la ${noteCallStartOrdinal} période.` : "n'est pas activé."
      } Ces deux dates doivent rester séparées dans l'analyse.`,
      metrics: [
        { label: "Début coupon", value: `${noteCouponStartOrdinal} période`, sub: `${p.noteVersion === "in_fine" ? "enregistrement" : "distribution"} · ${couponEveryLabel}` },
        { label: "Début call", value: c.callable ? `${noteCallStartOrdinal} période` : "Non callable", sub: c.callable ? `${callEveryLabel} · option émetteur` : "pas de rappel émetteur" },
        { label: "Cap", value: c.capPct ? `${c.capPct}%` : "N/A", sub: "plafond éventuel" },
        { label: "Floor", value: c.floorPct ? `${c.floorPct}%` : "N/A", sub: "plancher éventuel" },
      ],
      description: `La Note doit être analysée comme une obligation structurée: coupon, maturité, call émetteur et éventuels cap/floor déterminent le profil de rendement. Le début du coupon et le début du call émetteur sont deux paramètres distincts.`,
      howItWorks: [
        c.rateType === "variable"
          ? `À partir de la ${noteCouponStartOrdinal} période: coupon variable égal à ${p.noteUnderlying || "l'indice de taux"}${p.spreadPct ? ` + ${p.spreadPct}%` : ""}, flooré à ${p.floorPct || "XX"}% et cappé à ${p.capPct || "XX"}%`
          : `À partir de la ${noteCouponStartOrdinal} période: coupon fixe de ${couponPeriodFmt} par ${couponPeriodLabel}, ${p.noteVersion === "in_fine" ? "enregistré et payé au rappel ou à maturité" : "distribué périodiquement"}`,
        c.noteUnderlying ? `Indexation: ${c.noteUnderlying}` : "Indexation à confirmer si taux variable",
        c.callable
          ? `À partir de la ${noteCallStartOrdinal} période: l'émetteur peut rappeler la note selon une fréquence ${p.callFrequency || p.frequency || "à confirmer"}`
          : "Pas de call émetteur détecté",
        "Remboursement nominal attendu hors défaut émetteur et clauses spécifiques",
      ],
      scenarios: {
        bull: { label: "Taux favorables", returnStr: `+${p.coupon.toFixed(1)}%/an`, desc: "Portage conforme au coupon attendu." },
        base: { label: "Portage", returnStr: "Coupon", desc: "Rendement dominé par le coupon et la durée." },
        bear: { label: "Taux défavorables", returnStr: "Mark-to-market", desc: "Valeur secondaire sensible aux taux et au spread émetteur." },
      },
      risks: [
        { risk: "Risque de taux", desc: "Variation des taux impactant la valeur secondaire", level: "Modéré" },
        { risk: "Risque de call", desc: "Remboursement anticipé possible au détriment du portage futur", level: c.callable ? "Modéré" : "Faible" },
        ...commonRisks,
      ],
    },
  };

  return configs[family] || configs.phoenix;
}

function generatePitchDeck(payload) {
  const p = payload || getPitchInput();
  if (!p) return null;
  const cfg = pitchFamilyConfig(p);
  const volTag = /volatil/i.test(p.context)
    ? "volatilité implicite élevée"
    : "régime de volatilité normalisé";
  const divTag = /dividend|dividende/i.test(p.context)
    ? "dividendes soutenus"
    : "carry modéré";
  const corrTag = /corr[eé]lation/i.test(p.context)
    ? "corrélations exploitées"
    : "corrélations surveillées";
  return {
    tagline: cfg.tagline,
    subtitle: `${cfg.familyLabel} | ${cfg.subtitle}`,
    executiveSummary: cfg.summary,
    keyMetrics: cfg.metrics,
    productTerms: pitchTermCards(p),
    educationPoints: pitchEducationPoints(p),
    productDescription: cfg.description,
    howItWorks: cfg.howItWorks,
    scenarios: cfg.scenarios,
    risks: cfg.risks,
    whyNow: [
      `Fenêtre de structuration favorable: ${volTag}`,
      `Profil de marché cohérent avec ${divTag} et ${corrTag}`,
      `Alignement fort avec l’objectif client: ${p.objective || "rendement récurrent avec protection partielle"}`,
    ],
    ctaTitle: `Valider le ${cfg.familyLabel}`,
    ctaBody: "Confirmer les paramètres structurants avant émission et documentation client.",
    disclaimer:
      "Document à caractère indicatif. Ne constitue pas un conseil en investissement.",
  };
}

function renderPitchPreview(deck) {
  const el = document.getElementById("ap-preview");
  const raw = document.getElementById("ap-raw");
  if (raw)
    raw.textContent = deck
      ? JSON.stringify(deck, null, 2)
      : "En attente de génération...";
  if (!el) return;
  if (!deck) {
    el.className = "pitch-preview-empty";
    el.textContent = "Générez un pitch pour afficher le deck.";
    return;
  }
  const p = getPitchInput() || {};
  const familyLabel =
    globalThis.StructuraDomain?.PRODUCT_FAMILIES?.[p.productFamily]?.label ||
    p.type ||
    "Produit structuré";

  // ── Slide 1 — Couverture
  const slide1 = `
  <div class="pitch-card pitch-card-cover">
    <div class="pitch-cover-top">
      <div class="pitch-cover-kicker">${escapeHtml(familyLabel.toUpperCase())} · ${isoDate(new Date())}</div>
      <div class="pitch-cover-title">${escapeHtml(deck.tagline)}</div>
      <div class="pitch-cover-sub">${escapeHtml(deck.subtitle)}</div>
    </div>
    <div class="pitch-cover-keyline">
      <div class="pitch-keyline-item">
        <div class="pitch-keyline-val" style="color:var(--gold)">${escapeHtml(String(p.coupon || 0))}%</div>
        <div class="pitch-keyline-lbl">Coupon annuel</div>
      </div>
      <div class="pitch-keyline-sep"></div>
      <div class="pitch-keyline-item">
        <div class="pitch-keyline-val" style="color:var(--orange)">${escapeHtml(String(p.barrier || 0))}%</div>
        <div class="pitch-keyline-lbl">Protection capital</div>
      </div>
      <div class="pitch-keyline-sep"></div>
      <div class="pitch-keyline-item">
        <div class="pitch-keyline-val" style="color:var(--cyan)">${escapeHtml(String(p.recall || 100))}%</div>
        <div class="pitch-keyline-lbl">Seuil de rappel</div>
      </div>
      <div class="pitch-keyline-sep"></div>
      <div class="pitch-keyline-item">
        <div class="pitch-keyline-val">${escapeHtml(p.duration || "—")}</div>
        <div class="pitch-keyline-lbl">Durée max.</div>
      </div>
    </div>
    <div class="pitch-cover-infos">
      <div class="pitch-cover-info"><span>Client</span>${escapeHtml(p.client || "—")}</div>
      <div class="pitch-cover-info"><span>Sous-jacent</span>${escapeHtml(p.underlying || "—")}</div>
      <div class="pitch-cover-info"><span>Émetteur</span>${escapeHtml(p.issuer || "—")}</div>
      <div class="pitch-cover-info"><span>Notation</span>${escapeHtml(p.rating || "—")}</div>
    </div>
  </div>`;

  // ── Slide 2 — Métriques clés
  const metrics = (deck.keyMetrics || [])
    .map(
      (m) => `
    <div class="pitch-kpi-box">
      <div class="pitch-kpi-val">${escapeHtml(m.value)}</div>
      <div class="pitch-kpi-lbl">${escapeHtml(m.label)}</div>
      <div class="pitch-kpi-sub">${escapeHtml(m.sub)}</div>
    </div>`,
    )
    .join("");
  const terms = (deck.productTerms || [])
    .map(
      (m) => `
    <div class="pitch-term">
      <div class="pitch-term-lbl">${escapeHtml(m.label)}</div>
      <div class="pitch-term-val">${escapeHtml(String(m.value || "—"))}</div>
      <div class="pitch-term-note">${escapeHtml(m.note || "")}</div>
    </div>`,
    )
    .join("");
  const slide2 = `
    <div class="pitch-card">
      <div class="pitch-card-label">Paramètres clés</div>
      <div class="pitch-card-title">${escapeHtml(deck.executiveSummary?.slice(0, 120) || "Synthèse")}…</div>
      <div class="pitch-kpi-grid">${metrics}</div>
      <div class="pitch-term-grid">${terms}</div>
    </div>`;

  // ── Slide 3 — Mécanique
  const bullets = (deck.howItWorks || [])
    .map((b, i) => {
      const colors = [
        "var(--gold)",
        "var(--cyan)",
        "var(--orange)",
        "var(--green)",
      ];
      return `<div class="pitch-bullet"><div class="pitch-bullet-dot" style="background:${colors[i % 4]}"></div><div>${escapeHtml(b)}</div></div>`;
    })
    .join("");
  const slide3 = `
    <div class="pitch-card">
      <div class="pitch-card-label">Fonctionnement</div>
      <div class="pitch-card-title">Mécanique ${escapeHtml(familyLabel)} sur ${escapeHtml(p.underlying || "—")}</div>
      <div class="pitch-mechanic-desc">${escapeHtml(deck.productDescription || "")}</div>
      <div class="pitch-bullets">${bullets}</div>
    </div>`;

  // ── Slide 4 — Scénarios
  const s = deck.scenarios || {};
  // Helper : extraction numérique depuis returnStr
  const _numFromStr = (str) =>
    parseFloat(
      String(str || "0")
        .replace("%", "")
        .replace("+", ""),
    ) || 0;
  const maxScen = Math.max(
    _numFromStr(s.bull?.returnStr),
    _numFromStr(s.base?.returnStr),
    Math.abs(_numFromStr(s.bear?.returnStr)),
    1,
  );
  const scenBar = (returnStr, color) => {
    const pct = Math.min(
      100,
      Math.max(5, (_numFromStr(returnStr) / maxScen) * 100),
    );
    return `<div style="height:4px;background:var(--border);border-radius:2px;margin-top:4px;"><div style="height:4px;width:${pct}%;background:${color};border-radius:2px;"></div></div>`;
  };
  const slide4 = `
  <div class="pitch-card">
    <div class="pitch-card-label">Analyse de sensibilité</div>
    <div class="pitch-card-title">Performance selon le scénario de marché</div>
    <div class="pitch-scenarios">
      <div class="pitch-scen pitch-scen-bull">
        <div class="pitch-scen-lbl">▲ ${escapeHtml(s.bull?.label || "Haussier")}</div>
        <div class="pitch-scen-ret">${escapeHtml(s.bull?.returnStr || "—")}</div>
        ${scenBar(s.bull?.returnStr, "var(--green)")}
        <div class="pitch-scen-desc" style="margin-top:8px;">${escapeHtml(s.bull?.desc || "")}</div>
      </div>
      <div class="pitch-scen pitch-scen-base">
        <div class="pitch-scen-lbl">◉ ${escapeHtml(s.base?.label || "Central")}</div>
        <div class="pitch-scen-ret">${escapeHtml(s.base?.returnStr || "—")}</div>
        ${scenBar(s.base?.returnStr, "var(--cyan)")}
        <div class="pitch-scen-desc" style="margin-top:8px;">${escapeHtml(s.base?.desc || "")}</div>
      </div>
      <div class="pitch-scen pitch-scen-bear">
        <div class="pitch-scen-lbl">▼ ${escapeHtml(s.bear?.label || "Baissier")}</div>
        <div class="pitch-scen-ret">${escapeHtml(s.bear?.returnStr || "—")}</div>
        ${scenBar(s.bear?.returnStr, "var(--red)")}
        <div class="pitch-scen-desc" style="margin-top:8px;">${escapeHtml(s.bear?.desc || "")}</div>
      </div>
    </div>
    <div style="margin-top:14px;padding-top:10px;border-top:1px solid var(--border);font-size:10px;color:var(--text3);">
      Scénarios indicatifs. Performances passées non indicatives des performances futures. Capital non garanti en cas de rupture de barrière.
    </div>
  </div>`;

  // ── Slide 5 — Risques + Pourquoi maintenant
  const risks = (deck.risks || [])
    .map((r) => {
      const col =
        r.level === "Élevé"
          ? "var(--red)"
          : r.level === "Faible"
            ? "var(--green)"
            : "var(--gold)";
      return `<div class="pitch-risk-row">
      <div class="pitch-risk-dot" style="background:${col}"></div>
      <div class="pitch-risk-body">
        <div class="pitch-risk-name">${escapeHtml(r.risk)}</div>
        <div class="pitch-risk-desc">${escapeHtml(r.desc)}</div>
      </div>
      <div class="pitch-risk-lvl" style="color:${col}">${escapeHtml(r.level)}</div>
    </div>`;
    })
    .join("");
  const whyRows = (deck.whyNow || [])
    .map((w) => `<div class="pitch-why-row">→ ${escapeHtml(w)}</div>`)
    .join("");
  const educationRows = (deck.educationPoints || [])
    .map((w) => `<div class="pitch-watch-row">${escapeHtml(w)}</div>`)
    .join("");
  const slide5 = `
    <div class="pitch-card">
      <div class="pitch-card-label">Risques &amp; Opportunité</div>
      <div class="pitch-risks-section">
        <div class="pitch-risks-title">Risques principaux</div>
        <div class="pitch-risks">${risks}</div>
      </div>
      <div class="pitch-why-section">
        <div class="pitch-risks-title">Pourquoi maintenant</div>
        ${whyRows}
      </div>
      <div class="pitch-watch-section">
        <div class="pitch-risks-title">Points à expliquer au client</div>
        ${educationRows}
      </div>
    </div>`;

  // ── Slide 6 — CTA
  const slide6 = `
    <div class="pitch-card pitch-card-cta">
      <div class="pitch-cta-title">${escapeHtml(deck.ctaTitle || "Valider")}</div>
      <div class="pitch-cta-body">${escapeHtml(deck.ctaBody || "")}</div>
      <div class="pitch-disclaimer">${escapeHtml(deck.disclaimer || "")}</div>
    </div>`;

  el.className = "deck-preview-v2";
  el.innerHTML = `
    <div class="pitch-label-row">SLIDE 1 — COUVERTURE</div>${slide1}
    <div class="pitch-label-row">SLIDE 2 — PARAMÈTRES</div>${slide2}
    <div class="pitch-label-row">SLIDE 3 — MÉCANIQUE</div>${slide3}
    <div class="pitch-label-row">SLIDE 4 — SCÉNARIOS</div>${slide4}
    <div class="pitch-label-row">SLIDE 5 — RISQUES</div>${slide5}
    <div class="pitch-label-row">SLIDE 6 — CONCLUSION</div>${slide6}
  `;
}

function generatePitchLocal() {
  const p = getPitchInput();
  if (!p) {
    notify("Module Pitch Engine indisponible", "err");
    return;
  }
  setPitchLoading(true);
  generatedPitch = generatePitchDeck(p);
  APP_RUNTIME.generatedPitch = generatedPitch;
  renderPitchPreview(generatedPitch);
  switchPitchTab("slides");
  setPitchLoading(false);
  notify("Pitch expert généré", "ok");
}

function downloadPitchPPTX() {
  if (!generatedPitch) {
    notify("Générez d’abord un pitch", "err");
    return;
  }
  if (typeof PptxGenJS === "undefined") {
    notify("Librairie PPTX non chargée", "err");
    return;
  }
  const p = getPitchInput();
  const familyLabel =
    globalThis.StructuraDomain?.PRODUCT_FAMILIES?.[p.productFamily]?.label ||
    p.type ||
    "Produit structuré";
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";
  pptx.author = "Structura Pro";
  const slides = [
    { t: generatedPitch.tagline, b: generatedPitch.subtitle },
    { t: "Executive Summary", b: generatedPitch.executiveSummary },
    {
      t: "Paramètres Produit",
      b: (generatedPitch.productTerms || [])
        .map((x) => `• ${x.label}: ${x.value}${x.note ? ` (${x.note})` : ""}`)
        .join("\n"),
    },
    {
      t: "Mécanique Produit",
      b: (generatedPitch.howItWorks || []).map((x) => `• ${x}`).join("\n"),
    },
    {
      t: "Scénarios",
      b: `${generatedPitch.scenarios?.bull?.label}: ${generatedPitch.scenarios?.bull?.returnStr}\n${generatedPitch.scenarios?.base?.label}: ${generatedPitch.scenarios?.base?.returnStr}\n${generatedPitch.scenarios?.bear?.label}: ${generatedPitch.scenarios?.bear?.returnStr}`,
    },
    {
      t: "Risques",
      b: (generatedPitch.risks || [])
        .map((r) => `• ${r.risk} (${r.level}) - ${r.desc}`)
        .join("\n"),
    },
    {
      t: "Pourquoi Maintenant",
      b: (generatedPitch.whyNow || []).map((x) => `• ${x}`).join("\n"),
    },
    {
      t: "Points à Expliquer",
      b: (generatedPitch.educationPoints || []).map((x) => `• ${x}`).join("\n"),
    },
    { t: generatedPitch.ctaTitle, b: generatedPitch.ctaBody },
    { t: "Disclaimer", b: generatedPitch.disclaimer },
  ];
  slides.forEach((s, i) => {
    const sl = pptx.addSlide();
    sl.background = { color: i === 0 ? "FBF5ED" : "FFF9F2" };
    sl.addShape(pptx.ShapeType.rect, {
      x: 0,
      y: 0,
      w: 13.333,
      h: 0.55,
      fill: { color: "E8EEF0" },
      line: { color: "E8EEF0" },
    });
    sl.addText("STRUCTURA PRO", {
      x: 0.45,
      y: 0.12,
      w: 4,
      h: 0.3,
      fontSize: 11,
      bold: true,
      color: "C9984D",
    });
    sl.addText(`${p.client} | ${p.underlying}`, {
      x: 9.1,
      y: 0.13,
      w: 4,
      h: 0.3,
      fontSize: 9,
      color: "8D7A69",
      align: "right",
    });
    sl.addText(s.t, {
      x: 0.7,
      y: 0.95,
      w: 12,
      h: 0.75,
      fontSize: 26,
      bold: true,
      color: "22313B",
    });
    sl.addShape(pptx.ShapeType.line, {
      x: 0.7,
      y: 1.75,
      w: 4.6,
      h: 0,
      line: { color: "378FA1", pt: 1.6 },
    });
    sl.addText(s.b, {
      x: 0.7,
      y: 2.0,
      w: 12,
      h: 4.6,
      fontSize: 13,
      color: "556674",
      breakLine: true,
    });
    sl.addText(`${familyLabel} | ${isoDate(new Date())}`, {
      x: 0.7,
      y: 6.95,
      w: 12,
      h: 0.3,
      fontSize: 9,
      color: "9A836D",
    });
  });
  pptx.writeFile({
    fileName: `pitch_${p.underlying.replace(/\s+/g, "_")}_${isoDate(new Date())}.pptx`,
  });
}

function downloadPitchPDF() {
  if (!generatedPitch) {
    notify("Générez d’abord un pitch", "err");
    return;
  }
  if (!window.jspdf || !window.jspdf.jsPDF) {
    notify("Librairie PDF non chargée", "err");
    return;
  }
  const p = getPitchInput();
  const familyLabel =
    globalThis.StructuraDomain?.PRODUCT_FAMILIES?.[p.productFamily]?.label ||
    p.type ||
    "Produit structuré";
  const doc = new window.jspdf.jsPDF({ unit: "pt", format: "a4" });
  const pages = [
    { t: generatedPitch.tagline, b: generatedPitch.subtitle },
    { t: "Executive Summary", b: generatedPitch.executiveSummary },
    {
      t: "Paramètres Produit",
      b: (generatedPitch.productTerms || [])
        .map((x) => `• ${x.label}: ${x.value}${x.note ? ` (${x.note})` : ""}`)
        .join("\n"),
    },
    {
      t: "Mécanique Produit",
      b: (generatedPitch.howItWorks || []).map((x) => `• ${x}`).join("\n"),
    },
    {
      t: "Scénarios",
      b: `${generatedPitch.scenarios?.bull?.label}: ${generatedPitch.scenarios?.bull?.returnStr}\n${generatedPitch.scenarios?.base?.label}: ${generatedPitch.scenarios?.base?.returnStr}\n${generatedPitch.scenarios?.bear?.label}: ${generatedPitch.scenarios?.bear?.returnStr}`,
    },
    {
      t: "Risques",
      b: (generatedPitch.risks || [])
        .map((r) => `• ${r.risk} (${r.level}) - ${r.desc}`)
        .join("\n"),
    },
    {
      t: "Points à Expliquer",
      b: (generatedPitch.educationPoints || []).map((x) => `• ${x}`).join("\n"),
    },
    {
      t: generatedPitch.ctaTitle,
      b: generatedPitch.ctaBody + "\n\n" + generatedPitch.disclaimer,
    },
  ];
  pages.forEach((pg, i) => {
    if (i > 0) doc.addPage();
    doc.setFillColor(255, 249, 242);
    doc.rect(0, 0, 595, 842, "F");
    doc.setFillColor(232, 238, 240);
    doc.rect(0, 0, 595, 34, "F");
    doc.setTextColor(201, 152, 77);
    doc.setFontSize(11);
    doc.text("STRUCTURA PRO", 24, 22);
    doc.setTextColor(154, 131, 109);
    doc.setFontSize(9);
    doc.text(`${p.client} | ${p.underlying}`, 575, 22, { align: "right" });
    doc.setTextColor(34, 49, 59);
    doc.setFontSize(26);
    doc.text(pg.t, 36, 92, { maxWidth: 520 });
    doc.setDrawColor(55, 143, 161);
    doc.line(36, 102, 170, 102);
    doc.setTextColor(85, 102, 116);
    doc.setFontSize(12);
    doc.text(pg.b, 36, 130, { maxWidth: 520 });
    doc.setTextColor(154, 131, 109);
    doc.setFontSize(9);
    doc.text(`${familyLabel} | ${isoDate(new Date())}`, 36, 816);
  });
  doc.save(
    `pitch_${p.underlying.replace(/\s+/g, "_")}_${isoDate(new Date())}.pdf`,
  );
}

function getTypeCode(typeText) {
  const t = (typeText || "").toUpperCase();
  if (t.includes("CAPITAL GARANTI") || t.includes("PROTÉG")) return "CG";
  if (t.includes("REVERSE")) return "RC";
  if (t.includes("LEVIER") || t.includes("LEVERAGE")) return "LV";
  return "AC";
}

function isinCheckDigitValid(isin) {
  const s = (isin || "").toUpperCase();
  if (!/^[A-Z]{2}[A-Z0-9]{9}[0-9]$/.test(s)) return false;
  const expanded = s
    .slice(0, -1)
    .split("")
    .map((ch) => {
      if (/[A-Z]/.test(ch)) return String(ch.charCodeAt(0) - 55);
      return ch;
    })
    .join("");
  const digits = (expanded + s.slice(-1)).split("").map(Number);
  let sum = 0;
  let dbl = true;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = digits[i];
    if (dbl) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    dbl = !dbl;
  }
  return sum % 10 === 0;
}

function inferDocType(fileName, text) {
  const n = (fileName || "").toLowerCase();
  const t = (text || "").toLowerCase();
  if (
    n.includes("kid") ||
    n.includes("dici") ||
    STRUCTURED_PRODUCT_SPEC.documentMarkers.KID.some((re) => re.test(t))
  )
    return "KID";
  if (
    n.includes("term") ||
    n.includes("sheet") ||
    STRUCTURED_PRODUCT_SPEC.documentMarkers.TERM_SHEET.some((re) => re.test(t))
  )
    return "TERM_SHEET";
  if (
    n.includes("brochure") ||
    STRUCTURED_PRODUCT_SPEC.documentMarkers.BROCHURE.some((re) => re.test(t))
  )
    return "BROCHURE";
  return "UNKNOWN";
}

function templateIssuerHints(template) {
  const map = {
    bnp: /BNP Paribas/i,
    sg: /Soci[ée]t[ée] G[ée]n[ée]rale/i,
    ms: /Morgan Stanley/i,
    gs: /Goldman Sachs/i,
  };
  return map[template] || null;
}

const EXTERNAL_ISSUER_REGISTRY =
  typeof globalThis !== "undefined" && globalThis.STRUCTURA_ISSUER_REGISTRY
    ? globalThis.STRUCTURA_ISSUER_REGISTRY
    : { issuers: [] };

function getExternalRegistryIssuers() {
  return Array.isArray(EXTERNAL_ISSUER_REGISTRY?.issuers)
    ? EXTERNAL_ISSUER_REGISTRY.issuers
    : [];
}

function mergeIssuerRegistry(defaultIssuers) {
  const merged = new Map();
  const upsert = (issuer) => {
    if (!issuer || (!issuer.id && !issuer.label)) return;
    const key = issuer.id || issuer.label;
    const previous = merged.get(key);
    if (!previous) {
      merged.set(key, {
        ...issuer,
        aliases: [...(issuer.aliases || [])],
        officialSources: [...(issuer.officialSources || [])],
        fieldExtractors: { ...(issuer.fieldExtractors || {}) },
      });
      return;
    }
    previous.aliases = [
      ...new Set([...(previous.aliases || []), ...(issuer.aliases || [])]),
    ];
    previous.officialSources = [
      ...new Map(
        [
          ...(previous.officialSources || []),
          ...(issuer.officialSources || []),
        ].map((entry) => [entry.url || `${entry.kind}-${entry.label}`, entry]),
      ).values(),
    ];
    const nextExtractors = { ...(previous.fieldExtractors || {}) };
    for (const [field, patterns] of Object.entries(
      issuer.fieldExtractors || {},
    )) {
      nextExtractors[field] = [
        ...(nextExtractors[field] || []),
        ...(patterns || []),
      ];
    }
    previous.fieldExtractors = nextExtractors;
    if (!previous.publicSourceStatus && issuer.publicSourceStatus)
      previous.publicSourceStatus = issuer.publicSourceStatus;
  };
  (defaultIssuers || []).forEach(upsert);
  getExternalRegistryIssuers().forEach(upsert);
  return [...merged.values()];
}

function findRegistryIssuerEntry(input) {
  const src = String(input || "");
  if (!src) return null;
  return (
    STRUCTURED_PRODUCT_SPEC.issuers.find((issuer) => {
      if (issuer.label === src || issuer.id === src) return true;
      return (issuer.aliases || []).some((re) => re.test(src));
    }) || null
  );
}

function pickWithPatterns(text, patterns = []) {
  const src = String(text || "");
  for (const re of patterns) {
    const match = src.match(re);
    if (match?.[1]) return match[1].trim();
  }
  return "";
}

function numericLike(value) {
  const cleaned = String(value || "")
    .replace(",", ".")
    .replace(/[^\d.-]/g, "");
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function extractIssuerSpecificSnapshot(text, issuerEntry) {
  if (!issuerEntry?.fieldExtractors) {
    return {
      underlying: null,
      type: "",
      couponPct: null,
      barrierPct: null,
      recallPct: null,
      maturityDate: null,
      nominal: null,
    };
  }
  const raw = String(text || "");
  const extractors = issuerEntry.fieldExtractors;
  return {
    underlying: cleanUnderlyingCandidate(
      pickWithPatterns(raw, extractors.underlying || []),
    ),
    type: pickWithPatterns(raw, extractors.type || []),
    couponPct: numericLike(pickWithPatterns(raw, extractors.coupon || [])),
    barrierPct: numericLike(pickWithPatterns(raw, extractors.barrier || [])),
    recallPct: numericLike(pickWithPatterns(raw, extractors.recall || [])),
    maturityDate: StructuraCleaner.cleanDate(
      pickWithPatterns(raw, extractors.maturity || []),
    ),
    nominal: StructuraCleaner.cleanNominal(
      pickWithPatterns(raw, extractors.nominal || []),
    ),
  };
}

const STRUCTURED_PRODUCT_SPEC = {
  issuers: mergeIssuerRegistry([
    {
      id: "BNP",
      label: "BNP Paribas",
      aliases: [/BNP(?:\s+Paribas)?/i, /BNP\s+Paribas\s+Issuance(?:\s+B\.?V\.?)?/i],
    },
    {
      id: "SG",
      label: "Société Générale",
      aliases: [
        /Soci[ée]t[ée]\s+G[ée]n[ée]rale/i,
        /SG\s+Issuer/i,
        /SG\s+Effekten\s+GmbH/i,
        /\bSG\b(?!\s*Private Banking)/i,
      ],
    },
    { id: "MS", label: "Morgan Stanley", aliases: [/Morgan\s+Stanley/i] },
    {
      id: "GS",
      label: "Goldman Sachs",
      aliases: [/Goldman\s+Sachs/i, /\bGS\s+Finance\b/i, /Goldman\s+Sachs\s+(?:Finance\s+Corp|Group\s+Inc|International)/i],
    },
    {
      id: "JPM",
      label: "JP Morgan",
      aliases: [/JP\s*Morgan/i, /JPMorgan/i, /J\.P\.\s*Morgan/i, /JP\s+Morgan\s+Structured\s+Products\s+B\.?V\.?/i, /Chase\s+Financial\s+Co/i],
    },
    { id: "DB", label: "Deutsche Bank", aliases: [/Deutsche\s+Bank(?:\s+AG)?/i] },
    { id: "BARC", label: "Barclays", aliases: [/Barclays(?:\s+Bank\s+PLC)?/i] },
    { id: "BBVA", label: "BBVA", aliases: [/\bBBVA\b/i] },
    { id: "CIBC", label: "CIBC", aliases: [/\bCIBC\b/i] },
    { id: "CIC", label: "CIC", aliases: [/Cr[ée]dit\s+Industriel\s+et\s+Commercial/i, /\bCIC\b/i] },
    {
      id: "CMA",
      label: "Crédit Mutuel Arkéa",
      aliases: [/Cr[ée]dit\s+Mutuel\s+Ark[ée]a/i, /Credit\s+Mutuel\s+Arkea/i],
    },
    { id: "HSBC", label: "HSBC", aliases: [/HSBC(?:\s+Bank\s+PLC)?/i] },
    { id: "NATIXIS", label: "Natixis", aliases: [/Natixis/i] },
    {
      id: "CACIB",
      label: "Crédit Agricole CIB",
      aliases: [
        /Cr[ée]dit\s+Agricole\s+CIB/i,
        /Credit\s+Agricole\s+CIB/i,
        /Cr[ée]dit\s+Agricole\s+Financial\s+Solutions/i,
        /Credit\s+Agricole\s+Financial\s+Solutions/i,
      ],
    },
    {
      id: "CITI",
      label: "Citigroup",
      aliases: [/Citigroup/i, /\bCiti\b/i, /Citigroup\s+Global\s+Markets\s+Funding\s+Lux/i, /Citigroup\s+Global\s+Markets\s+Holdings/i],
    },
    { id: "UBS", label: "UBS", aliases: [/\bUBS(?:\s+AG)?\b/i] },
    { id: "UNICREDIT", label: "UniCredit", aliases: [/UniCredit/i] },
    { id: "COMMERZ", label: "Commerzbank", aliases: [/Commerzbank/i] },
    {
      id: "BOFA",
      label: "Bank of America",
      aliases: [/Bank\s+of\s+America/i, /BofA\s+Finance\s+LLC/i, /\bBAC\b/i, /Merrill\s+Lynch/i],
    },
    { id: "NOMURA", label: "Nomura", aliases: [/Nomura(?:\s+International\s+plc)?/i] },
    { id: "VONTOBEL", label: "Vontobel", aliases: [/Vontobel/i] },
    { id: "LEONTEQ", label: "Leonteq", aliases: [/Leonteq/i] },
  ]),
  productFamilies: [
    {
      id: "BEARISH_TAUX",
      label: "Bearish Taux",
      aliases: [/bearish\s+taux/i, /structure inverse[^.]{0,80}taux/i],
    },
    {
      id: "CLN",
      label: "CLN",
      aliases: [/credit\s+linked\s+note/i, /\bCLN\b/i, /[ée]v[ée]nement de cr[ée]dit/i],
    },
    {
      id: "NOTE_TAUX",
      label: "Note taux fixe/variable",
      aliases: [/note\s+(?:à|a)\s+taux\s+(?:fixe|variable)/i, /coupon variable[^.]{0,80}(?:euribor|cms|sofr|estr|€str)/i],
    },
    {
      id: "AUTOCALL",
      label: "Autocall",
      aliases: [
        /\bautocall\b/i,
        /rappel automatique/i,
        /\bexpress certificate\b/i,
        /\bathena\b/i,
        /\bathina\b/i,
        /\bsnowball\b/i,
        /callable step-?up/i,
        /callable step-?down/i,
      ],
    },
    {
      id: "PHOENIX",
      label: "Phoenix",
      aliases: [
        /\bphoenix\b/i,
        /coupon m[ée]moire/i,
        /memory coupon/i,
        /effet m[ée]moire/i,
        /conditional coupon/i,
      ],
    },
    {
      id: "REVERSE_CONVERTIBLE",
      label: "Reverse Convertible",
      aliases: [
        /\breverse convertible\b/i,
        /\bbarrier reverse convertible\b/i,
        /\bcallable reverse convertible\b/i,
        /\bbrc\b/i,
        /\byield note\b/i,
      ],
    },
    {
      id: "CAPITAL_GARANTI",
      label: "Capital Garanti",
      aliases: [
        /\bcapital garanti\b/i,
        /\bcapital protected\b/i,
        /\b100%\s+capital protected\b/i,
        /\bprotection du capital\b/i,
        /\bcapital protection note\b/i,
        /\bcapped capital protection note\b/i,
        /\bparticipation note\b/i,
      ],
    },
    {
      id: "LEVERAGE",
      label: "Levier",
      aliases: [
        /\blevier\b/i,
        /\bleverage\b/i,
        /\bturbo\b/i,
        /\bfactor certificate\b/i,
        /\bwarrant\b/i,
        /\bsprinter\b/i,
        /\bmini future\b/i,
        /\bknock-?out\b/i,
      ],
    },
    {
      id: "BONUS",
      label: "Bonus Certificate",
      aliases: [/\bbonus cap\b/i, /\bbonus certificate\b/i],
    },
    {
      id: "DISCOUNT",
      label: "Discount Certificate",
      aliases: [/\bdiscount certificate\b/i, /\bcertificat discount\b/i],
    },
    {
      id: "OUTPERFORMANCE",
      label: "Outperformance",
      aliases: [/\boutperformance\b/i, /\bsurperformance\b/i],
    },
    {
      id: "AIRBAG",
      label: "Airbag",
      aliases: [/\bairbag\b/i, /\brecovery note\b/i],
    },
    { id: "TWIN_WIN", label: "Twin Win", aliases: [/\btwin win\b/i] },
    {
      id: "TRACKER",
      label: "Tracker Certificate",
      aliases: [/\btracker certificate\b/i, /\bstrategic certificate\b/i],
    },
  ],
  documentMarkers: {
    KID: [
      /key information document/i,
      /document d['’]informations? cl[ée]s/i,
      /\bdici\b/i,
      /\bkid\b/i,
    ],
    TERM_SHEET: [
      /final terms?/i,
      /termsheet/i,
      /term sheet/i,
      /pricing supplement/i,
      /indicative terms?/i,
    ],
    BROCHURE: [
      /brochure/i,
      /marketing communication/i,
      /document commercial/i,
      /fiche produit/i,
      /communication a caractere promotionnel/i,
    ],
  },
  underlyingMarkers: [
    /(?:sous[-\s]?jacent(?:\(s\))?|underlying(?: asset| reference)?|reference asset|reference share|reference assets?|indice(?: de r[ée]f[ée]rence)?|index(?: level)?|panier|basket|least performing underlier|worst performing underlier)\s*[:\-]?\s*([^\n\r.;|]{2,180})/i,
    /(?:autocall|phoenix|reverse convertible|capital garanti|bonus cap|discount certificate|turbo|warrant|airbag|barrier note|yield note|capital protected note)\s+(?:sur|on)?\s*([A-Z][A-Za-z0-9&'’ .\-\/]{2,140})/i,
  ],
  namedUnderlyings: [
    /CAC ?40/i,
    /EURO STOXX ?50/i,
    /S&P ?500/i,
    /DAX ?40/i,
    /Nikkei ?225/i,
    /FTSE ?100/i,
    /SMI/i,
    /IBEX ?35/i,
    /Nasdaq(?:-?100)?/i,
    /STOXX Europe 600/i,
    /Russell 2000/i,
    /Dow Jones/i,
    /LVMH/i,
    /Airbus/i,
    /NVIDIA/i,
    /Apple/i,
    /Microsoft/i,
    /Alphabet/i,
    /Amazon/i,
    /Tesla/i,
    /TotalEnergies/i,
    /BNP Paribas/i,
    /Sanofi/i,
    /ASML/i,
    /SAP/i,
    /Herm[eè]s/i,
    /Axa/i,
    /Stellantis/i,
    /Schneider Electric/i,
  ],
};

function findSpecIssuer(text) {
  const src = String(text || "");
  for (const issuer of STRUCTURED_PRODUCT_SPEC.issuers) {
    if (issuer.aliases.some((re) => re.test(src))) return issuer.label;
  }
  return "";
}

function canonicalizeIssuerLabel(value) {
  const src = String(value || "");
  if (!src) return "";
  return findSpecIssuer(src) || src.trim();
}

function findSpecProductFamily(text) {
  const src = String(text || "");
  for (const family of STRUCTURED_PRODUCT_SPEC.productFamilies) {
    if (family.aliases.some((re) => re.test(src))) return family.label;
  }
  return "";
}

function collectSpecSignals(text) {
  const src = String(text || "");
  const issuers = STRUCTURED_PRODUCT_SPEC.issuers
    .filter((issuer) => issuer.aliases.some((re) => re.test(src)))
    .map((issuer) => issuer.label);
  const families = STRUCTURED_PRODUCT_SPEC.productFamilies
    .filter((family) => family.aliases.some((re) => re.test(src)))
    .map((family) => family.label);
  const docs = Object.entries(STRUCTURED_PRODUCT_SPEC.documentMarkers)
    .filter(([, markers]) => markers.some((re) => re.test(src)))
    .map(([id]) => id);
  return { issuers, families, docs };
}

function extractUnderlyingFromSpec(text) {
  const src = String(text || "");
  for (const re of STRUCTURED_PRODUCT_SPEC.underlyingMarkers) {
    const m = src.match(re);
    if (m?.[1]) {
      const cleaned = cleanUnderlyingCandidate(m[1]);
      if (cleaned) return cleaned;
    }
  }
  for (const re of STRUCTURED_PRODUCT_SPEC.namedUnderlyings) {
    const m = src.match(re);
    if (m?.[0]) {
      const cleaned = cleanUnderlyingCandidate(m[0]);
      if (cleaned) return cleaned;
    }
  }
  return null;
}

const ProExtractionEngine = {
  patterns: {
    isin: /(?:ISIN|Code ISIN)\s*:?\s*([A-Z0-9]{12})/i,
    underlying:
      /(?:Indice|Sous-jacent|Underlying|Reference Asset|Reference Share)\s*:?\s*([^.\n|]+)/i,
    emetteur:
      /(?:Emetteur|Émetteur|Garant|Issuer)\s*:?\s*(Morgan Stanley|BNP(?:\sParibas)?|Société Générale|Goldman Sachs|JP Morgan|Barclays|HSBC|Deutsche Bank|UBS|Citigroup|Citi|UniCredit|Commerzbank|Natixis|Crédit Agricole CIB|Credit Agricole CIB|Bank of America|Merrill Lynch|Leonteq|Vontobel)/i,
    coupon_daily: /(\d+[,.]\d{3,})\s*%\s*par\s*jour/i,
    coupon_annual_equiv: /soit\s*(\d+[,.]\d+)\s*%\s*par\s*an(?:n[ée]e)?/i,
    barrier_capital:
      /(?:Barri[èe]re de protection|Seuil de perte|Capital prot[ée]g[ée]).{0,60}?(\d{2,3}(?:[.,]\d+)?)\s*%/i,
    barrier_autocall:
      /(?:Seuil de remboursement anticip[ée]|Niveau de rappel|Autocall).{0,60}?(\d{2,3}(?:[.,]\d+)?)\s*%/i,
    strike_date:
      /(?:Date de fixation|Strike|Date d['’]observation initiale).{0,50}?(\d{2}\/\d{2}\/\d{4})/i,
    maturity_date:
      /(?:Date d['’]échéance|Maturit[ée] finale?|Maturity).{0,50}?(\d{2}\/\d{2}\/\d{4})/i,
    first_autocall_date:
      /(?:Premi[èe]re date de remboursement anticip[ée]|First autocall date).{0,60}?(\d{2}\/\d{2}\/\d{4})/i,
    decrement_value: /(\d+[,.]\d+)\s*points?\s*Decrement/i,
    frais_entree:
      /(?:Frais d['’]entr[ée]e|Commission de souscription|Subscription fee).{0,40}?(\d+[,.]\d+)\s*%/i,
  },

  extract(text) {
    const data = {};
    for (const key in this.patterns) {
      const match = text.match(this.patterns[key]);
      data[key] = match ? match[1].trim() : "Non trouvé";
    }
    if (
      data.strike_date !== "Non trouvé" &&
      data.maturity_date !== "Non trouvé"
    ) {
      data.duree_max_annees = this.calculateDuration(
        data.strike_date,
        data.maturity_date,
      );
    }
    return data;
  },

  calculateDuration(start, end) {
    const s = new Date(start.split("/").reverse().join("-"));
    const e = new Date(end.split("/").reverse().join("-"));
    if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return null;
    return Math.round((e - s) / (1000 * 60 * 60 * 24 * 365));
  },
};

const SmartFrequencyEngine = {
  detectAndNormalize(pctValue, contextLine) {
    const raw = Number(
      String(pctValue || "")
        .replace(",", ".")
        .replace(/[^\d.-]/g, ""),
    );
    if (!Number.isFinite(raw)) return null;
    const line = String(contextLine || "").toLowerCase();
    const byDay = /par jour|daily|quotidien|journalier/.test(line);
    const byWeek = /par semaine|weekly|hebdo/.test(line);
    const byMonth = /par mois|monthly|mensuel/.test(line);
    const byQuarter = /trimestriel|quarter/.test(line);
    const byHalf = /semestriel|semi-annual|semiannual/.test(line);
    const byYear = /par an|annuel|annual|p\.a\./.test(line);

    let period = "annual";
    let annualPct = raw;
    if (byDay) {
      period = "daily";
      annualPct = raw * 365;
    } else if (byWeek) {
      period = "weekly";
      annualPct = raw * 52;
    } else if (byMonth) {
      period = "monthly";
      annualPct = raw * 12;
    } else if (byQuarter) {
      period = "quarterly";
      annualPct = raw * 4;
    } else if (byHalf) {
      period = "semiannual";
      annualPct = raw * 2;
    } else if (byYear) {
      period = "annual";
      annualPct = raw;
    }

    return {
      rawPct: Number(raw.toFixed(4)),
      period,
      annualPct: Number(annualPct.toFixed(4)),
      display: `${raw}%/${period}`,
    };
  },
};

const AdvancedUniversalExtractor = {
  extract(text) {
    const lines = String(text || "").split("\n");
    const data = { features: [] };
    lines.forEach((line) => {
      if (/coupon|rendement|gain/i.test(line)) {
        const pct = line.match(/(\d+[,.]\d{2,4})\s*%/);
        if (pct) {
          const normalized = SmartFrequencyEngine.detectAndNormalize(
            pct[1],
            line,
          );
          if (normalized) data.coupon = normalized;
        }
      }
      if (/m[ée]moire|memory|rattrapage/i.test(line)) {
        data.hasMemory = true;
        if (!data.features.includes("Memory")) data.features.push("Memory");
      }
      if (/barri[èe]re/i.test(line) && /capital/i.test(line)) {
        const bar = line.match(/(\d{2,3}(?:[,.]\d+)?)\s*%/);
        if (bar) data.barrier = Number(String(bar[1]).replace(",", "."));
        data.barrierType =
          /quotidien|cl[ôo]ture|am[ée]ricaine|daily|american/i.test(line)
            ? "Américaine"
            : "Européenne";
      }
      if (/decrement|points/i.test(line)) {
        const deg = line.match(/(\d+[,.]\d+)\s*points/i);
        if (deg) data.decrement = Number(String(deg[1]).replace(",", "."));
      }
    });
    return data;
  },
};

const UniversalExtractionEngine = {
  dictionary: {
    barrier_cap: [
      "barrière de protection",
      "protection du capital",
      "seuil de perte",
      "seuil de remboursement final",
      "barrier level",
      "capital protection",
    ],
    barrier_coupon: [
      "seuil de versement",
      "barrière de coupon",
      "seuil de détachement",
      "coupon barrier",
    ],
    autocall_trigger: [
      "seuil de remboursement anticipé",
      "niveau de rappel",
      "early redemption level",
      "trigger level",
    ],
    memory_effect: [
      "effet mémoire",
      "coupon mémorisable",
      "memory effect",
      "rattrapage",
    ],
    decrement: [
      "decrement",
      "dividende synthétique",
      "dividende fixe",
      "points de dividende",
    ],
    daily_frequency: [
      "quotidien",
      "chaque jour",
      "daily",
      "calendrier",
      "per day",
    ],
    coupon: ["coupon", "rendement", "gain", "yield", "taux"],
  },

  extractFeature(text, concept) {
    const lines = String(text || "").split("\n");
    const keywords = this.dictionary[concept] || [];
    for (let i = 0; i < lines.length; i++) {
      const line = String(lines[i] || "").toLowerCase();
      if (keywords.some((kw) => line.includes(kw))) {
        const context = `${line} ${(lines[i + 1] || "").toLowerCase()}`;
        if (concept === "decrement") {
          const pt = context.match(/(\d{1,3}(?:[.,]\d{1,4})?)\s*points?/i);
          if (pt) return pt[1].replace(",", ".");
        }
        const pct = context.match(/(\d{1,3}(?:[.,]\d{1,4})?)\s*%/);
        if (pct) return pct[1].replace(",", ".");
      }
    }
    return null;
  },

  analyzeStructure(text, rawCouponValue) {
    const src = String(text || "").toLowerCase();
    const isDaily = this.dictionary.daily_frequency.some((kw) =>
      src.includes(kw),
    );
    const val = parseFloat(rawCouponValue);
    if (!Number.isFinite(val)) return null;
    if (isDaily && val < 0.2) {
      return {
        type: "Daily",
        annualRate: Number((val * 365).toFixed(2)),
        raw: val,
      };
    }
    return { type: "Annual", annualRate: Number(val.toFixed(2)), raw: val };
  },

  process(text) {
    const cleaned = String(text || "");
    const isinCandidate =
      cleaned.match(/[A-Z]{2}[A-Z0-9\s]{9,11}/)?.[0]?.replace(/\s/g, "") || "";
    const docData = {
      isin: isinCandidate,
      barrier: this.extractFeature(cleaned, "barrier_cap"),
      couponRaw: this.extractFeature(cleaned, "coupon"),
      isMemory: this.dictionary.memory_effect.some((kw) =>
        cleaned.toLowerCase().includes(kw),
      ),
      decrement: this.extractFeature(cleaned, "decrement"),
      autocallTrigger: this.extractFeature(cleaned, "autocall_trigger"),
    };
    if (docData.couponRaw)
      docData.couponDetails = this.analyzeStructure(cleaned, docData.couponRaw);
    return docData;
  },
};

const ProFinancialExtractor = {
  regex: {
    isin: /ISIN\s*[:\s]*([A-Z]{2}[A-Z0-9]{10})/i,
    barrierPct:
      /(?:protection du capital|barri[èe]re de protection|remboursement final).+?(\d{2})\s*%/is,
    decrement: /(\d+[,.]\d+)\s*(?:points|pts|decrement)/i,
    coupon: /(\d+[,.]\d{2,5})\s*%\s*(?:par jour|annuel|p\.a|par an)/i,
    nominal:
      /(?:nominal|unitaire|d[ée]nomination).+?(\b1\s?000\b|\b100\b|\b10\s?000\b)/i,
  },

  extract(text) {
    const src = String(text || "");
    const results = {};
    for (const key in this.regex) {
      const match = src.match(this.regex[key]);
      if (match) {
        const val = match[1].replace(/\s/g, "").replace(",", ".");
        if (key === "coupon" && /par jour|daily|quotidien/i.test(src)) {
          results.couponType = "Daily";
          results.couponAnnualized = Number((parseFloat(val) * 365).toFixed(2));
        }
        results[key] = val;
      }
    }
    return results;
  },
};

function sanitizeDecrement(v) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 && n <= 200 ? n : null;
}

function extractDomainCharacteristicsFromText(rawText = "", base = {}) {
  const text = String(rawText || "");
  const flat = text.replace(/\s+/g, " ");
  const n = (value) => {
    if (value === null || value === undefined || value === "") return null;
    const parsed = Number(String(value).replace(",", ".").replace(/[^\d.-]/g, ""));
    return Number.isFinite(parsed) ? parsed : null;
  };
  const pick = (patterns) => {
    for (const re of patterns) {
      const m = flat.match(re);
      if (m?.[1]) return m[1].trim();
    }
    return null;
  };
  const pickNum = (patterns) => n(pick(patterns));
  const all = (re) => [...flat.matchAll(re)].map((m) => m[1]?.trim()).filter(Boolean);
  const family = globalThis.StructuraDomain?.normalizeProductFamily?.(
    base.type ||
      pick([/(phoenix|athena|credit linked note|cln|bearish taux|note taux|note à taux|note a taux|autocall)/i]),
    base.legacyType,
  );
  const underlyings = [
    ...all(/(?:Sous[-\s]?jacent|Underlying|Reference Asset)\s*[:\-]\s*([^.;\n\r]{2,80})/gi),
  ];
  if (base.underlying && !underlyings.length) underlyings.push(base.underlying);

  const initialLevelType = /moyenne des cours de cl[ôo]ture/i.test(flat)
    ? "moyenne"
    : /plus bas des cours de cl[ôo]ture|minimum/i.test(flat)
      ? "minimum"
      : /cours de cl[ôo]ture|strike spot/i.test(flat)
        ? "coursDeCloture"
        : null;
  const initialLevelDates = [
    ...all(/(?:date de strike spot|strike spot|cours de cl[ôo]ture du)\s*[:\-]?\s*([0-9]{1,2}[\/.-][0-9]{1,2}[\/.-]20[0-9]{2})/gi),
    ...all(/(?:date minimum|minimum date|date de constatation initiale)\s*[:\-]?\s*([0-9]{1,2}[\/.-][0-9]{1,2}[\/.-]20[0-9]{2})/gi),
  ];
  const averageDates = flat.match(
    /moyenne des cours de cl[ôo]ture du\s*([0-9]{1,2}[\/.-][0-9]{1,2}[\/.-]20[0-9]{2})\s+au\s*([0-9]{1,2}[\/.-][0-9]{1,2}[\/.-]20[0-9]{2})/i,
  );

  const issueDate = pick([
    /Date d['’]?[ée]mission\s*[:\-]?\s*([0-9]{1,2}[\/.-][0-9]{1,2}[\/.-]20[0-9]{2})/i,
    /Issue Date\s*[:\-]?\s*([0-9]{1,2}[\/.-][0-9]{1,2}[\/.-]20[0-9]{2})/i,
  ]);
  const commercialisationEndDate = pick([
    /Date de fin de commercialisation\s*[:\-]?\s*([0-9]{1,2}[\/.-][0-9]{1,2}[\/.-]20[0-9]{2})/i,
    /Subscription (?:end|deadline)\s*[:\-]?\s*([0-9]{1,2}[\/.-][0-9]{1,2}[\/.-]20[0-9]{2})/i,
  ]);

  const earlyRedemptionThresholdType = /seuil de remboursement anticip[ée][^.\n]{0,80}d[ée]gressif|dégressivit[ée]|degressiv/i.test(flat)
    ? "degressif"
    : pickNum([/(?:Seuil de remboursement anticip[ée]|Niveau de rappel|Autocall Trigger)[^0-9%]{0,40}([0-9]+(?:[.,][0-9]+)?)\s*%/i])
      ? "fixe"
      : null;

  const characteristics = globalThis.StructuraDomain?.normalizeCharacteristics
    ? globalThis.StructuraDomain.normalizeCharacteristics(
        {
          ...base,
          productFamily: family,
          issueDate,
          commercialisationEndDate,
          underlyingType: /d[ée]cr[ée]ment/i.test(flat)
            ? "action_decrement"
            : /indice|index/i.test(flat)
              ? "indice"
              : null,
          basketStructure: /worst[-\s]?of|moins performant/i.test(flat)
            ? "worstof"
            : /[ée]quipond[ée]r/i.test(flat)
              ? "equipondere"
              : null,
          underlyings,
          initialLevelType,
          initialLevelDates: averageDates
            ? [averageDates[1], averageDates[2]]
            : initialLevelDates,
          startDateLevel: averageDates?.[1] || null,
          endDateLevel: averageDates?.[2] || null,
          closingPriceDate: initialLevelType === "coursDeCloture" ? initialLevelDates[0] : null,
          minimumDates: initialLevelType === "minimum" ? initialLevelDates : [],
          calculationFrequency: pick([/(quotidienne|hebdomadaire|mensuelle|daily|weekly|monthly)/i]),
          frequency: pick([/(annuel|semestriel|trimestriel|mensuel|annual|semi[-\s]?annual|quarterly|monthly)/i]),
          annualCouponPct: base.couponPct,
          couponStartPeriod: pickNum([
            /d[ée]but coupon(?:\s*\(?note\)?)?[^0-9]{0,30}([0-9]+)/i,
            /coupon d[ée]marre[^0-9]{0,30}([0-9]+)(?:er|[èe]me|ère)?\s+p[ée]riode/i,
            /[àa]\s+partir\s+de\s+la\s+([0-9]+)(?:er|[èe]me|ère)?\s+p[ée]riode[^.]{0,80}coupon/i,
            /[àa]\s+partir\s+(?:du|de la)\s+([0-9]+)(?:er|[èe]me|ère)?\s+(?:ann[ée]e|semestre|trimestre|mois)/i,
          ]),
          couponBarrier: pickNum([
            /Barri[èe]re de coupon[^0-9%]{0,40}([0-9]+(?:[.,][0-9]+)?)\s*%/i,
            /Coupon Barrier[^0-9%]{0,40}([0-9]+(?:[.,][0-9]+)?)\s*%/i,
          ]),
          oxygenBarrier: pickNum([
            /Barri[èe]re oxyg[èe]ne[^0-9%]{0,40}([0-9]+(?:[.,][0-9]+)?)\s*%/i,
            /Oxygen Barrier[^0-9%]{0,40}([0-9]+(?:[.,][0-9]+)?)\s*%/i,
          ]),
          finalThreshold: base.barrierPct,
          fixedRecallThreshold: base.recallPct,
          earlyRedemptionThresholdType,
          periodBeforeEarlyRedemption: pickNum([
            /p[ée]riode de non[-\s]?call[^0-9]{0,30}([0-9]+)/i,
            /non[-\s]?call[^0-9]{0,30}([0-9]+)(?:er|[èe]me|ère)?\s+(?:ann[ée]e|semestre|trimestre|mois|p[ée]riode)/i,
            /p[ée]riode avant remboursement anticip[ée][^0-9]{0,30}([0-9]+)/i,
            /[àa]\s+partir\s+de\s+la\s+([0-9]+)(?:er|[èe]me|ère)?\s+ann[ée]e[^.]{0,80}remboursement anticip[ée]/i,
          ]),
          firstCallThreshold: pickNum([
            /Premier seuil de rappel[^0-9%]{0,40}([0-9]+(?:[.,][0-9]+)?)\s*%/i,
            /Initial Autocall Trigger[^0-9%]{0,40}([0-9]+(?:[.,][0-9]+)?)\s*%/i,
          ]),
          degressivityPerPeriod: pickNum([
            /D[ée]gressivit[ée](?: par p[ée]riode)?[^0-9%]{0,40}([0-9]+(?:[.,][0-9]+)?)\s*%/i,
          ]),
          floor: pickNum([/\bFloor[^0-9%]{0,30}([0-9]+(?:[.,][0-9]+)?)\s*%/i]),
          hasMemory: /effet m[ée]moire|memory coupon|m[ée]moire/i.test(flat),
          couponVersion: /in fine/i.test(flat) ? "in_fine" : /distribu[ée]/i.test(flat) ? "distribue" : null,
          putLeveraged: /put leveraged/i.test(flat),
          putLeveragedValue: pickNum([
            /Put Leveraged[^0-9%]{0,40}([0-9]+(?:[.,][0-9]+)?)\s*%/i,
          ]),
          bearishSubType: /bearish taux/i.test(flat)
            ? /athena/i.test(flat)
              ? "athena"
              : "phoenix"
            : null,
          bearishPhoenixVersion: /bearish[^.]{0,120}in fine|mise en m[ée]moire|coupons?\s+enregistr[ée]s?|enregistrement d['’]un coupon/i.test(flat)
            ? "in_fine"
            : /bearish[^.]{0,80}distribu[ée]|distribution d['’]un coupon/i.test(flat)
              ? "distribue"
              : null,
          bearishCouponGuaranteed: /coupon garanti/i.test(flat),
          bearishCouponGuaranteedPeriod: pick([
            /fin de la\s*([0-9]+(?:er|[èe]me|ère)?\s+(?:ann[ée]e|p[ée]riode|semestre|trimestre|mois)\s+[ée]coul[ée]e?)/i,
            /coupon garanti[^.]{0,80}(?:fin de la|à la fin de la)\s*([^,.;]{3,40})/i,
            /p[ée]riode de non enregistrement garanti\s*[:\-]?\s*([^,.;]{3,40})/i,
          ]),
          bearishCouponGuaranteedAmount: pickNum([
            /coupon garanti[^0-9%]{0,80}([0-9]+(?:[.,][0-9]+)?)\s*%/i,
          ]),
          bearishPeriodBeforeRedemption: pickNum([
            /rappel d[èe]s la\s+([0-9]+)(?:er|[èe]me|ère)?\s+p[ée]riode/i,
            /[àa]\s+partir\s+de\s+la\s+([0-9]+)(?:er|[èe]me|ère)?\s+p[ée]riode[^.]{0,80}remboursement anticip[ée]/i,
            /bearish[^.]{0,80}p[ée]riode de non[-\s]?call[^0-9]{0,30}([0-9]+)/i,
            /bearish[^.]{0,80}p[ée]riode avant remboursement[^0-9]{0,30}([0-9]+)/i,
            /[àa]\s+partir\s+de\s+la\s+([0-9]+)(?:er|[èe]me|ère)?\s+ann[ée]e[^.]{0,80}sous[-\s]?jacent clôture en-dessous/i,
          ]),
          bearishRedemptionFrequency: pick([
            /m[ée]canisme\s+(annuel|semestriel|trimestriel|mensuel)\s+de remboursement/i,
            /(?:chaque\s+)?(annuel|semestriel|trimestriel|mensuel|annuelle|semestrielle|trimestrielle|mensuelle)[^.]{0,80}remboursement anticip[ée]/i,
          ]),
          bearishCouponBarrier: pickNum([
            /Barri[èe]re de distribution de coupon[^0-9%]{0,40}([0-9]+(?:[.,][0-9]+)?)\s*%/i,
            /barri[èe]re coupon bearish[^0-9%]{0,40}([0-9]+(?:[.,][0-9]+)?)\s*%/i,
          ]),
          bearishRecallBarrier: pickNum([
            /Barri[èe]re de rappel[^0-9%]{0,40}([0-9]+(?:[.,][0-9]+)?)\s*%/i,
            /barri[èe]re rappel bearish[^0-9%]{0,40}([0-9]+(?:[.,][0-9]+)?)\s*%/i,
          ]),
          referenceEntity: pick([
            /Entit[ée] de r[ée]f[ée]rence\s*[:\-]\s*([^.;\n\r]{2,100}?)(?=\s+(?:Coupon|Callable|P[ée]riode|Chaque|À maturit[ée]|A maturit[ée]|ISDA|$))/i,
            /Reference Entity\s*[:\-]\s*([^.;\n\r]{2,100}?)(?=\s+(?:Coupon|Callable|Call|Period|Maturity|ISDA|$))/i,
          ]),
          creditEventDefinition: /ISDA/i.test(flat) ? "ISDA" : null,
          callable: /callable|l['’]?[ée]metteur peut rembourser|issuer may redeem/i.test(flat),
          callMode: /dates fixes|fixed call dates|aux dates fixes suivantes/i.test(flat)
            ? "dates"
            : /p[ée]riode r[ée]currente|d[ée]but et fin inclus|du .* au .* inclus/i.test(flat)
              ? "periode"
              : null,
          callDates: [
            ...all(/(?:date de call|call date)\s*[:\-]?\s*([0-9]{1,2}[\/.-][0-9]{1,2}[\/.-]20[0-9]{2})/gi),
            ...all(/dates fixes[^.;:()]*[:(]\s*[^.;)]*?([0-9]{1,2}[\/.-][0-9]{1,2}[\/.-]20[0-9]{2})/gi),
          ],
          callStartPeriod: pickNum([
            /d[ée]but call(?:\s*[ée]metteur)?(?:\s*\(?note\)?)?[^0-9]{0,30}([0-9]+)/i,
            /call [ée]metteur[^.]{0,80}(?:d[ée]marre|ne d[ée]marre qu['’]?[àa]|[àa]\s+partir)[^0-9]{0,30}([0-9]+)(?:er|[èe]me|ère)?\s+p[ée]riode/i,
            /callable[^.]{0,80}[àa]\s+partir\s+(?:du|de la)\s+([0-9]+)(?:er|[èe]me|ère)?\s+(?:ann[ée]e|semestre|trimestre|mois)/i,
            /l['’]?[ée]metteur se r[ée]serve le droit[^.]{0,120}[àa]\s+partir\s+(?:du|de la)\s+([0-9]+)(?:er|[èe]me|ère)?/i,
            /d[ée]but call(?: note)?[^0-9]{0,30}([0-9]+)/i,
          ]),
          callStartDate: pick([
            /(?:date de d[ée]but|call start date|du)\s*[:\-]?\s*([0-9]{1,2}[\/.-][0-9]{1,2}[\/.-]20[0-9]{2})/i,
          ]),
          callEndDate: pick([
            /(?:date de fin|call end date|au)\s*[:\-]?\s*([0-9]{1,2}[\/.-][0-9]{1,2}[\/.-]20[0-9]{2})/i,
          ]),
          callFrequency: pick([
            /(annuelle|semestrielle|trimestrielle|mensuelle|annuel|semestriel|trimestriel|mensuel|année|semestre|trimestre|mois|annual|semi[-\s]?annual|quarterly|monthly)/i,
          ]),
          rateType: /taux variable|floating rate|euribor/i.test(flat)
            ? "variable"
            : /taux fixe|fixed rate|coupon garanti/i.test(flat)
              ? "fixe"
              : null,
          noteVersion: /in fine|enregistrement d['’]un coupon|pay[ée] au moment du rappel/i.test(flat)
            ? "in_fine"
            : /distribu[ée]|distribution d['’]un coupon/i.test(flat)
              ? "distribue"
              : null,
          noteUnderlying: pick([/(EURIBOR\s*\d+M|CMS\s*\d+Y|SOFR|ESTR|€STR)/i]),
          spreadPct: pickNum([/spread[^0-9%]{0,20}([0-9]+(?:[.,][0-9]+)?)\s*%/i]),
          capPct: pickNum([/\bcap(?:p[ée])?[^0-9%]{0,20}([0-9]+(?:[.,][0-9]+)?)\s*%/i]),
          floorPct: pickNum([/\bfloor[ée]?[^0-9%]{0,20}([0-9]+(?:[.,][0-9]+)?)\s*%/i]),
        },
        family,
      )
    : {};

  return {
    productFamily: family,
    characteristics,
  };
}

function regexExtractFromText(text, opts = {}) {
  const rawText = String(text || "");
  const txt = String(text || "")
    .replace(/\s+/g, " ")
    .trim();
  const docType = opts.docType || "UNKNOWN";
  const template = opts.template || "auto";
  const specSignals = collectSpecSignals(rawText);
  const pick = (patterns, def = "") => {
    for (const re of patterns) {
      const m = txt.match(re);
      if (m?.[1]) return m[1].trim();
    }
    return def;
  };
  const pickNum = (patterns, def = 0) => {
    const raw = pick(patterns, "");
    const n = Number(
      raw
        .replace(/\s/g, "")
        .replace(",", ".")
        .replace(/[^\d.-]/g, ""),
    );
    return Number.isFinite(n) ? n : def;
  };
  const firstValid = (arr, validate) => arr.find(validate);
  const allMatches = (re) =>
    [...txt.matchAll(re)].map((m) => m[1] || m[0]).filter(Boolean);
  const toIso = (v) => {
    if (!v) return "";
    const s = v.trim();
    const iso = s.match(/\b(20\d{2})[-\/](\d{2})[-\/](\d{2})\b/);
    if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
    const fr = s.match(/\b(\d{1,2})[-\/.](\d{1,2})[-\/.](20\d{2})\b/);
    if (fr)
      return `${fr[3]}-${String(fr[2]).padStart(2, "0")}-${String(fr[1]).padStart(2, "0")}`;
    // Format français long : "24 septembre 2035"
    const MONTHS_LONG = {
      janvier: 1,
      février: 2,
      fevrier: 2,
      mars: 3,
      avril: 4,
      mai: 5,
      juin: 6,
      juillet: 7,
      août: 8,
      aout: 8,
      septembre: 9,
      octobre: 10,
      novembre: 11,
      décembre: 12,
      decembre: 12,
    };
    const longFr = s.match(
      /\b(\d{1,2})\s+(janvier|f[ée]vrier|mars|avril|mai|juin|juillet|ao[ûu]t|septembre|octobre|novembre|d[ée]cembre)\s+(20\d{2})\b/i,
    );
    if (longFr) {
      const mo =
        MONTHS_LONG[
          longFr[2]
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
        ];
      if (mo)
        return `${longFr[3]}-${String(mo).padStart(2, "0")}-${String(longFr[1]).padStart(2, "0")}`;
    }
    return "";
  };
  const pro = ProExtractionEngine.extract(txt);
  const adv = AdvancedUniversalExtractor.extract(rawText);
  const uni = UniversalExtractionEngine.process(rawText);
  const fin = ProFinancialExtractor.extract(rawText);
  const toNum = (v) =>
    Number(
      String(v || "")
        .replace(",", ".")
        .replace(/[^\d.-]/g, ""),
    );
  const toIsoFromFr = (v) => {
    const m = String(v || "").match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    return m ? `${m[3]}-${m[2]}-${m[1]}` : "";
  };

  const isinCandidates = allMatches(/\b([A-Z]{2}[A-Z0-9]{9}[0-9])\b/g);
  if (pro.isin && pro.isin !== "Non trouvé")
    isinCandidates.push(String(pro.isin).toUpperCase());
  if (uni.isin) isinCandidates.push(String(uni.isin).toUpperCase());
  if (fin.isin) isinCandidates.push(String(fin.isin).toUpperCase());
  const isin = firstValid(isinCandidates, isinCheckDigitValid) || "";
  const couponCandidates = [
    // PRIORITÉ : taux annualisé explicitement cité dans le document
    ...allMatches(/soit\s*([0-9]+(?:[.,][0-9]+)?)\s*%\s*par\s*an(?:n[ée]e)?/gi),
    ...allMatches(
      /([0-9]+(?:[.,][0-9]+)?)\s*%\s*(?:par\s*an(?:n[ée]e)?|p\.a\.)\b/gi,
    ),
    ...allMatches(
      /coupon(?:\s+annuel|s)?[^0-9%]{0,50}([0-9]+(?:[.,][0-9]+)?)\s*%/gi,
    ),
    ...allMatches(/taux[^0-9%]{0,35}([0-9]+(?:[.,][0-9]+)?)\s*%/gi),
    ...allMatches(/yield[^0-9%]{0,30}([0-9]+(?:[.,][0-9]+)?)\s*%/gi),
    ...allMatches(
      /contingent coupon[^0-9%]{0,30}([0-9]+(?:[.,][0-9]+)?)\s*%/gi,
    ),
    ...allMatches(/digital return[^0-9%]{0,30}([0-9]+(?:[.,][0-9]+)?)\s*%/gi),
    ...allMatches(
      /interest(?: rate)?[^0-9%]{0,35}([0-9]+(?:[.,][0-9]+)?)\s*%/gi,
    ),
    ...(typeof EnhancedPatternLibrary !== "undefined"
      ? EnhancedPatternLibrary.extractAllCouponCandidates(txt)
      : []),
  ]
    .map((v) => Number(String(v).replace(",", ".")))
    .filter((v) => Number.isFinite(v));
  if (pro.coupon_annual_equiv && pro.coupon_annual_equiv !== "Non trouvé")
    couponCandidates.push(toNum(pro.coupon_annual_equiv));
  if (pro.coupon_daily && pro.coupon_daily !== "Non trouvé") {
    const daily = toNum(pro.coupon_daily);
    if (Number.isFinite(daily) && daily > 0 && daily < 1)
      couponCandidates.push(daily * 365);
  }
  if (adv.coupon?.annualPct)
    couponCandidates.push(Number(adv.coupon.annualPct));
  if (uni.couponDetails?.annualRate)
    couponCandidates.push(Number(uni.couponDetails.annualRate));
  if (uni.couponRaw) couponCandidates.push(toNum(uni.couponRaw));
  if (fin.couponAnnualized) couponCandidates.push(Number(fin.couponAnnualized));
  if (fin.coupon) couponCandidates.push(toNum(fin.coupon));
  if (
    Number.isFinite(opts.kvHints?.couponPct) &&
    opts.kvHints.couponPct >= 0.5 &&
    opts.kvHints.couponPct <= 35
  )
    couponCandidates.push(opts.kvHints.couponPct);
  const coupon =
    firstValid(
      couponCandidates,
      (v) => Number.isFinite(v) && v >= 0.5 && v <= 35,
    ) ?? null;
  const barrierCandidates = [
    ...allMatches(
      /barri[èe]re(?:\s+de\s+protection)?[^0-9%]{0,40}([0-9]+(?:[.,][0-9]+)?)\s*%/gi,
    ),
    ...allMatches(
      /capital[^0-9%]{0,30}prot[ée]g[ée][^0-9%]{0,20}([0-9]+(?:[.,][0-9]+)?)\s*%/gi,
    ),
    ...allMatches(
      /(?:buffer|downside threshold|protection level|knock-?in barrier)[^0-9%]{0,40}([0-9]+(?:[.,][0-9]+)?)\s*%/gi,
    ),
    ...(typeof EnhancedPatternLibrary !== "undefined"
      ? EnhancedPatternLibrary.extractAllBarrierCandidates(txt)
      : []),
  ].map((v) => Number(String(v).replace(",", ".")));
  if (pro.barrier_capital && pro.barrier_capital !== "Non trouvé")
    barrierCandidates.push(toNum(pro.barrier_capital));
  if (Number.isFinite(adv.barrier)) barrierCandidates.push(Number(adv.barrier));
  if (uni.barrier) barrierCandidates.push(toNum(uni.barrier));
  if (fin.barrierPct) barrierCandidates.push(toNum(fin.barrierPct));
  if (
    Number.isFinite(opts.kvHints?.barrierPct) &&
    opts.kvHints.barrierPct >= 30 &&
    opts.kvHints.barrierPct <= 100
  )
    barrierCandidates.push(opts.kvHints.barrierPct);
  const barrier =
    firstValid(
      barrierCandidates,
      (v) => Number.isFinite(v) && v >= 30 && v <= 100,
    ) ?? null;
  const recallCandidates = [
    ...allMatches(
      /rappel(?:\s+automatique)?[^0-9%]{0,40}([0-9]+(?:[.,][0-9]+)?)\s*%/gi,
    ),
    ...allMatches(/autocall[^0-9%]{0,30}([0-9]+(?:[.,][0-9]+)?)\s*%/gi),
    ...allMatches(
      /(?:early redemption|automatic redemption|trigger level|autocall level)[^0-9%]{0,40}([0-9]+(?:[.,][0-9]+)?)\s*%/gi,
    ),
    ...allMatches(
      /(?:seuil de d[ée]clenchement|niveau d['']observation|seuil de remboursement anticip[ée])[^0-9%]{0,50}([0-9]+(?:[.,][0-9]+)?)\s*%/gi,
    ),
  ].map((v) => Number(String(v).replace(",", ".")));
  if (pro.barrier_autocall && pro.barrier_autocall !== "Non trouvé")
    recallCandidates.push(toNum(pro.barrier_autocall));
  if (uni.autocallTrigger) recallCandidates.push(toNum(uni.autocallTrigger));
  if (
    Number.isFinite(opts.kvHints?.recallPct) &&
    opts.kvHints.recallPct >= 70 &&
    opts.kvHints.recallPct <= 130
  )
    recallCandidates.push(opts.kvHints.recallPct);
  const recall =
    firstValid(
      recallCandidates,
      (v) => Number.isFinite(v) && v >= 70 && v <= 130,
    ) ?? null;
  const nominalRaw = pick(
    [
      /nominal[^0-9]{0,20}([0-9][0-9\s.,]{2,})/i,
      /montant[^0-9]{0,20}([0-9][0-9\s.,]{2,})/i,
      /(?:minimum denomination|denomination|principal amount|stated principal amount|reference amount)[^0-9]{0,24}([0-9][0-9\s.,$€]{2,})/i,
    ],
    "",
  );
  const nominal = nominalRaw
    ? Number(
        nominalRaw
          .replace(/\s/g, "")
          .replace(",", ".")
          .replace(/[^\d.-]/g, ""),
      )
    : null;
  const nominalFin = fin.nominal ? toNum(fin.nominal) : null;
  const nominalEnhanced =
    typeof EnhancedPatternLibrary !== "undefined"
      ? EnhancedPatternLibrary.extractNominalCandidate(rawText)
      : null;
  const nominalKV =
    opts.kvHints?.nominal != null &&
    Number.isFinite(Number(opts.kvHints.nominal)) &&
    Number(opts.kvHints.nominal) > 0
      ? Number(opts.kvHints.nominal)
      : null;
  const nominalAdj = Number.isFinite(nominalFin)
    ? nominalFin
    : Number.isFinite(nominal)
      ? nominal < 5000
        ? nominal * 1000
        : nominal
      : Number.isFinite(nominalEnhanced)
        ? nominalEnhanced
        : nominalKV;
  const issuer = pick(
    [
      /(?:emetteur|[ée]metteur|issuer|garant)\s*[:\-]?\s*(BNP Paribas|Soci[ée]t[ée] G[ée]n[ée]rale|Goldman Sachs|JP Morgan|JPMorgan|Deutsche Bank|Barclays|HSBC|Morgan Stanley|Natixis|Cr[ée]dit Agricole CIB|Credit Agricole CIB|UBS|Citigroup|Citi|UniCredit|Commerzbank|Bank of America|Merrill Lynch|Leonteq|Vontobel)/i,
      /(?:issued by|emis par)\s*(BNP Paribas|Soci[ée]t[ée] G[ée]n[ée]rale|Goldman Sachs|JP Morgan|JPMorgan|Deutsche Bank|Barclays|HSBC|Morgan Stanley|Natixis|Cr[ée]dit Agricole CIB|Credit Agricole CIB|UBS|Citigroup|Citi|UniCredit|Commerzbank|Bank of America|Merrill Lynch|Leonteq|Vontobel)/i,
      /(BNP Paribas|Soci[ée]t[ée] G[ée]n[ée]rale|Goldman Sachs|JP Morgan|JPMorgan|Deutsche Bank|Barclays|HSBC|Morgan Stanley|Natixis|Cr[ée]dit Agricole CIB|Credit Agricole CIB|UBS|Citigroup|Citi|UniCredit|Commerzbank|Bank of America|Merrill Lynch|Leonteq|Vontobel)/i,
    ],
    "",
  );
  const issuerPro =
    pro.emetteur && pro.emetteur !== "Non trouvé" ? pro.emetteur : "";
  const templateHint = templateIssuerHints(template);
  const issuerFromTemplate =
    templateHint && txt.match(templateHint) ? txt.match(templateHint)[0] : "";
  const issuerFromSpec = findSpecIssuer(rawText);
  const issuerFinal = canonicalizeIssuerLabel(
    issuer || issuerPro || issuerFromTemplate || issuerFromSpec || "",
  );
  const issuerRegistry = findRegistryIssuerEntry(issuerFinal || rawText);
  const registrySnapshot = extractIssuerSpecificSnapshot(
    rawText,
    issuerRegistry,
  );
  const type = pick(
    [
      /(Autocall(?:\s*\/\s*Phoenix)?|Phoenix|Athena|Bearish Taux|Credit Linked Note|CLN|Note (?:à|a) taux (?:fixe|variable)|Capital Garanti|Reverse Convertible|Barrier Reverse Convertible|Callable Reverse Convertible|Levier|Leverage|Bonus Cap|Discount Certificate|Turbo|Warrant|Airbag|Capital Protected Note|Yield Note|Tracker Certificate)/i,
    ],
    "",
  );
  const typeFromSpec = findSpecProductFamily(rawText);
  const typeFromRegistry =
    findSpecProductFamily(registrySnapshot.type || "") ||
    registrySnapshot.type ||
    "";
  const _upcResult =
    typeof UniversalProductClassifier !== "undefined"
      ? UniversalProductClassifier.classify(
          rawText.substring(0, 3000),
          opts.kvHints?.typeHint || type,
        )
      : null;
  const typeFromUPC =
    _upcResult && _upcResult.confidence >= 20
      ? _upcResult.matchedVariant?.label || _upcResult.label || ""
      : "";
  let underlying = pick(
    [
      /(CAC ?40|EURO STOXX ?50|S&P ?500|DAX ?40|Nikkei ?225|FTSE ?100|SMI|IBEX ?35|LVMH|Airbus|NVIDIA|TotalEnergies|BNP Paribas)/i,
    ],
    "",
  );
  if (!underlying && typeof EnhancedPatternLibrary !== "undefined") {
    const _ctxPat = EnhancedPatternLibrary.buildUnderlyingPattern();
    const _m1 = rawText.match(_ctxPat);
    if (_m1?.[1]) underlying = _m1[1].trim();
    if (!underlying) {
      const _dirPat = EnhancedPatternLibrary.buildUnderlyingDirectPattern();
      const _m2 = rawText.match(_dirPat);
      if (_m2?.[0]) underlying = _m2[0].trim();
    }
  }
  if (!underlying && opts.kvHints?.underlyingHint)
    underlying = String(opts.kvHints.underlyingHint).trim();
  const maturityRaw = pick(
    [
      /(?:date d['’]echeance|date d['’][ée]ch[ée]ance|echeance|maturit[ée])[^0-9]{0,20}([0-9]{2}[\/.-][0-9]{2}[\/.-]20[0-9]{2})/i,
      /maturity[^0-9]{0,20}([0-9]{2}[\/.-][0-9]{2}[\/.-]20[0-9]{2})/i,
      /\(le\s+(\d{1,2}\s+(?:janvier|f[ée]vrier|mars|avril|mai|juin|juillet|ao[ûu]t|septembre|octobre|novembre|d[ée]cembre)\s+20\d{2})\)/i,
      /(?:date\s+d[''][ée]ch[ée]ance|maturit[ée])\s*[^A-Za-z0-9]{0,20}(\d{1,2}\s+(?:janvier|f[ée]vrier|mars|avril|mai|juin|juillet|ao[ûu]t|septembre|octobre|novembre|d[ée]cembre)\s+20\d{2})/i,
      /\b(20[0-9]{2}-[01][0-9]-[0-3][0-9])\b/,
    ],
    "",
  );
  const maturity = toIso(maturityRaw) || toIsoFromFr(pro.maturity_date) || "";
  const couponFinal = Number.isFinite(coupon)
    ? coupon
    : registrySnapshot.couponPct;
  const barrierFinal = Number.isFinite(barrier)
    ? barrier
    : registrySnapshot.barrierPct;
  const recallFinal = Number.isFinite(recall)
    ? recall
    : registrySnapshot.recallPct;
  const maturityFinal = maturity || registrySnapshot.maturityDate || null;
  const nominalFinal = Number.isFinite(nominalAdj)
    ? nominalAdj
    : registrySnapshot.nominal;
  let confidenceScore =
    [
      isin && isinCheckDigitValid(isin) ? 1 : 0,
      Number.isFinite(couponFinal) && couponFinal >= 0.5 && couponFinal <= 35
        ? 1
        : 0,
      Number.isFinite(barrierFinal) && barrierFinal >= 30 && barrierFinal <= 100
        ? 1
        : 0,
      Number.isFinite(recallFinal) && recallFinal >= 70 && recallFinal <= 130
        ? 1
        : 0,
      issuerFinal ? 1 : 0,
      !!(cleanUnderlyingCandidate(underlying) || registrySnapshot.underlying)
        ? 1
        : 0,
    ].reduce((a, b) => a + b, 0) / 6;
  if (docType === "KID") confidenceScore = Math.min(1, confidenceScore + 0.08);
  if (docType === "TERM_SHEET")
    confidenceScore = Math.min(1, confidenceScore + 0.04);
  const underlyingFromSpec = extractUnderlyingFromSpec(rawText);
  const underlyingClean =
    cleanUnderlyingCandidate(underlying) ||
    registrySnapshot.underlying ||
    underlyingFromSpec ||
    (opts.kvHints?.underlyingHint
      ? cleanUnderlyingCandidate(String(opts.kvHints.underlyingHint))
      : null);
  const typeClean =
    findSpecProductFamily(type) ||
    typeFromRegistry ||
    typeFromSpec ||
    typeFromUPC ||
    type ||
    "";
  const issuerLooksLikeUnderlying =
    underlyingClean &&
    issuerFinal &&
    String(underlyingClean).toLowerCase() === String(issuerFinal).toLowerCase();
  const shouldDropUnderlying =
    issuerLooksLikeUnderlying &&
    !typeClean &&
    !specSignals.docs.length &&
    !specSignals.families.length &&
    !Number.isFinite(couponFinal) &&
    !Number.isFinite(barrierFinal) &&
    !Number.isFinite(recallFinal) &&
    !maturityFinal;
  const resolvedUnderlying = shouldDropUnderlying ? null : underlyingClean;
  const productName = StructuraCleaner.cleanProductName(
    [typeClean, resolvedUnderlying || issuerFinal].filter(Boolean).join(" "),
  );
  const domainExtract = extractDomainCharacteristicsFromText(rawText, {
    type: typeClean,
    legacyType: typeClean,
    underlying: resolvedUnderlying,
    couponPct: couponFinal,
    barrierPct: barrierFinal,
    recallPct: recallFinal,
    maturityDate: maturityFinal,
    nominal: nominalFinal,
  });
  return {
    productName,
    isin,
    type: typeClean,
    productFamily: domainExtract.productFamily,
    issuer: issuerFinal,
    underlying: resolvedUnderlying,
    couponPct: couponFinal,
    couponPeriod:
      adv.coupon?.period ||
      (uni.couponDetails?.type || "").toLowerCase() ||
      (fin.couponType || "").toLowerCase(),
    couponRawPct: adv.coupon?.rawPct || uni.couponDetails?.raw || null,
    barrierPct: barrierFinal,
    barrierType: adv.barrierType || "",
    recallPct: recallFinal,
    maturityDate: maturityFinal,
    nominal: nominalFinal,
    hasMemory: !!adv.hasMemory || !!uni.isMemory,
    characteristics: domainExtract.characteristics,
    decrement:
      sanitizeDecrement(adv.decrement) ??
      sanitizeDecrement(toNum(uni.decrement)) ??
      sanitizeDecrement(toNum(fin.decrement)),
    features: [
      ...new Set([
        ...(adv.features || []),
        ...(uni.isMemory ? ["Memory"] : []),
      ]),
    ],
    detectionProfile: {
      issuers: specSignals.issuers,
      families: specSignals.families,
      docs: specSignals.docs,
      registryIssuer: issuerRegistry?.id || null,
      officialSourceStatus: issuerRegistry?.publicSourceStatus || null,
    },
    docType,
    confidence: Number((confidenceScore * 100).toFixed(0)),
    notes: `Extraction déterministe locale (${Number((confidenceScore * 100).toFixed(0))}% confiance)`,
  };
}

function consolidateAllSources(tsText, bcText, kidText = "", opts = {}) {
  const sources = [];
  if (tsText)
    sources.push({
      docType: "TS",
      data: normalizeSourceFields(
        regexExtractFromText(tsText, { ...opts, docType: "TERM_SHEET" }),
      ),
    });
  if (kidText)
    sources.push({
      docType: "KID",
      data: normalizeSourceFields(
        regexExtractFromText(kidText, { ...opts, docType: "KID" }),
      ),
    });
  if (bcText)
    sources.push({
      docType: "BROCHURE",
      data: normalizeSourceFields(
        regexExtractFromText(bcText, { ...opts, docType: "BROCHURE" }),
      ),
    });
  return processFinalExtraction(sources);
}

const FIELD_ALIASES = {
  couponPct: ["couponPct", "coupon", "coupon_rate", "tauxCoupon"],
  barrierPct: ["barrierPct", "barrier", "barrierLevel", "barrierPercent"],
  recallPct: ["recallPct", "recall", "recallLevel", "autocallLevel"],
  underlying: ["underlying", "underlyingAsset", "sousJacent", "index"],
  nominal: ["nominal", "notional", "nominalAmount", "montantNominal"],
  maturityDate: ["maturityDate", "maturity", "finalMaturity", "dateEcheance"],
  isin: ["isin", "ISIN", "isinCode"],
  issuer: ["issuer", "emetteur", "issuerName"],
};

function normalizeSourceFields(source = {}) {
  const normalized = { ...source };
  for (const [canonical, aliases] of Object.entries(FIELD_ALIASES)) {
    for (const alias of aliases) {
      if (
        source[alias] !== undefined &&
        source[alias] !== null &&
        source[alias] !== ""
      ) {
        normalized[canonical] = source[alias];
        break;
      }
    }
  }
  return normalized;
}

function cleanUnderlyingCandidate(v) {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  if (!s) return null;
  if (/sous-jacent\s*non\s*d[ée]tect[ée]|not\s*detected|n\/a/i.test(s))
    return null;
  return (
    s
      .replace(
        /^(?:least performing|worst performing|reference asset|reference assets|underlying|basket|panier)\s+/i,
        "",
      )
      .replace(/\s*le plus bas\s*/gi, " ")
      .replace(/niveau de cl[ôo]ture officiel du sous\s*-?\s*jace[^,]*/gi, "")
      .replace(/\s{2,}/g, " ")
      .trim() || null
  );
}

function chooseBestUnderlying(sources = [], consensusUnderlying = null) {
  const fromSources = sources
    .map((s) => cleanUnderlyingCandidate(s?.data?.underlying ?? s?.underlying))
    .filter(Boolean);
  if (fromSources.length) return fromSources[0];
  return cleanUnderlyingCandidate(consensusUnderlying);
}

function validateBarrier(value, alerts = []) {
  const n = parseFloat(value);
  if (!Number.isFinite(n)) {
    alerts.push({
      level: "error",
      field: "barrierPct",
      message: "Barriere non parseable",
    });
    return { value: null, flag: "UNPARSEABLE" };
  }
  if (n === 100) {
    alerts.push({
      level: "warning",
      field: "barrierPct",
      message: "barrierPct=100% suspect (possible confusion recall).",
    });
    return { value: n, flag: "SUSPECT_EQUALS_RECALL" };
  }
  if (n < 40 || n > 100) {
    alerts.push({
      level: "warning",
      field: "barrierPct",
      message: `barrierPct=${n}% hors plage attendue [40-100]`,
    });
    return { value: n, flag: "OUT_OF_RANGE" };
  }
  return { value: n, flag: null };
}

function recoverISIN(sources = [], rawTexts = []) {
  const ISIN_RE = /\b([A-Z]{2}[A-Z0-9]{10})\b/g;
  const KNOWN_PREFIXES = new Set([
    "FR",
    "DE",
    "LU",
    "GB",
    "US",
    "NL",
    "BE",
    "IT",
    "ES",
    "CH",
    "IE",
    "AT",
    "SE",
    "XS",
  ]);
  for (const src of sources) {
    const c = String(src?.data?.isin ?? src?.isin ?? "")
      .trim()
      .toUpperCase();
    if (c.length === 12 && KNOWN_PREFIXES.has(c.slice(0, 2)))
      return { value: c, recoveryMethod: "explicit_field" };
  }
  const texts = [
    ...sources.map((s) => s?.data?.productName ?? s?.productName ?? ""),
    ...sources.map((s) => s?.data?.notes ?? s?.notes ?? ""),
    ...rawTexts,
  ];
  for (const t of texts) {
    if (!t) continue;
    let m;
    while ((m = ISIN_RE.exec(String(t).toUpperCase())) !== null) {
      const c = m[1];
      if (KNOWN_PREFIXES.has(c.slice(0, 2)))
        return { value: c, recoveryMethod: "regex_scan" };
    }
  }
  return { value: null, recoveryMethod: "not_found" };
}

function computeGrade(
  consensusPct,
  certifiedFieldRatio,
  missingCriticalFields = [],
) {
  const sourceCount = arguments.length > 3 ? Number(arguments[3]) : null;
  if (Number.isFinite(sourceCount) && sourceCount < 2) return "LOW";
  if (missingCriticalFields.includes("underlying")) return "LOW";
  if (consensusPct >= 80 && certifiedFieldRatio >= 0.7) return "HIGH";
  if (consensusPct >= 60 && certifiedFieldRatio >= 0.5) return "MEDIUM";
  return "LOW";
}

function classifyDocument(text, extracted = {}) {
  const raw = String(text || "");
  const lower = raw.toLowerCase();
  const specSignals = collectSpecSignals(raw);
  const genericPatterns = [
    /les produits structur[ée]s/,
    /principales familles de produits structur[ée]s/,
    /les principaux atouts/,
    /principaux risques/,
    /\bd[ée]finition\b/,
    /alternative aux placements financiers traditionnels/,
    /soci[ée]t[ée] g[ée]n[ée]rale private banking/,
  ];
  const unrelatedPatterns = [
    /mandat de mobilit[ée] bancaire/,
    /\bautomate\s*:/,
    /\bticket\s*:/,
    /\bd[ée]p[oô]t\b/,
    /pour compte de cheques/,
    /researchgate/,
    /see discussions, stats/,
    /\badresse postale\b/,
    /\btitulaire 1\b/,
    /\bnom\b.+\bprenom/s,
  ];
  const productKeywordPatterns = [
    /\bautocall\b/,
    /\bphoenix\b/,
    /\breverse convertible\b/,
    /\bcapital garanti\b/,
    /\bfinal terms?\b/,
    /\bkey information document\b/,
    /\bdocument d['’]informations? cl[ée]s\b/,
    /\bkid\b/,
    /\bdici\b/,
  ];

  const genericHits = genericPatterns.filter((re) => re.test(lower));
  const unrelatedHits = unrelatedPatterns.filter((re) => re.test(lower));
  const productKeywordHits = productKeywordPatterns.filter((re) =>
    re.test(lower),
  );

  let productScore = 0;
  const evidence = [];
  if (StructuraCleaner.cleanISIN(extracted.isin)) {
    productScore += 3;
    evidence.push("isin");
  }
  if (cleanUnderlyingCandidate(extracted.underlying)) {
    productScore += 1;
    evidence.push("underlying");
  }
  if (extracted.issuer) {
    productScore += 1;
    evidence.push("issuer");
  }
  if (
    Number.isFinite(Number(extracted.couponPct)) &&
    Number(extracted.couponPct) > 0
  ) {
    productScore += 1;
    evidence.push("coupon");
  }
  if (
    Number.isFinite(Number(extracted.barrierPct)) &&
    Number(extracted.barrierPct) >= 30
  ) {
    productScore += 1;
    evidence.push("barrier");
  }
  if (
    Number.isFinite(Number(extracted.recallPct)) &&
    Number(extracted.recallPct) >= 70
  ) {
    productScore += 1;
    evidence.push("recall");
  }
  if (extracted.maturityDate) {
    productScore += 1;
    evidence.push("maturity");
  }
  if (
    Number.isFinite(Number(extracted.nominal)) &&
    Number(extracted.nominal) > 0
  ) {
    productScore += 1;
    evidence.push("nominal");
  }
  if (
    Number.isFinite(Number(extracted.decrement)) &&
    Number(extracted.decrement) > 0 &&
    Number(extracted.decrement) <= 20
  ) {
    productScore += 1;
    evidence.push("decrement");
  }
  if (extracted.type) {
    productScore += 1;
    evidence.push("type");
  }
  if (productKeywordHits.length) {
    productScore += Math.min(2, productKeywordHits.length);
    evidence.push("product_keywords");
  }
  if (specSignals.issuers.length) {
    productScore += 1;
    evidence.push("spec_issuer");
  }
  if (specSignals.families.length) {
    productScore += Math.min(2, specSignals.families.length);
    evidence.push("spec_family");
  }
  if (specSignals.docs.length) {
    productScore += 1;
    evidence.push(`doc_${specSignals.docs[0].toLowerCase()}`);
  }

  let kind = "UNKNOWN";
  let eligible = false;
  if (unrelatedHits.length >= 2 && productScore < 4) {
    kind = "UNRELATED";
  } else if (genericHits.length >= 2 && productScore < 5) {
    kind = "GENERIC_STRUCTURED_PRODUCTS";
  } else if (StructuraCleaner.cleanISIN(extracted.isin) || productScore >= 5) {
    kind = "PRODUCT_SPECIFIC";
    eligible = true;
  } else if (productScore >= 3 && productKeywordHits.length) {
    kind = "POSSIBLY_PRODUCT_SPECIFIC";
    eligible = true;
  }

  return {
    kind,
    eligible,
    productScore,
    evidence,
    specSignals,
    genericSignals: genericHits.map(String),
    unrelatedSignals: unrelatedHits.map(String),
  };
}

const StructuraEngine = {
  patterns: {
    isin: /\b([A-Z]{2}[A-Z0-9]{10})\b/i,
    barrier:
      /(?:protection|seuil de perte|barri[èe]re de protection|barri[èe]re).{0,80}?(\d{2,3}(?:[.,]\d+)?)\s*%/i,
    coupon:
      /(\d{1,2}(?:[.,]\d+)?)\s*%\s*(?:p\.a|an|annuel|quotidien|jour|daily)/i,
    nominal:
      /(?:nominal|d[ée]nomination|unitaire).{0,50}?(\b1\s?000\b|\b100\b|\b10\s?000\b)/i,
    decrement: /(\d+[,.]\d+)\s*(?:points|pts|decrement)/i,
  },

  normalizeValue(field, value, contextText = "") {
    if (value === null || value === undefined) return null;
    const v = String(value).trim();
    if (!v) return null;
    if (field === "isin") return v.toUpperCase().replace(/\s/g, "");
    if (["barrier", "coupon", "nominal", "decrement"].includes(field)) {
      const n = Number(v.replace(",", ".").replace(/[^\d.-]/g, ""));
      if (!Number.isFinite(n)) return null;
      if (field === "coupon") {
        if (/quotidien|par jour|daily/i.test(contextText) && n < 1)
          return Number((n * 365).toFixed(4));
      }
      return Number(n.toFixed(4));
    }
    return v;
  },

  findMatch(text, field) {
    if (!text) return null;
    const re = this.patterns[field];
    if (!re) return null;
    const match = String(text).match(re);
    if (!match) return null;
    return this.normalizeValue(field, match[1], String(text));
  },

  getMajority(values) {
    const counts = new Map();
    values.forEach((v) => counts.set(v, (counts.get(v) || 0) + 1));
    return (
      [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? values[0]
    );
  },

  confidenceWeight(level) {
    if (level === "CERTIFIED") return 100;
    if (level === "HIGH") return 85;
    return 60;
  },

  triangulate(docs, field) {
    const raw = {
      TS: this.findMatch(docs.ts, field),
      KID: this.findMatch(docs.kid, field),
      BC: this.findMatch(docs.bc, field),
    };
    if (field === "isin") {
      raw.TS = StructuraCleaner.cleanISIN(raw.TS);
      raw.KID = StructuraCleaner.cleanISIN(raw.KID);
      raw.BC = StructuraCleaner.cleanISIN(raw.BC);
    }
    const rec = StructuraCleaner.reconcile(field, {
      ts: raw.TS,
      kid: raw.KID,
      bc: raw.BC,
    });
    const value = rec.value === "N/A" ? null : rec.value;
    const confidence =
      rec.status === "CERTIFIED"
        ? "CERTIFIED"
        : rec.status === "WARN"
          ? "HIGH"
          : "LOW";
    const sources = Object.keys(raw).filter((k) => {
      const rv = raw[k];
      if (rv === null || rv === "") return false;
      if (typeof rv === "number")
        return Number(rv.toFixed(6)) === Number(value);
      return String(rv) === String(value);
    });
    return { value, confidence, sources };
  },

  extractUnderlying(docs) {
    const patterns = [
      /(?:indice|sous-jacent|index)\s*[:\-]?\s*([^.;\n]{3,80})/i,
      /(CAC ?40|EURO STOXX ?50|S&P ?500|DAX ?40|Nikkei ?225|FTSE ?100|SMI|IBEX ?35)/i,
    ];
    const pools = [docs.bc, docs.ts, docs.kid];
    for (const text of pools) {
      if (!text) continue;
      for (const re of patterns) {
        const m = String(text).match(re);
        if (m?.[1])
          return StructuraCleaner.cleanUnderlying(m[1].trim()) || m[1].trim();
      }
    }
    return "Non détecté";
  },

  extractSRI(kidText) {
    const match = String(kidText || "").match(
      /(?:indicateur de risque|risk indicator|sri).{0,40}?([1-7])\b/i,
    );
    return match ? Number(match[1]) : null;
  },

  createSummary(ext) {
    const isin = ext.isin.value || "N/A";
    const underlying =
      cleanUnderlyingCandidate(ext.underlying) ||
      "sous-jacent a identifier manuellement";
    const coupon =
      ext.coupon.value !== null
        ? `${ext.coupon.value}% p.a.`
        : "coupon à vérifier";
    const barrier =
      ext.barrier.value !== null
        ? `${ext.barrier.value}%`
        : "barrière à vérifier";
    const sri = ext.riskScore ? `${ext.riskScore}/7` : "N/A";
    return `Produit ${isin}, indexé sur ${underlying}, coupon ${coupon}, protection en capital jusqu'à ${barrier}, SRI ${sri}.`;
  },

  checkGlobalConfidence(extraction) {
    const fields = ["isin", "coupon", "barrier", "nominal", "decrement"];
    const weights = fields
      .map((k) => this.confidenceWeight(extraction[k]?.confidence || "LOW"))
      .filter((v) => Number.isFinite(v));
    const score = weights.length
      ? Math.round(weights.reduce((a, b) => a + b, 0) / weights.length)
      : 0;
    const level = score >= 95 ? "CERTIFIED" : score >= 80 ? "HIGH" : "LOW";
    return { level, consensusPct: score };
  },

  generateReporting(docs, sourceRows = []) {
    const extraction = {
      isin: this.triangulate(docs, "isin"),
      underlying: this.extractUnderlying(docs),
      coupon: this.triangulate(docs, "coupon"),
      barrier: this.triangulate(docs, "barrier"),
      nominal: this.triangulate(docs, "nominal"),
      decrement: this.triangulate(docs, "decrement"),
      riskScore: this.extractSRI(docs.kid),
    };
    if (extraction.coupon?.value === null) {
      const sourceCoupon = sourceRows
        .map((s) =>
          StructuraCleaner.cleanPercentage(s?.data?.couponPct ?? s?.couponPct),
        )
        .find((v) => Number.isFinite(v));
      if (Number.isFinite(sourceCoupon))
        extraction.coupon = {
          value: sourceCoupon,
          confidence: "LOW",
          sources: ["EXTRACTOR"],
        };
    }
    if (extraction.barrier?.value === null) {
      const sourceBarrier = sourceRows
        .map((s) =>
          StructuraCleaner.cleanPercentage(
            s?.data?.barrierPct ?? s?.barrierPct,
          ),
        )
        .find((v) => Number.isFinite(v));
      if (Number.isFinite(sourceBarrier))
        extraction.barrier = {
          value: sourceBarrier,
          confidence: "LOW",
          sources: ["EXTRACTOR"],
        };
    }
    if (extraction.nominal?.value === null) {
      const sourceNominal = sourceRows
        .map((s) =>
          StructuraCleaner.cleanNominal(s?.data?.nominal ?? s?.nominal),
        )
        .find((v) => Number.isFinite(v) && v > 0);
      if (Number.isFinite(sourceNominal))
        extraction.nominal = {
          value: sourceNominal,
          confidence: "LOW",
          sources: ["EXTRACTOR"],
        };
    }
    if (extraction.decrement?.value === null) {
      const sourceDec = sourceRows
        .map((s) => Number(s?.data?.decrement ?? s?.decrement))
        .find((v) => Number.isFinite(v) && v > 0 && v <= 20);
      if (Number.isFinite(sourceDec))
        extraction.decrement = {
          value: sourceDec,
          confidence: "LOW",
          sources: ["EXTRACTOR"],
        };
    }
    extraction.underlying =
      chooseBestUnderlying(sourceRows, extraction.underlying) ||
      extraction.underlying ||
      null;
    if (!extraction.isin?.value) {
      const recovered = recoverISIN(sourceRows, [
        docs.ts || "",
        docs.kid || "",
        docs.bc || "",
      ]);
      if (recovered.value)
        extraction.isin = {
          value: recovered.value,
          confidence: "LOW",
          sources: [recovered.recoveryMethod],
        };
    }
    return {
      data: extraction,
      description: this.createSummary(extraction),
      status: this.checkGlobalConfidence(extraction),
    };
  },
};

const StructuraCleaner = {
  cleanISIN(text) {
    if (!text) return "";
    const m = String(text)
      .toUpperCase()
      .match(/\b([A-Z]{2}[A-Z0-9]{10})\b/);
    if (!m) return "";
    const KNOWN_PREFIXES = new Set([
      "FR",
      "DE",
      "LU",
      "GB",
      "US",
      "NL",
      "BE",
      "IT",
      "ES",
      "CH",
      "IE",
      "AT",
      "SE",
      "DK",
      "NO",
      "FI",
      "PT",
      "JP",
      "HK",
      "SG",
      "AU",
      "CA",
    ]);
    const isin = m[1];
    return KNOWN_PREFIXES.has(isin.slice(0, 2)) ? isin : "";
  },

  cleanProductName(name) {
    if (!name || typeof name !== "string") return "Produit non identifié";
    const NOISE_PATTERNS = [
      /R[ÉE]GLEMENTATION\s*/gi,
      /NOTICE\s*(D['']INFORMATION\s*)?/gi,
      /FINAL\s*TERMS?\s*/gi,
      /KEY\s*INFORMATION\s*DOCUMENT\s*/gi,
      /PROSPECTUS\s*(DE\s*BASE\s*)?/gi,
      /\bKID\b/gi,
      /\bFT\b/gi,
      /^\s*[-–—:]+\s*/,
      /\s*[-–—:]+\s*$/,
    ];
    let cleaned = NOISE_PATTERNS.reduce((s, p) => s.replace(p, " "), name);
    cleaned = cleaned.replace(/\s{2,}/g, " ").trim();
    return cleaned.length > 0 ? cleaned.slice(0, 120) : "Produit non identifié";
  },

  cleanPercentage(text) {
    if (text === null || text === undefined || text === "") return null;
    if (typeof text === "number") return Number.isFinite(text) ? text : null;
    const match = String(text)
      .replace(",", ".")
      .match(/([\d.]+)\s*%?/);
    if (!match) return null;
    const val = parseFloat(match[1]);
    return Number.isFinite(val) && val >= 0 && val <= 1000 ? val : null;
  },

  cleanNominal(text) {
    if (text === null || text === undefined || text === "") return null;
    if (typeof text === "number") return Number.isFinite(text) ? text : null;
    const raw = String(text).trim();
    const compact = raw.replace(/\s/g, "");
    const mMatch = compact.replace(",", ".").match(/([\d.]+)\s*[Mm][€$]?/);
    if (mMatch) {
      const mVal = parseFloat(mMatch[1]);
      return Number.isFinite(mVal) ? Math.round(mVal * 1000000) : null;
    }
    const numeric = compact
      .replace(/[A-Za-z€$]/g, "")
      .replace(/,/g, "")
      .replace(/\.(?=\d{3}\b)/g, "");
    const numMatch = numeric.match(/\d+/);
    if (!numMatch) return null;
    const val = parseInt(numMatch[0], 10);
    return val > 0 ? val : null;
  },

  cleanDate(text) {
    if (!text) return null;
    const s = String(text).trim();
    const MONTHS = {
      janvier: 1,
      fevrier: 2,
      février: 2,
      mars: 3,
      avril: 4,
      mai: 5,
      juin: 6,
      juillet: 7,
      aout: 8,
      août: 8,
      septembre: 9,
      octobre: 10,
      novembre: 11,
      decembre: 12,
      décembre: 12,
      january: 1,
      february: 2,
      march: 3,
      april: 4,
      may: 5,
      june: 6,
      july: 7,
      august: 8,
      september: 9,
      october: 10,
      november: 11,
      december: 12,
    };
    let m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
    if (m)
      return `${m[3]}-${String(m[2]).padStart(2, "0")}-${String(m[1]).padStart(2, "0")}`;
    m = s.match(/^(\d{1,2})\s+([A-Za-zÀ-ÿ]+)\s+(\d{4})$/);
    if (m) {
      const key = m[2].toLowerCase();
      const mo = MONTHS[key];
      if (mo)
        return `${m[3]}-${String(mo).padStart(2, "0")}-${String(m[1]).padStart(2, "0")}`;
    }
    m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) return s;
    return null;
  },

  cleanUnderlying(text) {
    if (!text) return null;
    const EXCLUDE =
      /sous-jacent\s*(non\s*d[ée]tect[ée])?|underlying|index|indice/gi;
    const cleaned = String(text)
      .replace(EXCLUDE, "")
      .replace(/\s{2,}/g, " ")
      .trim();
    return cleaned.length >= 2 ? cleaned : null;
  },

  CONFIDENCE: Object.freeze({
    MISSING: { level: 0, label: "Manquant", color: "#e05555" },
    LOW: { level: 1, label: "Faible", color: "#e8924a" },
    WARN: { level: 2, label: "Divergent", color: "#e8c87a" },
    CERTIFIED: { level: 3, label: "Certifie", color: "#4dbc80" },
  }),

  reconcile(field, sources, opts = {}) {
    const weights = opts.weights || {};
    const normalize =
      opts.normalize ||
      ((v) =>
        String(v ?? "")
          .trim()
          .toLowerCase());
    const entries = Object.entries(sources).filter(
      ([, v]) =>
        v !== null &&
        v !== undefined &&
        v !== "" &&
        v !== "Sous-jacent non détecté",
    );
    if (entries.length === 0) {
      return {
        field,
        value: null,
        status: "MISSING",
        confidence: this.CONFIDENCE.MISSING,
        votes: {},
        sources: {},
      };
    }

    const voteMap = new Map();
    for (const [src, raw] of entries) {
      const key = normalize(raw);
      const weight = weights[src] ?? 1;
      if (!voteMap.has(key))
        voteMap.set(key, { rawValue: raw, score: 0, sources: [] });
      const entry = voteMap.get(key);
      entry.score += weight;
      entry.sources.push(src);
    }

    const SOURCE_PRIORITY = ["ts", "kid", "bc", "prospectus"];
    let winner = null;
    for (const [, candidate] of voteMap) {
      if (!winner || candidate.score > winner.score) {
        winner = candidate;
        continue;
      }
      if (winner && candidate.score === winner.score) {
        const cPri = SOURCE_PRIORITY.indexOf(
          String(candidate.sources[0] || "").toLowerCase(),
        );
        const wPri = SOURCE_PRIORITY.indexOf(
          String(winner.sources[0] || "").toLowerCase(),
        );
        if (cPri !== -1 && (wPri === -1 || cPri < wPri)) winner = candidate;
      }
    }

    const totalSources = entries.length;
    const totalWeight = entries.reduce(
      (sum, [src]) => sum + (weights[src] ?? 1),
      0,
    );
    const consensusRatio = totalWeight > 0 ? winner.score / totalWeight : 0;
    const hasDivergence = voteMap.size > 1;
    let status = "WARN";
    if (!hasDivergence && totalSources >= 2) status = "CERTIFIED";
    else if (consensusRatio >= 0.6 && totalSources >= 2) status = "WARN";
    else if (totalSources === 1) status = "LOW";

    return {
      field,
      value: winner.rawValue,
      status,
      confidence: this.CONFIDENCE[status],
      votes: Object.fromEntries(
        [...voteMap.entries()].map(([k, v]) => [
          k,
          { score: v.score, sources: v.sources },
        ]),
      ),
      sources: Object.fromEntries(entries),
    };
  },

  reconcileProduct(multiSourceData, weightMap = {}) {
    const fields = new Set(
      Object.values(multiSourceData).flatMap((src) => Object.keys(src || {})),
    );
    const result = {};
    const CLEANER_MAP = {
      isin: (v) => this.cleanISIN(v),
      name: (v) => this.cleanProductName(v),
      nominal: (v) => this.cleanNominal(v),
      barrier: (v) => this.cleanPercentage(v),
      coupon: (v) => this.cleanPercentage(v),
      recall: (v) => this.cleanPercentage(v),
      maturity: (v) => this.cleanDate(v),
      underlying: (v) => this.cleanUnderlying(v),
    };
    for (const field of fields) {
      const sources = {};
      for (const [srcName, srcData] of Object.entries(multiSourceData)) {
        const raw = srcData?.[field];
        if (raw == null) continue;
        const cleaner = CLEANER_MAP[field];
        sources[srcName] = cleaner ? cleaner(raw) : String(raw).trim();
      }
      result[field] = this.reconcile(field, sources, { weights: weightMap });
    }
    return result;
  },
};

function buildConsensusReportingPayload(consensus, merged) {
  const c = consensus?.data || {};
  const status = consensus?.status || { level: "LOW", consensusPct: 0 };
  const barrier =
    c.barrier?.value !== null && c.barrier?.value !== undefined
      ? `${c.barrier.value}%`
      : null;
  const coupon =
    c.coupon?.value !== null && c.coupon?.value !== undefined
      ? `${c.coupon.value}% p.a.`
      : null;
  const decrement =
    c.decrement?.value !== null && c.decrement?.value !== undefined
      ? `${c.decrement.value} pts`
      : null;
  const sri = c.riskScore ? `${c.riskScore}/7` : "N/A";
  return {
    reporting_date: isoDate(new Date()),
    product_name: StructuraCleaner.cleanProductName(
      merged?.productName || `Produit ${c.underlying || ""}`.trim(),
    ),
    isin: StructuraCleaner.cleanISIN(c.isin?.value || merged?.isin || ""),
    features: {
      barrier: barrier || `${merged?.barrierPct || "N/A"}%`,
      coupon: coupon || `${merged?.couponPct || "N/A"}%`,
      risk_sri: sri,
      decrement:
        decrement || (merged?.decrement ? `${merged.decrement} pts` : "N/A"),
    },
    audit: {
      consensus_level: `${status.consensusPct || 0}%`,
      grade: merged?.grade || status.level || "LOW",
      warnings: merged?.alerts || [],
    },
    description: buildReportingDescription(merged, consensus),
  };
}

function buildReportingDescription(merged, consensus) {
  const parts = [];
  parts.push(
    `${merged?.type || "Produit structure"} emis par ${merged?.issuer || "emetteur non precise"}`,
  );
  if (
    merged?.underlying &&
    !/non\s*d[ée]tect[ée]/i.test(String(merged.underlying))
  )
    parts.push(`indexe sur ${merged.underlying}`);
  else parts.push("sous-jacent a identifier manuellement");

  if (Number.isFinite(Number(merged?.couponPct))) {
    const cp = Number(merged.couponPct);
    const annual =
      merged?.couponPeriod === "monthly" ? (cp * 12).toFixed(2) : cp.toFixed(3);
    parts.push(`coupon de ${annual}%/an`);
  }

  if (
    Number.isFinite(Number(merged?.barrierPct)) &&
    merged?.barrierFlag !== "SUSPECT_EQUALS_RECALL"
  ) {
    parts.push(
      `protection en capital jusqu'a une baisse de ${(100 - Number(merged.barrierPct)).toFixed(0)}%`,
    );
  } else if (merged?.barrierFlag === "SUSPECT_EQUALS_RECALL") {
    parts.push("barriere a verifier (valeur 100% suspecte)");
  }

  if (merged?.maturityDate) {
    const d = new Date(`${merged.maturityDate}T00:00:00`).toLocaleDateString(
      "fr-FR",
      { day: "numeric", month: "long", year: "numeric" },
    );
    parts.push(`echeance le ${d}`);
  }
  if (Number.isFinite(Number(merged?.nominal)))
    parts.push(`nominal ${Number(merged.nominal)}EUR`);
  const gradeLabel =
    { HIGH: "haute", MEDIUM: "moyenne", LOW: "faible" }[
      merged?.grade || "LOW"
    ] || "faible";
  parts.push(
    `(fiabilite ${gradeLabel} - ${consensus?.status?.consensusPct ?? 0}% de consensus)`,
  );
  return `${parts.join(", ")}.`;
}

const StructuraDescriptor = {
  inferProductType(fields) {
    const has = (k) =>
      fields[k]?.value != null && fields[k]?.status !== "MISSING";
    const val = (k) => fields[k]?.value ?? null;
    const hasRecall = has("recall");
    const hasCoupon = has("coupon");
    const hasBarrier = has("barrier");
    const hasLeverage =
      has("leverage") ||
      /levier|leverage|turbo|factor/i.test(String(val("name") ?? ""));
    const hasCapProtect =
      /garanti|protected|capital\s*(protege|prot[ée]g[ée]|protect)/i.test(
        String(val("name") ?? ""),
      );
    const hasPhoenix = /phoenix/i.test(String(val("name") ?? ""));
    const hasReverse = /reverse|convertible/i.test(String(val("name") ?? ""));

    if (hasLeverage)
      return {
        id: "LEVERAGE",
        label: "Certificat a effet de levier",
        family: "levier",
      };
    if (hasCapProtect)
      return {
        id: "CAP_GUAR",
        label: "Produit a capital garanti",
        family: "protection",
      };
    if (hasPhoenix && hasBarrier && hasCoupon)
      return {
        id: "PHOENIX",
        label: "Phoenix (Autocall conditionnel)",
        family: "autocall",
      };
    if (hasReverse && hasBarrier)
      return {
        id: "REVERSE",
        label: "Reverse Convertible",
        family: "rendement",
      };
    if (hasRecall && hasBarrier && hasCoupon)
      return { id: "AUTOCALL", label: "Autocall", family: "autocall" };
    if (hasBarrier && hasCoupon)
      return {
        id: "BARRIER_COUPON",
        label: "Produit a barriere avec coupon",
        family: "rendement",
      };
    if (hasCoupon && !hasBarrier)
      return {
        id: "BOND_LIKE",
        label: "Produit obligataire structure",
        family: "taux",
      };
    return { id: "UNKNOWN", label: "Produit structure", family: "inconnu" };
  },

  _get(fields, key, format = "raw", fallback = null) {
    const entry = fields[key];
    if (!entry || entry.status === "MISSING" || entry.value == null)
      return fallback;
    const v = entry.value;
    switch (format) {
      case "pct":
        return `${parseFloat(v).toFixed(1).replace(".0", "")}%`;
      case "nominal": {
        const n =
          typeof v === "number" ? v : parseFloat(String(v).replace(/\s/g, ""));
        if (!Number.isFinite(n)) return fallback;
        if (n >= 1000000)
          return `${(n / 1000000).toFixed(n % 1000000 === 0 ? 0 : 2)}M€`;
        if (n >= 1000) return `${(n / 1000).toFixed(0)}K€`;
        return `${n}€`;
      }
      case "date": {
        const d = new Date(`${v}T00:00:00`);
        if (Number.isNaN(d.getTime())) return String(v);
        return d.toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "long",
          year: "numeric",
        });
      }
      default:
        return String(v);
    }
  },

  _remainingDuration(fields) {
    const iso = fields.maturity?.value;
    if (!iso) return null;
    const maturity = new Date(`${iso}T00:00:00`);
    const now = new Date();
    if (maturity <= now) return null;
    const months = Math.round((maturity - now) / (1000 * 60 * 60 * 24 * 30.44));
    if (months < 2) return "moins d'un mois";
    if (months < 12) return `${months} mois`;
    const years = Math.floor(months / 12);
    const rem = months % 12;
    return rem > 0
      ? `${years} an${years > 1 ? "s" : ""} et ${rem} mois`
      : `${years} an${years > 1 ? "s" : ""}`;
  },

  _barrierDistance(fields) {
    const barrier = parseFloat(fields.barrier?.value);
    const spot = parseFloat(fields.spotLevel?.value);
    if (!Number.isFinite(barrier)) return null;
    if (!Number.isFinite(spot)) {
      return {
        pct: null,
        staticPct: barrier,
        label: `protection jusqu'a une baisse de ${(100 - barrier).toFixed(0)}%`,
        severity: "unknown",
      };
    }
    const distPct = ((spot - barrier) / spot) * 100;
    let severity = "safe";
    if (distPct < 0) severity = "breach";
    else if (distPct < 5) severity = "critical";
    else if (distPct < 15) severity = "warning";
    return {
      pct: distPct,
      staticPct: barrier,
      label:
        distPct < 0
          ? `barriere franchie (spot ${distPct.toFixed(1)}% en dessous du seuil)`
          : `a ${distPct.toFixed(1)}% au-dessus de la barriere`,
      severity,
    };
  },

  _buildShort(fields, type) {
    const g = (k, f, fb) => this._get(fields, k, f, fb);
    const emetteur = g("emetteur", "raw", "");
    const under = g("underlying", "raw", "sous-jacent non precise");
    const coupon = g("coupon", "pct", null);
    const barrier = g("barrier", "pct", null);
    const maturity = fields.maturity?.value
      ? new Date(`${fields.maturity.value}T00:00:00`).toLocaleDateString(
          "fr-FR",
          { month: "short", year: "numeric" },
        )
      : null;
    const parts = [
      `${type.label}${emetteur ? ` ${emetteur}` : ""}`,
      `sur ${under}`,
      coupon ? `coupon ${coupon}/an` : null,
      barrier ? `protection ${barrier}` : null,
      maturity ? `maturite ${maturity}` : null,
    ].filter(Boolean);
    return parts.join(" - ");
  },

  _buildFull(fields, type, duration) {
    const g = (k, f, fb) => this._get(fields, k, f, fb);
    const underRaw = fields.underlying?.value;
    const under = underRaw
      ? StructuraCleaner.cleanUnderlying(underRaw) || "le sous-jacent"
      : "le sous-jacent (non identifie - verification requise)";
    const coupon = g("coupon", "pct", null);
    const barrier = g("barrier", "pct", null);
    const recall = g("recall", "pct", null);
    const nominal = g("nominal", "nominal", null);
    const maturity = g("maturity", "date", null);
    const emetteur = g("emetteur", "raw", null);
    const freq = g("couponFreq", "raw", "periodiquement");
    const isin = g("isin", "raw", null);
    const dist = this._barrierDistance(fields);
    const remain = duration;
    const intro = [
      `Ce ${type.label}`,
      emetteur ? `emis par ${emetteur}` : null,
      isin ? `(${isin})` : null,
      `porte sur ${under}.`,
    ]
      .filter(Boolean)
      .join(" ");

    const bodies = {
      autocall: [
        coupon && barrier
          ? `Il verse un coupon de ${coupon}/an ${freq} tant que ${under} se maintient au-dessus de ${barrier} du niveau initial.`
          : null,
        recall
          ? `A chaque date d'observation, si ${under} atteint ou depasse ${recall} du niveau initial, le produit est rappele automatiquement.`
          : null,
      ],
      rendement: [
        coupon ? `Il distribue un coupon fixe de ${coupon}/an ${freq}.` : null,
        barrier
          ? `La protection s'applique si ${under} ne chute pas de plus de ${(100 - parseFloat(barrier)).toFixed(0)}%.`
          : null,
      ],
      protection: [
        `Le capital investi${nominal ? ` (${nominal})` : ""} est protege a l'echeance.`,
        coupon
          ? `Le produit genere un rendement conditionnel de ${coupon}/an.`
          : `La performance est liee a la hausse de ${under}.`,
      ],
      levier: [
        `Il offre une exposition amplifiee a la performance de ${under}.`,
        barrier ? `La barriere desactivante est fixee a ${barrier}.` : null,
      ],
      taux: [
        coupon
          ? `Il genere un rendement fixe de ${coupon}/an, verse ${freq}.`
          : null,
      ],
      inconnu: [
        "Les informations disponibles ne permettent pas de caracteriser precisement ce produit.",
      ],
    };

    const conclusion = [
      maturity || remain
        ? `La maturite finale est fixee${maturity ? ` au ${maturity}` : ""}${remain ? ` (dans ${remain})` : ""}.`
        : null,
      dist?.severity === "breach"
        ? "[!] La barriere de protection est actuellement franchie."
        : null,
      dist?.severity === "critical"
        ? `[!] Le sous-jacent est tres proche de la barriere (${dist.label}).`
        : null,
      nominal ? `Le nominal de reference est de ${nominal}.` : null,
    ]
      .filter(Boolean)
      .join(" ");

    const bodyLines = (bodies[type.family] ?? bodies.inconnu).filter(Boolean);
    return [intro, ...bodyLines, conclusion].filter(Boolean).join(" ");
  },

  _buildBullets(fields, type, dist, duration) {
    const g = (k, f, fb) => this._get(fields, k, f, fb);
    const status = (k) => fields[k]?.confidence?.label ?? null;
    const bullets = [];
    const push = (icon, label, value, key) => {
      if (value == null) return;
      bullets.push({
        icon,
        label,
        value,
        confidence: key ? status(key) : null,
      });
    };
    push("◈", "Type de produit", type.label);
    push("◎", "Sous-jacent", g("underlying", "raw"), "underlying");
    push("◎", "ISIN", g("isin", "raw"), "isin");
    push("◎", "Emetteur", g("emetteur", "raw"), "emetteur");
    push("◈", "Nominal", g("nominal", "nominal"), "nominal");
    push("◈", "Coupon annuel", g("coupon", "pct"), "coupon");
    push("◈", "Frequence de coupon", g("couponFreq", "raw"), "couponFreq");
    push("◈", "Niveau de rappel", g("recall", "pct"), "recall");
    push("◈", "Barriere de protection", g("barrier", "pct"), "barrier");
    push("◈", "Maturite", g("maturity", "date"), "maturity");
    if (duration)
      bullets.push({ icon: "◈", label: "Duree restante", value: duration });
    if (dist?.label)
      bullets.push({
        icon: "◈",
        label: "Distance barriere",
        value: dist.label,
      });
    push("◎", "Notation emetteur", g("rating", "raw"), "rating");
    return bullets;
  },

  _buildWarnings(fields, type) {
    const warnings = [];
    const REQUIRED_BY_TYPE = {
      AUTOCALL: [
        "isin",
        "underlying",
        "coupon",
        "barrier",
        "recall",
        "maturity",
      ],
      PHOENIX: [
        "isin",
        "underlying",
        "coupon",
        "barrier",
        "recall",
        "maturity",
      ],
      REVERSE: ["isin", "underlying", "coupon", "barrier", "maturity"],
      CAP_GUAR: ["isin", "underlying", "maturity", "nominal"],
      LEVERAGE: ["isin", "underlying", "barrier"],
      BARRIER_COUPON: ["isin", "underlying", "coupon", "barrier"],
      BOND_LIKE: ["isin", "coupon", "maturity"],
      UNKNOWN: ["isin", "underlying"],
    };
    const required = REQUIRED_BY_TYPE[type.id] ?? REQUIRED_BY_TYPE.UNKNOWN;
    for (const key of required) {
      const entry = fields[key];
      if (!entry || entry.status === "MISSING")
        warnings.push({
          level: "error",
          field: key,
          message: `Champ obligatoire manquant: "${key}"`,
        });
      else if (entry.status === "WARN")
        warnings.push({
          level: "warning",
          field: key,
          message: `Divergence entre sources sur "${key}" - valeur retenue: ${entry.value}`,
        });
      else if (entry.status === "LOW")
        warnings.push({
          level: "info",
          field: key,
          message: `"${key}" issu d'une seule source - non verifie`,
        });
    }
    if (type.id === "UNKNOWN")
      warnings.push({
        level: "warning",
        field: "type",
        message:
          "Type de produit non identifie automatiquement - verification manuelle recommandee",
      });
    return warnings;
  },

  describe(reconciledFields) {
    const fields = reconciledFields ?? {};
    const type = this.inferProductType(fields);
    const dist = this._barrierDistance(fields);
    const duration = this._remainingDuration(fields);
    const values = Object.values(fields);
    const total = Object.keys(fields).length;
    const certified = values.filter((f) => f?.status === "CERTIFIED").length;
    return {
      type,
      short: this._buildShort(fields, type),
      full: this._buildFull(fields, type, duration),
      bullets: this._buildBullets(fields, type, dist, duration),
      warnings: this._buildWarnings(fields, type),
      meta: {
        generatedAt: new Date().toISOString(),
        fieldCount: total,
        certifiedCount: certified,
        missingCount: values.filter((f) => f?.status === "MISSING").length,
        overallQuality:
          total === 0
            ? "empty"
            : certified / total >= 0.8
              ? "high"
              : certified / total >= 0.5
                ? "medium"
                : "low",
      },
    };
  },
};

function buildDescriptorInputFromSources(consolidated, fallback = {}) {
  const out = {};
  const mapping = { TS: "ts", KID: "kid", BROCHURE: "bc" };
  const sources = consolidated?.sources || [];
  sources.forEach((src) => {
    const key = mapping[src.docType] || String(src.docType || "").toLowerCase();
    if (!key) return;
    out[key] = {
      isin: src.isin || null,
      name: src.productName || null,
      nominal: src.nominal ?? null,
      barrier: src.barrierPct ?? null,
      coupon: src.couponPct ?? null,
      recall: src.recallPct ?? null,
      maturity: src.maturityDate || null,
      underlying: src.underlying || null,
      emetteur: src.issuer || null,
      couponFreq: src.couponPeriod || null,
      rating: src.rating || null,
      spotLevel: src.level || null,
      leverage: src.leverage || null,
    };
  });
  const enrich = {
    isin: fallback.isin || null,
    underlying: fallback.underlying || null,
    barrier: fallback.barrierPct ?? null,
    coupon: fallback.couponPct ?? null,
    recall: fallback.recallPct ?? null,
    maturity: fallback.maturityDate || null,
    nominal: fallback.nominal ?? null,
    emetteur: fallback.issuer || null,
    name: fallback.productName || null,
    couponFreq: fallback.couponPeriod || null,
    spotLevel: fallback.spotLevel ?? null,
  };
  const targetKey = out.ts ? "ts" : out.kid ? "kid" : out.bc ? "bc" : "bc";
  if (!out[targetKey]) out[targetKey] = {};
  Object.entries(enrich).forEach(([k, v]) => {
    if (
      (out[targetKey][k] === null ||
        out[targetKey][k] === undefined ||
        out[targetKey][k] === "") &&
      v !== null &&
      v !== undefined &&
      v !== ""
    ) {
      out[targetKey][k] = v;
    }
  });
  return out;
}

const ExtractionEngine = {
  limits: {
    barrier: { min: 30, max: 100 },
    coupon: { min: 0.1, max: 25 },
    nominal: [100, 1000, 10000, 100000],
  },

  cleanPct(val) {
    if (val === null || val === undefined || val === "") return null;
    const n = parseFloat(
      String(val)
        .replace(",", ".")
        .replace(/[^\d.]/g, ""),
    );
    return Number.isFinite(n) ? n : null;
  },

  reconcile(field, sources) {
    const get = (t) => sources.find((s) => s.docType === t)?.data?.[field];
    const ts = get("TS");
    const kid = get("KID");
    const bc = get("BROCHURE");
    const chosen = ts ?? kid ?? bc ?? "";
    let status = "ok";
    if (
      (ts === undefined || ts === "") &&
      (kid === undefined || kid === "") &&
      (bc === undefined || bc === "")
    ) {
      return { value: null, status: "warn" };
    }

    if (ts !== undefined && bc !== undefined && ts !== "" && bc !== "") {
      const tsv = this.cleanPct(ts);
      const bcv = this.cleanPct(bc);
      if (tsv !== null && bcv !== null) {
        if (Math.abs(tsv - bcv) > 0.01) status = "bad";
      } else if (String(ts).trim() !== String(bc).trim()) {
        status = "bad";
      }
    } else if (
      (ts === undefined || ts === "") &&
      kid &&
      bc &&
      String(kid).trim() !== String(bc).trim()
    ) {
      status = "warn";
    }

    return { value: chosen, status };
  },

  validate(data) {
    const alerts = [];
    const b = this.cleanPct(data.barrierPct);
    if (
      b !== null &&
      (b < this.limits.barrier.min || b >= this.limits.barrier.max)
    ) {
      alerts.push(`Barrière détectée (${b}%) hors normes standards.`);
    }
    const c = this.cleanPct(data.couponPct);
    if (c !== null && (c < 0.5 || c > this.limits.coupon.max)) {
      alerts.push(
        "Coupon détecté très faible : suspicion de fréquence quotidienne/mensuelle.",
      );
    }
    const n = this.cleanPct(data.nominal);
    if (n !== null && n > 100000) {
      alerts.push(
        `Nominal unitaire suspect (${n}) : possible confusion avec montant d'émission.`,
      );
    }
    return alerts;
  },
};

function processFinalExtraction(extractedSources) {
  const normalizedSources = (extractedSources || []).map((s) => ({
    ...s,
    data: normalizeSourceFields(s.data || {}),
  }));
  const fields = [
    "isin",
    "issuer",
    "underlying",
    "couponPct",
    "couponPeriod",
    "barrierPct",
    "barrierType",
    "recallPct",
    "nominal",
    "maturityDate",
    "decrement",
    "productName",
    "type",
    "hasMemory",
  ];
  const merged = { extractionScore: 0, alerts: [] };
  const compareRows = [];

  fields.forEach((f) => {
    const result = ExtractionEngine.reconcile(f, normalizedSources);
    let chosen = result.value;
    let status = result.status;

    if (
      f === "underlying" &&
      /sous-jacent\s*non\s*d[ée]tect[ée]/i.test(String(chosen || ""))
    ) {
      chosen = null;
      status = "warn";
    }

    // Keep numeric barrier and attach a flag instead of replacing by string.
    if (f === "barrierPct") {
      const checked = validateBarrier(chosen, merged.alerts);
      chosen = checked.value;
      merged.barrierFlag = checked.flag;
      if (checked.flag) status = "warn";
    }

    // Sanity Gate nominal unitaire
    if (f === "nominal") {
      const n = ExtractionEngine.cleanPct(chosen);
      if (n !== null && n > 100000) {
        const kid = normalizedSources.find((s) => s.docType === "KID")?.data
          ?.nominal;
        const kidN = ExtractionEngine.cleanPct(kid);
        chosen = kidN !== null && kidN <= 100000 ? kid : 1000;
        status = "bad";
      }
    }
    if (f === "decrement") {
      const d = Number(chosen);
      if (Number.isFinite(d) && (d <= 0 || d > 20)) {
        merged.alerts.push({
          level: "warning",
          field: "decrement",
          message: `decrement=${d} hors plage attendue [0-20]`,
        });
        chosen = null;
        status = "warn";
      }
    }

    merged[f] = chosen;
    compareRows.push({
      field: f,
      chosen,
      status,
      values: normalizedSources
        .map((s) => s.data?.[f])
        .filter((v) => v !== undefined && v !== null && v !== ""),
    });
    if (status === "bad")
      merged.alerts.push(`CONFLIT CRITIQUE : ${f} diverge entre les sources.`);
  });

  merged.features = [
    ...new Set(
      normalizedSources.flatMap((s) =>
        Array.isArray(s.data?.features) ? s.data.features : [],
      ),
    ),
  ];
  merged.sources = normalizedSources.length;
  merged.underlying =
    chooseBestUnderlying(normalizedSources, merged.underlying) || null;
  const recoveredIsin = recoverISIN(normalizedSources);
  if (!merged.isin && recoveredIsin.value) {
    merged.isin = recoveredIsin.value;
    merged.isinRecoveryMethod = recoveredIsin.recoveryMethod;
  }
  let score = 50;
  compareRows.forEach((r) => {
    if (r.status === "ok") score += 4;
    if (r.status === "warn") score -= 2;
    if (r.status === "bad") score -= 8;
    if (r.field === "barrierPct") {
      const b = ExtractionEngine.cleanPct(merged.barrierPct);
      if (b === 60) score += 50;
      if (b === 100 || (b !== null && b < 30)) score -= 100;
    }
  });
  merged.extractionScore = Math.max(0, Math.min(100, Math.round(score)));
  if ((merged.sources || 0) < 2)
    merged.extractionScore = Math.min(merged.extractionScore, 75);
  merged.alerts = [...merged.alerts, ...ExtractionEngine.validate(merged)];

  return {
    data: merged,
    compare: compareRows,
    alerts: merged.alerts,
    sources: normalizedSources.map((s) => ({ ...s.data, docType: s.docType })),
  };
}

function renderCompareTable(compare, extractions, consensus) {
  const el = document.getElementById("ing-compare");
  if (!el) return;
  el.style.display = "block";
  const sourceLabel = extractions
    .map((e, i) => `${i + 1}:${e.docType}`)
    .join(" | ");
  const rows = compare
    .map(
      (r) => `<tr>
    <td>${r.field}</td>
    <td>${r.values.map((v) => (typeof v === "number" ? v : String(v))).join("  /  ") || "-"}</td>
    <td><strong>${typeof r.chosen === "number" ? r.chosen : r.chosen || "-"}</strong></td>
    <td class="${r.status === "ok" ? "st-ok" : r.status === "warn" ? "st-warn" : "st-bad"}">${r.status.toUpperCase()}</td>
  </tr>`,
    )
    .join("");
  const badge = (s) =>
    `<span style="display:inline-block;margin-right:4px;padding:2px 6px;border:1px solid var(--border2);background:var(--s3);font-size:9px;color:var(--text2);">${s}</span>`;
  const cs = consensus?.data || {};
  const consensusRows = [
    ["ISIN", cs.isin],
    ["Coupon", cs.coupon],
    ["Barrière", cs.barrier],
    ["Nominal", cs.nominal],
    ["Decrement", cs.decrement],
  ]
    .map(([label, item]) => {
      const value = item?.value ?? "N/A";
      const conf = item?.confidence || "LOW";
      const sources = (item?.sources || []).map(badge).join("") || badge("N/A");
      return `<tr><td>${label}</td><td>${value}</td><td class="${conf === "CERTIFIED" ? "st-ok" : conf === "HIGH" ? "st-warn" : "st-bad"}">${conf}</td><td>${sources}</td></tr>`;
    })
    .join("");
  const consensusBlock = consensus
    ? `
    <div style="margin:10px 0 8px 0;color:var(--gold);font-size:10px;letter-spacing:.5px;">
      Consensus 360°: ${consensus.status?.consensusPct || 0}% (${consensus.status?.level || "LOW"})
    </div>
    <table><thead><tr><th>Champ</th><th>Valeur</th><th>Confiance</th><th>Sources validées</th></tr></thead><tbody>${consensusRows}</tbody></table>
  `
    : "";
  el.innerHTML = `<div style="margin-bottom:8px;color:var(--text3);">Sources: ${sourceLabel}</div>
  <table><thead><tr><th>Champ</th><th>Valeurs trouvées</th><th>Retenu</th><th>Statut</th></tr></thead><tbody>${rows}</tbody></table>${consensusBlock}`;
}

function setIngestionAddButton(enabled) {
  const btn = document.getElementById("btn-add-product");
  if (!btn) return;
  btn.disabled = !enabled;
  btn.style.opacity = enabled ? "1" : "0.5";
  btn.textContent = enabled
    ? "Ajouter ce produit au portefeuille"
    : "Ajouter ce produit au portefeuille";
}

function getIngestionLearningMemory() {
  try {
    return JSON.parse(localStorage.getItem("structura_ingestion_learning") || "[]");
  } catch (_) {
    return [];
  }
}

function updateIngestionLearningUI() {
  const el = document.getElementById("ing-learn-count");
  if (!el) return;
  const memory = getIngestionLearningMemory();
  el.textContent = memory.length
    ? `${memory.length} document${memory.length > 1 ? "s" : ""} appris`
    : "Mémoire locale";
}

function rememberIngestionSample(payload = {}) {
  if (typeof localStorage === "undefined") return;
  const merged = payload.merged || {};
  const memory = getIngestionLearningMemory();
  const knownKey = [merged.isin, merged.productName, merged.productFamily]
    .filter(Boolean)
    .join("|");
  const sample = {
    learnedAt: new Date().toISOString(),
    key: knownKey || `doc-${Date.now()}`,
    productFamily: merged.productFamily || merged.characteristics?.productFamily || null,
    type: merged.type || null,
    issuer: merged.issuer || null,
    isin: merged.isin || null,
    fields: {
      couponPct: merged.couponPct ?? null,
      barrierPct: merged.barrierPct ?? null,
      recallPct: merged.recallPct ?? null,
      maturityDate: merged.maturityDate || null,
      decrement: merged.decrement ?? null,
      hasMemory: merged.hasMemory ?? null,
    },
    confidence: {
      grade: merged.grade || null,
      consensusPct: payload.consensus?.status?.consensusPct || null,
      alerts: (payload.alerts || []).length,
    },
    sourceProfile: (payload.rawDocuments || []).map((doc) => doc.docType),
  };
  const next = [sample, ...memory.filter((item) => item.key !== sample.key)].slice(0, 200);
  localStorage.setItem("structura_ingestion_learning", JSON.stringify(next));
  updateIngestionLearningUI();
}

async function readUploadedDocumentText(file) {
  const name = (file.name || "").toLowerCase();
  if (name.endsWith(".pdf")) {
    const pdfEngine = window.pdfjsLib || window["pdfjs-dist/build/pdf"];
    if (!pdfEngine) throw new Error("pdf.js non chargé");
    if (pdfEngine.GlobalWorkerOptions)
      pdfEngine.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
    const bytes = await file.arrayBuffer();
    const pdf = await pdfEngine.getDocument({ data: bytes }).promise;
    let out = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const rows = new Map();
      content.items.forEach((item) => {
        const y = Math.round((item.transform?.[5] || 0) / 3) * 3;
        const x = item.transform?.[4] || 0;
        if (!rows.has(y)) rows.set(y, []);
        rows.get(y).push({ x, text: item.str || "" });
      });
      const pageText = [...rows.entries()]
        .sort((a, b) => b[0] - a[0])
        .map(([, items]) =>
          items
            .sort((a, b) => a.x - b.x)
            .map((item) => item.text)
            .join(" ")
            .replace(/\s{2,}/g, " ")
            .trim(),
        )
        .filter(Boolean)
        .join("\n");
      out += `\n--- PAGE ${i} ---\n${pageText}\n`;
    }
    return out;
  }
  return file.text();
}

async function extractFromDocument() {
  const files = Array.from(document.getElementById("ing-file")?.files || []);
  if (!files.length) {
    notify("Ajoutez au moins un document", "err");
    return;
  }
  setIngestionAddButton(false);
  const mode = document.getElementById("ing-mode")?.value || "balanced";
  const template = document.getElementById("ing-template")?.value || "auto";
  try {
    const docs = { TERM_SHEET: "", BROCHURE: "", KID: "" };
    const extractions = [];
    const rejectedDocs = [];
    for (const file of files) {
      const text = await readUploadedDocumentText(file);
      const docType = inferDocType(file.name, text);
      ingestTermSheet(file.name);
      const _kvRaw =
        typeof SmartTableParser !== "undefined"
          ? SmartTableParser.parseKV(text)
          : {};
      const _kvHints =
        typeof SmartTableParser !== "undefined"
          ? SmartTableParser.extractFromKV(_kvRaw)
          : {};
      const _schedule =
        typeof SmartTableParser !== "undefined"
          ? SmartTableParser.detectObservationSchedule(text)
          : [];
      const parsed = normalizeSourceFields(
        regexExtractFromText(text, { docType, template, kvHints: _kvHints }),
      );
      if (_schedule.length) parsed.scheduleData = _schedule;
      const classification = classifyDocument(text, parsed);
      extractions.push({
        ...parsed,
        docType,
        fileName: file.name,
        documentKind: classification.kind,
        documentEligible: classification.eligible,
        documentEvidence: classification.evidence,
      });
      if (!classification.eligible) {
        rejectedDocs.push({ fileName: file.name, docType, ...classification });
        continue;
      }
      if (docType !== "UNKNOWN" && !docs[docType]) docs[docType] = text;
    }
    if (!docs.TERM_SHEET && !docs.BROCHURE && !docs.KID) {
      renderIngestionStory({
        empty: true,
        message: `Aucun document produit-spécifique exploitable détecté. ${rejectedDocs.length ? `Les ${rejectedDocs.length} document(s) fournis semblent génériques ou hors périmètre.` : ""}`,
      });
      document.getElementById("ing-output").textContent = JSON.stringify(
        { rejectedDocs, analysed: extractions },
        null,
        2,
      );
      document.getElementById("ing-compare").innerHTML =
        `<div style="color:var(--orange);">Aucun document produit-specifique exploitable detecte. Les documents fournis semblent generiques ou non pertinents.</div>`;
      document.getElementById("ing-compare").style.display = "block";
      notify("Aucun document produit-specifique exploitable detecte", "err");
      return;
    }
    const consolidated = consolidateAllSources(
      docs.TERM_SHEET,
      docs.BROCHURE,
      docs.KID,
      { template, mode },
    );
    const consensus = StructuraEngine.generateReporting(
      { ts: docs.TERM_SHEET, kid: docs.KID, bc: docs.BROCHURE },
      consolidated.sources || [],
    );
    const rawDocuments = Object.entries(docs)
      .filter(([, text]) => !!text)
      .map(([docType, text]) => ({ docType, text }));
    const { data: merged, compare } = consolidated;
    if (!docs.TERM_SHEET && !docs.BROCHURE && !docs.KID) {
      const fallbackSources = extractions.map((e) => ({
        docType: "BROCHURE",
        data: e,
      }));
      const fallback = processFinalExtraction(fallbackSources);
      extractedDocumentData = fallback.data;
      APP_RUNTIME.extractedDocumentData = extractedDocumentData;
      if (!fallback.data.isin && consensus?.data?.isin?.value)
        fallback.data.isin = consensus.data.isin.value;
      if (!fallback.data.underlying)
        fallback.data.underlying =
          cleanUnderlyingCandidate(consensus?.data?.underlying) || null;
      if (
        (fallback.data.barrierPct === null ||
          fallback.data.barrierPct === undefined) &&
        Number.isFinite(Number(consensus?.data?.barrier?.value))
      ) {
        fallback.data.barrierPct = Number(consensus.data.barrier.value);
      }
      if (
        (fallback.data.decrement === null ||
          fallback.data.decrement === undefined) &&
        Number.isFinite(Number(consensus?.data?.decrement?.value))
      ) {
        fallback.data.decrement = Number(consensus.data.decrement.value);
      }
      const reconciled = StructuraCleaner.reconcileProduct(
        buildDescriptorInputFromSources(
          {
            sources:
              fallback.sources ||
              fallbackSources.map((s) => ({ ...s.data, docType: s.docType })),
          },
          fallback.data,
        ),
        { ts: 3, kid: 2, bc: 1 },
      );
      const descriptor = StructuraDescriptor.describe(reconciled);
      const criticalMissing = ["underlying", "isin"].filter(
        (k) => reconciled?.[k]?.status === "MISSING",
      );
      const ratio = descriptor?.meta?.fieldCount
        ? descriptor.meta.certifiedCount / descriptor.meta.fieldCount
        : 0;
      fallback.data.grade = computeGrade(
        consensus?.status?.consensusPct || 0,
        ratio,
        criticalMissing,
        fallback.data.sources || 1,
      );
      const intelligence = buildStructuredProductIntelligence({
        rawDocuments,
        merged: fallback.data,
        descriptor,
        consensus,
        alerts: fallback.alerts,
        reconciled,
      });
      const reporting = buildConsensusReportingPayload(
        consensus,
        fallback.data,
      );
      extractedDocumentData.productDescription =
        intelligence.retailText || descriptor.full;
      renderIngestionStory({
        merged: fallback.data,
        descriptor,
        consensus,
        alerts: fallback.alerts,
        intelligence,
      });
      rememberIngestionSample({
        merged: fallback.data,
        consensus,
        alerts: fallback.alerts,
        rawDocuments,
      });
      renderCompareTable(
        fallback.compare,
        fallback.sources ||
          fallbackSources.map((s) => ({ ...s.data, docType: s.docType })),
        consensus,
      );
      document.getElementById("ing-output").textContent = JSON.stringify(
        {
          merged: fallback.data,
          reporting,
          descriptor,
          intelligence,
          reconciled,
          consensus,
          sources: fallback.sources,
          compare: fallback.compare,
          alerts: fallback.alerts,
          rejectedDocs,
        },
        null,
        2,
      );
      setIngestionAddButton(true);
      notify(
        `Extraction terminee (grade ${fallback.data.grade || "LOW"})`,
        "ok",
      );
      return;
    }
    extractedDocumentData = merged;
    APP_RUNTIME.extractedDocumentData = extractedDocumentData;
    if (!merged.isin && consensus?.data?.isin?.value)
      merged.isin = consensus.data.isin.value;
    if (!merged.underlying)
      merged.underlying =
        cleanUnderlyingCandidate(consensus?.data?.underlying) || null;
    if (
      (merged.barrierPct === null || merged.barrierPct === undefined) &&
      Number.isFinite(Number(consensus?.data?.barrier?.value))
    ) {
      merged.barrierPct = Number(consensus.data.barrier.value);
    }
    if (
      (merged.decrement === null || merged.decrement === undefined) &&
      Number.isFinite(Number(consensus?.data?.decrement?.value))
    ) {
      merged.decrement = Number(consensus.data.decrement.value);
    }
    compare.forEach((r) => {
      if (r.field === "isin" && !r.chosen && merged.isin)
        r.chosen = merged.isin;
      if (r.field === "underlying" && !r.chosen && merged.underlying)
        r.chosen = merged.underlying;
    });
    const reconciled = StructuraCleaner.reconcileProduct(
      buildDescriptorInputFromSources(consolidated, merged),
      { ts: 3, kid: 2, bc: 1 },
    );
    const descriptor = StructuraDescriptor.describe(reconciled);
    const criticalMissing = ["underlying", "isin"].filter(
      (k) => reconciled?.[k]?.status === "MISSING",
    );
    const ratio = descriptor?.meta?.fieldCount
      ? descriptor.meta.certifiedCount / descriptor.meta.fieldCount
      : 0;
    merged.grade = computeGrade(
      consensus?.status?.consensusPct || 0,
      ratio,
      criticalMissing,
      merged.sources || 1,
    );
    const intelligence = buildStructuredProductIntelligence({
      rawDocuments,
      merged,
      descriptor,
      consensus,
      alerts: consolidated.alerts,
      reconciled,
    });
    const reporting = buildConsensusReportingPayload(consensus, merged);
    extractedDocumentData.productDescription =
      intelligence.retailText || descriptor.full;
    renderIngestionStory({
      merged,
      descriptor,
      consensus,
      alerts: consolidated.alerts,
      intelligence,
    });
    rememberIngestionSample({
      merged,
      consensus,
      alerts: consolidated.alerts,
      rawDocuments,
    });
    renderCompareTable(compare, consolidated.sources || extractions, consensus);
    document.getElementById("ing-output").textContent = JSON.stringify(
      {
        merged,
        reporting,
        descriptor,
        intelligence,
        reconciled,
        consensus,
        sources: consolidated.sources,
        compare,
        alerts: consolidated.alerts,
        rejectedDocs,
      },
      null,
      2,
    );
    setIngestionAddButton(true);
    const badCount = compare.filter((c) => c.status === "bad").length;
    notify(
      `Extraction + consensus termines (grade ${merged.grade || "LOW"}, ${badCount} conflit(s) majeur(s), ${rejectedDocs.length} doc(s) rejetes)`,
      "ok",
    );
  } catch (e) {
    notify(`Erreur extraction: ${e.message}`, "err");
  }
}

function addExtractedProductToPortfolio() {
  if (!extractedDocumentData) {
    notify("Aucune extraction disponible", "err");
    return;
  }
  const x = extractedDocumentData;
  const id = Math.max(0, ...PRODUCTS.map((p) => Number(p.id) || 0)) + 1;
  const canonical = globalThis.StructuraProductSchema?.fromExtraction?.(x, {
    provider: "structura-local-extractor",
    keepRaw: false,
  });
  if (canonical && !canonical.quality.isImportable) {
    notify(`Import bloqué: ${canonical.quality.errors.join(" ")}`, "err");
    return;
  }
  const _spotEntry =
    typeof MarketDataStore !== "undefined"
      ? MarketDataStore.get(x.underlying || "")
      : null;
  const initialSpot = _spotEntry ? _spotEntry.vl : null;
  const p = canonical
    ? globalThis.StructuraProductSchema.canonicalToPortfolioProduct(canonical, {
        id,
        helpers: { isoDate, addMonths, addYears },
        normalizeProduct,
      })
    : normalizeProduct({
        id,
        name:
          x.productName ||
          [x.type || "", x.underlying || ""].filter(Boolean).join(" ").trim() ||
          "Produit Structuré",
        isin: x.isin || "",
        type: getTypeCode(x.type),
        emetteur: x.issuer || "Non renseigné",
        nominal: Number(x.nominal) || 1000000,
        val: Number(x.nominal) || 1000000,
        coupon: Number(x.couponPct || 0) > 0 ? `${Number(x.couponPct).toFixed(2)}%` : "0.00%",
        cpnNum: Number(x.couponPct || 0),
        barrier: x.barrierPct != null ? Number(x.barrierPct) : null,
        maturity: x.maturityDate || isoDate(addYears(new Date(), 2)),
        underlying: x.underlying || "N/A",
        nextEvt: "Prochaine observation",
        nextEvtDate: isoDate(addMonths(new Date(), 1)),
        dataQuality: "extracted",
      });
  p.initialSpot = initialSpot;
  p.origin = "user";
  p.dataQuality = "extracted";
  PRODUCTS.unshift(p);
  saveProducts();
  renderPf();
  updateAppModeUI();
  notify(
    `Produit ajouté: ${p.name} (${p.type || "?"}, ${x.isin || "ISIN inconnu"})`,
    "ok",
  );
}

// ===================== CALCUL DYNAMIQUE DES DISTANCES =====================
/**
 * Recalcule la distance à la barrière pour tous les produits réels
 * à partir des VL courantes du MarketDataStore.
 * Nécessite que le produit ait : initialSpot, barrier, underlying.
 * dist = (currentSpot / barrierLevel - 1) × 100
 */
function refreshDistancesFromMarketData() {
  if (typeof MarketDataStore === "undefined") return 0;
  const products = activeProducts().filter(
    (p) => p.type !== "CG" && p.initialSpot && p.barrier && p.underlying,
  );
  if (!products.length) return 0;
  let updated = 0;
  products.forEach((p) => {
    const mEntry = MarketDataStore.get(p.underlying);
    if (!mEntry || !Number.isFinite(mEntry.vl) || mEntry.vl <= 0) return;
    const barrierLevel = (p.initialSpot * p.barrier) / 100;
    if (barrierLevel <= 0) return;
    const dist = (mEntry.vl / barrierLevel - 1) * 100;
    p.dist = Number(dist.toFixed(2));
    p.barrierLevel = Math.round(barrierLevel * 100) / 100;
    p.st = statusFromDist(p.dist, p.type);
    updated++;
  });
  if (updated > 0) {
    saveProducts();
    renderDashboardSummary();
    if (APP_RUNTIME.currentView === "portfolio") renderPf();
    if (APP_RUNTIME.currentView === "barriers") renderBarriers();
  }
  return updated;
}

// ===================== ONBOARDING =====================
async function runOnboarding() {
  await extractFromDocument();
}

function addOnboardedProduct() {
  addExtractedProductToPortfolio();
}

// ===================== INIT =====================
if (typeof document !== "undefined") {
  updateAppModeUI();
  renderSessionChrome?.();
  renderAlerts();
  renderEvents();
  drawPerfChart();
  renderDashboardModules();
  renderDashboardSummary();
  updateIngestionLearningUI();
  updatePitchProductFields();
  pitchWizardRender();
  pitchWizardSetupInlineValidation();
  applyTheme(getTheme());
  ["ap-recall-type", "ap-put-leveraged", "ap-rate-type"].forEach((id) => {
    document.getElementById(id)?.addEventListener("change", updatePitchProductFields);
  });
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    nav,
    ingestTermSheet,
    inferDocType,
    regexExtractFromText,
    normalizeSourceFields,
    sanitizeDecrement,
    classifyDocument,
    consolidateAllSources,
    processFinalExtraction,
    StructuraEngine,
    StructuraCleaner,
    StructuraDescriptor,
    buildDescriptorInputFromSources,
    buildConsensusReportingPayload,
    buildReportingDescription,
    buildStructuredProductIntelligence,
    extractIssuerSpecificSnapshot,
    findRegistryIssuerEntry,
    cleanUnderlyingCandidate,
    recoverISIN,
    validateBarrier,
    computeGrade,
    renderDashboardSummary,
    renderAnalytics,
    renderCalendar,
    runScreener,
  };
}

if (typeof globalThis !== "undefined") {
  globalThis.hydratePitchFromLastExtraction = hydratePitchFromLastExtraction;
  globalThis.updatePitchProductFields = updatePitchProductFields;
  globalThis.toggleTheme = toggleTheme;
}
