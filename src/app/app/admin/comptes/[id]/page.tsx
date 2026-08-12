"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { adminService } from "@/lib/services/admin.service";
import { Cover } from "@/components/features/Cover";
import { EmptyState, Spinner, StatusBadge } from "@/components/ui/Primitives";
import { READING_STATUS_LABELS, formatChapter, formatRelative } from "@/lib/utils/format";
import { toast } from "@/lib/stores/toast.store";
import { ApiError } from "@/lib/api/client";
import type { AccountStatus, LibraryEntry, User } from "@/types";
import { ArrowLeft, BookOpen, Trash2 } from "lucide-react";

const STATUS_LABELS: Record<AccountStatus, string> = {
  active: "Actif",
  suspended: "Suspendu",
  banned: "Banni",
};

export default function AdminUserDetailPage() {
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
      toast.error("Compte introuvable.");
    }
  }, [params.id]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  // Consultation volontairement manuelle (pas au chargement) : chaque appel
  // est tracé dans le journal d'audit côté backend avec le motif fourni.
  async function handleViewLibrary() {
    const reason = window.prompt(
      "Motif de la consultation (repris dans le journal d'audit, facultatif) :",
    );
    if (reason === null) return; // annulé

    try {
      const res = await adminService.userLibrary(params.id, {
        pageSize: 60,
        reason: reason.trim() || undefined,
      });
      setLibrary(res.items);
      setLibraryLoaded(true);
    } catch {
      toast.error("Impossible de charger la bibliothèque de ce compte.");
    }
  }

  async function handleRemove() {
    if (!user) return;
    if (
      !window.confirm(
        `Supprimer définitivement le compte de ${user.username} ? Cette action est irréversible.`,
      )
    ) {
      return;
    }
    setBusy(true);
    try {
      await adminService.removeUser(user._id);
      toast.success("Compte supprimé.");
      router.push("/app/admin/comptes");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Échec de la suppression.");
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
        <ArrowLeft size={14} /> Retour aux comptes
      </Link>

      <div className="rounded-2xl border border-ligne bg-sur/60 p-6 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-[24px] font-normal">{user.username}</h1>
            <p className="text-[13px] text-txt3 mt-0.5">{user.email}</p>
          </div>
          <StatusBadge
            status={user.status === "active" ? "reading" : "dropped"}
            label={STATUS_LABELS[user.status]}
          />
        </div>

        <div className="flex flex-wrap gap-x-5 gap-y-1 text-[12.5px] text-txt3 font-mono">
          <span>Rôle : {user.role}</span>
          <span suppressHydrationWarning>Inscrit {formatRelative(user.createdAt)}</span>
          {user.lastLoginAt && (
            <span suppressHydrationWarning>
              Dernière connexion {formatRelative(user.lastLoginAt)}
            </span>
          )}
        </div>

        {user.statusReason && (
          <p className="text-[12.5px] text-txt3">
            Motif du statut actuel : <span className="text-txt2">{user.statusReason}</span>
          </p>
        )}

        {user.contributionStats && (
          <div className="flex gap-4 text-[12px] text-txt3 font-mono pt-1 border-t border-ligne mt-1">
            <span>{user.contributionStats.submitted} soumises</span>
            <span className="text-vert">{user.contributionStats.approved} validées</span>
            <span className="text-rouge">{user.contributionStats.rejected} refusées</span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-[17px] font-normal">Bibliothèque</h2>
          {!libraryLoaded && (
            <button
              onClick={handleViewLibrary}
              className="flex items-center gap-1.5 text-[12.5px] font-medium rounded-lg px-3 py-1.5 bg-sur2 border border-ligne text-txt2 hover:border-ligne2 transition-colors"
            >
              <BookOpen size={13} /> Consulter (tracé)
            </button>
          )}
        </div>

        {libraryLoaded && library !== null && library.length === 0 && (
          <EmptyState icon={<BookOpen size={24} />} title="Bibliothèque vide" />
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
                <span className="flex-1 truncate">{entry.manhwa?.title ?? "Fiche supprimée"}</span>
                <span className="text-[11.5px] text-txt3 font-mono">
                  ch. {formatChapter(entry.currentChapter)}
                </span>
                <span className="text-[11px] text-txt3 font-mono w-20 text-right">
                  {READING_STATUS_LABELS[entry.status] ?? entry.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-rouge/30 bg-rouge-t/40 p-5 flex flex-col gap-3 mt-2">
        <h2 className="font-display text-[15px] font-normal text-txt">Zone dangereuse</h2>
        <p className="text-[12px] text-txt3">
          Supprime définitivement ce compte et toutes ses données. Irréversible.
        </p>
        <button
          onClick={handleRemove}
          disabled={busy}
          className="self-start flex items-center gap-2 bg-rouge/90 text-white font-medium text-[13px] rounded-lg px-4 py-2 hover:brightness-110 transition-all disabled:opacity-60"
        >
          <Trash2 size={14} /> Supprimer ce compte
        </button>
      </div>
    </div>
  );
}