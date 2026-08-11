"use client";

import { useEffect, useState } from "react";
import { libraryService } from "@/lib/services/library.service";
import { ContinueCard } from "@/components/features/LibraryCard";
import { EmptyState, Spinner } from "@/components/ui/Primitives";
import { toast } from "@/lib/stores/toast.store";
import type { LibraryEntry } from "@/types";
import { BookOpen } from "lucide-react";
import Link from "next/link";

const JOURS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
const MOIS = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

export default function AccueilPage() {
  const [entries, setEntries] = useState<LibraryEntry[] | null>(null);

  async function load() {
    try {
      const data = await libraryService.continueReading(20);
      setEntries(data);
    } catch {
      toast.error("Impossible de charger ta reprise.");
      setEntries([]);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleIncrement(id: string) {
    setEntries((prev) =>
      prev
        ? prev.map((e) => (e._id === id ? { ...e, currentChapter: e.currentChapter + 1 } : e))
        : prev,
    );
    try {
      await libraryService.increment(id, 1);
      toast.success("+1 chapitre");
    } catch {
      toast.error("Échec de la mise à jour.");
      load();
    }
  }

  const now = new Date();
  const today = `${JOURS[now.getDay()]} ${now.getDate()} ${MOIS[now.getMonth()]}`;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-[12px] font-mono text-txt3 uppercase tracking-wider">{today}</p>
        <h1 className="font-display text-[28px] font-normal mt-1">Reprendre</h1>
        <p className="text-[13.5px] text-txt3 mt-1 max-w-lg">
          Trié par retard, pas par date : la série la plus en arrière est celle qu&apos;on abandonne.
        </p>
      </div>

      {entries === null && (
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      )}

      {entries !== null && entries.length === 0 && (
        <EmptyState
          icon={<BookOpen size={28} />}
          title="Rien à reprendre pour l'instant"
          subtitle="Ajoute des séries à ta bibliothèque pour les retrouver ici, triées par retard de lecture."
          action={
            <Link
              href="/app/chercher"
              className="mt-1 inline-flex items-center gap-2 bg-vert text-[#05130c] text-[13.5px] font-medium rounded-lg px-4 py-2 hover:brightness-110 transition-all"
            >
              Chercher un manhwa
            </Link>
          }
        />
      )}

      {entries !== null && entries.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {entries.map((entry) => (
            <ContinueCard key={entry._id} entry={entry} onIncrement={handleIncrement} />
          ))}
        </div>
      )}
    </div>
  );
}
