import { api } from "@/lib/api/client";
import type { LibraryEntry, LibraryStats, Manhwa, PaginatedResponse, ReadingStatus } from "@/types";

export interface ReleaseCalendarEntry {
  manhwa: Pick<Manhwa, "_id" | "title" | "slug" | "coverPath" | "coverSourceUrl">;
  typicalDay: number; // 0 = dimanche … 6 = samedi
  lastReleasedAt: string;
  isLikelyOnHiatus: boolean;
}

export interface HeatmapDay {
  date: string; // "YYYY-MM-DD"
  chaptersRead: number;
}

export interface LibraryComparisonEntry {
  slug: string;
  title: string;
  coverPath?: string;
  coverSourceUrl?: string;
  mine: { status: ReadingStatus; currentChapter?: number };
  theirs: { status: ReadingStatus; currentChapter?: number };
}

export interface LibraryComparison {
  owner: { username: string; avatarUrl?: string };
  counts: { mine: number; theirs: number; common: number };
  common: LibraryComparisonEntry[];
}

export interface ReadingWrapped {
  period: "month" | "year" | "last-month" | "last-year";
  from: string;
  to: string;
  totalChaptersRead: number;
  distinctSeriesCount: number;
  activeDaysCount: number;
  mostReadManhwa: {
    _id: string;
    title: string;
    slug: string;
    coverPath?: string;
    coverSourceUrl?: string;
    chaptersRead: number;
  } | null;
  mostActiveDay: number | null; // 0 = dimanche … 6 = samedi
  topGenre: string | null;
  currentStreak: number;
}

// NOTE : le backend n'a pas un contrat de réponse uniforme.
// - list / getOne / stats / history → renvoient l'objet brut.
// - add / update / setProgress / increment → renvoient { message, entry }.
// - continueReading → renvoie { items: [...] }.
// On désenveloppe ici pour que le reste du front manipule toujours
// directement LibraryEntry / LibraryEntry[].

export const libraryService = {
  list(params?: {
    status?: ReadingStatus;
    genre?: string;
    favoritesOnly?: boolean;
    minScore?: number;
    search?: string;
    sort?: string;
    page?: number;
    pageSize?: number;
  }) {
    return api.get<PaginatedResponse<LibraryEntry>>("/api/v1/library/", { params });
  },

  async continueReading(limit = 10) {
    const res = await api.get<{ items: LibraryEntry[] }>("/api/v1/library/continue", {
      params: { limit },
    });
    return res.items;
  },

  stats() {
    return api.get<LibraryStats>("/api/v1/library/stats");
  },

  history(params?: { page?: number; pageSize?: number }) {
    return api.get<PaginatedResponse<LibraryEntry>>("/api/v1/library/history", { params });
  },

  get(id: string) {
    return api.get<LibraryEntry>(`/api/v1/library/${id}`);
  },

  async add(data: { manhwaId?: string; provider?: string; externalId?: string; status?: ReadingStatus }) {
    const res = await api.post<{ message: string; entry: LibraryEntry }>("/api/v1/library/", data);
    return res.entry;
  },

  async update(
    id: string,
    data: Partial<Pick<LibraryEntry, "status" | "score" | "notes" | "isFavorite" | "notifyOnNewChapter" | "currentVolume">>,
  ) {
    const res = await api.patch<{ message: string; entry: LibraryEntry }>(`/api/v1/library/${id}`, data);
    return res.entry;
  },

  async updateProgress(id: string, currentChapter: number) {
    const res = await api.patch<{ message: string; entry: LibraryEntry }>(
      `/api/v1/library/${id}/progress`,
      { currentChapter },
    );
    return res.entry;
  },

  async increment(id: string, step = 1) {
    const res = await api.post<{ message: string; entry: LibraryEntry }>(
      `/api/v1/library/${id}/increment`,
      { step },
    );
    return res.entry;
  },

  remove(id: string) {
    return api.delete<{ message: string }>(`/api/v1/library/${id}`);
  },

  async releaseCalendar() {
    const res = await api.get<{ items: ReleaseCalendarEntry[] }>("/api/v1/library/release-calendar");
    return res.items;
  },

  async readingHeatmap(days = 365) {
    const res = await api.get<{ items: HeatmapDay[] }>("/api/v1/library/reading-heatmap", {
      params: { days },
    });
    return res.items;
  },

  async recommendations(limit = 12) {
    const res = await api.get<{ items: Manhwa[] }>("/api/v1/library/recommendations", {
      params: { limit },
    });
    return res.items;
  },

  // `token` peut venir d'un lien collé tel quel (…/partage/<token>) ou du
  // token nu — extrait ici pour éviter de faire porter cette logique au
  // composant appelant.
  compare(tokenOrLink: string) {
    const token = tokenOrLink.trim().split("/").filter(Boolean).pop() ?? tokenOrLink.trim();
    return api.get<LibraryComparison>(`/api/v1/library/compare/${encodeURIComponent(token)}`);
  },

  wrapped(period: "month" | "year" | "last-month" | "last-year" = "month") {
    return api.get<ReadingWrapped>("/api/v1/library/wrapped", { params: { period } });
  },
};