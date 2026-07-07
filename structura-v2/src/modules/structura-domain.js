(function initStructuraDomain(root, factory) {
  const api = factory();
  root.StructuraDomain = api;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(
  typeof globalThis !== "undefined" ? globalThis : this,
  function createStructuraDomain() {
    const PRODUCT_FAMILIES = {
      phoenix: {
        label: "Phoenix Autocall",
        description:
          "Coupon conditionnel + rappel conditionnel, capital conditionnel à maturité",
      },
      athena: {
        label: "Athena Autocall",
        description:
          "Coupon cumulé au rappel ou à maturité, capital conditionnel",
      },
      bearish_taux: {
        label: "Bearish Taux",
        description:
          "Structure inverse sur taux, rappel/coupon si le sous-jacent clôture sous le seuil",
      },
      cln: {
        label: "CLN (Credit Linked Note)",
        description:
          "Coupon garanti hors événement de crédit, remboursement lié au recouvrement ISDA",
      },
      note: {
        label: "Note taux fixe/variable",
        description:
          "Obligation structurée à coupon fixe ou variable, callable optionnel",
      },
    };

    const UNDERLYING_TYPES = {
      action_vanille: "Action individuelle",
      action_decrement: "Action / indice décrémenté",
      indice: "Indice standard",
    };

    const BASKET_STRUCTURES = {
      worstof: "Worst-of",
      equipondere: "Panier équipondéré",
    };

    const FREQUENCIES = {
      annuel: { divisor: 1, periodLabel: "An", pluralLabel: "Ans", months: 12 },
      semestriel: {
        divisor: 2,
        periodLabel: "Semestre",
        pluralLabel: "Semestres",
        months: 6,
      },
      trimestriel: {
        divisor: 4,
        periodLabel: "Trimestre",
        pluralLabel: "Trimestres",
        months: 3,
      },
      mensuel: { divisor: 12, periodLabel: "Mois", pluralLabel: "Mois", months: 1 },
    };

    const LEGACY_TYPE_TO_FAMILY = {
      AC: "phoenix",
      CG: "athena",
      RC: "phoenix",
      LV: "note",
    };

    const PRODUCT_CHARACTERISTIC_SCHEMA = {
      common: [
        "tradeDate",
        "referencedBy",
        "currency",
        "issueDate",
        "commercialisationEndDate",
        "maturityYears",
        "maturityDate",
        "underlyingType",
        "basketStructure",
        "underlyings",
        "initialLevelType",
        "calculationFrequency",
        "startDateLevel",
        "endDateLevel",
        "closingPriceDate",
        "minimumDates",
        "initialLevelDates",
        "frequency",
        "annualCouponPct",
        "couponPerPeriodPct",
        "couponStartPeriod",
        "periodBeforeEarlyRedemption",
        "earlyRedemptionStartYear",
        "earlyRedemptionThresholdType",
        "fixedRecallThreshold",
        "firstCallThreshold",
        "degressivityPerPeriod",
        "floor",
        "couponBarrier",
        "oxygenBarrier",
        "finalThreshold",
        "upFrontCommission",
        "runningCommission",
      ],
      phoenix: [
        "couponVersion",
        "hasMemory",
        "putLeveraged",
        "putLeveragedPdi",
        "putLeveragedMultiplier",
      ],
      athena: ["couponCumulative", "oxygenBarrier"],
      bearish_taux: [
        "bearishSubType",
        "bearishPhoenixVersion",
        "bearishCouponGuaranteed",
        "bearishCouponGuaranteedPeriod",
        "bearishCouponGuaranteedAmount",
        "bearishPeriodBeforeRedemption",
        "bearishRedemptionFrequency",
        "bearishCouponBarrier",
        "bearishRecallBarrier",
      ],
      cln: [
        "referenceEntity",
        "creditEventDefinition",
        "recoveryRateSource",
        "callable",
        "callMode",
        "callDates",
        "callDateMode",
        "callStartDate",
        "callEndDate",
        "callFrequency",
      ],
      note: [
        "rateType",
        "noteVersion",
        "noteUnderlying",
        "spreadPct",
        "capPct",
        "floorPct",
        "callable",
        "callStartPeriod",
        "callFrequency",
      ],
    };

    function normalizeFrequency(value) {
      const raw = String(value || "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
      if (raw.startsWith("ann")) return "annuel";
      if (raw.startsWith("sem")) return "semestriel";
      if (raw.startsWith("tri")) return "trimestriel";
      if (raw.startsWith("men") || raw === "mois") return "mensuel";
      return null;
    }

    function couponPerPeriod(annualCouponPct, frequency) {
      const freq = FREQUENCIES[normalizeFrequency(frequency) || frequency];
      const coupon = Number(annualCouponPct);
      if (!freq || !Number.isFinite(coupon)) return null;
      return coupon / freq.divisor;
    }

    function ordinalFr(value) {
      const n = Number(value);
      if (!Number.isFinite(n) || n < 1) return "";
      return `${Math.trunc(n)}${Math.trunc(n) === 1 ? "ère" : "ème"}`;
    }

    function formatPctFr(value, digits = 2, fallback = "XX%") {
      if (value === null || value === undefined || value === "") return fallback;
      const n = Number(value);
      if (!Number.isFinite(n)) return fallback;
      return `${n.toFixed(digits).replace(".", ",")}%`;
    }

    function formatMaturityYears(years) {
      const n = Number(years);
      if (!Number.isFinite(n)) return "XX ans";
      return `${n} ${n === 1 ? "an" : "ans"}`;
    }

    function joinFr(items) {
      const clean = (items || []).filter(Boolean);
      if (clean.length <= 1) return clean[0] || "";
      if (clean.length === 2) return `${clean[0]} et ${clean[1]}`;
      return `${clean.slice(0, -1).join(", ")} et ${clean[clean.length - 1]}`;
    }

    function describeUnderlyingBasket(underlyings = [], structure = "worstof", type = "indices") {
      const names = joinFr(underlyings);
      if (!names) return "Sous-jacent à confirmer";
      if (structure === "equipondere") {
        const weight = underlyings.length ? (100 / underlyings.length).toFixed(2).replace(".", ",") : "XX";
        return `panier équipondéré des ${type} ${names} (le poids de chaque ${type === "actions" ? "action" : "indice"} étant de ${weight}% dans la performance du panier)`;
      }
      if (structure === "worstof" && underlyings.length > 1) {
        return `${type === "actions" ? "action la moins performante" : "indice le moins performant"} entre ${names}`;
      }
      return names;
    }

    function normalizeProductFamily(value, legacyType = null) {
      const raw = String(value || "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
      if (PRODUCT_FAMILIES[raw]) return raw;
      if (/bearish/.test(raw)) return "bearish_taux";
      if (/credit|cln|linked/.test(raw)) return "cln";
      if (/note|taux fixe|taux variable|fixed|floating/.test(raw)) return "note";
      if (/athena|capital garanti|capital protected/.test(raw)) return "athena";
      if (/phoenix|autocall|reverse convertible|autocallable/.test(raw)) return "phoenix";
      return LEGACY_TYPE_TO_FAMILY[legacyType] || LEGACY_TYPE_TO_FAMILY[value] || "phoenix";
    }

    function numberOrNull(value) {
      if (value === null || value === undefined || value === "") return null;
      const n = Number(String(value).replace(",", "."));
      return Number.isFinite(n) ? n : null;
    }

    function boolFrom(value) {
      if (typeof value === "boolean") return value;
      return /^(oui|yes|true|1)$/i.test(String(value || "").trim());
    }

    function normalizeCharacteristics(input = {}, family = null) {
      const productFamily = normalizeProductFamily(family || input.productFamily || input.type, input.type);
      const annualCouponPct = numberOrNull(input.annualCouponPct ?? input.couponPct ?? input.cpnNum);
      const frequency = normalizeFrequency(input.frequency || input.couponPeriod || input.couponFrequency);
      const couponPerPeriodPct =
        numberOrNull(input.couponPerPeriodPct) ??
        (annualCouponPct !== null && frequency ? couponPerPeriod(annualCouponPct, frequency) : null);
      const finalThreshold = numberOrNull(input.finalThreshold ?? input.barrierPct ?? input.barrier);
      const putLeveragedPdi = numberOrNull(input.putLeveragedPdi ?? input.putLeveragedValue);
      const putLeveraged = boolFrom(input.putLeveraged);

      return {
        productFamily,
        tradeDate: input.tradeDate || null,
        referencedBy: input.referencedBy || null,
        currency: input.currency || "EUR",
        issueDate: input.issueDate || input.emissionDate || null,
        commercialisationEndDate: input.commercialisationEndDate || input.endDate || null,
        maturityYears: numberOrNull(input.maturityYears),
        maturityDate: input.maturityDate || input.maturity || null,
        underlyingType: input.underlyingType || null,
        basketStructure: input.basketStructure || input.multiUnderlyingStructure || null,
        underlyings: Array.isArray(input.underlyings)
          ? input.underlyings.filter(Boolean)
          : [input.underlying].filter(Boolean),
        initialLevelType: input.initialLevelType || null,
        calculationFrequency: input.calculationFrequency || null,
        startDateLevel: input.startDateLevel || null,
        endDateLevel: input.endDateLevel || null,
        closingPriceDate: input.closingPriceDate || null,
        minimumDates: Array.isArray(input.minimumDates) ? input.minimumDates.filter(Boolean) : [],
        initialLevelDates: Array.isArray(input.initialLevelDates)
          ? input.initialLevelDates.filter(Boolean)
          : [
              input.closingPriceDate,
              input.startDateLevel,
              input.endDateLevel,
              ...(Array.isArray(input.minimumDates) ? input.minimumDates : []),
            ].filter(Boolean),
        frequency,
        annualCouponPct,
        couponPerPeriodPct,
        couponStartPeriod: numberOrNull(input.couponStartPeriod ?? input.noteCouponStartPeriod),
        periodBeforeEarlyRedemption: numberOrNull(
          input.periodBeforeEarlyRedemption ?? input.earlyRedemptionStartYear,
        ),
        earlyRedemptionStartYear: numberOrNull(input.earlyRedemptionStartYear),
        earlyRedemptionThresholdType: input.earlyRedemptionThresholdType || null,
        fixedRecallThreshold: numberOrNull(input.fixedRecallThreshold ?? input.recallPct),
        firstCallThreshold: numberOrNull(input.firstCallThreshold),
        degressivityPerPeriod: numberOrNull(input.degressivityPerPeriod),
        floor: numberOrNull(input.floor),
        couponBarrier: numberOrNull(input.couponBarrier),
        oxygenBarrier: numberOrNull(input.oxygenBarrier),
        finalThreshold,
        couponVersion: input.couponVersion || input.phoenixVersion || null,
        hasMemory: boolFrom(input.hasMemory ?? input.memoryEffect),
        putLeveraged,
        putLeveragedPdi,
        putLeveragedMultiplier:
          numberOrNull(input.putLeveragedMultiplier) ??
          (putLeveraged && putLeveragedPdi ? Math.round((100 / putLeveragedPdi) * 100) / 100 : null),
        bearishSubType: input.bearishSubType || null,
        bearishPhoenixVersion: input.bearishPhoenixVersion || null,
        bearishCouponGuaranteed: boolFrom(input.bearishCouponGuaranteed),
        bearishCouponGuaranteedPeriod: input.bearishCouponGuaranteedPeriod || null,
        bearishCouponGuaranteedAmount: numberOrNull(input.bearishCouponGuaranteedAmount),
        bearishPeriodBeforeRedemption: numberOrNull(input.bearishPeriodBeforeRedemption),
        bearishRedemptionFrequency:
          normalizeFrequency(input.bearishRedemptionFrequency) || input.bearishRedemptionFrequency || null,
        bearishCouponBarrier: numberOrNull(input.bearishCouponBarrier),
        bearishRecallBarrier: numberOrNull(input.bearishRecallBarrier),
        referenceEntity: input.referenceEntity || input.clnUnderlying || null,
        creditEventDefinition: input.creditEventDefinition || "ISDA",
        recoveryRateSource: input.recoveryRateSource || "ISDA",
        callable: boolFrom(input.callable ?? input.clnCallable ?? input.noteCallable),
        callMode: input.callMode || input.clnCallMode || null,
        callDates: Array.isArray(input.callDates) ? input.callDates.filter(Boolean) : [],
        callDateMode: input.callDateMode || input.callMode || input.clnCallMode || null,
        callStartPeriod: numberOrNull(input.callStartPeriod ?? input.noteCallableStartPeriod),
        callStartDate: input.callStartDate || input.clnCallStartDate || null,
        callEndDate: input.callEndDate || input.clnCallEndDate || null,
        callFrequency: normalizeFrequency(input.callFrequency || input.clnCallPeriodicity) || null,
        rateType: input.rateType || input.noteRateType || null,
        noteVersion: input.noteVersion || null,
        noteUnderlying: input.noteUnderlying || null,
        spreadPct: numberOrNull(input.spreadPct ?? input.noteSpread),
        capPct: numberOrNull(input.capPct ?? input.noteCap),
        floorPct: numberOrNull(input.floorPct ?? input.noteFloor),
        upFrontCommission: numberOrNull(input.upFrontCommission),
        runningCommission: numberOrNull(input.runningCommission),
      };
    }

    function initialLevelWording(characteristics = {}) {
      const {
        initialLevelType,
        initialLevelDates,
        startDateLevel,
        endDateLevel,
        closingPriceDate,
        minimumDates,
      } = characteristics;
      if (initialLevelType === "moyenne") {
        if (startDateLevel && endDateLevel)
          return `moyenne des cours de clôture du ${startDateLevel} au ${endDateLevel}`;
        if (initialLevelDates?.length >= 2)
          return `moyenne des cours de clôture du ${initialLevelDates[0]} au ${initialLevelDates[1]}`;
        return "moyenne des cours de clôture sur une période donnée";
      }
      if (initialLevelType === "coursDeCloture") {
        return closingPriceDate || initialLevelDates?.[0]
          ? `Cours de clôture du ${closingPriceDate || initialLevelDates[0]}`
          : "Cours de clôture à une date donnée";
      }
      if (initialLevelType === "minimum") {
        const dates = minimumDates?.length ? minimumDates : initialLevelDates;
        return dates?.length
          ? `le plus bas des cours de clôture du ${joinFr(dates)}`
          : "le plus bas des cours de clôture sur plusieurs dates";
      }
      return "Méthode de calcul du niveau initial à confirmer";
    }

    function calculateDegressivity({
      maturityMonths,
      periodicity,
      degressivityPerPeriod,
      firstThreshold = 100,
      floor = null,
      startMonth = 0,
      oxygenBarrier = null,
      couponBarrier = null,
    }) {
      const frequencyId = normalizeFrequency(periodicity);
      const frequency = FREQUENCIES[frequencyId];
      if (!frequency) return [];
      const results = [];
      for (let month = 0; month <= Number(maturityMonths || 0); month += frequency.months) {
        let price;
        if (month < Number(startMonth || 0)) {
          price = 100;
        } else {
          const elapsedPeriods = Math.max(
            0,
            Math.round((month - Number(startMonth || 0)) / frequency.months),
          );
          price = Number(firstThreshold || 100) - Number(degressivityPerPeriod || 0) * elapsedPeriods;
          if (floor !== null && floor !== undefined) price = Math.max(price, Number(floor));
          if (couponBarrier !== null && couponBarrier !== undefined)
            price = Math.max(price, Number(couponBarrier));
          if (
            month === Number(maturityMonths || 0) &&
            oxygenBarrier !== null &&
            oxygenBarrier !== undefined
          ) {
            price = Math.max(price, Number(oxygenBarrier));
          }
        }
        results.push({ month, threshold: Math.round(price * 100) / 100 });
      }
      return results;
    }

    function couponProtectionLevel(data = {}) {
      if (data.type === "bearish_taux") return Number(data.bearishCouponBarrier || 100);
      if (data.oxygenBarrier) return Number(data.oxygenBarrier);
      if (data.couponBarrier) return Number(data.couponBarrier);
      if (data.earlyRedemptionThresholdType === "degressif") {
        const frequency = FREQUENCIES[normalizeFrequency(data.frequency) || data.frequency];
        const periodsPerYear = frequency?.divisor || 1;
        const maturityPeriods = Number(data.maturityYears || 0) * periodsPerYear;
        const startPeriods = Number(
          data.periodBeforeEarlyRedemption ?? data.earlyRedemptionStartYear ?? 1,
        ) * periodsPerYear;
        const observedPeriods = Math.max(0, maturityPeriods - startPeriods);
        const final =
          Number(data.firstCallThreshold ?? data.firstThreshold ?? 100) -
          Number(data.degressivityPerPeriod ?? data.degressivity ?? 0) * observedPeriods;
        return data.floor ? Math.max(final, Number(data.floor)) : final;
      }
      return Number(data.finalThreshold || 0);
    }

    return {
      PRODUCT_FAMILIES,
      UNDERLYING_TYPES,
      BASKET_STRUCTURES,
      FREQUENCIES,
      LEGACY_TYPE_TO_FAMILY,
      PRODUCT_CHARACTERISTIC_SCHEMA,
      normalizeFrequency,
      normalizeProductFamily,
      normalizeCharacteristics,
      couponPerPeriod,
      ordinalFr,
      formatPctFr,
      formatMaturityYears,
      joinFr,
      describeUnderlyingBasket,
      initialLevelWording,
      calculateDegressivity,
      couponProtectionLevel,
    };
  },
);
