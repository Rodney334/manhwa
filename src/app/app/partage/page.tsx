"use client";

import { useEffect, useState } from "react";
import { sharesService, type CreateSharePayload, type ExportPdfOptions } from "@/lib/services/shares.service";
import { libraryService, type LibraryComparison } from "@/lib/services/library.service";
import { Cover } from "@/components/features/Cover";
import { EmptyState, Spinner } from "@/components/ui/Primitives";
import { formatDate, formatChapter, cn } from "@/lib/utils/format";
import { toast } from "@/lib/stores/toast.store";
import { ApiError } from "@/lib/api/client";
import { useTranslations } from "@/lib/i18n/useTranslations";
import { useLocaleStore } from "@/lib/i18n/store";
import type { ReadingStatus, Share } from "@/types";
import { Share2, Copy, Trash2, Plus, Eye, EyeOff, Download, X, Users, Loader2 } from "lucide-react";

const ALL_STATUSES: ReadingStatus[] = [
  "reading",
  "plan_to_read",
  "on_hold",
  "completed",
  "dropped",
];

const EMPTY_FORM: CreateSharePayload = {
  title: "",
  statuses: [],
  favoritesOnly: false,
  minScore: undefined,
  includeProgress: true,
  includeNotes: false,
  expiresInDays: undefined,
};

const EMPTY_EXPORT: ExportPdfOptions = {
  status: undefined,
  favoritesOnly: false,
  minScore: undefined,
  includeNotes: false,
};

// Même principe que sur la fiche manhwa : un texte contenant des segments
// **gras** est rendu en `<b>` — utile ici pour la phrase de comparaison,
// dont seuls le pseudo et le nombre de séries en commun doivent ressortir.
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

