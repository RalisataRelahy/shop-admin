import { useMemo } from "react";
import { ShoppingCart, TrendingUp, ListOrdered, Clock } from "lucide-react";
import './DashboardScreen.css';
/* ============================================================
   INTERFACES
   ============================================================ */
interface VenteJour {
  jour: string; // ex: "Lun"
  date: string; // ex: "2026-07-02"
  total: number; // total des ventes du jour en €
}

interface Commande {
  id: number;
  statut: "En attente" | "En cours" | "Livrée" | "Annulée";
}

interface CommandeArrivee {
  id: number;
  client: string;
  produit: string;
  heure: string;
  montant: number;
}

interface StatCardData {
  label: string;
  value: string;
  icon: React.ReactNode;
}

/* ============================================================
   MOCK DATA
   ============================================================ */
const VENTES_MOCK: VenteJour[] = [
  { jour: "Lun", date: "2026-07-02", total: 320 },
  { jour: "Mar", date: "2026-07-03", total: 410 },
  { jour: "Mer", date: "2026-07-04", total: 280 },
  { jour: "Jeu", date: "2026-07-05", total: 500 },
  { jour: "Ven", date: "2026-07-06", total: 610 },
  { jour: "Sam", date: "2026-07-07", total: 720 },
  { jour: "Dim", date: "2026-07-08", total: 482 },
];

const COMMANDES_MOCK: Commande[] = [
  { id: 1, statut: "En attente" },
  { id: 2, statut: "En cours" },
  { id: 3, statut: "En cours" },
  { id: 4, statut: "Livrée" },
  { id: 5, statut: "En cours" },
  { id: 6, statut: "Annulée" },
  { id: 7, statut: "Livrée" },
];

const COMMANDES_A_ARRIVER: CommandeArrivee[] = [
  { id: 101, client: "Amina K.", produit: "2 Burgers", heure: "10:30", montant: 1899 },
  { id: 102, client: "Sofiane B.", produit: "2 Mangue", heure: "12:15", montant: 1299 },
  { id: 103, client: "Léa M.", produit: "3 banane", heure: "14:00", montant: 699 },
];

const STATUT_ORDER: Commande["statut"][] = ["En attente", "En cours", "Livrée", "Annulée"];

/* ============================================================
   PAGE : DASHBOARD
   ============================================================ */
export default function Dashboard() {
  const today = useMemo(
    () =>
      new Date().toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
      }),
    [],
  );

  const stats = useMemo(() => {
    const venteAujourdhui = VENTES_MOCK[VENTES_MOCK.length - 1].total;
    const commandesEnCours = COMMANDES_MOCK.filter((c) => c.statut === "En cours").length;
    const totalCommandes = COMMANDES_MOCK.length;

    return { venteAujourdhui, commandesEnCours, totalCommandes };
  }, []);

  const repartition = useMemo(() => {
    const total = COMMANDES_MOCK.length || 1;
    return STATUT_ORDER.map((statut) => {
      const count = COMMANDES_MOCK.filter((c) => c.statut === statut).length;
      return {
        statut,
        count,
        pct: Math.round((count / total) * 100),
      };
    });
  }, []);

  const cards: StatCardData[] = [
    {
      label: "Ventes aujourd'hui",
      value: `${stats.venteAujourdhui.toLocaleString("fr-FR")} Ar`,
      icon: <TrendingUp size={20} />,
    },
    {
      label: "Commandes en cours",
      value: String(stats.commandesEnCours),
      icon: <ShoppingCart size={20} />,
    },
    {
      label: "Total des commandes",
      value: String(stats.totalCommandes),
      icon: <ListOrdered size={20} />,
    },
  ];

  return (
    <div className="dash">
      <div className="dash-header">
        <div>
          <h2 className="dash-title">Tableau de bord</h2>
          <p className="dash-subtitle">Aperçu général de votre activité</p>
        </div>
        <div className="dash-date-pill">
          <span className="dash-date-dot" />
          {today}
        </div>
      </div>

      <div className="stats-grid">
        {cards.map((card) => (
          <div className="stat-card" key={card.label}>
            <div className="stat-icon">{card.icon}</div>
            <div className="stat-text">
              <div className="stat-label">{card.label}</div>
              <div className="stat-value">{card.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="dash-grid">
        <div className="card">
          <div className="card-heading">
            <h3 className="card-title">Répartition des commandes</h3>
            <p className="card-subtitle">Statut de {stats.totalCommandes} commandes au total</p>
          </div>

          <div className="statut-list">
            {repartition.map((row) => (
              <div className="statut-row" key={row.statut}>
                <div className="statut-row-top">
                  <span className={`statut-dot statut-dot--${row.statut.replace(" ", "-").toLowerCase()}`} />
                  <span className="statut-label">{row.statut}</span>
                  <span className="statut-count">{row.count}</span>
                </div>
                <div className="statut-track">
                  <div
                    className={`statut-fill statut-fill--${row.statut.replace(" ", "-").toLowerCase()}`}
                    style={{ width: `${row.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-heading">
            <h3 className="card-title">Commandes à arriver</h3>
            <p className="card-subtitle">Livraisons prévues prochainement</p>
          </div>

          <div className="incoming-orders-list">
            {COMMANDES_A_ARRIVER.length === 0 ? (
              <div className="empty-state">Aucune livraison prévue pour le moment.</div>
            ) : (
              COMMANDES_A_ARRIVER.map((commande) => (
                <div className="incoming-order-item" key={commande.id}>
                  <div className="incoming-order-avatar">
                    {commande.client
                      .split(" ")
                      .map((part) => part[0])
                      .join("")
                      .slice(0, 2)}
                  </div>
                  <div className="incoming-order-main">
                    <div className="incoming-order-client">{commande.client}</div>
                    <div className="incoming-order-product">{commande.produit}</div>
                  </div>
                  <div className="incoming-order-meta">
                    <span className="incoming-order-time">
                      <Clock size={13} />
                      {commande.heure}
                    </span>
                    <span className="incoming-order-amount">{commande.montant.toLocaleString("fr-FR")} Ar</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}