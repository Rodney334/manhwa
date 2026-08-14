"use client";

import Link from "next/link";
import { InstallButton } from "@/components/features/InstallButton";
import { LanguageSwitcher } from "@/components/features/LanguageSwitcher";
import { useTranslations } from "@/lib/i18n/useTranslations";
import "./landing.css";

export default function LandingPage() {
  const t = useTranslations("landing");

  return (
    <div className="lp">
      <div className="aurore" aria-hidden>
        <i />
        <i />
        <i />
      </div>
      <div className="grain" aria-hidden />

      <div className="contenu">
        <header className="barre">
          <Link href="/" className="logo">
            <b />
            <em>Manhwa</em>List
          </Link>
          <nav className="nav-links">
            <a href="#fonctionnalites">{t.nav.features}</a>
            <a href="#stats">{t.nav.stats}</a>
          </nav>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Link href="/login" className="cta cta--outline">
              {t.login}
            </Link>
          </div>
        </header>

        <section className="heros">
          <span className="oeil">{t.eyebrow}</span>
          <h1 className="titre">
            {t.titlePrefix}
            <em>{t.titleEm}</em>
            {t.titleSuffix}
          </h1>
          <p className="sous">{t.subtitle}</p>
          <div className="heros-ctas">
            <Link href="/register" className="cta">
              {t.ctaRegister}
            </Link>
            <Link href="/login" className="cta cta--outline">
              {t.ctaHaveAccount}
            </Link>
          </div>
        </section>

        <section className="sec" id="fonctionnalites">
          <div className="sec__t">{t.featuresEyebrow}</div>
          <h2>{t.featuresTitle}</h2>
          <p className="desc">{t.featuresDesc}</p>
          <div className="grille">
            {t.features.map((f) => (
              <div key={f.title} className="carte">
                <i className="ic">{f.icon}</i>
                <b>{f.title}</b>
                <span>{f.text}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="sec" id="stats">
          <div className="sec__t">{t.statsEyebrow}</div>
          <h2>{t.statsTitle}</h2>
          <div className="grille" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
            <div className="carte">
              <b style={{ fontSize: 26, fontFamily: "var(--display)", fontWeight: 400 }}>
                {t.statDuplicates.value}
              </b>
              <span>{t.statDuplicates.text}</span>
            </div>
            <div className="carte">
              <b style={{ fontSize: 26, fontFamily: "var(--display)", fontWeight: 400 }}>
                {t.statSources.value}
              </b>
              <span>{t.statSources.text}</span>
            </div>
            <div className="carte">
              <b style={{ fontSize: 26, fontFamily: "var(--display)", fontWeight: 400 }}>
                {t.statFree.value}
              </b>
              <span>{t.statFree.text}</span>
            </div>
          </div>
        </section>

        <section className="final">
          <h2>{t.finalTitle}</h2>
          <p className="sous">{t.finalSubtitle}</p>
          <Link href="/register" className="cta">
            {t.finalCta}
          </Link>
        </section>

        <footer className="pied">
          <span suppressHydrationWarning>© {new Date().getFullYear()} ManhwaList</span>
          <span>{t.footerTagline}</span>
          <InstallButton variant="footer" />
          <Link href="/cgu" className="pied-lien">
            {t.footerTerms}
          </Link>
        </footer>
      </div>
    </div>
  );
}