import type { MetadataRoute } from "next";

// Convention native Next.js (App Router) : ce fichier est automatiquement
// servi à /manifest.webmanifest, pas besoin de next-pwa ni de service
// worker pour la seule installabilité.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ManhwaList",
    short_name: "ManhwaList",
    description:
      "Suivez votre progression sur tous vos manhwas, manwhas et webtoons en cours.",
    start_url: "/app",
    display: "standalone",
    background_color: "#0a0b0d",
    theme_color: "#0a0b0d",
    orientation: "portrait",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}