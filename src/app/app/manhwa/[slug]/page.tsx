"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { manhwaService, type DropOffStats } from "@/lib/services/manhwa.service";
import { libraryService } from "@/lib/services/library.service";
import { Cover } from "@/components/features/Cover";
import { Spinner } from "@/components/ui/Primitives";
import {
  READING_STATUS_LABELS,
  PUBLICATION_STATUS_LABELS,
  formatChapter,
  cleanSynopsis
} from "@/lib/utils/format";
import { toast } from "@/lib/stores/toast.store";
import { ApiError } from "@/lib/api/client";
import { useAuthStore } from "@/lib/stores/auth.store";
import type { Manhwa, LibraryEntry, ReadingStatus } from "@/types";
import { ArrowLeft, Plus, Minus, Heart, ExternalLink, Trash2, Tag, Star, TrendingDown, ShieldCheck } from "lucide-react";

const STATUS_OPTIONS: ReadingStatus[] = [
  "plan_to_read",
  "reading",
  "on_hold",
  "completed",
  "dropped",
];

export default function FichePage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const isAdmin = useAuthStore((s) => s.user?.role === "admin");
  const [manhwa, setManhwa] = useState<Manhwa | null>(null);
  const [entry, setEntry] = useState<LibraryEntry | null | undefined>(undefined);
  const [chapterInput, setChapterInput] = useState("");
  const [notesInput, setNotesInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [dropOff, setDropOff] = useState<DropOffStats | null>(null);

  const load = useCallback(async () => {
    try {
      const m = await manhwaService.getByIdOrSlug(params.slug);
      setManhwa(m);
      try {
        const lib = await libraryService.list({ search: m.title, pageSize: 20 });
        const found = lib.items.find((e) => e.manhwaId === m._id) ?? null;
        setEntry(found);
        if (found) {
          setChapterInput(String(found.currentChapter ?? 0));
          setNotesInput(found.notes ?? "");
        }
      } catch {
        setEntry(null);
      }
    } catch {
      toast.error("Fiche introuvable.");
    }
  }, [params.slug]);

  useEffect(() => {
    load();
  }, [load]);

  // Indépendant du reste : un échec ici ne doit jamais empêcher le reste de
  // la fiche de s'afficher, c'est une statistique en plus, pas une donnée
  // essentielle au fonctionnement de la page.
  useEffect(() => {
    if (!manhwa?._id) return;
    manhwaService
      .dropOffStats(manhwa._id)
      .then(setDropOff)
      .catch(() => {});
  }, [manhwa?._id]);

  async function handleAdd() {
    if (!manhwa) return;
    setBusy(true);
    try {
      const newEntry = await libraryService.add({ manhwaId: manhwa._id, status: "plan_to_read" });
      setEntry(newEntry);
      setChapterInput(String(newEntry.currentChapter ?? 0));
      toast.success("Ajouté à ta bibliothèque.");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Impossible d'ajouter cette série.");
    } finally {
      setBusy(false);
    }
  }

  async function handleStatusChange(status: ReadingStatus) {
    if (!entry) return;
    const prev = entry;
    setEntry({ ...entry, status });
    try {
      const updated = await libraryService.update(entry._id, { status });
      setEntry(updated);
    } catch {
      setEntry(prev);
      toast.error("Échec de la mise à jour du statut.");
    }
  }

  // `POST /increment` n'accepte que des valeurs positives (c'est son rôle :
  // le geste rapide "+1", jamais une correction en arrière) — le backend le
  // refuse en 422 si on lui envoie un pas négatif. Pour reculer (corriger
  // une erreur de saisie), c'est `PATCH /progress` qu'il faut appeler, avec
  // la valeur absolue résultante plutôt qu'un delta.
  async function handleIncrement(step: number) {
    if (!entry) return;
    try {
      if (step > 0) {
        const updated = await libraryService.increment(entry._id, step);
        setEntry(updated);
        setChapterInput(String(updated.currentChapter ?? 0));
        return;
      }

      const nextChapter = Math.max(0, (entry.currentChapter ?? 0) + step);
      const updated = await libraryService.updateProgress(entry._id, nextChapter);
      setEntry(updated);
      setChapterInput(String(updated.currentChapter ?? 0));
    } catch {
      toast.error("Échec de la mise à jour.");
    }
  }

  async function handleProgressSubmit() {
    if (!entry) return;
    const value = parseFloat(chapterInput);
    if (Number.isNaN(value) || value < 0) {
      toast.error("Numéro de chapitre invalide.");
      setChapterInput(String(entry.currentChapter ?? 0));
      return;
    }
    if (value === entry.currentChapter) return;
    try {
      const updated = await libraryService.updateProgress(entry._id, value);
      setEntry(updated);
      setChapterInput(String(updated.currentChapter ?? 0));
      toast.success("Progression enregistrée.");
    } catch {
      toast.error("Échec de la mise à jour.");
    }
  }

  async function handleToggleFavorite() {
    if (!entry) return;
    const prev = entry;
    setEntry({ ...entry, isFavorite: !entry.isFavorite });
    try {
      const updated = await libraryService.update(entry._id, { isFavorite: !prev.isFavorite });
      setEntry(updated);
    } catch {
      setEntry(prev);
      toast.error("Échec de la mise à jour.");
    }
  }

  async function handleScoreChange(score: number) {
    if (!entry) return;
    const prev = entry;
    // Recliquer sur la note déjà posée l'efface, comme un vrai toggle.
    // `null` explicite est nécessaire : `undefined` serait supprimé par
    // JSON.stringify avant d'atteindre le backend, qui ne verrait alors
    // aucun changement et ne l'effacerait pas.
    const clearing = entry.score === score;
    setEntry({ ...entry, score: clearing ? undefined : score });
    try {
      const updated = await libraryService.update(entry._id, {
        score: (clearing ? null : score) as number,
      });
      setEntry(updated);
    } catch {
      setEntry(prev);
      toast.error("Échec de la mise à jour de la note.");
    }
  }

  async function handleNotesSubmit() {
    if (!entry) return;
    if (notesInput === (entry.notes ?? "")) return;
    try {
      const updated = await libraryService.update(entry._id, { notes: notesInput });
      setEntry(updated);
      setNotesInput(updated.notes ?? "");
      toast.success("Notes enregistrées.");
    } catch {
      toast.error("Échec de l'enregistrement des notes.");
    }
  }

  async function handleRemove() {
    if (!entry) return;
    setBusy(true);
    try {
      await libraryService.remove(entry._id);
      setEntry(null);
      toast.info("Retiré de ta bibliothèque.");
    } catch {
      toast.error("Échec de la suppression.");
    } finally {
      setBusy(false);
    }
  }

  if (!manhwa) {
    return (
      <div className="flex justify-center py-24">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-[13px] text-txt3 hover:text-txt transition-colors w-fit"
      >
        <ArrowLeft size={14} /> Retour
      </button>

      <div className="flex flex-col sm:flex-row gap-6">
        <Cover manhwa={manhwa} className="w-40 h-56 rounded-xl shrink-0 mx-auto sm:mx-0" />

        <div className="flex-1 flex flex-col gap-3">
          <div>
            <h1 className="font-display text-[26px] font-normal leading-tight">{manhwa.title}</h1>
            {manhwa.altTitles && manhwa.altTitles.length > 0 && (
              <p className="text-[12.5px] text-txt3 mt-1">{manhwa.altTitles.join(" · ")}</p>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {manhwa.genres?.map((g) => (
              <span key={g} className="px-2 py-0.5 rounded-full text-[11px] bg-sur3 text-txt2">
                {g}
              </span>
            ))}
          </div>

          <div className="flex flex-wrap gap-x-5 gap-y-1 text-[12.5px] text-txt3 font-mono">
            <span>{PUBLICATION_STATUS_LABELS[manhwa.status] ?? manhwa.status}</span>
            {manhwa.totalChapters ? <span>{manhwa.totalChapters} chapitres</span> : null}
            {manhwa.releaseYear ? <span>{manhwa.releaseYear}</span> : null}
            {manhwa.authors && manhwa.authors.length > 0 ? (
              <span>{manhwa.authors.join(", ")}</span>
            ) : null}
          </div>

          {manhwa.synopsis && (
            <p className="text-[13.5px] text-txt2 leading-relaxed">{cleanSynopsis(manhwa.synopsis)}</p>
          )}

          {manhwa.officialLinks && manhwa.officialLinks.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {manhwa.officialLinks.map((l) => (
                <a
                  key={l.url}
                  href={l.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-[12px] text-txt3 hover:text-vert transition-colors"
                >
                  <ExternalLink size={11} /> {l.platform}
                </a>
              ))}
            </div>
          )}

          {dropOff?.available && (
            <DropOffBanner stats={dropOff} currentChapter={entry?.currentChapter} />
          )}
        </div>
      </div>

      <div className="border-t border-ligne pt-5">
        {entry === undefined && (
          <div className="flex justify-center py-6">
            <Spinner />
          </div>
        )}

        {entry === null && (
          <button
            onClick={handleAdd}
            disabled={busy}
            className="flex items-center gap-2 bg-vert text-[#05130c] font-medium text-[13.5px] rounded-lg px-4 py-2.5 hover:brightness-110 transition-all disabled:opacity-60"
          >
            <Plus size={15} /> Ajouter à ma bibliothèque
          </button>
        )}

        {entry && (
          <div className="flex flex-col gap-5">
            <div className="flex flex-wrap gap-1.5">
              {STATUS_OPTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => handleStatusChange(s)}
                  className={`px-3 py-1.5 rounded-full text-[12.5px] font-medium transition-colors ${entry.status === s
                      ? "bg-vert text-[#05130c]"
                      : "bg-sur2 text-txt2 hover:text-txt"
                    }`}
                >
                  {READING_STATUS_LABELS[s]}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 bg-sur border border-ligne rounded-lg px-2 py-1.5">
                <button
                  onClick={() => handleIncrement(-1)}
                  onMouseDown={(e) => e.preventDefault()}
                  className="w-7 h-7 flex items-center justify-center rounded-md text-txt2 hover:text-txt hover:bg-sur3 transition-colors"
                  aria-label="Chapitre précédent"
                >
                  <Minus size={14} />
                </button>
                <input
                  value={chapterInput}
                  onChange={(e) => setChapterInput(e.target.value)}
                  onBlur={handleProgressSubmit}
                  onKeyDown={(e) => e.key === "Enter" && handleProgressSubmit()}
                  className="w-16 bg-transparent text-center font-mono text-[14px] outline-none"
                />
                <button
                  onClick={() => handleIncrement(1)}
                  onMouseDown={(e) => e.preventDefault()}
                  className="w-7 h-7 flex items-center justify-center rounded-md text-vert hover:bg-vert-t transition-colors"
                  aria-label="Chapitre suivant"
                >
                  <Plus size={14} />
                </button>
              </div>
              <span className="text-[12.5px] text-txt3 font-mono">
                / {manhwa.totalChapters ? formatChapter(manhwa.totalChapters) : "?"} chapitres
              </span>

              <button
                onClick={handleToggleFavorite}
                className={`ml-auto flex items-center gap-1.5 text-[12.5px] rounded-lg px-3 py-2 border transition-colors ${entry.isFavorite
                    ? "border-vert/40 text-vert bg-vert-t"
                    : "border-ligne text-txt3 hover:text-txt"
                  }`}
              >
                <Heart size={13} className={entry.isFavorite ? "fill-vert" : ""} />
                Favori
              </button>

              <button
                onClick={handleRemove}
                disabled={busy}
                className="flex items-center gap-1.5 text-[12.5px] rounded-lg px-3 py-2 border border-ligne text-txt3 hover:text-rouge hover:border-rouge/40 transition-colors"
              >
                <Trash2 size={13} /> Retirer
              </button>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-[12px] text-txt3">Ta note</span>
              <div className="flex items-center gap-1">
                {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    onClick={() => handleScoreChange(n)}
                    aria-label={`Noter ${n}/10`}
                    className="p-0.5"
                  >
                    <Star
                      size={17}
                      className={
                        entry.score && n <= entry.score
                          ? "fill-or text-or"
                          : "text-txt3 hover:text-or/60 transition-colors"
                      }
                    />
                  </button>
                ))}
                {entry.score ? (
                  <span className="ml-1.5 text-[12.5px] text-txt3 font-mono">{entry.score}/10</span>
                ) : null}
              </div>
            </div>

            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] text-txt3">Tes notes</span>
              <textarea
                value={notesInput}
                onChange={(e) => setNotesInput(e.target.value)}
                onBlur={handleNotesSubmit}
                rows={3}
                maxLength={1000}
                placeholder="Reprendre après l'arc de la tour…"
                className="bg-sur border border-ligne rounded-lg px-3.5 py-2.5 text-[13px] outline-none focus:border-vert/50 transition-colors resize-none"
              />
            </label>
          </div>
        )}
      </div>

      {isAdmin && (
        <AliasesPanel manhwa={manhwa} onUpdated={(m) => setManhwa(m)} />
      )}
    </div>
  );
}

