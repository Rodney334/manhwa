# ManhwaList — Frontend

Front Next.js (App Router) qui consomme l'API en ligne :
`https://manhwa-list-beta-production.up.railway.app`

Architecture calquée sur ton projet `immobilier` (Next.js + Tailwind v4 + Zustand + TypeScript strict), design repris de tes deux maquettes :

- **`/`** — page d'accueil publique (palette dancheong/encre de `manhwalist-v3-final.html`), dirige vers `/login` et `/register`.
- **`/login`, `/register`** — authentification réelle contre l'API (`/api/v1/auth/*`).
- **`/app/*`** — l'application connectée (palette sombre + accent vert de `manhwalist-app.html`) : sidebar avec les groupes **Lire / Compte / Administration**, exactement comme dans ta maquette.

## Pages livrées

| Route | Contenu | Endpoints utilisés |
|---|---|---|
| `/app` | Reprendre (continue reading) + bouton +1 | `GET /library/continue`, `POST /library/{id}/increment` |
| `/app/bibliotheque` | Bibliothèque filtrable par statut/recherche | `GET /library/` |
| `/app/chercher` | Recherche catalogue + ajout à la bibliothèque | `GET /manhwa/search`, `POST /library/` |
| `/app/manhwa/[slug]` | Fiche série + statut, progression, favori, suppression | `GET /manhwa/{idOrSlug}`, `PATCH/POST /library/{id}/*` |
| `/app/statistiques` | Stats de lecture | `GET /library/stats` |
| `/app/notifications` | Liste + marquage lu | `GET /notifications`, `PATCH /notifications/*` |
| `/app/partage` | Création/suppression de liens publics | `GET/POST/DELETE /shares` |
| `/app/admin/moderation` | File de modération (admin) | `GET /admin/moderation/queue`, `POST .../approve`, `.../reject` |
| `/app/admin/comptes` | Gestion des comptes (admin) | `GET /admin/users`, `PATCH .../status`, `.../role` |
| `/app/admin/journal` | Journal d'audit (admin) | `GET /admin/audit-logs` |
| `/app/admin/taches` | Tâches planifiées (admin) | `GET /admin/jobs`, `POST .../run` |

Les liens **Administration** ne s'affichent dans la sidebar que si `user.role === "admin"`.

## Installation

Prérequis : **Node.js 18.18+** (idéalement 20 LTS) et npm.

```bash
# 1. Se placer dans le dossier du projet
cd manhwalist

# 2. Installer les dépendances
npm install

# 3. Copier le fichier d'environnement
cp .env.local.example .env.local
# NEXT_PUBLIC_API_URL y pointe déjà vers l'API Railway en ligne — rien à changer
# sauf si tu veux tester contre ton backend en local (http://localhost:3000 par ex.)

# 4. Lancer le serveur de développement
npm run dev
```

L'app est servie sur **http://localhost:3000**.

## Build de production

```bash
npm run build
npm run start
```

## Notes techniques

- **Auth** : jetons stockés en `localStorage`, refresh automatique sur 401 via `GET /auth/refresh/access-token` (jeton de renouvellement en `Authorization`, conformément à la doc Swagger de ton backend — pas dans le body).
- **Rôle admin** : relu à chaque chargement via `GET /auth/me`, jamais décodé depuis le jeton (comme l'exige ton backend).
- **Fiche manhwa → statut bibliothèque** : comme il n'existe pas de route "entrée de bibliothèque par manhwaId", la fiche retrouve l'entrée existante en cherchant dans `GET /library/?search=<titre>`. Fonctionne bien en pratique, mais si tu ajoutes plus tard une route dédiée côté backend (ex. `GET /library/by-manhwa/{id}`), dis-le-moi et je branche ça proprement.
- **Couvertures** : le composant `Cover` construit l'URL depuis `coverPath` (servi par ton backend sous `/covers`) avec repli sur `coverSourceUrl`, et affiche le titre en placeholder si aucune image ne charge.
- Le thème (couleurs, polices Black Han Sans / Plus Jakarta Sans / JetBrains Mono, animations) est défini dans `src/app/globals.css` (app) et `src/app/landing.css` (page d'accueil).

## Structure

```
src/
  app/
    page.tsx                 # landing (V3)
    (auth)/login, register/  # authentification
    app/                     # dashboard protégé (AuthGuard)
      admin/...
  components/
    features/                # Sidebar, Topbar, AuthGuard, Cover, LibraryCard
    ui/                      # Toast, Primitives (EmptyState, ProgressBar…)
  lib/
    api/client.ts            # fetch + gestion des jetons + refresh
    services/                # un fichier par ressource API
    stores/                  # Zustand (auth, toast)
    utils/format.ts
  types/index.ts              # miroir des schémas Swagger du backend
```
