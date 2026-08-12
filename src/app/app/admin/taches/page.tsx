"use client";

import { useEffect, useState } from "react";
import { adminService, type JobsOverview } from "@/lib/services/admin.service";
import { EmptyState, Spinner } from "@/components/ui/Primitives";
import { formatRelative } from "@/lib/utils/format";
import { toast } from "@/lib/stores/toast.store";
import { Cog, Play } from "lucide-react";

export default function TachesPage() {
  const [overview, setOverview] = useState<JobsOverview | null>(null);
  const [running, setRunning] = useState<string | null>(null);

  async function load() {
    try {
      const res = await adminService.jobs();
      setOverview(res);
    } catch {
      toast.error("Impossible de charger les tâches.");
      setOverview({ available: [], history: [] });
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleRun(name: string) {
    setRunning(name);
    try {
      await adminService.runJob(name);
      toast.success(`Tâche « ${name} » lancée.`);
      setTimeout(load, 1500);
    } catch {
      toast.error("Échec du lancement.");
    } finally {
      setRunning(null);
    }
  }

  return (
    <div className="flex flex-col gap-8 max-w-2xl">
      <div>
        <h1 className="font-display text-[28px] font-normal">Tâches</h1>
        <p className="text-[13.5px] text-txt3 mt-1">Tâches de synchronisation planifiées côté serveur.</p>
      </div>

      {overview === null && (
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      )}

      {overview !== null && overview.available.length === 0 && (
        <EmptyState icon={<Cog size={26} />} title="Aucune tâche disponible" />
      )}

      {overview !== null && overview.available.length > 0 && (
        <div className="flex flex-col gap-2">
          {overview.available.map((name) => (
            <div
              key={name}
              className="flex items-center gap-3 rounded-xl border border-ligne bg-sur/60 px-4 py-3"
            >
              <p className="flex-1 text-[13.5px] font-medium font-mono">{name}</p>
              <button
                onClick={() => handleRun(name)}
                disabled={running === name}
                className="flex items-center gap-1.5 text-[12px] font-medium rounded-lg px-3 py-1.5 bg-vert-t text-vert hover:bg-vert hover:text-[#05130c] transition-colors disabled:opacity-60"
              >
                <Play size={12} /> Lancer
              </button>
            </div>
          ))}
        </div>
      )}

      {overview !== null && overview.history.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-[13px] uppercase tracking-wider text-txt3 font-mono">
            Historique des exécutions
          </h2>
          <div className="flex flex-col">
            {overview.history.slice(0, 15).map((run, i) => (
              <div
                key={`${run.name}-${run.startedAt}-${i}`}
                className="flex items-center gap-3 py-2.5 border-b border-ligne text-[13px]"
              >
                <span
                  className="font-mono text-[11.5px] text-txt3 w-24 shrink-0"
                  suppressHydrationWarning
                >
                  {formatRelative(run.startedAt)}
                </span>
                <span className="font-mono text-vert text-[12px]">{run.name}</span>
                <span className="text-txt3 text-[11.5px] ml-auto">
                  {run.processed} traités · {run.updated} mis à jour
                  {run.errors.length > 0 ? ` · ${run.errors.length} erreur(s)` : ""}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}