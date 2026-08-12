"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { libraryService } from "@/lib/services/library.service";
import { Cover } from "@/components/features/Cover";
import { EmptyState, Spinner } from "@/components/ui/Primitives";
import { toast } from "@/lib/stores/toast.store";
import type { Manhwa } from "@/types";
import { Sparkles } from "lucide-react";

export default function DecouvrirPage() {
  const [items, setItems] = useState<Manhwa[] | null>(null);

  useEffect(() => {
    libraryService
      .recommendations(18)
      .then(setItems)
      .catch(() => {
        toast.error("Impossible de charger les suggestions.");
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

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-[28px] font-normal">Découvrir</h1>
        <p className="text-[13.5px] text-txt3 mt-1 max-w-lg">
          D&apos;après les genres de tes séries notées 8/10 ou plus.
        </p>
      </div>

      {items.length === 0 && (
        <EmptyState
          icon={<Sparkles size={26} />}
          title="Pas encore de suggestions"
          subtitle="Note au moins une série 8/10 ou plus dans ta bibliothèque pour voir apparaître des suggestions basées sur ses genres."
        />
      )}

      {items.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {items.map((manhwa) => (
            <Link
              key={manhwa._id}
              href={`/app/manhwa/${manhwa.slug}`}
              className="flex flex-col gap-2 group"
            >
              <div className="aspect-[3/4] rounded-lg overflow-hidden bg-sur2">
                <Cover manhwa={manhwa} className="w-full h-full group-hover:opacity-80 transition-opacity" />
              </div>
              <div>
                <p className="text-[12.5px] font-medium leading-snug line-clamp-2">
                  {manhwa.title}
                </p>
                {manhwa.genres && manhwa.genres.length > 0 && (
                  <p className="text-[11px] text-txt3 truncate mt-0.5">
                    {manhwa.genres.slice(0, 2).join(", ")}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}