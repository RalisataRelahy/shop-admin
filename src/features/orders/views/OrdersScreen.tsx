import { useMemo, useState } from "react";
import { Package, RefreshCw, CheckCircle2, Filter } from "lucide-react";
import { initialOrders, type Order } from "../data/OrdersModels";
import { orderStatusOptions, type OrderStatus } from "../../../types/OrdersStatusEnum";
import "./OrdersScreen.css";

type OrderWithMeta = Order & { updatedAt?: number };

export default function OrdersScreen() {
  const [orders, setOrders] = useState<OrderWithMeta[]>(initialOrders);
  const [filter, setFilter] = useState<OrderStatus | "Toutes">("Toutes");
  const [flashIds, setFlashIds] = useState<number[]>([]);
  const [toast, setToast] = useState<{ id: number; message: string } | null>(null);

  const showToast = (message: string) => {
    const id = Date.now();
    setToast({ id, message });
    setTimeout(() => {
      setToast((current) => (current?.id === id ? null : current));
    }, 2000);
  };

  const stats = useMemo(() => {
    const pending = orders.filter((order) => order.status === "En attente").length;
    const inProgress = orders.filter((order) => order.status === "En cours").length;
    const delivered = orders.filter((order) => order.status === "Livrée").length;

    return { pending, inProgress, delivered, total: orders.length };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    if (filter === "Toutes") return orders;
    return orders.filter((order) => order.status === filter);
  }, [orders, filter]);

  const updateStatus = (id: number, status: OrderStatus) => {
    setOrders((prev) =>
      prev.map((order) =>
        order.id === id ? { ...order, status, updatedAt: Date.now() } : order,
      ),
    );

    // petit flash visuel pour signaler le changement en direct
    setFlashIds((prev) => [...prev, id]);
    setTimeout(() => {
      setFlashIds((prev) => prev.filter((flashId) => flashId !== id));
    }, 600);

    showToast(`Commande #${id} → ${status}`);
  };

  const timeAgo = (timestamp?: number) => {
    if (!timestamp) return null;
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 5) return "à l'instant";
    if (seconds < 60) return `il y a ${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    return `il y a ${minutes} min`;
  };

  return (
    <div className="orders-page">
      <div className="orders-header">
        <div>
          <h2 className="orders-title">Gestion des commandes food</h2>
          <p className="orders-subtitle">Suivez et mettez à jour l’état des commandes de votre application de livraison.</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total</div>
          <div className="stat-value">{stats.total}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">En attente</div>
          <div className="stat-value">{stats.pending}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">En cours</div>
          <div className="stat-value">{stats.inProgress}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Livrées</div>
          <div className="stat-value">{stats.delivered}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-title-row">
          <div>
            <div className="card-title">Liste des commandes</div>
            <div className="card-subtitle">Modifiez l’état d’une commande selon sa progression de préparation.</div>
          </div>

          <label className="filter-select">
            <Filter size={14} />
            <select value={filter} onChange={(event) => setFilter(event.target.value as OrderStatus | "Toutes")}>
              <option value="Toutes">Toutes</option>
              {orderStatusOptions.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="orders-list">
          {filteredOrders.map((order) => (
            <div
              className={`order-item ${flashIds.includes(order.id) ? "is-flashing" : ""}`}
              key={order.id}
            >
              <div className="order-main">
                <div className="order-top">
                  <h3>#{order.id}</h3>
                  <span className={`status-pill ${order.status.toLowerCase().replace(/\s+/g, "")}`}>
                    {order.status}
                  </span>
                  {order.updatedAt ? (
                    <span className="updated-tag">{timeAgo(order.updatedAt)}</span>
                  ) : null}
                </div>
                <div className="order-customer">{order.customer}</div>
                <div className="order-product">{order.product}</div>
                <div className="order-meta">{order.date} • {order.total.toLocaleString("fr-FR")} €</div>
              </div>

              <div className="order-actions">
                <label className="status-select">
                  <RefreshCw size={14} />
                  <select value={order.status} onChange={(event) => updateStatus(order.id, event.target.value as OrderStatus)}>
                    {orderStatusOptions.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </label>
                <button type="button" className="action-btn">
                  <Package size={16} />
                  Voir
                </button>
              </div>
            </div>
          ))}

          {filteredOrders.length === 0 ? (
            <div className="empty-state">Aucune commande dans ce statut.</div>
          ) : null}
        </div>
      </div>

      {toast ? (
        <div className="toast">
          <CheckCircle2 size={16} />
          {toast.message}
        </div>
      ) : null}
    </div>
  );
}