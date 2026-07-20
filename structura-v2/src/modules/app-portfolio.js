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
      notify,
      escapeHtml,
      setTextFlash,
      renderRowsWithGaugeTransition,
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
      TYPE_NAMES,
    } = root.StructuraPortfolioConstants;

    const pfFilter = runtime.pfFilter;
    const pfSort = runtime.pfSort;
    const barrierSort = runtime.barrierSort || (runtime.barrierSort = { col: "dist", asc: true });
    let barrierSearch = "";

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
        return `${Number(product.vlPct).toFixed(2)}%${suffix}`;
      }
      if (product.vlStatus === "no_isin" || !product.isin) {
        return `<span style="color:var(--text3);">ISIN requis</span>`;
      }
      return `<span style="color:var(--orange);">À récupérer</span>`;
    }

    function issuerVlDetail(product) {
      if (
        (product.vlStatus === "issuer" || product.vlStatus === "mock") &&
        Number.isFinite(Number(product.vlPct))
      ) {
        const parts = [`${Number(product.vlPct).toFixed(2)}% du nominal`];
        if (product.vlAsOf) parts.push(`au ${product.vlAsOf}`);
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
          ? `${Number(value).toFixed(digits)}%`
          : "—";
    }

    function productFamilyLabel(product) {
      const family = product.productFamily || product.characteristics?.productFamily;
      return root.StructuraDomain?.PRODUCT_FAMILIES?.[family]?.label || family || "—";
    }

    function characteristicRows(product) {
      const c = product.characteristics || {};
      const rows = [
        ["Famille métier", productFamilyLabel(product)],
        ["Coupon / période", formatPct(c.couponPerPeriodPct)],
        ["Fréquence", c.frequency || "—"],
        ["Barrière coupon", formatPct(c.couponBarrier, 0)],
        ["PDI / seuil final", formatPct(c.finalThreshold, 0)],
        ["Seuil rappel", formatPct(c.fixedRecallThreshold, 0)],
        ["Mémoire", c.hasMemory ? "Oui" : "Non"],
      ];
      if (c.oxygenBarrier) rows.push(["Barrière oxygène", formatPct(c.oxygenBarrier, 0)]);
      if (c.putLeveraged)
        rows.push([
          "Put leveraged",
          `${formatPct(c.putLeveragedPdi, 0)} · multiplicateur x${c.putLeveragedMultiplier || "—"}`,
        ]);
      if (c.basketStructure && c.underlyings?.length) {
        rows.push([
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
        rows.push(["Niveau initial", root.StructuraDomain.initialLevelWording(c)]);
      if (c.productFamily === "bearish_taux") {
        rows.push(["Logique Bearish", "Rappel/coupon si le sous-jacent clôture en dessous du seuil"]);
        rows.push(["Barrière rappel bearish", formatPct(c.bearishRecallBarrier, 0)]);
        rows.push(["Barrière coupon bearish", formatPct(c.bearishCouponBarrier, 0)]);
      }
      if (c.productFamily === "cln") {
        rows.push(["Entité de référence", c.referenceEntity || "—"]);
        rows.push(["Événement crédit", c.creditEventDefinition || "ISDA"]);
        rows.push(["Callable", c.callable ? "Oui" : "Non"]);
      }
      if (c.productFamily === "note") {
        rows.push(["Type taux", c.rateType || "—"]);
        rows.push(["Cap / Floor", `${formatPct(c.capPct)} / ${formatPct(c.floorPct)}`]);
        rows.push(["Spread", formatPct(c.spreadPct)]);
      }
      return rows.filter(([, value]) => value !== "—" && value !== "XX%");
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
      if (pfFilter.alertsOnly) data = data.filter((p) => p.st.s !== "safe");
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
        tbody.innerHTML = `<tr><td colspan="13" style="text-align:center;color:var(--text3);padding:28px;">Aucun produit reel en mode production. Importez un CSV ou ajoutez un produit depuis l'ingestion docs.</td></tr>`;
        return;
      }
      const rowHtml = data
        .map((p) => {
          const pnlCol = p.pnl >= 0 ? "up" : "dn";
          const pnlStr =
            p.pnl === 0
              ? "—"
              : (p.pnl >= 0 ? "+" : "") + moneyShort(Math.abs(p.pnl));
          const pnlPctStr = (p.pnlPct >= 0 ? "+" : "") + p.pnlPct.toFixed(1) + "%";
          const hasDist = Number.isFinite(Number(p.dist));
          const distPct =
            p.type === "CG"
              ? "—"
              : !hasDist
                ? `<span style="color:var(--text3);">À confirmer</span>`
                : p.dist < 0
                  ? `<span class="dn">${p.dist.toFixed(1)}%</span>`
                  : `<span>${p.dist.toFixed(1)}%</span>`;
          const barW =
            p.type === "CG"
              ? 5
              : !hasDist
                ? 8
                : Math.max(2, Math.min(98, 100 - Math.max(0, p.dist)));
          return `<tr data-row-key="${p.id}" class="${p.st.s === "breach" ? "row-breach" : p.st.s === "crit" || p.st.s === "warn" ? "row-warn" : ""}" onclick="openDrawer(${p.id})">
      <td><div class="p-name">${escapeHtml(p.name)}</div><div class="p-isin">${escapeHtml(p.isin)}</div></td>
      <td><span class="pill-category ${TYPE_CLASS[p.type]}">${escapeHtml(TYPE_SHORT[p.type] || p.type)}</span></td>
      <td style="color:var(--text2);font-size:10px;">${escapeHtml(p.emetteur)}</td>
      <td class="num">${moneyShort(p.nominal)}</td>
      <td class="num" style="color:var(--gold);">${formatIssuerVl(p)}</td>
      <td class="num">${moneyShort(p.val)}</td>
      <td class="num ${pnlCol}">${pnlStr}</td>
      <td class="num ${pnlCol}" data-flash="pnl">${pnlPctStr}</td>
      <td style="color:var(--gold)">${escapeHtml(p.coupon)}</td>
      <td><div class="bar-wrap"><div class="bar-track"><div class="bar-fill ${p.st.cls}" style="width:${barW}%"></div></div>${distPct}</div></td>
      <td style="color:var(--text2);font-size:10px;">${escapeHtml(p.maturity)}</td>
      <td style="font-size:10px;color:var(--text3);">${escapeHtml(p.nextEvtDate)}</td>
      <td><span class="status"><span class="s-dot" style="background:${ST_COLOR[p.st.s]};"></span><span style="font-size:9px;color:${ST_COLOR[p.st.s]};">${escapeHtml(ST_LABEL_SHORT[p.st.s])}</span></span></td>
    </tr>`;
        })
        .join("");
      renderRowsWithGaugeTransition(tbody, rowHtml);
    }

    function portfolioSortValue(product, col) {
      if (col === "statusRank") {
        const rank = { breach: 0, crit: 1, warn: 2, unknown: 3, safe: 4 };
        return rank[product.st?.s] ?? 3;
      }
      if (col === "type") return productFamilyLabel(product);
      if (col === "client") return getClientLabel(product.clientId);
      if (col === "coupon") return product.cpnNum ?? 0;
      return product[col] ?? "";
    }

    function renderBarrierKpis() {
      const data = productsForScope().filter((p) => p.type !== "CG");
      const breach = data.filter((p) => p.st?.s === "breach").length;
      const crit = data.filter((p) => p.st?.s === "crit").length;
      const watch = data.filter((p) => p.st?.s === "warn").length;
      const safe = data.filter((p) => p.st?.s === "safe").length;
      setTextFlash("bar-kpi-breach", breach, { invert: true });
      setTextFlash("bar-kpi-crit", crit, { invert: true });
      setTextFlash("bar-kpi-watch", watch, { invert: true });
      setTextFlash("bar-kpi-safe", safe);
    }

    function renderBarriers() {
      renderBarrierKpis();
      const tbody = document.getElementById("bar-tbody");
      const data = [...productsForScope()]
        .filter((p) => p.type !== "CG")
        .filter((p) => matchesProductSearch(p, barrierSearch))
        .map((p) => ({
          ...p,
          barrierType:
            p.characteristics?.barrierType ||
            p.barrierType ||
            (p.barrier > 0 ? "—" : "—"),
          sri: productSri(p),
        }))
        .sort(compareBarrierRows);
      if (!data.length) {
        tbody.innerHTML = `<tr><td colspan="10" style="text-align:center;color:var(--text3);padding:24px;">Aucune barrière à suivre en mode production.</td></tr>`;
        return;
      }
      const rowHtml = data
        .map((p) => {
          const hasDist = Number.isFinite(Number(p.dist));
          const barW = hasDist
            ? Math.max(2, Math.min(98, 100 - Math.max(0, Math.min(100, p.dist))))
            : 8;
          const sri = p.sri;
          const sriLabel = Number.isFinite(sri) ? `${sri}/7` : "—";
          const sriCol =
            !Number.isFinite(sri)
              ? "var(--text3)"
              : sri <= 2
                ? "var(--green)"
                : sri <= 4
                  ? "var(--gold)"
                  : "var(--orange)";
          const barrierAmt = p.barrier
            ? `${p.barrier}% (${((p.nominal * p.barrier) / 100 / 1e6).toFixed(2)}M€)`
            : "N/A";
          return `<tr data-row-key="${p.id}" onclick="openDrawer(${p.id})">
      <td><div class="p-name">${escapeHtml(p.name)}</div><div class="p-isin">${escapeHtml(p.isin)}</div></td>
      <td style="font-size:10px;color:var(--text2);">${escapeHtml(p.barrierType)}</td>
      <td style="color:var(--text2);">${escapeHtml(p.underlying)}</td>
      <td class="num">${barrierAmt}</td>
      <td class="num" style="color:var(--gold);">${formatIssuerVl(p)}</td>
      <td class="num">${moneyShort(p.val)}</td>
      <td class="num" data-flash="dist"><span style="color:${ST_COLOR[p.st.s] || "var(--text3)"};">${hasDist ? (p.dist < 0 ? p.dist.toFixed(1) + "%" : "+" + p.dist.toFixed(1) + "%") : "À confirmer"}</span></td>
      <td><div class="bar-wrap"><div class="bar-track" style="width:80px;"><div class="bar-fill ${p.st.cls}" style="width:${barW}%"></div></div><span style="font-size:9px;color:${ST_COLOR[p.st.s]};">${escapeHtml(p.st.label)}</span></div></td>
      <td style="font-size:10px;color:var(--text2);">${escapeHtml(p.nextEvtDate)}</td>
      <td><span style="font-size:12px;font-weight:600;color:${sriCol};">${sriLabel}</span></td>
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
      if (col === "sri") return product.sri ?? -1;
      if (col === "riskScore") return product.sri ?? -1;
      if (col === "barrierType") return product.barrierType;
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
        barrierSort.asc = col === "sri" || col === "riskScore" ? false : true;
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

    function openDrawer(id) {
      const p =
        PRODUCTS.find((x) => Number(x.id) === Number(id)) ||
        productsForScope().find((x) => Number(x.id) === Number(id)) ||
        productsForScope()[0];
      if (!p) {
        notify("Aucun produit actif a afficher", "err");
        return;
      }
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
              ? ((Number(alloc.nominal) / stats.nominal) * 100).toFixed(0)
              : null;
          return `<div class="dr-client-card">
            <div class="dr-client-card-main">
              <span class="dr-client-kicker">Dossier client</span>
              <strong>${escapeHtml(client.name)}</strong>
              <small>${moneyShort(alloc.nominal)} sur ce produit${weight ? ` · ${weight}% du dossier` : ""}${allocations.length > 1 ? ` · ${((Number(alloc.nominal) / Number(p.nominal || 1)) * 100).toFixed(0)}% du nominal produit` : ""}</small>
              <span class="dr-client-meta">
                <span class="env-badge env-${escapeHtml(alloc.envelope || "assurance-vie")}">${escapeHtml(envelopeLabel(alloc.envelope))}</span>
                <span>${escapeHtml(formatSubDate(alloc.subDate))}</span>
                <span class="channel-tag">${escapeHtml(channelLabel(alloc.channel))}</span>
              </span>
            </div>
            <button type="button" class="btn btn-gold" onclick="openClientWorkspace(${client.id})">Ouvrir le dossier →</button>
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
            <button type="button" class="btn btn-gold" onclick="nav('clients')">Gérer les clients</button>
          </div>
          <label for="dr-client-select">Rattacher à</label>
          <select class="f-sel" id="dr-client-select" onchange="assignProductClientFromDrawer(${p.id}, this.value)">
            <option value="">— Sélectionner —</option>
            ${CLIENTS.map(
              (item) => `<option value="${item.id}">${escapeHtml(item.name)}</option>`,
            ).join("")}
          </select>`;
      const fields = [
        ["SRI (KID)", productSri(p) != null ? `${productSri(p)}/7` : "—"],
        ["Type", TYPE_NAMES[p.type]],
        ["Émetteur", p.emetteur],
        ["Nominal", moneyShort(p.nominal)],
        ["VL émetteur", issuerVlDetail(p)],
        [
          "Valorisation",
          p.dataQuality === "extracted"
            ? moneyShort(p.val) + " (à valoriser)"
            : moneyShort(p.val),
        ],
        [
          "P&L",
          p.pnl === 0
            ? "—"
            : (p.pnl >= 0 ? "+" : "") +
              moneyShort(Math.abs(p.pnl)) +
              " (" +
              p.pnlPct.toFixed(1) +
              "%)",
        ],
        ["Coupon", p.coupon],
        ["TRI estimé", p.tri],
        ["Sous-jacent", p.underlying],
        [
          "Barrière protection",
          p.barrier != null
            ? `${p.barrier}%${p.barrierLevel ? ` = ${p.barrierLevel.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} pts` : ""}`
            : "N/A",
        ],
        [
          "Spot initial",
          p.initialSpot
            ? p.initialSpot.toLocaleString("fr-FR", { maximumFractionDigits: 2 }) +
              " pts"
            : "—",
        ],
        [
          "Distance barrière",
          p.type === "CG"
            ? "N/A"
            : Number.isFinite(Number(p.dist))
              ? (p.dist >= 0 ? "+" : "") + p.dist.toFixed(1) + "%"
              : "À confirmer",
        ],
        ["Maturité", p.maturity],
        ["Notation émetteur", p.rating],
      ];
      document.getElementById("dr-grid").innerHTML = fields
        .map(
          ([k, v]) =>
            `<div><div class="dr-field-lbl">${escapeHtml(k)}</div><div class="dr-field-val">${escapeHtml(v)}</div></div>`,
        )
        .join("");
      const charRows = characteristicRows(p);
      const charHtml = charRows.length
        ? `<div class="divider"></div><div class="dr-section-title">CARACTÉRISTIQUES PRODUIT</div><div class="dr-char-grid">${charRows
            .map(
              ([k, v]) =>
                `<div><div class="dr-field-lbl">${escapeHtml(k)}</div><div class="dr-field-val">${escapeHtml(v)}</div></div>`,
            )
            .join("")}</div>`
        : "";
      document.getElementById("dr-characteristics").innerHTML = charHtml;
      const tl = [
        {
          s: "done",
          d: "Date d'émission",
          l: "Émission du produit",
          v: "Strike sur " + p.underlying,
        },
        {
          s: "done",
          d: "Multiple dates",
          l: "Observations / Coupons passés",
          v: "",
        },
        { s: "next", d: p.nextEvtDate, l: p.nextEvt, v: "" },
        {
          s: "future",
          d: p.maturity,
          l: "Maturité finale",
          v: "Remboursement nominal",
        },
      ];
      document.getElementById("dr-timeline").innerHTML = tl
        .map(
          (e) =>
            `<div class="tl-ev ${e.s}"><div class="tl-dot"></div><div class="tl-date">${escapeHtml(e.d)}</div><div class="tl-lbl">${escapeHtml(e.l)}</div>${e.v ? `<div class="tl-detail">${escapeHtml(e.v)}</div>` : ""}</div>`,
        )
        .join("");
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
