// ===================== STRUCTURA EXTRACTION ENGINE v3 =====================
// SmartTableParser + EnhancedPatternLibrary + UniversalProductClassifier
// Chargé AVANT app.js dans index.html

'use strict';

// ─────────────────────────────────────────────────────────────────────────────
// 1. SmartTableParser
//    Extrait des paires clé-valeur et des tableaux de calendrier depuis le
//    texte brut issu d'un PDF de term sheet.
// ─────────────────────────────────────────────────────────────────────────────

var SmartTableParser = {

  // Normalise une clé : lowercase, sans accents, non-alphanum → '_', collapse '__'
  normalizeKey: function (k) {
    return k
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/__+/g, '_')
      .replace(/^_|_$/g, '');
  },

  // Extrait les paires clé-valeur depuis le texte brut
  parseKV: function (text) {
    var kv = {};
    var lines = text.split(/\r?\n/);
    // Deux patterns : "KEY: VALUE" et "KEY   VALUE" (3+ espaces, typique PDF)
    var COLON_RE = /^(.{1,60}?)\s*:\s*(.+)$/;
    var SPACE_RE = /^(.{1,60}?)\s{3,}(.+)$/;

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].trim();
      if (!line) continue;

      var m = COLON_RE.exec(line) || SPACE_RE.exec(line);
      if (!m) continue;

      var rawKey = m[1].trim();
      var rawVal = m[2].trim();
      if (!rawKey || rawKey.length > 60 || !rawVal) continue;

      var normKey = this.normalizeKey(rawKey);
      if (normKey && !kv[normKey]) kv[normKey] = rawVal;
    }
    return kv;
  },

  // Table d'aliases par champ sémantique
  _ALIAS_TABLE: {
    isin:       ['isin', 'code_isin', 'isin_code', 'reference', 'code_valeur'],
    coupon:     ['coupon', 'coupon_annuel', 'coupon_conditionnel', 'taux', 'remuneration',
                 'remuneration_conditionnelle', 'rendement', 'taux_d_interet', 'taux_du_coupon',
                 'interest_rate', 'contingent_coupon', 'conditional_coupon', 'annual_coupon'],
    barrier:    ['barriere', 'barriere_de_protection', 'barriere_capital', 'seuil_de_perte',
                 'protection', 'plancher', 'capital_floor', 'knock_in', 'knock_in_barrier',
                 'barrier_level', 'protection_level', 'niveau_de_protection',
                 'seuil_de_remboursement_final', 'niveaux_de_protection',
                 'capital_protection_level', 'capital_protection', 'downside_barrier'],
    recall:     ['rappel', 'seuil_de_rappel', 'niveau_de_rappel',
                 'seuil_de_remboursement_anticipe', 'autocall', 'autocall_level',
                 'early_redemption_level', 'trigger_level', 'seuil_de_declenchement',
                 'niveau_d_observation', 'early_redemption_trigger'],
    maturity:   ['maturite', 'date_d_echeance', 'echeance', 'date_de_remboursement',
                 'maturity', 'maturity_date', 'final_maturity', 'date_d_echeance_finale',
                 'date_finale'],
    nominal:    ['nominal', 'valeur_nominale', 'denomination', 'face_value', 'principal',
                 'montant_unitaire', 'minimum_denomination', 'stated_principal',
                 'montant_nominal', 'montant_minimal_de_souscription',
                 'valeur_de_remboursement_unitaire', 'montant_de_reference'],
    issuer:     ['emetteur', 'garant', 'issuer', 'guarantor', 'etablissement_emetteur'],
    underlying: ['sous_jacent', 'valeur_de_reference', 'indice', 'underlying',
                 'reference_asset', 'actif_sous_jacent', 'reference_index',
                 'indice_de_reference', 'actif_de_reference', 'sous_jacent_de_reference'],
    type:       ['type_de_produit', 'type', 'famille', 'instrument', 'product_type',
                 'nature_du_produit']
  },

  // Lookup : exact d'abord, puis fuzzy (key includes alias || alias includes key)
  _lookupField: function (kv, aliases) {
    var ai, ki, key, alias;
    for (ai = 0; ai < aliases.length; ai++) {
      if (kv[aliases[ai]] !== undefined) return kv[aliases[ai]];
    }
    var kvKeys = Object.keys(kv);
    for (ki = 0; ki < kvKeys.length; ki++) {
      key = kvKeys[ki];
      for (ai = 0; ai < aliases.length; ai++) {
        alias = aliases[ai];
        if (key.includes(alias) || alias.includes(key)) return kv[key];
      }
    }
    return undefined;
  },

  // Parse un pourcentage depuis une valeur brute
  _parsePercent: function (v) {
    if (!v) return null;
    var m = /([0-9]+(?:[.,][0-9]+)?)\s*%/.exec(v);
    if (m) return parseFloat(m[1].replace(',', '.'));
    var n = /([0-9]+(?:[.,][0-9]+)?)/.exec(v);
    if (n) {
      var f = parseFloat(n[1].replace(',', '.'));
      if (f >= 0.5 && f <= 200) return f;
    }
    return null;
  },

  // Parse une date (ISO, FR, ou texte avec mois)
  _parseDate: function (v) {
    if (!v) return null;
    var m, d, mo, y;
    // ISO YYYY-MM-DD
    m = /(\d{4}-\d{2}-\d{2})/.exec(v);
    if (m) return m[1];
    // FR DD/MM/YYYY ou DD.MM.YYYY ou DD-MM-YYYY
    m = /(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4})/.exec(v);
    if (m) {
      d = m[1].padStart(2, '0'); mo = m[2].padStart(2, '0'); y = m[3];
      return y + '-' + mo + '-' + d;
    }
    // Texte "12 janvier 2027" ou "12 january 2027"
    var MONTHS = {
      janvier: 1, fevrier: 2, 'février': 2, mars: 3, avril: 4, mai: 5, juin: 6,
      juillet: 7, 'aout': 8, 'août': 8, septembre: 9, octobre: 10,
      novembre: 11, 'decembre': 12, 'décembre': 12,
      january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
      july: 7, august: 8, september: 9, october: 10, november: 11, december: 12
    };
    m = /(\d{1,2})\s+([a-zéàûîâùèêôä]+)\s+(\d{4})/i.exec(v);
    if (m) {
      var mn = m[2].toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      var moNum = MONTHS[mn] || MONTHS[m[2].toLowerCase()];
      if (moNum) return m[3] + '-' + String(moNum).padStart(2, '0') + '-' + m[1].padStart(2, '0');
    }
    return v;
  },

  // Parse un nominal (supporte séparateurs de milliers FR et EN)
  _parseNominal: function (v) {
    if (!v) return null;
    var s = v.replace(/\s/g, '');
    // 1.000.000 ou 1 000 000 → enlève les séparateurs de milliers
    var m = /([0-9]{1,3}(?:[,. ][0-9]{3})+(?:[,.][0-9]{1,2})?)/.exec(s);
    if (m) {
      var cleaned = m[1].replace(/[,. ](?=[0-9]{3}(?:[^0-9]|$))/g, '');
      var n = parseFloat(cleaned.replace(',', '.'));
      if (!isNaN(n) && n > 0) return n;
    }
    var plain = /([0-9]+(?:[.,][0-9]+)?)/.exec(s);
    if (plain) {
      var f = parseFloat(plain[1].replace(',', '.'));
      if (!isNaN(f) && f > 0) return f;
    }
    return null;
  },

  // Validation ISIN avec algorithme de Luhn adapté
  _luhnCheckISIN: function (isin) {
    if (!/^[A-Z]{2}[A-Z0-9]{9}[0-9]$/.test(isin)) return false;
    var s = '';
    for (var i = 0; i < isin.length; i++) {
      var c = isin.charCodeAt(i);
      s += (c >= 65 ? (c - 55).toString() : isin[i]);
    }
    var digits = s.split('').map(Number);
    var sum = 0, dbl = false;
    for (var j = digits.length - 1; j >= 0; j--) {
      var dv = digits[j];
      if (dbl) { dv *= 2; if (dv > 9) dv -= 9; }
      sum += dv;
      dbl = !dbl;
    }
    return sum % 10 === 0;
  },

  // Extrait les champs structurés depuis le dictionnaire KV normalisé
  extractFromKV: function (kv) {
    var A = this._ALIAS_TABLE;
    var out = {};

    var isinRaw = this._lookupField(kv, A.isin);
    if (isinRaw) {
      var im = /([A-Z]{2}[A-Z0-9]{9}[0-9])/.exec(isinRaw.toUpperCase());
      if (im && this._luhnCheckISIN(im[1])) out.isin = im[1];
    }

    var couponRaw = this._lookupField(kv, A.coupon);
    if (couponRaw) { var cp = this._parsePercent(couponRaw); if (cp !== null) out.couponPct = cp; }

    var barrierRaw = this._lookupField(kv, A.barrier);
    if (barrierRaw) { var bp = this._parsePercent(barrierRaw); if (bp !== null) out.barrierPct = bp; }

    var recallRaw = this._lookupField(kv, A.recall);
    if (recallRaw) { var rp = this._parsePercent(recallRaw); if (rp !== null) out.recallPct = rp; }

    var matRaw = this._lookupField(kv, A.maturity);
    if (matRaw) { var dt = this._parseDate(matRaw); if (dt) out.maturityDate = dt; }

    var nomRaw = this._lookupField(kv, A.nominal);
    if (nomRaw) { var nm = this._parseNominal(nomRaw); if (nm !== null) out.nominal = nm; }

    var issuerRaw = this._lookupField(kv, A.issuer);
    if (issuerRaw) out.issuerHint = issuerRaw.trim();

    var underRaw = this._lookupField(kv, A.underlying);
    if (underRaw) out.underlyingHint = underRaw.trim();

    var typeRaw = this._lookupField(kv, A.type);
    if (typeRaw) out.typeHint = typeRaw.trim();

    return out;
  },

  // Détecte le calendrier d'observations depuis le texte (dates + niveaux %)
  detectObservationSchedule: function (text) {
    var lines = text.split(/\r?\n/);
    var DATE_RE = /(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4})|(\d{4})-(\d{2})-(\d{2})/;
    var PCT_RE = /([0-9]+(?:[.,][0-9]+)?)\s*%/g;
    var seen = {};
    var results = [];

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      var dm = DATE_RE.exec(line);
      if (!dm) continue;

      var dateIso;
      if (dm[4]) {
        dateIso = dm[4] + '-' + dm[5] + '-' + dm[6];
      } else {
        dateIso = dm[3] + '-' + dm[2].padStart(2, '0') + '-' + dm[1].padStart(2, '0');
      }

      var yr = parseInt(dateIso.substring(0, 4), 10);
      if (yr < 2000 || yr > 2060) continue;

      var pcts = [];
      var pm;
      PCT_RE.lastIndex = 0;
      while ((pm = PCT_RE.exec(line)) !== null) {
        pcts.push(parseFloat(pm[1].replace(',', '.')));
      }
      if (pcts.length === 0) continue;

      var recallLevel = null, couponLevel = null;
      for (var pi = 0; pi < pcts.length; pi++) {
        var pv = pcts[pi];
        if (pv >= 70 && pv <= 130 && recallLevel === null) recallLevel = pv;
        if (pv >= 0.5 && pv <= 35 && couponLevel === null) couponLevel = pv;
      }
      if (recallLevel === null && couponLevel === null) continue;

      if (seen[dateIso]) continue;
      seen[dateIso] = true;
      results.push({ date: dateIso, recallLevel: recallLevel, couponLevel: couponLevel });
    }

    results.sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; });
    return results;
  }

};

