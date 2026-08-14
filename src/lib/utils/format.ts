export function formatChapter(n: number | undefined | null): string {
  if (n === undefined || n === null) return "—";
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

export function formatDate(iso: string | undefined | null, locale: "fr" | "en" = "fr"): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

// Un dictionnaire minimal ici plutôt que de faire dépendre `format.ts` du
// système i18n complet (`useTranslations`, qui est un hook — inutilisable
// dans une fonction utilitaire appelée en dehors d'un composant). `locale`
// par défaut à "fr" : les pages pas encore migrées vers `useTranslations`
// continuent d'appeler cette fonction sans argument, elles doivent garder
// leur comportement d'origine jusqu'à leur tour.
const RELATIVE_LABELS = {
  fr: {
    justNow: "à l'instant",
    minAgo: (n: number) => `il y a ${n} min`,
    hAgo: (n: number) => `il y a ${n} h`,
    dAgo: (n: number) => `il y a ${n} j`,
  },
  en: {
    justNow: "just now",
    minAgo: (n: number) => `${n} min ago`,
    hAgo: (n: number) => `${n} h ago`,
    dAgo: (n: number) => `${n} d ago`,
  },
};

export function formatRelative(iso: string | undefined | null, locale: "fr" | "en" = "fr"): string {
  if (!iso) return "—";
  const d = new Date(iso).getTime();
  if (Number.isNaN(d)) return "—";
  const labels = RELATIVE_LABELS[locale];
  const diffMs = Date.now() - d;
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < 1) return labels.justNow;
  if (diffMin < 60) return labels.minAgo(diffMin);
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return labels.hAgo(diffH);
  const diffD = Math.round(diffH / 24);
  if (diffD < 30) return labels.dAgo(diffD);
  return formatDate(iso, locale);
}

export const READING_STATUS_LABELS: Record<string, string> = {
  reading: "En cours",
  completed: "Terminé",
  on_hold: "En pause",
  dropped: "Abandonné",
  plan_to_read: "À lire",
};

export const PUBLICATION_STATUS_LABELS: Record<string, string> = {
  ongoing: "En cours",
  completed: "Terminé",
  hiatus: "En pause",
  cancelled: "Annulé",
};

export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}


export function cleanSynopsis(text: string | undefined | null): string {
  if (!text) return "";
  return text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // [texte](url) → texte
    .replace(/-{3,}[\s\S]*$/, "") // coupe tout après une ligne "---"
    .replace(/\n{2,}/g, "\n")
    .trim();
}