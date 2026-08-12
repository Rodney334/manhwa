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
  const [loadFailed, setLoadFailed] = useState(false);

  async function load() {
    setLoadFailed(false);
    // Deux appels indépendants : un échec sur l'un ne doit jamais bloquer
    // l'affichage de l'autre, sinon la page reste vide sans rien à montrer
    // (ni spinner, ni état vide, ni erreur) — exactement ce qui se produisait
    // avant ce correctif quand `stats()` échouait seul.
    const [continueResult, statsResult] = await Promise.allSettled([
      libraryService.continueReading(20),
      libraryService.stats(),
    ]);

    if (continueResult.status === "fulfilled") {
      setEntries(continueResult.value);
    } else {
      setEntries([]);
    }

    if (statsResult.status === "fulfilled") {
      setHasLibraryEntries(statsResult.value.totalEntries > 0);
    } else {
      setHasLibraryEntries(null);
    }

    if (continueResult.status === "rejected" && statsResult.status === "rejected") {
      setLoadFailed(true);
      toast.error("Impossible de charger ta reprise.");
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
        {/* Cette page n'a pas de données servies au chargement (tout vient
            d'un useEffect côté client) : Next.js la prérend statiquement au
            build. La date figée à ce moment-là diffère alors de la date
            réelle au moment où le visiteur charge la page, ce qui déclenche
            une erreur d'hydratation React (#418) sur ce seul nœud de texte.
            `suppressHydrationWarning` est le correctif recommandé par React
            pour une valeur dont la différence serveur/client est attendue
            et sans conséquence. */}
        <p
          className="text-[12px] font-mono text-txt3 uppercase tracking-wider"
          suppressHydrationWarning
        >
          {today}
        </p>
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

      {entries !== null && loadFailed && (
        <div className="flex flex-col items-center gap-3 text-center py-20">
          <p className="text-[13.5px] text-txt3">
            Impossible de charger ta reprise pour l&apos;instant.
          </p>
          <button
            onClick={load}
            className="text-[13px] text-vert hover:underline"
          >
            Réessayer
          </button>
        </div>
      )}

      {entries !== null && !loadFailed && entries.length === 0 && hasLibraryEntries !== false && (
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

      {entries !== null && !loadFailed && entries.length === 0 && hasLibraryEntries === false && (
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