import type { Metadata } from "next";

// La page /cgu est un composant client ("use client", pour useTranslations),
// qui ne peut donc plus exporter `metadata` directement (réservé aux
// composants serveur). Un layout dédié récupère juste le titre d'onglet.
// Statique et non traduit, comme le reste des métadonnées du site (le
// layout racine n'a pas non plus d'infrastructure de metadata par langue).
export const metadata: Metadata = {
  title: "Conditions générales d'utilisation",
};

export default function CguLayout({ children }: { children: React.ReactNode }) {
  return children;
}