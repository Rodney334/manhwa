"use client";

import { useEffect, useState } from "react";
import { libraryService } from "@/lib/services/library.service";
import { ContinueCard } from "@/components/features/LibraryCard";
import { EmptyState, Spinner } from "@/components/ui/Primitives";
import { toast } from "@/lib/stores/toast.store";
import { ApiError } from "@/lib/api/client";
import type { LibraryEntry } from "@/types";
import { BookOpen, PartyPopper } from "lucide-react";
import Link from "next/link";

const JOURS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
const MOIS = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

export default function AccueilPage() {
  const [entries, setEntries] = useState<LibraryEntry[] | null>(null);
  const [hasLibraryEntries, setHasLibraryEntries] = useState<boolean | null>(null);

  async function load() {
    try {
      const [continueData, stats] = await Promise.all([
        libraryService.continueReading(20),
        libraryService.stats(),
      ]);
      setEntries(continueData);
      setHasLibraryEntries(stats.totalEntries > 0);
    } catch {
      toast.error("Impossible de charger ta reprise.");
      setEntries([]);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // Le backend masque désormais une série de "Reprendre" dès qu'une lecture
  // vient d'y être enregistrée — même s'il reste du retard — et ne la fait
  // réapparaître que si un nouveau chapitre paraît ensuite. On retire donc
  // la carte localement après tout incrément réussi, sans condition.
  async function handleIncrement(id: string) {
    try {
      await libraryService.increment(id, 1);
      setEntries((prev) => prev?.filter((e) => e._id !== id) ?? prev);
      toast.success("+1 chapitre");
    } catch (e) {
      // Le backend renvoie volontairement un 400 quand on est déjà au
      // dernier chapitre connu — ce n'est pas un échec, juste un signal
      // qu'il n'y a plus rien à lire pour l'instant sur cette série.
      if (e instanceof ApiError && e.status === 400) {
        setEntries((prev) => prev?.filter((entry) => entry._id !== id) ?? prev);
        toast.info("Tu es déjà à jour sur cette série.");
        return;
      }
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

      {entries !== null && entries.length === 0 && hasLibraryEntries && (
        <EmptyState
          icon={<PartyPopper size={28} />}
          title="Tu as tout repris pour l'instant"
          subtitle="Reviens ici dès qu'un nouveau chapitre sort sur l'une de tes séries en cours."
          action={
            <Link
              href="/app/bibliotheque?status=reading&sort=progress"
              className="mt-1 inline-flex items-center gap-2 text-[13px] text-vert hover:underline"
            >
              Voir tout mon retard quand même
            </Link>
          }
        />
      )}

      {entries !== null && entries.length === 0 && hasLibraryEntries === false && (
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