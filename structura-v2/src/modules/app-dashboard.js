(function initStructuraDashboard(root, factory) {
  const api = factory(root);
  root.StructuraDashboard = api;
  Object.assign(root, api);
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(
  typeof globalThis !== "undefined" ? globalThis : this,
  function createStructuraDashboard(root) {
    const { setText, setTextFlash, moneyShort, pctFr, shortDateFr, escapeHtml } =
      root.StructuraUtils;
    const {
      APP_MODE_KEY,
      productsForScope,
      isProdMode,
      CLIENTS,
      touchSession,
      sessionInitials,
      getProductAllocations,
      isoDate,
    } = root.StructuraAppState;

    const GUARANTOR_ALIASES = [
      { label: "Bank of America", re: /bank\s+of\s+america|bofa|merrill|\bbac\b/i },
      { label: "Barclays", re: /barclays/i },
      { label: "BBVA", re: /\bbbva\b/i },
      { label: "BNP Paribas", re: /\bbnp\b/i },
      { label: "CIBC", re: /\bcibc\b/i },
      { label: "Citigroup", re: /citigroup|\bciti\b/i },
      { label: "Crédit Agricole", re: /cr[ée]dit\s+agricole|credit\s+agricole|cacib/i },
      { label: "CIC", re: /cr[ée]dit\s+industriel|credit\s+industriel|\bcic\b/i },
      { label: "Crédit Mutuel Arkéa", re: /cr[ée]dit\s+mutuel\s+ark[ée]a|credit\s+mutuel\s+arkea/i },
      { label: "Deutsche Bank", re: /deutsche/i },
      { label: "Goldman Sachs", re: /goldman|\bgs\b/i },
      { label: "HSBC", re: /\bhsbc\b/i },
      { label: "JP Morgan", re: /j\.?p\.?\s*morgan|jpmorgan|chase/i },
      { label: "Morgan Stanley", re: /morgan\s+stanley|\bmsfl\b/i },
      { label: "Natixis", re: /natixis/i },
      { label: "Nomura", re: /nomura/i },
      { label: "Société Générale", re: /soci[ée]t[ée]\s+g[ée]n[ée]rale|\bsg\b/i },
      { label: "UBS", re: /\bubs\b/i },
    ];

    // ── LOT 15 § 1 / § 0.1 (voie b) — la vie du cabinet ──────────────
    // CLIENTS (app-state.js) ne porte ni date, ni tâche, ni rendez-vous :
    // la vie « hors produit » (relances, dossiers, obligations) n'existe
    // pas au dépôt. Un modèle explicite la porte — alimenté EN DÉMO,
    // VIDE EN PRODUCTION (aucune date inventée). Les dates de démo se
    // calent sur le jour courant pour que la semaine affichée ait
    // toujours de quoi se peupler.
    //
    // Le premier plan (calendrier + « À regarder aujourd'hui ») ne lit
    // QUE cette source ; la vie des produits (buildProductCalendarEvents)
    // reste dans la dalle du bas. Un événement ne figure jamais dans les
    // deux.
    const CABINET_GLYPH = { Relancer: "✓", Compléter: "⚑", Préparer: "→" };

    function cabinetEventDateIso(deltaDays) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() + deltaDays);
      return d.toISOString().slice(0, 10);
    }

    function cabinetEvents() {
      if (isProdMode()) return [];
      return [
        { id: "cab-beranger", dateIso: cabinetEventDateIso(-4), titre: "Béranger : bulletin à signer", montant: 180000, anteriorite: "relance il y a 4 jours", action: "Relancer" },
        { id: "cab-aymard", dateIso: cabinetEventDateIso(-11), titre: "Aymard : KYC incomplet", montant: 240000, anteriorite: "bloqué depuis 11 jours", action: "Compléter" },
        { id: "cab-castellane", dateIso: cabinetEventDateIso(0), titre: "Castellane : entrée en gestion", montant: 1200000, anteriorite: "rendez-vous à 14 h", action: "Préparer" },
        { id: "cab-revue-lamartine", dateIso: cabinetEventDateIso(2), titre: "Revue trimestrielle Lamartine", montant: 0, anteriorite: "synthèse à préparer", action: null },
        { id: "cab-comite", dateIso: cabinetEventDateIso(4), titre: "Comité d'investissement", montant: 0, anteriorite: "ordre du jour à diffuser", action: null },
      ];
    }

    // § 1.2 — les dossiers À TRAITER : une action, et une date échue ou
    // du jour. chip = le verbe d'action ; glyphe dérivé de l'action ;
    // détail = montant en jeu · antériorité.
    function buildCabinetToday() {
      const todayIso = cabinetEventDateIso(0);
      return cabinetEvents()
        .filter((e) => e.action && e.dateIso <= todayIso)
        .sort((a, b) => (a.dateIso < b.dateIso ? -1 : a.dateIso > b.dateIso ? 1 : 0))
        .map((e) => ({
          id: e.id,
          titre: e.titre,
          action: e.action,
          glyph: CABINET_GLYPH[e.action] || "→",
          montant: Number(e.montant) || 0,
          detail: `${moneyShort(Number(e.montant) || 0)} · ${e.anteriorite}`,
        }));
    }

    function bankGroupName(value) {
      const src = String(value || "");
      const match = GUARANTOR_ALIASES.find((entry) => entry.re.test(src));
      return match?.label || src.trim() || "Émetteur à confirmer";
    }

    // Couleurs de marque émetteur — une seule table (00-PROTOCOLE.md §8,
    // invariants transversaux). src/issuer-registry.js
    // (STRUCTURA_ISSUER_REGISTRY) est déjà la source des 17 hex de marque
    // (design-tokens.css --issuer-*), déjà lue par Pilotage
    // (app-analytics.js, issuerClassFor). On ne la duplique pas : ce
    // n'est qu'un second accesseur vers la même table, posé ici à côté de
    // GUARANTOR_ALIASES. Couleur jamais en dur dans le rendu — la classe
    // .issuer-<id> porte var(--issuer-<id>) en CSS (dashboard.css).
    function issuerBrandClass(rawLabel) {
      const issuers = root.STRUCTURA_ISSUER_REGISTRY?.issuers || [];
      const match = issuers.find((entry) =>
        (entry.aliases || []).some((re) => re.test(String(rawLabel || ""))),
      );
      return match ? `issuer-${match.id.toLowerCase()}` : "";
    }

    // Date la plus récente de VL émetteur reçue sur le périmètre affiché —
    // pas une date arbitraire, celle du dernier flux réellement encaissé.
    // Vide en mode démo (vlAsOf n'est renseigné que pour les VL "issuer").
    function latestVlAsOf(data) {
      const dates = data.map((p) => p.vlAsOf).filter(Boolean).sort();
      return dates.length ? dates[dates.length - 1] : null;
    }

    function renderSessionChrome() {
      if (typeof document === "undefined") return;
      const { session, greeting } = touchSession();
      const data = productsForScope();
      const vlAsOf = latestVlAsOf(data);

      // Kicker du premier plan (LOT 6, § 3) : « mis à jour le {{ majLe }} ·
      // {{ cabinet }} » — majLe est la VL la plus récente, déjà calculée
      // pour l'ancien bandeau ; le cabinet vient de la session, jamais
      // écrit en dur (session.orgName).
      setText(
        "dash-lede-kicker",
        vlAsOf
          ? `mis à jour le ${shortDateFr(vlAsOf)} · ${session.orgName}`
          : `mise à jour non disponible · ${session.orgName}`,
      );
      // LOT 12 § 1.5 : une seule source d'identité — session.advisorName
      // sert les initiales de la pastille, le titre du bouton, l'en-tête du
      // menu et le prénom du « Bonjour ». Aucun des quatre n'est écrit à
      // la main.
      const nom = session.advisorName || "Conseiller";
      setText("session-avatar", sessionInitials(session.advisorName));
      setText("session-menu-name", nom);
      const pill = document.getElementById("session-profile");
      if (pill) pill.title = nom;
      setText("session-headline", `${greeting} ${session.advisorName}`);
    }

    function renderDashboardSummary() {
      if (typeof document === "undefined") return;
      renderSessionChrome();
      const data = productsForScope();
      const totalVal = data.reduce((s, p) => s + (Number(p.val) || 0), 0);
      const totalNominal = data.reduce((s, p) => s + (Number(p.nominal) || 0), 0);
      const pnlPct = totalNominal
        ? ((totalVal - totalNominal) / totalNominal) * 100
        : 0;
      const breach = data.filter((p) => p.st?.s === "breach").length;
      const watch = data.filter((p) => ["crit", "warn"].includes(p.st?.s)).length;
      const types = new Set(data.map((p) => p.type).filter(Boolean)).size;
      const issuers = new Set(data.map((p) => p.emetteur).filter(Boolean)).size;
      // Le total figure déjà dans le bandeau d'accueil ("Encours géré") :
      // cette carte ne répète plus le même nombre à 40px d'écart, elle
      // porte l'information que les trois autres cartes donnent déjà —
      // un état, pas une somme (passe 6, section B.1).
      setText(
        "kpi-perf-val",
        totalNominal ? `${pnlPct > 0 ? "+" : ""}${pctFr(pnlPct, 2)}` : "—",
      );
      setText(
        "kpi-perf-sub",
        totalNominal
          ? `${totalVal - totalNominal > 0 ? "+" : ""}${moneyShort(totalVal - totalNominal)} vs encours initial`
          : "Import portefeuille requis",
      );
      const perfVal = document.getElementById("kpi-perf-val");
      const perfSub = document.getElementById("kpi-perf-sub");
      for (const el of [perfVal, perfSub]) {
        if (!el) continue;
        el.classList.toggle("up", totalNominal > 0 && pnlPct >= 0);
        el.classList.toggle("dn", totalNominal > 0 && pnlPct < 0);
      }
      setTextFlash("kpi-breach-val", breach, { invert: true });
      setText(
        "kpi-breach-sub",
        breach ? "Action immédiate requise" : "Aucun franchissement actif",
      );
      setTextFlash("kpi-watch-val", watch, { invert: true });
      setText(
        "kpi-watch-sub",
        watch ? "Critique < 5 % · alerte 5–15 %" : "Aucune zone critique",
      );
      setTextFlash("kpi-count-val", data.length);
      setText(
        "kpi-count-sub",
        data.length
          ? `${types} types · ${issuers} émetteurs`
          : "Mode production vide",
      );
      setText("cnt-bar", breach + watch);
      renderDashboardModules();
    }

    function updateAppModeUI() {
      // LOT 12 § 1.4 : « Mode démo » est une entrée fixe du menu de profil,
      // son état (ACTIF quand la démo tourne) se lit à côté du libellé, il
      // ne s'écrit pas dans le libellé.
      const state = document.getElementById("mode-state");
      const btn = document.getElementById("mode-toggle");
      if (state) state.textContent = isProdMode() ? "INACTIF" : "ACTIF";
      if (btn) btn.classList.toggle("on", !isProdMode());
      renderDashboardSummary();
    }

    function toggleAppMode() {
      const next = isProdMode() ? "demo" : "prod";
      if (typeof localStorage !== "undefined")
        localStorage.setItem(APP_MODE_KEY, next);
      updateAppModeUI();
      root.renderPf?.();
      root.renderBarriers?.();
      root.renderAnalytics?.();
      root.renderCalendar?.();
      root.notify?.(
        next === "prod"
          ? "Mode production: produits demo masques"
          : "Mode demo: produits exemple visibles",
        "ok",
      );
    }

    function productInceptionDate(product) {
      const subs = getProductAllocations(product)
        .map((alloc) => alloc.subDate)
        .filter(Boolean);
      const dates = [product.issueDate, product.subDate, ...subs].filter(Boolean).sort();
      return dates[0] || null;
    }

    function portfolioSnapshotAtDate(date, products) {
      const iso = isoDate(date);
      const now = new Date();
      let nominal = 0;
      let valuation = 0;
      products.forEach((product) => {
        const nom = Number(product.nominal) || 0;
        const val = Number(product.val) || 0;
        const inception = productInceptionDate(product);
        if (!inception || inception > iso) return;
        const returnPct = nom ? val / nom - 1 : 0;
        const start = new Date(`${inception}T00:00:00`);
        const totalMs = now.getTime() - start.getTime();
        const elapsedMs = Math.min(totalMs, date.getTime() - start.getTime());
        if (totalMs <= 0 || elapsedMs < 0) {
          nominal += nom;
          valuation += nom;
          return;
        }
        const frac = elapsedMs / totalMs;
        nominal += nom;
        valuation += nom * (1 + returnPct * frac);
      });
      return {
        nominal,
        valuation,
        index: nominal ? (valuation / nominal) * 100 : 100,
      };
    }

    function perfRangeStart(range) {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      // LOT 6/7 : le cadre d'encours lit la MÊME série que le graphe du
      // plâtre (garde-fou § 6 bis nº 1), avec une fenêtre « Mois ». LOT 7 :
      // fenêtre GLISSANTE de 30 jours — même forme que 6m/1a, aucune
      // branche calendaire, sinon la carte est vide le 1er du mois.
      if (range === "month") {
        const d = new Date(now);
        d.setDate(d.getDate() - 30);
        return d;
      }
      // LOT 10 : deux fenêtres glissantes de plus pour le cadre d'encours
      // (Trimestre − 90 j, Année − 365 j) — même forme que « Mois », aucune
      // branche calendaire. Les cas 6m / 1a plus bas restent tels quels :
      // la dalle de performance du plâtre les consomme.
      if (range === "trim") {
        const d = new Date(now);
        d.setDate(d.getDate() - 90);
        return d;
      }
      if (range === "annee") {
        const d = new Date(now);
        d.setDate(d.getDate() - 365);
        return d;
      }
      if (range === "ytd") return new Date(now.getFullYear(), 0, 1);
      if (range === "6m") {
        const d = new Date(now);
        d.setMonth(d.getMonth() - 6);
        return d;
      }
      if (range === "1a") {
        const d = new Date(now);
        d.setFullYear(d.getFullYear() - 1);
        return d;
      }
      const products = productsForScope();
      const dates = products
        .flatMap((p) =>
          getProductAllocations(p)
            .map((alloc) => alloc.subDate)
            .concat([p.issueDate, p.subDate]),
        )
        .filter(Boolean)
        .sort();
      if (dates[0]) return new Date(`${dates[0]}T00:00:00`);
      const d = new Date(now);
      d.setFullYear(d.getFullYear() - 3);
      return d;
    }

    function buildPerfSeries(products, range) {
      const endDate = new Date();
      endDate.setHours(0, 0, 0, 0);
      const startDate = perfRangeStart(range);
      const months = [];
      const cursor = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
      while (cursor <= endDate) {
        months.push(new Date(cursor));
        cursor.setMonth(cursor.getMonth() + 1);
      }
      if (months.length < 2) {
        months.unshift(new Date(startDate));
        months.push(endDate);
      }
      const startSnap = portfolioSnapshotAtDate(startDate, products);
      const endSnap = portfolioSnapshotAtDate(endDate, products);
      const points = months.map((date) => {
        const snap = portfolioSnapshotAtDate(date, products);
        const displayIdx = startSnap.index
          ? (snap.index / startSnap.index) * 100
          : 100;
        return { date, idx: displayIdx, snap };
      });
      const periodPct = startSnap.index
        ? ((endSnap.index / startSnap.index) - 1) * 100
        : 0;
      const periodAbs = endSnap.valuation - startSnap.valuation;
      return { points, startSnap, endSnap, periodPct, periodAbs, startDate, endDate };
    }

    // Tableau part/encours (Dashboard v3, remplace l'anneau SVG de
    // dashboard-correctif-02.md § 3 — mesuré en DOM sur la maquette :
    // plus d'arcs, seulement le tableau) : top 5 nommés, puis une ligne
    // "N autres émetteurs". Couleur de marque jamais en style="" — la
    // classe .issuer-<id> porte var(--issuer-<id>) en CSS, sur le
    // swatch ET sur le trait souligné sous le nom (largeur = part réelle
    // du groupe dans l'encours, pas un décor).
    function buildIssuerTableRows(rows, total) {
      const top = rows.slice(0, 5);
      const rest = rows.slice(5);
      const restNominal = rest.reduce((sum, row) => sum + row.nominal, 0);
      const topHtml = top
        .map((row) => {
          const pct = (row.nominal / total) * 100;
          const cls = row.issuerClass ? ` ${row.issuerClass}` : "";
          return `<div class="issuer-table-row">
            <span class="issuer-swatch${cls}"></span>
            <span class="issuer-table-name-wrap">
              <span class="issuer-table-name">${escapeHtml(row.issuer)}</span>
              <span class="issuer-table-underline${cls}" style="width:${pct.toFixed(1)}%"></span>
            </span>
            <span class="issuer-table-amt">${moneyShort(row.nominal)}</span>
            <span class="issuer-table-pct">${pctFr(pct, 1)}</span>
          </div>`;
        })
        .join("");
      const restHtml = rest.length
        ? `<div class="issuer-table-row issuer-table-rest">
            <span class="issuer-swatch"></span>
            <span class="issuer-table-name-wrap">
              <span class="issuer-table-name">${rest.length} autres émetteurs</span>
              <span class="issuer-table-underline" style="width:${((restNominal / total) * 100).toFixed(1)}%"></span>
            </span>
            <span class="issuer-table-amt">${moneyShort(restNominal)}</span>
            <span class="issuer-table-pct">${pctFr((restNominal / total) * 100, 1)}</span>
          </div>`
        : "";
      return topHtml + restHtml;
    }

    // ── LOT 8 — le plâtre. Trois dalles, chacune réemploie un fait de
    //    l'app (audit § 2, spec § 4). Aucune donnée inventée.

    // § 4 ter : la pastille porte le id du registre (issuer-registry.js
    // n'a aucun champ sigle). Hors registre → pas de pastille.
    function emitterPill(rawLabel) {
      const cls = issuerBrandClass(rawLabel); // "issuer-<id>" ou ""
      if (!cls) return "";
      const id = cls.replace("issuer-", "").toUpperCase();
      return `<span class="emitter-pill">${escapeHtml(id)}</span>`;
    }

    // Dalle A — « Concentration émetteurs ». Source : le même groupement
    // que l'ancienne table (bankGroupName + issuerBrandClass), trié par
    // nominal.
    function renderIssuerExposure() {
      const c = document.getElementById("issuer-exposure");
      if (!c) return;
      const data = productsForScope();
      const rows = [...data.reduce((map, p) => {
        const issuer = bankGroupName(p.emetteur);
        const row = map.get(issuer) || { issuer, nominal: 0, cls: issuerBrandClass(p.emetteur) };
        row.nominal += Number(p.nominal) || 0;
        map.set(issuer, row);
        return map;
      }, new Map()).values()].sort((a, b) => b.nominal - a.nominal);
      const total = rows.reduce((s, r) => s + r.nominal, 0) || 1;
      const N = rows.length;

      const first = rows[0] ? (rows[0].nominal / total) * 100 : 0;
      setDalleNum("dalle-a-num", first, { decimals: 0, unit: "%" });
      setText("dalle-a-num-ctx", `au premier émetteur · ${N} au total`);
      setFootLabel("dalle-a-foot", `Voir les ${N} émetteurs`);

      const body = rows.slice(0, 5).map((r) => {
        const pct = (r.nominal / total) * 100;
        const tint = r.cls ? ` ${r.cls}` : "";
        return `<div class="conc-row">
            <div class="conc-row-top">
              <span class="conc-name-wrap"><span class="conc-dot${tint}"></span><span class="conc-name">${escapeHtml(r.issuer)}</span></span>
              <span class="conc-fig"><span class="conc-amt">${moneyShort(r.nominal)}</span><span class="conc-pct">${ptsFr(pct, 0)}<span class="conc-pct-u">%</span></span></span>
            </div>
            <div class="conc-gauge"><span class="conc-dot-fill${tint}" style="width:${pct.toFixed(1)}%"></span></div>
          </div>`;
      }).join("");
      const deux = rows.slice(0, 2).reduce((s, r) => s + r.nominal, 0) / total * 100;
      const totalLine = rows.length >= 2
        ? `<div class="conc-total"><span>Les deux premiers</span><span class="conc-total-val">${pctFr(deux, 0)} de l'encours</span></div>`
        : "";
      c.innerHTML = `<div class="conc-list">${body}</div>${totalLine}`;
      if (!rows.length) c.innerHTML = `<div class="empty-inline">Aucune exposition à afficher.</div>`;
    }

    // Top/Flop VL (Passe 7 reprise, bloc 7b — rouvert après mesure de
    // Écarts de VL (specs/dashboard.md § 2.2, corrigé par
    // dashboard-correctif-01.md C1 + C6) : une seule liste, un axe
    // unique centré à 50 % de la zone de tracé (deux colonnes 1fr
    // égales), qui reste au centre quelles que soient les données — si
    // tout le portefeuille est sous 100, la moitié droite reste vide,
    // c'est l'information (C2). Nom sur une seule ligne (200px,
    // ellipsis), pas de sous-jacent empilé dessous. Valeur en points
    // d'écart à 100 (ex. +27,4), pas un pourcentage — ni %, ni
    // 2 décimales : pctFr ne convient pas ici, d'où ptsFr, formateur
    // dédié qui n'ajoute aucune unité (le signe suit la même convention
    // que pctFr/moneyShort : le "−" est géré ici, le "+" reste à la
    // charge de l'appelant). Encre partout, jamais mer ni terre (§ 2.2,
    // "le monochrome est correct et reste") : positif et négatif partagent
    // la même trame gravée (115°, 2px/5px) — Dashboard v3, mesurée
    // identique dans les deux sens, annule le remplissage plein côté
    // positif de dashboard-correctif-01.md C7.
    //
    // C6 — sélection : classer TOUS les produits par écart à 100
    // décroissant, prendre les 5 premiers et les 5 derniers, aucune
    // condition de signe (les "5 meilleurs" restent les 5 premiers du
    // classement même s'ils sont tous négatifs). Moins de 10 produits :
    // tout afficher, une seule fois chacun — slice(0,5)+slice(-5) se
    // chevauchent quand data.length < 10, le dédoublonnage par id après
    // coup absorbe le chevauchement sans jamais répéter une ligne.
    //
    // C1 — domaine : max(abs(écart)) sur les lignes AFFICHÉES (pas tout
    // le portefeuille), arrondi au point supérieur, plancher 4 points.
    // Recalculé à chaque rendu puisque `rows` change avec les données.
    // Largeur : abs(écart)/domaine en %, plancher 3px — CSS
    // max(3px, X%) directement, comme la maquette (pas de HEADROOM
    // arbitraire : l'arrondi au point supérieur donne déjà la marge).
    function ptsFr(value, digits = 1) {
      const n = Number(value) || 0;
      const sign = n < 0 ? "−" : "";
      return `${sign}${Math.abs(n).toFixed(digits).replace(".", ",")}`;
    }
    // Dalle B — « Top / Flop produits ». Source : même classement par VL
    // qu'avant, avec la bascule Top 5 / Flop 5 de la maquette. VL_MAX est
    // le plafond d'échelle relevé maquette : une seule déclaration, lue
    // par les jauges ET les repères de barrière (§ 4.2).
    const VL_MAX = 150;
    let topFlopMode = "top";

    function setTopFlop(mode) {
      topFlopMode = mode === "flop" ? "flop" : "top";
      renderVlTopFlop();
    }

    function renderVlTopFlop() {
      const c = document.getElementById("vl-top-flop");
      if (!c) return;
      const data = productsForScope()
        .filter((p) => Number.isFinite(Number(p.val)) && Number.isFinite(Number(p.nominal)) && Number(p.nominal) > 0)
        .map((p) => ({
          ...p,
          vlLevel: Number.isFinite(Number(p.vlPct)) ? Number(p.vlPct) : (Number(p.val) / Number(p.nominal)) * 100,
        }))
        .sort((a, b) => b.vlLevel - a.vlLevel);

      const moyenne = data.length ? data.reduce((s, p) => s + p.vlLevel, 0) / data.length : 100;
      const sousBarriere = data.filter((p) => ["breach", "crit", "warn"].includes(p.st?.s)).length;
      setDalleNum("dalle-b-num", moyenne, { decimals: 1 });
      setText("dalle-b-num-ctx", `VL moyenne · ${sousBarriere} sous barrière`);
      setFootLabel("dalle-b-foot", topFlopMode === "top" ? "Voir tout le portefeuille" : "Voir les positions à risque");

      document.querySelectorAll(".dalle-b .topflop-btn").forEach((b) => {
        const on = b.dataset.topflop === topFlopMode;
        b.classList.toggle("on", on);
        b.setAttribute("aria-pressed", String(on));
      });

      if (!data.length) {
        c.innerHTML = `<div class="empty-inline">Aucune VL exploitable.</div>`;
        return;
      }
      const rows = topFlopMode === "top" ? data.slice(0, 5) : data.slice(-5).reverse();

      const row = (p) => {
        const delta = p.vlLevel - 100;
        const pos = delta >= 0;
        const w = Math.min(100, (Math.abs(p.vlLevel) / VL_MAX) * 100);
        const pill = emitterPill(p.emetteur);
        // Repère par ligne : capital garanti (st.s === "none") ou sans
        // barrière → pas de repère du tout (§ 4.2).
        const hasBar = p.st?.s !== "none" && Number.isFinite(Number(p.barrier)) && Number(p.barrier) > 0;
        const marker = hasBar
          ? `<span class="tf-marker" title="Barrière de protection du capital" style="left:${((Number(p.barrier) / VL_MAX) * 100).toFixed(2)}%"></span>`
          : "";
        // LOT 11 § 3.4 : deux états, jamais trois — plus d'orangé sur
        // cette figure. L'écart et la jauge sont en encre au-dessus de la
        // barrière, en --color-breach en dessous (VL sous la protection).
        const underBar = hasBar && p.vlLevel < Number(p.barrier);
        return `<button type="button" class="tf-row${underBar ? " tf-row--under" : ""}" onclick="openDrawer(${p.id})">
            <span class="tf-row-top">
              <span class="tf-name-wrap">${pill}<span class="tf-name">${escapeHtml(p.name)}</span></span>
              <span class="tf-vl">${(p.vlLevel).toFixed(1).replace(".", ",")}</span>
              <span class="tf-ecart">${pos ? "+" : ""}${ptsFr(delta)}</span>
            </span>
            <span class="tf-gauge">
              <span class="tf-gauge-fill" style="width:${w.toFixed(1)}%"></span>
              ${marker}
            </span>
          </button>`;
      };
      c.innerHTML = rows.map(row).join("");
    }

    // ── LOT 6 — les trois widgets du premier plan (spec § 3–4, § 6 bis).
    //    Chacun réemploie un fait de l'app, aucun n'invente de série ni
    //    de liste. Valeurs de rendu relevées dans la maquette (l. 159-243).

    // LOT 13 : une seule liste de fenêtres, lue par le cadre d'encours du
    // premier plan ET par la dalle de performance du bas. Deux rangées de
    // boutons, une source — elles ne peuvent pas diverger.
    const PERIODES = [
      { key: "month", nom: "Mois" },
      { key: "trim", nom: "Trimestre" },
      { key: "annee", nom: "Année" },
      { key: "all", nom: "Depuis l'origine" },
    ];
    let encoursRange = "month";

    function renderEncoursFrame() {
      const svg = document.getElementById("dash-encours-svg");
      if (!svg) return;
      const data = productsForScope();
      // garde-fou § 6 bis nº 1 : même série que le graphe du plâtre,
      // fenêtre différente.
      const { points, periodPct, periodAbs, startDate, endDate } = buildPerfSeries(data, encoursRange);
      const totalVal = data.reduce((s, p) => s + (Number(p.val) || 0), 0);
      const totalNom = data.reduce((s, p) => s + (Number(p.nominal) || 0), 0);

      setText("dash-encours-val", totalVal ? moneyShort(totalVal) : "—");
      const positive = periodPct >= 0;
      // LOT 15 § 2.3 : deux décimales, espace après le signe — « + 4,82 % ».
      setText(
        "dash-encours-perf-mois",
        totalNom ? `${positive ? "+ " : "− "}${pctFr(Math.abs(periodPct), 2)}` : "—",
      );
      // LOT 15 § 2.5 : la teinte est portée par une classe, jamais par
      // style="" — .is-up / .is-dn (dashboard.css).
      const perfMoisEl = document.getElementById("dash-encours-perf-mois");
      if (perfMoisEl) {
        perfMoisEl.classList.toggle("is-up", totalNom > 0 && positive);
        perfMoisEl.classList.toggle("is-dn", totalNom > 0 && !positive);
      }
      // LOT 15 § 2.4 : le delta en k€ arrondi au millier — « soit + 610 k€
      // sur la période », pas « + 0,6 M€ ». Espace après le signe.
      setText(
        "dash-encours-perf-delta",
        totalNom
          ? `soit ${positive ? "+ " : "− "}${milliersEuros(Math.abs(periodAbs))} sur la période`
          : "Import portefeuille requis",
      );
      setText("dash-encours-borne-a", monthShortFR(startDate));
      setText("dash-encours-borne-b", monthShortFR(endDate));

      // LOT 11 § 3.2 : lissage Catmull-Rom sur les constatations réelles
      // (tangentes réelles, pas des plateaux — l'ancien tracé posait un
      // segment droit entre chaque point mensuel). Ligne de base BAS = 104
      // (la dernière ligne de la trame : l'aire se ferme SUR la trame, pas
      // 8px dessous), haut HAUT = 14.
      const W = 380;
      const BAS = 104;
      const HAUT = 14;
      const vals = points.map((p) => p.idx);
      const minV = Math.min(...vals) - 0.6;
      const maxV = Math.max(...vals) + 0.6;
      const xAt = (i) => (i / (points.length - 1 || 1)) * W;
      const yAt = (v) => BAS - ((v - minV) / (maxV - minV || 1)) * (BAS - HAUT);
      const pts = points.map((p, i) => [xAt(i), yAt(p.idx)]);
      const at = (i) => pts[Math.max(0, Math.min(pts.length - 1, i))];
      let line = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
      for (let i = 0; i < pts.length - 1; i += 1) {
        const p0 = at(i - 1);
        const p1 = at(i);
        const p2 = at(i + 1);
        const p3 = at(i + 2);
        const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
        const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
        line += ` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
      }
      const area = `${line} L${W},${BAS} L0,${BAS} Z`;
      const curX = pts[pts.length - 1][0].toFixed(1);
      const curY = pts[pts.length - 1][1].toFixed(1);
      svg.setAttribute("viewBox", "0 0 380 112");
      svg.setAttribute("preserveAspectRatio", "none");
      // LOT 15 § 2.1 : trame et ligne du curseur en --encre-faible — le
      // token que la maquette nomme. (--color-border-strong y résolvait
      // déjà, mais se lit « bordure forte », pas « trait discret ».)
      svg.innerHTML = `
        <defs>
          <linearGradient id="aireEncours" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="var(--color-safe)" stop-opacity="0.2"></stop>
            <stop offset="100%" stop-color="var(--color-safe)" stop-opacity="0"></stop>
          </linearGradient>
        </defs>
        <g stroke="var(--encre-faible)" stroke-width="1" stroke-dasharray="3 4">
          <line x1="0" y1="22" x2="380" y2="22"></line>
          <line x1="0" y1="50" x2="380" y2="50"></line>
          <line x1="0" y1="78" x2="380" y2="78"></line>
          <line x1="0" y1="104" x2="380" y2="104"></line>
        </g>
        <path d="${area}" fill="url(#aireEncours)"></path>
        <path d="${line}" pathLength="1" fill="none" stroke="var(--color-safe)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="stroke-dasharray:1;animation:tracer 900ms var(--ease-standard) 120ms both"></path>
        <line x1="${curX}" y1="8" x2="${curX}" y2="104" stroke="var(--encre-faible)" stroke-width="1"></line>
        <circle cx="${curX}" cy="${curY}" r="4.2" fill="var(--color-safe)" stroke="var(--color-surface-raised)" stroke-width="2" style="animation:paraitre 300ms linear 940ms both"></circle>`;

      const ranges = document.getElementById("dash-encours-ranges");
      if (ranges) {
        ranges.innerHTML = PERIODES.map(
          (r) =>
            `<button type="button" class="dash-encours-range${r.key === encoursRange ? " on" : ""}" data-encours-range="${r.key}" onclick="setEncoursRange('${r.key}')">${escapeHtml(r.nom)}</button>`,
        ).join("");
      }
    }

    function setEncoursRange(key) {
      encoursRange = key || "month";
      renderEncoursFrame();
    }

    function renderAgendaWeek() {
      const host = document.getElementById("dash-agenda-week");
      if (!host) return;
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const todayIso = now.toISOString().slice(0, 10);
      // lundi de la semaine en cours
      const monday = new Date(now);
      monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);

      // LOT 15 § 3.1 : jour + mois, sans le nom du jour de semaine.
      setText(
        "dash-agenda-day",
        now.toLocaleDateString("fr-FR", { day: "numeric", month: "long" }),
      );
      // LOT 15 § 3.1 : la plage se calcule depuis le lundi affiché, elle
      // ne s'écrit pas. Le mois n'est répété que si la semaine l'enjambe.
      const moisLun = monday.toLocaleDateString("fr-FR", { month: "long" });
      const moisDim = sunday.toLocaleDateString("fr-FR", { month: "long" });
      setText(
        "dash-agenda-range",
        moisLun === moisDim
          ? `${monday.getDate()} – ${sunday.getDate()} ${moisDim}`
          : `${monday.getDate()} ${moisLun} – ${sunday.getDate()} ${moisDim}`,
      );

      // LOT 15 § 1.1 : la pastille ne vient QUE de la vie de cabinet. Un
      // jour qui porte trois coupons mais aucun événement de cabinet n'a
      // pas de pastille.
      const joursCharges = new Set(cabinetEvents().map((e) => e.dateIso));

      const DOW = ["lun", "mar", "mer", "jeu", "ven", "sam", "dim"];
      let dows = "";
      let cells = "";
      for (let i = 0; i < 7; i += 1) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        const iso = d.toISOString().slice(0, 10);
        const charge = joursCharges.has(iso);
        const isToday = iso === todayIso;
        // LOT 10 : deux états seulement — aujourd'hui (disque rouge) ou
        // rien. Un jour chargé garde son numéro sans fond ; il se signale
        // par la seule pastille de 4px dessous, en une seule couleur (la
        // variante de risque de la pastille sort — deux signaux pour un fait).
        const numCls = isToday ? " is-today" : "";
        const dot = charge
          ? `<span class="dash-agenda-dot"></span>`
          : `<span class="dash-agenda-dot" hidden></span>`;
        dows += `<span class="dash-agenda-dow">${DOW[i]}</span>`;
        cells += `<span class="dash-agenda-cell"><span class="dash-agenda-num${numCls}">${d.getDate()}</span>${dot}</span>`;
      }
      host.innerHTML = dows + cells;
    }

    function renderTodayList() {
      const host = document.getElementById("dash-today-list");
      const count = document.getElementById("dash-today-count");
      const stake = document.getElementById("dash-today-stake");
      if (!host) return;
      const list = buildCabinetToday();
      if (count) count.textContent = String(list.length);
      // LOT 15 § 1.3 : la sous-ligne se dérive de la liste — la somme et
      // le nombre de dossiers ne sont jamais écrits.
      if (stake) {
        if (list.length) {
          const somme = list.reduce((s, a) => s + a.montant, 0);
          stake.textContent = `${moneyShort(somme)} en jeu sur ${list.length} dossier${list.length > 1 ? "s" : ""}`;
          stake.hidden = false;
        } else {
          stake.textContent = "";
          stake.hidden = true;
        }
      }
      if (!list.length) {
        // LOT 15 § 0.1 : état vide écrit — en production cabinetEvents()
        // est vide, la liste ne se contente pas de disparaître.
        host.innerHTML = `<div class="dash-today-empty">Aucun dossier à traiter aujourd'hui.</div>`;
        return;
      }
      host.innerHTML = list
        .map(
          (a) => `<button type="button" class="dash-today-row">
            <span class="dash-today-glyph" aria-hidden="true">${a.glyph}</span>
            <span class="dash-today-txt">
              <span class="dash-today-name">${escapeHtml(a.titre)}</span>
              <span class="dash-today-detail">${escapeHtml(a.detail)}</span>
            </span>
            <span class="dash-today-chip">${escapeHtml(a.action)}</span>
          </button>`,
        )
        .join("");
    }

    // ── Les grands chiffres des trois dalles + l'odomètre (§ 4 bis) ──
    // setDalleNum pose la valeur exacte (jamais un arrondi de la montée) et
    // mémorise la cible ; runOdometer, une seule fois au premier rendu,
    // fait monter les trois depuis 0 en 900 ms, courbe 1-(1-p)^4.
    const odoTargets = {};
    let odoDone = false;

    function fmtDalleNum(id, value) {
      const t = odoTargets[id] || { decimals: 0, unit: "" };
      const txt = Number(value).toFixed(t.decimals).replace(".", ",");
      const u = t.unit ? `<span class="dalle-num-u">${t.unit}</span>` : "";
      return `${txt}${u}`;
    }

    function setDalleNum(id, value, { decimals = 0, unit = "" } = {}) {
      odoTargets[id] = { value: Number(value) || 0, decimals, unit };
      const el = document.getElementById(id);
      if (el) el.innerHTML = fmtDalleNum(id, Number(value) || 0);
    }

    function setFootLabel(id, label) {
      const el = document.getElementById(id);
      const lbl = el && el.querySelector(".dalle-foot-lbl");
      if (lbl) lbl.textContent = label;
    }

    function runOdometer() {
      if (odoDone) return;
      odoDone = true;
      const ids = ["dalle-a-num", "dalle-b-num", "dalle-c-num"].filter((id) => odoTargets[id]);
      if (!ids.length) return;
      if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        ids.forEach((id) => { const el = document.getElementById(id); if (el) el.innerHTML = fmtDalleNum(id, odoTargets[id].value); });
        return;
      }
      const t0 = performance.now();
      const step = (now) => {
        const p = Math.min(1, (now - t0) / 900);
        const e = 1 - Math.pow(1 - p, 4);
        ids.forEach((id) => {
          const el = document.getElementById(id);
          if (!el) return;
          el.innerHTML = p >= 1
            ? fmtDalleNum(id, odoTargets[id].value)
            : fmtDalleNum(id, odoTargets[id].value * e);
        });
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }

    // Dalle C — « Événements de la semaine ». Source :
    // buildProductCalendarEvents(), le même global que l'agenda du premier
    // plan, filtré sur la semaine en cours.
    function renderWeekEvents() {
      const c = document.getElementById("dash-week-events");
      if (!c) return;
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const monday = new Date(now);
      monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      const inWeek = (iso) => iso >= monday.toISOString().slice(0, 10) && iso <= sunday.toISOString().slice(0, 10);

      const all = typeof root.buildProductCalendarEvents === "function" ? root.buildProductCalendarEvents() : [];
      const evs = all.filter((e) => e._dateIso && inWeek(e._dateIso));

      setDalleNum("dalle-c-num", evs.length, { decimals: 0 });
      setText("dalle-c-num-ctx", "cette semaine");
      setFootLabel("dalle-c-foot", "Ouvrir l'agenda");

      if (!evs.length) { c.innerHTML = ""; return; }
      const DOW = ["lun", "mar", "mer", "jeu", "ven", "sam", "dim"];
      const todayIso = now.toISOString().slice(0, 10);
      // LOT 11 § 3.1 : tri explicite, jamais l'ordre d'écriture. Ce qui
      // reste à faire d'abord (aujourd'hui puis à venir, au plus proche) ;
      // le passé descend en bas, du plus récent au plus ancien, en encre
      // atténuée. Le délai d'animation est posé APRÈS le tri, sur l'index
      // affiché — l'entrée échelonnée suit l'ordre à l'écran.
      const ordered = evs
        .map((e) => ({ e, n: new Date(`${e._dateIso}T00:00:00`).getTime(), passe: e._dateIso < todayIso }))
        .sort((a, b) => (a.passe - b.passe) || (a.passe ? b.n - a.n : a.n - b.n));
      c.innerHTML = ordered.map(({ e, passe }, i) => {
        const d = new Date(`${e._dateIso}T00:00:00`);
        const emet = String(e.desc || "").split(" · ").pop() || "";
        const pill = emitterPill(emet);
        const amt = e.amt || e.exposure || "";
        const delay = 500 + i * 50;
        return `<button type="button" class="we-row${passe ? " we-row--past" : ""}" style="--we-delay:${delay}ms" onclick="openDrawer(${e.productId})">
            <span class="we-date"><span class="we-dow">${DOW[(d.getDay() + 6) % 7]}</span><span class="we-num">${d.getDate()}</span></span>
            ${pill || '<span class="we-pill-empty"></span>'}
            <span class="we-main">
              <span class="we-title">${escapeHtml(e.name || "")}</span>
              <span class="we-detail">${escapeHtml(e.desc || "")}</span>
            </span>
            <span class="we-amt">${escapeHtml(amt)}</span>
          </button>`;
      }).join("");
    }

    function renderDashboardModules() {
      renderIssuerExposure();
      renderVlTopFlop();
      renderWeekEvents();
      renderEncoursFrame();
      renderAgendaWeek();
      renderTodayList();
      runOdometer();
    }

    function monthShortFR(date) {
      return date
        .toLocaleDateString("fr-FR", { month: "short" })
        .replace(".", "")
        .toUpperCase();
    }

    // LOT 15 § 2.4 : montant en milliers d'euros, arrondi au millier —
    // toujours « k€ », jamais « M€ » (moneyShort bascule en M€ au-delà
    // d'un million, ce que le cadre d'encours ne veut pas ici).
    function milliersEuros(abs) {
      const k = Math.round((Number(abs) || 0) / 1000);
      return `${k.toLocaleString("fr-FR")} k€`;
    }

    // La cellule montant découle du type de l'événement, jamais l'inverse
    // (passe 8, §3) : Constatation montre un état (distance, poids réduit,
    // §3 nuance validée à l'écran), Coupon un flux réel, Rappel/Maturité
    // saine un total décisionnel avec son détail, Maturité en
    // franchissement une exposition — nature différente, pas une couleur.
    function eventAmountCell(e) {
      // Capital garanti n'a pas de barrière : e.level.distance vaut 999
      // (sentinel, app-state.js:343, tone "st-none" — statusFromDist),
      // pas un écart réel.
      if (e.level && e.level.tone === "st-none") {
        return `<div class="timeline-amt">—</div>`;
      }
      if (e.level) {
        const sign = e.level.distance < 0 ? "−" : "+";
        const value = pctFr(Math.abs(e.level.distance), 1);
        return `<div class="timeline-amt timeline-level"><span class="timeline-level-sign ${escapeHtml(e.level.tone)}">${sign}</span><span class="timeline-level-value">${value}</span></div>`;
      }
      if (e.exposure) {
        return `<div class="timeline-amt timeline-exposure"><b>${escapeHtml(e.exposure)}</b><small>nominal exposé</small></div>`;
      }
      if (e.cashflow) {
        return `<div class="timeline-amt timeline-cashflow"><b>${escapeHtml(e.cashflow.total)}</b><small>${escapeHtml(e.cashflow.capital)} + ${escapeHtml(e.cashflow.coupon)}</small></div>`;
      }
      // Un montant de coupon reconstitué n'est jamais une donnée
      // confirmée (aucun flux de marché ni paiement réel suivi par
      // l'app, passé ou futur) — toujours affiché comme attendu, jamais
      // comme acquis, qu'importe la barrière ou la date (passe 8, §2).
      if (e.amt) {
        return `<div class="timeline-amt timeline-cashflow">${escapeHtml(e.amt)}<small class="timeline-conditional-note">conditionnel</small></div>`;
      }
      return `<div class="timeline-amt">—</div>`;
    }

    // Repère de lecture ("Aujourd'hui", "Date d'émission") : une frise,
    // pas une ligne d'événement — pas de nom de produit, pas de cellule
    // montant. data-landmark="today" permet au tiroir de s'y positionner
    // à l'ouverture (passe 8, §2).
    function timelineLandmarkHtml(e) {
      return `<div class="timeline-landmark"${e.marker === "today" ? ' data-landmark="today"' : ""}><span>${escapeHtml(e.name)}</span></div>`;
    }

    function evHtml(evs) {
      const todayStr = isoDate(new Date());
      return evs
        .map((e) => {
          if (e.type === "landmark") return timelineLandmarkHtml(e);
          const isPast = e._dateIso < todayStr;
          return `<div class="timeline-item ev-${e.type}${isPast ? " is-past" : ""}" ${e.productId ? `onclick="openDrawer(${e.productId})"` : ""}>
    <div class="timeline-date"><b>${escapeHtml(e.d)}</b><small>${escapeHtml(e.m)}</small></div>
    <div class="timeline-main"><b>${escapeHtml(e.name)}</b><small>${escapeHtml(e.desc)}</small></div>
    ${eventAmountCell(e)}
  </div>`;
        })
        .join("");
    }

    // L'inclinaison au survol des KPI du Dashboard est retirée au LOT 8 :
    // la rangée .kpi-row sort du Dashboard, la fonction ne ciblait que
    // « #view-dashboard .kpi.tilt » — code mort.

    return {
      renderDashboardSummary,
      updateAppModeUI,
      toggleAppMode,
      renderDashboardModules,
      renderIssuerExposure,
      renderVlTopFlop,
      renderSessionChrome,
      evHtml,
      monthShortFR,
      bankGroupName,
      renderEncoursFrame,
      renderAgendaWeek,
      renderTodayList,
      setEncoursRange,
      renderWeekEvents,
      setTopFlop,
    };
  },
);
