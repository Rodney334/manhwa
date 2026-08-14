"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { adminService } from "@/lib/services/admin.service";
import { Cover } from "@/components/features/Cover";
import { EmptyState, Spinner, StatusBadge } from "@/components/ui/Primitives";
import { formatChapter, formatRelative } from "@/lib/utils/format";
import { toast } from "@/lib/stores/toast.store";
import { ApiError } from "@/lib/api/client";
import { useTranslations } from "@/lib/i18n/useTranslations";
import { useLocaleStore } from "@/lib/i18n/store";
import type { LibraryEntry, User } from "@/types";
import { ArrowLeft, BookOpen, Trash2 } from "lucide-react";

export default function AdminUserDetailPage() {
  const t = useTranslations("admin").accountDetail;
  const accountStatus = useTranslations("common").accountStatus;
  const readingStatus = useTranslations("common").readingStatus;
  const locale = useLocaleStore((s) => s.locale);
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [library, setLibrary] = useState<LibraryEntry[] | null>(null);
  const [libraryLoaded, setLibraryLoaded] = useState(false);
  const [busy, setBusy] = useState(false);

  const loadUser = useCallback(async () => {
    try {
      const u = await adminService.user(params.id);
      setUser(u);
    } catch {
      toast.error(t.notFound);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  // Consultation volontairement manuelle (pas au chargement) : chaque appel
  // est tracé dans le journal d'audit côté backend avec le motif fourni.
  async function handleViewLibrary() {
    const reason = window.prompt(t.viewLibraryPrompt);
    if (reason === null) return; // annulé

    try {
      const res = await adminService.userLibrary(params.id, {
        pageSize: 60,
        reason: reason.trim() || undefined,
      });
      setLibrary(res.items);
      setLibraryLoaded(true);
    } catch {
      toast.error(t.libraryLoadError);
    }
  }

  async function handleRemove() {
    if (!user) return;
    if (!window.confirm(t.confirmDelete.replace("{username}", user.username))) {
      return;
    }
    setBusy(true);
    try {
      await adminService.removeUser(user._id);
      toast.success(t.deleted);
      router.push("/app/admin/comptes");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : t.deleteError);
      setBusy(false);
    }
  }

  if (!user) {
    return (
      <div className="flex justify-center py-24">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <Link
        href="/app/admin/comptes"
        className="flex items-center gap-1.5 text-[13px] text-txt3 hover:text-txt transition-colors w-fit"
      >
        <ArrowLeft size={14} /> {t.backToAccounts}
      </Link>

      <div className="rounded-2xl border border-ligne bg-sur/60 p-6 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-[24px] font-normal">{user.username}</h1>
            <p className="text-[13px] text-txt3 mt-0.5">{user.email}</p>
          </div>
          <StatusBadge
            status={user.status === "active" ? "reading" : "dropped"}
            label={accountStatus[user.status]}
          />
        </div>

        <div className="flex flex-wrap gap-x-5 gap-y-1 text-[12.5px] text-txt3 font-mono">
          <span>{t.roleLabel.replace("{role}", user.role)}</span>
          <span suppressHydrationWarning>
            {t.joined.replace("{relative}", formatRelative(user.createdAt, locale))}
          </span>
          {user.lastLoginAt && (
            <span suppressHydrationWarning>
              {t.lastLogin.replace("{relative}", formatRelative(user.lastLoginAt, locale))}
            </span>
          )}
        </div>

        {user.statusReason && (
          <p className="text-[12.5px] text-txt3">
            {t.statusReasonLabel} <span className="text-txt2">{user.statusReason}</span>
          </p>
        )}

        {user.contributionStats && (
          <div className="flex gap-4 text-[12px] text-txt3 font-mono pt-1 border-t border-ligne mt-1">
            <span>{t.contributionsSubmitted.replace("{n}", String(user.contributionStats.submitted))}</span>
            <span className="text-vert">
              {t.contributionsApproved.replace("{n}", String(user.contributionStats.approved))}
            </span>
            <span className="text-rouge">
              {t.contributionsRejected.replace("{n}", String(user.contributionStats.rejected))}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-[17px] font-normal">{t.libraryHeading}</h2>
          {!libraryLoaded && (
            <button
              onClick={handleViewLibrary}
              className="flex items-center gap-1.5 text-[12.5px] font-medium rounded-lg px-3 py-1.5 bg-sur2 border border-ligne text-txt2 hover:border-ligne2 transition-colors"
            >
              <BookOpen size={13} /> {t.viewLibrary}
            </button>
          )}
        </div>

        {libraryLoaded && library !== null && library.length === 0 && (
          <EmptyState icon={<BookOpen size={24} />} title={t.libraryEmpty} />
        )}

        {libraryLoaded && library !== null && library.length > 0 && (
          <div className="flex flex-col">
            {library.map((entry) => (
              <div
                key={entry._id}
                className="flex items-center gap-3 py-2.5 border-b border-ligne text-[13px]"
              >
                {entry.manhwa ? (
                  <Cover manhwa={entry.manhwa} className="w-8 h-11 rounded shrink-0" />
                ) : (
                  <div className="w-8 h-11 rounded shrink-0 bg-sur2" />
                )}
                <span className="flex-1 truncate">{entry.manhwa?.title ?? t.deletedEntry}</span>
                <span className="text-[11.5px] text-txt3 font-mono">
                  ch. {formatChapter(entry.currentChapter)}
                </span>
                <span className="text-[11px] text-txt3 font-mono w-20 text-right">
                  {readingStatus[entry.status] ?? entry.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-rouge/30 bg-rouge-t/40 p-5 flex flex-col gap-3 mt-2">
        <h2 className="font-display text-[15px] font-normal text-txt">{t.dangerZoneTitle}</h2>
        <p className="text-[12px] text-txt3">{t.dangerZoneText}</p>
        <button
          onClick={handleRemove}
          disabled={busy}
          className="self-start flex items-center gap-2 bg-rouge/90 text-white font-medium text-[13px] rounded-lg px-4 py-2 hover:brightness-110 transition-all disabled:opacity-60"
        >
          <Trash2 size={14} /> {t.deleteAccount}
        </button>
      </div>
    </div>
  );
}