import { supabase } from "../../../supabase/config";

export interface DashboardStats {
  totalSales: number;
  totalOrders: number;
  pendingOrders: number;
  averageOrder: number;
}

export interface RecentOrder {
  id: string | number;
  total_price: number;
  statut: string;
  client_phone: string | null;
  created_at: string;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const { data: orders, error } = await supabase
    .from("orders")
    .select("id,total_price,statut");

  if (error) {
    console.error(error);
    throw error;
  }

  const rows = orders ?? [];
  const totalSales = rows.reduce((sum, o) => sum + (o.total_price ?? 0), 0);
  const totalOrders = rows.length;
  const pendingOrders = rows.filter((o) => o.statut === "pending").length;
  const averageOrder = totalOrders > 0 ? totalSales / totalOrders : 0;

  return { totalSales, totalOrders, pendingOrders, averageOrder };
}

export async function getRecentOrders(): Promise<RecentOrder[]> {
  const { data, error } = await supabase
    .from("orders")
    .select(
      `
      id,
      total_price,
      statut,
      client_phone,
      created_at
   `
    )
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) {
    console.error(error);
    throw error;
  }

  return data ?? [];
}

export type RealtimeStatus =
  | "SUBSCRIBED"
  | "CHANNEL_ERROR"
  | "TIMED_OUT"
  | "CLOSED";

/**
 * S'abonne aux changements en temps réel de la table "orders" (insert,
 * update, delete confondus) et déclenche `onChange` à chaque événement.
 * Renvoie une fonction de nettoyage à appeler dans le cleanup du useEffect.
 */
export function subscribeToOrdersChanges(
  onChange: () => void,
  onStatusChange?: (status: RealtimeStatus) => void
) {
  const channel = supabase
    .channel("dashboard-orders-changes")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "orders" },
      () => onChange()
    )
    .subscribe((status) => {
      onStatusChange?.(status as RealtimeStatus);
    });

  return () => {
    supabase.removeChannel(channel);
  };
}