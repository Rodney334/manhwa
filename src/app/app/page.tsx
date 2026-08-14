"use client";

import { useEffect, useState } from "react";
import { libraryService, type DailyQuest } from "@/lib/services/library.service";
import { ContinueCard } from "@/components/features/LibraryCard";
import { EmptyState, Spinner } from "@/components/ui/Primitives";
import { toast } from "@/lib/stores/toast.store";
import { ApiError } from "@/lib/api/client";
import { useTranslations } from "@/lib/i18n/useTranslations";
import type { Messages } from "@/lib/i18n/messages/fr";
import type { LibraryEntry } from "@/types";
import { BookOpen, PartyPopper, Flame, Check, Target } from "lucide-react";
import Link from "next/link";

export default function AccueilPage() {
  const t = useTranslations("resume");
  const [entries, setEntries] = useState<LibraryEntry[] | null>(null);
  const [hasLibraryEntries, setHasLibraryEntries] = useState<boolean | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  // Par entrée, pas un verrou global : plusieurs cartes existent en même
  // temps sur cette page, désactiver tous les boutons pour l'action d'une
  // seule serait plus gênant que le problème qu'on évite.
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [quest, setQuest] = useState<DailyQuest | null>(null);

  useEffect(() => {
    libraryService.dailyQuest().then(setQuest).catch(() => {});
  }, []);

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
      toast.error(t.loadError);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Le backend masque désormais une série de "Reprendre" dès qu'une lecture
  // vient d'y être enregistrée — même s'il reste du retard — et ne la fait
  // réapparaître que si un nouveau chapitre paraît ensuite. On retire donc
  // la carte localement après tout incrément réussi, sans condition.
  async function handleIncrement(id: string) {
    if (pendingIds.has(id)) return;
    setPendingIds((prev) => new Set(prev).add(id));
    try {
      await libraryService.increment(id, 1);
      setEntries((prev) => prev?.filter((e) => e._id !== id) ?? prev);
      toast.success(t.incrementSuccess);
      // Rafraîchi plutôt que déduit localement : incrémenter correctement
      // la série de jours consécutifs dépend de si hier en faisait déjà
      // partie, une logique déjà écrite côté backend — pas la peine de la
      // dupliquer ici pour un appel aussi léger.
      libraryService.dailyQuest().then(setQuest).catch(() => {});
    } catch (e) {
      // Le backend renvoie volontairement un 400 quand on est déjà au
      // dernier chapitre connu — ce n'est pas un échec, juste un signal
      // qu'il n'y a plus rien à lire pour l'instant sur cette série.
      if (e instanceof ApiError && e.status === 400) {
        setEntries((prev) => prev?.filter((entry) => entry._id !== id) ?? prev);
        toast.info(t.alreadyUpToDate);
        return;
      }
      toast.error(t.updateError);
      load();
    } finally {
      setPendingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }

  const now = new Date();
  const today = `${t.days[now.getDay()]} ${now.getDate()} ${t.months[now.getMonth()]}`;

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
        <h1 className="font-display text-[28px] font-normal mt-1">{t.title}</h1>
        <p className="text-[13.5px] text-txt3 mt-1 max-w-lg">{t.subtitle}</p>
      </div>

      {quest && <DailyQuestCard quest={quest} t={t.quest} />}

      {entries === null && (
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      )}

      {entries !== null && loadFailed && (
        <div className="flex flex-col items-center gap-3 text-center py-20">
          <p className="text-[13.5px] text-txt3">{t.loadErrorRetryText}</p>
          <button onClick={load} className="text-[13px] text-vert hover:underline">
            {t.retry}
          </button>
        </div>
      )}

      {entries !== null && !loadFailed && entries.length === 0 && hasLibraryEntries !== false && (
        <EmptyState
          icon={<PartyPopper size={28} />}
          title={t.caughtUpTitle}
          subtitle={t.caughtUpSubtitle}
          action={
            <Link
              href="/app/bibliotheque?status=reading&sort=progress"
              className="mt-1 inline-flex items-center gap-2 text-[13px] text-vert hover:underline"
            >
              {t.seeBacklogAnyway}
            </Link>
          }
        />
      )}

      {entries !== null && !loadFailed && entries.length === 0 && hasLibraryEntries === false && (
        <EmptyState
          icon={<BookOpen size={28} />}
          title={t.emptyTitle}
          subtitle={t.emptySubtitle}
          action={
            <Link
              href="/app/chercher"
              className="mt-1 inline-flex items-center gap-2 bg-vert text-[#05130c] text-[13.5px] font-medium rounded-lg px-4 py-2 hover:brightness-110 transition-all"
            >
              {t.searchManhwa}
            </Link>
          }
        />
      )}

      {entries !== null && entries.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {entries.map((entry) => (
            <ContinueCard
              key={entry._id}
              entry={entry}
              onIncrement={handleIncrement}
              disabled={pendingIds.has(entry._id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Quête du jour ──────────────────────────────────────────────────────────
// Trois façons de la remplir, pas une seule : lire un chapitre est la plus
// évidente, mais pas toujours possible — un lecteur à jour partout n'a
// parfois rien de nouveau à lire un jour donné. Ajouter une série ou en
// terminer une reste toujours accessible, quoi qu'il en soit. N'importe
// laquelle des trois suffit à valider la journée.

function DailyQuestCard({
  quest,
  t,
}: {
  quest: DailyQuest;
  t: Messages["resume"]["quest"];
}) {
  const questItems: { key: keyof DailyQuest["tasks"]; label: string }[] = [
    { key: "read", label: t.read },
    { key: "added", label: t.added },
    { key: "finished", label: t.finished },
  ];

  return (
    <div
      className={`flex flex-col gap-3 rounded-xl border px-4 py-3.5 transition-colors ${
        quest.completedToday ? "border-vert/25 bg-vert-t" : "border-ligne bg-sur/60"
      }`}
    >
      <div className="flex items-center gap-3.5">
        <div
          className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
            quest.completedToday ? "bg-vert text-[#05130c]" : "bg-sur2 text-txt3"
          }`}
        >
          {quest.completedToday ? <Check size={16} /> : <Target size={15} />}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-medium text-txt">
            {quest.completedToday ? t.titleDone : t.title}
          </p>
          <p className="text-[12px] text-txt3">
            {quest.completedToday ? t.subtitleDone : t.subtitle}
          </p>
        </div>

        {quest.currentStreak > 0 && (
          <div className="flex items-center gap-1.5 text-or shrink-0">
            <Flame size={15} />
            <span className="text-[13px] font-mono font-medium">{quest.currentStreak}</span>
          </div>
        )}
      </div>

      {!quest.completedToday && (
        <div className="flex flex-wrap gap-2 pl-[3.15rem]">
          {questItems.map((item) => (
            <span
              key={item.key}
              className={`flex items-center gap-1.5 text-[11.5px] rounded-full px-2.5 py-1 ${
                quest.tasks[item.key] ? "bg-vert-t text-vert" : "bg-sur2 text-txt3"
              }`}
            >
              {quest.tasks[item.key] ? <Check size={11} /> : null}
              {item.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}