"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { manhwaService, type DropOffStats } from "@/lib/services/manhwa.service";
import { libraryService } from "@/lib/services/library.service";
import { Cover } from "@/components/features/Cover";
import { Spinner } from "@/components/ui/Primitives";
import { formatChapter, cleanSynopsis } from "@/lib/utils/format";
import { toast } from "@/lib/stores/toast.store";
import { ApiError } from "@/lib/api/client";
import { useAuthStore } from "@/lib/stores/auth.store";
import { useTranslations } from "@/lib/i18n/useTranslations";
import type { Messages } from "@/lib/i18n/messages/fr";
import type { Manhwa, LibraryEntry, ReadingStatus } from "@/types";
import { ArrowLeft, Plus, Minus, Heart, ExternalLink, Trash2, Tag, Star, TrendingDown, ShieldCheck } from "lucide-react";

const STATUS_OPTIONS: ReadingStatus[] = [
  "plan_to_read",
  "reading",
  "on_hold",
  "completed",
  "dropped",
];

// Rend un texte contenant des segments **gras** en `<b>`, pour les phrases
// du mur de l'abandon dont seule une portion (un pourcentage, un numéro de
// chapitre) doit ressortir visuellement — impossible à exprimer avec une
// simple interpolation `{placeholder}` puisque la mise en forme, pas
// seulement la valeur, fait partie de ce qui varie selon la phrase.
function renderBold(text: string, boldClassName: string): React.ReactNode {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <b key={i} className={boldClassName}>
        {part}
      </b>
    ) : (
      part
    ),
  );
}

export default function FichePage() {
  const t = useTranslations("manhwaDetail");
  const readingStatus = useTranslations("common").readingStatus;
  const publicationStatus = useTranslations("common").publicationStatus;
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
        const found = await libraryService.findByManhwa(m._id);
        setEntry(found);
        if (found) {
          setChapterInput(String(found.currentChapter ?? 0));
          setNotesInput(found.notes ?? "");
        }
      } catch {
        setEntry(null);
      }
    } catch {
      toast.error(t.notFound);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      toast.success(t.addedToLibrary);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : t.addError);
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
      toast.error(t.statusUpdateError);
    }
  }

  // `POST /increment` n'accepte que des valeurs positives (c'est son rôle :
  // le geste rapide "+1", jamais une correction en arrière) — le backend le
  // refuse en 422 si on lui envoie un pas négatif. Pour reculer (corriger
  // une erreur de saisie), c'est `PATCH /progress` qu'il faut appeler, avec
  // la valeur absolue résultante plutôt qu'un delta.
  // Verrou dédié : sans lui, un double-clic (ou un doigt qui glisse sur
  // mobile) peut envoyer deux requêtes avant que la première ne soit
  // traitée. Le chapitre final affiché reste correct dans ce cas (les deux
  // appels convergent au même endroit), mais l'historique, lui, garde une
  // entrée de trop — exactement le genre d'écart d'une unité observé sur
  // le Bilan de lecture. `busy` n'est pas réutilisé ici : il sert déjà à
  // l'ajout/retrait de la bibliothèque, un état sans rapport.
  const [chapterBusy, setChapterBusy] = useState(false);

  async function handleIncrement(step: number) {
    if (!entry || chapterBusy) return;
    setChapterBusy(true);
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
      toast.error(t.updateError);
    } finally {
      setChapterBusy(false);
    }
  }

  async function handleProgressSubmit() {
    if (!entry) return;
    const value = parseFloat(chapterInput);
    if (Number.isNaN(value) || value < 0) {
      toast.error(t.invalidChapter);
      setChapterInput(String(entry.currentChapter ?? 0));
      return;
    }
    if (value === entry.currentChapter) return;
    try {
      const updated = await libraryService.updateProgress(entry._id, value);
      setEntry(updated);
      setChapterInput(String(updated.currentChapter ?? 0));
      toast.success(t.progressSaved);
    } catch {
      toast.error(t.updateError);
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
      toast.error(t.updateError);
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
      toast.error(t.scoreUpdateError);
    }
  }

  async function handleNotesSubmit() {
    if (!entry) return;
    if (notesInput === (entry.notes ?? "")) return;
    try {
      const updated = await libraryService.update(entry._id, { notes: notesInput });
      setEntry(updated);
      setNotesInput(updated.notes ?? "");
      toast.success(t.notesSaved);
    } catch {
      toast.error(t.notesSaveError);
    }
  }

  async function handleRemove() {
    if (!entry) return;
    setBusy(true);
    try {
      await libraryService.remove(entry._id);
      setEntry(null);
      toast.info(t.removed);
    } catch {
      toast.error(t.removeError);
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
        <ArrowLeft size={14} /> {t.back}
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
            <span>{publicationStatus[manhwa.status] ?? manhwa.status}</span>
            {manhwa.totalChapters ? <span>{manhwa.totalChapters} {t.chapters}</span> : null}
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
            <DropOffBanner stats={dropOff} currentChapter={entry?.currentChapter} t={t.dropOff} />
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
            <Plus size={15} /> {t.addToLibrary}
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
                  {readingStatus[s]}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 bg-sur border border-ligne rounded-lg px-2 py-1.5">
                <button
                  onClick={() => handleIncrement(-1)}
                  onMouseDown={(e) => e.preventDefault()}
                  disabled={chapterBusy}
                  className="w-7 h-7 flex items-center justify-center rounded-md text-txt2 hover:text-txt hover:bg-sur3 transition-colors disabled:opacity-40 disabled:pointer-events-none"
                  aria-label={t.prevChapterAria}
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
                  disabled={chapterBusy}
                  className="w-7 h-7 flex items-center justify-center rounded-md text-vert hover:bg-vert-t transition-colors disabled:opacity-40 disabled:pointer-events-none"
                  aria-label={t.nextChapterAria}
                >
                  <Plus size={14} />
                </button>
              </div>
              <span className="text-[12.5px] text-txt3 font-mono">
                / {manhwa.totalChapters ? formatChapter(manhwa.totalChapters) : "?"} {t.chapters}
              </span>

              <button
                onClick={handleToggleFavorite}
                className={`ml-auto flex items-center gap-1.5 text-[12.5px] rounded-lg px-3 py-2 border transition-colors ${entry.isFavorite
                    ? "border-vert/40 text-vert bg-vert-t"
                    : "border-ligne text-txt3 hover:text-txt"
                  }`}
              >
                <Heart size={13} className={entry.isFavorite ? "fill-vert" : ""} />
                {t.favorite}
              </button>

              <button
                onClick={handleRemove}
                disabled={busy}
                className="flex items-center gap-1.5 text-[12.5px] rounded-lg px-3 py-2 border border-ligne text-txt3 hover:text-rouge hover:border-rouge/40 transition-colors"
              >
                <Trash2 size={13} /> {t.remove}
              </button>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-[12px] text-txt3">{t.yourScore}</span>
              <div className="flex items-center gap-1">
                {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    onClick={() => handleScoreChange(n)}
                    aria-label={t.rateAria.replace("{n}", String(n))}
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
              <span className="text-[12px] text-txt3">{t.yourNotes}</span>
              <textarea
                value={notesInput}
                onChange={(e) => setNotesInput(e.target.value)}
                onBlur={handleNotesSubmit}
                rows={3}
                maxLength={1000}
                placeholder={t.notesPlaceholder}
                className="bg-sur border border-ligne rounded-lg px-3.5 py-2.5 text-[13px] outline-none focus:border-vert/50 transition-colors resize-none"
              />
            </label>
          </div>
        )}
      </div>

      {isAdmin && (
        <AliasesPanel manhwa={manhwa} onUpdated={(m) => setManhwa(m)} t={t.aliases} />
      )}
    </div>
  );
}

