export function formatChapter(n: number | undefined | null): string {
  if (n === undefined || n === null) return "—";
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

export function formatDate(iso: string | undefined | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(d);
}

export function formatRelative(iso: string | undefined | null): string {
  if (!iso) return "—";
  const d = new Date(iso).getTime();
  if (Number.isNaN(d)) return "—";
  const diffMs = Date.now() - d;
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < 1) return "à l'instant";
  if (diffMin < 60) return `il y a ${diffMin} min`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `il y a ${diffH} h`;
  const diffD = Math.round(diffH / 24);
  if (diffD < 30) return `il y a ${diffD} j`;
  return formatDate(iso);
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