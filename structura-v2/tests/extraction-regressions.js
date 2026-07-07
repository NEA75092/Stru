const assert = require('node:assert/strict');

require('../src/issuer-registry.js');
require('../src/modules/structura-domain.js');

const {
  regexExtractFromText,
  normalizeSourceFields,
  classifyDocument,
  processFinalExtraction,
  buildStructuredProductIntelligence,
} = require('../src/app.js');

const cases = [];

function test(name, fn) {
  cases.push({ name, fn });
}

test('reject unrelated bank receipt', () => {
  const text = `
    BNP PARIBAS COLOMBES
    AUTOMATE : 036736
    TICKET : 0040
    DATE : 26/04/25
    DEPOT 1300 EUR
    POUR COMPTE DE CHEQUES 03519 903739
  `;
  const extracted = normalizeSourceFields(regexExtractFromText(text, { docType: 'BROCHURE' }));
  const classification = classifyDocument(text, extracted);
  assert.equal(classification.kind, 'UNRELATED');
  assert.equal(classification.eligible, false);
  assert.equal(extracted.barrierPct, null);
  assert.equal(extracted.recallPct, null);
  assert.equal(extracted.maturityDate, null);
});

test('load external issuer registry', () => {
  assert.ok(globalThis.STRUCTURA_ISSUER_REGISTRY);
  assert.ok(Array.isArray(globalThis.STRUCTURA_ISSUER_REGISTRY.issuers));
  assert.ok(globalThis.STRUCTURA_ISSUER_REGISTRY.issuers.length >= 17);
});

test('reject generic structured products brochure', () => {
  const text = `
    LES PRODUITS STRUCTURES
    Les Produits Structures constituent une alternative aux placements financiers traditionnels.
    DEFINITION
    Les principales familles de produits structures.
    Les principaux atouts
    Principaux risques et contraintes
    Societe Generale Private Banking
  `;
  const extracted = normalizeSourceFields(regexExtractFromText(text, { docType: 'BROCHURE' }));
  const classification = classifyDocument(text, extracted);
  assert.equal(classification.kind, 'GENERIC_STRUCTURED_PRODUCTS');
  assert.equal(classification.eligible, false);
});

test('extract product specific brochure fields without inventing defaults', () => {
  const text = `
    AUTOCALL BNP Paribas
    ISIN : FR00140016F3
    Emetteur : Morgan Stanley
    Sous-jacent : BNP Paribas
    Coupon annuel : 1,00% par an
    Barriere de protection : 50%
    Niveau de rappel : 100%
    Date d'echeance : 25/02/2028
    Nominal unitaire : 100 EUR
  `;
  const extracted = normalizeSourceFields(regexExtractFromText(text, { docType: 'BROCHURE' }));
  const classification = classifyDocument(text, extracted);
  assert.equal(classification.eligible, true);
  assert.equal(extracted.issuer, 'Morgan Stanley');
  assert.equal(extracted.underlying, 'BNP Paribas');
  assert.equal(extracted.couponPct, 1);
  assert.equal(extracted.barrierPct, 50);
  assert.equal(extracted.recallPct, 100);
  assert.equal(extracted.nominal, 100);
  assert.equal(extracted.maturityDate, '2028-02-25');
});

test('accept large decrement points when explicitly labelled', () => {
  const text = `
    AUTOCALL BNP Paribas
    ISIN : FR00140016F3
    Emetteur : Morgan Stanley
    Sous-jacent : BNP Paribas
    Coupon annuel : 1,00% par an
    Barriere de protection : 50%
    Niveau de rappel : 100%
    Date d'echeance : 25/02/2028
    Nominal unitaire : 100 EUR
    CAC 40 Decrement : 100 points
  `;
  const extracted = normalizeSourceFields(regexExtractFromText(text, { docType: 'BROCHURE' }));
  assert.equal(extracted.decrement, 100);
});

test('one single source does not manufacture high certainty', () => {
  const text = `
    AUTOCALL BNP Paribas
    ISIN : FR00140016F3
    Emetteur : Morgan Stanley
    Sous-jacent : BNP Paribas
    Coupon annuel : 1,00% par an
    Barriere de protection : 50%
    Niveau de rappel : 100%
    Date d'echeance : 25/02/2028
    Nominal unitaire : 100 EUR
  `;
  const extracted = normalizeSourceFields(regexExtractFromText(text, { docType: 'BROCHURE' }));
  const merged = processFinalExtraction([{ docType: 'BROCHURE', data: extracted }]).data;
  assert.ok(merged.extractionScore <= 75);
});

test('detect phoenix across issuer and family cues', () => {
  const text = `
    Document d'informations cles
    Phoenix Memoire EURO STOXX 50
    Emetteur : Societe Generale
    ISIN : FR00140016F3
    Sous-jacent : EURO STOXX 50
    Coupon memoire : 7,50% par an
    Barriere de protection : 60%
    Niveau de rappel : 100%
    Date d'echeance : 20/12/2029
    Nominal unitaire : 1000 EUR
  `;
  const extracted = normalizeSourceFields(regexExtractFromText(text, { docType: 'KID' }));
  assert.equal(extracted.type, 'Phoenix');
  assert.equal(extracted.issuer, 'Société Générale');
  assert.equal(extracted.underlying, 'EURO STOXX 50');
  assert.equal(extracted.couponPct, 7.5);
  assert.equal(extracted.barrierPct, 60);
});

