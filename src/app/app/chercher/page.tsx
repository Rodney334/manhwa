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

// Normalisation légère, côté client : pas besoin de reproduire exactement
// `normalizeTitle()` du backend ici — juste assez pour comparer titre et
// alias de façon insensible à la casse et aux espaces superflus.
function normalize(value: string): string {
  return value.toLowerCase().trim().replace(/\s+/g, " ");
}

function words(value: string): string[] {
  return normalize(value)
    .split(/[^\p{L}\p{N}]+/u)
    .filter((w) => w.length >= 2);
}

/**
 * Quel titre afficher sur CETTE carte, pour CETTE recherche : si la requête
 * correspond mieux à un alias qu'au titre principal, l'alias tapé prend sa
 * place à l'écran — rien n'est enregistré, ça ne change que l'affichage
 * pendant que l'utilisateur regarde ses résultats. Le titre personnel
 * (sauvegardé, lui, à l'ajout) est une fonctionnalité séparée.
 *
 * Comparaison MOT PAR MOT, pas en bloc continu : le backend qui a produit
 * ces résultats matche lui aussi mot par mot (index texte MongoDB) — un
 * alias contenant « Disaster-Class Necromancer » doit remonter pour la
 * requête « catastrophique necromancer » même si les mots n'apparaissent
 * pas dans le même ordre ni collés l'un à l'autre. Une comparaison en bloc
 * continu (« la requête entière est une sous-chaîne de l'alias ») ratait
 * précisément ce genre de cas.
 */
function matchedDisplayTitle(manhwa: Manhwa, query: string): string {
  const queryWords = words(query);
  if (queryWords.length === 0 || !manhwa.altTitles?.length) return manhwa.title;

  const titleWords = new Set(words(manhwa.title));
  if (queryWords.every((w) => titleWords.has(w))) return manhwa.title;

  // Le meilleur alias est celui qui couvre le plus de mots de la requête,
  // et parmi les ex æquo, le plus court — moins de bruit autour du terme
  // cherché.
  const scored = manhwa.altTitles
    .map((alt) => {
      const altWords = new Set(words(alt));
      const covered = queryWords.filter((w) => altWords.has(w)).length;
      return { alt, covered };
    })
    .filter((entry) => entry.covered > 0)
    .sort((a, b) => b.covered - a.covered || a.alt.length - b.alt.length);

  return scored[0]?.alt ?? manhwa.title;
}

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

  async function handleAdd(manhwa: Manhwa, displayTitle: string) {
    setAdding(manhwa._id);
    try {
      // Le titre déjà résolu à l'écran (alias trouvé, ou titre principal si
      // aucun alias ne correspondait mieux) devient le titre personnel de
      // l'entrée — plus fiable que le texte brut tapé, qui peut être une
      // recherche partielle ou mal orthographiée. Le backend ignore de
      // toute façon silencieusement cette valeur si elle correspond déjà
      // au titre canonique.
      await libraryService.add({ manhwaId: manhwa._id, status: "plan_to_read", customTitle: displayTitle });
      setAdded((prev) => new Set(prev).add(manhwa._id));
      toast.success(t.added);
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        setAdded((prev) => new Set(prev).add(manhwa._id));
        toast.info(t.alreadyAdded);
        // Déjà dans la bibliothèque — probablement ajoutée avant que cette
        // fonctionnalité existe, ou lors d'une recherche précédente qui ne
        // trouvait pas encore le bon alias. Un second clic depuis une
        // recherche qui, elle, résout maintenant un alias différent doit
        // quand même le faire remonter, plutôt que de laisser l'entrée
        // figée sur le titre principal indéfiniment. Rien à faire si le
        // titre résolu est simplement le titre principal (aucun meilleur
        // alias trouvé) : ce serait un aller-retour pour ne rien changer.
        if (displayTitle !== manhwa.title) {
          try {
            const existing = await libraryService.findByManhwa(manhwa._id);
            if (existing && existing.customTitle !== displayTitle) {
              await libraryService.update(existing._id, { customTitle: displayTitle });
            }
          } catch {
            // Silencieux : l'ajout est déjà acquis, ce n'est qu'un
            // rattrapage de confort sur le titre affiché.
          }
        }
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
            const displayTitle = matchedDisplayTitle(m, q);
            // Le lien vers la fiche doit porter le même alias déjà résolu à
            // l'écran — sinon un clic sur l'image/le titre (au lieu du
            // bouton "Ajouter" juste en dessous) atterrit sur la fiche sans
            // aucune trace de l'alias qui a permis de la trouver, et
            // l'ajout depuis là-bas retombe silencieusement sur le titre
            // canonique. Rien à passer quand l'alias EST le titre canonique
            // (aucune résolution n'a eu lieu, la query string resterait
            // propre).
            const detailHref =
              displayTitle !== m.title
                ? `/app/manhwa/${m.slug}?display=${encodeURIComponent(displayTitle)}`
                : `/app/manhwa/${m.slug}`;
            return (
              <div
                key={m._id}
                className="group flex flex-col rounded-xl border border-ligne bg-sur/60 overflow-hidden hover:border-vert/30 transition-colors"
              >
                <Link href={detailHref} className="relative aspect-[3/4] block">
                  <Cover manhwa={m} className="w-full h-full" />
                </Link>
                <div className="p-3 flex flex-col gap-2 flex-1">
                  <Link href={detailHref}>
                    <h3 className="text-[13.5px] font-medium leading-snug line-clamp-2 hover:text-vert transition-colors">
                      {displayTitle}
                    </h3>
                  </Link>
                  <p className="text-[11px] text-txt3 font-mono mt-auto">
                    {publicationStatus[m.status] ?? m.status}
                    {m.totalChapters ? ` · ${m.totalChapters} ch.` : ""}
                  </p>
                  <button
                    onClick={() => handleAdd(m, displayTitle)}
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