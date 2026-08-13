"use client";

import { useEffect, useState } from "react";
import { adminService, type AuditLog } from "@/lib/services/admin.service";
import { EmptyState, Spinner } from "@/components/ui/Primitives";
import { formatRelative, formatDate, cn } from "@/lib/utils/format";
import { toast } from "@/lib/stores/toast.store";
import {
  ScrollText,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Bot,
  ShieldAlert,
} from "lucide-react";

type Category = "auth" | "manhwa" | "user" | "job";

const ACTION_META: Record<string, { label: string; category: Category }> = {
  "auth.login_failed": { label: "Échec de connexion", category: "auth" },
  "manhwa.create": { label: "Fiche créée", category: "manhwa" },
  "manhwa.update": { label: "Fiche modifiée", category: "manhwa" },
  "manhwa.delete": { label: "Fiche supprimée", category: "manhwa" },
  "manhwa.submit": { label: "Fiche proposée", category: "manhwa" },
  "manhwa.approve": { label: "Fiche validée", category: "manhwa" },
  "manhwa.reject": { label: "Fiche refusée", category: "manhwa" },
  "manhwa.merge": { label: "Fiches fusionnées", category: "manhwa" },
  "manhwa.import": { label: "Fiche importée", category: "manhwa" },
  "manhwa.chapter_jump": { label: "Correction de chapitre", category: "manhwa" },
  "user.suspend": { label: "Compte suspendu", category: "user" },
  "user.reactivate": { label: "Compte réactivé", category: "user" },
  "user.promote": { label: "Promu administrateur", category: "user" },
  "user.demote": { label: "Rétrogradé", category: "user" },
  "user.delete": { label: "Compte supprimé", category: "user" },
  "user.library_view": { label: "Bibliothèque consultée", category: "user" },
  "job.trigger": { label: "Tâche déclenchée", category: "job" },
  "job.run": { label: "Tâche exécutée", category: "job" },
};

const CATEGORY_STYLE: Record<Category, string> = {
  auth: "bg-rouge-t text-rouge",
  manhwa: "bg-vert-t text-vert",
  user: "bg-or-t text-or",
  job: "bg-sur3 text-txt3",
};

const CATEGORY_LABEL: Record<Category, string> = {
  auth: "Sécurité",
  manhwa: "Catalogue",
  user: "Comptes",
  job: "Tâches",
};

function actionMeta(action: string) {
  return ACTION_META[action] ?? { label: action, category: "job" as Category };
}

