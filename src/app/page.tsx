import Link from "next/link";
import "./landing.css";

const FEATURES = [
  {
    icon: "◐",
    title: "Reprendre",
    text: "Trié par retard, pas par date : la série la plus en arrière est celle qu'on abandonne.",
  },
  {
    icon: "+1",
    title: "+1 en un geste",
    text: "Avance ta progression sans quitter la liste. Un tap, un chapitre de plus.",
  },
  {
    icon: "▦",
    title: "Bibliothèque",
    text: "En cours, en pause, terminé, abandonné, à lire — filtre par statut, genre ou favoris.",
  },
  {
    icon: "⌕",
    title: "Recherche",
    text: "Titre, titre alternatif ou auteur, sur tout le catalogue commun.",
  },
  {
    icon: "◉",
    title: "Notifications",
    text: "Un nouveau chapitre sort, tu le sais — sans avoir à revérifier chaque série un par un.",
  },
  {
    icon: "↗",
    title: "Partage",
    text: "Un lien public, en lecture seule, vers ta bibliothèque. Rien à installer côté visiteur.",
  },
  {
    icon: "◧",
    title: "Statistiques",
    text: "Chapitres lus, note moyenne, répartition par statut — ta lecture, en chiffres.",
  },
];

export default function LandingPage() {
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
            <a href="#fonctionnalites">Fonctionnalités</a>
            <a href="#stats">En chiffres</a>
          </nav>
          <Link href="/login" className="cta cta--outline">
            Se connecter
          </Link>
        </header>

        <section className="heros">
          <span className="oeil">catalogue commun · sans doublon</span>
          <h1 className="titre">
            Ne perdez plus jamais <em>le fil</em>.
          </h1>
          <p className="sous">
            Une bibliothèque unique pour tous vos manhwas, manhuas et webtoons en cours. Suivez
            votre progression, retrouvez où vous en étiez, et ne relisez jamais deux fois le même
            chapitre.
          </p>
          <div className="heros-ctas">
            <Link href="/register" className="cta">
              Créer un compte gratuit
            </Link>
            <Link href="/login" className="cta cta--outline">
              J&apos;ai déjà un compte
            </Link>
          </div>
        </section>

        <section className="sec" id="fonctionnalites">
          <div className="sec__t">fonctionnalités</div>
          <h2>Tout ce qu&apos;il faut, rien de plus.</h2>
          <p className="desc">
            Une interface pensée pour la lecture régulière : reprendre vite, ajouter en un geste,
            et une vue d&apos;ensemble toujours à jour.
          </p>
          <div className="grille">
            {FEATURES.map((f) => (
              <div key={f.title} className="carte">
                <i className="ic">{f.icon}</i>
                <b>{f.title}</b>
                <span>{f.text}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="sec" id="stats">
          <div className="sec__t">en chiffres</div>
          <h2>Un catalogue qui grandit avec ses lecteurs.</h2>
          <div className="grille" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
            <div className="carte">
              <b style={{ fontSize: 26, fontFamily: "var(--display)", fontWeight: 400 }}>0 doublon</b>
              <span>Dédoublonnage automatique à la soumission d&apos;une fiche.</span>
            </div>
            <div className="carte">
              <b style={{ fontSize: 26, fontFamily: "var(--display)", fontWeight: 400 }}>3 sources</b>
              <span>MangaDex, AniList et Jikan pour importer une fiche en un clic.</span>
            </div>
            <div className="carte">
              <b style={{ fontSize: 26, fontFamily: "var(--display)", fontWeight: 400 }}>100% gratuit</b>
              <span>Aucune fonctionnalité de suivi cachée derrière un abonnement.</span>
            </div>
          </div>
        </section>

        <section className="final">
          <h2>Reprends là où tu t&apos;es arrêté.</h2>
          <p className="sous">Trois champs pour créer ton compte. Pas d&apos;e-mail de confirmation à attendre.</p>
          <Link href="/register" className="cta">
            Commencer
          </Link>
        </section>

        <footer className="pied">
          <span suppressHydrationWarning>© {new Date().getFullYear()} ManhwaList</span>
          <span>Fait pour les lecteurs qui suivent trop de séries à la fois.</span>
        </footer>
      </div>
    </div>
  );
}