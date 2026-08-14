"use client";

import Link from "next/link";
import { useTranslations } from "@/lib/i18n/useTranslations";

// Même petit renderer que sur la fiche manhwa et la page Partage : un
// segment **gras** devient <b>, utile ici pour les clauses de l'article 2
// qui doivent ressortir visuellement (ce que ManhwaList n'héberge pas).
function renderBold(text: string): React.ReactNode {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <b key={i} className="text-txt2">
        {part}
      </b>
    ) : (
      part
    ),
  );
}

export default function CGUPage() {
  const t = useTranslations("cgu");

  return (
    <div className="min-h-screen bg-fond text-txt2">
      <div className="max-w-3xl mx-auto px-5 py-14">
        <Link
          href="/"
          className="flex items-center gap-2.5 font-display text-[17px] w-fit mb-10"
        >
          <i className="w-2 h-2 rounded-full bg-vert" />
          <b className="font-normal text-txt">
            Manhwa<span className="text-vert">List</span>
          </b>
        </Link>

        <h1 className="font-display text-[30px] font-normal text-txt">{t.heading}</h1>
        <p className="text-[12.5px] text-txt3 font-mono mt-2">{t.lastUpdated}</p>

        <div className="mt-10 flex flex-col gap-8 text-[14px] leading-relaxed">
          {t.sections.map((section) => (
            <Section key={section.title} title={section.title}>
              {section.blocks.map((block, i) =>
                Array.isArray(block) ? (
                  <ul key={i} className="list-disc pl-5 flex flex-col gap-1.5 mt-1">
                    {(block as readonly string[]).map((item, j) => (
                      <li key={j}>{renderBold(item)}</li>
                    ))}
                  </ul>
                ) : (
                  <p key={i}>{renderBold(block as string)}</p>
                ),
              )}
            </Section>
          ))}
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2.5">
      <h2 className="text-[16px] font-medium text-txt">{title}</h2>
      <div className="flex flex-col gap-2.5">{children}</div>
    </section>
  );
}