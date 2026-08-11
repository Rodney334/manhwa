import { api } from "@/lib/api/client";
import type { AuthTokens, User } from "@/types";

export const authService = {
  register(data: { username: string; email: string; password: string }) {
    return api.post<{ message: string; user: User }>("/api/v1/auth/register", data, {
      skipAuth: true,
    });
  },

  login(data: { identifier: string; password: string }) {
    return api.post<AuthTokens>("/api/v1/auth/login", data, { skipAuth: true });
  },

  me() {
    return api.get<User>("/api/v1/auth/me");
  },

  logout() {
    return api.post<{ message: string }>("/api/v1/auth/logout");
  },

  forgetPassword(email: string) {
    return api.post<{ message: string }>(
      "/api/v1/auth/forget-password",
      { email },
      { skipAuth: true },
    );
  },

  // Consomme le code reçu par courriel (valable 1h) et fixe le nouveau mot
  // de passe. Révoque toutes les sessions ouvertes côté backend.
  resetPassword(code: string, password: string) {
    return api.patch<{ message: string }>(
      "/api/v1/auth/reset-password",
      { code, password },
      { skipAuth: true },
    );
  },
};