"use client";

import { useEffect, useRef, useState } from "react";
import { libraryService, type ReadingWrapped } from "@/lib/services/library.service";
import { Cover } from "@/components/features/Cover";
import { Spinner } from "@/components/ui/Primitives";
import { toast } from "@/lib/stores/toast.store";
import { cn } from "@/lib/utils/format";
import { Download, Flame, Loader2 } from "lucide-react";

const JOURS = [
  "Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi",
];

export function ReadingWrappedCard() {
  const [period, setPeriod] = useState<"month" | "year">("month");
  const [wrapped, setWrapped] = useState<ReadingWrapped | null>(null);
  const [exporting, setExporting] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setWrapped(null);
    libraryService
      .wrapped(period)
      .then(setWrapped)
      .catch(() => toast.error("Impossible de charger le bilan."));
  }, [period]);

  async function handleExport() {
    if (!cardRef.current) return;
    setExporting(true);
    try {
      // Import dynamique : cette librairie ne sert qu'à l'export d'image,
      // pas la peine de l'embarquer dans le bundle initial de la page.
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 3,
        backgroundColor: "#0a0b0d",
      });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `manhwalist-bilan-${period}.png`;
      a.click();
    } catch {
      toast.error("Échec de l'export de l'image.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-[13px] uppercase tracking-wider text-txt3 font-mono">
          Bilan de lecture
        </h2>
        <div className="flex gap-1.5">
          <button
            onClick={() => setPeriod("month")}
            className={cn(
              "px-3 py-1 rounded-full text-[11.5px] font-medium transition-colors",
              period === "month" ? "bg-vert text-[#05130c]" : "bg-sur2 text-txt3 hover:text-txt",
            )}
          >
            Ce mois-ci
          </button>
          <button
            onClick={() => setPeriod("year")}
            className={cn(
              "px-3 py-1 rounded-full text-[11.5px] font-medium transition-colors",
              period === "year" ? "bg-vert text-[#05130c]" : "bg-sur2 text-txt3 hover:text-txt",
            )}
          >
            Cette année
          </button>
        </div>
      </div>

      {!wrapped && (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      )}

      {wrapped && (
        <div className="flex flex-col items-center gap-4">
          <div
            ref={cardRef}
            className="w-full max-w-sm aspect-[4/5] rounded-2xl bg-fond border border-ligne overflow-hidden relative flex flex-col p-7"
            style={{
              backgroundImage:
                "radial-gradient(circle at 15% 0%, rgba(38,224,126,0.16), transparent 55%)",
            }}
          >
            <div className="flex items-center gap-2">
              <i className="w-2 h-2 rounded-full bg-vert" />
              <span className="font-display text-[15px] text-txt">
                Manhwa<span className="text-vert">List</span>
              </span>
            </div>

            <p className="text-[11px] font-mono uppercase tracking-wider text-txt3 mt-6">
              {period === "month" ? "Bilan du mois" : "Bilan de l'année"}
            </p>

            <div className="mt-1">
              <span className="font-display text-[64px] leading-none text-vert">
                {wrapped.totalChaptersRead}
              </span>
              <p className="text-[13px] text-txt2 mt-1">
                chapitre{wrapped.totalChaptersRead > 1 ? "s" : ""} lu
                {wrapped.totalChaptersRead > 1 ? "s" : ""}, sur{" "}
                {wrapped.distinctSeriesCount} série{wrapped.distinctSeriesCount > 1 ? "s" : ""}
              </p>
            </div>

            <div className="flex-1" />

            <div className="flex flex-col gap-4">
              {wrapped.mostReadManhwa && (
                <div className="flex items-center gap-3">
                  <Cover
                    manhwa={wrapped.mostReadManhwa}
                    className="w-11 h-16 rounded-lg shrink-0 object-cover"
                  />
                  <div className="min-w-0">
                    <p className="text-[10.5px] font-mono uppercase tracking-wider text-txt3">
                      Série la plus lue
                    </p>
                    <p className="text-[13.5px] font-medium text-txt truncate">
                      {wrapped.mostReadManhwa.title}
                    </p>
                    <p className="text-[11px] text-txt3">
                      {wrapped.mostReadManhwa.chaptersRead} chapitre
                      {wrapped.mostReadManhwa.chaptersRead > 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                {wrapped.mostActiveDay !== null && (
                  <div>
                    <p className="text-[10.5px] font-mono uppercase tracking-wider text-txt3">
                      Jour préféré
                    </p>
                    <p className="text-[13.5px] font-medium text-txt">
                      {JOURS[wrapped.mostActiveDay]}
                    </p>
                  </div>
                )}
                {wrapped.topGenre && (
                  <div>
                    <p className="text-[10.5px] font-mono uppercase tracking-wider text-txt3">
                      Genre préféré
                    </p>
                    <p className="text-[13.5px] font-medium text-txt">{wrapped.topGenre}</p>
                  </div>
                )}
              </div>

              {wrapped.currentStreak > 0 && (
                <div className="flex items-center gap-1.5 text-or">
                  <Flame size={13} />
                  <span className="text-[12px] font-medium">
                    {wrapped.currentStreak} jour{wrapped.currentStreak > 1 ? "s" : ""} de suite
                  </span>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-2 text-[13px] font-medium rounded-lg px-4 py-2.5 bg-sur2 border border-ligne text-txt2 hover:border-ligne2 transition-colors disabled:opacity-60"
          >
            {exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            Télécharger l&apos;image
          </button>
        </div>
      )}
    </div>
  );
}