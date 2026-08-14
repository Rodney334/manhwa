"use client";

import Link from "next/link";
import { Cover } from "@/components/features/Cover";
import { ProgressBar } from "@/components/ui/Primitives";
import { formatChapter } from "@/lib/utils/format";
import { useTranslations } from "@/lib/i18n/useTranslations";
import type { LibraryEntry } from "@/types";
import { Plus, Heart } from "lucide-react";

export function ContinueCard({
  entry,
  onIncrement,
  disabled,
}: {
  entry: LibraryEntry;
  onIncrement: (id: string) => void;
  disabled?: boolean;
}) {
  const t = useTranslations("library");
  const total = entry.manhwa.totalChapters ?? 0;
  const pct = total > 0 ? (entry.currentChapter / total) * 100 : entry.currentChapter > 0 ? 60 : 0;

  return (
    <div className="group relative flex gap-4 rounded-xl border border-ligne bg-sur/60 p-3 hover:border-vert/30 transition-colors">
      <Link href={`/app/manhwa/${entry.manhwa.slug}`} className="shrink-0">
        <Cover manhwa={entry.manhwa} className="w-16 h-[88px] rounded-lg" />
      </Link>
      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
        <div>
          <Link href={`/app/manhwa/${entry.manhwa.slug}`}>
            <h3 className="font-medium text-[14.5px] truncate hover:text-vert transition-colors">
              {entry.manhwa.title}
            </h3>
          </Link>
          <p className="text-[12.5px] text-txt3 font-mono mt-0.5">
            ch. {formatChapter(entry.currentChapter)}
            {total ? ` / ${total}` : ""}
          </p>
        </div>
        <ProgressBar value={pct} />
      </div>
      <button
        onClick={() => onIncrement(entry._id)}
        disabled={disabled}
        aria-label={t.nextChapterAria}
        className="self-center shrink-0 w-9 h-9 rounded-lg bg-vert-t text-vert flex items-center justify-center hover:bg-vert hover:text-[#05130c] transition-colors disabled:opacity-40 disabled:pointer-events-none"
      >
        <Plus size={16} />
      </button>
    </div>
  );
}

export function LibraryCard({ entry, statusLabel }: { entry: LibraryEntry; statusLabel: string }) {
  return (
    <Link
      href={`/app/manhwa/${entry.manhwa.slug}`}
      className="group flex flex-col rounded-xl border border-ligne bg-sur/60 overflow-hidden hover:border-vert/30 transition-colors"
    >
      <div className="relative aspect-[3/4]">
        <Cover manhwa={entry.manhwa} className="w-full h-full" />
        {entry.isFavorite && (
          <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-fond/70 backdrop-blur flex items-center justify-center">
            <Heart size={12} className="fill-vert text-vert" />
          </div>
        )}
      </div>
      <div className="p-3 flex flex-col gap-1.5">
        <h3 className="text-[13.5px] font-medium leading-snug line-clamp-2 group-hover:text-vert transition-colors">
          {entry.manhwa.title}
        </h3>
        <div className="flex items-center justify-between text-[11.5px] text-txt3 font-mono">
          <span>ch. {formatChapter(entry.currentChapter)}</span>
          <span>{statusLabel}</span>
        </div>
      </div>
    </Link>
  );
}