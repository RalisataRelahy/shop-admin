import { supabase } from "../../../supabase/config";

class CrudService {
  async getAll(table: string) {
    return await supabase.from(table).select("*");
  }

  async create(table: string, data: any) {
    return await supabase.from(table).insert(data);
  }

  async delete(table: string, id: number | string) {
    return await supabase.from(table).delete().eq("id", id);
  }
  async update(table:string, id:number|string,data:any){
    return await supabase.from(table).update(data).eq("id",id);
  }
}

export default new CrudService();