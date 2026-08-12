"use client";

import { useEffect, useState } from "react";
import { libraryService, type HeatmapDay } from "@/lib/services/library.service";
import { Spinner, EmptyState } from "@/components/ui/Primitives";
import { READING_STATUS_LABELS } from "@/lib/utils/format";
import { toast } from "@/lib/stores/toast.store";
import type { LibraryStats, ReadingStatus } from "@/types";
import { BarChart3 } from "lucide-react";

const STATUS_ORDER: ReadingStatus[] = [
  "reading",
  "plan_to_read",
  "on_hold",
  "completed",
  "dropped",
];

const MOIS_COURT = [
  "jan", "fév", "mar", "avr", "mai", "jun",
  "jul", "aoû", "sep", "oct", "nov", "déc",
];

export default function StatistiquesPage() {
  const [stats, setStats] = useState<LibraryStats | null>(null);
  const [error, setError] = useState(false);
  const [heatmap, setHeatmap] = useState<HeatmapDay[] | null>(null);

  useEffect(() => {
    libraryService
      .stats()
      .then(setStats)
      .catch(() => {
        toast.error("Impossible de charger les statistiques.");
        setError(true);
      });
    // Indépendant du reste : un échec ici ne doit pas priver la page du
    // reste des statistiques, donc pas de toast, juste une section absente.
    libraryService
      .readingHeatmap(365)
      .then(setHeatmap)
      .catch(() => setHeatmap([]));
  }, []);

  if (error) {
    return (
      <EmptyState icon={<BarChart3 size={26} />} title="Statistiques indisponibles pour le moment" />
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
        <h1 className="font-display text-[28px] font-normal">Statistiques</h1>
        <p className="text-[13.5px] text-txt3 mt-1">Ta lecture, en chiffres.</p>
      </div>

      {!hasAnyData && (
        <EmptyState
          icon={<BarChart3 size={26} />}
          title="Pas encore de données"
          subtitle="Ajoute des séries et fais avancer ta progression pour voir tes statistiques apparaître ici."
        />
      )}

      {hasAnyData && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label="Séries" value={stats.totalEntries} />
            <StatCard label="Chapitres lus" value={stats.chaptersRead} />
            <StatCard
              label="Note moyenne"
              value={stats.averageScore !== null ? stats.averageScore.toFixed(1) : "—"}
            />
            <StatCard label="Favoris" value={stats.favorites} />
          </div>

          <div className="flex flex-col gap-3">
            <h2 className="text-[13px] uppercase tracking-wider text-txt3 font-mono">Par statut</h2>
            <div className="flex flex-col gap-2.5">
              {STATUS_ORDER.map((s) => {
                const count = statusMap.get(s) ?? 0;
                return (
                  <div key={s} className="flex items-center gap-3">
                    <span className="w-24 text-[12.5px] text-txt2 shrink-0">
                      {READING_STATUS_LABELS[s]}
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
                Activité (12 derniers mois)
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
                      <span className="text-[10px] font-mono text-txt3">{MOIS_COURT[idx] ?? "?"}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {heatmap && heatmap.length > 0 && <ReadingHeatmap days={heatmap} />}

          {topGenres.length > 0 && (
            <div className="flex flex-col gap-3">
              <h2 className="text-[13px] uppercase tracking-wider text-txt3 font-mono">
                Genres les plus lus
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
function ReadingHeatmap({ days }: { days: HeatmapDay[] }) {
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
        Régularité (12 derniers mois)
      </h2>
      <div className="flex gap-[3px] overflow-x-auto pb-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-[3px]">
            {week.map((date, di) => {
              const key = date.toISOString().slice(0, 10);
              const count = byDate.get(key) ?? 0;
              const inRange = date <= today;
              return (
                <div
                  key={di}
                  title={inRange ? `${key} — ${count} chapitre${count > 1 ? "s" : ""}` : undefined}
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