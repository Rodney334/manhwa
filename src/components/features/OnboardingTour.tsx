"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAuthStore } from "@/lib/stores/auth.store";
import { useOnboardingStore } from "@/lib/stores/onboarding.store";
import { useMobileNavStore } from "@/lib/stores/mobile-nav.store";
import { ArrowRight, ArrowLeft, PartyPopper } from "lucide-react";

function storageKey(userId: string) {
  return `manhwalist_onboarding_seen_${userId}`;
}

type Step = {
  tourId: string;
  title: string;
  body: string;
};

const STEPS: Step[] = [
  {
    tourId: "reprendre",
    title: "Reprendre",
    body:
      "Ton point de départ à chaque visite. Classé par retard, pas par date : la série que tu risques le plus d'abandonner apparaît en premier. Lis un chapitre, elle laisse gentiment la place aux autres.",
  },
  {
    tourId: "bibliotheque",
    title: "Bibliothèque",
    body:
      "Toutes tes séries, sans exception — en cours, en pause, terminées, abandonnées, à lire. Filtre, trie, note chacune d'elles.",
  },
  {
    tourId: "chercher",
    title: "Chercher",
    body:
      "Tape un titre, un auteur, ou un titre alternatif — le catalogue s'enrichit tout seul si besoin, sans aucune vérification manuelle de ta part.",
  },
  {
    tourId: "calendrier",
    title: "Calendrier",
    body:
      "Tes séries en cours, groupées par jour de parution habituel — déduit de leurs habitudes réelles, jamais d'une date qu'on t'aurait simplement annoncée.",
  },
  {
    tourId: "decouvrir",
    title: "Découvrir",
    body:
      "Des suggestions basées sur les genres de tes séries les mieux notées. Rien tant que tu n'as pas noté au moins une série 8/10 ou plus.",
  },
  {
    tourId: "partage",
    title: "Partage",
    body:
      "Un lien en lecture seule vers ta bibliothèque, à envoyer à qui tu veux — toi seul·e décides de ce qu'il montre. Compare aussi ta liste à celle d'un ami.",
  },
];

const CONFETTI_COLORS = ["#26e07e", "#d4a94e", "#e9ebee", "#0f3a25"];

type Rect = { top: number; left: number; width: number; height: number };

function findTargetRect(tourId: string): Rect | null {
  const candidates = document.querySelectorAll<HTMLElement>(`[data-tour="${tourId}"]`);
  for (const el of candidates) {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) {
      return { top: r.top, left: r.left, width: r.width, height: r.height };
    }
  }
  return null;
}

