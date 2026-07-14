import { useCallback, useEffect, useRef, useState } from "react";
import {
  getDashboardStats,
  getRecentOrders,
  subscribeToOrdersChanges,
  type DashboardStats,
  type RecentOrder as RecentOrderType,
  type RealtimeStatus,
} from "../data/DashbboardServices";
import StatCard from "../components/StateCard";
import RecentOrders from "../components/RecentOrder";
import "./DashboardScreen.css";

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [orders, setOrders] = useState<RecentOrderType[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isLive, setIsLive] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async (isInitial: boolean) => {
    try {
      if (isInitial) setLoading(true);
      setLoadError(null);

      const [statsData, ordersData] = await Promise.all([
        getDashboardStats(),
        getRecentOrders(),
      ]);

      setStats(statsData);
      setOrders(ordersData);
      setLastUpdated(new Date());
    } catch (err) {
      console.error(err);
      setLoadError(
        err instanceof Error ? err.message : "Impossible de charger le tableau de bord"
      );
    } finally {
      if (isInitial) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(true);

    // Toute modification sur la table "orders" (nouvelle commande, statut
    // changé, suppression...) redéclenche un rechargement des stats et des
    // dernières commandes. Le debounce évite de multiplier les requêtes si
    // plusieurs lignes changent d'un coup (ex: import en masse).
    const unsubscribe = subscribeToOrdersChanges(
      () => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => load(false), 400);
      },
      (status: RealtimeStatus) => setIsLive(status === "SUBSCRIBED")
    );

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      unsubscribe();
    };
  }, [load]);

  const showSkeleton = loading && !stats;

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Tableau de bord</h1>
          <p className="dashboard-subtitle">
            Vue d'ensemble des ventes et des commandes récentes.
          </p>
        </div>

        <div className="dashboard-status">
          <span className={`dashboard-live-dot ${isLive ? "is-live" : ""}`} />
          <span className="dashboard-live-label">
            {isLive ? "Temps réel actif" : "Connexion…"}
          </span>
          {lastUpdated && (
            <span className="dashboard-updated-at">
              · Mis à jour à{" "}
              {lastUpdated.toLocaleTimeString("fr-FR", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </span>
          )}
        </div>
      </div>

      {loadError && (
        <div className="dashboard-error">
          <span>{loadError}</span>
          <button className="dashboard-retry-btn" onClick={() => load(true)}>
            Réessayer
          </button>
        </div>
      )}

      <div className="stats-grid">
        {showSkeleton ? (
          <>
            <div className="stat-card is-skeleton">
              <span className="stat-card-accent" />
              <h3 className="stat-card-title" />
              <strong className="stat-card-value" />
            </div>
            <div className="stat-card is-skeleton">
              <span className="stat-card-accent" />
              <h3 className="stat-card-title" />
              <strong className="stat-card-value" />
            </div>
            <div className="stat-card is-skeleton">
              <span className="stat-card-accent" />
              <h3 className="stat-card-title" />
              <strong className="stat-card-value" />
            </div>
            <div className="stat-card is-skeleton">
              <span className="stat-card-accent" />
              <h3 className="stat-card-title" />
              <strong className="stat-card-value" />
            </div>
          </>
        ) : (
          stats && (
            <>
              <StatCard
                title="Ventes totales"
                value={`${new Intl.NumberFormat("fr-FR").format(stats.totalSales)} Ar`}
                accent="green"
              />
              <StatCard title="Commandes" value={stats.totalOrders} accent="neutral" />
              <StatCard
                title="En attente"
                value={stats.pendingOrders}
                accent={stats.pendingOrders > 0 ? "amber" : "neutral"}
              />
              <StatCard
                title="Panier moyen"
                value={`${new Intl.NumberFormat("fr-FR").format(
                  Math.round(stats.averageOrder)
                )} Ar`}
                accent="green"
              />
            </>
          )
        )}
      </div>

      <RecentOrders orders={orders} />
    </div>
  );
}