"use client";

import Link from "next/link";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/auth.store";
import { authService } from "@/lib/services/auth.service";
import { toast } from "@/lib/stores/toast.store";
import { useMobileNavStore } from "@/lib/stores/mobile-nav.store";
import { InstallButton } from "@/components/features/InstallButton";
import { useTranslations } from "@/lib/i18n/useTranslations";
import type { Messages } from "@/lib/i18n/messages/fr";
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
  X,
} from "lucide-react";

// Fonctions plutôt que constantes de module : les libellés dépendent de la
// langue choisie, qui n'est connue qu'à l'intérieur d'un composant (via le
// hook `useTranslations`) — impossible de les figer au chargement du
// fichier comme avant.
function lireItems(t: Messages["sidebar"]) {
  return [
    { href: "/app", label: t.resume, icon: CircleDot, tourId: "reprendre" },
    { href: "/app/bibliotheque", label: t.library, icon: LayoutGrid, tourId: "bibliotheque" },
    { href: "/app/chercher", label: t.search, icon: Search, tourId: "chercher" },
    { href: "/app/calendrier", label: t.calendar, icon: CalendarDays, tourId: "calendrier" },
    { href: "/app/decouvrir", label: t.discover, icon: Sparkles, tourId: "decouvrir" },
    { href: "/app/statistiques", label: t.stats, icon: BarChart3, tourId: "statistiques" },
  ];
}

function compteItems(t: Messages["sidebar"]) {
  return [
    { href: "/app/notifications", label: t.notifications, icon: Bell, tourId: "notifications" },
    { href: "/app/partage", label: t.share, icon: Share2, tourId: "partage" },
    { href: "/app/profil", label: t.profile, icon: UserCog, tourId: "profil" },
  ];
}

function adminItems(t: Messages["sidebar"]) {
  return [
    { href: "/app/admin", label: t.overview, icon: LayoutDashboard },
    { href: "/app/admin/moderation", label: t.moderation, icon: ShieldCheck },
    { href: "/app/admin/comptes", label: t.accounts, icon: Users },
    { href: "/app/admin/journal", label: t.journal, icon: ScrollText },
    { href: "/app/admin/taches", label: t.tasks, icon: Cog },
  ];
}

function NavLink({
  href,
  label,
  Icon,
  active,
  onClick,
  tourId,
}: {
  href: string;
  label: string;
  Icon: React.ElementType;
  active: boolean;
  onClick?: () => void;
  tourId?: string;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      data-tour={tourId}
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

// Contenu partagé entre la sidebar fixe (desktop) et le tiroir (mobile) —
// une seule source pour la liste de liens, deux façons de l'habiller.
function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const t = useTranslations("sidebar");
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const router = useRouter();
  const isAdmin = user?.role === "admin";
  const LIRE = lireItems(t);
  const COMPTE = compteItems(t);
  const ADMIN = adminItems(t);

  async function handleLogout() {
    try {
      await authService.logout();
    } catch {
      // on déconnecte localement même si l'appel échoue
    } finally {
      logout();
      toast.info("Déconnecté.");
      onNavigate?.();
      router.replace("/login");
    }
  }

  const initial = user?.username?.[0]?.toUpperCase() ?? "?";

  return (
    <>
      <Link
        href="/app"
        onClick={onNavigate}
        className="flex items-center gap-2.5 px-2 font-display text-[17px] tracking-tight"
      >
        <i className="w-2 h-2 rounded-full bg-vert pastille-vive" />
        <b className="font-normal">
          Manhwa<span className="text-vert">List</span>
        </b>
      </Link>

      <nav className="flex flex-col gap-5 flex-1">
        <div className="flex flex-col gap-0.5">
          <div className="px-3 pb-1.5 text-[11px] uppercase tracking-wider text-txt3 font-mono">
            {t.sectionRead}
          </div>
          {LIRE.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              label={item.label}
              Icon={item.icon}
              active={pathname === item.href}
              onClick={onNavigate}
              tourId={item.tourId}
            />
          ))}
        </div>

        <div className="flex flex-col gap-0.5">
          <div className="px-3 pb-1.5 text-[11px] uppercase tracking-wider text-txt3 font-mono">
            {t.sectionAccount}
          </div>
          {COMPTE.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              label={item.label}
              Icon={item.icon}
              active={pathname === item.href}
              onClick={onNavigate}
              tourId={item.tourId}
            />
          ))}
        </div>

        {isAdmin && (
          <div className="flex flex-col gap-0.5">
            <div className="px-3 pb-1.5 text-[11px] uppercase tracking-wider text-txt3 font-mono">
              {t.sectionAdmin}
            </div>
            {ADMIN.map((item) => (
              <NavLink
                key={item.href}
                href={item.href}
                label={item.label}
                Icon={item.icon}
                active={pathname === item.href}
                onClick={onNavigate}
              />
            ))}
          </div>
        )}
      </nav>

      <div className="flex items-center gap-2.5 px-2 pt-4 border-t border-ligne">
        <Link
          href="/app/profil"
          onClick={onNavigate}
          className="flex items-center gap-2.5 min-w-0 flex-1 group"
        >
          <div className="w-8 h-8 rounded-full bg-vert-t text-vert flex items-center justify-center font-semibold text-[13px] shrink-0">
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <b className="block text-[13px] truncate group-hover:text-vert transition-colors">
              {user?.username ?? "…"}
            </b>
            <span className="block text-[10.5px] uppercase tracking-wider text-txt3 font-mono">
              {isAdmin ? t.admin : t.reader}
            </span>
          </div>
        </Link>
        <button
          onClick={handleLogout}
          aria-label={t.logout}
          className="text-txt3 hover:text-rouge transition-colors p-1.5"
        >
          <LogOut size={15} />
        </button>
      </div>

      <div className="px-2 flex items-center justify-center">
        <InstallButton variant="panel" />
      </div>
    </>
  );
}

export function Sidebar() {
  const t = useTranslations("sidebar");
  const isOpen = useMobileNavStore((s) => s.isOpen);
  const close = useMobileNavStore((s) => s.close);
  const pathname = usePathname();

  // Filet de sécurité : si la navigation se produit autrement que via un
  // clic sur un lien du tiroir (bouton précédent du navigateur, par
  // exemple), le tiroir doit quand même se refermer.
  useEffect(() => {
    close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <>
      {/* Desktop : colonne fixe, toujours visible à partir de lg. */}
      <aside className="hidden lg:flex flex-col w-[248px] shrink-0 border-r border-ligne bg-sur/60 px-3 py-5 gap-6 h-screen sticky top-0 overflow-y-auto">
        <SidebarContent />
      </aside>

      {/* Mobile : tiroir superposé, ouvert via le bouton hamburger de la
          Topbar (état partagé par mobile-nav.store). En dessous de lg
          uniquement — le double rendu (desktop cache/mobile cache) est
          volontaire, plus simple que de repositionner un seul arbre au
          resize. */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <button
            aria-label={t.closeMenu}
            onClick={close}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <aside className="absolute left-0 top-0 h-full w-[80%] max-w-[300px] flex flex-col bg-sur border-r border-ligne px-3 py-5 gap-6 overflow-y-auto">
            <button
              onClick={close}
              aria-label={t.closeMenu}
              className="absolute top-4 right-3 text-txt3 hover:text-txt p-1.5"
            >
              <X size={18} />
            </button>
            <SidebarContent onNavigate={close} />
          </aside>
        </div>
      )}
    </>
  );
}