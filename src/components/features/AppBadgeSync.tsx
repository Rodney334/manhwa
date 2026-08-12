"use client";

import { useEffect } from "react";
import { useNotificationsStore } from "@/lib/stores/notifications.store";

// La Badging API n'est pas (encore) dans les types DOM standards de
// TypeScript pour toutes les versions ciblées ici — déclarée à la main
// plutôt que de recourir à `as any`, qui masquerait toute vraie erreur de
// frappe sur ces deux appels.
declare global {
  interface Navigator {
    setAppBadge?: (count?: number) => Promise<void>;
    clearAppBadge?: () => Promise<void>;
  }
}

// Badging API : affiche le nombre sur l'icône de l'app quand elle est
// installée en PWA (Android/Chrome, et Safari récent sur iOS/macOS).
// Aucun effet dans un onglet de navigateur classique — l'API y est
// silencieusement absente, `"setAppBadge" in navigator` protège contre ça.
// Pas de rendu : ce composant ne fait que synchroniser un effet de bord.
export function AppBadgeSync() {
  const unreadCount = useNotificationsStore((s) => s.unreadCount);

  useEffect(() => {
    if (!("setAppBadge" in navigator)) return;

    try {
      if (unreadCount > 0) {
        navigator.setAppBadge?.(unreadCount)?.catch(() => {});
      } else {
        navigator.clearAppBadge?.()?.catch(() => {});
      }
    } catch {
      // Certains navigateurs exposent l'API mais la refusent selon le
      // contexte (hors PWA installée, par exemple) — sans conséquence,
      // l'app reste utilisable, elle n'a juste pas de badge.
    }
  }, [unreadCount]);

  return null;
}