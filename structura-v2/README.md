# Structura v2

Cockpit front-end pour produits structures avec :

- suivi portefeuille et alertes barriere
- onboarding documentaire par extraction locale
- consolidation multi-sources `Term Sheet` / `KID` / `Brochure`
- aide au pitch commercial
- exports CSV / Excel / PPTX / PDF

## Démarrage

### Prérequis

- Node.js 20+
- npm 10+
- Python 3.11+ pour le module `decrement_score.py`

### Installation

```bash
npm install
```

### Lancer en local

```bash
npm run dev
```

L’application est ensuite servie sur [http://localhost:3000](http://localhost:3000).

## Scripts

```bash
npm run dev
npm test
npm run test:py
npm run test:all
npm run lint
```

## Structure

- `index.html` : shell principal de l’application
- `src/app.js` : extraction documentaire, pitch, onboarding
- `src/modules/app-state.js` : état partagé, seed, persistance locale
- `src/modules/vl-registry.js` : lookup VL émetteur par ISIN (donnée banque, pas de calcul local)
- `src/modules/product-schema.js` : contrat produit canonique pour ajout manuel, extraction doc, futur Excel/API/LLM
- `src/modules/app-utils.js` : helpers UI (formatage, notifications)
- `src/modules/app-portfolio.js` : portefeuille, barrières, drawer
- `src/modules/app-calendar.js` : calendrier live produits
- `src/modules/app-analytics.js` : analytiques portefeuille
- `src/modules/app-scenarios.js` : simulations de stress
- `src/modules/decrement-engine.js` + `app-screener.js` : screener indices décrément
- `src/modules/extraction-engine.js` : moteur d’extraction PDF
- `decrement_score.py` : moteur Streamlit avancé du Decrement Score
- `tests/` : régressions extraction et smoke tests UI

## Tests couverts

- lookup VL émetteur par ISIN
- contrat canonique produit et conversion vers le portefeuille actuel
- classification et extraction documentaire
- normalisation des champs sources
- fusion et scoring de consolidation
- signaux d’intelligence produit
- rendu minimal dashboard
- navigation minimale entre vues
- calculs critiques du Decrement Score Python : Act/365, reconstruction décrément, recall efficiency

## Notes

- Le projet reste volontairement front-only.
- Les librairies document et export sont chargées par CDN dans `index.html`.
- Les données portefeuille sont persistées dans `localStorage`.
- Le screener JS est une vue front statique pour l’interface navigateur. Le moteur `decrement_score.py` porte les calculs avancés et les données de marché ; l’import live reste volontairement découplé.
- L’import/extraction de données doit produire ou être converti vers le contrat `StructuraProductSchema`; cette couche reste indépendante du futur choix technique (Excel, API bancaire, LLM, backend).
