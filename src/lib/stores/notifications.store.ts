import { create } from "zustand";

// Compteur de notifications non lues, partagé entre la Topbar (pastille) et
// l'écran /app/notifications (qui le fait varier en marquant comme lu).
// Sans ce store, les deux vivaient chacun dans leur coin : la pastille ne
// se mettait jamais à jour après une lecture tant que la Topbar ne
// remontait pas (elle ne remonte jamais, elle vit au niveau du layout).

type NotificationsState = {
  unreadCount: number;
  setUnreadCount: (count: number) => void;
  decrement: (by?: number) => void;
};

export const useNotificationsStore = create<NotificationsState>((set) => ({
  unreadCount: 0,
  setUnreadCount: (count) => set({ unreadCount: Math.max(0, count) }),
  decrement: (by = 1) => set((s) => ({ unreadCount: Math.max(0, s.unreadCount - by) })),
}));