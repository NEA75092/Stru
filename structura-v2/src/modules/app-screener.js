(function initStructuraScreener(root, factory) {
  const api = factory(root);
  Object.assign(root, api);
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(
  typeof globalThis !== "undefined" ? globalThis : this,
  function createStructuraScreener(root) {
    const { notify } = root.StructuraUtils;
    const { DECREMENT_UNIVERSE, calculateDecrementScore } =
      root.StructuraDecrementEngine;

    function renderNutriScore(grade, size = "normal") {
      const letters = ["E", "D", "C", "B", "A"];
      const colors = {
        A: "#2e7d32",
        B: "#558b2f",
        C: "#f9a825",
        D: "#e65100",
        E: "#c62828",
      };
      const s = size === "small" ? "ns-small" : "";
      return `<div class="nutri-score ${s}">${letters
        .map(
          (l) =>
            `<span class="ns-letter" style="background:${colors[l]};opacity:${l === grade ? 1 : 0.25};">${l}</span>`,
        )
        .join("")}</div>`;
    }

    function computeStructurationScore(item, criteriaOrTargetCoupon) {
      const criteria =
        typeof criteriaOrTargetCoupon === "object"
          ? criteriaOrTargetCoupon
          : { region: "all", minDividend: 0, maxDecrement: 15, minGrade: "E" };
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
        minGrade: document.getElementById("scr-min-grade")?.value || "E",
      };
    }

    function regionBucket(region) {
      return region === "France" || region === "Allemagne" ? "Europe" : region;
    }

    function gradePasses(grade, minGrade) {
      const rank = { E: 0, D: 1, C: 2, B: 3, A: 4 };
      return (rank[grade] ?? 0) >= (rank[minGrade] ?? 0);
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
        .filter(({ score: s }) => gradePasses(s.grade, criteria.minGrade))
        .sort((a, b) => b.score.fitScore - a.score.fitScore);

      const tbody = document.getElementById("screener-tbody");
      if (!tbody) return;

      if (!scored.length) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--text3);padding:24px;">Aucun sous-jacent ne correspond aux critères</td></tr>`;
        return;
      }

      tbody.innerHTML = scored
        .map(({ item, score: s }) => {
          const verdict = businessVerdict(s);
          return `<tr onclick="showScreenerDetail('${item.id}')">
      <td><div class="p-name" style="font-size:11px;">${item.name}</div><div class="p-isin" style="font-size:9px;">${item.assetType} · ${regionBucket(item.region)} · ${sourceBadge(s)}${s.decPctRefNote ? ` · ${s.decPctRefNote}` : ""}</div></td>
      <td class="num ${s.netCarry >= 0 ? "st-ok" : "st-bad"}">${s.netCarry >= 0 ? "Couvre +" : "Manque "}${Math.abs(s.netCarry).toFixed(2)} pts/an</td>
      <td class="num">${Math.abs(s.annualDrag).toFixed(1)}%/an sacrifié</td>
      <td class="num ${s.capitalLossSeverity < 5 ? "st-ok" : s.capitalLossSeverity < 15 ? "st-warn" : "st-bad"}">+${s.capitalLossSeverity.toFixed(1)} pts</td>
      <td class="num" style="color:var(--gold);font-weight:700;">${s.fitScore}</td>
      <td><span class="decision-pill ${verdict.cls}">${verdict.label}</span></td>
    </tr>`;
        })
        .join("");

      const best = scored[0];
      const avg = Math.round(
        scored.reduce((sum, x) => sum + x.score.fitScore, 0) / scored.length,
      );
      void best;
      void avg;

      notify("Classement Decrement Score mis à jour", "ok");
    }

    function showScreenerDetail(id) {
      const item = DECREMENT_UNIVERSE.find((u) => u.id === id);
      if (!item) return;
      const s = computeStructurationScore(item, getScreenerCriteria());
      const panel = document.getElementById("scr-detail-panel");
      if (!panel) return;
      const coverage = s.coverageRatio ? `${s.coverageRatio.toFixed(2)}x` : "N/A";
      const investorProfile = businessVerdict(s).label;
      const mifidText = clientLanguage(item, s);

      panel.innerHTML = `
    <div class="dec-detail-header">
      <div>
        <div class="dec-detail-name">${item.name}</div>
        <div class="dec-detail-base">${item.baseIndex} · ${item.providers.join(", ")} · ${sourceBadge(s)}${s.decPctRefNote ? ` · ${s.decPctRefNote}` : ""}</div>
      </div>
      ${renderNutriScore(s.grade)}
    </div>
    <div class="dec-detail-metrics">
      <div class="dec-detail-metric"><div class="ddm-val" style="color:${s.netCarry >= 0 ? "var(--green)" : "var(--red)"}">${s.netCarry >= 0 ? "+" : "-"}${Math.abs(s.netCarry).toFixed(2)}</div><div class="ddm-lbl">Marge dividende</div></div>
      <div class="dec-detail-metric"><div class="ddm-val" style="color:var(--gold)">${Math.abs(s.annualDrag).toFixed(1)}%</div><div class="ddm-lbl">Coût/an</div></div>
      <div class="dec-detail-metric"><div class="ddm-val" style="color:var(--orange)">+${s.capitalLossSeverity.toFixed(1)}</div><div class="ddm-lbl">Non-rappel</div></div>
      <div class="dec-detail-metric"><div class="ddm-val">${s.fitScore}/100</div><div class="ddm-lbl">Score</div></div>
    </div>
    <div class="dec-browser-tabs">
      <button class="on" data-tab="score" onclick="switchScreenerDetailTab('score')">Verdict</button>
      <button data-tab="graphs" onclick="switchScreenerDetailTab('graphs')">Chiffrage</button>
      <button data-tab="criteria" onclick="switchScreenerDetailTab('criteria')">Pourquoi ce score ?</button>
      <button data-tab="compare" onclick="switchScreenerDetailTab('compare')">Duel coupon</button>
    </div>
    <div class="dec-browser-tab on" data-scr-tab="score">
      <div class="dec-verdict">${investorProfile}</div>
      <div class="dec-detail-interp">
        <p><b>Lecture CGP.</b> Le dividende couvre ${coverage} le coût du décrément. ${s.netCarry >= 0 ? "Le mécanisme part avec un coussin positif." : "Le mécanisme consomme déjà plus que le dividende historique."}</p>
        <p>Le prix à payer est une performance sacrifiée d'environ ${Math.abs(s.annualDrag).toFixed(1)}% par an. En non-rappel, la perte augmente de ${s.capitalLossSeverity.toFixed(1)} points.</p>
        <p>Conclusion : ${investorProfile}. Le coupon proposé doit au minimum compenser ce coût économique.</p>
      </div>
      <div class="dec-client-text">
        <div class="dec-detail-sec">Pitch dossier client</div>
        ${mifidText}
      </div>
    </div>
    <div class="dec-browser-tab" data-scr-tab="graphs">
      ${miniGraph(item, s)}
      <div class="dec-detail-interp">Le match montre l'écart entre le sous-jacent standard et sa version décrémentée. Les graphes complets ajoutent dividendes, drawdowns et recall par millésime.</div>
    </div>
    <div class="dec-browser-tab" data-scr-tab="criteria">
      <div class="dec-detail-criteria">
        <div class="dec-detail-sec">Pourquoi ce score ?</div>
        ${criteriaBar("Dividende vs décrément", s.coverageScore, "Le dividende absorbe-t-il le coût annuel ?")}
        ${criteriaBar("Performance sacrifiée", s.dragScore, "Combien l'investisseur abandonne historiquement")}
        ${criteriaBar("Marché stressé", s.stressScore, "Amplification dans les drawdowns")}
        ${criteriaBar("Non-rappel", s.capitalLossSeverityScore, "Surcoût si le produit va au terme")}
        ${criteriaBar("Marché latéral", s.pathDependencyScore, "Risque d'érosion quand l'indice stagne")}
      </div>
    </div>
    <div class="dec-browser-tab" data-scr-tab="compare">
      ${comparatorPreview(item, s)}
    </div>`;
    }

    function switchScreenerDetailTab(tab) {
      document.querySelectorAll(".dec-browser-tabs button").forEach((btn) => {
        btn.classList.toggle("on", btn.dataset.tab === tab);
      });
      document.querySelectorAll("[data-scr-tab]").forEach((panel) => {
        panel.classList.toggle("on", panel.dataset.scrTab === tab);
      });
    }

    function businessVerdict(score) {
      if (score.fitScore >= 80 && score.netCarry >= 0) return { label: "Défendable", cls: "ok" };
      if (score.fitScore >= 60) return { label: "À justifier", cls: "warn" };
      return { label: "À éviter", cls: "bad" };
    }

    function miniGraph(item, score) {
      const prEnd = 100 + item.historicalReturn5Y * 5;
      const decEnd = 100 + item.decrementReturn5Y * 5;
      return `<div class="dec-mini-graph">
        <svg viewBox="0 0 420 150" preserveAspectRatio="none">
          <path d="M20 120 C120 90 250 60 400 ${150 - prEnd * 0.65}" fill="none" stroke="var(--cyan)" stroke-width="2"/>
          <path d="M20 120 C120 100 250 78 400 ${150 - decEnd * 0.65}" fill="none" stroke="var(--gold)" stroke-width="2"/>
          <line x1="20" y1="120" x2="400" y2="120" stroke="var(--border2)"/>
        </svg>
        <div class="dec-graph-legend"><span style="color:var(--cyan)">PR standard</span><span style="color:var(--gold)">IL décrémenté</span><span>Drag ${score.annualDrag.toFixed(1)}%/an</span></div>
      </div>`;
    }

    function comparatorPreview(item, score) {
      return `<div class="dec-compare-preview">
        <div><b>${item.name}</b><span>Score ${score.fitScore} · ${score.grade}</span><label>Coupon A (%)</label><input class="f-inp" value="8.0" /></div>
        <div><b>Challenger</b><span>Sélection dans le comparateur complet</span><label>Coupon B (%)</label><input class="f-inp" value="8.5" /></div>
        <p>Duel coupon : le supplément de rendement doit battre le coût du décrément, pas seulement paraître plus généreux.</p>
      </div>`;
    }

    function criteriaBar(label, score, detail) {
      if (!Number.isFinite(score)) {
        return `
        <div class="dec-detail-crit">
          <div class="dec-detail-crit-label">${label}<span>${detail}</span></div>
          <div class="dec-detail-crit-bar"><div style="width:100%;background:var(--border2);"></div></div>
          <div class="dec-detail-crit-score" style="color:var(--text3)">Neutralisé</div>
        </div>`;
      }
      const color =
        score >= 75
          ? "var(--green)"
          : score >= 50
            ? "var(--gold)"
            : score >= 25
              ? "var(--orange)"
              : "var(--red)";
      return `
        <div class="dec-detail-crit">
          <div class="dec-detail-crit-label">${label}<span>${detail}</span></div>
          <div class="dec-detail-crit-bar"><div style="width:${score}%;background:${color};"></div></div>
          <div class="dec-detail-crit-score" style="color:${color}">${score}/100</div>
        </div>`;
    }

    function sourceBadge(score) {
      return `<span class="dec-source-badge" title="${score.sourceTooltip}">${score.sourceLabel}</span>`;
    }

    function clientLanguage(item, score) {
      const refNote = score.decPctRefNote ? ` (${score.decPctRefNote})` : "";
      const shared = `Le sous-jacent ${item.name} utilise un mécanisme de décrément représentant ${score.decPctAnnual.toFixed(1)}%/an${refNote}. Le dividende historique ressort à ${item.historicalDividend.toFixed(1)}%/an, soit une couverture de ${score.coverageRatio.toFixed(2)}x. Le drag annualisé estimé est de ${score.annualDrag.toFixed(1)}%/an et le scénario adverse ajoute ${score.capitalLossSeverity.toFixed(1)} points de perte en cas de non-rappel.`;
      if (score.grade === "A") {
        return `${shared} Ce mécanisme est économiquement justifié au regard des données historiques disponibles. Note Decrement Score : ${score.grade} (${score.fitScore}/100).`;
      }
      if (score.grade === "B") {
        return `${shared} Ce mécanisme présente un coût modéré, compensé par le supplément de coupon à vérifier sur la term sheet. Note Decrement Score : ${score.grade} (${score.fitScore}/100).`;
      }
      if (score.grade === "C") {
        return `${shared} Le coupon perçu reflète en partie une performance future sacrifiée. Note Decrement Score : ${score.grade} (${score.fitScore}/100).`;
      }
      return `${shared} Le coût du décrément est significatif et doit être explicitement présenté au client. Note Decrement Score : ${score.grade} (${score.fitScore}/100).`;
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
      showScreenerDetail,
      createPitchFromOpportunity,
      renderNutriScore,
      switchScreenerDetailTab,
    };
  },
);
