import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Locale = "fr" | "en";

type LocaleState = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
};

// Persisté en localStorage plutôt que dans l'URL (pas de segment [locale] à
// gérer dans le routeur) : plus simple à poser sur une app déjà construite
// en une seule langue, au prix de ne pas avoir d'URL par langue. Acceptable
// ici — la majorité des pages sont derrière connexion, l'indexation Google
// par langue n'est pas un enjeu central pour ManhwaList.
export const useLocaleStore = create<LocaleState>()(
  persist(
    (set) => ({
      locale: "fr",
      setLocale: (locale) => set({ locale }),
    }),
    { name: "manhwalist_locale" },
  ),
);