// ─────────────────────────────────────────────────────────────────────────────
// 2. EnhancedPatternLibrary
//    Collections de patterns regex et listes étendues pour tous types de
//    documents (FR / EN / DE).
// ─────────────────────────────────────────────────────────────────────────────

var EnhancedPatternLibrary = {

  // 60+ sous-jacents courants dans les term sheets FR/EU/US
  UNDERLYINGS_EXTENDED: [
    // Indices décrément (les plus longs en premier pour éviter partial match)
    'Euro iStoxx 50 Equal Weight Decrement 50',
    'Euro iStoxx 50 Equal Weight Decrement',
    'CAC 40 Decrement 100 Points',
    'CAC 40 Decrement 50 Points',
    'CAC 40 Décrement 50 Points',
    'CAC 40 Decrément 50 Points',
    // Indices sectoriels
    'iStoxx Europe Next Dividend',
    'iStoxx Europe Decrement',
    'Euronext France ESG',
    'Euro Stoxx Select Dividend',
    'STOXX Europe 600',
    'Euro Stoxx Banks',
    // Indices majeurs multi-mots
    'MSCI Emerging Markets',
    'EURO STOXX 50 Daily',
    'CAC Large 60',
    'Solactive',
    'MSCI World',
    'Euro Stoxx 50',
    'EURO STOXX 50',
    'EuroStoxx 50',
    'NASDAQ-100',
    'Nasdaq 100',
    'Russell 2000',
    'Hang Seng',
    'Nikkei 225',
    'FTSE 100',
    'SBF 120',
    'S&P 500',
    'S&P500',
    'IBEX 35',
    'DAX 40',
    'CAC 40',
    'CAC40',
    'Topix',
    'Dow Jones',
    'DAX',
    'SMI',
    // Actions françaises
    'TotalEnergies',
    'Pernod Ricard',
    'Capgemini',
    'Air Liquide',
    'Société Générale',
    'BNP Paribas',
    'Stellantis',
    'Carrefour',
    'Publicis',
    'Safran',
    'Legrand',
    'Michelin',
    'Renault',
    'Sanofi',
    'Vivendi',
    'Orange',
    'Hermès',
    'Airbus',
    'Total',
    'AXA',
    'LVMH',
    // Actions US
    'JPMorgan',
    'Berkshire',
    'Microsoft',
    'Alphabet',
    'NVIDIA',
    'Amazon',
    'Google',
    'Apple',
    'Tesla',
    'Meta',
    // Actions européennes hors France
    'AstraZeneca',
    'Volkswagen',
    'Unilever',
    'Novartis',
    'Allianz',
    'Siemens',
    'Nestlé',
    'Roche',
    'Shell',
    'HSBC',
    'BMW',
    'BASF',
    'UBS',
    'BP'
  ],

  // Patterns de détection de barrière / protection capital
  BARRIER_PATTERNS: [
    /protection\s+[àa]\s+([0-9]+(?:[.,][0-9]+)?)\s*%/ig,
    /plancher[^0-9%]{0,30}([0-9]+(?:[.,][0-9]+)?)\s*%/ig,
    /seuil\s+de\s+(?:perte|remboursement\s+final)[^0-9%]{0,50}([0-9]+(?:[.,][0-9]+)?)\s*%/ig,
    /niveau\s+de\s+protection[^0-9%]{0,50}([0-9]+(?:[.,][0-9]+)?)\s*%/ig,
    /capital[^0-9%]{0,30}floor[^0-9%]{0,20}([0-9]+(?:[.,][0-9]+)?)\s*%/ig,
    /knock-?in\s+(?:barrier|level)[^0-9%]{0,40}([0-9]+(?:[.,][0-9]+)?)\s*%/ig,
    /final\s+(?:barrier|redemption\s+barrier)[^0-9%]{0,40}([0-9]+(?:[.,][0-9]+)?)\s*%/ig,
    /at\s+([0-9]+(?:[.,][0-9]+)?)\s*%\s+of\s+the\s+(?:initial|strike)\s+(?:level|price)/ig,
    /([0-9]+(?:[.,][0-9]+)?)\s*%\s+of\s+the\s+(?:initial|strike)\s+(?:level|price)/ig,
    /barri[eè]re[^0-9%]{0,50}([0-9]+(?:[.,][0-9]+)?)\s*%/ig,
    /downside\s+barrier[^0-9%]{0,40}([0-9]+(?:[.,][0-9]+)?)\s*%/ig,
    /protection\s+(?:du\s+capital|en\s+capital)[^0-9%]{0,40}([0-9]+(?:[.,][0-9]+)?)\s*%/ig
  ],

  // Patterns de détection de coupon / rémunération
  COUPON_PATTERNS: [
    /r[ée]mun[ée]ration\s+conditionnelle[^0-9%]{0,50}([0-9]+(?:[.,][0-9]+)?)\s*%/ig,
    /taux\s+d['']int[ée]r[êe]t\s+conditionnel[^0-9%]{0,50}([0-9]+(?:[.,][0-9]+)?)\s*%/ig,
    /rendement\s+(?:annuel|brut|conditionnel)[^0-9%]{0,50}([0-9]+(?:[.,][0-9]+)?)\s*%/ig,
    /([0-9]+(?:[.,][0-9]+)?)\s*%\s+(?:p\.a\.|per\s+annum|par\s+an)\b/ig,
    /annual\s+(?:return|yield)[^0-9%]{0,50}([0-9]+(?:[.,][0-9]+)?)\s*%/ig,
    /memory\s+coupon[^0-9%]{0,50}([0-9]+(?:[.,][0-9]+)?)\s*%/ig,
    /coupon\s+(?:annuel|conditionnel|brut)[^0-9%]{0,50}([0-9]+(?:[.,][0-9]+)?)\s*%/ig,
    /taux\s+(?:du\s+coupon|d['']int[ée]r[êe]t)[^0-9%]{0,50}([0-9]+(?:[.,][0-9]+)?)\s*%/ig,
    /interest\s+rate[^0-9%]{0,50}([0-9]+(?:[.,][0-9]+)?)\s*%/ig,
    /contingent\s+coupon[^0-9%]{0,50}([0-9]+(?:[.,][0-9]+)?)\s*%/ig
  ],

  // Patterns de détection du nominal / valeur nominale
  NOMINAL_PATTERNS: [
    /(?:face\s+value|valeur\s+nominale|montant\s+unitaire|montant\s+minimal\s+de\s+souscription)[^0-9]{0,30}([0-9][0-9\s.,]{2,})/i,
    /(?:minimum\s+denomination|stated\s+principal\s+amount|denomination)[^0-9]{0,30}([0-9][0-9\s.,]{2,})/i,
    /(?:valeur\s+de\s+remboursement\s+unitaire|montant\s+de\s+r[ée]f[ée]rence)[^0-9]{0,30}([0-9][0-9\s.,]{2,})/i,
    /(?:montant\s+nominal|valeur\s+nominale|nominal)[^0-9]{0,20}([0-9][0-9\s.,]{2,})/i
  ],

  // Pattern contextuel : précédé de "sous-jacent", "indice", etc.
  buildUnderlyingPattern: function () {
    var sorted = this.UNDERLYINGS_EXTENDED.slice().sort(function (a, b) { return b.length - a.length; });
    var escaped = sorted.map(function (u) { return u.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); });
    var ctx = '(?:sous[- ]jacent|indice|underlying|valeur\\s+de\\s+r[ée]f[ée]rence|actif)[^\\n]{0,60}?';
    return new RegExp(ctx + '(' + escaped.join('|') + ')', 'ig');
  },

  // Pattern direct sans contexte, word boundary
  buildUnderlyingDirectPattern: function () {
    var sorted = this.UNDERLYINGS_EXTENDED.slice().sort(function (a, b) { return b.length - a.length; });
    var escaped = sorted.map(function (u) { return u.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); });
    return new RegExp('(?:^|[\\s("])(' + escaped.join('|') + ')(?=[\\s,;.)"]|$)', 'ig');
  },

  // Applique tous les BARRIER_PATTERNS, retourne les valeurs valides [30–100]
  extractAllBarrierCandidates: function (txt) {
    var results = [], i, m, v;
    for (i = 0; i < this.BARRIER_PATTERNS.length; i++) {
      var re = this.BARRIER_PATTERNS[i];
      re.lastIndex = 0;
      while ((m = re.exec(txt)) !== null) {
        v = parseFloat(m[1].replace(',', '.'));
        if (!isNaN(v) && v >= 30 && v <= 100) results.push(v);
      }
    }
    return results;
  },

  // Applique tous les COUPON_PATTERNS, retourne les valeurs valides [0.5–35]
  extractAllCouponCandidates: function (txt) {
    var results = [], i, m, v;
    for (i = 0; i < this.COUPON_PATTERNS.length; i++) {
      var re = this.COUPON_PATTERNS[i];
      re.lastIndex = 0;
      while ((m = re.exec(txt)) !== null) {
        v = parseFloat(m[1].replace(',', '.'));
        if (!isNaN(v) && v >= 0.5 && v <= 35) results.push(v);
      }
    }
    return results;
  },

  // Retourne la première valeur nominale valide trouvée
  extractNominalCandidate: function (txt) {
    for (var i = 0; i < this.NOMINAL_PATTERNS.length; i++) {
      var m = this.NOMINAL_PATTERNS[i].exec(txt);
      if (!m) continue;
      // Nettoie les séparateurs de milliers (1.000, 1 000, 1,000)
      var raw = m[1].replace(/\s/g, '');
      // Détecte séparateur de milliers : 3 chiffres après le séparateur
      var cleaned = raw.replace(/[,.](?=[0-9]{3}(?:[^0-9]|$))/g, '');
      // Remplace la virgule décimale restante
      cleaned = cleaned.replace(',', '.');
      var n = parseFloat(cleaned);
      if (!isNaN(n) && n > 0) return n;
    }
    return null;
  }

};

