"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { libraryService, type ReleaseCalendarEntry } from "@/lib/services/library.service";
import { Cover } from "@/components/features/Cover";
import { EmptyState, Spinner } from "@/components/ui/Primitives";
import { toast } from "@/lib/stores/toast.store";
import { useTranslations } from "@/lib/i18n/useTranslations";
import { CalendarDays, TriangleAlert } from "lucide-react";

export default function CalendrierPage() {
  const t = useTranslations("calendar");
  const [items, setItems] = useState<ReleaseCalendarEntry[] | null>(null);

  useEffect(() => {
    libraryService
      .releaseCalendar()
      .then(setItems)
      .catch(() => {
        toast.error(t.loadError);
        setItems([]);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (items === null) {
    return (
      <div className="flex justify-center py-24">
        <Spinner />
      </div>
    );
  }

  const todayIndex = new Date().getDay();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-[28px] font-normal">{t.title}</h1>
        <p className="text-[13.5px] text-txt3 mt-1 max-w-lg">{t.subtitle}</p>
      </div>

      {items.length === 0 && (
        <EmptyState
          icon={<CalendarDays size={26} />}
          title={t.emptyTitle}
          subtitle={t.emptySubtitle}
        />
      )}

      {items.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {t.days.map((jour, dayIndex) => {
            const forDay = items.filter((i) => i.typicalDay === dayIndex);
            if (forDay.length === 0) return null;

            return (
              <div key={dayIndex} className="flex flex-col gap-2.5">
                <h2
                  className={`text-[12px] uppercase tracking-wider font-mono ${
                    dayIndex === todayIndex ? "text-vert" : "text-txt3"
                  }`}
                >
                  {jour} {dayIndex === todayIndex && `· ${t.today}`}
                </h2>
                <div className="flex flex-col gap-2">
                  {forDay.map(({ manhwa, isLikelyOnHiatus }) => (
                    <Link
                      key={manhwa._id}
                      href={`/app/manhwa/${manhwa.slug}`}
                      className="flex items-center gap-2.5 rounded-lg border border-ligne bg-sur/60 px-2.5 py-2 hover:border-ligne2 transition-colors"
                    >
                      <Cover manhwa={manhwa} className="w-8 h-11 rounded shrink-0" />
                      <span className="text-[12.5px] font-medium truncate flex-1">
                        {manhwa.title}
                      </span>
                      {isLikelyOnHiatus && (
                        <span title={t.hiatusTitle} className="shrink-0">
                          <TriangleAlert size={13} className="text-or" />
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}