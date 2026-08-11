import { api, API_BASE_URL, tokenManager } from "@/lib/api/client";
import type { ReadingStatus, Share } from "@/types";

export interface CreateSharePayload {
  title?: string;
  statuses?: ReadingStatus[];
  favoritesOnly?: boolean;
  minScore?: number;
  includeProgress?: boolean;
  includeNotes?: boolean;
  expiresInDays?: number;
}

export interface ExportPdfOptions {
  status?: ReadingStatus;
  favoritesOnly?: boolean;
  minScore?: number;
  includeNotes?: boolean;
}

export type UpdateSharePayload = Partial<CreateSharePayload> & { isActive?: boolean };

export interface SharedListEntry {
  title: string;
  slug: string;
  authors?: string[];
  genres?: string[];
  coverPath?: string;
  totalChapters?: number;
  publicationStatus?: string;
  status: ReadingStatus;
  currentChapter?: number;
  score?: number;
  isFavorite: boolean;
}

export interface SharedList {
  share: {
    token: string;
    title?: string;
    includeProgress: boolean;
    includeNotes: boolean;
    expiresAt?: string | null;
    viewCount: number;
  };
  owner: { username: string; avatarUrl?: string };
  entries: SharedListEntry[];
  counts: { total: number; byStatus: Array<{ status: string; count: number }> };
}

export const sharesService = {
  async list() {
    const res = await api.get<{ items: Share[] }>("/api/v1/shares");
    return res.items;
  },

  async create(data: CreateSharePayload) {
    const res = await api.post<{ message: string; share: Share; publicUrl: string }>(
      "/api/v1/shares",
      data,
    );
    return res;
  },

  async update(id: string, data: UpdateSharePayload) {
    const res = await api.patch<{ message: string; share: Share }>(`/api/v1/shares/${id}`, data);
    return res.share;
  },

  remove(id: string) {
    return api.delete<{ message: string }>(`/api/v1/shares/${id}`);
  },

  // Version PUBLIQUE (aucune auth) : consultation d'un lien partagé par un
  // visiteur sans compte. Pas d'attente d'authentification, jamais de retry.
  viewPublic(token: string) {
    return api.get<SharedList>(`/api/v1/public/${token}`, { skipAuth: true, skipRefresh: true });
  },

async exportPdf(options: ExportPdfOptions = {}): Promise<Blob> {
  const token = tokenManager.getAccess();
  const params = new URLSearchParams();
  if (options.status) params.set("status", options.status);
  if (options.favoritesOnly) params.set("favoritesOnly", "true");
  if (options.minScore) params.set("minScore", String(options.minScore));
  if (options.includeNotes) params.set("includeNotes", "true");

  const qs = params.toString();
  const res = await fetch(`${API_BASE_URL}/api/v1/export/pdf${qs ? `?${qs}` : ""}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error("Échec de l'export PDF.");
  return res.blob();
},

  // Version PUBLIQUE (aucune auth) : PDF du lien partagé, pour un visiteur
  // qui n'a pas de compte. À ne pas confondre avec exportPdf() ci-dessus.
  async exportPublicPdf(token: string): Promise<Blob> {
    const res = await fetch(`${API_BASE_URL}/api/v1/public/${token}/pdf`);
    if (!res.ok) throw new Error("Échec de l'export PDF public.");
    return res.blob();
  },
};