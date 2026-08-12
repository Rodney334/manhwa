"use client";

import { useEffect } from "react";

// Composant sans rendu, juste pour déclencher l'enregistrement du service
// worker après montage — impossible à faire depuis layout.tsx (composant
// serveur) directement.
export function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Silencieux : l'app reste utilisable sans service worker, ça ne
        // fait que priver l'utilisateur du bandeau d'installation auto.
      });
    }
  }, []);

  return null;
}