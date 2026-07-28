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
    const { moneyShort, pctFr, escapeHtml, notify } = root.StructuraUtils;
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
      channelLabel,
      formatSubDate,
      normalizeAllocation,
      isoDate,
    } = root.StructuraAppState;

    let clientSearch = "";

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
    function renderClientRow(client) {
      const stats = clientStats(client.id);
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

    // Fiche client au clic : rendue dans le tiroir partagé avec les
    // produits (section A), pas dans un panneau permanent de la page.
    function openClientDrawer(clientId) {
      const id = Number(clientId) || null;
      runtime.selectedClientDetailId = id;
      setSelectedClientDetail(id);
      const content = document.getElementById("dr-client-content");
      const productContent = document.getElementById("dr-product-content");
      if (!content) return;
      if (productContent) productContent.style.display = "none";
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
      const alerts = stats.breach + stats.watch;
      content.innerHTML = `
        <div class="dr-name">${escapeHtml(client.name)}</div>
        <div class="dr-isin">${escapeHtml(client.segment)}${dominantEnvelope ? ` · ${escapeHtml(dominantEnvelope)}` : ""}</div>
        <div class="kpi-row kpi-row-accent-top dr-kpi-row">
          <div class="kpi"><div class="kpi-lbl">Produits</div><div class="kpi-val">${stats.count}</div><div class="kpi-sub">Rattachés au dossier</div></div>
          <div class="kpi"><div class="kpi-lbl">Encours nominal</div><div class="kpi-val">${moneyShort(stats.nominal)}</div><div class="kpi-sub">&nbsp;</div></div>
          <div class="kpi"><div class="kpi-lbl">Valorisation</div><div class="kpi-val">${moneyShort(stats.val)}</div><div class="kpi-sub">&nbsp;</div></div>
          <div class="kpi${alerts > 0 ? " kpi-accent-danger" : ""}"><div class="kpi-lbl">Alertes</div><div class="kpi-val">${alerts}</div><div class="kpi-sub">&nbsp;</div></div>
        </div>
        ${client.notes ? `<div class="divider"></div><div class="dr-section-title">NOTES</div><p class="dr-field-val">${escapeHtml(client.notes)}</p>` : ""}
        <div class="divider"></div>
        <div class="dr-section-title">CONTACT</div>
        <div class="dr-contact">${client.email ? escapeHtml(client.email) : "Aucune adresse enregistrée"}</div>
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
              <col class="dr-col-canal" />
              <col class="dr-col-nominal" />
              <col class="dr-col-statut" />
              <col class="dr-col-action" />
            </colgroup>
            <thead><tr><th>Produit</th><th>Souscr.</th>${mixedEnvelopes ? "<th>Enveloppe</th>" : ""}<th>Canal</th><th class="num">Nominal</th><th>Statut</th><th></th></tr></thead>
            <tbody>
              ${stats.products
                .map((product) => {
                  const alloc = allocationForClient(product, client.id);
                  return `<tr>
                <td><button type="button" class="linkish" onclick="openDrawer(${product.id})" title="${escapeHtml(product.name)}">${escapeHtml(product.name)}</button></td>
                <td class="cell-muted">${escapeHtml(formatSubDate(alloc?.subDate))}</td>
                ${mixedEnvelopes ? `<td><span class="env-badge">${escapeHtml(envelopeLabel(alloc?.envelope))}</span></td>` : ""}
                <td><span class="channel-tag">${escapeHtml(channelLabel(alloc?.channel))}</span></td>
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

    function renderClients() {
      const list = document.getElementById("clients-list");
      if (!list) return;
      const filtered = CLIENTS.filter((client) => {
        if (!clientSearch) return true;
        return matchesClientSearch(client, clientSearch);
      });
      list.innerHTML = filtered.length
        ? filtered.map(renderClientRow).join("")
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
