globalThis.STRUCTURA_ISSUER_REGISTRY = {
  version: '2026-05-26',
  issuers: [
    {
      id: 'BNP',
      label: 'BNP Paribas',
      publicSourceStatus: 'PUBLIC_PORTAL',
      aliases: [/BNP(?:\s+Paribas)?/i, /BNP\s+Paribas\s+Issuance/i],
      officialSources: [
        { kind: 'KID portal', url: 'https://kid.bnpparibas.com/' },
        { kind: 'product pages', url: 'https://derivate.bnpparibas.com/product-details/DE000PN99BH1/' },
        { kind: 'wealth management overview', url: 'https://privatebanking.bnpparibas.com/ch/en/your-goals/protect-and-grow-your-wealth/benefit-from-a-qualitative-investment-universe/target-traditional-and-bespoke-asset-classes/structured-products-at-bnp-paribas-wealth-management.html' }
      ],
      fieldExtractors: {
        underlying: [/(?:Sous-jacent|Underlying|Valeur de reference)\s*[:\-]?\s*([^\n\r.;|]{2,120})/i],
        coupon: [/(?:Coupon(?: annuel)?|Rendement)\D{0,40}(\d{1,2}(?:[.,]\d+)?)\s*%/i],
        barrier: [/(?:Barri[èe]re(?: de protection)?|Protection du capital)\D{0,50}(\d{1,3}(?:[.,]\d+)?)\s*%/i],
        recall: [/(?:Niveau de rappel|Seuil de remboursement anticip[ée])\D{0,40}(\d{1,3}(?:[.,]\d+)?)\s*%/i],
        maturity: [/(?:Date d['’]echeance|Date d['’]échéance|Maturit[ée])\D{0,20}([0-9]{2}[\/.-][0-9]{2}[\/.-]20[0-9]{2})/i],
        nominal: [/(?:Nominal(?: unitaire)?|D[ée]nomination)\D{0,24}([0-9][0-9\s.,]{1,})/i]
      }
    },
    {
      id: 'SG',
      label: 'Société Générale',
      publicSourceStatus: 'PUBLIC_PORTAL',
      aliases: [/Soci[ée]t[ée]\s+G[ée]n[ée]rale/i, /\bSG\b(?!\s*Private Banking)/i],
      officialSources: [
        { kind: 'product pages', url: 'https://www.sg-zertifikate.de/product-details/fe1e3g' },
        { kind: 'structured notes prospectus', url: 'https://www.sg-zertifikate.de/SiteContent/1/1/2/106/093/SGE_SN_Structured_Notes_2022-06-23.pdf' },
        { kind: 'PRIIPs information', url: 'https://wholesale.banking.societegenerale.com/fr/compliance-regulatory-information/market-regulation/priips/' }
      ],
      fieldExtractors: {
        underlying: [/(?:Basiswert|Sous-jacent)\s*[:\-]?\s*([^\n\r.;|]{2,120})/i],
        type: [/(?:Produktart|Type de produit)\s*[:\-]?\s*([^\n\r.;|]{2,90})/i],
        barrier: [/(?:Knock-Out-Barriere|Barri[èe]re(?: de protection)?)\D{0,40}(\d{1,3}(?:[.,]\d+)?)\s*(?:%|EUR|Pkt)/i],
        maturity: [/(?:F[äa]lligkeitstag|F[äa]lligkeit|Date d['’]echeance)\D{0,20}([0-9]{2}[\/.-][0-9]{2}[\/.-]20[0-9]{2})/i],
        nominal: [/(?:Bezugsverh[äa]ltnis|Nominal(?: unitaire)?)\D{0,24}([0-9][0-9\s.,:]{1,})/i]
      }
    },
    {
      id: 'MS',
      label: 'Morgan Stanley',
      publicSourceStatus: 'PUBLIC_PORTAL',
      aliases: [/Morgan\s+Stanley/i],
      officialSources: [
        { kind: 'structured investments portal', url: 'https://www.morganstanley.com/structuredinvestments/' },
        { kind: 'EU prospectus portal', url: 'https://sp.morganstanley.com/eu/prospectus/' },
        { kind: 'sample preliminary pricing supplement', url: 'https://www.morganstanley.com/structuredinvestments/docs/prospectus/prelim/ProspectusRed61775MPN0.pdf' }
      ],
      fieldExtractors: {
        underlying: [/(?:Underlying(?: indices?| shares?)?|Underlying)\s*[:\-]?\s*([^\n\r.;|]{2,140})/i],
        coupon: [/(?:contingent monthly coupon|coupon|interest rate)\D{0,40}(\d{1,2}(?:[.,]\d+)?)\s*%/i],
        barrier: [/(?:downside threshold value|buffer amount|barrier)\D{0,50}(\d{1,3}(?:[.,]\d+)?)\s*%/i],
        maturity: [/(?:maturity date|stated maturity date)\D{0,20}([A-Za-z]+\s+\d{1,2},\s+20\d{2}|\d{2}[\/.-]\d{2}[\/.-]20\d{2})/i],
        nominal: [/(?:stated principal amount|principal amount)\D{0,24}([0-9][0-9\s,.$]{1,})/i]
      }
    },
    {
      id: 'JPM',
      label: 'JP Morgan',
      publicSourceStatus: 'PUBLIC_PORTAL',
      aliases: [/JP\s*Morgan/i, /JPMorgan/i, /J\.P\.\s*Morgan/i],
      officialSources: [
        { kind: 'structured investments portal', url: 'https://si.jpmorgan.com/spweb/' },
        { kind: 'risk information', url: 'https://www.jpmorgan.com/disclosures/im_sp' },
        { kind: 'structured products programme prospectus', url: 'https://sp.jpmorgan.com/spweb/content/download/742857' }
      ],
      fieldExtractors: {
        underlying: [/(?:Underlying(?: asset| index)?|Reference Asset)\s*[:\-]?\s*([^\n\r.;|]{2,140})/i],
        coupon: [/(?:coupon|interest)\D{0,40}(\d{1,2}(?:[.,]\d+)?)\s*%/i],
        barrier: [/(?:buffer|downside threshold|barrier)\D{0,50}(\d{1,3}(?:[.,]\d+)?)\s*%/i],
        maturity: [/(?:maturity date|redemption date)\D{0,20}([A-Za-z]+\s+\d{1,2},\s+20\d{2}|\d{2}[\/.-]\d{2}[\/.-]20\d{2})/i],
        nominal: [/(?:principal amount|denomination)\D{0,24}([0-9][0-9\s,.$]{1,})/i]
      }
    },
    {
      id: 'GS',
      label: 'Goldman Sachs',
      publicSourceStatus: 'LIMITED_PUBLIC_PORTAL',
      aliases: [/Goldman\s+Sachs/i, /\bGS\s+Finance\b/i],
      officialSources: [
        { kind: 'institutional solutions overview', url: 'https://www.goldmansachs.com/what-we-do/ficc-and-equities/custody-solutions/our-solutions/institutional-grade-solutions' },
        { kind: 'corporate site', url: 'https://www.goldmansachs.com/' }
      ],
      fieldExtractors: {
        underlying: [/(?:Underlying|Reference Asset|Reference Share)\s*[:\-]?\s*([^\n\r.;|]{2,140})/i],
        coupon: [/(?:coupon|interest|yield)\D{0,40}(\d{1,2}(?:[.,]\d+)?)\s*%/i],
        barrier: [/(?:buffer|downside threshold|barrier)\D{0,50}(\d{1,3}(?:[.,]\d+)?)\s*%/i],
        recall: [/(?:early redemption|automatic redemption|trigger level)\D{0,40}(\d{1,3}(?:[.,]\d+)?)\s*%/i],
        maturity: [/(?:maturity date|redemption date)\D{0,20}([A-Za-z]+\s+\d{1,2},\s+20\d{2}|\d{2}[\/.-]\d{2}[\/.-]20\d{2})/i],
        nominal: [/(?:principal amount|denomination|minimum denomination)\D{0,24}([0-9][0-9\s,.$]{1,})/i]
      }
    },
    {
      id: 'DB',
      label: 'Deutsche Bank',
      publicSourceStatus: 'PUBLIC_PORTAL',
      aliases: [/Deutsche\s+Bank/i],
      officialSources: [
        { kind: 'x-markets KID', url: 'https://www.xmarkets.db.com/DE/EN/KID/DE000DB9U8P4' },
        { kind: 'base prospectus', url: 'https://www.xmarkets.db.com/DE/ENG/showpage.aspx?pageID=574' },
        { kind: 'prospectus overview', url: 'https://www.xmarkets.db.com/NL/BaseProspectus' }
      ],
      fieldExtractors: {
        underlying: [/(?:Basiswert|Underlying)\s*[:\-]?\s*([^\n\r.;|]{2,120})/i],
        type: [/(?:Product name|Produktart|Produkttyp)\s*[:\-]?\s*([^\n\r.;|]{2,120})/i],
        barrier: [/(?:Barriere|Barrier)\D{0,50}(\d{1,3}(?:[.,]\d+)?)\s*%/i],
        coupon: [/(?:coupon|interest|Zins)\D{0,40}(\d{1,2}(?:[.,]\d+)?)\s*%/i],
        maturity: [/(?:Maturity|F[äa]lligkeit)\D{0,20}([A-Za-z]+\s+\d{1,2},\s+20\d{2}|\d{2}[\/.-]\d{2}[\/.-]20\d{2})/i],
        nominal: [/(?:Nominal|Denomination)\D{0,24}([0-9][0-9\s,.$]{1,})/i]
      }
    },
    {
      id: 'BARC',
      label: 'Barclays',
      publicSourceStatus: 'LIMITED_PUBLIC_PORTAL',
      aliases: [/Barclays/i],
      officialSources: [
        { kind: 'corporate site', url: 'https://home.barclays/' },
        { kind: 'investor relations filings', url: 'https://investorrelations.barclays.com/' }
      ],
      fieldExtractors: {
        underlying: [/(?:Underlying|Reference Asset|Underlier)\s*[:\-]?\s*([^\n\r.;|]{2,160})/i],
        type: [/(?:Product Type|Title of Securities)\s*[:\-]?\s*([^\n\r.;|]{2,140})/i],
        coupon: [/(?:coupon|interest|digital return)\D{0,40}(\d{1,2}(?:[.,]\d+)?)\s*%/i],
        barrier: [/(?:barrier|buffer value|buffer|downside threshold)\D{0,50}(\d{1,3}(?:[.,]\d+)?)\s*%/i],
        maturity: [/(?:Maturity Date|Stated Maturity Date)\D{0,20}([A-Za-z]+\s+\d{1,2},\s+20\d{2}|\d{2}[\/.-]\d{2}[\/.-]20\d{2})/i],
        nominal: [/(?:principal amount|denomination|minimum denomination)\D{0,24}([0-9][0-9\s,.$]{1,})/i]
      }
    },
    {
      id: 'HSBC',
      label: 'HSBC',
      publicSourceStatus: 'LIMITED_PUBLIC_PORTAL',
      aliases: [/HSBC/i],
      officialSources: [
        { kind: 'structured products overview', url: 'https://www.us.hsbc.com/investments/products/structured-products/' },
        { kind: 'PRIIPs guide', url: 'https://www.privatebanking.hsbc.com/content/dam/privatebanking/gpb/about-us/mifid/mifiid-guide-priips.pdf' }
      ],
      fieldExtractors: {
        underlying: [/(?:Underlying|Reference Asset)\s*[:\-]?\s*([^\n\r.;|]{2,140})/i],
        coupon: [/(?:coupon|yield)\D{0,40}(\d{1,2}(?:[.,]\d+)?)\s*%/i],
        barrier: [/(?:barrier|protection)\D{0,40}(\d{1,3}(?:[.,]\d+)?)\s*%/i],
        maturity: [/(?:maturity date|redemption date)\D{0,20}([A-Za-z]+\s+\d{1,2},\s+20\d{2}|\d{2}[\/.-]\d{2}[\/.-]20\d{2})/i],
        nominal: [/(?:denomination|principal amount)\D{0,24}([0-9][0-9\s,.$]{1,})/i]
      }
    },
    {
      id: 'NATIXIS',
      label: 'Natixis',
      publicSourceStatus: 'PUBLIC_PORTAL',
      aliases: [/Natixis/i, /Natixis Structured Issuance/i],
      officialSources: [
        { kind: 'equity derivatives portal', url: 'https://equityderivatives.natixis.com/en/' },
        { kind: 'base prospectus', url: 'https://equityderivatives.natixis.com/wp-content/uploads/EMTN-2025-BASE-PROSPECTUS.pdf' },
        { kind: 'issuer financials', url: 'https://cib.natixis.com/DevInet.PIMS.ComplianceTool.Web/api/ProspectusPublicNg/DownloadDocument/264/ISSUER_FINANCIAL_SEARCH' }
      ],
      fieldExtractors: {
        underlying: [/(?:Underlying|Reference Asset|Sous-jacent)\s*[:\-]?\s*([^\n\r.;|]{2,160})/i],
        coupon: [/(?:coupon|yield|rendement)\D{0,40}(\d{1,2}(?:[.,]\d+)?)\s*%/i],
        barrier: [/(?:barri[èe]re|buffer|downside threshold|protection)\D{0,50}(\d{1,3}(?:[.,]\d+)?)\s*%/i],
        recall: [/(?:rappel|remboursement anticip[ée]|early redemption)\D{0,40}(\d{1,3}(?:[.,]\d+)?)\s*%/i],
        maturity: [/(?:Date d['’]échéance|Maturity Date|Redemption Date)\D{0,20}([A-Za-z]+\s+\d{1,2},\s+20\d{2}|\d{2}[\/.-]\d{2}[\/.-]20\d{2})/i],
        nominal: [/(?:Nominal(?: unitaire)?|Denomination|Principal Amount)\D{0,24}([0-9][0-9\s,.$€]{1,})/i]
      }
    },
    {
      id: 'CACIB',
      label: 'Crédit Agricole CIB',
      publicSourceStatus: 'PUBLIC_PORTAL',
      aliases: [/Cr[ée]dit\s+Agricole\s+CIB/i, /Credit\s+Agricole\s+CIB/i],
      officialSources: [
        { kind: 'structured products offering', url: 'https://www.ca-cib.com/fr/expertises/solutions-pour-les-marches-de-capitaux/produits-structures' },
        { kind: 'capital markets solutions', url: 'https://www.ca-cib.com/en/expertise/providing-capital-markets-solutions' }
      ],
      fieldExtractors: {
        underlying: [/(?:Sous-jacent|Underlying|Reference Asset)\s*[:\-]?\s*([^\n\r.;|]{2,140})/i],
        coupon: [/(?:coupon|rendement|yield)\D{0,40}(\d{1,2}(?:[.,]\d+)?)\s*%/i],
        barrier: [/(?:barri[èe]re|protection du capital|buffer)\D{0,50}(\d{1,3}(?:[.,]\d+)?)\s*%/i],
        recall: [/(?:rappel|remboursement anticip[ée]|autocall)\D{0,40}(\d{1,3}(?:[.,]\d+)?)\s*%/i],
        maturity: [/(?:Date d['’]échéance|Maturity Date|Maturit[ée])\D{0,20}([A-Za-z]+\s+\d{1,2},\s+20\d{2}|\d{2}[\/.-]\d{2}[\/.-]20\d{2})/i],
        nominal: [/(?:Nominal(?: unitaire)?|Denomination)\D{0,24}([0-9][0-9\s,.$€]{1,})/i]
      }
    },
    {
      id: 'CITI',
      label: 'Citigroup',
      publicSourceStatus: 'LIMITED_PUBLIC_PORTAL',
      aliases: [/Citigroup/i, /\bCiti\b/i],
      officialSources: [
        { kind: 'structured products value methodology', url: 'https://www.citi.com/icg/global_markets/docs/FCA_Consumer_Duty_Structured_Products_Value_Assessment_Methodology_Summary.pdf' },
        { kind: 'markets risk disclosure', url: 'https://www.citi.com/icg/global_markets/docs/Markets_Services_and_Banking_Risk_Disclosure-Sept2025.pdf' }
      ],
      fieldExtractors: {
        underlying: [/(?:Underlying|Reference Asset|Underlier)\s*[:\-]?\s*([^\n\r.;|]{2,160})/i],
        coupon: [/(?:coupon|interest|yield)\D{0,40}(\d{1,2}(?:[.,]\d+)?)\s*%/i],
        barrier: [/(?:buffer|barrier|protection)\D{0,50}(\d{1,3}(?:[.,]\d+)?)\s*%/i],
        recall: [/(?:automatic redemption|early redemption|call feature)\D{0,40}(\d{1,3}(?:[.,]\d+)?)\s*%/i],
        maturity: [/(?:Maturity Date|Redemption Date)\D{0,20}([A-Za-z]+\s+\d{1,2},\s+20\d{2}|\d{2}[\/.-]\d{2}[\/.-]20\d{2})/i],
        nominal: [/(?:Principal Amount|Denomination)\D{0,24}([0-9][0-9\s,.$]{1,})/i]
      }
    },
    {
      id: 'UBS',
      label: 'UBS',
      publicSourceStatus: 'PUBLIC_DOCUMENT_LIBRARY',
      aliases: [/\bUBS\b/i],
      officialSources: [
        { kind: 'product document library', url: 'https://www.ubs.com/global/en/wealthmanagement/regulatory/product-document-library.html' },
        { kind: 'structured product advisor', url: 'https://microsites.ubs.com/spfinder/en/products-overview.html' },
        { kind: 'sample product brochure', url: 'https://www.ubs.com/global/en/wealthmanagement/regulatory/product-document-library/_jcr_content/root/contentarea/mainpar/toplevelgrid/col_1/table.0508074329.file/dGFibGVUZXh0PS9jb250ZW50L2RhbS9hc3NldHMvd20vZ2xvYmFsL2RvYy9lcXVpdHktbGlua2VkLW5vdGVzLXByb2R1Y3QucGRm/equity-linked-notes-product.pdf' }
      ],
      fieldExtractors: {
        underlying: [/(?:Underlying|Basiswert)\s*[:\-]?\s*([^\n\r.;|]{2,140})/i],
        type: [/(?:Product Type|Product Sub type)\s*[:\-]?\s*([^\n\r.;|]{2,120})/i],
        coupon: [/(?:coupon|yield)\D{0,40}(\d{1,2}(?:[.,]\d+)?)\s*%/i],
        barrier: [/(?:KI Barrier|Barrier|Knock-In barrier)\D{0,40}(\d{1,3}(?:[.,]\d+)?)\s*%/i],
        maturity: [/(?:Redemption Date|Maturity Date)\D{0,20}([A-Za-z]+\s+\d{1,2},\s+20\d{2}|\d{2}[\/.-]\d{2}[\/.-]20\d{2})/i],
        nominal: [/(?:Denomination|Nominal Value)\D{0,24}([0-9][0-9\s,.$]{1,})/i]
      }
    },
    {
      id: 'VONTOBEL',
      label: 'Vontobel',
      publicSourceStatus: 'PUBLIC_PORTAL',
      aliases: [/Vontobel/i],
      officialSources: [
        { kind: 'markets portal', url: 'https://markets.vontobel.com/' },
        { kind: 'structured product guide', url: 'https://markets.vontobel.com/structured-product-guide' },
        { kind: 'multi-issuer platform', url: 'https://www.vontobel.com/en-de/institutions-and-intermediaries/structured-solutions/deritrade/' }
      ],
      fieldExtractors: {
        underlying: [/(?:Underlying|Basiswert)\s*[:\-]?\s*([^\n\r.;|]{2,120})/i],
        type: [/(?:Product type|Produktart)\s*[:\-]?\s*([^\n\r.;|]{2,90})/i],
        barrier: [/(?:Barrier|Barriere)\D{0,40}(\d{1,3}(?:[.,]\d+)?)\s*%/i],
        coupon: [/(?:coupon|yield|Rendite)\D{0,40}(\d{1,2}(?:[.,]\d+)?)\s*%/i],
        maturity: [/(?:Maturity|Laufzeit|F[äa]lligkeit)\D{0,20}([A-Za-z]+\s+\d{1,2},\s+20\d{2}|\d{2}[\/.-]\d{2}[\/.-]20\d{2})/i]
      }
    },
    {
      id: 'UNICREDIT',
      label: 'UniCredit',
      publicSourceStatus: 'PUBLIC_PORTAL',
      aliases: [/UniCredit/i],
      officialSources: [
        { kind: 'covered warrants and certificates', url: 'https://www.unicreditgroup.eu/en/investors/debt-investors/funding-programmes-and-prospectuses/covered-warrant.html' },
        { kind: 'debt issuance programmes', url: 'https://www.unicreditgroup.eu/en/investors/debt-investors/funding-programmes-and-prospectuses/debt-issuance-programs.html' },
        { kind: 'institutional investors overview', url: 'https://www.unicreditgroup.eu/en/business/client-solutions/institutional-investors.html' }
      ],
      fieldExtractors: {
        underlying: [/(?:Underlying|Reference Asset|Basiswert)\s*[:\-]?\s*([^\n\r.;|]{2,160})/i],
        type: [/(?:Product Type|Produktart)\s*[:\-]?\s*([^\n\r.;|]{2,120})/i],
        coupon: [/(?:coupon|interest|yield)\D{0,40}(\d{1,2}(?:[.,]\d+)?)\s*%/i],
        barrier: [/(?:barrier|buffer|barriere)\D{0,50}(\d{1,3}(?:[.,]\d+)?)\s*%/i],
        maturity: [/(?:Maturity Date|Redemption Date|F[äa]lligkeit)\D{0,20}([A-Za-z]+\s+\d{1,2},\s+20\d{2}|\d{2}[\/.-]\d{2}[\/.-]20\d{2})/i],
        nominal: [/(?:Principal Amount|Denomination|Nominal)\D{0,24}([0-9][0-9\s,.$€]{1,})/i]
      }
    },
    {
      id: 'COMMERZ',
      label: 'Commerzbank',
      publicSourceStatus: 'PUBLIC_PORTAL',
      aliases: [/Commerzbank/i],
      officialSources: [
        { kind: 'capital investment overview', url: 'https://www.commerzbank.com/investment-riskmanagement/products/investment-management/capital-investment/' },
        { kind: 'structured derivatives overview', url: 'https://www.commerzbank.com/portal/en/cb/de/firmenkunden/offers/produkte-online/strukturierte-derivate/strukturierte_derivate.html' }
      ],
      fieldExtractors: {
        underlying: [/(?:Underlying|Basiswert|Reference Asset)\s*[:\-]?\s*([^\n\r.;|]{2,160})/i],
        type: [/(?:Product Type|Produktart)\s*[:\-]?\s*([^\n\r.;|]{2,120})/i],
        coupon: [/(?:coupon|yield|zins)\D{0,40}(\d{1,2}(?:[.,]\d+)?)\s*%/i],
        barrier: [/(?:barrier|barriere|buffer)\D{0,50}(\d{1,3}(?:[.,]\d+)?)\s*%/i],
        maturity: [/(?:Maturity|F[äa]lligkeit)\D{0,20}([A-Za-z]+\s+\d{1,2},\s+20\d{2}|\d{2}[\/.-]\d{2}[\/.-]20\d{2})/i],
        nominal: [/(?:Nominal|Denomination)\D{0,24}([0-9][0-9\s,.$€]{1,})/i]
      }
    },
    {
      id: 'LEONTEQ',
      label: 'Leonteq',
      publicSourceStatus: 'PUBLIC_PORTAL',
      aliases: [/Leonteq/i],
      officialSources: [
        { kind: 'structured products portal', url: 'https://structuredproducts-ch.leonteq.com/services/know-how?language_id=1' },
        { kind: 'KID by ISIN', url: 'https://structuredproducts-ch.leonteq.com/isin/ch1409711939/kid/en' },
        { kind: 'product universe overview', url: 'https://www.leonteq.com/our-solutions/products/for-issuers?language_id=1' }
      ],
      fieldExtractors: {
        underlying: [/(?:Underlying|Basiswert)\s*[:\-]?\s*([^\n\r.;|]{2,140})/i],
        type: [/(?:Product category|Product type|Produktart)\s*[:\-]?\s*([^\n\r.;|]{2,120})/i],
        barrier: [/(?:Barrier|Barriere)\D{0,40}(\d{1,3}(?:[.,]\d+)?)\s*%/i],
        coupon: [/(?:coupon|Rendite)\D{0,40}(\d{1,2}(?:[.,]\d+)?)\s*%/i],
        maturity: [/(?:Redemption Date|Maturity|F[äa]lligkeit)\D{0,20}([A-Za-z]+\s+\d{1,2},\s+20\d{2}|\d{2}[\/.-]\d{2}[\/.-]20\d{2})/i],
        nominal: [/(?:Denomination|Nominal)\D{0,24}([0-9][0-9\s,.$]{1,})/i]
      }
    },
    {
      id: 'BOFA',
      label: 'Bank of America',
      publicSourceStatus: 'PUBLIC_FILINGS',
      aliases: [/Bank\s+of\s+America/i, /Merrill\s+Lynch/i, /\bMLPF&S\b/i],
      officialSources: [
        { kind: 'Merrill overview', url: 'https://www.ml.com/' },
        { kind: 'note prospectus filing', url: 'https://investor.bankofamerica.com/regulatory-and-other-filings/all-sec-filings/content/0001918704-25-007036/bofa-3pd9004_424b2.htm?wcmmode=disabled' },
        { kind: 'product governance summary', url: 'https://business.bofa.com/content/dam/boamlimages/documents/articles/ID17_1174/BofAML_Product_Governance_Summary_Information_Version_1_January_2018.pdf' }
      ],
      fieldExtractors: {
        underlying: [/(?:Underlying|Underlier|Reference Asset)\s*[:\-]?\s*([^\n\r.;|]{2,160})/i],
        type: [/(?:Title of the Notes|Type of Note)\s*[:\-]?\s*([^\n\r.;|]{2,140})/i],
        coupon: [/(?:coupon|interest|return)\D{0,40}(\d{1,2}(?:[.,]\d+)?)\s*%/i],
        barrier: [/(?:barrier|buffer value|threshold value)\D{0,50}(\d{1,3}(?:[.,]\d+)?)\s*%/i],
        maturity: [/(?:Maturity Date|Stated Maturity Date)\D{0,20}([A-Za-z]+\s+\d{1,2},\s+20\d{2}|\d{2}[\/.-]\d{2}[\/.-]20\d{2})/i],
        nominal: [/(?:Principal Amount|Denomination)\D{0,24}([0-9][0-9\s,.$]{1,})/i]
      }
    }
  ]
};
