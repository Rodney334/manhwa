"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { sharesService, type SharedList } from "@/lib/services/shares.service";
import { Spinner } from "@/components/ui/Primitives";
import { formatChapter } from "@/lib/utils/format";
import { coverUrl, ApiError } from "@/lib/api/client";
import { useTranslations } from "@/lib/i18n/useTranslations";
import { Heart, Star, Lock, Ban, ArrowRight } from "lucide-react";

type LoadState = "loading" | "ok" | "not_found" | "auth_required" | "error";

export default function PublicSharePage() {
  const t = useTranslations("publicShare");
  const share = useTranslations("share");
  const readingStatus = useTranslations("common").readingStatus;
  const publicationStatus = useTranslations("common").publicationStatus;
  const params = useParams<{ token: string }>();
  const [data, setData] = useState<SharedList | null>(null);
  const [state, setState] = useState<LoadState>("loading");

  useEffect(() => {
    let active = true;
    sharesService
      .viewPublic(params.token)
      .then((res) => {
        if (!active) return;
        setData(res);
        setState("ok");
      })
      .catch((e) => {
        if (!active) return;
        if (e instanceof ApiError && e.status === 401) {
          setState("auth_required");
        } else if (e instanceof ApiError && e.status === 404) {
          setState("not_found");
        } else {
          setState("error");
        }
      });
    return () => {
      active = false;
    };
  }, [params.token]);

  return (
    <div className="min-h-screen bg-fond px-5 py-10">
      <div className="max-w-3xl mx-auto flex flex-col gap-8">
        <Link href="/" className="flex items-center justify-center gap-2.5 font-display text-[19px]">
          <i className="w-2 h-2 rounded-full bg-vert pastille-vive" />
          <b className="font-normal">
            Manhwa<span className="text-vert">List</span>
          </b>
        </Link>

        {state === "loading" && (
          <div className="flex justify-center py-24">
            <Spinner />
          </div>
        )}

        {state === "not_found" && (
          <div className="flex flex-col items-center gap-3 text-center py-24">
            <Ban size={28} className="text-txt3" />
            <h1 className="font-display text-[20px] font-normal">{t.notFoundTitle}</h1>
            <p className="text-[13px] text-txt3 max-w-xs">{t.notFoundText}</p>
          </div>
        )}

        {state === "auth_required" && (
          <div className="flex flex-col items-center gap-3 text-center py-24">
            <Lock size={28} className="text-txt3" />
            <h1 className="font-display text-[20px] font-normal">{t.authRequiredTitle}</h1>
            <p className="text-[13px] text-txt3 max-w-xs">{t.authRequiredText}</p>
            <Link
              href={`/login?redirect=${encodeURIComponent(`/partage/${params.token}`)}`}
              className="mt-2 inline-flex items-center gap-2 bg-vert text-[#05130c] text-[13.5px] font-medium rounded-lg px-4 py-2 hover:brightness-110 transition-all"
            >
              {t.login}
            </Link>
          </div>
        )}

        {state === "error" && (
          <p className="text-center text-[13px] text-txt3 py-24">{t.loadError}</p>
        )}

        {state === "ok" && data && (
          <>
            <div>
              <h1 className="font-display text-[26px] font-normal">
                {data.share.title || t.defaultTitle.replace("{username}", data.owner.username)}
              </h1>
              <p className="text-[13px] text-txt3 mt-1">
                {t.byAuthor.replace("{username}", data.owner.username)}
                {data.counts.total} {data.counts.total > 1 ? share.seriesMany : share.seriesOne}
              </p>
            </div>

            <Link
              href="/register"
              className="flex items-center justify-between gap-3 rounded-xl border border-vert/25 bg-vert-t px-4 py-3 hover:border-vert/50 transition-colors"
            >
              <span className="text-[13px] text-txt2">{t.ctaText}</span>
              <span className="flex items-center gap-1 text-[12.5px] font-medium text-vert shrink-0">
                {t.ctaButton} <ArrowRight size={13} />
              </span>
            </Link>

            {data.entries.length === 0 ? (
              <p className="text-center text-[13px] text-txt3 py-16">{t.emptyText}</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {data.entries.map((entry) => (
                  <div
                    key={entry.slug}
                    className="flex flex-col rounded-xl border border-ligne bg-sur/60 overflow-hidden"
                  >
                    <div className="relative aspect-[3/4] bg-sur2">
                      {coverUrl({ coverPath: entry.coverPath }) ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={coverUrl({ coverPath: entry.coverPath })!}
                          alt={entry.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-txt3 font-display text-[11px] text-center px-2">
                          {entry.title}
                        </div>
                      )}
                      {entry.isFavorite && (
                        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-fond/70 backdrop-blur flex items-center justify-center">
                          <Heart size={12} className="fill-vert text-vert" />
                        </div>
                      )}
                    </div>
                    <div className="p-3 flex flex-col gap-1.5">
                      <h3 className="text-[13px] font-medium leading-snug line-clamp-2">
                        {entry.title}
                      </h3>
                      <div className="flex items-center justify-between text-[11px] text-txt3 font-mono">
                        {data.share.includeProgress && entry.currentChapter !== undefined ? (
                          <span>ch. {formatChapter(entry.currentChapter)}</span>
                        ) : (
                          <span>
                            {publicationStatus[
                              entry.publicationStatus as keyof typeof publicationStatus
                            ] ?? ""}
                          </span>
                        )}
                        <span>{readingStatus[entry.status] ?? entry.status}</span>
                      </div>
                      {entry.score !== undefined && (
                        <span className="flex items-center gap-1 text-[11px] text-or font-mono">
                          <Star size={10} className="fill-or" /> {entry.score}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}