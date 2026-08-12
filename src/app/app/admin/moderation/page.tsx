"use client";

import { useEffect, useState } from "react";
import { adminService, type ModerationSubmission } from "@/lib/services/admin.service";
import { Cover } from "@/components/features/Cover";
import { EmptyState, Spinner } from "@/components/ui/Primitives";
import { formatRelative } from "@/lib/utils/format";
import { toast } from "@/lib/stores/toast.store";
import type { Manhwa } from "@/types";
import { ShieldCheck, Check, X, ChevronDown, GitMerge } from "lucide-react";

export default function ModerationPage() {
  const [items, setItems] = useState<ModerationSubmission[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  async function load() {
    try {
      const res = await adminService.moderationQueue({ pageSize: 50 });
      setItems(res.items);
    } catch {
      toast.error("Impossible de charger la file de modération.");
      setItems([]);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleApprove(id: string) {
    setBusyId(id);
    try {
      await adminService.approve(id);
      setItems((prev) => prev?.filter((i) => i._id !== id) ?? prev);
      if (expandedId === id) setExpandedId(null);
      toast.success("Proposition validée.");
    } catch {
      toast.error("Échec de la validation.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleReject(id: string) {
    const reason = window.prompt("Motif du refus (5 à 500 caractères) :");
    if (!reason || reason.trim().length < 5) {
      if (reason !== null) toast.error("Motif trop court.");
      return;
    }
    setBusyId(id);
    try {
      await adminService.reject(id, reason.trim());
      setItems((prev) => prev?.filter((i) => i._id !== id) ?? prev);
      if (expandedId === id) setExpandedId(null);
      toast.info("Proposition refusée.");
    } catch {
      toast.error("Échec du refus.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleMerge(id: string, target: Manhwa & { similarity: number }) {
    if (
      !window.confirm(
        `Fusionner "${target.title}" ← cette proposition ? Irréversible : la fiche proposée disparaîtra et ses éventuelles bibliothèques seront réaffectées vers "${target.title}".`,
      )
    ) {
      return;
    }
    setBusyId(id);
    try {
      const res = await adminService.merge(id, target._id);
      setItems((prev) => prev?.filter((i) => i._id !== id) ?? prev);
      if (expandedId === id) setExpandedId(null);
      toast.success(
        `Fusion effectuée (${res.reassignedEntries + res.mergedEntries} entrée${res.reassignedEntries + res.mergedEntries > 1 ? "s" : ""} de bibliothèque concernée${res.reassignedEntries + res.mergedEntries > 1 ? "s" : ""}).`,
      );
    } catch {
      toast.error("Échec de la fusion.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div>
        <h1 className="font-display text-[28px] font-normal">Modération</h1>
        <p className="text-[13.5px] text-txt3 mt-1">
          Fiches proposées par des contributeurs, les plus anciennes d&apos;abord.
        </p>
      </div>

      {items === null && (
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      )}

      {items !== null && items.length === 0 && (
        <EmptyState icon={<ShieldCheck size={26} />} title="File de modération vide" />
      )}

      {items !== null && items.length > 0 && (
        <div className="flex flex-col gap-2">
          {items.map((s) => (
            <div key={s._id} className="rounded-xl border border-ligne bg-sur/60 overflow-hidden">
              <div className="w-full flex items-center gap-3 px-4 py-3">
                <button
                  onClick={() => setExpandedId((prev) => (prev === s._id ? null : s._id))}
                  className="flex-1 min-w-0 flex items-center gap-2 text-left"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-[13.5px] font-medium truncate">{s.title}</p>
                    <p className="text-[11.5px] text-txt3 font-mono mt-0.5" suppressHydrationWarning>
                      {s.submittedBy?.username ?? "inconnu"} · {formatRelative(s.createdAt)}
                    </p>
                  </div>
                  <ChevronDown
                    size={15}
                    className={`text-txt3 shrink-0 transition-transform ${expandedId === s._id ? "rotate-180" : ""}`}
                  />
                </button>
                <button
                  onClick={() => handleApprove(s._id)}
                  disabled={busyId === s._id}
                  className="flex items-center gap-1 text-[12px] font-medium rounded-lg px-3 py-1.5 bg-vert-t text-vert hover:bg-vert hover:text-[#05130c] transition-colors disabled:opacity-60 shrink-0"
                >
                  <Check size={13} /> Valider
                </button>
                <button
                  onClick={() => handleReject(s._id)}
                  disabled={busyId === s._id}
                  className="flex items-center gap-1 text-[12px] font-medium rounded-lg px-3 py-1.5 bg-rouge-t text-rouge hover:bg-rouge hover:text-white transition-colors disabled:opacity-60 shrink-0"
                >
                  <X size={13} /> Refuser
                </button>
              </div>

              {expandedId === s._id && (
                <ModerationDetail
                  submissionId={s._id}
                  busy={busyId === s._id}
                  onMerge={(target) => handleMerge(s._id, target)}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ModerationDetail({
  submissionId,
  busy,
  onMerge,
}: {
  submissionId: string;
  busy: boolean;
  onMerge: (target: Manhwa & { similarity: number }) => void;
}) {
  const [data, setData] = useState<{
    submission: Manhwa;
    similar: (Manhwa & { similarity: number })[];
  } | null>(null);

  useEffect(() => {
    let active = true;
    adminService
      .moderationDetail(submissionId)
      .then((res) => {
        if (active) setData(res);
      })
      .catch(() => {
        if (active) toast.error("Impossible de charger le détail de cette proposition.");
      });
    return () => {
      active = false;
    };
  }, [submissionId]);

  if (!data) {
    return (
      <div className="flex justify-center py-8 border-t border-ligne">
        <Spinner />
      </div>
    );
  }

  const { submission, similar } = data;

  return (
    <div className="border-t border-ligne px-4 py-4 flex flex-col gap-4">
      <div className="flex gap-4">
        <Cover manhwa={submission} className="w-20 h-28 rounded-lg shrink-0" />
        <div className="flex-1 min-w-0 flex flex-col gap-1.5">
          {submission.synopsis && (
            <p className="text-[12.5px] text-txt2 leading-relaxed line-clamp-4">
              {submission.synopsis}
            </p>
          )}
          <div className="flex flex-wrap gap-1.5 mt-1">
            {(submission.genres ?? []).slice(0, 5).map((g) => (
              <span
                key={g}
                className="text-[10.5px] font-mono px-2 py-0.5 rounded-full bg-sur2 text-txt3"
              >
                {g}
              </span>
            ))}
          </div>
          <p className="text-[11.5px] text-txt3 font-mono mt-1">
            {submission.totalChapters ?? 0} chapitre{(submission.totalChapters ?? 0) > 1 ? "s" : ""}
            {submission.releaseYear ? ` · ${submission.releaseYear}` : ""}
            {submission.authors?.length ? ` · ${submission.authors.join(", ")}` : ""}
          </p>
        </div>
      </div>

      {similar.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-[11px] uppercase tracking-wider text-txt3 font-mono">
            Fiches proches — fusionner au lieu de valider en double
          </p>
          <div className="flex flex-col gap-1.5">
            {similar.map((m) => (
              <div
                key={m._id}
                className="flex items-center gap-3 rounded-lg border border-ligne bg-sur2/60 px-3 py-2"
              >
                <Cover manhwa={m} className="w-8 h-11 rounded shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[12.5px] font-medium truncate">{m.title}</p>
                  <p className="text-[11px] text-txt3 font-mono">
                    {Math.round(m.similarity * 100)}% similaire · {m.totalChapters ?? 0} ch.
                  </p>
                </div>
                <button
                  onClick={() => onMerge(m)}
                  disabled={busy}
                  className="flex items-center gap-1.5 text-[11.5px] font-medium rounded-lg px-3 py-1.5 bg-or-t text-or hover:bg-or hover:text-[#1a1204] transition-colors disabled:opacity-60 shrink-0"
                >
                  <GitMerge size={12} /> Fusionner
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}