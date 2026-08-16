"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Search, Bell, Menu } from "lucide-react";
import { useAuthStore } from "@/lib/stores/auth.store";
import { useNotificationsStore } from "@/lib/stores/notifications.store";
import { useMobileNavStore } from "@/lib/stores/mobile-nav.store";
import { notificationsService } from "@/lib/services/notifications.service";
import { LanguageSwitcher } from "@/components/features/LanguageSwitcher";
import { useTranslations } from "@/lib/i18n/useTranslations";

export function Topbar() {
  const t = useTranslations("topbar");
  const router = useRouter();
  const pathname = usePathname();
  // Sur la page Recherche elle-même, cette barre ferait doublon avec le
  // champ de la page — deux champs de recherche empilés à l'écran, dont un
  // qui ne servirait à rien puisqu'on y est déjà. On la masque plutôt que
  // de la dédoubler.
  const isSearchPage = pathname === "/app/chercher";
  const [query, setQuery] = useState("");
  const isAdmin = useAuthStore((s) => s.user?.role === "admin");
  const notifCount = useNotificationsStore((s) => s.unreadCount);
  const setUnreadCount = useNotificationsStore((s) => s.setUnreadCount);
  const openMobileNav = useMobileNavStore((s) => s.open);

  useEffect(() => {
    notificationsService
      .list({ pageSize: 1 })
      .then((res) => setUnreadCount(res.unreadCount))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    // La query part directement dans l'URL — la page Recherche la lit au
    // chargement et lance la recherche toute seule (cf. chercher/page.tsx).
    // Pas de recherche à chaque frappe ici : ça enverrait une navigation à
    // chaque lettre tapée, pour un gain qu'Entrée couvre très bien.
    router.push(trimmed ? `/app/chercher?q=${encodeURIComponent(trimmed)}` : "/app/chercher");
    setQuery("");
  }

  return (
    <div className="flex items-center gap-3 px-5 lg:px-8 h-16 border-b border-ligne bg-fond/80 backdrop-blur sticky top-0 z-20">
      <button
        onClick={openMobileNav}
        aria-label={t.openMenu}
        className="lg:hidden flex items-center justify-center w-9 h-9 rounded-lg border border-ligne text-txt2 hover:text-txt transition-colors shrink-0"
      >
        <Menu size={17} />
      </button>

      {!isSearchPage && (
        <form
          onSubmit={handleSearchSubmit}
          className="flex items-center gap-2 text-[13px] text-txt3 bg-sur border border-ligne rounded-lg px-3 py-2 w-full max-w-[360px] hover:border-ligne2 focus-within:border-vert/50 transition-colors"
        >
          <Search size={14} className="shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="flex-1 bg-transparent outline-none text-txt placeholder:text-txt3 min-w-0"
          />
          <kbd className="text-[10px] font-mono text-txt3 border border-ligne rounded px-1.5 py-0.5 shrink-0">
            ⌘K
          </kbd>
        </form>
      )}

      <div className="ml-auto flex items-center gap-2">
        <LanguageSwitcher />
        <button
          onClick={() => router.push("/app/notifications")}
          className="relative flex items-center justify-center w-9 h-9 rounded-lg border border-ligne text-txt2 hover:text-vert hover:border-vert/40 transition-colors"
          aria-label={t.notifications}
        >
          <Bell size={15} />
          {notifCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 rounded-full bg-vert text-[10px] font-mono font-semibold text-[#05130c] flex items-center justify-center">
              {notifCount}
            </span>
          )}
        </button>
        {isAdmin && (
          <button
            onClick={() => router.push("/app/chercher")}
            className="hidden sm:flex items-center gap-1.5 text-[13px] font-medium bg-vert text-[#05130c] rounded-lg px-3.5 py-2 hover:brightness-110 transition-all"
          >
            + {t.newEntry}
          </button>
        )}
      </div>
    </div>
  );
}