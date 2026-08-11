import { api } from "@/lib/api/client";
import type { Notification, PaginatedResponse } from "@/types";

// GET /notifications renvoie `unreadCount` calculé sur l'ENSEMBLE du compte,
// pas sur la page courante — le front doit s'en servir directement plutôt
// que de recompter les éléments non lus de la page reçue (faux dès qu'il y
// a plus de `pageSize` notifications).
export type NotificationsPage = PaginatedResponse<Notification> & { unreadCount: number };

export const notificationsService = {
  list(params?: { page?: number; pageSize?: number }) {
    return api.get<NotificationsPage>("/api/v1/notifications", { params });
  },
  markRead(id: string) {
    return api.patch<{ message: string }>(`/api/v1/notifications/${id}/read`);
  },
  markAllRead() {
    return api.patch<{ message: string }>("/api/v1/notifications/read-all");
  },
};