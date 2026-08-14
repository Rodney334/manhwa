"use client";

import { useEffect, useState } from "react";
import { adminService, type AuditLog } from "@/lib/services/admin.service";
import { EmptyState, Spinner } from "@/components/ui/Primitives";
import { formatRelative, formatDate, cn } from "@/lib/utils/format";
import { toast } from "@/lib/stores/toast.store";
import { useTranslations } from "@/lib/i18n/useTranslations";
import { useLocaleStore } from "@/lib/i18n/store";
import type { Messages } from "@/lib/i18n/messages/fr";
import {
  ScrollText,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Bot,
  ShieldAlert,
  ArrowRight,
} from "lucide-react";

type Category = "auth" | "manhwa" | "user" | "job";

const CATEGORY_STYLE: Record<Category, string> = {
  auth: "bg-rouge-t text-rouge",
  manhwa: "bg-vert-t text-vert",
  user: "bg-or-t text-or",
  job: "bg-sur3 text-txt3",
};

function actionMeta(
  action: string,
  actions: Messages["admin"]["journal"]["actions"],
): { label: string; category: Category } {
  const known = (actions as Record<string, string>)[action];
  if (known) {
    // Le préfixe avant le point ("manhwa.create" → "manhwa") correspond
    // toujours à une des 4 catégories — c'est la convention de nommage du
    // backend pour ces actions, donc fiable pour la déduire sans mapping
    // séparé à maintenir en double.
    const category = (action.split(".")[0] as Category) ?? "job";
    return { label: known, category };
  }
  return { label: action, category: "job" };
}

export default function JournalPage() {
  const t = useTranslations("admin").journal;
  const locale = useLocaleStore((s) => s.locale);
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
        toast.error(t.loadError);
        setLogs([]);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, actionFilter]);

  const filteredLogs =
    logs && categoryFilter
      ? logs.filter((l) => actionMeta(l.action, t.actions).category === categoryFilter)
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
        <h1 className="font-display text-[28px] font-normal">{t.title}</h1>
        <p className="text-[13.5px] text-txt3 mt-1">{t.subtitle}</p>
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
          <option value="">{t.allCategories}</option>
          {(Object.keys(t.categories) as Category[]).map((c) => (
            <option key={c} value={c}>
              {t.categories[c]}
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
          <option value="">{t.allActions}</option>
          {Object.entries(t.actions)
            .filter(([action]) => !categoryFilter || action.split(".")[0] === categoryFilter)
            .map(([action, label]) => (
              <option key={action} value={action}>
                {label}
              </option>
            ))}
        </select>

        {hasFilters && (
          <button
            onClick={resetFilters}
            className="text-[12px] text-txt3 hover:text-txt2 transition-colors"
          >
            {t.reset}
          </button>
        )}

        {total > 0 && (
          <span className="text-[11.5px] text-txt3 font-mono ml-auto">
            {total} {total > 1 ? t.entryMany : t.entryOne}
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
          title={hasFilters ? t.emptyFiltered : t.emptyTitle}
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
              t={t}
              locale={locale}
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
            <ChevronLeft size={14} /> {t.previous}
          </button>
          <span className="text-[12px] text-txt3 font-mono">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="flex items-center gap-1 text-[12.5px] text-txt3 hover:text-txt disabled:opacity-40 disabled:hover:text-txt3 transition-colors"
          >
            {t.next} <ChevronRight size={14} />
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
  t,
  locale,
}: {
  log: AuditLog;
  expanded: boolean;
  onToggle: () => void;
  t: Messages["admin"]["journal"];
  locale: "fr" | "en";
}) {
  const meta = actionMeta(log.action, t.actions);
  const actor =
    typeof log.actorId === "object" && log.actorId ? log.actorId.username : undefined;
  const isSystem = log.actorRole === "system";
  const hasDetail = Boolean(log.reason || log.changes?.before || log.changes?.after);
  const targetTypeLabel = log.targetType
    ? (t.targetTypes as Record<string, string>)[log.targetType] ?? log.targetType
    : undefined;

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
              <Bot size={12} className="text-txt3 shrink-0" /> {t.automatic}
            </>
          ) : actor ? (
            actor
          ) : (
            <span className="text-txt3">{t.deletedAccount}</span>
          )}
          {log.actorRole === "admin" && (
            <ShieldAlert size={11} className="text-or shrink-0" />
          )}
        </span>

        {log.targetLabel && (
          <span className="flex items-center gap-1 text-[12px] text-txt3 min-w-0 truncate">
            <ArrowRight size={11} className="shrink-0" />
            <span className="text-txt2 truncate">{log.targetLabel}</span>
          </span>
        )}

        <span
          className="ml-auto shrink-0 text-[11px] font-mono text-txt3"
          suppressHydrationWarning
          title={formatDate(log.createdAt, locale)}
        >
          {formatRelative(log.createdAt, locale)}
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
              <span className="text-txt3">{t.reasonLabel}</span>
              {log.reason}
            </p>
          )}

          {(log.changes?.before || log.changes?.after) && (
            <div className="grid grid-cols-2 gap-3">
              {log.changes?.before && (
                <div className="rounded-lg border border-rouge/20 bg-rouge-t/40 p-3">
                  <p className="text-[10.5px] uppercase tracking-wider text-txt3 font-mono mb-1.5">
                    {t.before}
                  </p>
                  <DiffFields fields={log.changes.before} />
                </div>
              )}
              {log.changes?.after && (
                <div className="rounded-lg border border-vert/20 bg-vert-t/40 p-3">
                  <p className="text-[10.5px] uppercase tracking-wider text-txt3 font-mono mb-1.5">
                    {t.after}
                  </p>
                  <DiffFields fields={log.changes.after} />
                </div>
              )}
            </div>
          )}

          {(log.ip || log.targetId) && (
            <p className="text-[10.5px] text-txt3 font-mono">
              {log.targetType &&
                log.targetId &&
                `${targetTypeLabel} · ${log.targetLabel ?? log.targetId}`}
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