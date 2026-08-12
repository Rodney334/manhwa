"use client";

import { useEffect, useState } from "react";
import { adminService } from "@/lib/services/admin.service";
import { EmptyState, Spinner, StatusBadge } from "@/components/ui/Primitives";
import { toast } from "@/lib/stores/toast.store";
import type { AccountStatus, Role, User } from "@/types";
import { Users } from "lucide-react";

const STATUS_LABELS: Record<AccountStatus, string> = {
  active: "Actif",
  suspended: "Suspendu",
  banned: "Banni",
};

export default function ComptesPage() {
  const [users, setUsers] = useState<User[] | null>(null);
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    try {
      const res = await adminService.users({ pageSize: 50, search: search || undefined });
      setUsers(res.items);
    } catch {
      toast.error("Impossible de charger les comptes.");
      setUsers([]);
    }
  }

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // Le backend ne renvoie pas le compte mis à jour sur ces deux routes,
  // seulement un message de confirmation — on applique donc le changement
  // localement une fois la requête confirmée en succès.

  async function handleStatus(user: User, status: AccountStatus) {
    const reason = window.prompt(
      `Motif (obligatoire, 5 caractères min.) — ${STATUS_LABELS[status].toLowerCase()} le compte ${user.username} :`,
    );
    if (!reason || reason.trim().length < 5) {
      if (reason !== null) toast.error("Motif trop court (5 caractères minimum).");
      return;
    }
    setBusyId(user._id);
    try {
      await adminService.setUserStatus(user._id, status, reason.trim());
      setUsers(
        (prev) => prev?.map((u) => (u._id === user._id ? { ...u, status, statusReason: reason.trim() } : u)) ?? prev,
      );
      toast.success("Statut mis à jour.");
    } catch {
      toast.error("Échec de la mise à jour du statut.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleRole(user: User) {
    const newRole: Role = user.role === "admin" ? "user" : "admin";
    if (!window.confirm(`Passer ${user.username} en ${newRole} ?`)) return;
    setBusyId(user._id);
    try {
      await adminService.setUserRole(user._id, newRole);
      setUsers((prev) => prev?.map((u) => (u._id === user._id ? { ...u, role: newRole } : u)) ?? prev);
      toast.success("Rôle mis à jour.");
    } catch {
      toast.error("Échec de la mise à jour du rôle.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-[28px] font-normal">Comptes</h1>
        <p className="text-[13.5px] text-txt3 mt-1">Gestion des rôles et du statut des comptes.</p>
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Chercher un compte…"
        className="max-w-xs bg-sur border border-ligne rounded-lg px-3.5 py-2 text-[13px] outline-none focus:border-vert/50 transition-colors"
      />

      {users === null && (
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      )}

      {users !== null && users.length === 0 && (
        <EmptyState icon={<Users size={26} />} title="Aucun compte trouvé" />
      )}

      {users !== null && users.length > 0 && (
        <div className="overflow-x-auto -mx-2">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-txt3 font-mono">
                <th className="px-2 py-2 font-normal">Compte</th>
                <th className="px-2 py-2 font-normal">Rôle</th>
                <th className="px-2 py-2 font-normal">Statut</th>
                <th className="px-2 py-2 font-normal text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id} className="border-t border-ligne">
                  <td className="px-2 py-2.5">
                    <div className="font-medium">{u.username}</div>
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
                      label={STATUS_LABELS[u.status]}
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
                          Réactiver
                        </button>
                      )}
                      {u.status !== "suspended" && (
                        <button
                          onClick={() => handleStatus(u, "suspended")}
                          disabled={busyId === u._id}
                          className="text-[11.5px] text-txt3 hover:text-or transition-colors px-1.5 disabled:opacity-60"
                        >
                          Suspendre
                        </button>
                      )}
                      {u.status !== "banned" && (
                        <button
                          onClick={() => handleStatus(u, "banned")}
                          disabled={busyId === u._id}
                          className="text-[11.5px] text-txt3 hover:text-rouge transition-colors px-1.5 disabled:opacity-60"
                        >
                          Bannir
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
