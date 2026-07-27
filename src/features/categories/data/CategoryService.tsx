import { supabase } from "../../../supabase/config";

class CrudService {
  async getAll(table: string) {
    return await supabase
      .from(table)
      .select("*")
      .order("display_order", { ascending: true });
  }

  async create(table: string, data: any) {
    return await supabase
      .from(table)
      .insert(data)
      .select()
      .single();
  }

  async update(table: string, id: number | string, data: any) {
    return await supabase
      .from(table)
      .update(data)
      .eq("id", id)
      .select()
      .single();
  }

  async delete(table: string, id: number | string) {
    return await supabase
      .from(table)
      .delete()
      .eq("id", id);
  }

  async updateDisplayOrder(
    table: string,
    items: { id: number | string; display_order: number }[]
  ) {
    const promises = items.map((item) =>
      supabase
        .from(table)
        .update({
          display_order: item.display_order,
        })
        .eq("id", item.id)
    );

    return await Promise.all(promises);
  }
}

export default new CrudService();