function AliasesPanel({
  manhwa,
  onUpdated,
}: {
  manhwa: Manhwa;
  onUpdated: (m: Manhwa) => void;
}) {
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const aliases = input
      .split(",")
      .map((a) => a.trim())
      .filter((a) => a.length >= 2);

    if (aliases.length === 0) {
      toast.error("Indique au moins un titre alternatif (2 caractères minimum).");
      return;
    }

    setBusy(true);
    try {
      const res = await manhwaService.addAliases(manhwa._id, aliases);
      onUpdated({
        ...manhwa,
        altTitles: [...(manhwa.altTitles ?? []), ...res.addedAliases],
      });
      setInput("");
      toast.success(
        res.addedAliases.length > 0
          ? `${res.addedAliases.length} alias ajouté${res.addedAliases.length > 1 ? "s" : ""}.`
          : "Ces titres étaient déjà connus.",
      );
    } catch (e) {
      toast.error(
        e instanceof ApiError
          ? e.message
          : "Échec de l'ajout des alias.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="border-t border-ligne pt-5 flex flex-col gap-3">
      <div className="flex items-center gap-1.5 text-txt3">
        <Tag size={13} />
        <h2 className="text-[11px] uppercase tracking-wider font-mono">Admin — titres alternatifs</h2>
      </div>

      {manhwa.altTitles && manhwa.altTitles.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {manhwa.altTitles.map((t) => (
            <span
              key={t}
              className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-sur2 text-txt2"
            >
              {t}
            </span>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="ORV, Omniscient Reader's Viewpoint, 전지적 독자 시점"
          className="flex-1 bg-sur border border-ligne rounded-lg px-3.5 py-2.5 text-[13px] outline-none focus:border-vert/50 transition-colors"
        />
        <button
          type="submit"
          disabled={busy}
          className="flex items-center justify-center gap-2 bg-sur2 border border-ligne text-txt text-[13px] font-medium rounded-lg px-4 py-2.5 hover:border-ligne2 transition-all disabled:opacity-60"
        >
          Rattacher
        </button>
      </form>
      <p className="text-[11px] text-txt3">
        Sépare plusieurs titres par des virgules. Un import ultérieur portant l&apos;un de ces titres sera rattaché à cette fiche au lieu d&apos;en créer une nouvelle.
      </p>
    </div>
  );
}

// ─── Mur de l'abandon ───────────────────────────────────────────────────────

function DropOffBanner({
  stats,
  currentChapter,
}: {
  stats: Extract<DropOffStats, { available: true }>;
  currentChapter?: number;
}) {
  // Personnalisé seulement si le lecteur a une progression connue sur cette
  // fiche — sinon, la statistique reste un fait sur la communauté, pas une
  // comparaison le concernant.
  const passedDangerZone = currentChapter !== undefined && currentChapter >= stats.p75;
  const passedMedian = currentChapter !== undefined && currentChapter >= stats.median;

  return (
    <div
      className={`flex items-start gap-2.5 rounded-lg border px-3.5 py-3 mt-1 ${
        passedDangerZone
          ? "border-vert/25 bg-vert-t"
          : "border-ligne bg-sur2/60"
      }`}
    >
      {passedDangerZone ? (
        <ShieldCheck size={15} className="text-vert shrink-0 mt-0.5" />
      ) : (
        <TrendingDown size={15} className="text-txt3 shrink-0 mt-0.5" />
      )}
      <div className="flex flex-col gap-0.5">
        {passedDangerZone ? (
          <p className="text-[12.5px] text-txt2">
            Tu as dépassé le point où <b className="text-vert">75%</b> des abandons ont lieu sur
            cette série — tu es (quasi) tiré d&apos;affaire.
          </p>
        ) : passedMedian ? (
          <p className="text-[12.5px] text-txt2">
            Tu as dépassé la moitié des abandons — le plus dur est probablement passé.
          </p>
        ) : (
          <p className="text-[12.5px] text-txt2">
            <b className="text-txt">75%</b> des abandons sur cette série ont lieu avant le
            chapitre <b className="text-txt">{stats.p75}</b>.
          </p>
        )}
        <p className="text-[10.5px] text-txt3">
          D&apos;après {stats.sampleSize} lecteur{stats.sampleSize > 1 ? "s" : ""} ayant abandonné
          cette série.
        </p>
      </div>
    </div>
  );
}