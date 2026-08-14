"use client";

import { useLocaleStore } from "@/lib/i18n/store";

export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);

  return (
    <div className={`flex items-center gap-0.5 rounded-full border border-ligne p-0.5 ${className}`}>
      {(["fr", "en"] as const).map((l) => (
        <button
          key={l}
          onClick={() => setLocale(l)}
          aria-current={locale === l}
          className={`px-2 py-0.5 rounded-full text-[11px] font-mono uppercase tracking-wider transition-colors ${
            locale === l ? "bg-vert text-[#05130c]" : "text-txt3 hover:text-txt2"
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}