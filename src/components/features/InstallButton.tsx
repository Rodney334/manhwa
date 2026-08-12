"use client";

import { useEffect, useState } from "react";
import { Download, Share } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// Composant client isolé : la page qui l'accueille (landing publique, profil)
// peut rester un composant serveur, seul ce bouton a besoin du JS et des
// événements navigateur.
export function InstallButton({ variant = "footer" }: { variant?: "footer" | "panel" }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Déjà installée (mode standalone) : rien à proposer.
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsStandalone(true);
      return;
    }

    // iOS Safari ne déclenche jamais `beforeinstallprompt` — l'utilisateur
    // doit passer par Partager → Sur l'écran d'accueil, il n'existe aucune
    // API pour déclencher ça depuis le code.
    const ua = window.navigator.userAgent;
    if (/iPad|iPhone|iPod/.test(ua) && !("MSStream" in window)) {
      setIsIOS(true);
      return;
    }

    function handlePrompt(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    }

    function handleInstalled() {
      setDeferredPrompt(null);
      setIsStandalone(true);
    }

    window.addEventListener("beforeinstallprompt", handlePrompt);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handlePrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  async function handleClick() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    // Un event ne se déclenche qu'une fois : qu'il ait été accepté ou
    // refusé, il faut le jeter — Chrome n'en renverra pas de nouveau tant
    // que la page n'est pas rechargée.
    setDeferredPrompt(null);
  }

  if (isStandalone) return null;

  const baseClass =
    variant === "footer"
      ? "pied-lien flex items-center gap-1.5"
      : "flex items-center gap-2 text-[13.5px] font-medium rounded-lg px-4 py-2.5 bg-sur2 border border-ligne text-txt2 hover:border-ligne2 transition-colors";

  if (isIOS) {
    return (
      <span className={baseClass} title="Partager → Sur l'écran d'accueil">
        <Share size={variant === "footer" ? 12 : 14} />
        Installer : Partager → Sur l&apos;écran d&apos;accueil
      </span>
    );
  }

  if (!deferredPrompt) {
    return (
      <span className={variant === "footer" ? "pied-lien" : "text-[12.5px] text-txt3"}>
        Pas encore proposé ? Ouvre le menu ⋮ de Chrome → « Installer l&apos;application ».
      </span>
    );
  }

  return (
    <button onClick={handleClick} className={baseClass}>
      <Download size={variant === "footer" ? 12 : 14} />
      Installer l&apos;application
    </button>
  );
}