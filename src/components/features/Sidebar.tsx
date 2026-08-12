"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/auth.store";
import { authService } from "@/lib/services/auth.service";
import { toast } from "@/lib/stores/toast.store";
import {
  CircleDot,
  LayoutGrid,
  Search,
  BarChart3,
  Bell,
  Share2,
  ShieldCheck,
  Users,
  ScrollText,
  Cog,
  LayoutDashboard,
  LogOut,
  UserCog,
  CalendarDays,
  Sparkles,
} from "lucide-react";

const LIRE = [
  { href: "/app", label: "Reprendre", icon: CircleDot },
  { href: "/app/bibliotheque", label: "Bibliothèque", icon: LayoutGrid },
  { href: "/app/chercher", label: "Chercher", icon: Search },
  { href: "/app/calendrier", label: "Calendrier", icon: CalendarDays },
  { href: "/app/decouvrir", label: "Découvrir", icon: Sparkles },
  { href: "/app/statistiques", label: "Statistiques", icon: BarChart3 },
];

const COMPTE = [
  { href: "/app/notifications", label: "Notifications", icon: Bell },
  { href: "/app/partage", label: "Partage", icon: Share2 },
  { href: "/app/profil", label: "Profil", icon: UserCog },
];

const ADMIN = [
  { href: "/app/admin", label: "Vue d'ensemble", icon: LayoutDashboard },
  { href: "/app/admin/moderation", label: "Modération", icon: ShieldCheck },
  { href: "/app/admin/comptes", label: "Comptes", icon: Users },
  { href: "/app/admin/journal", label: "Journal", icon: ScrollText },
  { href: "/app/admin/taches", label: "Tâches", icon: Cog },
];

function NavLink({
  href,
  label,
  Icon,
  active,
}: {
  href: string;
  label: string;
  Icon: React.ElementType;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13.5px] transition-colors ${active
          ? "bg-vert-t text-vert font-medium"
          : "text-txt2 hover:text-txt hover:bg-sur2"
        }`}
    >
      <Icon size={16} className="shrink-0" />
      <span className="flex-1">{label}</span>
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const router = useRouter();
  const isAdmin = user?.role === "admin";

  async function handleLogout() {
    try {
      await authService.logout();
    } catch {
      // on déconnecte localement même si l'appel échoue
    } finally {
      logout();
      toast.info("Déconnecté.");
      router.replace("/login");
    }
  }

  const initial = user?.username?.[0]?.toUpperCase() ?? "?";

  return (
    <aside className="hidden lg:flex flex-col w-[248px] shrink-0 border-r border-ligne bg-sur/60 px-3 py-5 gap-6 h-screen sticky top-0 overflow-y-auto">
      <Link href="/app" className="flex items-center gap-2.5 px-2 font-display text-[17px] tracking-tight">
        <i className="w-2 h-2 rounded-full bg-vert pastille-vive" />
        <b className="font-normal">
          Manhwa<span className="text-vert">List</span>
        </b>
      </Link>

      <nav className="flex flex-col gap-5 flex-1">
        <div className="flex flex-col gap-0.5">
          <div className="px-3 pb-1.5 text-[11px] uppercase tracking-wider text-txt3 font-mono">
            Lire
          </div>
          {LIRE.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              label={item.label}
              Icon={item.icon}
              active={pathname === item.href}
            />
          ))}
        </div>

        <div className="flex flex-col gap-0.5">
          <div className="px-3 pb-1.5 text-[11px] uppercase tracking-wider text-txt3 font-mono">
            Compte
          </div>
          {COMPTE.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              label={item.label}
              Icon={item.icon}
              active={pathname === item.href}
            />
          ))}
        </div>

        {isAdmin && (
          <div className="flex flex-col gap-0.5">
            <div className="px-3 pb-1.5 text-[11px] uppercase tracking-wider text-txt3 font-mono">
              Administration
            </div>
            {ADMIN.map((item) => (
              <NavLink
                key={item.href}
                href={item.href}
                label={item.label}
                Icon={item.icon}
                active={pathname === item.href}
              />
            ))}
          </div>
        )}
      </nav>

      <div className="flex items-center gap-2.5 px-2 pt-4 border-t border-ligne">
        <Link href="/app/profil" className="flex items-center gap-2.5 min-w-0 flex-1 group">
          <div className="w-8 h-8 rounded-full bg-vert-t text-vert flex items-center justify-center font-semibold text-[13px] shrink-0">
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <b className="block text-[13px] truncate group-hover:text-vert transition-colors">
              {user?.username ?? "…"}
            </b>
            <span className="block text-[10.5px] uppercase tracking-wider text-txt3 font-mono">
              {isAdmin ? "Administrateur" : "Lecteur"}
            </span>
          </div>
        </Link>
        <button
          onClick={handleLogout}
          aria-label="Se déconnecter"
          className="text-txt3 hover:text-rouge transition-colors p-1.5"
        >
          <LogOut size={15} />
        </button>
      </div>
    </aside>
  );
}