test('detect reverse convertible from broad spec', () => {
  const text = `
    Marketing communication
    Reverse Convertible on Apple
    Issuer: Goldman Sachs
    ISIN : FR00140016F3
    Underlying : Apple
    Coupon : 12.00% p.a.
    Capital protection barrier : 65%
    Final maturity : 15/04/2028
    Minimum denomination : 1000 EUR
  `;
  const extracted = normalizeSourceFields(regexExtractFromText(text, { docType: 'BROCHURE' }));
  assert.equal(extracted.type, 'Reverse Convertible');
  assert.equal(extracted.issuer, 'Goldman Sachs');
  assert.equal(extracted.underlying, 'Apple');
  assert.equal(extracted.couponPct, 12);
  assert.equal(extracted.barrierPct, 65);
});

test('detect capital guaranteed product for non-default issuer', () => {
  const text = `
    Final Terms
    Capital Garanti S&P 500
    Issued by HSBC
    ISIN : FR00140016F3
    Underlying : S&P 500
    Protection du capital : 100%
    Date d'echeance : 15/04/2030
    Nominal unitaire : 1000 EUR
  `;
  const extracted = normalizeSourceFields(regexExtractFromText(text, { docType: 'TERM_SHEET' }));
  assert.equal(extracted.type, 'Capital Garanti');
  assert.equal(extracted.issuer, 'HSBC');
  assert.equal(extracted.underlying, 'S&P 500');
  assert.equal(extracted.nominal, 1000);
});

test('detect leverage family from turbo wording', () => {
  const text = `
    Final Terms
    Turbo Open End on NVIDIA
    Issuer: Barclays
    Underlying : NVIDIA
    Stop loss barrier : 85%
    Minimum denomination : 100 EUR
  `;
  const extracted = normalizeSourceFields(regexExtractFromText(text, { docType: 'TERM_SHEET' }));
  const classification = classifyDocument(text, extracted);
  assert.equal(extracted.type, 'Levier');
  assert.equal(extracted.issuer, 'Barclays');
  assert.equal(extracted.underlying, 'NVIDIA');
  assert.equal(classification.eligible, true);
});

test('extract CLN recurring call wording from uploaded document', () => {
  const text = `
    Final Terms
    CLN sur Airbus
    Emetteur : BNP Paribas
    ISIN : FR00140016F3
    Entité de référence : Airbus SE
    Coupon crédit : 6,00% par an
    Callable : Oui
    Période récurrente avec début et fin inclus.
    Chaque trimestre du 01/06/2027 au 01/06/2029 inclus, l'émetteur peut rembourser le produit par anticipation.
    À maturité, remboursement selon le taux de recouvrement fixé par l'ISDA en cas d'événement de crédit.
  `;
  const extracted = normalizeSourceFields(regexExtractFromText(text, { docType: 'TERM_SHEET' }));
  assert.equal(extracted.productFamily, 'cln');
  assert.equal(extracted.characteristics.referenceEntity, 'Airbus SE');
  assert.equal(extracted.characteristics.callable, true);
  assert.equal(extracted.characteristics.callMode, 'periode');
  assert.equal(extracted.characteristics.callStartDate, '01/06/2027');
  assert.equal(extracted.characteristics.callEndDate, '01/06/2029');
  assert.equal(extracted.characteristics.callFrequency, 'trimestriel');
});

test('extract Note coupon start separately from issuer call start', () => {
  const text = `
    Term Sheet
    Note à taux variable EURIBOR 6M
    Emetteur : HSBC
    ISIN : FR00140016F3
    Sous-jacent : EURIBOR 6M
    Coupon variable : EURIBOR 6M + 1,50%, flooré à 2,00% et cappé à 8,00%.
    Début coupon (Note) : 2
    Callable : Oui
    Début call émetteur (Note) : 4
    Fréquence call : annuelle
    Date d'echeance : 15/04/2030
  `;
  const extracted = normalizeSourceFields(regexExtractFromText(text, { docType: 'TERM_SHEET' }));
  assert.equal(extracted.productFamily, 'note');
  assert.equal(extracted.characteristics.rateType, 'variable');
  assert.equal(extracted.characteristics.couponStartPeriod, 2);
  assert.equal(extracted.characteristics.callable, true);
  assert.equal(extracted.characteristics.callStartPeriod, 4);
  assert.equal(extracted.characteristics.callFrequency, 'annuel');
  assert.equal(extracted.characteristics.noteUnderlying, 'EURIBOR 6M');
});

