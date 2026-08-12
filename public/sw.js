// Volontairement minimal : aucune mise en cache, aucun mode hors-ligne.
// Chrome exige un vrai handler `fetch` (pas vide — il ignore désormais les
// handlers vides pour empêcher qu'on triche sur ce critère) pour proposer
// automatiquement "Ajouter à l'écran d'accueil". Celui-ci se contente de
// laisser passer chaque requête vers le réseau, sans rien intercepter ni
// stocker — l'app reste entièrement dépendante d'une connexion active,
// comme voulu.
self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});