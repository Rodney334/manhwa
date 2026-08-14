"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { notificationsService } from "@/lib/services/notifications.service";
import { useNotificationsStore } from "@/lib/stores/notifications.store";
import { Cover } from "@/components/features/Cover";
import { EmptyState, Spinner } from "@/components/ui/Primitives";
import { formatRelative, cn } from "@/lib/utils/format";
import { toast } from "@/lib/stores/toast.store";
import { useTranslations } from "@/lib/i18n/useTranslations";
import { useLocaleStore } from "@/lib/i18n/store";
import type { Messages } from "@/lib/i18n/messages/fr";
import type { Notification, NotificationManhwaRef } from "@/types";
import { Bell, CheckCheck, Sparkles, RefreshCcw, Check, X, ShieldAlert, Info } from "lucide-react";

function getManhwaRef(n: Notification): NotificationManhwaRef | null {
  return n.manhwaId && typeof n.manhwaId === "object" ? n.manhwaId : null;
}

const TYPE_ICON: Record<string, React.ElementType> = {
  new_chapter: Sparkles,
  status_change: RefreshCcw,
  submission_approved: Check,
  submission_rejected: X,
  account_action: ShieldAlert,
  system: Info,
};

/** Construit un titre + message lisibles à partir du type et du payload —
 *  le backend ne renvoie ni l'un ni l'autre tout prêts. */
function describeNotification(
  n: Notification,
  t: Messages["notifications"]["types"],
): { title: string; message: string } {
  const manhwa = getManhwaRef(n);
  const p = n.payload ?? {};

  switch (n.type) {
    case "new_chapter":
      return {
        title: manhwa?.title ?? p.title ?? t.newChapterTitle,
        message: p.chapter
          ? t.newChapterMessage.replace("{chapter}", String(p.chapter))
          : t.newChapterMessageGeneric,
      };
    case "status_change":
      return {
        title: manhwa?.title ?? p.title ?? t.statusChangeTitle,
        message: p.message ?? t.statusChangeMessage,
      };
    case "submission_approved":
      return {
        title: p.title ?? manhwa?.title ?? t.submissionApprovedTitle,
        message: p.message ?? t.submissionApprovedMessage,
      };
    case "submission_rejected":
      return {
        title: p.title ?? manhwa?.title ?? t.submissionRejectedTitle,
        message: p.message ?? t.submissionRejectedMessage,
      };
    case "account_action":
      return {
        title: t.accountActionTitle,
        message: p.message ?? t.accountActionMessage,
      };
    case "system":
    default:
      return {
        title: p.title ?? t.systemTitle,
        message: p.message ?? t.systemMessage,
      };
  }
}

export default function NotificationsPage() {
  const t = useTranslations("notifications");
  const locale = useLocaleStore((s) => s.locale);
  const [items, setItems] = useState<Notification[] | null>(null);
  const setUnreadCount = useNotificationsStore((s) => s.setUnreadCount);
  const decrementUnread = useNotificationsStore((s) => s.decrement);

  async function load() {
    try {
      const res = await notificationsService.list({ pageSize: 50 });
      setItems(res.items);
      setUnreadCount(res.unreadCount);
    } catch {
      toast.error(t.loadError);
      setItems([]);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleMarkRead(id: string) {
    setItems((prev) => prev?.map((n) => (n._id === id ? { ...n, isRead: true } : n)) ?? prev);
    decrementUnread(1);
    try {
      await notificationsService.markRead(id);
    } catch {
      load();
    }
  }

  async function handleMarkAll() {
    setItems((prev) => prev?.map((n) => ({ ...n, isRead: true })) ?? prev);
    setUnreadCount(0);
    try {
      await notificationsService.markAllRead();
      toast.success(t.markAllSuccess);
    } catch {
      toast.error(t.markAllError);
      load();
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-[28px] font-normal">{t.title}</h1>
          <p className="text-[13.5px] text-txt3 mt-1">{t.subtitle}</p>
        </div>
        {items && items.some((n) => !n.isRead) && (
          <button
            onClick={handleMarkAll}
            className="flex items-center gap-1.5 text-[12.5px] text-txt3 hover:text-vert transition-colors"
          >
            <CheckCheck size={14} /> {t.markAll}
          </button>
        )}
      </div>

      {items === null && (
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      )}

      {items !== null && items.length === 0 && (
        <EmptyState icon={<Bell size={26} />} title={t.emptyTitle} />
      )}

      {items !== null && items.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {items.map((n) => {
            const { title, message } = describeNotification(n, t.types);
            const manhwa = getManhwaRef(n);
            const Icon = TYPE_ICON[n.type] ?? Info;

            const content = (
              <div
                className={cn(
                  "flex items-start gap-3 rounded-xl border px-4 py-3 transition-colors",
                  n.isRead
                    ? "border-ligne bg-transparent"
                    : "border-vert/30 bg-vert-t/40 hover:bg-vert-t",
                )}
              >
                {manhwa ? (
                  <Cover manhwa={manhwa} className="w-10 h-14 rounded-md shrink-0" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-sur2 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon size={14} className="text-txt3" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {!n.isRead && <span className="w-1.5 h-1.5 rounded-full bg-vert shrink-0" />}
                    <p className="text-[13.5px] font-medium truncate">{title}</p>
                  </div>
                  <p className="text-[13px] text-txt2 mt-0.5">{message}</p>
                  <p className="text-[11px] text-txt3 font-mono mt-1" suppressHydrationWarning>
                    {formatRelative(n.createdAt, locale)}
                  </p>
                </div>
              </div>
            );

            return manhwa ? (
              <Link
                key={n._id}
                href={`/app/manhwa/${manhwa.slug}`}
                onClick={() => !n.isRead && handleMarkRead(n._id)}
              >
                {content}
              </Link>
            ) : (
              <button
                key={n._id}
                onClick={() => !n.isRead && handleMarkRead(n._id)}
                className="text-left"
              >
                {content}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}