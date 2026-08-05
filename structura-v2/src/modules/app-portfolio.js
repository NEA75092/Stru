(function initStructuraPortfolio(root, factory) {
  const api = factory(root);
  Object.assign(root, api);
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(
  typeof globalThis !== "undefined" ? globalThis : this,
  function createStructuraPortfolio(root) {
    const {
      moneyShort,
      pctFr,
      shortDateFr,
      notify,
      escapeHtml,
      setTextFlash,
      renderGauge,
      computeRiskDistribution,
      renderRowsWithGaugeTransition,
      buildSyntheticLevelSeries,
    } = root.StructuraUtils;
    const {
      runtime,
      productsForScope,
      isProdMode,
      getClientLabel,
      getClientById,
      CLIENTS,
      PRODUCTS,
      productMatchesClientSearch,
      getProductAllocations,
      envelopeLabel,
      channelLabel,
      formatSubDate,
    } = root.StructuraAppState;
    const {
      TYPE_CLASS,
      TYPE_SHORT,
      ST_COLOR,
      ST_LABEL_SHORT,
    } = root.StructuraPortfolioConstants;

    const pfFilter = runtime.pfFilter;
    const pfSort = runtime.pfSort;
    const barrierSort = runtime.barrierSort || (runtime.barrierSort = { col: "dist", asc: true });
    let barrierSearch = "";
    let barrierStatusFilter = null;

    function matchesProductSearch(product, query) {
      const q = String(query || "").trim().toLowerCase();
      if (!q) return true;
      if (productMatchesClientSearch(product, q)) return true;
      return [
        product.name,
        product.isin,
        product.emetteur,
        product.underlying,
        product.type,
        product.productFamily,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q));
    }

    function formatIssuerVl(product) {
      if (
        (product.vlStatus === "issuer" || product.vlStatus === "mock") &&
        Number.isFinite(Number(product.vlPct))
      ) {
        const suffix = product.vlStatus === "mock" ? " *" : "";
        return `${pctFr(Number(product.vlPct), 2)}${suffix}`;
      }
      if (product.vlStatus === "no_isin" || !product.isin) {
        return `<span class="cell-faint">ISIN requis</span>`;
      }
      return `<span class="cell-warn">À récupérer</span>`;
    }

    function issuerVlDetail(product) {
      if (
        (product.vlStatus === "issuer" || product.vlStatus === "mock") &&
        Number.isFinite(Number(product.vlPct))
      ) {
        const parts = [`${pctFr(Number(product.vlPct), 2)} du nominal`];
        if (product.vlAsOf) parts.push(`au ${formatSubDate(product.vlAsOf)}`);
        if (product.vlSource) parts.push(product.vlSource);
        return parts.join(" · ");
      }
      if (!product.isin) return "Renseigner l'ISIN pour interroger la VL émetteur";
      return "VL non disponible — connecter le flux banque émettrice pour cet ISIN";
    }

    function formatPct(value, digits = 2) {
      return root.StructuraDomain?.formatPctFr
        ? root.StructuraDomain.formatPctFr(value, digits, "—")
        : Number.isFinite(Number(value))
          ? pctFr(Number(value), digits)
          : "—";
    }

    function productFamilyLabel(product) {
      const family = product.productFamily || product.characteristics?.productFamily;
      return root.StructuraDomain?.PRODUCT_FAMILIES?.[family]?.label || family || "—";
    }

    // Fiche produit unique (passe 8, §2) : les champs additionnels par
    // famille (bearish, CLN, note, panier...) ne vivent plus dans une
    // grille "Caractéristiques" à part — chacun rejoint le bloc imposé
    // auquel il appartient (identité / sous-jacent / barrières / coupon).
    function characteristicGroups(product) {
      const c = product.characteristics || {};
      const identity = [["Type", productFamilyLabel(product)]];
      const underlying = [];
      // Barrière coupon / PDI-seuil final / Seuil rappel ne sont pas
      // répétés ici : ce sont les trois niveaux déjà visualisés par les
      // réglettes de barrierGaugeRow (ci-dessous), une information un
      // seul endroit.
      const barriers = [];
      // Périodicité/Effet mémoire ne sont pas répétés ici : déjà dans le
      // bloc Coupon imposé par §2, juste en dessous.
      const coupon = [["Coupon / période", formatPct(c.couponPerPeriodPct)]];
      if (c.oxygenBarrier) barriers.push(["Barrière oxygène", formatPct(c.oxygenBarrier, 0)]);
      if (c.putLeveraged)
        barriers.push([
          "Put leveraged",
          `${formatPct(c.putLeveragedPdi, 0)} · multiplicateur x${c.putLeveragedMultiplier || "—"}`,
        ]);
      if (c.basketStructure && c.underlyings?.length) {
        underlying.push([
          "Panier",
          root.StructuraDomain?.describeUnderlyingBasket
            ? root.StructuraDomain.describeUnderlyingBasket(
                c.underlyings,
                c.basketStructure,
                c.underlyingType === "action_vanille" ? "actions" : "indices",
              )
            : c.underlyings.join(", "),
        ]);
      }
      if (c.initialLevelType && root.StructuraDomain?.initialLevelWording)
        underlying.push(["Niveau initial", root.StructuraDomain.initialLevelWording(c)]);
      if (c.productFamily === "bearish_taux") {
        barriers.push(["Logique", "Rappel/coupon si le sous-jacent clôture en dessous du seuil"]);
        barriers.push(["Barrière rappel bearish", formatPct(c.bearishRecallBarrier, 0)]);
        barriers.push(["Barrière coupon bearish", formatPct(c.bearishCouponBarrier, 0)]);
      }
      if (c.productFamily === "cln") {
        barriers.push(["Entité de référence", c.referenceEntity || "—"]);
        barriers.push(["Événement crédit", c.creditEventDefinition || "ISDA"]);
        barriers.push(["Callable", c.callable ? "Oui" : "Non"]);
      }
      if (c.productFamily === "note") {
        coupon.push(["Type taux", c.rateType || "—"]);
        coupon.push(["Cap / Floor", `${formatPct(c.capPct)} / ${formatPct(c.floorPct)}`]);
        coupon.push(["Spread", formatPct(c.spreadPct)]);
      }
      const clean = (rows) => rows.filter(([, value]) => value !== "—" && !/^XX\s*%$/.test(value));
      return {
        identity: clean(identity),
        underlying: clean(underlying),
        barriers: clean(barriers),
        coupon: clean(coupon),
      };
    }

    // Distance à un seuil quelconque (coupon/rappel/capital), dérivée du
    // niveau actuel du sous-jacent — pas trois flux de marché séparés,
    // un seul niveau (currentLevelPct) comparé à trois seuils. Piste,
    // remplissage et repère suivent le vocabulaire réglette (§1.4) :
    // axe fixe -20 %/+40 %, repère de seuil toujours à sa position 0 %.
    const GAUGE_AXIS_MIN = -20;
    const GAUGE_AXIS_MAX = 40;
    function barrierGaugeRow(label, thresholdPct, currentLevelPct, type) {
      if (!Number.isFinite(Number(thresholdPct)) || !Number.isFinite(Number(currentLevelPct)))
        return "";
      const dist = Number(currentLevelPct) - Number(thresholdPct);
      const st = root.StructuraAppState?.statusFromDist
        ? root.StructuraAppState.statusFromDist(dist, type)
        : { cls: "st-none" };
      return renderGauge({
        scale: "drawer",
        value: dist,
        min: GAUGE_AXIS_MIN,
        max: GAUGE_AXIS_MAX,
        threshold: 0,
        tone: st.cls,
        display: `${dist >= 0 ? "+" : ""}${pctFr(dist, 1)}`,
        label,
        sublabel: `Seuil ${formatPct(thresholdPct, 0)}`,
      });
    }

    /** Smooth line through points via quadratic beziers to consecutive
     * midpoints — a lightweight, dependency-free line-chart smoothing
     * that reads far less mechanical than straight segments. */
    function smoothSvgPath(pts) {
      if (pts.length < 2) return "";
      let d = `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
      for (let i = 1; i < pts.length; i++) {
        const midX = (pts[i - 1].x + pts[i].x) / 2;
        const midY = (pts[i - 1].y + pts[i].y) / 2;
        d += ` Q${pts[i - 1].x.toFixed(1)},${pts[i - 1].y.toFixed(1)} ${midX.toFixed(1)},${midY.toFixed(1)}`;
      }
      const last = pts[pts.length - 1];
      d += ` L${last.x.toFixed(1)},${last.y.toFixed(1)}`;
      return d;
    }

    /** [{date, level}] → [{t, level}], t en fraction 0-1 du range de
     * dates (index régulier si les dates sont absentes/identiques). */
    function toFractionalSeries(history) {
      const times = history.map((pt) => new Date(pt.date).getTime());
      const t0 = Math.min(...times);
      const t1 = Math.max(...times);
      return history.map((pt, i) => ({
        t: t1 > t0 ? (new Date(pt.date).getTime() - t0) / (t1 - t0) : i / Math.max(1, history.length - 1),
        level: pt.level,
      }));
    }

    /* Graphique historique prix vs barrière — le composant signature du
       tiroir de détail. Passe TOUJOURS par StructuraLiveData (voir
       live-data-adapter.js) plutôt que d'appeler vl-registry.js ou
       buildSyntheticLevelSeries directement : le jour où un vrai flux
       de marché/VL est branché, seul live-data-adapter.js change, pas
       ce composant. getUnderlyingHistory/getVLHistory renvoient
       toujours null aujourd'hui (aucun flux réel) — fallback sur
       buildSyntheticLevelSeries (avec son disclaimer) pour le
       sous-jacent ; la VL reste un point unique en repère plat tant
       que getVLHistory ne renvoie rien. */
    async function buildPriceBarrierChart(p) {
      if (p.type === "CG") return "";
      const liveHistory = await root.StructuraLiveData.getUnderlyingHistory(p);
      const isLiveUnderlying = Array.isArray(liveHistory) && liveHistory.length > 1;
      let points;
      let barrierLevel;
      if (isLiveUnderlying) {
        points = toFractionalSeries(liveHistory);
        barrierLevel = Number(p.barrier);
      } else {
        const synthetic = buildSyntheticLevelSeries(p);
        if (!synthetic) return "";
        points = synthetic.points;
        barrierLevel = synthetic.barrierLevel;
      }
      if (!Number.isFinite(barrierLevel) || barrierLevel <= 0) return "";

      const c = p.characteristics || {};
      const couponBarrier = Number(c.couponBarrier);
      const recallLevel = Number(c.fixedRecallThreshold) || Number(c.firstCallThreshold);
      const hasCouponBand = Number.isFinite(couponBarrier) && couponBarrier > barrierLevel;
      const hasRecallLine = Number.isFinite(recallLevel) && recallLevel > (hasCouponBand ? couponBarrier : barrierLevel);

      // VL émetteur : StructuraLiveData.getVL() délègue à vl-registry.js
      // en interne aujourd'hui (comportement inchangé) — un vrai flux
      // remplacerait cette seule fonction. getVLHistory() est toujours
      // null (pas d'historique VL) : tracée en segment plat plutôt que
      // de fabriquer un second point de départ inventé — seul le
      // sous-jacent a le droit à une simulation. Superposée sur CE
      // graphique plutôt qu'un chart séparé : une seule référence
      // visuelle, prête à devenir une vraie série le jour où l'historique
      // VL existe.
      const [liveVl, liveVlHistory] = await Promise.all([
        root.StructuraLiveData.getVL(p.isin),
        root.StructuraLiveData.getVLHistory(p),
      ]);
      const vlLevel = liveVl && Number.isFinite(Number(liveVl.vlPct)) ? Number(liveVl.vlPct) : null;
      const hasVl = vlLevel !== null;
      const isLiveVlHistory = Array.isArray(liveVlHistory) && liveVlHistory.length > 1;
      const vlPoints = isLiveVlHistory ? toFractionalSeries(liveVlHistory) : null;

      const levels = points.map((pt) => pt.level);
      const vlLevels = vlPoints ? vlPoints.map((pt) => pt.level) : hasVl ? [vlLevel] : [];
      const topRef = hasRecallLine ? recallLevel : 100;
      const dataMin = Math.min(...levels, barrierLevel, ...(vlLevels.length ? vlLevels : [Infinity]));
      const dataMax = Math.max(...levels, topRef, ...(vlLevels.length ? vlLevels : [-Infinity]));
      const spread = dataMax - dataMin || 1;
      const min = dataMin - spread * 0.1;
      const max = dataMax + spread * 0.1;

      const W = 1000;
      const H = 180;
      const padT = 10;
      const padB = 10;
      const plotH = H - padT - padB;
      const xAt = (frac) => frac * W;
      const yAt = (level) => padT + plotH - ((level - min) / (max - min)) * plotH;

      const bandStops = hasCouponBand
        ? [min, barrierLevel, couponBarrier, max]
        : [min, barrierLevel, max];
      const bandColors = hasCouponBand
        ? ["var(--color-breach)", "var(--color-watch)", "var(--color-safe)"]
        : ["var(--color-breach)", "var(--color-safe)"];
      let bands = "";
      for (let i = 0; i < bandColors.length; i++) {
        const yTop = yAt(bandStops[i + 1]);
        const yBottom = yAt(bandStops[i]);
        bands += `<rect x="0" y="${yTop.toFixed(1)}" width="${W}" height="${(yBottom - yTop).toFixed(1)}" fill="${bandColors[i]}" opacity="0.07"/>`;
      }

      const recallLine = hasRecallLine
        ? `<line x1="0" y1="${yAt(recallLevel).toFixed(1)}" x2="${W}" y2="${yAt(recallLevel).toFixed(1)}" stroke="var(--color-ink)" stroke-width="1" stroke-dasharray="4 4" opacity="0.4"/>
           <text x="${W - 4}" y="${(yAt(recallLevel) - 5).toFixed(1)}" text-anchor="end" font-size="9" font-family="var(--font-mono-data)" fill="var(--color-ink)" opacity="0.6">AUTOCALL ${pctFr(recallLevel, 0)}</text>`
        : "";

      // Dash pattern différent de la ligne autocall (mêmes teintes égée
      // par cohérence, mais un pointillé fin plutôt que des tirets)
      // pour rester lisible si les deux références coexistent. Segment
      // plat tant que getVLHistory() ne renvoie rien ; vraie courbe
      // lissée dès qu'un historique VL existe.
      let vlLine = "";
      if (isLiveVlHistory) {
        const vlLinePts = vlPoints.map((pt) => ({ x: xAt(pt.t), y: yAt(pt.level) }));
        vlLine = `<path d="${smoothSvgPath(vlLinePts)}" fill="none" stroke="var(--color-ink)" stroke-width="1.5" stroke-dasharray="1.5 3" opacity="0.7" vector-effect="non-scaling-stroke"/>`;
      } else if (hasVl) {
        vlLine = `<line x1="0" y1="${yAt(vlLevel).toFixed(1)}" x2="${W}" y2="${yAt(vlLevel).toFixed(1)}" stroke="var(--color-ink)" stroke-width="1.5" stroke-dasharray="1.5 3" opacity="0.6"/>
           <text x="4" y="${(yAt(vlLevel) - 5).toFixed(1)}" text-anchor="start" font-size="9" font-family="var(--font-mono-data)" fill="var(--color-ink)" opacity="0.6">VL ÉMETTEUR ${pctFr(vlLevel, 1)}</text>`;
      }

      const linePts = points.map((pt) => ({ x: xAt(pt.t), y: yAt(pt.level) }));
      const path = smoothSvgPath(linePts);
      const last = linePts[linePts.length - 1];

      const legend = `
        <div class="dr-price-chart-legend">
          <span class="dr-price-chart-legend-item"><span class="dr-price-chart-legend-swatch dr-price-chart-legend-swatch-solid"></span>Sous-jacent${isLiveUnderlying ? "" : " (simulé)"}</span>
          ${hasVl ? `<span class="dr-price-chart-legend-item"><span class="dr-price-chart-legend-swatch dr-price-chart-legend-swatch-dotted"></span>VL émetteur</span>` : ""}
        </div>`;

      const noteParts = [];
      if (!isLiveUnderlying) {
        noteParts.push(
          "Simulation illustrative ancrée sur le niveau initial et la distance barrière actuelle — aucun flux de marché historique n'est encore branché.",
        );
      }
      if (hasVl && !isLiveVlHistory) {
        noteParts.push(
          "La VL émetteur est un point unique (pas d'historique disponible), affichée en repère plat.",
        );
      }

      return `
        <div class="divider"></div>
        <div class="dr-section-title">HISTORIQUE SOUS-JACENT VS BARRIÈRE</div>
        <div class="dr-price-chart-wrap">
          <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" class="dr-price-chart-svg">
            ${bands}
            ${recallLine}
            ${vlLine}
            <path d="${path}" fill="none" stroke="var(--color-ink)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
            <circle cx="${last.x.toFixed(1)}" cy="${last.y.toFixed(1)}" r="3.5" fill="var(--color-ink)"/>
          </svg>
        </div>
        ${legend}
        ${noteParts.length ? `<div class="dr-price-chart-note">${noteParts.join(" ")}</div>` : ""}`;
    }

    function productSri(product) {
      const value = product?.sri;
      return Number.isFinite(Number(value)) ? Number(value) : null;
    }

    function renderPf() {
      let data = [...productsForScope()];
      if (pfFilter.type !== "all") {
        if (String(pfFilter.type).startsWith("family:")) {
          const family = String(pfFilter.type).replace("family:", "");
          data = data.filter(
            (p) => (p.productFamily || p.characteristics?.productFamily) === family,
          );
        } else {
          data = data.filter((p) => p.type === pfFilter.type);
        }
      }
      if (pfFilter.alertsOnly) {
        data = data.filter((p) => p.st.s !== "safe" && p.st.s !== "none");
      }
      if (pfFilter.search) {
        data = data.filter((p) => matchesProductSearch(p, pfFilter.search));
      }
      const { col, asc } = pfSort;
      data.sort((a, b) => {
        let va = portfolioSortValue(a, col);
        let vb = portfolioSortValue(b, col);
        const na = Number(va);
        const nb = Number(vb);
        if (Number.isFinite(na) && Number.isFinite(nb)) {
          va = na;
          vb = nb;
        } else {
          va = String(va || "").toLowerCase();
          vb = String(vb || "").toLowerCase();
        }
        return asc
          ? va > vb
            ? 1
            : va < vb
              ? -1
              : 0
          : va < vb
            ? 1
            : va > vb
              ? -1
              : 0;
      });
      document.getElementById("pf-count").textContent =
        `${data.length} produits${isProdMode() ? " reels" : ""}`;
      const tbody = document.getElementById("pf-tbody");
      if (!data.length) {
        tbody.innerHTML = `<tr><td colspan="11" class="tbl-empty">Aucun produit reel en mode production. Importez un CSV ou ajoutez un produit depuis l'ingestion docs.</td></tr>`;
        return;
      }
      const rowHtml = data
        .map((p) => {
          const pnlCol = p.pnl >= 0 ? "up" : "dn";
          const pnlStr = p.pnl === 0 ? "—" : (p.pnl > 0 ? "+" : "") + moneyShort(p.pnl);
          const pnlPctStr = (p.pnlPct >= 0 ? "+" : "") + pctFr(p.pnlPct);
          const dist = distProtectionCell(p);
          return `<tr data-row-key="${p.id}" class="${p.st.s === "breach" ? "row-breach" : p.st.s === "crit" || p.st.s === "warn" ? "row-warn" : ""}" onclick="openDrawer(${p.id})">
      <td data-flip-border><div class="p-name">${escapeHtml(p.name)}</div><div class="p-isin">${escapeHtml(p.isin)}</div></td>
      <td><span class="pill-category ${TYPE_CLASS[p.type]}">${escapeHtml(TYPE_SHORT[p.type] || p.type)}</span></td>
      <td class="cell-muted" title="${escapeHtml(p.emetteur)}">${escapeHtml(p.emetteur)}</td>
      <td class="num">${moneyShort(p.nominal)}</td>
      <td class="num">${formatIssuerVl(p)}</td>
      <td class="num">${moneyShort(p.val)}</td>
      <td class="num ${pnlCol}" data-flash="pnl"><div class="pnl-cell"><span>${pnlStr}</span><small>${pnlPctStr}</small></div></td>
      <td>${renderGauge({
        scale: "row",
        value: dist.value,
        min: GAUGE_AXIS_MIN,
        max: GAUGE_AXIS_MAX,
        threshold: dist.threshold,
        tone: p.st.cls,
        display: dist.display,
        tooltip: dist.tooltip,
      })}</td>
      <td class="cell-faint">${escapeHtml(shortDateFr(p.nextEvtDate))}</td>
      <td><span class="pill-status ${ST_COLOR[p.st.s]}">${escapeHtml(ST_LABEL_SHORT[p.st.s])}</span></td>
    </tr>`;
        })
        .join("");
      renderRowsWithGaugeTransition(tbody, rowHtml);
    }

    // Les trois cas de la colonne Distance protection (passe 4, section C) :
    // barrière suivie (couleur du statut + jauge réelle), CG sans barrière
    // (gris, jauge vide — caractéristique du produit) et donnée manquante
    // (ambre, jauge vide — tâche de collecte). La distinction se fait sur
    // le type de produit, jamais sur la nullité de dist : un CG n'a
    // structurellement pas de barrière, un AC sans distance a une donnée
    // absente — ce n'est pas la même situation.
    // Axe partagé avec le tiroir (barrierGaugeRow, §1.4) : même
    // -20 %/+40 % qu'importe l'échelle, pour que la même barrière tombe
    // au même endroit en ligne de tableau et en tiroir. Sans donnée
    // (CG ou distance manquante), value/threshold restent null : pas de
    // remplissage ni de repère à afficher — un seuil sans position à
    // comparer n'encode rien.
    function distProtectionCell(p) {
      const hasDist = Number.isFinite(Number(p.dist));
      if (p.type === "CG") {
        return {
          value: null,
          threshold: null,
          display: `—<small class="dist-note">sans barrière</small>`,
          tooltip: "Capital garanti — pas de barrière de protection",
        };
      }
      if (!hasDist) {
        return {
          value: null,
          threshold: null,
          display: `À confirmer<small class="dist-note">donnée manquante</small>`,
          tooltip: "Barrière à confirmer",
        };
      }
      return {
        value: p.dist,
        threshold: 0,
        display: (p.dist < 0 ? "" : "+") + pctFr(p.dist, 1),
        tooltip: `Barrière ${pctFr(p.barrier, 0)} · distance actuelle ${pctFr(p.dist, 1)}`,
      };
    }

    function portfolioSortValue(product, col) {
      if (col === "statusRank") {
        const rank = { breach: 0, crit: 1, warn: 2, unknown: 3, safe: 4, none: 5 };
        return rank[product.st?.s] ?? 3;
      }
      if (col === "type") return productFamilyLabel(product);
      if (col === "client") return getClientLabel(product.clientId);
      if (col === "coupon") return product.cpnNum ?? 0;
      return product[col] ?? "";
    }

    // Date de la prochaine observation la plus proche parmi une liste de
    // produits — c'est elle qui donne son urgence au sous-titre des cartes
    // critique/surveillance (section D, demande client explicite).
    function nearestObsLabel(products) {
      const dates = products.map((p) => p.nextEvtDate).filter(Boolean).sort();
      if (!dates.length) return "";
      const [, m, d] = dates[0].split("-");
      return `${d}.${m}`;
    }

    function setBarrierKpi(id, count, total, subText, invert) {
      setTextFlash(id, count, { invert });
      const bar = document.getElementById(`${id}-bar`);
      if (bar) bar.style.width = `${total ? Math.round((count / total) * 100) : 0}%`;
      const sub = document.getElementById(`${id}-sub`);
      if (sub) sub.textContent = subText;
    }

    function renderBarrierKpis() {
      const total = productsForScope().length;
      const data = productsForScope().filter((p) => p.type !== "CG");
      const breachList = data.filter((p) => p.st?.s === "breach");
      const critList = data.filter((p) => p.st?.s === "crit");
      const watchList = data.filter((p) => p.st?.s === "warn");
      const safe = data.filter((p) => p.st?.s === "safe").length;

      setBarrierKpi(
        "bar-kpi-breach",
        breachList.length,
        total,
        "Perte de capital probable",
        true,
      );
      const critObs = nearestObsLabel(critList);
      setBarrierKpi(
        "bar-kpi-crit",
        critList.length,
        total,
        critObs ? `Sous 5 % du seuil · prochaine obs. ${critObs}` : "Sous 5 % du seuil",
        true,
      );
      const watchObs = nearestObsLabel(watchList);
      setBarrierKpi(
        "bar-kpi-watch",
        watchList.length,
        total,
        watchObs
          ? `Entre 5 et 15 % du seuil · prochaine obs. ${watchObs}`
          : "Entre 5 et 15 % du seuil",
        true,
      );
      setBarrierKpi("bar-kpi-safe", safe, total, "Au-delà de 15 % du seuil", false);

      // Les 4 cartes de statut sont le seul point d'entrée du filtre par
      // statut (passe 8, §4) : la frise ci-dessous devient un mini-graphe
      // non interactif, sa version complète avec pastilles cliquables vit
      // désormais dans Pilotage. Reprendre ici l'ancien rôle des pastilles
      // évite de perdre le filtrage du tableau.
      [
        ["bar-kpi-breach-card", "breach"],
        ["bar-kpi-crit-card", "crit"],
        ["bar-kpi-watch-card", "warn"],
        ["bar-kpi-safe-card", "safe"],
      ].forEach(([id, status]) => {
        document.getElementById(id)?.classList.toggle("on", barrierStatusFilter === status);
      });
    }

    // Frise de distance (section E) : un point par produit à barrière sur
    // un axe -20%/+40%, coloré par statut — la distribution du risque en
    // un coup d'œil, ce qu'aucun tableau trié ne montre. Mini-graphe non
    // interactif (passe 8, §4) : ni échelle ni pastille de filtre ici, la
    // version complète et interactive vit dans Pilotage (app-analytics.js,
    // renderRiskDistribution) — même calcul, computeRiskDistribution
    // (StructuraUtils), pour ne jamais faire diverger les deux lectures.
    function renderDistStrip() {
      const track = document.getElementById("bar-dist-track");
      if (!track) return;
      const data = productsForScope().filter((p) => p.type !== "CG");
      const { dots, zeroPct } = computeRiskDistribution(data);
      const dotsHtml = dots
        .map(
          (d) =>
            `<span class="dist-strip-dot ${d.cls}" style="left:${d.pct.toFixed(2)}%" title="${escapeHtml(d.name)} · ${pctFr(d.dist, 1)}"></span>`,
        )
        .join("");
      track.innerHTML = `<div class="dist-strip-zone-danger" style="width:${zeroPct.toFixed(2)}%"></div><span class="dist-strip-zero" style="left:${zeroPct.toFixed(2)}%" title="Seuil de la barrière — 0 %"></span>${dotsHtml}`;
    }

    function filterBarriersByStatus(status) {
      barrierStatusFilter = barrierStatusFilter === status ? null : status;
      renderBarriers();
    }

    function renderBarriers() {
      renderBarrierKpis();
      renderDistStrip();
      const tbody = document.getElementById("bar-tbody");
      const data = [...productsForScope()]
        .filter((p) => p.type !== "CG")
        .filter((p) => matchesProductSearch(p, barrierSearch))
        .filter((p) => !barrierStatusFilter || p.st.s === barrierStatusFilter)
        .sort(compareBarrierRows);
      if (!data.length) {
        tbody.innerHTML = `<tr><td colspan="10" class="tbl-empty">Aucune barrière à suivre en mode production.</td></tr>`;
        return;
      }
      const rowHtml = data
        .map((p) => {
          const hasDist = Number.isFinite(Number(p.dist));
          const dist = distProtectionCell(p);
          const barrierAbs = p.barrier ? moneyShort((p.nominal * p.barrier) / 100) : "";
          const barrierAmt = p.barrier ? pctFr(p.barrier, 0) : "N/A";
          const barTooltip = hasDist
            ? `Barrière ${pctFr(p.barrier, 0)} (${barrierAbs}) · ${p.st.label.toLowerCase()}`
            : `Barrière ${pctFr(p.barrier, 0)} (${barrierAbs}) · distance à confirmer`;
          return `<tr data-row-key="${p.id}" onclick="openDrawer(${p.id})">
      <td><div class="p-name">${escapeHtml(p.name)}</div><div class="p-isin">${escapeHtml(p.isin)}</div></td>
      <td><span class="pill-category ${TYPE_CLASS[p.type]}">${escapeHtml(TYPE_SHORT[p.type] || p.type)}</span></td>
      <td class="cell-muted" title="${escapeHtml(p.emetteur)}">${escapeHtml(p.emetteur)}</td>
      <td class="cell-muted" title="${escapeHtml(p.underlying)}">${escapeHtml(p.underlying)}</td>
      <td class="num"><div class="barrier-cell"><span>${barrierAmt}</span>${barrierAbs ? `<small>${barrierAbs}</small>` : ""}</div></td>
      <td class="num">${formatIssuerVl(p)}</td>
      <td class="num">${moneyShort(p.val)}</td>
      <td>${renderGauge({
        scale: "row",
        value: dist.value,
        min: GAUGE_AXIS_MIN,
        max: GAUGE_AXIS_MAX,
        threshold: dist.threshold,
        tone: p.st.cls,
        display: dist.display,
        tooltip: barTooltip,
      })}</td>
      <td class="cell-faint">${escapeHtml(shortDateFr(p.nextEvtDate))}</td>
      <td><span class="pill-status ${ST_COLOR[p.st.s]}">${escapeHtml(ST_LABEL_SHORT[p.st.s])}</span></td>
    </tr>`;
        })
        .join("");
      renderRowsWithGaugeTransition(tbody, rowHtml);
    }

    function filterBarriers(value) {
      barrierSearch = value || "";
      renderBarriers();
    }

    function barrierSortValue(product, col) {
      if (col === "statusRank") {
        const rank = { breach: 0, crit: 1, warn: 2, unknown: 3, safe: 4, none: 5 };
        return rank[product.st?.s] ?? 3;
      }
      return product[col] ?? "";
    }

    function compareBarrierRows(a, b) {
      let va = barrierSortValue(a, barrierSort.col);
      let vb = barrierSortValue(b, barrierSort.col);
      const na = Number(va);
      const nb = Number(vb);
      if (Number.isFinite(na) && Number.isFinite(nb)) {
        va = na;
        vb = nb;
      } else {
        va = String(va || "").toLowerCase();
        vb = String(vb || "").toLowerCase();
      }
      if (va === vb) return 0;
      return barrierSort.asc ? (va > vb ? 1 : -1) : va < vb ? 1 : -1;
    }

    function sortBarriers(col) {
      if (barrierSort.col === col) barrierSort.asc = !barrierSort.asc;
      else {
        barrierSort.col = col;
        barrierSort.asc = true;
      }
      renderBarriers();
    }

    function pfType(valueOrEl, maybeType) {
      pfFilter.type = maybeType || valueOrEl || "all";
      renderPf();
    }

    function filterPf(v) {
      pfFilter.search = v;
      renderPf();
    }

    function pfAlerts(el) {
      pfFilter.alertsOnly = !pfFilter.alertsOnly;
      el.classList.toggle("on", pfFilter.alertsOnly);
      renderPf();
    }

    function sortPf(col) {
      if (pfSort.col === col) pfSort.asc = !pfSort.asc;
      else {
        pfSort.col = col;
        pfSort.asc = !["nominal", "vlPct", "val", "pnl", "pnlPct"].includes(col);
      }
      document.querySelectorAll("#pf-table thead th").forEach((th) => {
        th.classList.remove("sorted", "asc");
      });
      const th = [...document.querySelectorAll("#pf-table thead th")].find((t) =>
        t.getAttribute("onclick")?.includes(`'${col}'`),
      );
      if (th) {
        th.classList.add("sorted");
        if (pfSort.asc) th.classList.add("asc");
      }
      renderPf();
    }

    function toggleCompact() {}

    async function openDrawer(id) {
      const p =
        PRODUCTS.find((x) => Number(x.id) === Number(id)) ||
        productsForScope().find((x) => Number(x.id) === Number(id)) ||
        productsForScope()[0];
      if (!p) {
        notify("Aucun produit actif a afficher", "err");
        return;
      }
      const clientContent = document.getElementById("dr-client-content");
      if (clientContent) clientContent.style.display = "none";
      const underlyingContent = document.getElementById("dr-underlying-content");
      if (underlyingContent) underlyingContent.style.display = "none";
      const productContent = document.getElementById("dr-product-content");
      if (productContent) productContent.style.display = "";
      document.getElementById("dr-name").textContent = p.name;
      document.getElementById("dr-isin").textContent = "ISIN : " + p.isin;
      const allocations = getProductAllocations(p);
      const clientStatsFn = root.clientStats || root.StructuraClients?.clientStats;
      const allocationCards = allocations
        .map((alloc) => {
          const client = getClientById(alloc.clientId);
          if (!client) return "";
          const stats = clientStatsFn ? clientStatsFn(alloc.clientId) : null;
          const weight =
            stats?.nominal && alloc.nominal
              ? pctFr((Number(alloc.nominal) / stats.nominal) * 100, 0)
              : null;
          return `<div class="dr-client-card">
            <div class="dr-client-card-main">
              <span class="dr-client-kicker">Dossier client</span>
              <strong>${escapeHtml(client.name)}</strong>
              <small>${moneyShort(alloc.nominal)} sur ce produit${weight ? ` · ${weight} du dossier` : ""}${allocations.length > 1 ? ` · ${pctFr((Number(alloc.nominal) / Number(p.nominal || 1)) * 100, 0)} du nominal produit` : ""}</small>
              <span class="dr-client-meta">
                <span class="env-badge env-${escapeHtml(alloc.envelope || "assurance-vie")}">${escapeHtml(envelopeLabel(alloc.envelope))}</span>
                <span>${escapeHtml(formatSubDate(alloc.subDate))}</span>
                <span class="channel-tag">${escapeHtml(channelLabel(alloc.channel))}</span>
              </span>
            </div>
            <button type="button" class="btn btn-primary" onclick="openClientWorkspace(${client.id})">Ouvrir le dossier →</button>
          </div>`;
        })
        .join("");
      const primaryClientId = allocations[0]?.clientId || null;
      document.getElementById("dr-client").innerHTML =
        allocations.length
          ? `${allocationCards}
          <label for="dr-client-select">${allocations.length > 1 ? "Réaffecter l'encours principal" : "Réassigner"}</label>
          <select class="f-sel" id="dr-client-select" onchange="assignProductClientFromDrawer(${p.id}, this.value)">
            <option value="">— Non assigné —</option>
            ${CLIENTS.map(
              (item) =>
                `<option value="${item.id}" ${Number(primaryClientId) === Number(item.id) ? "selected" : ""}>${escapeHtml(item.name)}</option>`,
            ).join("")}
          </select>
          ${allocations.length > 1 ? `<p class="dr-client-note">Ce produit est réparti sur ${allocations.length} dossiers. Détaillez les parts dans l'onglet Clients.</p>` : ""}`
          : `<div class="dr-client-card dr-client-card-empty">
            <div class="dr-client-card-main">
              <span class="dr-client-kicker">Dossiers clients</span>
              <strong>Non assigné</strong>
              <small>Rattachez ce produit à un ou plusieurs clients pour suivre l'encours par dossier.</small>
            </div>
            <button type="button" class="btn btn-primary" onclick="nav('clients')">Gérer les clients</button>
          </div>
          <label for="dr-client-select">Rattacher à</label>
          <select class="f-sel" id="dr-client-select" onchange="assignProductClientFromDrawer(${p.id}, this.value)">
            <option value="">— Sélectionner —</option>
            ${CLIENTS.map(
              (item) => `<option value="${item.id}">${escapeHtml(item.name)}</option>`,
            ).join("")}
          </select>`;
      const groups = characteristicGroups(p);
      const renderGrid = (id, rows) => {
        const el = document.getElementById(id);
        if (el)
          el.innerHTML = rows
            .map(
              ([k, v]) =>
                `<div><div class="dr-field-lbl">${escapeHtml(k)}</div><div class="dr-field-val">${escapeHtml(v)}</div></div>`,
            )
            .join("");
      };

      // ── Identité ──
      renderGrid("dr-identity-grid", [
        ...groups.identity,
        ["Émetteur", p.emetteur],
        ["SRI (KID)", productSri(p) != null ? `${productSri(p)}/7` : "—"],
        ["Notation émetteur", p.rating],
      ]);

      // ── Sous-jacent ── currentLevelPct dérivé de la barrière capital et
      // de sa distance déjà connues — un seul niveau, pas un flux de
      // marché séparé par bloc (passe 8, §2).
      const hasLevel =
        p.type !== "CG" &&
        Number.isFinite(Number(p.barrier)) &&
        Number.isFinite(Number(p.dist));
      const currentLevelPct = hasLevel ? Number(p.barrier) * (1 + Number(p.dist) / 100) : null;
      renderGrid("dr-underlying-grid", [
        ["Nom", p.underlying || "—"],
        [
          "Niveau initial",
          p.initialSpot
            ? `${p.initialSpot.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} pts`
            : "—",
        ],
        [
          "Niveau actuel",
          currentLevelPct != null
            ? p.initialSpot
              ? `${((p.initialSpot * currentLevelPct) / 100).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} pts · ${formatPct(currentLevelPct, 1)} du niveau initial`
              : `${formatPct(currentLevelPct, 1)} du niveau initial`
            : "À confirmer",
        ],
        [
          "Variation depuis l'origine",
          currentLevelPct != null
            ? `${currentLevelPct - 100 >= 0 ? "+" : ""}${pctFr(currentLevelPct - 100, 1)}`
            : "—",
        ],
        ...groups.underlying,
      ]);

      // ── Barrières ── une réglette 200px par seuil, distance dérivée du
      // même niveau actuel ci-dessus.
      const c = p.characteristics || {};
      const barrierGauges = [
        p.type !== "CG" && p.barrier != null
          ? barrierGaugeRow("Capital", p.barrier, currentLevelPct, p.type)
          : "",
        c.couponBarrier != null
          ? barrierGaugeRow("Coupon", c.couponBarrier, currentLevelPct, p.type)
          : "",
        c.fixedRecallThreshold != null
          ? barrierGaugeRow("Rappel", c.fixedRecallThreshold, currentLevelPct, p.type)
          : "",
      ]
        .filter(Boolean)
        .join("");
      const barriersEl = document.getElementById("dr-barriers");
      if (barriersEl) {
        barriersEl.innerHTML = barrierGauges
          ? `<div class="dr-underlying-gauges">${barrierGauges}</div>`
          : `<div class="empty-inline">Capital garanti — pas de barrière de protection.</div>`;
      }
      if (groups.barriers.length) {
        const extraEl = document.getElementById("dr-barriers");
        if (extraEl)
          extraEl.innerHTML += `<div class="dr-grid">${groups.barriers
            .map(
              ([k, v]) =>
                `<div><div class="dr-field-lbl">${escapeHtml(k)}</div><div class="dr-field-val">${escapeHtml(v)}</div></div>`,
            )
            .join("")}</div>`;
      }
      const chartEl = document.getElementById("dr-price-chart");
      if (chartEl) chartEl.innerHTML = await buildPriceBarrierChart(p);

      // ── Coupon ──
      renderGrid("dr-coupon-grid", [
        ["Taux", Number.isFinite(p.cpnNum) && p.cpnNum > 0 ? pctFr(p.cpnNum, 1) + "/an" : formatPct(c.couponPerPeriodPct)],
        ["Périodicité", c.frequency || "—"],
        ["Effet mémoire", c.hasMemory ? "Oui" : "Non"],
        ["Prochaine constatation", p.nextEvtDate ? `${formatSubDate(p.nextEvtDate)} · ${p.nextEvt || "—"}` : "—"],
        ...groups.coupon,
      ]);

      // ── Position ──
      renderGrid("dr-position-grid", [
        ["Nominal investi", moneyShort(p.nominal)],
        [
          "Valorisation",
          p.dataQuality === "extracted"
            ? moneyShort(p.val) + " (à valoriser)"
            : moneyShort(p.val),
        ],
        [
          "Plus/moins-value latente",
          p.pnl === 0
            ? "—"
            : `${p.pnl > 0 ? "+" : ""}${moneyShort(p.pnl)} (${p.pnlPct >= 0 ? "+" : ""}${pctFr(p.pnlPct, 1)})`,
        ],
        ["TRI estimé", Number.isFinite(p.triNum) && p.triNum !== 0 ? pctFr(p.triNum, 1) : "—"],
        ["VL émetteur", issuerVlDetail(p)],
        ["Maturité", formatSubDate(p.maturity)],
      ]);
      // Échéancier (§2) : appelle buildProductFullSchedule directement
      // (app-calendar.js), rendu par evHtml (app-dashboard.js) — même
      // fonction que le calendrier et la recherche produit, aucune
      // deuxième implémentation. Le tiroir s'ouvre positionné sur le
      // repère "Aujourd'hui" : un CGP cherche la prochaine échéance,
      // pas le début de 30 lignes reconstituées.
      const timelineEl = document.getElementById("dr-timeline");
      if (timelineEl) {
        const schedule = root.buildProductFullSchedule ? root.buildProductFullSchedule(p) : [];
        timelineEl.innerHTML = schedule.length
          ? root.evHtml
            ? root.evHtml(schedule)
            : ""
          : `<div class="empty-inline">Aucune échéance reconstituable pour ce produit.</div>`;
        // scrollTop direct sur le conteneur du tiroir, pas scrollIntoView :
        // scrollIntoView remonte la chaîne des ancêtres scrollables et peut
        // décaler la page ou le tableau sous-jacent à l'ouverture, sans que
        // ça se voie tout de suite. Le repère peut tomber en tout début de
        // liste (produit sans historique) ou en toute fin (produit déjà à
        // maturité, "Aujourd'hui" trié après le dernier événement) — dans
        // les deux cas, un décalage relatif au scroll courant (0 ici, le
        // tiroir vient de s'ouvrir) suffit ; le navigateur borne lui-même
        // scrollTop à l'étendue réelle du conteneur.
        const landmark = timelineEl.querySelector('[data-landmark="today"]');
        if (landmark) {
          requestAnimationFrame(() => {
            const containerRect = timelineEl.getBoundingClientRect();
            const landmarkRect = landmark.getBoundingClientRect();
            timelineEl.scrollTop += landmarkRect.top - containerRect.top;
          });
        }
      }
      document.getElementById("drawer-ov").classList.add("open");
    }

    function closeDrawer() {
      document.getElementById("drawer-ov").classList.remove("open");
    }

    function closeDrawerIfOut(e) {
      if (e.target === document.getElementById("drawer-ov")) closeDrawer();
    }

    return {
      renderPf,
      renderBarriers,
      filterBarriers,
      filterBarriersByStatus,
      sortBarriers,
      pfType,
      filterPf,
      pfAlerts,
      sortPf,
      toggleCompact,
      openDrawer,
      closeDrawer,
      closeDrawerIfOut,
    };
  },
);
