"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { libraryService, type ReadingWrapped } from "@/lib/services/library.service";
import { Cover } from "@/components/features/Cover";
import { Spinner } from "@/components/ui/Primitives";
import { toast } from "@/lib/stores/toast.store";
import { cn } from "@/lib/utils/format";
import { useTranslations } from "@/lib/i18n/useTranslations";
import { Download, Flame, Loader2 } from "lucide-react";

type Period = "month" | "year" | "last-month" | "last-year";

function isValidPeriod(value: string | null): value is Period {
  return value === "month" || value === "year" || value === "last-month" || value === "last-year";
}

// `useSearchParams()` exige une frontière Suspense en Next 15 — isolée ici
// pour que la page qui accueille cette carte n'ait pas à s'en soucier.
export function ReadingWrappedCard() {
  return (
    <Suspense fallback={<div className="flex justify-center py-16"><Spinner /></div>}>
      <ReadingWrappedCardContent />
    </Suspense>
  );
}

function ReadingWrappedCardContent() {
  const t = useTranslations("wrapped");
  const days = useTranslations("calendar").days;
  const searchParams = useSearchParams();
  const deepLinkedPeriod = searchParams.get("period");
  const initialPeriod: Period = isValidPeriod(deepLinkedPeriod) ? deepLinkedPeriod : "month";

  const [period, setPeriod] = useState<Period>(initialPeriod);
  const [wrapped, setWrapped] = useState<ReadingWrapped | null>(null);
  const [exporting, setExporting] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setWrapped(null);
    libraryService
      .wrapped(period)
      .then(setWrapped)
      .catch(() => toast.error(t.loadError));
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      toast.error(t.exportError);
    } finally {
      setExporting(false);
    }
  }

  const periodLabel: Record<Period, string> = {
    month: t.periodMonth,
    year: t.periodYear,
    "last-month": t.periodLastMonth,
    "last-year": t.periodLastYear,
  };

  const chapterWord = wrapped ? (wrapped.totalChaptersRead > 1 ? t.chapterMany : t.chapterOne) : "";
  const readWord = wrapped ? (wrapped.totalChaptersRead > 1 ? t.readMany : t.readOne) : "";
  const seriesWord = wrapped
    ? (wrapped.distinctSeriesCount > 1 ? t.seriesMany : t.seriesOne)
    : "";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-[13px] uppercase tracking-wider text-txt3 font-mono">{t.heading}</h2>
        <div className="flex gap-1.5">
          <button
            onClick={() => setPeriod("month")}
            className={cn(
              "px-3 py-1 rounded-full text-[11.5px] font-medium transition-colors",
              period === "month" ? "bg-vert text-[#05130c]" : "bg-sur2 text-txt3 hover:text-txt",
            )}
          >
            {t.thisMonth}
          </button>
          <button
            onClick={() => setPeriod("year")}
            className={cn(
              "px-3 py-1 rounded-full text-[11.5px] font-medium transition-colors",
              period === "year" ? "bg-vert text-[#05130c]" : "bg-sur2 text-txt3 hover:text-txt",
            )}
          >
            {t.thisYear}
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
              {periodLabel[period]}
            </p>

            <div className="mt-1">
              <span className="font-display text-[64px] leading-none text-vert">
                {wrapped.totalChaptersRead}
              </span>
              <p className="text-[13px] text-txt2 mt-1">
                {chapterWord} {readWord}, {t.outOf} {wrapped.distinctSeriesCount} {seriesWord}
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
                      {t.mostReadTitle}
                    </p>
                    <p className="text-[13.5px] font-medium text-txt truncate">
                      {wrapped.mostReadManhwa.title}
                    </p>
                    <p className="text-[11px] text-txt3">
                      {wrapped.mostReadManhwa.chaptersRead}{" "}
                      {wrapped.mostReadManhwa.chaptersRead > 1 ? t.chapterMany : t.chapterOne}
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                {wrapped.mostActiveDay !== null && (
                  <div>
                    <p className="text-[10.5px] font-mono uppercase tracking-wider text-txt3">
                      {t.favoriteDay}
                    </p>
                    <p className="text-[13.5px] font-medium text-txt">
                      {days[wrapped.mostActiveDay]}
                    </p>
                  </div>
                )}
                {wrapped.topGenre && (
                  <div>
                    <p className="text-[10.5px] font-mono uppercase tracking-wider text-txt3">
                      {t.favoriteGenre}
                    </p>
                    <p className="text-[13.5px] font-medium text-txt">{wrapped.topGenre}</p>
                  </div>
                )}
              </div>

              {wrapped.currentStreak > 0 && (
                <div className="flex items-center gap-1.5 text-or">
                  <Flame size={13} />
                  <span className="text-[12px] font-medium">
                    {wrapped.currentStreak} {wrapped.currentStreak > 1 ? t.dayMany : t.dayOne}{" "}
                    {t.inARow}
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
            {t.downloadImage}
          </button>
        </div>
      )}
    </div>
  );
}