"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { libraryService, type ReleaseCalendarEntry } from "@/lib/services/library.service";
import { Cover } from "@/components/features/Cover";
import { EmptyState, Spinner } from "@/components/ui/Primitives";
import { toast } from "@/lib/stores/toast.store";
import { CalendarDays, TriangleAlert } from "lucide-react";

const JOURS = [
  "Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi",
];

export default function CalendrierPage() {
  const [items, setItems] = useState<ReleaseCalendarEntry[] | null>(null);

  useEffect(() => {
    libraryService
      .releaseCalendar()
      .then(setItems)
      .catch(() => {
        toast.error("Impossible de charger le calendrier.");
        setItems([]);
      });
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
        <h1 className="font-display text-[28px] font-normal">Calendrier</h1>
        <p className="text-[13.5px] text-txt3 mt-1 max-w-lg">
          Jour de sortie habituel de tes séries en cours, déduit de leurs dernières parutions —
          pas une date annoncée, une tendance observée.
        </p>
      </div>

      {items.length === 0 && (
        <EmptyState
          icon={<CalendarDays size={26} />}
          title="Pas encore assez de données"
          subtitle="Il faut au moins deux parutions constatées sur une série pour en déduire un rythme."
        />
      )}

      {items.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {JOURS.map((jour, dayIndex) => {
            const forDay = items.filter((i) => i.typicalDay === dayIndex);
            if (forDay.length === 0) return null;

            return (
              <div key={dayIndex} className="flex flex-col gap-2.5">
                <h2
                  className={`text-[12px] uppercase tracking-wider font-mono ${
                    dayIndex === todayIndex ? "text-vert" : "text-txt3"
                  }`}
                >
                  {jour} {dayIndex === todayIndex && "· aujourd'hui"}
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
                        <span
                          title="Pas de nouveau chapitre depuis bien plus longtemps que d'habitude"
                          className="shrink-0"
                        >
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