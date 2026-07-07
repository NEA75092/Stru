(function initStructuraAppState(root, factory) {
  const api = factory(root);
  root.StructuraAppState = api;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(
  typeof globalThis !== "undefined" ? globalThis : this,
  function createStructuraAppState(root) {
    const STORAGE_KEY = "structura.v2.products";
    const CLIENTS_STORAGE_KEY = "structura.v2.clients";
    const SELECTED_CLIENT_KEY = "structura.v2.selectedClient";
    const SESSION_KEY = "structura.v2.session";
    const APP_MODE_KEY = "structura.v2.mode";
    const ALLOC_META_VERSION = 2;
    const ALLOC_META_KEY = "structura.v2.allocMetaVersion";
    const TYPES = ["AC", "AC", "AC", "CG", "RC", "LV", "AC", "RC", "CG", "AC"];
    const EMETTEURS = [
      "BNP Paribas",
      "Société Générale",
      "Goldman Sachs",
      "JP Morgan",
      "Deutsche Bank",
      "Barclays",
      "HSBC",
      "Morgan Stanley",
      "Natixis",
      "Crédit Agricole CIB",
    ];
    const UNDERLYINGS = [
      "CAC 40",
      "EURO STOXX 50",
      "DAX 40",
      "S&P 500",
      "FTSE 100",
      "TOTAL SA",
      "LVMH",
      "Airbus",
      "BNP Paribas",
      "NVIDIA",
      "SBF 120",
      "STOXX Banks",
      "Nikkei 225",
      "SMI",
      "IBEX 35",
    ];
    const RATINGS = ["AA+", "AA", "AA-", "A+", "A", "A", "A-", "BBB+"];
    const TYPE_NAMES = {
      AC: "Autocall / Phoenix",
      CG: "Capital Garanti",
      RC: "Reverse Convertible",
      LV: "Levier",
    };
    const MONTHS_FR = [
      "Jan",
      "Fev",
      "Mar",
      "Avr",
      "Mai",
      "Jun",
      "Jul",
      "Aou",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const INVESTMENT_ENVELOPES = [
      { id: "assurance-vie", label: "Assurance-vie", short: "AV" },
      { id: "cto", label: "Compte-titres (CTO)", short: "CTO" },
      { id: "capitalisation", label: "Contrat de capitalisation", short: "Cap." },
      { id: "pea", label: "PEA", short: "PEA" },
    ];
    const DISTRIBUTION_CHANNELS = [
      { id: "cgp", label: "CGP / CGPI" },
      { id: "assurance-vie", label: "Assurance-vie (direct)" },
      { id: "banque-privee", label: "Banque privée" },
      { id: "cto", label: "CTO (direct)" },
      { id: "marche-secondaire", label: "Marché secondaire" },
    ];
    const ENVELOPE_IDS = new Set(INVESTMENT_ENVELOPES.map((entry) => entry.id));
    const CHANNEL_IDS = new Set(DISTRIBUTION_CHANNELS.map((entry) => entry.id));
    const runtime = {
      pfFilter: { type: "all", search: "", alertsOnly: false },
      pfSort: { col: "name", asc: true },
      compactMode: false,
      currentView: "dashboard",
      selectedClientDetailId: null,
      generatedPitch: null,
      extractedDocumentData: null,
    };

    function rnd(min, max) {
      return Math.random() * (max - min) + min;
    }

    function rndInt(min, max) {
      return Math.floor(rnd(min, max + 1));
    }

    function pick(arr) {
      return arr[rndInt(0, arr.length - 1)];
    }

    function addDays(d, days) {
      const x = new Date(d);
      x.setDate(x.getDate() + days);
      return x;
    }

    function addMonths(d, months) {
      const x = new Date(d);
      x.setMonth(x.getMonth() + months);
      return x;
    }

    function addYears(d, years) {
      const x = new Date(d);
      x.setFullYear(x.getFullYear() + years);
      return x;
    }

    function isoDate(d) {
      return new Date(d).toISOString().slice(0, 10);
    }

    function defaultChannelForEnvelope(envelope) {
      if (envelope === "cto" || envelope === "pea") return "cto";
      if (envelope === "capitalisation") return "assurance-vie";
      return "cgp";
    }

    function normalizeAllocation(row, product) {
      const envelope = ENVELOPE_IDS.has(row.envelope) ? row.envelope : "assurance-vie";
      const channel = CHANNEL_IDS.has(row.channel)
        ? row.channel
        : defaultChannelForEnvelope(envelope);
      let subDate = row.subDate || product?.issueDate || null;
      if (subDate && String(subDate).length > 10) subDate = String(subDate).slice(0, 10);
      return {
        clientId: Number(row.clientId) || 0,
        nominal: Number(row.nominal) || 0,
        subDate: subDate || null,
        envelope,
        channel,
      };
    }

    function envelopeLabel(envelopeId) {
      return (
        INVESTMENT_ENVELOPES.find((entry) => entry.id === envelopeId)?.label ||
        "Assurance-vie"
      );
    }

    function channelLabel(channelId) {
      return (
        DISTRIBUTION_CHANNELS.find((entry) => entry.id === channelId)?.label ||
        "CGP / CGPI"
      );
    }

    function formatSubDate(iso) {
      if (!iso) return "—";
      const date = new Date(`${iso}T00:00:00`);
      return Number.isNaN(date.getTime())
        ? "—"
        : date.toLocaleDateString("fr-FR");
    }

    function genDemoISIN(idx) {
      return `DEMO-${String(idx).padStart(5, "0")}`;
    }

    function genDate(start, end) {
      const s = new Date(start);
      const e = new Date(end);
      return isoDate(
        new Date(s.getTime() + Math.random() * (e.getTime() - s.getTime())),
      );
    }

    function statusFromDist(dist, type) {
      if (type === "CG") return { s: "safe", label: "PROTEGE", cls: "bf-safe" };
      if (dist === null || dist === undefined || !Number.isFinite(Number(dist))) {
        return { s: "unknown", label: "A CONFIRMER", cls: "bf-warn" };
      }
      if (dist < 0) return { s: "breach", label: "FRANCHIE", cls: "bf-breach" };
      if (dist < 5) return { s: "crit", label: "CRITIQUE", cls: "bf-crit" };
      if (dist < 15) return { s: "warn", label: "ALERTE", cls: "bf-warn" };
      return { s: "safe", label: "SAIN", cls: "bf-safe" };
    }

    function inferProductOrigin(p) {
      if (String(p.isin || "").startsWith("DEMO-")) return "seed";
      const legacyDemoIssuer = EMETTEURS.includes(p.emetteur);
      const legacyDemoType = Object.values(TYPE_NAMES).some((label) =>
        String(p.name || "").includes(label),
      );
      const numericId = Number(p.id);
      if (
        Number.isFinite(numericId) &&
        numericId >= 1 &&
        numericId <= 54 &&
        legacyDemoIssuer &&
        legacyDemoType &&
        !p.productDescription
      ) {
        return "seed";
      }
      return "user";
    }

    function normalizeProduct(raw) {
      const p = { ...raw };
      p.id = Number(p.id) || 0;
      p.nominal = Number(p.nominal) || 0;
      p.val = Number(p.val) || 0;
      p.vlPct = Number.isFinite(Number(p.vlPct)) ? Number(p.vlPct) : null;
      p.vlAsOf = p.vlAsOf || null;
      p.vlSource = p.vlSource || null;
      p.vlStatus = p.vlStatus || (p.isin ? "pending" : "no_isin");
      p.pnl = Number.isFinite(p.pnl) ? Number(p.pnl) : p.val - p.nominal;
      p.pnlPct = Number.isFinite(p.pnlPct)
        ? Number(p.pnlPct)
        : p.nominal
          ? ((p.val - p.nominal) / p.nominal) * 100
          : 0;
      p.cpnNum = Number.isFinite(p.cpnNum)
        ? Number(p.cpnNum)
        : parseFloat((p.coupon || "0").replace("%", "")) || 0;
      p.triNum = Number.isFinite(p.triNum)
        ? Number(p.triNum)
        : parseFloat((p.tri || "0").replace("%", "")) || 0;
      p.barrier =
        p.barrier != null && p.barrier !== "" ? Number(p.barrier) || 0 : null;
      p.dist = Number.isFinite(Number(p.dist)) ? Number(p.dist) : null;
      p.initialSpot =
        p.initialSpot != null && Number.isFinite(Number(p.initialSpot))
          ? Number(p.initialSpot)
          : null;
      p.barrierLevel =
        p.initialSpot && p.barrier
          ? Math.round(((p.initialSpot * p.barrier) / 100) * 100) / 100
          : null;
      p.st = statusFromDist(p.dist, p.type);
      p.coupon = p.coupon || `${p.cpnNum.toFixed(1)}%`;
      p.tri = p.tri || `${p.triNum.toFixed(1)}%`;
      p.maturity = p.maturity || isoDate(addYears(new Date(), 2));
      p.nextEvtDate = p.nextEvtDate || isoDate(addMonths(new Date(), 1));
      p.productFamily =
        root.StructuraDomain?.normalizeProductFamily?.(
          p.productFamily || p.family || p.productType || p.type,
          p.type,
        ) || p.productFamily || "phoenix";
      p.characteristics = root.StructuraDomain?.normalizeCharacteristics
        ? root.StructuraDomain.normalizeCharacteristics(
            { ...p.characteristics, ...p, annualCouponPct: p.cpnNum },
            p.productFamily,
          )
        : p.characteristics || {};
      p.canonicalProduct =
        p.canonicalProduct ||
        root.StructuraProductSchema?.validateCanonicalProduct?.(
          root.StructuraProductSchema.normalizeDraft({
            ...p,
            issuer: p.emetteur,
            productFamily: p.productFamily,
            annualCouponPct: p.cpnNum,
            barrierPct: p.barrier,
            maturityDate: p.maturity,
            scheduleData: p.scheduleData,
          }),
        ) ||
        null;
      p.origin = p.origin || inferProductOrigin(p);
      p.dataQuality = p.dataQuality || (p.origin === "seed" ? "demo" : "user");
      p.clientId =
        p.clientId != null && p.clientId !== ""
          ? Number(p.clientId) || null
          : null;
      const nominal = Number(p.nominal) || 0;
      let allocations = Array.isArray(p.clientAllocations)
        ? p.clientAllocations
            .map((row) => normalizeAllocation(row, p))
            .filter((row) => row.clientId > 0)
        : [];
      if (!allocations.length && p.clientId) {
        allocations = [
          normalizeAllocation({ clientId: p.clientId, nominal }, p),
        ];
      }
      p.clientAllocations = allocations;
      if (allocations.length === 1) p.clientId = allocations[0].clientId;
      const sriCandidate =
        p.sri ??
        p.characteristics?.riskScore ??
        p.characteristics?.sri ??
        p.canonicalProduct?.quality?.riskScore;
      p.sri = Number.isFinite(Number(sriCandidate))
        ? Number(sriCandidate)
        : null;
      if (root.StructuraVlRegistry?.enrichProduct) {
        root.StructuraVlRegistry.enrichProduct(p);
      }
      return p;
    }

    function seedProducts() {
      const today = new Date();
      const products = [];
      for (let i = 0; i < 54; i++) {
        const type = TYPES[i % TYPES.length];
        const nom = Math.round(rnd(500000, 8000000) / 100000) * 100000;
        const dist = type === "CG" ? 999 : rnd(-12, 95);
        const pnlPct = rnd(-18, 32);
        const val = Math.round(nom * (1 + pnlPct / 100));
        const cpn = type === "LV" ? 0 : rnd(3, 18);
        const tri = rnd(-5, 28);
        const maturity = genDate(addMonths(today, 2), addYears(today, 6));
        const underlying = pick(UNDERLYINGS);
        const barrier = type === "CG" ? 0 : rndInt(55, 75);
        const st = statusFromDist(dist, type);
        products.push({
          id: i + 1,
          name: `${TYPE_NAMES[type]} ${underlying} - ${MONTHS_FR[rndInt(0, 11)]} ${today.getFullYear() + rndInt(0, 2)}`,
          isin: genDemoISIN(i + 1),
          type,
          emetteur: pick(EMETTEURS),
          nominal: nom,
          val,
          pnl: val - nom,
          pnlPct,
          coupon: cpn.toFixed(1) + "%",
          cpnNum: cpn,
          tri: tri.toFixed(1) + "%",
          triNum: tri,
          barrier,
          dist,
          st,
          maturity,
          underlying,
          rating: pick(RATINGS),
          nextEvt: [
            "Obs. mensuelle",
            "Coupon conditionnel",
            "Date de rappel",
            "Constatation barriere",
            "Maturite",
          ][rndInt(0, 4)],
          nextEvtDate: genDate(addDays(today, 5), addMonths(today, 5)),
          issueDate: genDate(addMonths(today, -rndInt(6, 48)), addDays(today, -15)),
          origin: "seed",
          dataQuality: "demo",
        });
      }
      products.sort((a, b) => {
        const sc = { breach: -3, crit: -2, warn: -1, safe: 0 };
        return (sc[a.st.s] || 0) - (sc[b.st.s] || 0);
      });
      return products;
    }

    function seedClients() {
      const today = isoDate(new Date());
      return [
        {
          id: 1,
          name: "Famille Dupont",
          email: "famille.dupont@email.fr",
          segment: "Patrimonial",
          notes: "Couple, profil équilibré, focus revenus.",
          createdAt: today,
        },
        {
          id: 2,
          name: "SCI Horizon",
          email: "contact@sci-horizon.fr",
          segment: "Professionnel",
          notes: "Trésorerie corporate, maturités courtes.",
          createdAt: today,
        },
        {
          id: 3,
          name: "M. Lefebvre",
          email: "lefebvre.pro@gmail.com",
          segment: "Grand public",
          notes: "Première allocation structurée.",
          createdAt: today,
        },
        {
          id: 4,
          name: "Trust Martin",
          email: "",
          segment: "Patrimonial",
          notes: "Diversification indices Europe.",
          createdAt: today,
        },
      ];
    }

    function normalizeClient(raw) {
      const client = { ...raw };
      client.id = Number(client.id) || 0;
      client.name = String(client.name || "").trim() || "Client sans nom";
      client.email = String(client.email || "").trim();
      client.segment = String(client.segment || "Patrimonial").trim();
      client.notes = String(client.notes || "").trim();
      client.createdAt = client.createdAt || isoDate(new Date());
      return client;
    }

    function loadClients() {
      if (typeof root.localStorage === "undefined") return seedClients();
      try {
        const raw = root.localStorage.getItem(CLIENTS_STORAGE_KEY);
        if (!raw) return seedClients();
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed) || !parsed.length) return seedClients();
        return parsed.map(normalizeClient);
      } catch {
        return seedClients();
      }
    }

    const CLIENTS = loadClients();

    function saveClients(clients = CLIENTS) {
      if (typeof root.localStorage === "undefined") return;
      root.localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(clients));
    }

    if (
      typeof root.localStorage !== "undefined" &&
      !root.localStorage.getItem(CLIENTS_STORAGE_KEY)
    ) {
      saveClients(CLIENTS);
    }

    const DEFAULT_SESSION = {
      advisorName: "Marie Laurent",
      orgName: "Cabinet Structura",
      role: "CGP",
      lastVisit: null,
    };

    function loadSession() {
      if (typeof root.localStorage === "undefined") return { ...DEFAULT_SESSION };
      try {
        const raw = root.localStorage.getItem(SESSION_KEY);
        if (!raw) return { ...DEFAULT_SESSION };
        return { ...DEFAULT_SESSION, ...JSON.parse(raw) };
      } catch {
        return { ...DEFAULT_SESSION };
      }
    }

    function saveSession(session) {
      if (typeof root.localStorage === "undefined") return;
      root.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    }

    function touchSession() {
      const session = loadSession();
      const now = new Date();
      session.lastVisit = isoDate(now);
      saveSession(session);
      const hour = now.getHours();
      const greeting =
        hour < 12 ? "Bonjour" : hour < 18 ? "Bon après-midi" : "Bonsoir";
      return { session, greeting, now };
    }

    function sessionInitials(name) {
      return String(name || "CG")
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() || "")
        .join("") || "CG";
    }

    function loadSelectedClientDetailId() {
      if (typeof root.localStorage === "undefined") return null;
      const raw = root.localStorage.getItem(SELECTED_CLIENT_KEY);
      if (!raw) return null;
      const id = Number(raw);
      return Number.isFinite(id) && id > 0 ? id : null;
    }

    function saveSelectedClientDetailId(clientId) {
      runtime.selectedClientDetailId = clientId || null;
      if (typeof root.localStorage === "undefined") return;
      if (clientId) root.localStorage.setItem(SELECTED_CLIENT_KEY, String(clientId));
      else root.localStorage.removeItem(SELECTED_CLIENT_KEY);
    }

    runtime.selectedClientDetailId = loadSelectedClientDetailId();

    function assignClientsToSeedProducts(products, clients) {
      if (!clients.length) return products;
      const envelopes = INVESTMENT_ENVELOPES.map((entry) => entry.id);
      const channels = DISTRIBUTION_CHANNELS.map((entry) => entry.id);
      return products.map((product, index) => {
        const clientId = product.clientId || clients[index % clients.length].id;
        const nominal = Number(product.nominal) || 0;
        return {
          ...product,
          clientId,
          clientAllocations: [
            normalizeAllocation(
              {
                clientId,
                nominal,
                subDate: isoDate(addMonths(new Date(), -rndInt(2, 48))),
                envelope: envelopes[index % envelopes.length],
                channel: channels[index % channels.length],
              },
              product,
            ),
          ],
        };
      });
    }

    function bootstrapClientAssignments() {
      const needsAssignment = PRODUCTS.some(
        (product) => product.clientId == null && product.origin === "seed",
      );
      if (needsAssignment) {
        const updated = assignClientsToSeedProducts(PRODUCTS, CLIENTS);
        updated.forEach((product, index) => {
          PRODUCTS[index] = normalizeProduct(product);
        });
        saveProducts();
      }
      const demo = PRODUCTS.find((p) => p.id === 1);
      if (demo && CLIENTS.length >= 2 && !(demo.clientAllocations?.length > 1)) {
        const half = Math.round((Number(demo.nominal) || 0) / 2);
        demo.clientAllocations = [
          normalizeAllocation(
            {
              clientId: CLIENTS[0].id,
              nominal: half,
              subDate: isoDate(addMonths(new Date(), -14)),
              envelope: "assurance-vie",
              channel: "cgp",
            },
            demo,
          ),
          normalizeAllocation(
            {
              clientId: CLIENTS[1].id,
              nominal: (Number(demo.nominal) || 0) - half,
              subDate: isoDate(addMonths(new Date(), -8)),
              envelope: "cto",
              channel: "banque-privee",
            },
            demo,
          ),
        ];
        normalizeProduct(demo);
        saveProducts();
      }
      enrichDemoAllocations();
      migrateAllocationMetadata();
    }

    function migrateAllocationMetadata() {
      if (typeof root.localStorage === "undefined") return;
      const current = Number(root.localStorage.getItem(ALLOC_META_KEY) || 0);
      if (current >= ALLOC_META_VERSION) return;
      const envelopes = INVESTMENT_ENVELOPES.map((entry) => entry.id);
      const channels = DISTRIBUTION_CHANNELS.map((entry) => entry.id);
      let slot = 0;
      PRODUCTS.forEach((product) => {
        if (!product.clientAllocations?.length) return;
        product.clientAllocations = product.clientAllocations.map((alloc) =>
          normalizeAllocation(
            {
              ...alloc,
              subDate:
                alloc.subDate || isoDate(addMonths(new Date(), -rndInt(3, 40))),
              envelope: envelopes[slot % envelopes.length],
              channel: channels[slot % channels.length],
            },
            product,
          ),
        );
        slot += 1;
        normalizeProduct(product);
      });
      root.localStorage.setItem(ALLOC_META_KEY, String(ALLOC_META_VERSION));
      saveProducts();
    }

    function enrichDemoAllocations() {
      const envelopes = INVESTMENT_ENVELOPES.map((entry) => entry.id);
      const channels = DISTRIBUTION_CHANNELS.map((entry) => entry.id);
      let changed = false;
      let slot = 0;
      PRODUCTS.forEach((product) => {
        if (!product.clientAllocations?.length) return;
        product.clientAllocations = product.clientAllocations.map((alloc) => {
          if (alloc.subDate && alloc.envelope && alloc.channel) {
            slot += 1;
            return alloc;
          }
          changed = true;
          const next = normalizeAllocation(
            {
              ...alloc,
              subDate: alloc.subDate || isoDate(addMonths(new Date(), -rndInt(3, 40))),
              envelope: alloc.envelope || envelopes[slot % envelopes.length],
              channel: alloc.channel || channels[slot % channels.length],
            },
            product,
          );
          slot += 1;
          return next;
        });
        if (changed) normalizeProduct(product);
      });
      if (changed) saveProducts();
    }

    function loadProducts() {
      if (typeof root.localStorage === "undefined") return seedProducts();
      try {
        const raw = root.localStorage.getItem(STORAGE_KEY);
        if (!raw) return seedProducts();
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed) || !parsed.length) return seedProducts();
        return parsed.map(normalizeProduct);
      } catch {
        return seedProducts();
      }
    }

    const PRODUCTS = loadProducts();

    bootstrapClientAssignments();

    function saveProducts(products = PRODUCTS) {
      if (typeof root.localStorage === "undefined") return;
      root.localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
    }

    function getAppMode() {
      if (typeof root.localStorage === "undefined") return "demo";
      return root.localStorage.getItem(APP_MODE_KEY) || "demo";
    }

    function isProdMode() {
      return getAppMode() === "prod";
    }

    function activeProducts() {
      return isProdMode()
        ? PRODUCTS.filter((p) => p.origin !== "seed")
        : PRODUCTS;
    }

    function productsForScope() {
      return activeProducts();
    }

    function getClientById(clientId) {
      return CLIENTS.find((client) => Number(client.id) === Number(clientId)) || null;
    }

    function getClientLabel(clientId) {
      const client = getClientById(clientId);
      return client?.name || "Non assigné";
    }

    function normalizeSearchText(value) {
      return String(value || "")
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .toLowerCase()
        .trim();
    }

    function clientSearchHaystack(client) {
      if (!client) return "";
      return [client.name, client.email, client.segment, client.notes]
        .filter(Boolean)
        .join(" ");
    }

    function matchesClientSearch(client, query) {
      if (!client) return false;
      const q = normalizeSearchText(query);
      if (!q) return true;
      const hay = normalizeSearchText(clientSearchHaystack(client));
      if (hay.includes(q)) return true;
      const qTokens = q.split(/\s+/).filter(Boolean);
      const nameTokens = normalizeSearchText(client.name).split(/\s+/).filter(Boolean);
      return qTokens.every(
        (token) =>
          hay.includes(token) ||
          nameTokens.some((part) => part.startsWith(token) || part.includes(token)),
      );
    }

    function getProductAllocations(product) {
      if (!product) return [];
      if (Array.isArray(product.clientAllocations) && product.clientAllocations.length) {
        return product.clientAllocations;
      }
      if (product.clientId) {
        return [normalizeAllocation(
          {
            clientId: Number(product.clientId),
            nominal: Number(product.nominal) || 0,
            subDate: product.subDate || product.issueDate || null,
            envelope: product.envelope || "assurance-vie",
            channel: product.channel || "cgp",
          },
          product,
        )];
      }
      return [];
    }

    function productMatchesClientSearch(product, query) {
      const q = String(query || "").trim();
      if (!q) return true;
      return getProductAllocations(product).some((alloc) =>
        matchesClientSearch(getClientById(alloc.clientId), q),
      );
    }

    function nextClientId() {
      return Math.max(0, ...CLIENTS.map((client) => Number(client.id) || 0)) + 1;
    }

    function setSelectedClientDetail(clientId) {
      const id = clientId ? Number(clientId) : null;
      saveSelectedClientDetailId(id);
    }

    return {
      STORAGE_KEY,
      CLIENTS_STORAGE_KEY,
      SELECTED_CLIENT_KEY,
      APP_MODE_KEY,
      TYPES,
      EMETTEURS,
      UNDERLYINGS,
      RATINGS,
      TYPE_NAMES,
      MONTHS_FR,
      INVESTMENT_ENVELOPES,
      DISTRIBUTION_CHANNELS,
      PRODUCTS,
      CLIENTS,
      runtime,
      rnd,
      rndInt,
      pick,
      addDays,
      addMonths,
      addYears,
      isoDate,
      statusFromDist,
      seedProducts,
      inferProductOrigin,
      normalizeProduct,
      loadProducts,
      saveProducts,
      getAppMode,
      isProdMode,
      activeProducts,
      productsForScope,
      getClientById,
      getClientLabel,
      getProductAllocations,
      normalizeAllocation,
      envelopeLabel,
      channelLabel,
      formatSubDate,
      matchesClientSearch,
      productMatchesClientSearch,
      normalizeSearchText,
      clientSearchHaystack,
      nextClientId,
      normalizeClient,
      seedClients,
      loadClients,
      saveClients,
      loadSession,
      saveSession,
      touchSession,
      sessionInitials,
      DEFAULT_SESSION,
      setSelectedClientDetail,
      setSelectedClient: setSelectedClientDetail,
    };
  },
);
