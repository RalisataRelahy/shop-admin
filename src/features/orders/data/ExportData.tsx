import { supabase } from "../../../supabase/config";
import * as XLSX from "xlsx";


export async function exportOrders() {

  const { data, error } = await supabase
    .from("orders")
    .select(`
      id,
      client_phone,
      client_name,
      total_price,
      statut,
      created_at
    `)
    .order("created_at", {
      ascending: false
    });


  if(error){
    throw error;
  }
   const formattedData = data.map(order => ({
    "ID commande": order.id,
    "Téléphone": order.client_phone,
    "Client": order.client_name,
    "Montant (Ar)": order.total_price,
    "Statut": order.statut,
    "Date et heure": new Date(order.created_at)
      .toLocaleString("fr-FR")
  }));
  const worksheet = XLSX.utils.json_to_sheet(
    formattedData
  );


  const workbook = XLSX.utils.book_new();


  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    "Commandes"
  );
    const date = new Date();

    const formattedDate = date
    .toISOString()
    .slice(0, 10); // 2026-08-03

    XLSX.writeFile(
    workbook,
    `commandes-fast-good-${formattedDate}.xlsx`
    );
}