import { api } from "@/lib/api/client";
import type { User } from "@/types";

// Couvre /api/v1/users/*, jusque-là absent du front.
// NOTE : GET /users/me renvoie aujourd'hui la même projection que
// GET /auth/me, mais est sémantiquement l'écran "profil" (cf. doc backend).

export interface UpdateProfilePayload {
  username?: string;
  avatarUrl?: string;
  preferences?: {
    notifyByEmail?: boolean;
    digestFrequency?: "daily" | "weekly";
    locale?: string;
    timezone?: string;
  };
}

export const userService = {
  me() {
    return api.get<User>("/api/v1/users/me");
  },

  updateMe(data: UpdateProfilePayload) {
    return api.patch<{ message: string; user: User }>("/api/v1/users/me", data);
  },

  // Révoque toutes les autres sessions côté backend après succès.
  changePassword(currentPassword: string, newPassword: string) {
    return api.patch<{ message: string }>("/api/v1/users/me/password", {
      currentPassword,
      newPassword,
    });
  },

  // Suppression définitive du compte courant.
  deleteMe() {
    return api.delete<{ message: string }>("/api/v1/users/me");
  },
};