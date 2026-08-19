"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminService } from "@/lib/services/admin.service";
import { EmptyState, Spinner, StatusBadge } from "@/components/ui/Primitives";
import { toast } from "@/lib/stores/toast.store";
import { useTranslations } from "@/lib/i18n/useTranslations";
import type { AccountStatus, Role, User } from "@/types";
import { Users } from "lucide-react";

export default function ComptesPage() {
  const t = useTranslations("admin").accounts;
  const accountStatus = useTranslations("common").accountStatus;
  const [users, setUsers] = useState<User[] | null>(null);
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    try {
      const res = await adminService.users({ pageSize: 50, search: search || undefined });
      setUsers(res.items);
    } catch {
      toast.error(t.loadError);
      setUsers([]);
    }
  }

  useEffect(() => {
    const timeout = setTimeout(load, 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // Le backend ne renvoie pas le compte mis à jour sur ces deux routes,
  // seulement un message de confirmation — on applique donc le changement
  // localement une fois la requête confirmée en succès.

  async function handleStatus(user: User, status: AccountStatus) {
    const reason = window.prompt(
      t.statusReasonPrompt
        .replace("{action}", accountStatus[status].toLowerCase())
        .replace("{username}", user.username),
    );
    if (!reason || reason.trim().length < 5) {
      if (reason !== null) toast.error(t.reasonTooShort);
      return;
    }
    setBusyId(user._id);
    try {
      await adminService.setUserStatus(user._id, status, reason.trim());
      setUsers(
        (prev) => prev?.map((u) => (u._id === user._id ? { ...u, status, statusReason: reason.trim() } : u)) ?? prev,
      );
      toast.success(t.statusUpdated);
    } catch {
      toast.error(t.statusUpdateError);
    } finally {
      setBusyId(null);
    }
  }

  async function handleRole(user: User) {
    const newRole: Role = user.role === "admin" ? "user" : "admin";
    if (!window.confirm(t.confirmRoleChange.replace("{username}", user.username).replace("{role}", newRole))) {
      return;
    }
    setBusyId(user._id);
    try {
      await adminService.setUserRole(user._id, newRole);
      setUsers((prev) => prev?.map((u) => (u._id === user._id ? { ...u, role: newRole } : u)) ?? prev);
      toast.success(t.roleUpdated);
    } catch {
      toast.error(t.roleUpdateError);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-[28px] font-normal">{t.title}</h1>
        <p className="text-[13.5px] text-txt3 mt-1">{t.subtitle}</p>
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={t.searchPlaceholder}
        className="max-w-xs bg-sur border border-ligne rounded-lg px-3.5 py-2 text-[13px] outline-none focus:border-vert/50 transition-colors"
      />

      {users === null && (
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      )}

      {users !== null && users.length === 0 && (
        <EmptyState icon={<Users size={26} />} title={t.emptyTitle} />
      )}

      {users !== null && users.length > 0 && (
        <div className="overflow-x-auto -mx-2">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-txt3 font-mono">
                <th className="px-2 py-2 font-normal">{t.colAccount}</th>
                <th className="px-2 py-2 font-normal">{t.colRole}</th>
                <th className="px-2 py-2 font-normal">{t.colStatus}</th>
                <th className="px-2 py-2 font-normal text-right">{t.colActions}</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id} className="border-t border-ligne">
                  <td className="px-2 py-2.5">
                    <Link
                      href={`/app/admin/comptes/${u._id}`}
                      className="font-medium hover:text-vert transition-colors"
                    >
                      {u.username}
                    </Link>
                    <div className="text-txt3 text-[11.5px]">{u.email}</div>
                  </td>
                  <td className="px-2 py-2.5">
                    <button
                      onClick={() => handleRole(u)}
                      disabled={busyId === u._id}
                      className="text-[11.5px] px-2 py-0.5 rounded-full bg-sur3 text-txt2 hover:text-vert transition-colors disabled:opacity-60"
                    >
                      {u.role}
                    </button>
                  </td>
                  <td className="px-2 py-2.5">
                    <StatusBadge
                      status={u.status === "active" ? "reading" : "dropped"}
                      label={accountStatus[u.status]}
                    />
                  </td>
                  <td className="px-2 py-2.5 text-right">
                    <div className="flex justify-end gap-1.5">
                      {u.status !== "active" && (
                        <button
                          onClick={() => handleStatus(u, "active")}
                          disabled={busyId === u._id}
                          className="text-[11.5px] text-txt3 hover:text-vert transition-colors px-1.5 disabled:opacity-60"
                        >
                          {t.activate}
                        </button>
                      )}
                      {u.status !== "suspended" && (
                        <button
                          onClick={() => handleStatus(u, "suspended")}
                          disabled={busyId === u._id}
                          className="text-[11.5px] text-txt3 hover:text-or transition-colors px-1.5 disabled:opacity-60"
                        >
                          {t.suspend}
                        </button>
                      )}
                      {u.status !== "banned" && (
                        <button
                          onClick={() => handleStatus(u, "banned")}
                          disabled={busyId === u._id}
                          className="text-[11.5px] text-txt3 hover:text-rouge transition-colors px-1.5 disabled:opacity-60"
                        >
                          {t.ban}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}