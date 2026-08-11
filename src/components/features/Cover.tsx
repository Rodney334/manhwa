"use client";

import { useState } from "react";
import { coverUrl } from "@/lib/api/client";
import type { Manhwa } from "@/types";

export function Cover({
  manhwa,
  className = "",
}: {
  manhwa: Pick<Manhwa, "coverPath" | "coverSourceUrl" | "title">;
  className?: string;
}) {
  const [errored, setErrored] = useState(false);
  const src = coverUrl(manhwa);

  if (!src || errored) {
    return (
      <div
        className={`flex items-center justify-center bg-sur2 text-txt3 font-display text-[11px] text-center px-2 ${className}`}
      >
        {manhwa.title}
      </div>
    );
  }

  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img
      src={src}
      alt={manhwa.title}
      className={`object-cover ${className}`}
      onError={() => setErrored(true)}
      loading="lazy"
    />
  );
}
