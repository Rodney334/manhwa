"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { libraryService } from "@/lib/services/library.service";
import { LibraryCard } from "@/components/features/LibraryCard";
import { EmptyState, Spinner } from "@/components/ui/Primitives";
import { READING_STATUS_LABELS as STATUS_KEYS, cn } from "@/lib/utils/format";
import { toast } from "@/lib/stores/toast.store";
import { useTranslations } from "@/lib/i18n/useTranslations";
import type { Messages } from "@/lib/i18n/messages/fr";
import type { LibraryEntry, ReadingStatus } from "@/types";
import { LayoutGrid, Search } from "lucide-react";

// `t` et `statusLabels` viennent tous deux du composant (via `useTranslations`),
// donc fonctions plutôt que constantes de module — même principe que
// Sidebar.tsx / OnboardingTour.tsx.
function buildFilters(
  t: Messages["library"],
  statusLabels: Messages["common"]["readingStatus"],
): Array<{ value: ReadingStatus | "all"; label: string }> {
  return [
    { value: "all", label: t.filterAll },
    { value: "reading", label: statusLabels.reading },
    { value: "plan_to_read", label: statusLabels.plan_to_read },
    { value: "on_hold", label: statusLabels.on_hold },
    { value: "completed", label: statusLabels.completed },
    { value: "dropped", label: statusLabels.dropped },
  ];
}

type SortOption = "lastRead" | "progress" | "title" | "score" | "added";

function buildSorts(t: Messages["library"]): Array<{ value: SortOption; label: string }> {
  return [
    { value: "lastRead", label: t.sortLastRead },
    { value: "progress", label: t.sortProgress },
    { value: "title", label: t.sortTitle },
    { value: "score", label: t.sortScore },
    { value: "added", label: t.sortAdded },
  ];
}

// Vérification structurelle uniquement (les valeurs de statut, ex.
// "plan_to_read", ne dépendent pas de la langue) — `STATUS_KEYS` sert
// seulement pour ses clés, jamais affiché.
function isReadingStatus(value: string | null): value is ReadingStatus {
  return !!value && value in STATUS_KEYS;
}

function isSortOption(value: string | null): value is SortOption {
  return !!value && ["lastRead", "progress", "title", "score", "added"].includes(value);
}

export default function BibliothequePage() {
  // useSearchParams() exige une frontière Suspense en Next 15, sinon la page
  // est forcée en rendu client complet au build.
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><Spinner /></div>}>
      <BibliothequeContent />
    </Suspense>
  );
}

function BibliothequeContent() {
  const t = useTranslations("library");
  const statusLabels = useTranslations("common").readingStatus;
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get("status");
  const initialSort = searchParams.get("sort");

  const FILTERS = buildFilters(t, statusLabels);
  const SORTS = buildSorts(t);

  const [status, setStatus] = useState<ReadingStatus | "all">(
    isReadingStatus(initialStatus) ? initialStatus : "all",
  );
  const [sort, setSort] = useState<SortOption>(isSortOption(initialSort) ? initialSort : "lastRead");
  const [search, setSearch] = useState("");
  const [entries, setEntries] = useState<LibraryEntry[] | null>(null);
  const [statusCounts, setStatusCounts] = useState<Record<string, number> | null>(null);

  useEffect(() => {
    let active = true;
    setEntries(null);
    libraryService
      .list({
        status: status === "all" ? undefined : status,
        search: search || undefined,
        pageSize: 60,
        sort,
      })
      .then((res) => {
        if (active) setEntries(res.items);
      })
      .catch(() => {
        if (active) {
          toast.error(t.loadError);
          setEntries([]);
        }
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, sort, search]);

  // Compteurs par statut — indépendants des filtres/recherche en cours,
  // donc chargés une seule fois plutôt qu'à chaque changement de filtre.
  useEffect(() => {
    let active = true;
    libraryService
      .stats()
      .then((res) => {
        if (!active) return;
        const map: Record<string, number> = { all: res.totalEntries };
        for (const s of res.byStatus) map[s._id] = s.count;
        setStatusCounts(map);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-[28px] font-normal">{t.title}</h1>
        <p className="text-[13.5px] text-txt3 mt-1">{t.subtitle}</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatus(f.value)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12.5px] font-medium transition-colors",
                status === f.value
                  ? "bg-vert text-[#05130c]"
                  : "bg-sur2 text-txt2 hover:text-txt",
              )}
            >
              {f.label}
              {statusCounts && (
                <span
                  className={cn(
                    "text-[10.5px] font-mono px-1.5 rounded-full",
                    status === f.value ? "bg-[#05130c]/15" : "bg-sur3 text-txt3",
                  )}
                >
                  {statusCounts[f.value] ?? 0}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            className="bg-sur border border-ligne rounded-lg px-3 py-2 text-[12.5px] text-txt2 outline-none focus:border-vert/50 transition-colors"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>

          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-txt3" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full bg-sur border border-ligne rounded-lg pl-8 pr-3 py-2 text-[13px] outline-none focus:border-vert/50 transition-colors"
            />
          </div>
        </div>
      </div>

      {entries === null && (
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      )}

      {entries !== null && entries.length === 0 && (
        <EmptyState
          icon={<LayoutGrid size={28} />}
          title={t.emptyTitle}
          subtitle={t.emptySubtitle}
        />
      )}

      {entries !== null && entries.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {entries.map((entry) => (
            <LibraryCard
              key={entry._id}
              entry={entry}
              statusLabel={statusLabels[entry.status] ?? entry.status}
            />
          ))}
        </div>
      )}
    </div>
  );
}