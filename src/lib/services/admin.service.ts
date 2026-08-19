import { api } from "@/lib/api/client";
import type { AccountStatus, LibraryEntry, Manhwa, PaginatedResponse, Role, User } from "@/types";

export interface ModerationSubmission {
  _id: string;
  title: string;
  submittedBy?: { _id: string; username: string; contributionStats?: User["contributionStats"] };
  createdAt: string;
  [key: string]: unknown;
}

export interface AuditLog {
  _id: string;
  action: string;
  actorId?: { _id: string; username?: string; email?: string; role?: Role } | string;
  actorRole?: "user" | "admin" | "system";
  targetType?: string;
  targetId?: string;
  targetLabel?: string;
  reason?: string;
  changes?: { before?: Record<string, unknown>; after?: Record<string, unknown> };
  ip?: string;
  userAgent?: string;
  createdAt: string;
}

export interface AuditLogQuery {
  actorId?: string;
  action?: string;
  targetType?: string;
  targetId?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
  [key: string]: string | number | boolean | null | undefined;
}

export interface JobRun {
  name: string;
  startedAt: string;
  finishedAt?: string;
  processed: number;
  updated: number;
  notified: number;
  errors: unknown[];
  [key: string]: unknown;
}

export interface JobsOverview {
  available: string[];
  history: JobRun[];
}

export interface TopManhwaEntry {
  manhwaId: string;
  followers: number;
  avgScore: number;
  title: string;
  adminLabel: string | null;
  slug: string;
  totalChapters: number;
}

export interface ManhwaReader {
  userId: string;
  username: string;
  status: string;
  currentChapter: number;
  score?: number;
  lastReadAt?: string;
}

export interface TopContributor {
  _id: string;
  username: string;
  contributionStats: { submitted: number; approved: number; rejected: number };
  createdAt: string;
}

export interface AdminDashboard {
  accounts: { total: number; active: number; admins: number; newLast30Days: number };
  catalog: {
    approved: number;
    pending: number;
    bySource: Array<{ _id: string; count: number }>;
    verified: number;
  };
  library: {
    totalEntries: number;
    chaptersRead: number;
    byStatus: Array<{ _id: string; count: number }>;
  };
  engagement: { readersLast7Days: number; readersLast30Days: number };
  autonomy: {
    catalogAutonomyRate: number;
    localCoverRate: number;
    verifiedRate: number;
    approvedContributionsLast30Days: number;
    externalSourcesEnabled: boolean;
  };
  topManhwa: TopManhwaEntry[];
  topContributors: TopContributor[];
}

export const adminService = {
  moderationQueue(params?: { page?: number; pageSize?: number; submittedBy?: string }) {
    return api.get<PaginatedResponse<ModerationSubmission>>("/api/v1/admin/moderation/queue", {
      params,
    });
  },
  moderationCount() {
    return api.get<{ pending: number }>("/api/v1/admin/moderation/count");
  },
  moderationDetail(id: string) {
    return api.get<{ submission: Manhwa; similar: (Manhwa & { similarity: number })[] }>(
      `/api/v1/admin/moderation/${id}`,
    );
  },
  async approve(id: string, data?: { corrections?: Partial<Manhwa>; reason?: string }) {
    const res = await api.post<{ message: string; manhwa: Manhwa }>(
      `/api/v1/admin/moderation/${id}/approve`,
      data,
    );
    return res;
  },
  reject(id: string, reason: string) {
    // Le backend renvoie aussi la fiche (manhwa) mais on ne l'utilise pas ici.
    return api.post<{ message: string }>(`/api/v1/admin/moderation/${id}/reject`, { reason });
  },
  // `id` = fiche absorbée (disparaît), `targetId` = fiche conservée.
  merge(id: string, targetId: string, reason?: string) {
    return api.post<{ message: string; reassignedEntries: number; mergedEntries: number }>(
      `/api/v1/admin/moderation/${id}/merge`,
      { targetId, ...(reason ? { reason } : {}) },
    );
  },

  users(params?: { page?: number; pageSize?: number; role?: Role; status?: AccountStatus; search?: string }) {
    return api.get<PaginatedResponse<User>>("/api/v1/admin/users", { params });
  },
  user(id: string) {
    return api.get<User>(`/api/v1/admin/users/${id}`);
  },
  removeUser(id: string) {
    return api.delete<{ message: string }>(`/api/v1/admin/users/${id}`);
  },
  // Lecture seule, tracée dans le journal d'audit (user.library_view).
  // `reason` est facultatif mais fortement recommandé côté backend.
  userLibrary(id: string, params?: { page?: number; pageSize?: number; reason?: string }) {
    return api.get<PaginatedResponse<LibraryEntry>>(`/api/v1/admin/users/${id}/library`, { params });
  },
  userSubmissions(id: string, params?: { page?: number; pageSize?: number }) {
    return api.get<
      PaginatedResponse<{
        _id: string;
        title: string;
        slug: string;
        coverPath?: string;
        moderationStatus: string;
        source: string;
        rejectionReason?: string;
        createdAt: string;
        reviewedAt?: string;
      }>
    >(`/api/v1/admin/users/${id}/submissions`, { params });
  },
  getSettings() {
    return api.get<{ siteName: string | null }>("/api/v1/admin/settings");
  },
  updateSettings(data: { siteName: string | null }) {
    return api.patch<{ siteName: string | null }>("/api/v1/admin/settings", data);
  },
  setManhwaAdminLabel(manhwaId: string, adminLabel: string | null) {
    return api.patch<{ title: string; adminLabel: string | null }>(
      `/api/v1/admin/manhwa/${manhwaId}/label`,
      { adminLabel },
    );
  },
  manhwaReaders(manhwaId: string) {
    return api
      .get<{ items: ManhwaReader[] }>(`/api/v1/admin/manhwa/${manhwaId}/readers`)
      .then((res) => res.items);
  },
  // NOTE : le backend ne renvoie PAS le compte mis à jour ici, seulement un
  // message de confirmation. Le front doit mettre à jour son état localement.
  setUserStatus(id: string, status: AccountStatus, reason: string) {
    return api.patch<{ message: string }>(`/api/v1/admin/users/${id}/status`, { status, reason });
  },
  setUserRole(id: string, role: Role) {
    return api.patch<{ message: string }>(`/api/v1/admin/users/${id}/role`, { role });
  },

  auditLogs(params?: AuditLogQuery) {
    return api.get<PaginatedResponse<AuditLog>>("/api/v1/admin/audit-logs", { params });
  },
  dashboard() {
    return api.get<AdminDashboard>("/api/v1/admin/dashboard");
  },
  jobs() {
    return api.get<JobsOverview>("/api/v1/admin/jobs");
  },
  runJob(name: string) {
    return api.post<{ message: string }>(`/api/v1/admin/jobs/${name}/run`);
  },
};