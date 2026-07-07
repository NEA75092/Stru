(function initStructuraDecrementEngine(root, factory) {
  const api = factory(root);
  root.StructuraDecrementEngine = api;
  root.calculateDecrementScore = api.calculateDecrementScore;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(
  typeof globalThis !== "undefined" ? globalThis : this,
  function createStructuraDecrementEngine() {
    // Browser scoring surface aligned with the 9-criterion Decrement Score contract.
    const STATIC_WEIGHTS = {
      coverage: 0.2,
      drag: 0.2,
      stress: 0.15,
      recall: 0.12,
      dividendStability: 0.08,
      trend: 0.05,
      capitalLossSeverity: 0.1,
      pathDependency: 0.05,
      dividendTrend: 0.05,
    };

    const STATIC_BROWSER_WEIGHTS = {
      ...STATIC_WEIGHTS,
      drag: STATIC_WEIGHTS.drag + STATIC_WEIGHTS.recall,
      recall: 0,
      // Recall needs rolling historical windows, so its weight feeds Performance Drag here.
    };

    const DECREMENT_UNIVERSE = [
      { id: "SX5E_DEC30", name: "Euro Stoxx 50 Dec 30", assetType: "Indice", baseIndex: "Euro Stoxx 50", region: "Europe", prTicker: "^STOXX50E", trTicker: "^SX5T", decrementType: "points", decrementPts: 30, decrementCurrency: "pts", baseRefSpot: 4500, historicalDividend: 3.2, historicalVol: 18, maxDrawdown: -37.2, historicalReturn5Y: 8.5, decrementReturn5Y: 7.9, decrementMaxDrawdown: -38.2, providers: ["SG", "BNP", "Qontigo"] },
      { id: "SX5E_DEC50", name: "Euro Stoxx 50 Dec 50", assetType: "Indice", baseIndex: "Euro Stoxx 50", region: "Europe", prTicker: "^STOXX50E", trTicker: "^SX5T", decrementType: "points", decrementPts: 50, decrementCurrency: "pts", baseRefSpot: 4500, historicalDividend: 3.2, historicalVol: 18, maxDrawdown: -37.2, historicalReturn5Y: 8.5, decrementReturn5Y: 7.1, decrementMaxDrawdown: -39.5, providers: ["SG", "BNP", "Qontigo"] },
      { id: "SX5E_DEC80", name: "Euro Stoxx 50 Dec 80", assetType: "Indice", baseIndex: "Euro Stoxx 50", region: "Europe", prTicker: "^STOXX50E", trTicker: "^SX5T", decrementType: "points", decrementPts: 80, decrementCurrency: "pts", baseRefSpot: 4500, historicalDividend: 3.2, historicalVol: 18, maxDrawdown: -37.2, historicalReturn5Y: 8.5, decrementReturn5Y: 6.3, decrementMaxDrawdown: -42.0, providers: ["SG", "BNP"] },
      { id: "CAC_DEC50", name: "CAC 40 Dec 50", assetType: "Indice", baseIndex: "CAC 40", region: "Europe", prTicker: "^FCHI", trTicker: "^FCHT", decrementType: "points", decrementPts: 50, decrementCurrency: "pts", baseRefSpot: 7900, historicalDividend: 3.4, historicalVol: 19, maxDrawdown: -38.1, historicalReturn5Y: 9.2, decrementReturn5Y: 8.6, decrementMaxDrawdown: -39.2, providers: ["SG", "BNP", "CACIB"] },
      { id: "CAC_DEC100", name: "CAC 40 Dec 100", assetType: "Indice", baseIndex: "CAC 40", region: "Europe", prTicker: "^FCHI", trTicker: "^FCHT", decrementType: "points", decrementPts: 100, decrementCurrency: "pts", baseRefSpot: 7900, historicalDividend: 3.4, historicalVol: 19, maxDrawdown: -38.1, historicalReturn5Y: 9.2, decrementReturn5Y: 7.9, decrementMaxDrawdown: -41.0, providers: ["SG", "BNP"] },
      { id: "DAX_DEC50", name: "DAX 40 Dec 50", assetType: "Indice", baseIndex: "DAX 40", region: "Europe", prTicker: "^GDAXI", trTicker: "^GDAXTR", decrementType: "points", decrementPts: 50, decrementCurrency: "pts", baseRefSpot: 18000, historicalDividend: 2.8, historicalVol: 20, maxDrawdown: -38.8, historicalReturn5Y: 10.5, decrementReturn5Y: 10.2, decrementMaxDrawdown: -39.5, providers: ["DB", "SG", "Goldman"] },
      { id: "NDX_DEC50", name: "Nasdaq-100 Dec 50", assetType: "Indice", baseIndex: "Nasdaq-100", region: "USA", prTicker: "^NDX", trTicker: "^NDXT", decrementType: "points", decrementPts: 50, decrementCurrency: "pts", baseRefSpot: 19000, historicalDividend: 0.5, historicalVol: 22, maxDrawdown: -38.0, historicalReturn5Y: 17.0, decrementReturn5Y: 16.7, decrementMaxDrawdown: -38.5, providers: ["SG", "BNP", "MS"] },
      { id: "SPX_DEC50", name: "S&P 500 Dec 50", assetType: "Indice", baseIndex: "S&P 500", region: "USA", prTicker: "^GSPC", trTicker: null, decrementType: "points", decrementPts: 50, decrementCurrency: "pts", baseRefSpot: 5300, historicalDividend: 1.3, historicalVol: 16, maxDrawdown: -33.9, historicalReturn5Y: 12.0, decrementReturn5Y: 11.0, decrementMaxDrawdown: -34.9, providers: ["SG", "Goldman", "JPM"] },
      { id: "STOXX600_DEC30", name: "STOXX 600 Dec 30", assetType: "Indice", baseIndex: "STOXX 600", region: "Europe", prTicker: "^STOXX", trTicker: "^STOXXTR", decrementType: "points", decrementPts: 30, decrementCurrency: "pts", baseRefSpot: 540, historicalDividend: 3.1, historicalVol: 17, maxDrawdown: -35.0, historicalReturn5Y: 9.0, decrementReturn5Y: 8.4, decrementMaxDrawdown: -36.0, providers: ["Qontigo", "SG"] },
      { id: "SX7E_DEC20", name: "Euro Stoxx Banks Dec20", assetType: "Indice", baseIndex: "Euro Stoxx Banks", region: "Europe", prTicker: "SX7E.PA", trTicker: null, decrementType: "points", decrementPts: 20, decrementCurrency: "pts", baseRefSpot: 200, historicalDividend: 5.8, historicalVol: 28, maxDrawdown: -68.0, historicalReturn5Y: 11.0, decrementReturn5Y: 8.2, decrementMaxDrawdown: -73.5, providers: ["SG", "BNP"] },
      { id: "TTE_DEC_2_10", name: "TotalEnergies Dec", assetType: "Action", baseIndex: "TotalEnergies", region: "Europe", prTicker: "TTE.PA", trTicker: null, decrementType: "eur", decrementPts: 2.1, decrementCurrency: "EUR", baseRefSpot: 62, baseRefSpotDate: "2025-06", historicalDividend: 5.0, historicalVol: 24, maxDrawdown: -45.0, historicalReturn5Y: 13.2, decrementReturn5Y: 12.6, decrementMaxDrawdown: -46.0, providers: ["SG", "BNP", "CACIB"] },
      { id: "BNP_DEC_3_90", name: "BNP Paribas Dec", assetType: "Action", baseIndex: "BNP Paribas", region: "Europe", prTicker: "BNP.PA", trTicker: null, decrementType: "eur", decrementPts: 3.9, decrementCurrency: "EUR", baseRefSpot: 68, baseRefSpotDate: "2025-06", historicalDividend: 6.0, historicalVol: 30, maxDrawdown: -55.0, historicalReturn5Y: 12.0, decrementReturn5Y: 10.9, decrementMaxDrawdown: -57.0, providers: ["SG", "BNP", "Natixis"] },
      { id: "SIE_DEC_5_20", name: "Siemens Dec", assetType: "Action", baseIndex: "Siemens", region: "Europe", prTicker: "SIE.DE", trTicker: null, decrementType: "eur", decrementPts: 5.2, decrementCurrency: "EUR", baseRefSpot: 170, baseRefSpotDate: "2025-06", historicalDividend: 3.2, historicalVol: 23, maxDrawdown: -42.0, historicalReturn5Y: 10.4, decrementReturn5Y: 9.2, decrementMaxDrawdown: -44.0, providers: ["SG", "BNP", "DB"] },
    ];

    function formatRefSpotNote(item) {
      if (item.assetType !== "Action" || !item.baseRefSpotDate) return null;
      const [year, month] = String(item.baseRefSpotDate).split("-");
      return `Cours de référence ${item.baseRefSpot}€ au ${month}/${year}`;
    }

    function calculateDecrementScore(item, targetCouponPct) {
      const decPctAnnual = Number(
        ((item.decrementPts / item.baseRefSpot) * 100).toFixed(2),
      );
      const decPctRefNote = formatRefSpotNote(item);

      const coverageRatio =
        decPctAnnual > 0 ? item.historicalDividend / decPctAnnual : 0;
      const coverageScore =
        coverageRatio >= 1
          ? 100
          : coverageRatio >= 0.75
            ? 75
            : coverageRatio >= 0.5
              ? 50
              : coverageRatio >= 0.25
                ? 25
                : 0;

      const annualDrag = Number(
        (item.historicalReturn5Y - item.decrementReturn5Y).toFixed(2),
      );
      const dragScore =
        annualDrag < 1
          ? 100
          : annualDrag < 2
            ? 75
            : annualDrag < 3.5
              ? 50
              : annualDrag < 5
                ? 25
                : 0;

      const drawdownDiff = Number(
        (
          Math.abs(item.decrementMaxDrawdown) - Math.abs(item.maxDrawdown)
        ).toFixed(1),
      );
      const stressAmplification =
        Math.abs(item.maxDrawdown) > 0
          ? Math.abs(item.decrementMaxDrawdown) / Math.abs(item.maxDrawdown)
          : 1;
      const stressScore =
        stressAmplification <= 1.05
          ? 100
          : stressAmplification <= 1.15
            ? 75
            : stressAmplification <= 1.3
              ? 50
              : stressAmplification <= 1.5
                ? 25
                : 0;

      const dividendStability = Math.max(
        0,
        Math.min(
          1,
          1 -
            item.historicalVol / 70 -
            Math.max(0, decPctAnnual - item.historicalDividend) / 12,
        ),
      );
      const dividendStabilityScore =
        dividendStability >= 0.85
          ? 100
          : dividendStability >= 0.7
            ? 75
            : dividendStability >= 0.5
              ? 50
              : dividendStability >= 0.3
                ? 25
                : 0;

      const trendSurvival = Math.max(
        0,
        Math.min(
          100,
          48 +
            item.decrementReturn5Y * 2.2 -
            Math.max(0, drawdownDiff) * 1.3 -
            Math.max(0, decPctAnnual - item.historicalDividend) * 4,
        ),
      );
      const trendScore =
        trendSurvival >= 60
          ? 100
          : trendSurvival >= 50
              ? 75
            : trendSurvival >= 40
              ? 50
              : trendSurvival >= 30
                ? 25
                : 0;

      const capitalLossSeverity = Math.max(0, drawdownDiff);
      const capitalLossSeverityScore =
        capitalLossSeverity < 5
          ? 100
          : capitalLossSeverity < 10
            ? 75
            : capitalLossSeverity < 15
              ? 50
              : capitalLossSeverity < 25
                ? 25
                : 0;

      const lateralDragMean = Math.max(
        0,
        annualDrag * 2.2 + Math.max(0, decPctAnnual - item.historicalDividend),
      );
      const pathDependencyScore =
        lateralDragMean < 3
          ? 100
          : lateralDragMean < 6
            ? 75
            : lateralDragMean < 10
              ? 50
              : lateralDragMean < 15
                ? 25
                : 0;

      const dividendTrendScore =
        item.historicalDividend >= decPctAnnual
          ? item.historicalDividend >= decPctAnnual * 1.25
            ? 80
            : 60
          : 40;
      const recallEfficiencyScore = NaN;

      const total = Math.round(
        coverageScore * STATIC_BROWSER_WEIGHTS.coverage +
          dragScore * STATIC_BROWSER_WEIGHTS.drag +
          stressScore * STATIC_BROWSER_WEIGHTS.stress +
          dividendStabilityScore * STATIC_BROWSER_WEIGHTS.dividendStability +
          trendScore * STATIC_BROWSER_WEIGHTS.trend +
          capitalLossSeverityScore *
            STATIC_BROWSER_WEIGHTS.capitalLossSeverity +
          pathDependencyScore * STATIC_BROWSER_WEIGHTS.pathDependency +
          dividendTrendScore * STATIC_BROWSER_WEIGHTS.dividendTrend,
      );

      const grade =
        total >= 80
          ? "A"
          : total >= 65
            ? "B"
            : total >= 50
              ? "C"
              : total >= 35
                ? "D"
                : "E";

      const gradeColors = {
        A: "#2e7d32",
        B: "#558b2f",
        C: "#f9a825",
        D: "#e65100",
        E: "#c62828",
      };
      const gradeBg = {
        A: "rgba(46,125,50,.12)",
        B: "rgba(85,139,47,.12)",
        C: "rgba(249,168,37,.12)",
        D: "rgba(230,81,0,.12)",
        E: "rgba(198,40,40,.12)",
      };

      let couponVerdict = null;
      if (targetCouponPct) {
        const couponGain = targetCouponPct - item.historicalReturn5Y * 0.3;
        const couponCost = Math.max(
          0.01,
          Math.max(0, decPctAnnual - item.historicalDividend) + annualDrag * 0.5,
        );
        const ratio = couponGain / couponCost;
        couponVerdict =
          ratio >= 2
            ? "Coupon justifie le coût"
            : ratio >= 1
              ? "Rapport limite"
              : "Coupon ne couvre pas le handicap";
      }

      return {
        total,
        grade,
        gradeColor: gradeColors[grade],
        gradeBg: gradeBg[grade],
        decPctAnnual,
        decPctRefNote,
        coverageRatio,
        annualDrag,
        drawdownDiff,
        stressAmplification,
        dividendStability,
        coverageScore,
        dragScore,
        stressScore,
        dividendStabilityScore,
        trendScore,
        recallEfficiencyScore,
        capitalLossSeverity,
        capitalLossSeverityScore,
        lateralDragMean,
        pathDependencyScore,
        dividendTrendScore,
        source: "local",
        sourceLabel: "● local",
        sourceTooltip:
          "Données embarquées. Le moteur complet sélectionne cache, marché ou CSV selon disponibilité.",
        nonRecalledWindows: 0,
        totalWindows: 0,
        dividendTrendSlope: 0,
        dividendTrendR2: 0,
        trendSurvival,
        couponVerdict,
        netCarry: Number(
          (item.historicalDividend - decPctAnnual).toFixed(2),
        ),
      };
    }

    return { DECREMENT_UNIVERSE, STATIC_WEIGHTS, calculateDecrementScore };
  },
);
