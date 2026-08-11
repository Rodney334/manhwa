"use client";

import { useEffect, useState } from "react";
import { sharesService, type CreateSharePayload, type ExportPdfOptions } from "@/lib/services/shares.service";
import { EmptyState, Spinner } from "@/components/ui/Primitives";
import { READING_STATUS_LABELS, formatDate, cn } from "@/lib/utils/format";
import { toast } from "@/lib/stores/toast.store";
import type { ReadingStatus, Share } from "@/types";
import { Share2, Copy, Trash2, Plus, Eye, EyeOff, Download, X } from "lucide-react";

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

export default function PartagePage() {
  const [shares, setShares] = useState<Share[] | null>(null);
  const [form, setForm] = useState<CreateSharePayload>(EMPTY_FORM);
  const [creating, setCreating] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [exportOptions, setExportOptions] = useState<ExportPdfOptions>(EMPTY_EXPORT);

  async function load() {
    try {
      const res = await sharesService.list();
      setShares(res);
    } catch {
      toast.error("Impossible de charger tes partages.");
      setShares([]);
    }
  }

  useEffect(() => {
    load();
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
      toast.success("Lien de partage créé.");
    } catch {
      toast.error("Échec de la création du partage.");
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
      toast.success(share.isActive ? "Lien révoqué." : "Lien réactivé.");
    } catch {
      toast.error("Échec de la mise à jour.");
      load();
    }
  }

  async function handleDelete(id: string) {
    setShares((prev) => prev?.filter((s) => s._id !== id) ?? prev);
    try {
      await sharesService.remove(id);
      toast.info("Partage supprimé.");
    } catch {
      toast.error("Échec de la suppression.");
      load();
    }
  }

  function handleCopy(token: string) {
    const url = `${window.location.origin}/partage/${token}`;
    navigator.clipboard.writeText(url);
    toast.success("Lien copié.");
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
      toast.error("Échec de l'export PDF.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-[28px] font-normal">Partage</h1>
          <p className="text-[13.5px] text-txt3 mt-1">
            Génère un lien public en lecture seule vers ta bibliothèque, ou exporte-la en PDF.
          </p>
        </div>
        <button
          onClick={() => setShowExportOptions((v) => !v)}
          className="flex items-center gap-1.5 text-[12.5px] text-txt3 hover:text-vert border border-ligne rounded-lg px-3 py-2 transition-colors shrink-0"
        >
          <Download size={13} /> Export PDF
        </button>
      </div>

      {showExportOptions && (
        <div className="flex flex-col gap-4 rounded-xl border border-ligne bg-sur/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium">Que mettre dans le PDF ?</span>
            <button
              onClick={() => setShowExportOptions(false)}
              className="text-txt3 hover:text-txt transition-colors"
            >
              <X size={15} />
            </button>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-[12px] text-txt3">Statut (vide = tous)</span>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setExportOptions((f) => ({ ...f, status: undefined }))}
                className={cn(
                  "px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors",
                  !exportOptions.status ? "bg-vert text-[#05130c]" : "bg-sur2 text-txt2 hover:text-txt",
                )}
              >
                Tous
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
                  {READING_STATUS_LABELS[s]}
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
              Favoris uniquement
            </label>
            <label className="flex items-center gap-2 text-[13px] text-txt2">
              <input
                type="checkbox"
                checked={exportOptions.includeNotes}
                onChange={(e) => setExportOptions((f) => ({ ...f, includeNotes: e.target.checked }))}
                className="accent-vert"
              />
              Inclure mes notes
            </label>
          </div>

          <label className="flex flex-col gap-1 text-[12px] text-txt3 max-w-[180px]">
            Note minimale (1-10)
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
              Réinitialiser
            </button>
            <button
              onClick={handleExportPdf}
              disabled={exporting}
              className="flex items-center gap-1.5 bg-vert text-[#05130c] font-medium text-[13px] rounded-lg px-4 py-2.5 hover:brightness-110 transition-all disabled:opacity-60"
            >
              <Download size={13} /> {exporting ? "Génération…" : "Télécharger le PDF"}
            </button>
          </div>
        </div>
      )}

      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center justify-center gap-1.5 bg-vert text-[#05130c] font-medium text-[13px] rounded-lg px-4 py-2.5 hover:brightness-110 transition-all w-fit"
        >
          <Plus size={14} /> Nouveau lien de partage
        </button>
      )}

      {showForm && (
        <div className="flex flex-col gap-4 rounded-xl border border-ligne bg-sur/60 p-4">
          <input
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="Titre (optionnel — ex: Mes lectures en cours)"
            maxLength={120}
            className="bg-sur border border-ligne rounded-lg px-3.5 py-2.5 text-[13.5px] outline-none focus:border-vert/50 transition-colors"
          />

          <div className="flex flex-col gap-2">
            <span className="text-[12px] text-txt3">Statuts inclus (vide = tous)</span>
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
                  {READING_STATUS_LABELS[s]}
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
              Favoris uniquement
            </label>
            <label className="flex items-center gap-2 text-[13px] text-txt2">
              <input
                type="checkbox"
                checked={form.includeProgress}
                onChange={(e) => setForm((f) => ({ ...f, includeProgress: e.target.checked }))}
                className="accent-vert"
              />
              Afficher la progression
            </label>
            <label className="flex items-center gap-2 text-[13px] text-txt2">
              <input
                type="checkbox"
                checked={form.includeNotes}
                onChange={(e) => setForm((f) => ({ ...f, includeNotes: e.target.checked }))}
                className="accent-vert"
              />
              Inclure mes notes
            </label>
          </div>

          <div className="flex flex-wrap gap-3">
            <label className="flex flex-col gap-1 text-[12px] text-txt3 flex-1 min-w-[140px]">
              Note minimale (1-10)
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
              Expire dans (jours, vide = jamais)
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
              Annuler
            </button>
            <button
              onClick={handleCreate}
              disabled={creating}
              className="flex items-center gap-1.5 bg-vert text-[#05130c] font-medium text-[13px] rounded-lg px-4 py-2.5 hover:brightness-110 transition-all disabled:opacity-60"
            >
              Créer le lien
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
        <EmptyState icon={<Share2 size={26} />} title="Aucun lien de partage pour le moment" />
      )}

      {shares !== null && shares.length > 0 && (
        <div className="flex flex-col gap-2">
          {shares.map((s) => (
            <div
              key={s._id}
              className={cn(
                "flex flex-col gap-2 rounded-xl border px-4 py-3",
                s.isActive ? "border-ligne bg-sur/60" : "border-ligne bg-sur/20 opacity-60",
              )}
            >
              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-[13.5px] font-medium truncate">{s.title || "Sans titre"}</p>
                  <p className="text-[11.5px] text-txt3 font-mono mt-0.5">
                    créé le {formatDate(s.createdAt)} · {s.viewCount} vue{s.viewCount !== 1 ? "s" : ""}
                    {s.expiresAt ? ` · expire le ${formatDate(s.expiresAt)}` : ""}
                    {!s.isActive ? " · révoqué" : ""}
                  </p>
                </div>
                <button
                  onClick={() => handleCopy(s.token)}
                  className="flex items-center gap-1.5 text-[12px] text-txt3 hover:text-vert transition-colors px-2 py-1.5"
                >
                  <Copy size={13} /> Copier
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
                    tous statuts
                  </span>
                ) : (
                  s.filters.statuses.map((st) => (
                    <span key={st} className="px-2 py-0.5 rounded-full text-[10.5px] bg-sur3 text-txt3">
                      {READING_STATUS_LABELS[st]}
                    </span>
                  ))
                )}
                {s.filters.favoritesOnly && (
                  <span className="px-2 py-0.5 rounded-full text-[10.5px] bg-sur3 text-txt3">favoris</span>
                )}
                {s.filters.minScore && (
                  <span className="px-2 py-0.5 rounded-full text-[10.5px] bg-sur3 text-txt3">
                    note ≥ {s.filters.minScore}
                  </span>
                )}
                {s.includeNotes && (
                  <span className="px-2 py-0.5 rounded-full text-[10.5px] bg-or-t text-or">
                    notes incluses
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}