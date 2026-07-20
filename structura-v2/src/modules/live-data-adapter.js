/**
 * STRUCTURA — Point d'entrée unique pour les données de marché/VL live
 * ======================================================================
 * Contrat stable : le jour où un flux réel (VL émetteur, historique
 * sous-jacent, historique VL) est branché, SEUL ce fichier change.
 * Aucun composant d'affichage (app-portfolio.js, app-dashboard.js...)
 * ne doit jamais appeler vl-registry.js ou buildSyntheticLevelSeries
 * directement — ils appellent StructuraLiveData, qui décide en interne
 * s'il délègue à une donnée réelle ou à un fallback simulé.
 *
 * Pour brancher une vraie API : réimplémenter les 4 fonctions
 * ci-dessous avec la MÊME signature (mêmes paramètres, même forme de
 * retour). Rien d'autre ne bouge.
 *
 *   getVL(isin)                 → Promise<{ vlPct, asOf, source } | null>
 *   getUnderlyingHistory(product) → Promise<[{ date, level }] | null>
 *     Retourne null si aucun historique réel n'est disponible pour ce
 *     produit — c'est à l'APPELANT (buildPriceBarrierChart) de faire le
 *     fallback vers buildSyntheticLevelSeries (avec son disclaimer),
 *     jamais l'inverse : ne jamais fabriquer une fausse variation ici.
 *   getVLHistory(product)       → Promise<[{ date, level }] | null>
 *     Même logique pour l'historique de VL — toujours null aujourd'hui
 *     (aucun flux VL historique n'existe, voir vl-registry.js).
 *   isLive()                    → boolean
 *     true si au moins une source ci-dessus est branchée sur un vrai
 *     flux plutôt qu'un mock/fallback — sert à afficher ou masquer les
 *     disclaimers "simulation illustrative" dynamiquement plutôt qu'en
 *     dur dans le HTML/JS des composants.
 *
 * Implémentation actuelle : mock. getVL délègue tel quel à
 * vl-registry.js (comportement inchangé) ; les deux historiques
 * retournent toujours null ; isLive() retourne false.
 */
(function initStructuraLiveData(root, factory) {
  const api = factory(root);
  root.StructuraLiveData = api;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(
  typeof globalThis !== "undefined" ? globalThis : this,
  function createStructuraLiveData(root) {
    async function getVL(isin) {
      const registry = root.StructuraVlRegistry;
      if (!registry) return null;
      const issuerVl = registry.lookupIssuerVl(isin);
      if (!issuerVl) return null;
      return {
        vlPct: issuerVl.vlPct,
        asOf: issuerVl.asOf || null,
        source: issuerVl.source || null,
      };
    }

    async function getUnderlyingHistory(_product) {
      // Aucun flux de marché historique branché — le fallback simulé
      // (buildSyntheticLevelSeries, avec disclaimer) est à la charge
      // de l'appelant.
      return null;
    }

    async function getVLHistory(_product) {
      // Aucun flux VL historique branché (vl-registry.js n'expose
      // qu'un point ponctuel) — pas de simulation ici : seul le
      // sous-jacent a le droit à une courbe fabriquée.
      return null;
    }

    function isLive() {
      return false;
    }

    return { getVL, getUnderlyingHistory, getVLHistory, isLive };
  },
);
