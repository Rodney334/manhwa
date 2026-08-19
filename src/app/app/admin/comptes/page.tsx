"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminService, type AdminDashboard, type ManhwaReader } from "@/lib/services/admin.service";
import { Spinner } from "@/components/ui/Primitives";
import { READING_STATUS_LABELS } from "@/lib/utils/format";
import { toast } from "@/lib/stores/toast.store";
import { useAuthStore } from "@/lib/stores/auth.store";
import type { ReadingStatus } from "@/types";
import { Users, BookOpen, TrendingUp, Star, Activity, Pencil, Check, X } from "lucide-react";

export default function AdminOverviewPage() {
  const isAdmin = useAuthStore((s) => s.user?.role === "admin");
  const [data, setData] = useState<AdminDashboard | null>(null);
  const [erreur, setErreur] = useState(false);
  const [siteName, setSiteName] = useState<string | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [editingLabelId, setEditingLabelId] = useState<string | null>(null);
  const [labelInput, setLabelInput] = useState("");
  const [readersFor, setReadersFor] = useState<{ manhwaId: string; title: string } | null>(null);
  const [readers, setReaders] = useState<ManhwaReader[] | null>(null);

  useEffect(() => {
    adminService
      .dashboard()
      .then(setData)
      .catch(() => {
        setErreur(true);
        toast.error("Impossible de charger la vue d'ensemble.");
      });

    adminService
      .getSettings()
      .then((res) => setSiteName(res.siteName))
      .catch(() => {
        // silencieux : le nom par défaut reste affiché
      });
  }, []);

  function startEditingName() {
    setNameInput(siteName ?? "");
    setEditingName(true);
  }

  async function saveSiteName() {
    const trimmed = nameInput.trim();
    setSavingName(true);
    try {
      const res = await adminService.updateSettings({ siteName: trimmed || null });
      setSiteName(res.siteName);
      setEditingName(false);
      toast.success(trimmed ? "Nom mis à jour." : "Nom par défaut restauré.");
    } catch {
      toast.error("Échec de la mise à jour du nom.");
    } finally {
      setSavingName(false);
    }
  }

  async function saveManhwaLabel(manhwaId: string) {
    const trimmed = labelInput.trim();
    try {
      const res = await adminService.setManhwaAdminLabel(manhwaId, trimmed || null);
      setData((prev) =>
        prev
          ? {
              ...prev,
              topManhwa: prev.topManhwa.map((m) =>
                m.manhwaId === manhwaId ? { ...m, adminLabel: res.adminLabel } : m,
              ),
            }
          : prev,
      );
      setEditingLabelId(null);
      toast.success(trimmed ? "Alias enregistré." : "Alias retiré.");
    } catch {
      toast.error("Échec de l'enregistrement de l'alias.");
    }
  }

  async function openReaders(manhwaId: string, title: string) {
    setReadersFor({ manhwaId, title });
    setReaders(null);
    try {
      const items = await adminService.manhwaReaders(manhwaId);
      setReaders(items);
    } catch {
      toast.error("Impossible de charger les lecteurs.");
      setReaders([]);
    }
  }

  if (erreur) {
    return (
      <p className="text-[13.5px] text-txt3 py-24 text-center">
        La vue d&apos;ensemble n&apos;a pas pu être chargée.
      </p>
    );
  }

  if (!data) {
    return (
      <div className="flex justify-center py-24">
        <Spinner />
      </div>
    );
  }

  const byStatus = data.library?.byStatus ?? [];
  const maxStatus = Math.max(1, ...byStatus.map((s) => s.count));
  const topManhwa = data.topManhwa ?? [];
  const topContributors = data.topContributors ?? [];

  return (
    <div className="flex flex-col gap-9 max-w-4xl">
      <div>
        {!editingName && (
          <div className="flex items-center gap-2 group">
            <h1 className="font-display text-[28px] font-normal">
              {siteName || "Vue d'ensemble"}
            </h1>
            {isAdmin && (
              <button
                onClick={startEditingName}
                className="opacity-0 group-hover:opacity-100 text-txt3 hover:text-vert transition-all p-1"
                aria-label="Modifier le nom"
              >
                <Pencil size={14} />
              </button>
            )}
          </div>
        )}

        {editingName && (
          <div className="flex items-center gap-2">
            <input
              autoFocus
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveSiteName();
                if (e.key === "Escape") setEditingName(false);
              }}
              maxLength={60}
              placeholder="Vue d'ensemble"
              className="font-display text-[28px] font-normal bg-transparent border-b border-vert/40 outline-none focus:border-vert transition-colors max-w-md"
            />
            <button
              onClick={saveSiteName}
              disabled={savingName}
              className="text-vert hover:brightness-125 transition-all p-1 disabled:opacity-60"
              aria-label="Enregistrer"
            >
              <Check size={16} />
            </button>
            <button
              onClick={() => setEditingName(false)}
              className="text-txt3 hover:text-txt transition-colors p-1"
              aria-label="Annuler"
            >
              <X size={16} />
            </button>
          </div>
        )}

        <p className="text-[13.5px] text-txt3 mt-1">
          Ce qui se passe réellement sur la plateforme, en un coup d&apos;œil.
        </p>
      </div>

      {/* ── Indicateurs clés ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <BigStat
          icon={<Users size={16} />}
          label="Comptes"
          value={data.accounts?.total ?? 0}
          sub={`+${data.accounts?.newLast30Days ?? 0} ce mois-ci`}
        />
        <BigStat
          icon={<Activity size={16} />}
          label="Lecteurs actifs (7j)"
          value={data.engagement?.readersLast7Days ?? 0}
          sub={`${data.engagement?.readersLast30Days ?? 0} sur 30 jours`}
          accent="or"
        />
        <BigStat
          icon={<BookOpen size={16} />}
          label="Chapitres lus"
          value={data.library?.chaptersRead ?? 0}
          sub={`${data.library?.totalEntries ?? 0} entrées en bibliothèque`}
        />
        <BigStat
          icon={<TrendingUp size={16} />}
          label="Catalogue"
          value={data.catalog?.approved ?? 0}
          sub={`${data.catalog?.pending ?? 0} en attente de modération`}
        />
      </div>

      {/* ── Engagement : pourquoi "lecteurs actifs" ≠ "comptes actifs" ── */}
      <div className="rounded-xl border border-ligne bg-sur/60 px-4 py-3.5 flex items-start gap-3">
        <Activity size={15} className="text-or mt-0.5 shrink-0" />
        <p className="text-[12.5px] text-txt2 leading-relaxed">
          <span className="text-txt font-medium">{data.accounts?.active ?? 0}</span> comptes ne sont
          pas suspendus, mais seuls{" "}
          <span className="text-or font-medium">{data.engagement?.readersLast30Days ?? 0}</span> ont
          réellement fait avancer une lecture ces 30 derniers jours — c&apos;est ce dernier chiffre
          qui reflète l&apos;usage réel.
        </p>
      </div>

      {/* ── Répartition des lectures par statut ─────────────────────── */}
      {byStatus.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-[13px] uppercase tracking-wider text-txt3 font-mono">
            Bibliothèques — répartition par statut
          </h2>
          <div className="flex flex-col gap-2.5">
            {byStatus.map((s) => (
              <div key={s._id} className="flex items-center gap-3">
                <span className="w-28 text-[12.5px] text-txt2 shrink-0">
                  {READING_STATUS_LABELS[s._id as ReadingStatus] ?? s._id}
                </span>
                <div className="flex-1 h-5 rounded-lg bg-sur2 overflow-hidden">
                  <div
                    className="h-full bg-vert/70 rounded-lg transition-[width] duration-500"
                    style={{ width: `${(s.count / maxStatus) * 100}%` }}
                  />
                </div>
                <span className="w-10 text-right text-[12.5px] font-mono text-txt3">{s.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Titres les plus suivis ───────────────────────────────────── */}
      {topManhwa.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-[13px] uppercase tracking-wider text-txt3 font-mono">
            Titres les plus suivis
          </h2>
          <div className="flex flex-col">
            {topManhwa.slice(0, 10).map((m, i) => (
              <div
                key={m.manhwaId}
                className="flex items-center gap-3 py-2.5 border-b border-ligne text-[13px] group"
              >
                <span className="w-5 text-txt3 font-mono text-[11px] shrink-0">{i + 1}</span>

                {editingLabelId === m.manhwaId ? (
                  <div className="flex-1 flex items-center gap-2 min-w-0">
                    <input
                      autoFocus
                      value={labelInput}
                      onChange={(e) => setLabelInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveManhwaLabel(m.manhwaId);
                        if (e.key === "Escape") setEditingLabelId(null);
                      }}
                      maxLength={80}
                      placeholder={m.title}
                      className="flex-1 min-w-0 bg-transparent border-b border-vert/40 outline-none focus:border-vert transition-colors text-[13px]"
                    />
                    <button
                      onClick={() => saveManhwaLabel(m.manhwaId)}
                      className="text-vert hover:brightness-125 transition-all shrink-0"
                      aria-label="Enregistrer l'alias"
                    >
                      <Check size={14} />
                    </button>
                    <button
                      onClick={() => setEditingLabelId(null)}
                      className="text-txt3 hover:text-txt transition-colors shrink-0"
                      aria-label="Annuler"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="flex-1 min-w-0 flex items-center gap-1.5">
                    <Link
                      href={`/app/manhwa/${m.slug}`}
                      className="truncate hover:text-vert transition-colors"
                      title={m.adminLabel ? m.title : undefined}
                    >
                      {m.adminLabel || m.title}
                    </Link>
                    {isAdmin && (
                      <button
                        onClick={() => {
                          setEditingLabelId(m.manhwaId);
                          setLabelInput(m.adminLabel ?? "");
                        }}
                        className="opacity-0 group-hover:opacity-100 text-txt3 hover:text-vert transition-all shrink-0"
                        aria-label="Modifier l'alias interne"
                      >
                        <Pencil size={12} />
                      </button>
                    )}
                  </div>
                )}

                {m.avgScore > 0 && (
                  <span className="flex items-center gap-1 text-[11.5px] text-or font-mono shrink-0">
                    <Star size={11} className="fill-or" /> {m.avgScore.toFixed(1)}
                  </span>
                )}

                <button
                  onClick={() => openReaders(m.manhwaId, m.adminLabel || m.title)}
                  className="text-[11.5px] text-txt3 hover:text-vert font-mono w-24 text-right shrink-0 transition-colors"
                >
                  {m.followers} lecteur{m.followers > 1 ? "s" : ""}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Modale : lecteurs d'une fiche ───────────────────────────── */}
      {readersFor && (
        <div
          className="fixed inset-0 z-50 bg-fond/80 backdrop-blur-sm flex items-center justify-center px-4"
          onClick={() => setReadersFor(null)}
        >
          <div
            className="bg-sur border border-ligne rounded-2xl w-full max-w-sm max-h-[70vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-ligne">
              <h3 className="font-display text-[16px] font-normal truncate pr-3">
                {readersFor.title}
              </h3>
              <button
                onClick={() => setReadersFor(null)}
                className="text-txt3 hover:text-txt transition-colors shrink-0"
              >
                <X size={16} />
              </button>
            </div>
            <div className="overflow-y-auto flex-1">
              {readers === null && (
                <div className="flex justify-center py-8">
                  <Spinner />
                </div>
              )}
              {readers !== null && readers.length === 0 && (
                <p className="text-[12.5px] text-txt3 text-center py-8">Aucun lecteur.</p>
              )}
              {readers !== null &&
                readers.map((r) => (
                  <div
                    key={r.userId}
                    className="flex items-center gap-3 px-5 py-2.5 border-b border-ligne last:border-0 text-[13px]"
                  >
                    <span className="flex-1 truncate">{r.username}</span>
                    <span className="text-[11px] text-txt3 font-mono">
                      {READING_STATUS_LABELS[r.status as ReadingStatus] ?? r.status}
                    </span>
                    <span className="text-[11px] text-txt3 font-mono w-10 text-right">
                      ch.{r.currentChapter}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Contributeurs les plus actifs ────────────────────────────── */}
      {topContributors.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-[13px] uppercase tracking-wider text-txt3 font-mono">
            Contributeurs les plus actifs
          </h2>
          <div className="flex flex-col">
            {topContributors.slice(0, 8).map((c) => (
              <div
                key={c._id}
                className="flex items-center gap-3 py-2.5 border-b border-ligne text-[13px]"
              >
                <span className="flex-1 truncate">{c.username}</span>
                <span className="text-[11.5px] text-vert font-mono">
                  {c.contributionStats?.approved ?? 0} validées
                </span>
                <span className="text-[11.5px] text-txt3 font-mono w-16 text-right">
                  {c.contributionStats?.submitted ?? 0} soumises
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Trajectoire d'autonomie (déjà calculée côté backend) ────── */}
      <div className="flex flex-col gap-3">
        <h2 className="text-[13px] uppercase tracking-wider text-txt3 font-mono">
          Autonomie du catalogue
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <MiniStat
            label="Catalogue interne"
            value={`${data.autonomy?.catalogAutonomyRate ?? 0}%`}
          />
          <MiniStat label="Couvertures locales" value={`${data.autonomy?.localCoverRate ?? 0}%`} />
          <MiniStat label="Fiches vérifiées" value={`${data.autonomy?.verifiedRate ?? 0}%`} />
          <MiniStat
            label="Contributions (30j)"
            value={String(data.autonomy?.approvedContributionsLast30Days ?? 0)}
          />
        </div>
      </div>
    </div>
  );
}

function BigStat({
  icon,
  label,
  value,
  sub,
  accent = "vert",
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  sub?: string;
  accent?: "vert" | "or";
}) {
  return (
    <div className="rounded-xl border border-ligne bg-sur/60 px-4 py-3.5">
      <div className={`flex items-center gap-1.5 ${accent === "or" ? "text-or" : "text-vert"}`}>
        {icon}
      </div>
      <div className="text-[24px] font-mono font-medium mt-1.5">{value.toLocaleString("fr-FR")}</div>
      <div className="text-[11.5px] text-txt3 mt-0.5">{label}</div>
      {sub && <div className="text-[10.5px] text-txt3 mt-1 font-mono">{sub}</div>}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-ligne bg-sur/60 px-3.5 py-3">
      <div className="text-[17px] font-mono font-medium text-txt">{value}</div>
      <div className="text-[11px] text-txt3 mt-0.5">{label}</div>
    </div>
  );
}