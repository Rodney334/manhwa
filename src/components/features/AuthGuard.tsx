"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/auth.store";
import { tokenManager, refreshAccessToken } from "@/lib/api/client";
import { authService } from "@/lib/services/auth.service";

function getTokenExp(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return typeof payload.exp === "number" ? payload.exp : null;
  } catch {
    return null;
  }
}

function isExpiredOrExpiring(token: string): boolean {
  const exp = getTokenExp(token);
  if (exp === null) return false;
  return Date.now() / 1000 >= exp - 30;
}

type CheckState = "pending" | "ok" | "redirecting";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const logout = useAuthStore((s) => s.logout);
  const [checkState, setCheckState] = useState<CheckState>("pending");
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    useAuthStore.persist.rehydrate();

    async function checkSession() {
      const accessToken = tokenManager.getAccess();
      const refreshToken = tokenManager.getRefresh();

      if (!accessToken && !refreshToken) {
        setCheckState("redirecting");
        router.replace("/login");
        return;
      }

      if (accessToken && isExpiredOrExpiring(accessToken) && refreshToken) {
        await refreshAccessToken();
      } else if (!accessToken && refreshToken) {
        const newToken = await refreshAccessToken();
        if (!newToken) {
          logout();
          setCheckState("redirecting");
          router.replace("/login");
          return;
        }
      }

      try {
        const user = await authService.me();
        setUser(user);
        setCheckState("ok");
      } catch {
        logout();
        setCheckState("redirecting");
        router.replace("/login");
      }
    }

    checkSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (checkState === "pending" || checkState === "redirecting") {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-fond z-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-9 h-9 rounded-full border-2 border-vert/20 border-t-vert animate-spin" />
          <p className="text-[13px] text-txt3 font-mono">chargement…</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
