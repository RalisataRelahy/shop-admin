import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../../supabase/config";
import { type MenuItem } from "../data/ComboModel";

const MENU_ITEMS_TABLE = "menu_items";

export function useMenuItems() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMenuItems = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from(MENU_ITEMS_TABLE)
      .select("id, name")
      .order("name", { ascending: true });

    if (error) {
      setError(error.message);
    } else {
      setError(null);
      setMenuItems((data ?? []) as MenuItem[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchMenuItems();

    const channel = supabase
      .channel("menu-items-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: MENU_ITEMS_TABLE },
        fetchMenuItems
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchMenuItems]);

  return { menuItems, loading, error };
}