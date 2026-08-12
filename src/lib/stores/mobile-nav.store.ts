import { create } from "zustand";

// État d'ouverture du tiroir de navigation mobile — partagé entre Topbar
// (qui porte le bouton hamburger) et Sidebar (qui porte le tiroir lui-même),
// deux composants frères dans le layout, d'où le store plutôt qu'un state
// local.
type MobileNavState = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
};

export const useMobileNavStore = create<MobileNavState>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set((s) => ({ isOpen: !s.isOpen })),
}));