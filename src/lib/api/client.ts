import { ApiErrorBody } from "@/types";

// ─── Base URL ──────────────────────────────────────────────────────────────

// Pas de fallback vers une URL codée en dur : un ancien déploiement "beta"
// oublié dans le code a déjà fait pointer une build en production vers un
// mauvais backend, silencieusement, sans qu'aucune erreur ne le signale.
// Mieux vaut un échec bruyant au build que des données d'un autre backend
// servies sans avertissement.
if (!process.env.NEXT_PUBLIC_API_URL) {
  throw new Error(
    "NEXT_PUBLIC_API_URL n'est pas définie. Ajoute-la dans les variables d'environnement du projet (Vercel : Settings → Environment Variables).",
  );
}

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// ─── Erreur API ────────────────────────────────────────────────────────────

export class ApiError extends Error {
  status: number;
  body?: ApiErrorBody;

  constructor(status: number, message: string, body?: ApiErrorBody) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

// ─── Gestion des jetons (localStorage, client uniquement) ────────────────────
// Le backend délivre accessToken (courte durée) + refreshToken (7 jours).
// Le refresh se fait via GET /auth/refresh/access-token avec le refreshToken
// placé dans l'en-tête Authorization — PAS dans le body.

const ACCESS_KEY = "manhwalist_access_token";
const REFRESH_KEY = "manhwalist_refresh_token";

export const tokenManager = {
  getAccess(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(ACCESS_KEY);
  },
  setAccess(token: string): void {
    if (typeof window !== "undefined") localStorage.setItem(ACCESS_KEY, token);
  },
  getRefresh(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(REFRESH_KEY);
  },
  setRefresh(token: string): void {
    if (typeof window !== "undefined") localStorage.setItem(REFRESH_KEY, token);
  },
  setTokens(access: string, refresh: string): void {
    tokenManager.setAccess(access);
    tokenManager.setRefresh(refresh);
  },
  clear(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem(ACCESS_KEY);
      localStorage.removeItem(REFRESH_KEY);
    }
  },
};

// ─── Renouvellement du jeton d'accès ──────────────────────────────────────

let isRefreshing = false;
let refreshQueue: Array<(token: string | null) => void> = [];

export async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = tokenManager.getRefresh();
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/auth/refresh/access-token`, {
      method: "GET",
      headers: { Authorization: `Bearer ${refreshToken}` },
    });

    if (!res.ok) return null;

    const body = await res.json();
    const newAccessToken: string | null = body?.accessToken ?? null;

    if (newAccessToken) {
      tokenManager.setAccess(newAccessToken);
      return newAccessToken;
    }
    return null;
  } catch {
    return null;
  }
}

// ─── Requête générique ─────────────────────────────────────────────────────

export type RequestOptions = RequestInit & {
  skipAuth?: boolean;
  skipRefresh?: boolean;
  params?: Record<string, string | number | boolean | undefined | null>;
};

function buildQueryString(
  params?: RequestOptions["params"],
): string {
  if (!params) return "";
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    qs.set(key, String(value));
  }
  const s = qs.toString();
  return s ? `?${s}` : "";
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { skipAuth = false, skipRefresh = false, params, headers: extraHeaders, ...fetchOptions } = options;

  const accessToken = tokenManager.getAccess();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(accessToken && !skipAuth ? { Authorization: `Bearer ${accessToken}` } : {}),
    ...((extraHeaders as Record<string, string> | undefined) ?? {}),
  };

  const url = `${API_BASE_URL}${path}${buildQueryString(params)}`;

  const response = await fetch(url, { ...fetchOptions, headers });

  if (response.status === 401 && !skipAuth && !skipRefresh) {
    if (isRefreshing) {
      return new Promise<T>((resolve, reject) => {
        refreshQueue.push(async (newToken) => {
          if (!newToken) {
            reject(new ApiError(401, "Session expirée. Reconnecte-toi."));
            return;
          }
          try {
            resolve(await retry<T>(url, fetchOptions, headers, newToken));
          } catch (e) {
            reject(e);
          }
        });
      });
    }

    isRefreshing = true;
    const newToken = await refreshAccessToken();
    isRefreshing = false;
    refreshQueue.forEach((cb) => cb(newToken));
    refreshQueue = [];

    if (!newToken) {
      tokenManager.clear();
      throw new ApiError(401, "Session expirée. Reconnecte-toi.");
    }

    return retry<T>(url, fetchOptions, headers, newToken);
  }

  return parseResponse<T>(response);
}

async function retry<T>(
  url: string,
  fetchOptions: RequestInit,
  headers: Record<string, string>,
  newToken: string,
): Promise<T> {
  const response = await fetch(url, {
    ...fetchOptions,
    headers: { ...headers, Authorization: `Bearer ${newToken}` },
  });
  return parseResponse<T>(response);
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) return undefined as T;

  const isJson = response.headers.get("content-type")?.includes("application/json");
  const body = isJson ? await response.json().catch(() => undefined) : undefined;

  if (!response.ok) {
    const message =
      (body as ApiErrorBody | undefined)?.message ||
      (body as ApiErrorBody | undefined)?.error ||
      `Erreur ${response.status}`;
    throw new ApiError(response.status, message, body);
  }

  return body as T;
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) =>
    apiRequest<T>(path, { ...options, method: "GET" }),
  post: <T>(path: string, data?: unknown, options?: RequestOptions) =>
    apiRequest<T>(path, {
      ...options,
      method: "POST",
      body: data !== undefined ? JSON.stringify(data) : undefined,
    }),
  patch: <T>(path: string, data?: unknown, options?: RequestOptions) =>
    apiRequest<T>(path, {
      ...options,
      method: "PATCH",
      body: data !== undefined ? JSON.stringify(data) : undefined,
    }),
  delete: <T>(path: string, options?: RequestOptions) =>
    apiRequest<T>(path, { ...options, method: "DELETE" }),
};

/** Construit l'URL absolue d'une couverture servie par le backend (/covers/...). */
// Domaines dont il est documenté qu'ils bloquent le hotlinking — servent
// délibérément une image de substitution à toute requête sans `Referer`
// légitime (cf. cover-storage.service.ts, backend). Un <img> de navigateur
// envoie toujours le `Referer` du site qui l'affiche, jamais celui de la
// source d'origine : il ne peut donc JAMAIS contourner ce blocage, quel que
// soit le code écrit ici. Autant ne pas essayer plutôt que d'afficher une
// image trompeuse en attendant que le backend l'ait rapatriée lui-même.
const HOTLINK_BLOCKED_HOSTS = ["uploads.mangadex.org"];

export function coverUrl(manhwa: { coverPath?: string; coverSourceUrl?: string }): string | null {
  if (manhwa.coverPath) {
    return manhwa.coverPath.startsWith("http")
      ? manhwa.coverPath
      : `${API_BASE_URL}${manhwa.coverPath.startsWith("/") ? "" : "/"}${manhwa.coverPath}`;
  }

  if (manhwa.coverSourceUrl) {
    try {
      const host = new URL(manhwa.coverSourceUrl).hostname;
      if (!HOTLINK_BLOCKED_HOSTS.includes(host)) return manhwa.coverSourceUrl;
    } catch {
      return manhwa.coverSourceUrl;
    }
  }

  return null;
}