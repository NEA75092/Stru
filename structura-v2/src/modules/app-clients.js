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
    const { moneyShort, escapeHtml, notify } = root.StructuraUtils;
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

    function initials(name) {
      return String(name || "C")
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() || "")
        .join("") || "C";
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

    // Carte de client (passe 5, section D) : nom, segment, encours et
    // compteurs seulement — le détail complet vit dans le tiroir, pas
    // ici. Aucun montant coloré ; le compteur d'alertes réutilise les
    // classes .st-bad/.st-warn déjà définies pour les statuts de
    // tableau plutôt que d'inventer une nouvelle teinte.
    function renderClientCard(client) {
      const stats = clientStats(client.id);
      const alerts = stats.breach + stats.watch;
      const alertCls = stats.breach > 0 ? "st-bad" : alerts > 0 ? "st-warn" : "";
      return `<button type="button" class="client-card${stats.breach > 0 ? " client-card-breach" : ""}" onclick="openClientDrawer(${client.id})">
        <div class="client-card-top">
          <strong class="client-card-name">${escapeHtml(client.name)}</strong>
          <span class="pill-category">${escapeHtml(client.segment)}</span>
        </div>
        <div class="client-card-aum">${moneyShort(stats.nominal)}</div>
        <div class="client-card-foot">
          <span>${stats.count} produit${stats.count > 1 ? "s" : ""}</span>
          ${alerts ? `<span class="${alertCls}">${alerts} alerte${alerts > 1 ? "s" : ""}</span>` : ""}
        </div>
      </button>`;
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
      content.innerHTML = `
        <div class="dr-name">${escapeHtml(client.name)}</div>
        <div class="dr-isin">${escapeHtml(client.segment)}${client.email ? ` · ${escapeHtml(client.email)}` : ""}</div>
        <div class="dr-grid">
          <div><div class="dr-field-lbl">Produits</div><div class="dr-field-val">${stats.count}</div></div>
          <div><div class="dr-field-lbl">Encours nominal</div><div class="dr-field-val">${moneyShort(stats.nominal)}</div></div>
          <div><div class="dr-field-lbl">Valorisation</div><div class="dr-field-val">${moneyShort(stats.val)}</div></div>
          <div><div class="dr-field-lbl">Alertes</div><div class="dr-field-val">${stats.breach + stats.watch}</div></div>
        </div>
        ${client.notes ? `<div class="divider"></div><div class="dr-section-title">NOTES</div><p class="dr-field-val">${escapeHtml(client.notes)}</p>` : ""}
        <div class="divider"></div>
        <div class="dr-section-title">RATTACHER UN PRODUIT</div>
        <select class="f-sel" id="client-assign-select" onchange="assignProductToClient(this.value, ${client.id})">
          <option value="">— Sélectionner —</option>
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
        <div class="divider"></div>
        <div class="dr-section-title">PRODUITS DU DOSSIER</div>
        ${
          stats.products.length
            ? `<table>
          <thead><tr><th>Produit</th><th>Souscription</th><th>Enveloppe</th><th>Canal</th><th class="num">Nominal</th><th>Statut</th><th></th></tr></thead>
          <tbody>
            ${stats.products
              .map((product) => {
                const alloc = allocationForClient(product, client.id);
                return `<tr>
              <td><button type="button" class="linkish" onclick="openDrawer(${product.id})">${escapeHtml(product.name)}</button></td>
              <td class="cell-muted">${escapeHtml(formatSubDate(alloc?.subDate))}</td>
              <td><span class="env-badge">${escapeHtml(envelopeLabel(alloc?.envelope))}</span></td>
              <td><span class="channel-tag">${escapeHtml(channelLabel(alloc?.channel))}</span></td>
              <td class="num">${moneyShort(alloc?.nominal || product.nominal)}</td>
              <td><span class="pill-status ${product.st?.cls || "st-unknown"}">${escapeHtml(product.st?.label || "—")}</span></td>
              <td><button type="button" class="btn btn-tertiary" onclick="unassignProductFromClient(${product.id})">Retirer</button></td>
            </tr>`;
              })
              .join("")}
          </tbody>
        </table>`
            : '<div class="empty-inline">Aucun produit rattaché à ce client.</div>'
        }
        <div class="form-actions">
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
        ? filtered.map(renderClientCard).join("")
        : '<div class="empty-inline">Aucun client ne correspond à la recherche.</div>';
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