export function OnboardingTour() {
  const user = useAuthStore((s) => s.user);
  const isOpen = useOnboardingStore((s) => s.isOpen);
  const open = useOnboardingStore((s) => s.open);
  const close = useOnboardingStore((s) => s.close);
  const openMobileNav = useMobileNavStore((s) => s.open);
  const closeMobileNav = useMobileNavStore((s) => s.close);

  const [step, setStep] = useState(-1);
  const [rect, setRect] = useState<Rect | null>(null);
  const [confetti, setConfetti] = useState<
    { id: number; x: number; rotate: number; color: string; delay: number }[]
  >([]);
  const openedMobileNav = useRef(false);

  const isIntro = step === -1;
  const isLast = step === STEPS.length;
  const current = isIntro ? null : STEPS[step];

  // Déclenchement automatique : une seule fois par compte. Le bouton
  // "Revoir le tutoriel" du profil appelle `open()` directement, sans
  // repasser par cette vérification.
  useEffect(() => {
    if (!user?._id) return;
    if (!localStorage.getItem(storageKey(user._id))) open();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id]);

  // Sur mobile, la sidebar réelle n'existe dans le DOM qu'une fois le
  // tiroir ouvert — impossible de mettre en surbrillance un élément à
  // display:none. On force donc l'ouverture pendant le tour, et on referme
  // proprement en sortant si c'est nous qui l'avons ouvert.
  useEffect(() => {
    if (!isOpen) return;
    if (window.innerWidth < 1024 && !isLast && !isIntro) {
      openMobileNav();
      openedMobileNav.current = true;
    }
    return () => {
      if (openedMobileNav.current) {
        closeMobileNav();
        openedMobileNav.current = false;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, isIntro]);

  // Recalcule la position de la cible à chaque étape, et la suit au
  // redimensionnement/défilement — un tiroir qui s'anime, une fenêtre
  // qu'on redimensionne, tout doit rester aligné.
  useEffect(() => {
    if (!isOpen || isLast || isIntro || !current) {
      setRect(null);
      return;
    }

    function update() {
      if (current) setRect(findTargetRect(current.tourId));
    }

    // Léger délai pour laisser le tiroir mobile finir son animation
    // d'ouverture avant de mesurer sa position réelle.
    const t = setTimeout(update, 80);
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);

    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [isOpen, step, isLast, isIntro, current]);

  useEffect(() => {
    if (!isLast) return;
    const particles = Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      rotate: Math.random() * 360,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      delay: Math.random() * 0.4,
    }));
    setConfetti(particles);
    const t = setTimeout(() => setConfetti([]), 2600);
    return () => clearTimeout(t);
  }, [isLast]);

  const padded = useMemo(() => {
    if (!rect) return null;
    const pad = 8;
    return {
      top: rect.top - pad,
      left: rect.left - pad,
      width: rect.width + pad * 2,
      height: rect.height + pad * 2,
    };
  }, [rect]);

  // Tooltip à droite de la cible par défaut (la sidebar est à gauche) ;
  // repasse en dessous si jamais il n'y a pas assez de place — utile en
  // largeur réduite où le tiroir mobile prend presque tout l'écran.
  const tooltipStyle = useMemo((): React.CSSProperties => {
    if (!padded || typeof window === "undefined") {
      return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
    }
    const spaceRight = window.innerWidth - (padded.left + padded.width);
    if (spaceRight > 320) {
      return {
        top: `${padded.top + padded.height / 2}px`,
        left: `${padded.left + padded.width + 18}px`,
        transform: "translateY(-50%)",
      };
    }
    return {
      top: `${padded.top + padded.height + 14}px`,
      left: `${Math.min(padded.left, window.innerWidth - 320)}px`,
      transform: "none",
    };
  }, [padded]);

  function handleClose() {
    if (user?._id) localStorage.setItem(storageKey(user._id), "1");
    setStep(-1);
    close();
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Voile sombre avec découpe lumineuse : la boîte elle-même est
          transparente, c'est son immense ombre portée qui assombrit tout
          le reste de l'écran — la transition anime le déplacement d'une
          cible à l'autre comme un vrai projecteur qui suit. */}
      {padded ? (
        <div
          className="fixed rounded-xl pointer-events-none transition-all duration-500 ease-out border-2 border-vert"
          style={{
            top: padded.top,
            left: padded.left,
            width: padded.width,
            height: padded.height,
            boxShadow: "0 0 0 9999px rgba(0,0,0,0.78)",
          }}
        >
          <div className="absolute -inset-1 rounded-xl border border-vert/50 animate-pulse" />
        </div>
      ) : (
        <div className="fixed inset-0 bg-black/80 transition-opacity duration-500" />
      )}

      {/* Confettis — de simples carrés qui tombent, aucune dépendance. */}
      {confetti.length > 0 && (
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          {confetti.map((c) => (
            <span
              key={c.id}
              className="confetti-piece"
              style={{
                left: `${c.x}%`,
                backgroundColor: c.color,
                animationDelay: `${c.delay}s`,
                transform: `rotate(${c.rotate}deg)`,
              }}
            />
          ))}
        </div>
      )}

      {isIntro ? (
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl border border-vert/25 bg-sur p-7 flex flex-col items-center text-center gap-4">
            <div className="flex items-center gap-2.5">
              <i className="w-2 h-2 rounded-full bg-vert" />
              <span className="font-display text-[16px]">
                Manhwa<span className="text-vert">List</span>
              </span>
            </div>
            <h2 className="font-display text-[22px] font-normal">
              Bienvenue, {user?.username ?? ""} !
            </h2>
            <p className="text-[13.5px] text-txt2 leading-relaxed">
              Merci de nous rejoindre. On va te faire faire un petit tour du propriétaire — six
              étapes, à peine une minute, pour que tu saches où trouver chaque chose dès le
              départ.
            </p>
            <button
              onClick={() => setStep(0)}
              className="mt-1 flex items-center gap-2 bg-vert text-[#05130c] font-medium text-[13.5px] rounded-lg px-5 py-2.5 hover:brightness-110 transition-all"
            >
              Commencer la visite <ArrowRight size={14} />
            </button>
            <button
              onClick={handleClose}
              className="text-[11.5px] text-txt3 hover:text-txt2 transition-colors"
            >
              Merci, je préfère explorer par moi-même
            </button>
          </div>
        </div>
      ) : !isLast && current ? (
        <div
          className="fixed w-[300px] rounded-2xl border border-ligne bg-sur p-5 flex flex-col gap-3 shadow-2xl transition-all duration-500 ease-out"
          style={tooltipStyle}
        >
          <div>
            <p className="text-[10.5px] font-mono uppercase tracking-wider text-vert">
              Étape {step + 1} sur {STEPS.length}
            </p>
            <h2 className="font-display text-[18px] font-normal mt-1">{current.title}</h2>
          </div>

          <p className="text-[12.5px] text-txt2 leading-relaxed">{current.body}</p>

          <div className="flex items-center justify-between gap-3 pt-1">
            <div className="flex gap-1.5">
              {STEPS.map((_, i) => (
                <span
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    i === step ? "bg-vert" : "bg-sur3"
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setStep((s) => Math.max(-1, s - 1))}
                aria-label="Étape précédente"
                className="text-txt3 hover:text-txt transition-colors p-1.5"
              >
                <ArrowLeft size={14} />
              </button>
              <button
                onClick={() => setStep((s) => s + 1)}
                className="flex items-center gap-1.5 bg-vert text-[#05130c] font-medium text-[12.5px] rounded-lg px-3.5 py-1.5 hover:brightness-110 transition-all"
              >
                Suivant <ArrowRight size={12} />
              </button>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="text-[11px] text-txt3 hover:text-txt2 transition-colors self-center"
          >
            Merci, je préfère explorer par moi-même
          </button>
        </div>
      ) : (
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl border border-ligne bg-sur p-7 flex flex-col items-center text-center gap-3">
            <PartyPopper size={30} className="text-vert" />
            <h2 className="font-display text-[21px] font-normal">
              Tu es prêt·e, {user?.username ?? ""}
            </h2>
            <p className="text-[13.5px] text-txt2 leading-relaxed">
              Merci de ta patience, c&apos;était la dernière étape. Tu peux revoir ce tour à tout
              moment depuis ton profil.
            </p>
            <button
              onClick={handleClose}
              className="mt-1 flex items-center gap-2 bg-vert text-[#05130c] font-medium text-[13.5px] rounded-lg px-5 py-2.5 hover:brightness-110 transition-all"
            >
              C&apos;est parti !
            </button>
          </div>
        </div>
      )}
    </div>
  );
}