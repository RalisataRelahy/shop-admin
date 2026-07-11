import React from "react";

export const statusBadge = (value: string): JSX.Element => {
  const map: Record<string, string> = {
    "En attente": "badge-orange",
    "En cours": "badge-gray",
    "Livrée": "badge-green",
    "Annulée": "badge-red",
  };
  return <span className={`badge ${map[value] || "badge-gray"}`}>{value}</span>;
};

export const boolBadge = (value: boolean): JSX.Element =>
  value ? (
    <span className="badge badge-green">Oui</span>
  ) : (
    <span className="badge badge-gray">Non</span>
  );
