import { supabase } from "../../../supabase/config";

class CrudService {
  async getAll<T = any>(table: string) {
    return await supabase.from(table).select("*").returns<T[]>();
  }

  /**
   * Crée une ligne et renvoie la ligne créée (avec son id).
   * `.select().single()` est indispensable ici : sans lui, Supabase
   * n'insère la ligne mais ne renvoie rien dans `data` (d'où le
   * `product.id` en erreur côté appelant).
   */
  async create<T = any>(table: string, data: any) {
    return await supabase
      .from(table)
      .insert(data)
      .select()
      .single<T>();
  }

  /**
   * Insère plusieurs lignes d'un coup (ex: les variantes d'un produit)
   * et renvoie les lignes créées.
   */
  async insertMany<T = any>(table: string, data: any[]) {
    return await supabase
      .from(table)
      .insert(data)
      .select()
      .returns<T[]>();
  }

  async delete(table: string, id: number | string) {
    return await supabase.from(table).delete().eq("id", id);
  }

  async update<T = any>(table: string, id: number | string, data: any) {
    return await supabase
      .from(table)
      .update(data)
      .eq("id", id)
      .select()
      .returns<T[]>();
  }
}

export default new CrudService();