export interface DashboardStats {
  totalSales: number;
  totalOrders: number;
  pendingOrders: number;
  averageOrder: number;
}


export interface RecentOrder {
  id: string;
  total_price: number;
  statut: string;
  created_at: string;
  phone: string;
}