export default function PartagePage() {
  const t = useTranslations("share");
  const readingStatus = useTranslations("common").readingStatus;
  const locale = useLocaleStore((s) => s.locale);
  const [shares, setShares] = useState<Share[] | null>(null);
  const [form, setForm] = useState<CreateSharePayload>(EMPTY_FORM);
  const [creating, setCreating] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [exportOptions, setExportOptions] = useState<ExportPdfOptions>(EMPTY_EXPORT);
  const [compareInput, setCompareInput] = useState("");
  const [comparing, setComparing] = useState(false);
  const [comparison, setComparison] = useState<LibraryComparison | null>(null);

  async function load() {
    try {
      const res = await sharesService.list();
      setShares(res);
    } catch {
      toast.error(t.loadError);
      setShares([]);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggleStatus(status: ReadingStatus) {
    setForm((f) => {
      const statuses = f.statuses ?? [];
      return {
        ...f,
        statuses: statuses.includes(status)
          ? statuses.filter((s) => s !== status)
          : [...statuses, status],
      };
    });
  }

  async function handleCreate() {
    setCreating(true);
    try {
      const { share } = await sharesService.create({
        ...form,
        title: form.title || undefined,
        minScore: form.minScore || undefined,
        expiresInDays: form.expiresInDays || undefined,
      });
      setShares((prev) => (prev ? [share, ...prev] : [share]));
      setForm(EMPTY_FORM);
      setShowForm(false);
      toast.success(t.created);
    } catch {
      toast.error(t.createError);
    } finally {
      setCreating(false);
    }
  }

  async function handleToggleActive(share: Share) {
    setShares(
      (prev) => prev?.map((s) => (s._id === share._id ? { ...s, isActive: !s.isActive } : s)) ?? prev,
    );
    try {
      await sharesService.update(share._id, { isActive: !share.isActive });
      toast.success(share.isActive ? t.revoked : t.reactivated);
    } catch {
      toast.error(t.updateError);
      load();
    }
  }

  async function handleDelete(id: string) {
    setShares((prev) => prev?.filter((s) => s._id !== id) ?? prev);
    try {
      await sharesService.remove(id);
      toast.info(t.deleted);
    } catch {
      toast.error(t.deleteError);
      load();
    }
  }

  function handleCopy(token: string) {
    const url = `${window.location.origin}/partage/${token}`;
    navigator.clipboard.writeText(url);
    toast.success(t.copied);
  }

  async function handleCompare() {
    if (!compareInput.trim()) return;
    setComparing(true);
    setComparison(null);
    try {
      const result = await libraryService.compare(compareInput);
      setComparison(result);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : t.compareNotFound);
    } finally {
      setComparing(false);
    }
  }

  async function handleExportPdf() {
    setExporting(true);
    try {
      const blob = await sharesService.exportPdf(exportOptions);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `manhwalist-${Date.now()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      setShowExportOptions(false);
    } catch {
      toast.error(t.exportError);
    } finally {
      setExporting(false);
    }
  }

  const compareSentence = comparison
    ? t.compareResult
        .replace("{username}", comparison.owner.username)
        .replace("{count}", String(comparison.counts.common))
        .replace(
          "{seriesWord}",
          comparison.counts.common > 1 ? t.seriesMany : t.seriesOne,
        )
        .replace(
          "{extra}",
          comparison.counts.common > 0
            ? t.compareResultTotal
                .replace("{mine}", String(comparison.counts.mine))
                .replace("{theirs}", String(comparison.counts.theirs))
            : "",
        )
    : "";

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-[28px] font-normal">{t.title}</h1>
          <p className="text-[13.5px] text-txt3 mt-1">{t.subtitle}</p>
        </div>
        <button
          onClick={() => setShowExportOptions((v) => !v)}
          className="flex items-center gap-1.5 text-[12.5px] text-txt3 hover:text-vert border border-ligne rounded-lg px-3 py-2 transition-colors shrink-0"
        >
          <Download size={13} /> {t.exportPdf}
        </button>
      </div>

      <div className="flex flex-col gap-4 rounded-xl border border-ligne bg-sur/60 p-4">
        <div className="flex items-center gap-2">
          <Users size={15} className="text-txt3" />
          <span className="text-[13px] font-medium">{t.compareTitle}</span>
        </div>
        <p className="text-[12px] text-txt3 -mt-2">{t.compareText}</p>
        <div className="flex gap-2">
          <input
            value={compareInput}
            onChange={(e) => setCompareInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCompare()}
            placeholder={t.comparePlaceholder}
            className="flex-1 bg-sur border border-ligne rounded-lg px-3.5 py-2.5 text-[13px] outline-none focus:border-vert/50 transition-colors"
          />
          <button
            onClick={handleCompare}
            disabled={comparing || !compareInput.trim()}
            className="flex items-center gap-1.5 bg-vert text-[#05130c] font-medium text-[13px] rounded-lg px-4 py-2.5 hover:brightness-110 transition-all disabled:opacity-60 shrink-0"
          >
            {comparing && <Loader2 size={13} className="animate-spin" />}
            {t.compareButton}
          </button>
        </div>

        {comparison && (
          <div className="flex flex-col gap-3 pt-2 border-t border-ligne">
            <p className="text-[12.5px] text-txt2">{renderBold(compareSentence, "text-vert")}</p>

            {comparison.common.length > 0 && (
              <div className="flex flex-col gap-1.5">
                {comparison.common.map((entry) => (
                  <div
                    key={entry.slug}
                    className="flex items-center gap-3 rounded-lg border border-ligne bg-sur2/60 px-3 py-2"
                  >
                    <Cover manhwa={entry} className="w-8 h-11 rounded shrink-0" />
                    <span className="flex-1 min-w-0 text-[12.5px] font-medium truncate">
                      {entry.title}
                    </span>
                    <span className="text-[11px] text-txt3 font-mono w-24 text-right">
                      {t.compareYou} : {entry.mine.currentChapter !== undefined
                        ? `ch. ${formatChapter(entry.mine.currentChapter)}`
                        : readingStatus[entry.mine.status]}
                    </span>
                    <span className="text-[11px] text-txt3 font-mono w-24 text-right">
                      {comparison.owner.username} :{" "}
                      {entry.theirs.currentChapter !== undefined
                        ? `ch. ${formatChapter(entry.theirs.currentChapter)}`
                        : readingStatus[entry.theirs.status]}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {showExportOptions && (
        <div className="flex flex-col gap-4 rounded-xl border border-ligne bg-sur/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium">{t.exportHeading}</span>
            <button
              onClick={() => setShowExportOptions(false)}
              className="text-txt3 hover:text-txt transition-colors"
            >
              <X size={15} />
            </button>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-[12px] text-txt3">{t.statusSingleLabel}</span>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setExportOptions((f) => ({ ...f, status: undefined }))}
                className={cn(
                  "px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors",
                  !exportOptions.status ? "bg-vert text-[#05130c]" : "bg-sur2 text-txt2 hover:text-txt",
                )}
              >
                {t.allStatuses}
              </button>
              {ALL_STATUSES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setExportOptions((f) => ({ ...f, status: s }))}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors",
                    exportOptions.status === s
                      ? "bg-vert text-[#05130c]"
                      : "bg-sur2 text-txt2 hover:text-txt",
                  )}
                >
                  {readingStatus[s]}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-[13px] text-txt2">
              <input
                type="checkbox"
                checked={exportOptions.favoritesOnly}
                onChange={(e) => setExportOptions((f) => ({ ...f, favoritesOnly: e.target.checked }))}
                className="accent-vert"
              />
              {t.favoritesOnly}
            </label>
            <label className="flex items-center gap-2 text-[13px] text-txt2">
              <input
                type="checkbox"
                checked={exportOptions.includeNotes}
                onChange={(e) => setExportOptions((f) => ({ ...f, includeNotes: e.target.checked }))}
                className="accent-vert"
              />
              {t.includeNotes}
            </label>
          </div>

          <label className="flex flex-col gap-1 text-[12px] text-txt3 max-w-[180px]">
            {t.minScore}
            <input
              type="number"
              min={1}
              max={10}
              value={exportOptions.minScore ?? ""}
              onChange={(e) =>
                setExportOptions((f) => ({
                  ...f,
                  minScore: e.target.value ? Number(e.target.value) : undefined,
                }))
              }
              className="bg-sur border border-ligne rounded-lg px-3 py-2 text-[13px] outline-none focus:border-vert/50 transition-colors"
            />
          </label>

          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setExportOptions(EMPTY_EXPORT)}
              className="text-[13px] text-txt3 hover:text-txt px-3 py-2 transition-colors"
            >
              {t.reset}
            </button>
            <button
              onClick={handleExportPdf}
              disabled={exporting}
              className="flex items-center gap-1.5 bg-vert text-[#05130c] font-medium text-[13px] rounded-lg px-4 py-2.5 hover:brightness-110 transition-all disabled:opacity-60"
            >
              <Download size={13} /> {exporting ? t.generating : t.downloadPdf}
            </button>
          </div>
        </div>
      )}

      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center justify-center gap-1.5 bg-vert text-[#05130c] font-medium text-[13px] rounded-lg px-4 py-2.5 hover:brightness-110 transition-all w-fit"
        >
          <Plus size={14} /> {t.newShareLink}
        </button>
      )}

      {showForm && (
        <div className="flex flex-col gap-4 rounded-xl border border-ligne bg-sur/60 p-4">
          <input
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder={t.titlePlaceholder}
            maxLength={120}
            className="bg-sur border border-ligne rounded-lg px-3.5 py-2.5 text-[13.5px] outline-none focus:border-vert/50 transition-colors"
          />

          <div className="flex flex-col gap-2">
            <span className="text-[12px] text-txt3">{t.statusMultiLabel}</span>
            <div className="flex flex-wrap gap-1.5">
              {ALL_STATUSES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleStatus(s)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors",
                    form.statuses?.includes(s)
                      ? "bg-vert text-[#05130c]"
                      : "bg-sur2 text-txt2 hover:text-txt",
                  )}
                >
                  {readingStatus[s]}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-[13px] text-txt2">
              <input
                type="checkbox"
                checked={form.favoritesOnly}
                onChange={(e) => setForm((f) => ({ ...f, favoritesOnly: e.target.checked }))}
                className="accent-vert"
              />
              {t.favoritesOnly}
            </label>
            <label className="flex items-center gap-2 text-[13px] text-txt2">
              <input
                type="checkbox"
                checked={form.includeProgress}
                onChange={(e) => setForm((f) => ({ ...f, includeProgress: e.target.checked }))}
                className="accent-vert"
              />
              {t.showProgress}
            </label>
            <label className="flex items-center gap-2 text-[13px] text-txt2">
              <input
                type="checkbox"
                checked={form.includeNotes}
                onChange={(e) => setForm((f) => ({ ...f, includeNotes: e.target.checked }))}
                className="accent-vert"
              />
              {t.includeNotes}
            </label>
          </div>

          <div className="flex flex-wrap gap-3">
            <label className="flex flex-col gap-1 text-[12px] text-txt3 flex-1 min-w-[140px]">
              {t.minScore}
              <input
                type="number"
                min={1}
                max={10}
                value={form.minScore ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, minScore: e.target.value ? Number(e.target.value) : undefined }))
                }
                className="bg-sur border border-ligne rounded-lg px-3 py-2 text-[13px] outline-none focus:border-vert/50 transition-colors"
              />
            </label>
            <label className="flex flex-col gap-1 text-[12px] text-txt3 flex-1 min-w-[140px]">
              {t.expiresIn}
              <input
                type="number"
                min={1}
                max={365}
                value={form.expiresInDays ?? ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    expiresInDays: e.target.value ? Number(e.target.value) : undefined,
                  }))
                }
                className="bg-sur border border-ligne rounded-lg px-3 py-2 text-[13px] outline-none focus:border-vert/50 transition-colors"
              />
            </label>
          </div>

          <div className="flex gap-2 justify-end">
            <button
              onClick={() => {
                setShowForm(false);
                setForm(EMPTY_FORM);
              }}
              className="text-[13px] text-txt3 hover:text-txt px-3 py-2 transition-colors"
            >
              {t.cancel}
            </button>
            <button
              onClick={handleCreate}
              disabled={creating}
              className="flex items-center gap-1.5 bg-vert text-[#05130c] font-medium text-[13px] rounded-lg px-4 py-2.5 hover:brightness-110 transition-all disabled:opacity-60"
            >
              {t.createLink}
            </button>
          </div>
        </div>
      )}

      {shares === null && (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      )}

      {shares !== null && shares.length === 0 && (
        <EmptyState icon={<Share2 size={26} />} title={t.emptyTitle} />
      )}

      {shares !== null && shares.length > 0 && (
        <div className="flex flex-col gap-2">
          {shares.map((s) => {
            const viewWord = s.viewCount !== 1 ? t.viewMany : t.viewOne;
            const meta =
              t.createdOn.replace("{date}", formatDate(s.createdAt, locale)) +
              ` · ${s.viewCount} ${viewWord}` +
              (s.expiresAt ? t.expiresOn.replace("{date}", formatDate(s.expiresAt, locale)) : "") +
              (!s.isActive ? t.revokedTag : "");

            return (
              <div
                key={s._id}
                className={cn(
                  "flex flex-col gap-2 rounded-xl border px-4 py-3",
                  s.isActive ? "border-ligne bg-sur/60" : "border-ligne bg-sur/20 opacity-60",
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-[13.5px] font-medium truncate">{s.title || t.untitled}</p>
                    <p className="text-[11.5px] text-txt3 font-mono mt-0.5">{meta}</p>
                  </div>
                  <button
                    onClick={() => handleCopy(s.token)}
                    className="flex items-center gap-1.5 text-[12px] text-txt3 hover:text-vert transition-colors px-2 py-1.5"
                  >
                    <Copy size={13} /> {t.copy}
                  </button>
                  <button
                    onClick={() => handleToggleActive(s)}
                    className="flex items-center gap-1.5 text-[12px] text-txt3 hover:text-or transition-colors px-2 py-1.5"
                  >
                    {s.isActive ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                  <button
                    onClick={() => handleDelete(s._id)}
                    className="flex items-center gap-1.5 text-[12px] text-txt3 hover:text-rouge transition-colors px-2 py-1.5"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {s.filters.statuses.length === 0 ? (
                    <span className="px-2 py-0.5 rounded-full text-[10.5px] bg-sur3 text-txt3">
                      {t.allStatusesBadge}
                    </span>
                  ) : (
                    s.filters.statuses.map((st) => (
                      <span key={st} className="px-2 py-0.5 rounded-full text-[10.5px] bg-sur3 text-txt3">
                        {readingStatus[st]}
                      </span>
                    ))
                  )}
                  {s.filters.favoritesOnly && (
                    <span className="px-2 py-0.5 rounded-full text-[10.5px] bg-sur3 text-txt3">
                      {t.favoritesBadge}
                    </span>
                  )}
                  {s.filters.minScore && (
                    <span className="px-2 py-0.5 rounded-full text-[10.5px] bg-sur3 text-txt3">
                      {t.minScoreBadge.replace("{n}", String(s.filters.minScore))}
                    </span>
                  )}
                  {s.includeNotes && (
                    <span className="px-2 py-0.5 rounded-full text-[10.5px] bg-or-t text-or">
                      {t.notesIncludedBadge}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}