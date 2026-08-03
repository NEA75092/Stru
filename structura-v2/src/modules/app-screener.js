(function initStructuraScreener(root, factory) {
  const api = factory(root);
  Object.assign(root, api);
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(
  typeof globalThis !== "undefined" ? globalThis : this,
  function createStructuraScreener(root) {
    const { notify, pctFr, escapeHtml, renderGauge } = root.StructuraUtils;
    const { DECREMENT_UNIVERSE, calculateDecrementScore, decrementVerdict } =
      root.StructuraDecrementEngine;

    // Virgule décimale française pour les points (pas un pourcentage,
    // pctFr ne s'applique pas ici) — même logique que pctFr, sans le "%".
    function fmtPts(value, digits = 2) {
      return Math.abs(Number(value) || 0).toFixed(digits).replace(".", ",");
    }

    function computeStructurationScore(item, criteriaOrTargetCoupon) {
      const criteria =
        typeof criteriaOrTargetCoupon === "object"
          ? criteriaOrTargetCoupon
          : { region: "all", minDividend: 0, maxDecrement: 15, minAvis: "all" };
      void criteria;
      const dec = calculateDecrementScore(item);
      const fitScore = dec.total;
      return { ...dec, fitScore };
    }

    function getScreenerCriteria() {
      return {
        assetType: document.getElementById("scr-asset-type")?.value || "all",
        region: document.getElementById("scr-region")?.value || "all",
        minDividend:
          parseFloat(document.getElementById("scr-min-div")?.value) || 0,
        maxDecrement:
          parseFloat(document.getElementById("scr-max-dec")?.value) || 15,
        minAvis: document.getElementById("scr-min-avis")?.value || "all",
      };
    }

    function regionBucket(region) {
      return region === "France" || region === "Allemagne" ? "Europe" : region;
    }

    // Tri par ordre d'avis, pas alphabétique (passe 7D, D.1) — même
    // mécanique de tri persistant que 7C-3 (Clients, tiroir client) :
    // un objet {col, asc}, un rang stable par colonne, jamais un tri sur
    // le libellé traduit (« À éviter » < « À justifier » alphabétiquement
    // n'a aucun rapport avec la sévérité). Même rang utilisé pour le
    // filtre « Avis minimum » (passe 7D-2, point 1) — l'ancienne note
    // A–E n'existe plus nulle part dans la vue.
    const screenerSort = { col: "avis", asc: false };
    const AVIS_RANK = { avoid: 0, justify: 1, acceptable: 2, recommended: 3 };

    function avisPasses(fitScore, minAvis) {
      if (minAvis === "all") return true;
      const rank = AVIS_RANK[decrementVerdict(fitScore).key] ?? 0;
      return rank >= (AVIS_RANK[minAvis] ?? 0);
    }

    function screenerSortValue(item, s, col) {
      if (col === "name") return item.name || "";
      if (col === "carry") return s.netCarry;
      if (col === "drag") return Math.abs(s.annualDrag);
      if (col === "avis") return AVIS_RANK[decrementVerdict(s.fitScore).key] ?? 0;
      return 0;
    }

    function compareScreenerRows(a, b) {
      let va = screenerSortValue(a.item, a.score, screenerSort.col);
      let vb = screenerSortValue(b.item, b.score, screenerSort.col);
      if (typeof va === "string" || typeof vb === "string") {
        va = String(va).toLowerCase();
        vb = String(vb).toLowerCase();
      }
      if (va === vb) return 0;
      return screenerSort.asc ? (va > vb ? 1 : -1) : va < vb ? 1 : -1;
    }

    function sortScreener(col) {
      if (screenerSort.col === col) screenerSort.asc = !screenerSort.asc;
      else {
        screenerSort.col = col;
        screenerSort.asc = col === "name";
      }
      document.querySelectorAll("#dscore-table thead th").forEach((th) => {
        th.classList.remove("sorted", "asc");
      });
      const th = [...document.querySelectorAll("#dscore-table thead th")].find((t) =>
        t.getAttribute("onclick")?.includes(`'${col}'`),
      );
      if (th) {
        th.classList.add("sorted");
        if (screenerSort.asc) th.classList.add("asc");
      }
      runScreener();
    }

    function runScreener() {
      const criteria = getScreenerCriteria();
      let universe = [...DECREMENT_UNIVERSE];
      if (criteria.assetType !== "all")
        universe = universe.filter((u) => u.assetType === criteria.assetType);
      if (criteria.region !== "all")
        universe = universe.filter((u) => regionBucket(u.region) === criteria.region);
      if (criteria.minDividend > 0)
        universe = universe.filter(
          (u) => u.historicalDividend >= criteria.minDividend,
        );

      const scored = universe
        .map((item) => ({
          item,
          score: computeStructurationScore(item, criteria),
        }))
        .filter(({ score: s }) => s.decPctAnnual <= criteria.maxDecrement)
        .filter(({ score: s }) => avisPasses(s.fitScore, criteria.minAvis))
        .sort(compareScreenerRows);

      const tbody = document.getElementById("screener-tbody");
      if (!tbody) return;

      if (!scored.length) {
        tbody.innerHTML = `<tr><td colspan="4" class="tbl-empty">Aucun sous-jacent ne correspond aux critères</td></tr>`;
        return;
      }

      // La couleur passe sur une pastille, jamais sur le texte (passe 6).
      // Avis en pastille (passe 7D) : le score chiffré a quitté la liste
      // — visible dans le tiroir (showScreenerDetail), à côté de la
      // pastille, nulle part ailleurs. Cellule Dividende−décrément sans
      // mot (passe 7D-2, point 2) : le signe porte l'information, comme
      // partout ailleurs où un montant s'affiche (moneyShort, pctFr).
      tbody.innerHTML = scored
        .map(({ item, score: s }) => {
          const verdict = decrementVerdict(s.fitScore);
          const carryCls = s.netCarry >= 0 ? "st-safe" : "st-crit";
          const carrySign = s.netCarry >= 0 ? "+" : "−";
          return `<tr onclick="showScreenerDetail('${item.id}')">
      <td><div class="p-name" style="font-size:11px;">${item.name}</div><div class="p-isin" style="font-size:9px;">${item.assetType} · ${regionBucket(item.region)}</div></td>
      <td class="num dec-metric"><span class="dec-metric-dot ${carryCls}"></span>${carrySign}${fmtPts(s.netCarry)} pts/an</td>
      <td class="num dec-metric">${pctFr(Math.abs(s.annualDrag), 1)}/an sacrifié</td>
      <td><span class="pill-status ${verdict.tone}">${escapeHtml(verdict.label)}</span></td>
    </tr>`;
        })
        .join("");

      notify("Classement Decrement Score mis à jour", "ok");
    }

    function gaugeTone(score) {
      return score >= 70 ? "st-safe" : score >= 50 ? "st-warn" : "st-crit";
    }

    // Domaine propre à chaque composante (passe 7D-2, point 6) : la
    // largeur de barre venait directement du score interne 0-100, donc
    // deux composantes au score voisin se rendaient identiques même si
    // leurs métriques réelles n'avaient rien à voir. min/max cadrent
    // chaque jauge sur sa propre plage réaliste (bornée par le palier
    // "0" du barème de decrement-engine.js) ; threshold est la valeur
    // réelle où cette composante bascule sous 50 dans ce même barème —
    // le repère n'est donc plus un 50 % arbitraire commun aux cinq. Le
    // positionnement (goodness/repère) est délégué à renderGauge
    // (StructuraUtils, §1.4) — même réglette que Barrières/Portefeuille.
    function gaugeRow(def, s) {
      const score = def.score(s);
      const value = def.value(s);
      const tone = gaugeTone(score);
      return renderGauge({
        scale: "drawer",
        value,
        min: def.min,
        max: def.max,
        threshold: def.threshold,
        invert: def.invert,
        tone,
        display: escapeHtml(def.format(value)),
        label: def.label,
        sublabel: def.desc,
      });
    }

    // Bornes et seuils tirés des paliers de calculateDecrementScore
    // (decrement-engine.js) : max = palier "0" de chaque composante,
    // threshold = valeur où le palier passe sous 50. Coverage n'est pas
    // inversé (plus haut = meilleur) ; les quatre autres sont des coûts.
    const GAUGE_DEFS = [
      {
        label: "Dividende vs décrément",
        desc: "Le dividende absorbe-t-il le coût annuel ?",
        score: (s) => s.coverageScore,
        value: (s) => s.coverageRatio,
        format: (v) => `${fmtPts(v, 2)}x`,
        min: 0,
        max: 1.25,
        invert: false,
        threshold: 0.5,
      },
      {
        label: "Performance sacrifiée",
        desc: "Combien l'investisseur abandonne historiquement",
        score: (s) => s.dragScore,
        value: (s) => Math.abs(s.annualDrag),
        format: (v) => `${v.toFixed(1)}%/an`,
        min: 0,
        max: 5,
        invert: true,
        threshold: 3.5,
      },
      {
        label: "Marché stressé",
        desc: "Amplification dans les drawdowns",
        score: (s) => s.stressScore,
        value: (s) => s.stressAmplification,
        format: (v) => `×${fmtPts(v, 2)}`,
        min: 1,
        max: 1.5,
        invert: true,
        threshold: 1.3,
      },
      {
        label: "Non-rappel",
        desc: "Surcoût si le produit va au terme",
        score: (s) => s.capitalLossSeverityScore,
        value: (s) => s.capitalLossSeverity,
        format: (v) => `+${fmtPts(v, 1)} pts`,
        min: 0,
        max: 25,
        invert: true,
        threshold: 15,
      },
      {
        label: "Marché latéral",
        desc: "Risque d'érosion quand l'indice stagne",
        score: (s) => s.pathDependencyScore,
        value: (s) => s.lateralDragMean,
        format: (v) => `${fmtPts(v, 1)} pts/an`,
        min: 0,
        max: 15,
        invert: true,
        threshold: 10,
      },
    ];

    // Le texte que le CGP recopie dans son rapport d'adéquation (passe
    // 7D, D.2) : nomme le sous-jacent, le niveau de décrément, et
    // justifie l'avis — une seule zone de prose, pas une par onglet.
    function underlyingReading(item, s, verdict) {
      const refNote = s.decPctRefNote ? ` (${s.decPctRefNote})` : "";
      const coverageWord = s.coverageRatio >= 1 ? "couvre" : "ne couvre pas";
      const closing = {
        recommended:
          "Le mécanisme est économiquement confortable au regard des données historiques disponibles.",
        acceptable:
          "Le mécanisme présente un coût modéré, cohérent avec un coupon à vérifier sur la term sheet.",
        justify:
          "Le coupon proposé doit explicitement compenser cette performance sacrifiée pour être défendable.",
        avoid:
          "Le coût du décrément est significatif et doit être présenté sans ambiguïté au client.",
      }[verdict.key];
      return `<b>${escapeHtml(item.name)}</b> applique un décrément de ${s.decPctAnnual.toFixed(1)}%/an${escapeHtml(refNote)}. Le dividende historique (${item.historicalDividend.toFixed(1)}%/an) ${coverageWord} ce coût (${fmtPts(s.coverageRatio, 2)}x), pour une performance sacrifiée d'environ ${Math.abs(s.annualDrag).toFixed(1)}%/an et un surcoût de ${fmtPts(s.capitalLossSeverity, 1)} points en cas de non-rappel. Avis : ${escapeHtml(verdict.label)}. ${closing}`;
    }

    // Le tiroir partagé (overlays.css), pas un panneau inline sous le
    // tableau (passe 7D, D.2) : même mécanique d'ouverture que
    // openDrawer/openClientDrawer — un seul contenu visible à la fois
    // dans #drawer-ov, closeDrawer() déjà partagé fonctionne tel quel.
    function showScreenerDetail(id) {
      const item = DECREMENT_UNIVERSE.find((u) => u.id === id);
      if (!item) return;
      const s = computeStructurationScore(item, getScreenerCriteria());
      const verdict = decrementVerdict(s.fitScore);

      const productContent = document.getElementById("dr-product-content");
      const clientContent = document.getElementById("dr-client-content");
      const underlyingContent = document.getElementById("dr-underlying-content");
      if (!underlyingContent) return;
      if (productContent) productContent.style.display = "none";
      if (clientContent) clientContent.style.display = "none";
      underlyingContent.style.display = "";

      const gauges = GAUGE_DEFS.map((def) => gaugeRow(def, s)).join("");

      underlyingContent.innerHTML = `
        <div class="dr-underlying-avis">
          <span class="pill-status ${verdict.tone}">${escapeHtml(verdict.label)}</span>
        </div>
        <div class="dr-underlying-score">${s.fitScore} / 100</div>
        <div class="dr-name">${escapeHtml(item.name)}</div>
        <div class="dr-isin">${escapeHtml(item.assetType)} · ${escapeHtml(item.providers.join(", "))}</div>
        <div class="dr-underlying-kpis">
          <div class="kpi"><div class="kpi-lbl">Couverture dividende</div><div class="kpi-val">${fmtPts(s.coverageRatio, 2)}x</div><div class="kpi-sub">&nbsp;</div></div>
          <div class="kpi"><div class="kpi-lbl">Performance sacrifiée</div><div class="kpi-val">${Math.abs(s.annualDrag).toFixed(1)}%</div><div class="kpi-sub">par an</div></div>
          <div class="kpi"><div class="kpi-lbl">Surcoût non-rappel</div><div class="kpi-val">+${fmtPts(s.capitalLossSeverity, 1)}</div><div class="kpi-sub">points</div></div>
        </div>
        <div class="divider"></div>
        <div class="dr-section-title">COMPOSANTES DU SCORE</div>
        <div class="dr-underlying-gauges">${gauges}</div>
        <div class="divider"></div>
        <div class="dr-section-title">LECTURE CGP</div>
        <div class="dr-underlying-reading">${underlyingReading(item, s, verdict)}</div>
      `;
      document.getElementById("drawer-ov")?.classList.add("open");
    }

    function createPitchFromOpportunity(asset) {
      const under = document.getElementById("ap-under");
      const ctx = document.getElementById("ap-context");
      if (under) under.value = asset;
      if (ctx)
        ctx.value = `Sous-jacent ${asset} repéré via Decrement Score : vérifier que le coupon gagne vraiment son duel contre le coût du décrément.`;
      root.nav?.("autopitch");
      root.generatePitchLocal?.();
      notify(`Pitch prérempli pour ${asset}`, "ok");
    }

    return {
      runScreener,
      sortScreener,
      showScreenerDetail,
      createPitchFromOpportunity,
    };
  },
);
