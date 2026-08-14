"use client";

import { useLocaleStore } from "./store";
import fr, { type Messages } from "./messages/fr";
import en from "./messages/en";

// Renvoie l'objet de traduction complet pour un espace de nom donné, pas
// une fonction `t(clé)` à chemin textuel : les fautes de frappe et les
// clés manquantes se voient à la compilation (autocomplétion TypeScript
// incluse) plutôt qu'au runtime sous forme de texte manquant à l'écran.
//
// Le type de retour vise `Messages[K]` (la forme assouplie — mêmes clés,
// n'importe quel `string`), pas `(typeof fr)[K]` : ce dernier exigerait
// littéralement le texte français exact, ce que le dictionnaire anglais
// ne peut évidemment pas satisfaire.
export function useTranslations<K extends keyof typeof fr>(namespace: K): Messages[K] {
  const locale = useLocaleStore((s) => s.locale);

  // Ne PAS indexer un objet `{ fr, en }` par `locale` puis par `namespace`
  // (`dictionaries[locale][namespace]`) : avec deux dictionnaires devenus
  // aussi gros (toutes les pages), TypeScript doit distribuer l'indexation
  // générique sur l'union `typeof fr | typeof en`, ce qui déclenche
  // TS2590 ("union type too complex to represent"). En choisissant le
  // dictionnaire d'abord et en le castant vers un seul type (`typeof fr`)
  // avant d'indexer, il n'y a plus d'union à distribuer.
  const dict = (locale === "en" ? en : fr) as typeof fr;

  // Cast explicite : ce cast ne masque aucune vraie erreur de type — `en`
  // satisfait déjà `Messages` (vérifié dans en.ts via `satisfies Messages`)
  // — juste une limite de l'inférence sur ce genre d'indexation générique.
  return dict[namespace] as Messages[K];
}