// ─────────────────────────────────────────────────────────────────────────────
// 3. UniversalProductClassifier
//    Mappe n'importe quelle description de produit structuré vers AC/CG/RC/LV
//    avec score de confiance. Couvre 20+ familles de produits FR/EN/DE.
// ─────────────────────────────────────────────────────────────────────────────

var UniversalProductClassifier = {

  PRODUCT_FAMILIES: [
    {
      code: 'AC', label: 'Autocall',
      variants: [
        'autocall athena', 'autocall napoleon', 'autocall express',
        'autocall step-down', 'callable autocall', 'snowball autocall',
        'phoenix memory', 'phoenix mémoire', 'phoenix à mémoire',
        'worst-of autocall', 'autocall phoenix',
        'coupon conditionnel à mémoire', 'coupon conditionnel',
        'remboursement anticipé automatique', 'remboursement anticipe automatique',
        'napoléon', 'napoleon', 'athena', 'phoenix', 'autocall'
      ],
      keywords: [
        /autocall/i, /phoenix/i, /ath[eé]na/i, /napol[eé]on/i,
        /remboursement\s+anticip[ée]/i, /step[- ]down/i, /snowball/i,
        /coupon\s+conditionnel/i, /callable.*note/i, /worst.of.*autocall/i,
        /m[ée]moire/i, /memory\s+coupon/i, /express\s+(?:autocall|certificate)/i
      ]
    },
    {
      code: 'CG', label: 'Capital Garanti',
      variants: [
        'capital garanti', 'capital protégé', 'capital protege',
        'protection totale du capital', 'protection integrale du capital',
        'airbag', 'participation garantie', 'bon à capital garanti',
        'note structurée garantie', 'emtn garanti', 'protected note',
        '100% du capital', 'protection du capital', 'principal protected'
      ],
      keywords: [
        /capital\s+garanti/i, /capital\s+prot[ée]g[ée]/i,
        /100\s*%\s*du\s+capital/i, /airbag/i, /principal\s+protected/i,
        /protection\s+totale/i, /garantie?\s+du\s+capital/i,
        /participation\s+garantie/i, /protected\s+note/i,
        /remboursement\s+[àa]\s+100\s*%/i
      ]
    },
    {
      code: 'RC', label: 'Reverse Convertible',
      variants: [
        'barrier reverse convertible', 'worst-of barrier reverse convertible',
        'worst-of reverse convertible', 'callable reverse convertible',
        'reverse convertible', 'brc', 'discount certificate',
        'yield note', 'yield enhanced note', 'callable yield note',
        'livraison physique', 'physical delivery', 'physical settlement'
      ],
      keywords: [
        /reverse\s+convertible/i, /\bBRC\b/, /barrier\s+reverse/i,
        /yield\s+(?:note|enhanced)/i, /discount\s+certificate/i,
        /livraison\s+physique/i, /physical\s+(?:delivery|settlement)/i,
        /worst.of.*reverse/i, /callable.*reverse/i
      ]
    },
    {
      code: 'LV', label: 'Levier',
      variants: [
        'turbo long', 'turbo short', 'turbo unlimited', 'unlimited turbo',
        'mini future', 'warrant call', 'warrant put', 'bonus cap',
        'bonus certificate', 'tracker certificate', 'tracker etf',
        'outperformance certificate', 'sprint certificate',
        'knock-out certificate', 'knock out certificate',
        'turbo', 'warrant', 'bonus', 'tracker', 'levier', 'leverage note'
      ],
      keywords: [
        /\bturbo\b/i, /\bwarrant\b/i, /\blevier\b/i, /\bleverage\b/i,
        /bonus\s+cap/i, /\btracker\b/i, /knock.out/i,
        /outperformance/i, /\bsprint\b/i, /unlimited\s+turbo/i,
        /mini\s+future/i, /certificat\s+(?:levier|leverage)/i
      ]
    }
  ],

  // Patterns rapides par code (chaque match = +1 point)
  QUICK_SCORES: {
    AC: [
      /autocall/i, /phoenix/i, /ath[eé]na/i, /napol[eé]on/i,
      /remboursement\s+anticip[ée]/i, /step[- ]down/i,
      /m[ée]moire/i, /memory\s+coupon/i, /coupon\s+conditionnel/i,
      /express\s+certificate/i
    ],
    CG: [
      /capital\s+garanti/i, /capital\s+prot[ée]g[ée]/i,
      /100\s*%\s*du\s+capital/i, /airbag/i, /principal\s+protected/i,
      /protection\s+totale/i, /participation\s+garantie/i,
      /remboursement\s+[àa]\s+100\s*%/i
    ],
    RC: [
      /reverse\s+convertible/i, /\bBRC\b/, /barrier\s+reverse/i,
      /yield\s+note/i, /discount\s+certificate/i,
      /livraison\s+physique/i, /physical\s+(?:delivery|settlement)/i
    ],
    LV: [
      /\bturbo\b/i, /\bwarrant\b/i, /\blevier\b/i, /\bleverage\b/i,
      /bonus\s+cap/i, /\btracker\b/i, /knock.out/i,
      /outperformance/i, /\bsprint\b/i, /mini\s+future/i
    ]
  },

  // Classifie un texte et/ou un hint vers AC/CG/RC/LV avec confiance
  classify: function (text, hint) {
    var src = ((text || '') + ' ' + (hint || ''))
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    var scores = { AC: 0, CG: 0, RC: 0, LV: 0 };
    var codeList = ['AC', 'CG', 'RC', 'LV'];
    var ci, pi, fi, vi;

    // Étape 1 : scores rapides
    for (ci = 0; ci < codeList.length; ci++) {
      var code = codeList[ci];
      var qp = this.QUICK_SCORES[code];
      for (pi = 0; pi < qp.length; pi++) {
        if (qp[pi].test(src)) scores[code]++;
      }
    }

    // Étape 2 : variant matching (longueur = signal de confiance)
    var bestVariant = null, bestVariantScore = 0, bestVariantCode = null;
    for (fi = 0; fi < this.PRODUCT_FAMILIES.length; fi++) {
      var fam = this.PRODUCT_FAMILIES[fi];
      for (vi = 0; vi < fam.variants.length; vi++) {
        var variant = fam.variants[vi];
        var normV = variant.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        if (src.includes(normV) && normV.length > bestVariantScore) {
          bestVariantScore = normV.length;
          bestVariant = variant;
          bestVariantCode = fam.code;
        }
      }
    }

    // Étape 3 : choix du code final
    var scoreWinnerCode = null, scoreWinnerVal = 0;
    for (ci = 0; ci < codeList.length; ci++) {
      if (scores[codeList[ci]] > scoreWinnerVal) {
        scoreWinnerVal = scores[codeList[ci]];
        scoreWinnerCode = codeList[ci];
      }
    }

    // Le variant long (>= 5 chars) l'emporte sur le score rapide
    var finalCode = (bestVariantScore >= 5 && bestVariantCode) ? bestVariantCode : scoreWinnerCode;

    if (!finalCode) {
      return { code: 'UNKNOWN', label: 'Inconnu', confidence: 0, scores: scores, matchedVariant: null };
    }

    var confidence = Math.min(100, scores[finalCode] * 20 + (bestVariantScore >= 5 ? 40 : 0));

    var finalLabel = finalCode;
    for (fi = 0; fi < this.PRODUCT_FAMILIES.length; fi++) {
      if (this.PRODUCT_FAMILIES[fi].code === finalCode) {
        finalLabel = this.PRODUCT_FAMILIES[fi].label;
        break;
      }
    }

    return {
      code: finalCode,
      label: finalLabel,
      confidence: confidence,
      scores: scores,
      matchedVariant: bestVariant
    };
  }

};

// ─────────────────────────────────────────────────────────────────────────────
// Exposition globale
// ─────────────────────────────────────────────────────────────────────────────

if (typeof window !== 'undefined') {
  window.SmartTableParser = SmartTableParser;
  window.EnhancedPatternLibrary = EnhancedPatternLibrary;
  window.UniversalProductClassifier = UniversalProductClassifier;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SmartTableParser: SmartTableParser, EnhancedPatternLibrary: EnhancedPatternLibrary, UniversalProductClassifier: UniversalProductClassifier };
}
