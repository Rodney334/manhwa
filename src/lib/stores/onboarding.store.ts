import { create } from "zustand";

// État d'ouverture du tour de bienvenue — partagé entre le déclenchement
// automatique (premier passage) et le bouton "Revoir le tutoriel" du profil,
// deux points d'entrée distincts pour la même fenêtre.
type OnboardingState = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
};

export const useOnboardingStore = create<OnboardingState>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}));