test('extract Bearish Taux chronology from MDL wording', () => {
  const text = `
    Term Sheet
    Bearish Taux Phoenix in fine sur CMS 10Y
    Emetteur : Morgan Stanley
    ISIN : FR00140016F3
    Sous-jacent : CMS 10Y
    Coupon annuel : 8,00% par an
    Fin de la 1ère année écoulée: enregistrement d'un coupon garanti de 2,00%.
    Rappel dès la 1ère période si le sous-jacent clôture sous 100%.
    À partir de la 2ème période: enregistrement d'un coupon de 2,00% si le sous-jacent clôture sous 95%.
    Barrière de rappel : 100%
    Barrière de distribution de coupon : 95%
  `;
  const extracted = normalizeSourceFields(regexExtractFromText(text, { docType: 'TERM_SHEET' }));
  assert.equal(extracted.productFamily, 'bearish_taux');
  assert.equal(extracted.characteristics.bearishSubType, 'phoenix');
  assert.equal(extracted.characteristics.bearishPhoenixVersion, 'in_fine');
  assert.equal(extracted.characteristics.bearishCouponGuaranteed, true);
  assert.equal(extracted.characteristics.bearishCouponGuaranteedAmount, 2);
  assert.equal(extracted.characteristics.bearishPeriodBeforeRedemption, 1);
  assert.equal(extracted.characteristics.bearishRecallBarrier, 100);
  assert.equal(extracted.characteristics.bearishCouponBarrier, 95);
});

test('build mechanism intelligence for phoenix memory worst-of structure', () => {
  const kid = `
    Document d'informations cles
    Phoenix Memoire Worst-of Luxe Europe
    Emetteur : Societe Generale
    ISIN : FR00140016F3
    Sous-jacent : panier worst-of LVMH / Hermes / Kering
    Coupon memoire trimestriel : 8,00% par an
    Barriere de protection europeenne : 60%
    Niveau de rappel automatique : 100%
    Date d'echeance : 20/12/2029
    Nominal unitaire : 1000 EUR
  `;
  const extracted = normalizeSourceFields(regexExtractFromText(kid, { docType: 'KID' }));
  const intelligence = buildStructuredProductIntelligence({
    rawDocuments: [{ docType: 'KID', text: kid }],
    merged: extracted,
    descriptor: { type: { label: extracted.type || 'Phoenix' } },
    consensus: { status: { consensusPct: 60, level: 'LOW' }, data: { riskScore: 4 } },
    alerts: []
  });
  assert.equal(intelligence.structure.id, 'worst_of');
  assert.equal(intelligence.frequency.id, 'quarterly');
  assert.equal(intelligence.couponStyle.id, 'memory');
  assert.match(intelligence.retailText, /coupon de 8%/i);
});

test('build mechanism intelligence flags physical settlement risk', () => {
  const termSheet = `
    Final Terms
    Reverse Convertible on Apple
    Issuer: Goldman Sachs
    ISIN : FR00140016F3
    Underlying : Apple
    Coupon : 12.00% p.a.
    Capital protection barrier : 65%
    Physical settlement may apply through delivery of shares
    Final maturity : 15/04/2028
    Minimum denomination : 1000 EUR
  `;
  const extracted = normalizeSourceFields(regexExtractFromText(termSheet, { docType: 'TERM_SHEET' }));
  const intelligence = buildStructuredProductIntelligence({
    rawDocuments: [{ docType: 'TERM_SHEET', text: termSheet }],
    merged: extracted,
    descriptor: { type: { label: extracted.type || 'Reverse Convertible' } },
    consensus: { status: { consensusPct: 60, level: 'LOW' }, data: {} },
    alerts: []
  });
  assert.equal(intelligence.settlement.id, 'physical');
  assert.ok(intelligence.watchpoints.some((item) => /livraison physique/i.test(item.message)));
});

test('build mechanism intelligence explains single-source brochure limitation', () => {
  const brochure = `
    AUTOCALL BNP Paribas
    ISIN : FR00140016F3
    Emetteur : Morgan Stanley
    Sous-jacent : BNP Paribas
    Coupon annuel : 1,00% par an
    Barriere de protection : 50%
    Niveau de rappel : 100%
    Date d'echeance : 25/02/2028
    Nominal unitaire : 100 EUR
  `;
  const extracted = normalizeSourceFields(regexExtractFromText(brochure, { docType: 'BROCHURE' }));
  const intelligence = buildStructuredProductIntelligence({
    rawDocuments: [{ docType: 'BROCHURE', text: brochure }],
    merged: { ...extracted, sources: 1, grade: 'LOW' },
    descriptor: { type: { label: extracted.type || 'Autocall' } },
    consensus: { status: { consensusPct: 60, level: 'LOW' }, data: {} },
    alerts: []
  });
  assert.equal(intelligence.coverage.id, 'commercial_only');
  assert.ok(intelligence.watchpoints.some((item) => /brochure seule/i.test(item.message)));
});

let failures = 0;
for (const { name, fn } of cases) {
  try {
    fn();
    console.log(`OK  ${name}`);
  } catch (err) {
    failures += 1;
    console.error(`KO  ${name}`);
    console.error(err.message);
  }
}

if (failures > 0) {
  process.exitCode = 1;
} else {
  console.log(`\n${cases.length} tests passed`);
}
