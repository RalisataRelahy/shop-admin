import type { OrderStatus } from "../../../types/OrdersStatusEnum";

export interface Order {
  id: number;
  customer: string;
  product: string;
  total: number;
  status: OrderStatus;
  date: string;
}

export const initialOrders: Order[] = [
  {
    id: 1001,
    customer: "Amina K.",
    product: "Burger Deluxe + Frites",
    total: 15.9,
    status: "En cours",
    date: "2026-07-08",
  },
  {
    id: 1002,
    customer: "Sofiane B.",
    product: "Pizza Margherita",
    total: 12.5,
    status: "En attente",
    date: "2026-07-08",
  },
  {
    id: 1003,
    customer: "Léa M.",
    product: "2x Chicken Wrap",
    total: 18.0,
    status: "Livrée",
    date: "2026-07-07",
  },
];
