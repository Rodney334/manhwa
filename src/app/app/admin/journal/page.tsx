"use client";

import { useEffect, useState } from "react";
import { adminService, type AuditLog } from "@/lib/services/admin.service";
import { EmptyState, Spinner } from "@/components/ui/Primitives";
import { formatRelative } from "@/lib/utils/format";
import { toast } from "@/lib/stores/toast.store";
import { ScrollText } from "lucide-react";

export default function JournalPage() {
  const [logs, setLogs] = useState<AuditLog[] | null>(null);

  useEffect(() => {
    adminService
      .auditLogs({ pageSize: 50 })
      .then((res) => setLogs(res.items))
      .catch(() => {
        toast.error("Impossible de charger le journal.");
        setLogs([]);
      });
  }, []);

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <h1 className="font-display text-[28px] font-normal">Journal</h1>
        <p className="text-[13.5px] text-txt3 mt-1">Journal d&apos;audit des actions d&apos;administration.</p>
      </div>

      {logs === null && (
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      )}

      {logs !== null && logs.length === 0 && (
        <EmptyState icon={<ScrollText size={26} />} title="Journal vide" />
      )}

      {logs !== null && logs.length > 0 && (
        <div className="flex flex-col">
          {logs.map((log, i) => (
            <div
              key={log._id ?? i}
              className="flex items-center gap-3 py-2.5 border-b border-ligne text-[13px]"
            >
              <span className="font-mono text-[11.5px] text-txt3 w-24 shrink-0">
                {formatRelative(log.createdAt)}
              </span>
              <span className="font-mono text-vert text-[12px]">{log.action}</span>
              {log.actor?.username && (
                <span className="text-txt3 text-[12px] ml-auto">{log.actor.username}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
