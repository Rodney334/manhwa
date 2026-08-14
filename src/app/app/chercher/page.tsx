"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { manhwaService } from "@/lib/services/manhwa.service";
import { libraryService } from "@/lib/services/library.service";
import { Cover } from "@/components/features/Cover";
import { EmptyState, Spinner } from "@/components/ui/Primitives";
import { toast } from "@/lib/stores/toast.store";
import { ApiError } from "@/lib/api/client";
import { useTranslations } from "@/lib/i18n/useTranslations";
import type { Manhwa } from "@/types";
import { Search as SearchIcon, Plus, Check } from "lucide-react";

export default function ChercherPage() {
  const t = useTranslations("search");
  const publicationStatus = useTranslations("common").publicationStatus;
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Manhwa[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const [added, setAdded] = useState<Set<string>>(new Set());

  useEffect(() => {
    const handle = setTimeout(() => {
      setLoading(true);
      manhwaService
        .search({ q: q || undefined, pageSize: 24 })
        .then((res) => setResults(res.items))
        .catch(() => {
          toast.error(t.searchError);
          setResults([]);
        })
        .finally(() => setLoading(false));
    }, 350);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  async function handleAdd(manhwaId: string) {
    setAdding(manhwaId);
    try {
      await libraryService.add({ manhwaId, status: "plan_to_read" });
      setAdded((prev) => new Set(prev).add(manhwaId));
      toast.success(t.added);
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        setAdded((prev) => new Set(prev).add(manhwaId));
        toast.info(t.alreadyAdded);
      } else {
        toast.error(t.addError);
      }
    } finally {
      setAdding(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-[28px] font-normal">{t.title}</h1>
        <p className="text-[13.5px] text-txt3 mt-1">{t.subtitle}</p>
      </div>

      <div className="relative max-w-lg">
        <SearchIcon size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-txt3" />
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t.placeholder}
          className="w-full bg-sur border border-ligne rounded-xl pl-10 pr-4 py-3 text-[14px] outline-none focus:border-vert/50 transition-colors"
        />
      </div>

      {loading && (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      )}

      {!loading && results !== null && results.length === 0 && (
        <EmptyState
          icon={<SearchIcon size={26} />}
          title={t.emptyTitle}
          subtitle={t.emptySubtitle}
        />
      )}

      {!loading && results !== null && results.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {results.map((m) => {
            const isAdded = added.has(m._id);
            return (
              <div
                key={m._id}
                className="group flex flex-col rounded-xl border border-ligne bg-sur/60 overflow-hidden hover:border-vert/30 transition-colors"
              >
                <Link href={`/app/manhwa/${m.slug}`} className="relative aspect-[3/4] block">
                  <Cover manhwa={m} className="w-full h-full" />
                </Link>
                <div className="p-3 flex flex-col gap-2 flex-1">
                  <Link href={`/app/manhwa/${m.slug}`}>
                    <h3 className="text-[13.5px] font-medium leading-snug line-clamp-2 hover:text-vert transition-colors">
                      {m.title}
                    </h3>
                  </Link>
                  <p className="text-[11px] text-txt3 font-mono mt-auto">
                    {publicationStatus[m.status] ?? m.status}
                    {m.totalChapters ? ` · ${m.totalChapters} ch.` : ""}
                  </p>
                  <button
                    onClick={() => handleAdd(m._id)}
                    disabled={adding === m._id || isAdded}
                    className="flex items-center justify-center gap-1.5 text-[12.5px] font-medium rounded-lg py-1.5 bg-vert-t text-vert hover:bg-vert hover:text-[#05130c] transition-colors disabled:opacity-60"
                  >
                    {isAdded ? (
                      <>
                        <Check size={13} /> {t.addedLabel}
                      </>
                    ) : (
                      <>
                        <Plus size={13} /> {t.addLabel}
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}