import { api } from "@/lib/api/client";
import type { Manhwa, PaginatedResponse } from "@/types";

// NOTE : create / import / update renvoient { message, manhwa } côté backend,
// pas la fiche directement — on désenveloppe ici.

export type DropOffStats =
  | { available: false; sampleSize: number }
  | { available: true; sampleSize: number; p25: number; median: number; p75: number };

export const manhwaService = {
  search(params: { q?: string; page?: number; pageSize?: number }) {
    return api.get<PaginatedResponse<Manhwa>>("/api/v1/manhwa/search", { params });
  },

  getByIdOrSlug(idOrSlug: string) {
    return api.get<Manhwa>(`/api/v1/manhwa/${encodeURIComponent(idOrSlug)}`);
  },

  sourcesStatus() {
    return api.get<Record<string, unknown>>("/api/v1/manhwa/sources/status");
  },

  mySubmissions(params?: { page?: number; pageSize?: number }) {
    return api.get<PaginatedResponse<Manhwa>>("/api/v1/manhwa/my-submissions", { params });
  },

  async import(data: { provider: "mangadex" | "anilist" | "jikan"; externalId: string }) {
    const res = await api.post<{ message: string; manhwa: Manhwa }>("/api/v1/manhwa/import", data);
    return res.manhwa;
  },

  async create(data: Partial<Manhwa>) {
    const res = await api.post<{ message: string; manhwa: Manhwa }>("/api/v1/manhwa/", data);
    return res.manhwa;
  },

  async update(id: string, data: Partial<Manhwa>) {
    const res = await api.patch<{ message: string; manhwa: Manhwa }>(`/api/v1/manhwa/${id}`, data);
    return res.manhwa;
  },

  remove(id: string) {
    return api.delete<{ message: string }>(`/api/v1/manhwa/${id}`);
  },

  report(id: string, reason: string) {
    return api.post<{ message: string }>(`/api/v1/manhwa/${id}/report`, { reason });
  },

  // Réservé admin. Rattache des titres alternatifs à une fiche pour que le
  // dédoublonnage automatique et la recherche les reconnaissent.
  addAliases(id: string, aliases: string[]) {
    return api.post<{ message: string; addedAliases: string[] }>(
      `/api/v1/manhwa/${id}/aliases`,
      { aliases },
    );
  },

  // Route publique : la statistique porte sur l'ensemble des utilisateurs,
  // pas sur qui que ce soit en particulier.
  dropOffStats(id: string) {
    return api.get<DropOffStats>(`/api/v1/manhwa/${id}/drop-off-stats`, { skipAuth: true });
  },
};