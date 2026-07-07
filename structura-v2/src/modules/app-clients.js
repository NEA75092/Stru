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

    function segmentClass(segment) {
      const value = String(segment || "").toLowerCase();
      if (value.includes("profession")) return "seg-pro";
      if (value.includes("grand")) return "seg-retail";
      return "seg-pat";
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

    function selectClientDetail(clientId) {
      const id = Number(clientId) || null;
      runtime.selectedClientDetailId = id;
      setSelectedClientDetail(id);
      renderClients();
    }

    function filterClients(value) {
      clientSearch = String(value || "").trim().toLowerCase();
      renderClients();
    }

    function renderClientCard(client) {
      const stats = clientStats(client.id);
      const active =
        Number(runtime.selectedClientDetailId) === Number(client.id) ? " on" : "";
      return `<button type="button" class="client-card${active}" onclick="selectClientDetail(${client.id})">
        <span class="client-avatar">${escapeHtml(initials(client.name))}</span>
        <span class="client-card-main">
          <strong>${escapeHtml(client.name)}</strong>
          <small>${escapeHtml(client.segment)}${client.email ? ` · ${escapeHtml(client.email)}` : ""}</small>
        </span>
        <span class="client-card-meta">
          <b>${stats.count}</b>
          <small>produits</small>
        </span>
      </button>`;
    }

    function renderClientDetail() {
      const panel = document.getElementById("clients-detail");
      if (!panel) return;
      const clientId = runtime.selectedClientDetailId || CLIENTS[0]?.id;
      const client = getClientById(clientId);
      if (!client) {
        panel.innerHTML =
          '<div class="clients-empty">Ajoutez un premier client pour structurer vos dossiers.</div>';
        return;
      }
      const stats = clientStats(client.id);
      const unassigned = activeProducts().filter((p) => !p.clientId);
      panel.innerHTML = `
        <div class="client-detail-head">
          <div class="client-detail-id">
            <span class="client-avatar lg">${escapeHtml(initials(client.name))}</span>
            <div>
              <h2>${escapeHtml(client.name)}</h2>
              <div class="client-detail-sub">
                <span class="client-seg ${segmentClass(client.segment)}">${escapeHtml(client.segment)}</span>
                ${client.email ? `<span>${escapeHtml(client.email)}</span>` : ""}
              </div>
            </div>
          </div>
          <div class="client-detail-actions">
            <button class="btn btn-gold" type="button" onclick="openClientModal(${client.id})">Modifier</button>
          </div>
        </div>
        <div class="client-kpi-row">
          <div class="client-kpi"><span>Produits</span><b>${stats.count}</b></div>
          <div class="client-kpi"><span>Encours nominal</span><b>${moneyShort(stats.nominal)}</b></div>
          <div class="client-kpi"><span>Valorisation</span><b>${moneyShort(stats.val)}</b></div>
          <div class="client-kpi warn"><span>Alertes</span><b>${stats.breach + stats.watch}</b></div>
        </div>
        ${client.notes ? `<div class="client-notes">${escapeHtml(client.notes)}</div>` : ""}
        <div class="client-products-hdr">
          <h3>Produits du dossier</h3>
          <select class="f-sel client-assign-select" id="client-assign-select" onchange="assignProductToClient(this.value, ${client.id})">
            <option value="">+ Rattacher un produit</option>
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
        </div>
        <div class="client-products-table">
          ${
            stats.products.length
              ? `<table>
            <thead><tr><th>Produit</th><th>ISIN</th><th>Souscription</th><th>Enveloppe</th><th>Canal</th><th class="num">Nominal</th><th>Statut</th><th></th></tr></thead>
            <tbody>
              ${stats.products
                .map(
                  (product) => {
                    const alloc = allocationForClient(product, client.id);
                    return `<tr>
                <td><button type="button" class="linkish" onclick="openDrawer(${product.id})">${escapeHtml(product.name)}</button></td>
                <td>${escapeHtml(product.isin || "—")}</td>
                <td>${escapeHtml(formatSubDate(alloc?.subDate))}</td>
                <td><span class="env-badge env-${escapeHtml(alloc?.envelope || "assurance-vie")}">${escapeHtml(envelopeLabel(alloc?.envelope))}</span></td>
                <td><span class="channel-tag">${escapeHtml(channelLabel(alloc?.channel))}</span></td>
                <td class="num">${moneyShort(alloc?.nominal || product.nominal)}</td>
                <td><span class="bf ${product.st?.cls || ""}">${escapeHtml(product.st?.label || "—")}</span></td>
                <td><button type="button" class="mini-btn" onclick="unassignProductFromClient(${product.id})">Retirer</button></td>
              </tr>`;
                  },
                )
                .join("")}
            </tbody>
          </table>`
              : '<div class="clients-empty inline">Aucun produit rattaché à ce client.</div>'
          }
        </div>`;
    }

    function renderClients() {
      const list = document.getElementById("clients-list");
      if (!list) return;
      if (!runtime.selectedClientDetailId && CLIENTS[0]) {
        runtime.selectedClientDetailId = CLIENTS[0].id;
      }
      const filtered = CLIENTS.filter((client) => {
        if (!clientSearch) return true;
        return matchesClientSearch(client, clientSearch);
      });
      list.innerHTML = filtered.length
        ? filtered.map(renderClientCard).join("")
        : '<div class="clients-empty inline">Aucun client ne correspond à la recherche.</div>';
      renderClientDetail();
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
      runtime.selectedClientDetailId = id;
      setSelectedClientDetail(id);
      root.nav?.("clients");
      renderClients();
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
      selectClientDetail,
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
