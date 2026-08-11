import { api } from "@/lib/api/client";
import type { LibraryEntry, LibraryStats, PaginatedResponse, ReadingStatus } from "@/types";

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
};