function AliasesPanel({
  manhwa,
  onUpdated,
  t,
}: {
  manhwa: Manhwa;
  onUpdated: (m: Manhwa) => void;
  t: Messages["manhwaDetail"]["aliases"];
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
      toast.error(t.minLengthError);
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
          ? (res.addedAliases.length > 1 ? t.addedMany : t.addedOne).replace(
              "{count}",
              String(res.addedAliases.length),
            )
          : t.alreadyKnown,
      );
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : t.addError);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="border-t border-ligne pt-5 flex flex-col gap-3">
      <div className="flex items-center gap-1.5 text-txt3">
        <Tag size={13} />
        <h2 className="text-[11px] uppercase tracking-wider font-mono">{t.title}</h2>
      </div>

      {manhwa.altTitles && manhwa.altTitles.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {manhwa.altTitles.map((alt) => (
            <span
              key={alt}
              className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-sur2 text-txt2"
            >
              {alt}
            </span>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t.placeholder}
          className="flex-1 bg-sur border border-ligne rounded-lg px-3.5 py-2.5 text-[13px] outline-none focus:border-vert/50 transition-colors"
        />
        <button
          type="submit"
          disabled={busy}
          className="flex items-center justify-center gap-2 bg-sur2 border border-ligne text-txt text-[13px] font-medium rounded-lg px-4 py-2.5 hover:border-ligne2 transition-all disabled:opacity-60"
        >
          {t.submit}
        </button>
      </form>
      <p className="text-[11px] text-txt3">{t.hint}</p>
    </div>
  );
}

// ─── Mur de l'abandon ───────────────────────────────────────────────────────

function DropOffBanner({
  stats,
  currentChapter,
  t,
}: {
  stats: Extract<DropOffStats, { available: true }>;
  currentChapter?: number;
  t: Messages["manhwaDetail"]["dropOff"];
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
            {renderBold(t.passedDangerZone, "text-vert")}
          </p>
        ) : passedMedian ? (
          <p className="text-[12.5px] text-txt2">{t.passedMedian}</p>
        ) : (
          <p className="text-[12.5px] text-txt2">
            {renderBold(t.threshold.replace("{p75}", String(stats.p75)), "text-txt")}
          </p>
        )}
        <p className="text-[10.5px] text-txt3">
          {(stats.sampleSize > 1 ? t.footerMany : t.footerOne).replace(
            "{count}",
            String(stats.sampleSize),
          )}
        </p>
      </div>
    </div>
  );
}