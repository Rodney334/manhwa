"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminService, type AdminDashboard } from "@/lib/services/admin.service";
import { Spinner } from "@/components/ui/Primitives";
import { READING_STATUS_LABELS } from "@/lib/utils/format";
import { toast } from "@/lib/stores/toast.store";
import type { ReadingStatus } from "@/types";
import { Users, BookOpen, TrendingUp, Star, Activity } from "lucide-react";

export default function AdminOverviewPage() {
  const [data, setData] = useState<AdminDashboard | null>(null);
  const [erreur, setErreur] = useState(false);

  useEffect(() => {
    adminService
      .dashboard()
      .then(setData)
      .catch(() => {
        setErreur(true);
        toast.error("Impossible de charger la vue d'ensemble.");
      });
  }, []);

  if (erreur) {
    return (
      <p className="text-[13.5px] text-txt3 py-24 text-center">
        La vue d'ensemble n'a pas pu être chargée.
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
        <h1 className="font-display text-[28px] font-normal">Vue d'ensemble</h1>
        <p className="text-[13.5px] text-txt3 mt-1">
          Ce qui se passe réellement sur la plateforme, en un coup d'œil.
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
          réellement fait avancer une lecture ces 30 derniers jours — c'est ce dernier chiffre
          qui reflète l'usage réel.
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
              <Link
                key={m.manhwaId}
                href={`/app/manhwa/${m.slug}`}
                className="flex items-center gap-3 py-2.5 border-b border-ligne text-[13px] hover:text-vert transition-colors"
              >
                <span className="w-5 text-txt3 font-mono text-[11px]">{i + 1}</span>
                <span className="flex-1 truncate">{m.title}</span>
                {m.avgScore > 0 && (
                  <span className="flex items-center gap-1 text-[11.5px] text-or font-mono">
                    <Star size={11} className="fill-or" /> {m.avgScore.toFixed(1)}
                  </span>
                )}
                <span className="text-[11.5px] text-txt3 font-mono w-24 text-right">
                  {m.followers} lecteur{m.followers > 1 ? "s" : ""}
                </span>
              </Link>
            ))}
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