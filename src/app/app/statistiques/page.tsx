"use client";

import { useEffect, useState } from "react";
import { libraryService, type HeatmapDay } from "@/lib/services/library.service";
import { ReadingWrappedCard } from "@/components/features/ReadingWrappedCard";
import { Spinner, EmptyState } from "@/components/ui/Primitives";
import { toast } from "@/lib/stores/toast.store";
import { useTranslations } from "@/lib/i18n/useTranslations";
import type { Messages } from "@/lib/i18n/messages/fr";
import type { LibraryStats, ReadingStatus } from "@/types";
import { BarChart3 } from "lucide-react";

const STATUS_ORDER: ReadingStatus[] = [
  "reading",
  "plan_to_read",
  "on_hold",
  "completed",
  "dropped",
];

export default function StatistiquesPage() {
  const t = useTranslations("statistics");
  const readingStatus = useTranslations("common").readingStatus;
  const [stats, setStats] = useState<LibraryStats | null>(null);
  const [error, setError] = useState(false);
  const [heatmap, setHeatmap] = useState<HeatmapDay[] | null>(null);

  useEffect(() => {
    libraryService
      .stats()
      .then(setStats)
      .catch(() => {
        toast.error(t.loadError);
        setError(true);
      });
    // Indépendant du reste : un échec ici ne doit pas priver la page du
    // reste des statistiques, donc pas de toast, juste une section absente.
    libraryService
      .readingHeatmap(365)
      .then(setHeatmap)
      .catch(() => setHeatmap([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return (
      <EmptyState icon={<BarChart3 size={26} />} title={t.unavailableTitle} />
    );
  }

  if (!stats) {
    return (
      <div className="flex justify-center py-24">
        <Spinner />
      </div>
    );
  }

  // byStatus arrive en tableau [{ _id: "reading", count: 5 }, ...] — on le
  // ré-indexe pour un accès simple par statut, en comblant les statuts absents.
  const statusMap = new Map(stats.byStatus.map((s) => [s._id, s.count]));
  const maxStatusCount = Math.max(1, ...STATUS_ORDER.map((s) => statusMap.get(s) ?? 0));

  const topGenres = [...stats.byGenre].sort((a, b) => b.count - a.count).slice(0, 8);
  const maxGenreCount = Math.max(1, ...topGenres.map((g) => g.count));

  // monthlyActivity arrive trié chronologiquement, format "YYYY-MM".
  const months = stats.monthlyActivity;
  const maxMonthly = Math.max(1, ...months.map((m) => m.chapters));

  const hasAnyData = stats.totalEntries > 0;

  return (
    <div className="flex flex-col gap-9 max-w-3xl">
      <div>
        <h1 className="font-display text-[28px] font-normal">{t.title}</h1>
        <p className="text-[13.5px] text-txt3 mt-1">{t.subtitle}</p>
      </div>

      {!hasAnyData && (
        <EmptyState
          icon={<BarChart3 size={26} />}
          title={t.emptyTitle}
          subtitle={t.emptySubtitle}
        />
      )}

      {hasAnyData && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label={t.statSeries} value={stats.totalEntries} />
            <StatCard label={t.statChaptersRead} value={stats.chaptersRead} />
            <StatCard
              label={t.statAverageScore}
              value={stats.averageScore !== null ? stats.averageScore.toFixed(1) : "—"}
            />
            <StatCard label={t.statFavorites} value={stats.favorites} />
          </div>

          <div className="flex flex-col gap-3">
            <h2 className="text-[13px] uppercase tracking-wider text-txt3 font-mono">{t.byStatus}</h2>
            <div className="flex flex-col gap-2.5">
              {STATUS_ORDER.map((s) => {
                const count = statusMap.get(s) ?? 0;
                return (
                  <div key={s} className="flex items-center gap-3">
                    <span className="w-24 text-[12.5px] text-txt2 shrink-0">
                      {readingStatus[s]}
                    </span>
                    <div className="flex-1 h-6 rounded-lg bg-sur2 overflow-hidden">
                      <div
                        className="h-full bg-vert/70 rounded-lg transition-[width] duration-500"
                        style={{ width: `${(count / maxStatusCount) * 100}%` }}
                      />
                    </div>
                    <span className="w-8 text-right text-[12.5px] font-mono text-txt3">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {months.length > 0 && (
            <div className="flex flex-col gap-3">
              <h2 className="text-[13px] uppercase tracking-wider text-txt3 font-mono">
                {t.activity}
              </h2>
              <div className="flex items-end gap-1.5 h-32 border-b border-ligne pb-1">
                {months.map((m) => {
                  const [, monthNum] = m._id.split("-");
                  const idx = Number(monthNum) - 1;
                  const heightPct = Math.max(4, (m.chapters / maxMonthly) * 100);
                  return (
                    <div key={m._id} className="flex-1 flex flex-col items-center gap-1.5 group">
                      <span className="text-[10px] font-mono text-txt3 opacity-0 group-hover:opacity-100 transition-opacity">
                        {m.chapters}
                      </span>
                      <div
                        className="w-full rounded-t bg-vert/60 group-hover:bg-vert transition-colors"
                        style={{ height: `${heightPct}%` }}
                      />
                      <span className="text-[10px] font-mono text-txt3">{t.monthsShort[idx] ?? "?"}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {heatmap && heatmap.length > 0 && <ReadingHeatmap days={heatmap} t={t} />}

          <ReadingWrappedCard />

          {topGenres.length > 0 && (
            <div className="flex flex-col gap-3">
              <h2 className="text-[13px] uppercase tracking-wider text-txt3 font-mono">
                {t.topGenres}
              </h2>
              <div className="flex flex-col gap-2.5">
                {topGenres.map((g) => (
                  <div key={g._id} className="flex items-center gap-3">
                    <span className="w-28 text-[12.5px] text-txt2 shrink-0 truncate">{g._id}</span>
                    <div className="flex-1 h-5 rounded-lg bg-sur2 overflow-hidden">
                      <div
                        className="h-full bg-or/60 rounded-lg transition-[width] duration-500"
                        style={{ width: `${(g.count / maxGenreCount) * 100}%` }}
                      />
                    </div>
                    <span className="w-8 text-right text-[12.5px] font-mono text-txt3">{g.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-ligne bg-sur/60 px-4 py-3.5">
      <div className="text-[22px] font-mono font-medium text-vert">{value}</div>
      <div className="text-[11.5px] text-txt3 mt-0.5">{label}</div>
    </div>
  );
}

// Grille façon "contributions" — une colonne par semaine, 7 lignes
// (dimanche en haut). L'intensité de vert reflète le nombre de chapitres
// lus ce jour-là, relatif au jour le plus actif de la période affichée.
function ReadingHeatmap({ days, t }: { days: HeatmapDay[]; t: Messages["statistics"] }) {
  const byDate = new Map(days.map((d) => [d.date, d.chaptersRead]));
  const max = Math.max(1, ...days.map((d) => d.chaptersRead));

  const today = new Date();
  const start = new Date(today);
  start.setDate(start.getDate() - 364);
  // Recule jusqu'au dimanche précédent pour que chaque colonne représente
  // une semaine complète et alignée, comme sur GitHub.
  start.setDate(start.getDate() - start.getDay());

  const weeks: Date[][] = [];
  const cursor = new Date(start);
  while (cursor <= today) {
    const week: Date[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
  }

  function intensity(count: number): string {
    if (count === 0) return "bg-sur2";
    const ratio = count / max;
    if (ratio > 0.75) return "bg-vert";
    if (ratio > 0.45) return "bg-vert/70";
    if (ratio > 0.15) return "bg-vert/45";
    return "bg-vert/25";
  }

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-[13px] uppercase tracking-wider text-txt3 font-mono">
        {t.heatmapTitle}
      </h2>
      <div className="flex gap-[3px] overflow-x-auto pb-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-[3px]">
            {week.map((date, di) => {
              const key = date.toISOString().slice(0, 10);
              const count = byDate.get(key) ?? 0;
              const inRange = date <= today;
              const tooltip = (count > 1 ? t.heatmapTooltipMany : t.heatmapTooltipOne)
                .replace("{date}", key)
                .replace("{count}", String(count));
              return (
                <div
                  key={di}
                  title={inRange ? tooltip : undefined}
                  className={`w-[11px] h-[11px] rounded-[2px] ${inRange ? intensity(count) : "bg-transparent"}`}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}