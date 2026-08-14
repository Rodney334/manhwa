// ─── Types partagés — miroir des schémas Swagger du backend ManhwaList ───────

export type Role = "user" | "admin";
export type AccountStatus = "active" | "suspended" | "banned";

export interface User {
  _id: string;
  username: string;
  email: string;
  avatarUrl?: string;
  role: Role;
  status: AccountStatus;
  statusReason?: string | null;
  isEmailVerified: boolean;
  preferences?: {
    notifyByEmail?: boolean;
    digestFrequency?: string;
    locale?: string;
    timezone?: string;
  };
  contributionStats?: {
    submitted: number;
    approved: number;
    rejected: number;
  };
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export type PublicationStatus = "ongoing" | "completed" | "hiatus" | "cancelled";

export interface OfficialLink {
  platform: string;
  url: string;
}

export interface Manhwa {
  _id: string;
  externalIds?: Record<string, string>;
  title: string;
  normalizedTitle?: string;
  altTitles?: string[];
  slug: string;
  synopsis?: string;
  coverPath?: string;
  coverSourceUrl?: string;
  isCoverLocal?: boolean;
  authors?: string[];
  genres?: string[];
  tags?: string[];
  status: PublicationStatus;
  type?: string;
  releaseYear?: number;
  totalChapters?: number;
  officialLinks?: OfficialLink[];
  isVerified?: boolean;
  moderationStatus?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type ReadingStatus =
  | "reading"
  | "completed"
  | "on_hold"
  | "dropped"
  | "plan_to_read";

export interface LibraryEntry {
  _id: string;
  userId: string;
  manhwaId: string;
  manhwa: Manhwa;
  status: ReadingStatus;
  currentChapter: number;
  currentVolume?: number;
  score?: number;
  notes?: string;
  isFavorite: boolean;
  notifyOnNewChapter: boolean;
  startedAt?: string;
  finishedAt?: string | null;
  lastReadAt?: string;
  rereadCount?: number;
  unreadCount?: number;
  isPendingModeration?: boolean;
  createdAt: string;
  updatedAt: string;
}

// Miroir exact de LibraryService.stats() côté backend : agrégations Mongo
// brutes, pas un objet pré-formaté pour l'UI.
export interface LibraryStats {
  byStatus: Array<{ _id: ReadingStatus; count: number }>;
  byGenre: Array<{ _id: string; count: number }>;
  monthlyActivity: Array<{ _id: string; chapters: number }>; // _id au format "YYYY-MM"
  totalEntries: number;
  chaptersRead: number;
  averageScore: number | null;
  favorites: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages?: number;
}

export type NotificationType =
  | "new_chapter"
  | "status_change"
  | "submission_approved"
  | "submission_rejected"
  | "account_action"
  | "system";

export interface NotificationPayload {
  title?: string;
  chapter?: number;
  coverPath?: string;
  url?: string;
  message?: string;
}

export interface NotificationManhwaRef {
  _id: string;
  title: string;
  slug: string;
  coverPath?: string;
  totalChapters?: number;
}

export interface Notification {
  _id: string;
  userId: string;
  type: NotificationType;
  manhwaId?: NotificationManhwaRef | string | null;
  payload: NotificationPayload;
  isRead: boolean;
  sentByEmail?: boolean;
  createdAt: string;
}

export interface ShareFilters {
  statuses: ReadingStatus[];
  favoritesOnly: boolean;
  minScore?: number;
}

export interface Share {
  _id: string;
  userId: string;
  token: string;
  title: string;
  filters: ShareFilters;
  includeProgress: boolean;
  includeNotes: boolean;
  expiresAt?: string | null;
  viewCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiErrorBody {
  message?: string;
  error?: string;
  errors?: { path?: string; param?: string; msg?: string }[];
  [key: string]: unknown;
}