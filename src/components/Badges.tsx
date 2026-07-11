import type { ReactNode } from "react";

const STATUS_MAP: Record<string, string> = {
  "En attente": "badge-orange",
  "En cours": "badge-gray",
  "Livrée": "badge-green",
  "Annulée": "badge-red",
};

// Badge de statut pour les commandes
export const statusBadge = (value: string): ReactNode => (
  <span className={`badge ${STATUS_MAP[value] ?? "badge-gray"}`}>{value}</span>
);

// Badge Oui / Non pour les booléens (actif, disponible, etc.)
export const boolBadge = (value: boolean): ReactNode =>
  value ? (
    <span className="badge badge-green">Oui</span>
  ) : (
    <span className="badge badge-gray">Non</span>
  );