export default function JournalPage() {
  const [logs, setLogs] = useState<AuditLog[] | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<Category | "">("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const pageSize = 30;

  useEffect(() => {
    setLogs(null);
    adminService
      .auditLogs({
        page,
        pageSize,
        action: actionFilter || undefined,
      })
      .then((res) => {
        setLogs(res.items);
        setTotal(res.total);
      })
      .catch(() => {
        toast.error("Impossible de charger le journal.");
        setLogs([]);
      });
  }, [page, actionFilter]);

  const filteredLogs =
    logs && categoryFilter
      ? logs.filter((l) => actionMeta(l.action).category === categoryFilter)
      : logs;

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const hasFilters = Boolean(actionFilter || categoryFilter);

  function resetFilters() {
    setActionFilter("");
    setCategoryFilter("");
    setPage(1);
  }

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div>
        <h1 className="font-display text-[28px] font-normal">Journal</h1>
        <p className="text-[13.5px] text-txt3 mt-1">
          Journal d&apos;audit des actions d&apos;administration — écriture seule, rien n&apos;y
          est jamais modifié ni supprimé.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value as Category | "");
            setActionFilter("");
            setPage(1);
          }}
          className="bg-sur border border-ligne rounded-lg px-3 py-2 text-[12.5px] text-txt2 outline-none focus:border-vert/50 transition-colors"
        >
          <option value="">Toutes catégories</option>
          {(Object.keys(CATEGORY_LABEL) as Category[]).map((c) => (
            <option key={c} value={c}>
              {CATEGORY_LABEL[c]}
            </option>
          ))}
        </select>

        <select
          value={actionFilter}
          onChange={(e) => {
            setActionFilter(e.target.value);
            setPage(1);
          }}
          className="bg-sur border border-ligne rounded-lg px-3 py-2 text-[12.5px] text-txt2 outline-none focus:border-vert/50 transition-colors"
        >
          <option value="">Toutes actions</option>
          {Object.entries(ACTION_META)
            .filter(([, m]) => !categoryFilter || m.category === categoryFilter)
            .map(([action, m]) => (
              <option key={action} value={action}>
                {m.label}
              </option>
            ))}
        </select>

        {hasFilters && (
          <button
            onClick={resetFilters}
            className="text-[12px] text-txt3 hover:text-txt2 transition-colors"
          >
            Réinitialiser
          </button>
        )}

        {total > 0 && (
          <span className="text-[11.5px] text-txt3 font-mono ml-auto">
            {total} entrée{total > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {logs === null && (
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      )}

      {logs !== null && filteredLogs !== null && filteredLogs.length === 0 && (
        <EmptyState
          icon={<ScrollText size={26} />}
          title={hasFilters ? "Rien avec ces filtres" : "Journal vide"}
        />
      )}

      {filteredLogs !== null && filteredLogs.length > 0 && (
        <div className="flex flex-col rounded-xl border border-ligne overflow-hidden">
          {filteredLogs.map((log) => (
            <LogRow
              key={log._id}
              log={log}
              expanded={expandedId === log._id}
              onToggle={() => setExpandedId((prev) => (prev === log._id ? null : log._id))}
            />
          ))}
        </div>
      )}

      {logs !== null && totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="flex items-center gap-1 text-[12.5px] text-txt3 hover:text-txt disabled:opacity-40 disabled:hover:text-txt3 transition-colors"
          >
            <ChevronLeft size={14} /> Précédent
          </button>
          <span className="text-[12px] text-txt3 font-mono">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="flex items-center gap-1 text-[12.5px] text-txt3 hover:text-txt disabled:opacity-40 disabled:hover:text-txt3 transition-colors"
          >
            Suivant <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

function LogRow({
  log,
  expanded,
  onToggle,
}: {
  log: AuditLog;
  expanded: boolean;
  onToggle: () => void;
}) {
  const meta = actionMeta(log.action);
  const actor =
    typeof log.actorId === "object" && log.actorId ? log.actorId.username : undefined;
  const isSystem = log.actorRole === "system";
  const hasDetail = Boolean(log.reason || log.changes?.before || log.changes?.after);

  return (
    <div className="border-b border-ligne last:border-b-0 bg-sur/60">
      <button
        onClick={hasDetail ? onToggle : undefined}
        className={cn(
          "w-full flex items-center gap-3 px-4 py-3 text-left",
          hasDetail && "hover:bg-sur2/60 transition-colors cursor-pointer",
        )}
      >
        <span
          className={cn(
            "shrink-0 text-[10.5px] font-medium px-2 py-0.5 rounded-full",
            CATEGORY_STYLE[meta.category],
          )}
        >
          {meta.label}
        </span>

        <span className="flex items-center gap-1.5 text-[12.5px] text-txt2 min-w-0 truncate">
          {isSystem ? (
            <>
              <Bot size={12} className="text-txt3 shrink-0" /> Automatique
            </>
          ) : actor ? (
            actor
          ) : (
            <span className="text-txt3">Compte supprimé</span>
          )}
          {log.actorRole === "admin" && (
            <ShieldAlert size={11} className="text-or shrink-0" />
          )}
        </span>

        <span
          className="ml-auto shrink-0 text-[11px] font-mono text-txt3"
          suppressHydrationWarning
          title={formatDate(log.createdAt)}
        >
          {formatRelative(log.createdAt)}
        </span>

        {hasDetail && (
          <ChevronDown
            size={14}
            className={cn(
              "shrink-0 text-txt3 transition-transform",
              expanded && "rotate-180",
            )}
          />
        )}
      </button>

      {expanded && hasDetail && (
        <div className="px-4 pb-4 flex flex-col gap-3 border-t border-ligne pt-3">
          {log.reason && (
            <p className="text-[12.5px] text-txt2">
              <span className="text-txt3">Motif — </span>
              {log.reason}
            </p>
          )}

          {(log.changes?.before || log.changes?.after) && (
            <div className="grid grid-cols-2 gap-3">
              {log.changes?.before && (
                <div className="rounded-lg border border-rouge/20 bg-rouge-t/40 p-3">
                  <p className="text-[10.5px] uppercase tracking-wider text-txt3 font-mono mb-1.5">
                    Avant
                  </p>
                  <DiffFields fields={log.changes.before} />
                </div>
              )}
              {log.changes?.after && (
                <div className="rounded-lg border border-vert/20 bg-vert-t/40 p-3">
                  <p className="text-[10.5px] uppercase tracking-wider text-txt3 font-mono mb-1.5">
                    Après
                  </p>
                  <DiffFields fields={log.changes.after} />
                </div>
              )}
            </div>
          )}

          {(log.ip || log.targetId) && (
            <p className="text-[10.5px] text-txt3 font-mono">
              {log.targetType && log.targetId && `${log.targetType} · ${log.targetId}`}
              {log.ip && ` · ${log.ip}`}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function DiffFields({ fields }: { fields: Record<string, unknown> }) {
  return (
    <div className="flex flex-col gap-1">
      {Object.entries(fields).map(([key, value]) => (
        <div key={key} className="text-[11.5px] font-mono">
          <span className="text-txt3">{key} : </span>
          <span className="text-txt2">{String(value)}</span>
        </div>
      ))}
    </div>
  );
}