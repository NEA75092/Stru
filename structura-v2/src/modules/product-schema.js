(function initStructuraProductSchema(root, factory) {
  const api = factory(root);
  root.StructuraProductSchema = api;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(
  typeof globalThis !== "undefined" ? globalThis : this,
  function createStructuraProductSchema(root) {
    const SCHEMA_VERSION = "structura.product.v1";

    const FAMILY_TO_LEGACY_TYPE = {
      phoenix: "AC",
      athena: "AC",
      bearish_taux: "AC",
      cln: "RC",
      note: "CG",
    };

    function domain() {
      return root.StructuraDomain || {};
    }

    function stringOrNull(value) {
      const clean = String(value ?? "").trim();
      return clean || null;
    }

    function numberOrNull(value) {
      if (value === null || value === undefined || value === "") return null;
      const n = Number(String(value).replace(",", "."));
      return Number.isFinite(n) ? n : null;
    }

    function arrayFrom(value) {
      if (Array.isArray(value)) return value.map(stringOrNull).filter(Boolean);
      return String(value ?? "")
        .split(/[;,]/)
        .map(stringOrNull)
        .filter(Boolean);
    }

    function isoOrNull(value) {
      const clean = stringOrNull(value);
      if (!clean) return null;
      const date = new Date(`${clean}T00:00:00`);
      return Number.isNaN(date.getTime()) ? clean : date.toISOString().slice(0, 10);
    }

    function normalizeFamily(value, legacyType) {
      return domain().normalizeProductFamily?.(value, legacyType) || "phoenix";
    }

    function normalizeFrequency(value) {
      return domain().normalizeFrequency?.(value) || stringOrNull(value);
    }

    function couponPerPeriod(annualCouponPct, frequency) {
      return domain().couponPerPeriod?.(annualCouponPct, frequency) ?? null;
    }

    function sourceMeta(source = {}) {
      return {
        kind: source.kind || "unknown",
        provider: source.provider || null,
        documentType: source.documentType || null,
        documentName: source.documentName || null,
        extractedAt: source.extractedAt || new Date().toISOString(),
      };
    }

    function normalizeEvents(schedule = []) {
      return (Array.isArray(schedule) ? schedule : [])
        .map((event) => ({
          date: isoOrNull(event.date || event._dateIso || event.iso),
          type: stringOrNull(event.type) || (event.recallLevel ? "autocall_observation" : "observation"),
          label: stringOrNull(event.label || event.name) || "Observation",
          recallLevelPct: numberOrNull(event.recallLevel ?? event.recallPct),
          couponLevelPct: numberOrNull(event.couponLevel ?? event.couponPct),
          source: stringOrNull(event.source),
        }))
        .filter((event) => event.date);
    }

    function normalizeDraft(input = {}, options = {}) {
      const legacyType = stringOrNull(input.type || input.legacyType);
      const productFamily = normalizeFamily(
        input.productFamily || input.family || input.productType || input.type,
        legacyType,
      );
      const underlyings = arrayFrom(input.underlyings || input.underlying);
      const frequency = normalizeFrequency(input.frequency || input.couponPeriod || input.couponFrequency);
      const annualCouponPct = numberOrNull(input.annualCouponPct ?? input.couponPct ?? input.cpnNum);
      const couponPerPeriodPct =
        numberOrNull(input.couponPerPeriodPct) ??
        (annualCouponPct !== null && frequency ? couponPerPeriod(annualCouponPct, frequency) : null);
      const protectionPct = numberOrNull(input.finalThreshold ?? input.barrierPct ?? input.barrier);
      const recallPct = numberOrNull(input.fixedRecallThreshold ?? input.recallPct ?? input.recall);
      const couponBarrierPct = numberOrNull(input.couponBarrier ?? input.couponBarrierPct);
      const isCreditOrRate = productFamily === "cln" || productFamily === "note";
      const events = normalizeEvents(input.scheduleData || input.events || input.observationSchedule);
      const characteristics = domain().normalizeCharacteristics
        ? domain().normalizeCharacteristics(
            {
              ...input.characteristics,
              ...input,
              productFamily,
              frequency,
              annualCouponPct,
              couponPerPeriodPct,
              finalThreshold: isCreditOrRate ? null : protectionPct,
              fixedRecallThreshold: isCreditOrRate ? null : recallPct,
              couponBarrier: isCreditOrRate ? null : couponBarrierPct,
              underlyings,
            },
            productFamily,
          )
        : { ...(input.characteristics || {}), productFamily };

      return {
        schemaVersion: SCHEMA_VERSION,
        source: sourceMeta(options.source || input.source),
        identity: {
          name:
            stringOrNull(input.productName || input.name) ||
            [input.type, underlyings[0]].map(stringOrNull).filter(Boolean).join(" ") ||
            "Produit Structuré",
          isin: stringOrNull(input.isin),
        },
        classification: {
          legacyType: legacyType || FAMILY_TO_LEGACY_TYPE[productFamily] || "AC",
          productFamily,
        },
        parties: {
          issuer: stringOrNull(input.issuer || input.emetteur),
          guarantor: stringOrNull(input.guarantor),
          referenceEntity: stringOrNull(input.referenceEntity || characteristics.referenceEntity),
        },
        underlyings: underlyings.map((name, index) => ({
          name,
          type: stringOrNull(input.underlyingType || characteristics.underlyingType),
          role: index === 0 ? "primary" : "basket_component",
        })),
        economics: {
          currency: stringOrNull(input.currency || characteristics.currency) || "EUR",
          nominal: numberOrNull(input.nominal),
          valuationAmount: numberOrNull(input.val || input.valuationAmount),
          annualCouponPct,
          couponPerPeriodPct,
          frequency,
        },
        barriers: {
          protectionPct: isCreditOrRate ? null : protectionPct,
          couponPct: isCreditOrRate ? null : couponBarrierPct,
          recallPct: isCreditOrRate ? null : recallPct,
        },
        dates: {
          issueDate: isoOrNull(input.issueDate || input.emissionDate),
          maturityDate: isoOrNull(input.maturityDate || input.maturity),
          nextEventDate: isoOrNull(input.nextEvtDate),
        },
        events,
        mechanics: {
          basketStructure:
            stringOrNull(input.basketStructure || characteristics.basketStructure) ||
            (underlyings.length > 1 ? "worstof" : "single"),
          hasMemory: Boolean(input.hasMemory ?? characteristics.hasMemory),
          callable: Boolean(input.callable ?? characteristics.callable),
          decrement: numberOrNull(input.decrement ?? characteristics.decrement),
        },
        characteristics,
        narrative: {
          productDescription: stringOrNull(input.productDescription),
        },
        quality: {
          status: options.status || input.dataQuality || "draft",
          confidence: numberOrNull(input.confidenceScore ?? input.confidence),
          grade: stringOrNull(input.grade),
          warnings: [],
          errors: [],
          missing: [],
        },
        raw: options.keepRaw ? input : undefined,
      };
    }

    function validateCanonicalProduct(product) {
      const warnings = [];
      const errors = [];
      const missing = [];
      const family = product.classification.productFamily;

      if (!product.identity.name) missing.push("name");
      if (!product.identity.isin) warnings.push("ISIN absent: import possible mais rapprochement externe limité.");
      if (!product.parties.issuer) missing.push("issuer");
      if (!product.underlyings.length && family !== "cln" && family !== "note") missing.push("underlying");
      if (!product.dates.maturityDate) missing.push("maturityDate");
      if (!product.economics.nominal) warnings.push("Nominal absent: valeur par défaut utilisée à l'import.");

      if ((family === "cln" || family === "note") && product.barriers.protectionPct !== null) {
        errors.push("Barrière/PDI non applicable aux CLN ou Notes taux.");
      }
      if ((family === "phoenix" || family === "athena" || family === "bearish_taux") && product.barriers.protectionPct === null) {
        warnings.push("Barrière de protection à confirmer pour cette famille de produit.");
      }
      if (family === "cln" && !product.parties.referenceEntity) {
        warnings.push("Entité de référence crédit à confirmer pour le CLN.");
      }
      if (product.underlyings.length > 1 && product.mechanics.basketStructure === "single") {
        warnings.push("Plusieurs sous-jacents détectés: structure panier à confirmer.");
      }

      product.quality.warnings = [...new Set([...(product.quality.warnings || []), ...warnings])];
      product.quality.errors = [...new Set([...(product.quality.errors || []), ...errors])];
      product.quality.missing = [...new Set([...(product.quality.missing || []), ...missing])];
      product.quality.isImportable = errors.length === 0;
      return product;
    }

    function fromExtraction(input = {}, options = {}) {
      return validateCanonicalProduct(
        normalizeDraft(input, {
          ...options,
          source: {
            kind: "document_extraction",
            provider: options.provider || "local",
            documentType: input.docType || input.documentType || null,
            documentName: input.documentName || null,
          },
          status: "extracted",
        }),
      );
    }

    function fromManualForm(input = {}, options = {}) {
      return validateCanonicalProduct(
        normalizeDraft(input, {
          ...options,
          source: { kind: "manual_entry", provider: "structura-ui" },
          status: "manual",
        }),
      );
    }

    function nextEvent(product, helpers = {}) {
      const today = helpers.today || new Date().toISOString().slice(0, 10);
      const next = product.events.find((event) => event.date > today);
      return {
        date:
          next?.date ||
          product.dates.nextEventDate ||
          helpers.isoDate?.(helpers.addMonths?.(new Date(), 1)) ||
          today,
        label: next?.recallLevelPct
          ? `Obs. rappel (${next.recallLevelPct}%)`
          : next?.label || "Prochaine observation",
      };
    }

    function canonicalToPortfolioProduct(product, options = {}) {
      const helpers = options.helpers || {};
      const nominal = product.economics.nominal || options.defaultNominal || 1000000;
      const valuation = product.economics.valuationAmount || nominal;
      const next = nextEvent(product, helpers);
      const annualCoupon = product.economics.annualCouponPct || 0;
      const couponSuffix = product.economics.frequency ? ` (${product.economics.frequency})` : "";
      const legacy = {
        id: options.id,
        name: product.identity.name,
        isin: product.identity.isin || "",
        type: product.classification.legacyType || FAMILY_TO_LEGACY_TYPE[product.classification.productFamily] || "AC",
        productFamily: product.classification.productFamily,
        emetteur: product.parties.issuer || "Non renseigné",
        nominal,
        val: valuation,
        pnl: valuation - nominal,
        pnlPct: nominal ? ((valuation - nominal) / nominal) * 100 : 0,
        coupon: annualCoupon > 0 ? `${annualCoupon.toFixed(2)}%${couponSuffix}` : "0.00%",
        cpnNum: annualCoupon,
        tri: "0%",
        triNum: 0,
        barrier: product.barriers.protectionPct,
        dist: null,
        maturity:
          product.dates.maturityDate ||
          helpers.isoDate?.(helpers.addYears?.(new Date(), 2)) ||
          "",
        underlying: product.underlyings.map((u) => u.name).join(", ") || "N/A",
        rating: "N/A",
        nextEvt: next.label,
        nextEvtDate: next.date,
        origin: "user",
        dataQuality: product.quality.status || "draft",
        productDescription: product.narrative.productDescription || "",
        decrement: product.mechanics.decrement,
        hasMemory: product.mechanics.hasMemory,
        characteristics: product.characteristics,
        scheduleData: product.events,
        canonicalProduct: product,
      };
      return options.normalizeProduct ? options.normalizeProduct(legacy) : legacy;
    }

    return {
      SCHEMA_VERSION,
      normalizeDraft,
      validateCanonicalProduct,
      fromExtraction,
      fromManualForm,
      canonicalToPortfolioProduct,
    };
  },
);
