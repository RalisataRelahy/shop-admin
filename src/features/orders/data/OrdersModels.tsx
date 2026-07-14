import type { OrderStatus } from "../../../types/OrdersStatusEnum";

export interface Order {
  id: number;
  client_id: string;
  delivery_mode:string;
  delivery_address: number;
  status:OrderStatus;
  latitude: number;
  longitude:number;
  payement_methode:string;
  totale_price:number;
  notes:string;
  created_at:string;
  client_phone:string;
  pickup_time:string;
}
