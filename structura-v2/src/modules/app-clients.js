(function initStructuraClients(root, factory) {
  const api = factory(root);
  root.StructuraClients = api;
  Object.assign(root, api);
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(
  typeof globalThis !== "undefined" ? globalThis : this,
  function createStructuraClients(root) {
    const { moneyShort, pctFr, escapeHtml, notify, shortDateFr } = root.StructuraUtils;
    const {
      CLIENTS,
      PRODUCTS,
      runtime,
      activeProducts,
      productsForScope,
      getClientById,
      normalizeClient,
      normalizeProduct,
      nextClientId,
      saveClients,
      saveProducts,
      setSelectedClientDetail,
      matchesClientSearch,
      getProductAllocations,
      envelopeLabel,
      normalizeAllocation,
      isoDate,
    } = root.StructuraAppState;

    let clientSearch = "";
    // Tri persistant par vue, pas global (passe 7C-3, E) : la table
    // Clients et la table produits du tiroir gardent chacune leur propre
    // colonne/sens, indépendamment l'une de l'autre.
    const clientsSort = runtime.clientsSort || (runtime.clientsSort = { col: "nominal", asc: false });
    const drawerProductSort =
      runtime.drawerProductSort || (runtime.drawerProductSort = { col: "nextEvtDate", asc: true });

    function clientProducts(clientId) {
      return activeProducts().filter((product) =>
        getProductAllocations(product).some(
          (alloc) => Number(alloc.clientId) === Number(clientId),
        ),
      );
    }

    function allocationForClient(product, clientId) {
      return getProductAllocations(product).find(
        (alloc) => Number(alloc.clientId) === Number(clientId),
      );
    }

    // KPI d'adéquation DDA (§6.2) : au-delà de ce seuil, la part du
    // patrimoine en structurés bascule en alerte. Constante unique — ne
    // jamais écrire 25 en dur dans le rendu. Pas de réglage exposé dans
    // l'UI : aucun écran de paramètres n'existe dans l'app pour un seul
    // seuil, décision du 04/08.
    const WEALTH_CONCENTRATION_WATCH_THRESHOLD = 25;

    function clientStats(clientId) {
      const products = clientProducts(clientId);
      const nominal = products.reduce(
        (sum, p) => sum + (Number(allocationForClient(p, clientId)?.nominal) || 0),
        0,
      );
      const val = products.reduce((sum, p) => {
        const alloc = allocationForClient(p, clientId);
        const share =
          Number(p.nominal) > 0
            ? (Number(alloc?.nominal) || 0) / Number(p.nominal)
            : 0;
        return sum + (Number(p.val) || 0) * share;
      }, 0);
      const breach = products.filter((p) => p.st?.s === "breach").length;
      const watch = products.filter((p) => ["crit", "warn"].includes(p.st?.s)).length;
      return { products, count: products.length, nominal, val, breach, watch };
    }

    // L'enveloppe la plus fréquente parmi les produits rattachés — pas
    // un champ stocké sur le client, dérivée de ses allocations
    // réelles à chaque rendu plutôt que d'inventer une donnée.
    function dominantEnvelope(products, clientId) {
      const counts = {};
      products.forEach((product) => {
        const env = allocationForClient(product, clientId)?.envelope;
        if (!env) return;
        counts[env] = (counts[env] || 0) + 1;
      });
      const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
      return top ? envelopeLabel(top[0]) : "";
    }

    function updateClientsMeta() {
      const meta = document.getElementById("clients-page-meta");
      if (!meta) return;
      meta.textContent = `${CLIENTS.length} dossier${CLIENTS.length > 1 ? "s" : ""} · ${activeProducts().filter((p) => p.clientId).length} produits rattachés`;
    }

    function refreshScopedViews() {
      updateClientsMeta();
      root.renderSessionChrome?.();
      root.renderDashboardSummary?.();
      root.renderAlerts?.();
      root.drawPerfChart?.();
      root.renderDashboardModules?.();
      root.renderPf?.();
      root.renderBarriers?.();
      root.renderAnalytics?.();
      root.renderCalendar?.();
    }

    function filterClients(value) {
      clientSearch = String(value || "").trim().toLowerCase();
      renderClients();
    }

    // Ligne de client (passe 7, section B) : tableau, pas des cartes —
    // la liste se lit en balayage vertical. Profil de risque, distribution
    // et historique de pitch restent dans la fiche (openClientDrawer),
    // pas ici ; cette ligne ne montre que ce qui aide à choisir un
    // dossier. Aucun avatar ni initiales : sans valeur pour des clients
    // nommés en toutes lettres.
    function renderClientRow(client, stats) {
      const reference = `DOS-${String(client.id).padStart(4, "0")}`;
      const envelope = dominantEnvelope(stats.products, client.id);
      const perfPct =
        stats.nominal > 0 ? ((stats.val - stats.nominal) / stats.nominal) * 100 : null;
      const perfCls = perfPct === null ? "" : perfPct >= 0 ? "up" : "dn";
      const perfStr =
        perfPct === null ? "—" : `${perfPct >= 0 ? "+" : ""}${pctFr(perfPct)}`;
      const remark =
        stats.breach > 0
          ? `<span class="client-remark">${stats.breach} produit${stats.breach > 1 ? "s" : ""} sous PDI</span>`
          : "";
      return `<tr onclick="openClientDrawer(${client.id})">
        <td>
          <div class="client-name">${escapeHtml(client.name)}</div>
          <div class="client-meta">${escapeHtml(reference)}${envelope ? ` · ${escapeHtml(envelope)}` : ""}</div>
        </td>
        <td class="num">${moneyShort(stats.nominal)}</td>
        <td class="num ${perfCls}">${perfStr}</td>
        <td class="num">${stats.count}</td>
        <td>${remark}</td>
        <td class="client-row-chevron-cell"><svg class="client-row-chevron" viewBox="0 0 20 20" aria-hidden="true"><path d="M7.5 4.5l6 5.5-6 5.5"/></svg></td>
      </tr>`;
    }

    function drawerProductSortValue(product, clientId, col) {
      if (col === "nominal") return Number(allocationForClient(product, clientId)?.nominal || product.nominal) || 0;
      return product[col] ?? "";
    }

    function compareDrawerProducts(a, b, clientId) {
      let va = drawerProductSortValue(a, clientId, drawerProductSort.col);
      let vb = drawerProductSortValue(b, clientId, drawerProductSort.col);
      if (typeof va === "string" || typeof vb === "string") {
        va = String(va).toLowerCase();
        vb = String(vb).toLowerCase();
      }
      if (va === vb) return 0;
      return drawerProductSort.asc ? (va > vb ? 1 : -1) : va < vb ? 1 : -1;
    }

    function sortDrawerProducts(col) {
      if (drawerProductSort.col === col) drawerProductSort.asc = !drawerProductSort.asc;
      else {
        drawerProductSort.col = col;
        drawerProductSort.asc = col !== "nominal";
      }
      document.querySelectorAll("#dr-products-table thead th").forEach((th) => {
        th.classList.remove("sorted", "asc");
      });
      const th = [...document.querySelectorAll("#dr-products-table thead th")].find((t) =>
        t.getAttribute("onclick")?.includes(`'${col}'`),
      );
      if (th) {
        th.classList.add("sorted");
        if (drawerProductSort.asc) th.classList.add("asc");
      }
      openClientDrawer(runtime.selectedClientDetailId);
    }

    // Fiche client au clic : rendue dans le tiroir partagé avec les
    // produits (section A), pas dans un panneau permanent de la page.
    function openClientDrawer(clientId) {
      const id = Number(clientId) || null;
      runtime.selectedClientDetailId = id;
      setSelectedClientDetail(id);
      const content = document.getElementById("dr-client-content");
      const productContent = document.getElementById("dr-product-content");
      const underlyingContent = document.getElementById("dr-underlying-content");
      if (!content) return;
      if (productContent) productContent.style.display = "none";
      if (underlyingContent) underlyingContent.style.display = "none";
      content.style.display = "";
      const client = getClientById(id);
      if (!client) {
        content.innerHTML = '<div class="empty-inline">Client introuvable.</div>';
        document.getElementById("drawer-ov")?.classList.add("open");
        return;
      }
      const stats = clientStats(client.id);
      const unassigned = activeProducts().filter((p) => !p.clientId);
      const envelopes = new Set(
        stats.products
          .map((product) => allocationForClient(product, client.id)?.envelope)
          .filter(Boolean),
      );
      const dominantEnvelope = envelopes.size === 1 ? envelopeLabel([...envelopes][0]) : null;
      const mixedEnvelopes = envelopes.size > 1;
      // Part du patrimoine en structurés (§6.2) : la valorisation actuelle
      // au numérateur, pas le nominal investi — le dénominateur (patrimoine
      // déclaré) est une photo au présent, le ratio doit comparer deux
      // choses prises au même instant. Le KPI reste toujours affiché, y
      // compris sans patrimoine déclaré : le masquer supprimerait
      // l'information « on ne sait pas », qui n'est pas « rien à
      // afficher » — sans la carte, l'utilisateur ne peut pas distinguer
      // un patrimoine non renseigné d'un bug d'affichage (§6.2, arbitrage
      // du 05/08 : c'est ce comportement de masquage qui avait tort, pas
      // le texte).
      const hasWealth = Number.isFinite(Number(client.declaredWealth)) && Number(client.declaredWealth) > 0;
      const wealthSharePct = hasWealth ? (stats.val / Number(client.declaredWealth)) * 100 : null;
      const wealthKpi = hasWealth
        ? `<div class="kpi${wealthSharePct >= WEALTH_CONCENTRATION_WATCH_THRESHOLD ? " kpi-accent-danger" : ""}"><div class="kpi-lbl">Part du patrimoine en structurés</div><div class="kpi-val">${pctFr(wealthSharePct, 0)}</div><div class="kpi-sub">du patrimoine déclaré · seuil ${WEALTH_CONCENTRATION_WATCH_THRESHOLD} %</div></div>`
        : `<div class="kpi"><div class="kpi-lbl">Part du patrimoine en structurés</div><div class="kpi-val kpi-val-empty">Non renseigné</div><div class="kpi-sub">du patrimoine déclaré</div></div>`;
      content.innerHTML = `
        <div class="dr-name">${escapeHtml(client.name)}</div>
        <div class="dr-isin">${escapeHtml(client.segment)}${dominantEnvelope ? ` · ${escapeHtml(dominantEnvelope)}` : ""}</div>
        <div class="dr-grid">
          <div><div class="dr-field-lbl">Patrimoine total déclaré</div><div class="dr-field-val">${hasWealth ? moneyShort(Number(client.declaredWealth)) : "Non renseigné"}</div></div>
          <div><div class="dr-field-lbl">Email</div><div class="dr-field-val">${client.email ? escapeHtml(client.email) : "—"}</div></div>
          <div><div class="dr-field-lbl">Téléphone</div><div class="dr-field-val">${client.phone ? escapeHtml(client.phone) : "—"}</div></div>
          <div><div class="dr-field-lbl">Adresse</div><div class="dr-field-val">${client.address ? escapeHtml(client.address) : "—"}</div></div>
        </div>
        <div class="kpi-row kpi-row-accent-top dr-kpi-row">
          <div class="kpi"><div class="kpi-lbl">Produits</div><div class="kpi-val">${stats.count}</div><div class="kpi-sub">Rattachés au dossier</div></div>
          <div class="kpi"><div class="kpi-lbl">Encours nominal</div><div class="kpi-val">${moneyShort(stats.nominal)}</div><div class="kpi-sub">&nbsp;</div></div>
          <div class="kpi"><div class="kpi-lbl">Valorisation</div><div class="kpi-val">${moneyShort(stats.val)}</div><div class="kpi-sub">&nbsp;</div></div>
          ${wealthKpi}
        </div>
        ${client.notes ? `<div class="divider"></div><div class="dr-section-title">NOTES</div><p class="dr-field-val">${escapeHtml(client.notes)}</p>` : ""}
        <div class="divider"></div>
        <div class="dr-section-title">PRODUITS DU DOSSIER</div>
        ${
          stats.products.length
            ? `<div class="tbl-wrap" id="dr-products-wrap">
          <table id="dr-products-table">
            <colgroup>
              <col class="dr-col-produit" />
              <col class="dr-col-sub" />
              ${mixedEnvelopes ? '<col class="dr-col-envelope" />' : ""}
              <col class="dr-col-nominal" />
              <col class="dr-col-statut" />
              <col class="dr-col-action" />
            </colgroup>
            <thead><tr><th>Produit</th><th onclick="sortDrawerProducts('nextEvtDate')">Échéance</th>${mixedEnvelopes ? "<th>Enveloppe</th>" : ""}<th class="num" onclick="sortDrawerProducts('nominal')">Nominal</th><th>Statut</th><th aria-hidden="true"></th></tr></thead>
            <tbody>
              ${[...stats.products]
                .sort((a, b) => compareDrawerProducts(a, b, client.id))
                .map((product) => {
                  const alloc = allocationForClient(product, client.id);
                  return `<tr>
                <td><button type="button" class="linkish" onclick="openDrawer(${product.id})" title="${escapeHtml(product.name)}">${escapeHtml(product.name)}</button></td>
                <td class="cell-muted">${escapeHtml(shortDateFr(product.nextEvtDate))}</td>
                ${mixedEnvelopes ? `<td><span class="env-badge">${escapeHtml(envelopeLabel(alloc?.envelope))}</span></td>` : ""}
                <td class="num">${moneyShort(alloc?.nominal || product.nominal)}</td>
                <td><span class="pill-status ${product.st?.cls || "st-unknown"}">${escapeHtml(product.st?.label || "—")}</span></td>
                <td><button type="button" class="btn btn-tertiary" onclick="unassignProductFromClient(${product.id})">Retirer</button></td>
              </tr>`;
                })
                .join("")}
            </tbody>
          </table>
        </div>`
            : '<div class="empty-inline">Aucun produit rattaché à ce client.</div>'
        }
        <div class="dr-footer">
          <select class="f-sel dr-attach-select" id="client-assign-select" onchange="assignProductToClient(this.value, ${client.id})">
            <option value="">Rattacher un produit…</option>
            ${unassigned
              .map(
                (product) =>
                  `<option value="${product.id}">${escapeHtml(product.name)}</option>`,
              )
              .join("")}
            ${activeProducts()
              .filter((p) => p.clientId && Number(p.clientId) !== Number(client.id))
              .map(
                (product) =>
                  `<option value="${product.id}">${escapeHtml(product.name)} (transfert)</option>`,
              )
              .join("")}
          </select>
          <button class="btn btn-primary" type="button" onclick="openClientModal(${client.id})">Modifier le client</button>
        </div>`;
      document.getElementById("drawer-ov")?.classList.add("open");
    }

    function clientSortValue(client, stats, col) {
      if (col === "name") return client.name || "";
      if (col === "nominal") return stats.nominal;
      if (col === "perfPct")
        return stats.nominal > 0 ? ((stats.val - stats.nominal) / stats.nominal) * 100 : -Infinity;
      if (col === "count") return stats.count;
      return "";
    }

    function compareClientRows(a, b) {
      let va = clientSortValue(a.client, a.stats, clientsSort.col);
      let vb = clientSortValue(b.client, b.stats, clientsSort.col);
      if (typeof va === "string" || typeof vb === "string") {
        va = String(va).toLowerCase();
        vb = String(vb).toLowerCase();
      }
      if (va === vb) return 0;
      return clientsSort.asc ? (va > vb ? 1 : -1) : va < vb ? 1 : -1;
    }

    function sortClients(col) {
      if (clientsSort.col === col) clientsSort.asc = !clientsSort.asc;
      else {
        clientsSort.col = col;
        clientsSort.asc = !["nominal", "perfPct", "count"].includes(col);
      }
      document.querySelectorAll("#clients-table thead th").forEach((th) => {
        th.classList.remove("sorted", "asc");
      });
      const th = [...document.querySelectorAll("#clients-table thead th")].find((t) =>
        t.getAttribute("onclick")?.includes(`'${col}'`),
      );
      if (th) {
        th.classList.add("sorted");
        if (clientsSort.asc) th.classList.add("asc");
      }
      renderClients();
    }

    function renderClients() {
      const list = document.getElementById("clients-list");
      if (!list) return;
      const filtered = CLIENTS.filter((client) => {
        if (!clientSearch) return true;
        return matchesClientSearch(client, clientSearch);
      })
        .map((client) => ({ client, stats: clientStats(client.id) }))
        .sort(compareClientRows);
      list.innerHTML = filtered.length
        ? filtered.map(({ client, stats }) => renderClientRow(client, stats)).join("")
        : '<tr><td colspan="6" class="tbl-empty">Aucun client ne correspond à la recherche.</td></tr>';
      updateClientsMeta();
    }

    function populateClientSelect(selectId, selectedId) {
      const select = document.getElementById(selectId);
      if (!select) return;
      const current = selectedId ?? runtime.selectedClientDetailId ?? "";
      select.innerHTML =
        `<option value="">— Sélectionner un client —</option>` +
        CLIENTS.map(
          (client) =>
            `<option value="${client.id}" ${Number(current) === Number(client.id) ? "selected" : ""}>${escapeHtml(client.name)}</option>`,
        ).join("");
    }

    function openClientWorkspace(clientId) {
      const id = Number(clientId) || null;
      if (!id) return;
      openClientDrawer(id);
    }

    function openClientModal(clientId) {
      const client = clientId ? getClientById(clientId) : null;
      document.getElementById("client-modal-title").textContent = client
        ? "Modifier le client"
        : "Nouveau client";
      document.getElementById("c-id").value = client?.id || "";
      document.getElementById("c-name").value = client?.name || "";
      document.getElementById("c-email").value = client?.email || "";
      document.getElementById("c-phone").value = client?.phone || "";
      document.getElementById("c-address").value = client?.address || "";
      document.getElementById("c-wealth").value = client?.declaredWealth || "";
      document.getElementById("c-segment").value = client?.segment || "Patrimonial";
      document.getElementById("c-notes").value = client?.notes || "";
      document.getElementById("client-modal-ov").classList.add("open");
      document.getElementById("c-name")?.focus();
    }

    function closeClientModal() {
      document.getElementById("client-modal-ov")?.classList.remove("open");
    }

    function closeClientModalOut(event) {
      if (event.target?.id === "client-modal-ov") closeClientModal();
    }

    function saveClient() {
      const name = document.getElementById("c-name")?.value.trim();
      if (!name) {
        notify("Le nom du client est requis", "err");
        document.getElementById("c-name")?.focus();
        return;
      }
      const existingId = Number(document.getElementById("c-id")?.value) || 0;
      const payload = normalizeClient({
        id: existingId || nextClientId(),
        name,
        email: document.getElementById("c-email")?.value.trim(),
        phone: document.getElementById("c-phone")?.value.trim(),
        address: document.getElementById("c-address")?.value.trim(),
        declaredWealth: document.getElementById("c-wealth")?.value,
        segment: document.getElementById("c-segment")?.value || "Patrimonial",
        notes: document.getElementById("c-notes")?.value.trim(),
        createdAt: existingId
          ? getClientById(existingId)?.createdAt
          : root.StructuraAppState.isoDate(new Date()),
      });
      const index = CLIENTS.findIndex((client) => Number(client.id) === Number(payload.id));
      if (index >= 0) CLIENTS[index] = payload;
      else CLIENTS.unshift(payload);
      saveClients();
      runtime.selectedClientDetailId = payload.id;
      closeClientModal();
      renderClients();
      notify(existingId ? "Client mis à jour" : "Client créé", "ok");
    }

    function assignProductToClient(productId, clientId) {
      const id = Number(productId);
      const cid = Number(clientId);
      if (!id || !cid) return;
      const product = PRODUCTS.find((item) => Number(item.id) === id);
      if (!product) return;
      product.clientId = cid;
      product.clientAllocations = [
        normalizeAllocation(
          {
            clientId: cid,
            nominal: Number(product.nominal) || 0,
            subDate: isoDate(new Date()),
            envelope: "assurance-vie",
            channel: "cgp",
          },
          product,
        ),
      ];
      normalizeProduct(product);
      saveProducts();
      const select = document.getElementById("client-assign-select");
      if (select) select.value = "";
      renderClients();
      refreshScopedViews();
      notify("Produit rattaché au client", "ok");
    }

    function unassignProductFromClient(productId) {
      const product = PRODUCTS.find((item) => Number(item.id) === Number(productId));
      if (!product) return;
      product.clientId = null;
      product.clientAllocations = [];
      normalizeProduct(product);
      saveProducts();
      renderClients();
      refreshScopedViews();
      notify("Produit retiré du dossier client", "ok");
    }

    function assignProductClientFromDrawer(productId, clientId) {
      const product = PRODUCTS.find((item) => Number(item.id) === Number(productId));
      if (!product) return;
      product.clientId = clientId ? Number(clientId) : null;
      product.clientAllocations = clientId
        ? [
            normalizeAllocation(
              {
                clientId: Number(clientId),
                nominal: Number(product.nominal) || 0,
                subDate: isoDate(new Date()),
                envelope: "assurance-vie",
                channel: "cgp",
              },
              product,
            ),
          ]
        : [];
      normalizeProduct(product);
      saveProducts();
      root.openDrawer?.(productId);
      renderClients();
      refreshScopedViews();
    }

    return {
      renderClients,
      renderClientSelector: updateClientsMeta,
      renderClientScopeBar: updateClientsMeta,
      refreshScopedViews,
      openClientDrawer,
      filterClients,
      sortClients,
      sortDrawerProducts,
      openClientWorkspace,
      populateClientSelect,
      openClientModal,
      closeClientModal,
      closeClientModalOut,
      saveClient,
      assignProductToClient,
      unassignProductFromClient,
      assignProductClientFromDrawer,
      clientProducts,
      clientStats,
      productsForScope,
    };
  },
);
