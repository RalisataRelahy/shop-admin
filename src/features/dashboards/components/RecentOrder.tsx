import "./RecentOrder.css";
import type { RecentOrder as RecentOrderType } from "../data/DashbboardServices";

interface Props {
  orders: RecentOrderType[];
}

// Adaptez ces libellés/couleurs aux valeurs réelles de votre colonne `statut`.
const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending: { label: "En attente", className: "status-pending" },
  preparing: { label: "En préparation", className: "status-preparing" },
  ready: { label: "Prête", className: "status-ready" },
  completed: { label: "Livrée", className: "status-completed" },
  delivered: { label: "Livrée", className: "status-completed" },
  cancelled: { label: "Annulée", className: "status-cancelled" },
};

function StatusBadge({ statut }: { statut: string }) {
  const config = STATUS_CONFIG[statut] ?? {
    label: statut,
    className: "status-default",
  };
  return <span className={`status-badge ${config.className}`}>{config.label}</span>;
}

function formatOrderId(id: string | number) {
  return `#${String(id).slice(0, 6).toUpperCase()}`;
}

function formatAmount(value: number) {
  return `${new Intl.NumberFormat("fr-FR").format(value)} Ar`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function RecentOrders({ orders }: Props) {
  return (
    <section className="recent-orders">
      <h2 className="recent-orders-title">Dernières commandes</h2>

      <div className="recent-orders-table-wrap">
        <table className="recent-orders-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Téléphone</th>
              <th>Montant</th>
              <th>Statut</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr className="recent-orders-empty-row">
                <td colSpan={5}>Aucune commande pour l'instant.</td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id}>
                  <td data-label="ID">{formatOrderId(order.id)}</td>
                  <td data-label="Téléphone">{order.client_phone ?? "—"}</td>
                  <td data-label="Montant" className="recent-orders-amount">
                    {formatAmount(order.total_price)}
                  </td>
                  <td data-label="Statut">
                    <StatusBadge statut={order.statut} />
                  </td>
                  <td data-label="Date">{formatDate(order.created_at)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}