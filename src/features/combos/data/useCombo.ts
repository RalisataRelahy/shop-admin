import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../../supabase/config";
import { type ComboModel } from "./ComboModel";
import { type ComboFormState } from "../views/components/AddComboPackage";

const COMBOS_TABLE = "combos";

export function useCombos() {
  const [combos, setCombos] = useState<ComboModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCombos = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from(COMBOS_TABLE)
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setError(null);
    setCombos((data ?? []) as ComboModel[]);
    setLoading(false);
  }, []);

  // Chargement initial
  useEffect(() => {
    fetchCombos();
  }, [fetchCombos]);

  // Realtime : synchronise automatiquement si le changement vient d'ailleurs
  // (autre onglet, autre utilisateur admin, etc.)
  useEffect(() => {
    const channel = supabase
      .channel("combos-changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: COMBOS_TABLE },
        (payload) => {
          const inserted = payload.new as ComboModel;
          setCombos((prev) =>
            prev.some((c) => c.id === inserted.id)
              ? prev
              : [...prev, inserted].sort((a, b) => a.name.localeCompare(b.name))
          );
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: COMBOS_TABLE },
        (payload) => {
          const updated = payload.new as ComboModel;
          setCombos((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: COMBOS_TABLE },
        (payload) => {
          const deletedId = (payload.old as ComboModel).id;
          setCombos((prev) => prev.filter((c) => c.id !== deletedId));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Chaque action met aussi à jour l'état local tout de suite : l'utilisateur
  // voit le résultat sans attendre l'aller-retour Realtime.

  const createCombo = useCallback(async (form: ComboFormState) => {
    const { data, error } = await supabase
      .from(COMBOS_TABLE)
      .insert({
        name: form.name,
        description: form.description,
        price: form.price,
        image_url: form.imageUrl,
        is_active: form.available,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    const created = data as ComboModel;
    setCombos((prev) =>
      prev.some((c) => c.id === created.id)
        ? prev
        : [...prev, created].sort((a, b) => a.name.localeCompare(b.name))
    );
    return created;
  }, []);

  const updateCombo = useCallback(async (id: ComboModel["id"], form: ComboFormState) => {
    const { data, error } = await supabase
      .from(COMBOS_TABLE)
      .update({
        name: form.name,
        description: form.description,
        price: form.price,
        image_url: form.imageUrl,
        is_active: form.available,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);

    const updated = data as ComboModel;
    setCombos((prev) => prev.map((c) => (c.id === id ? updated : c)));
    return updated;
  }, []);

  const deleteCombo = useCallback(async (id: ComboModel["id"]) => {
    const { error } = await supabase.from(COMBOS_TABLE).delete().eq("id", id);
    if (error) throw new Error(error.message);

    setCombos((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const toggleActive = useCallback(async (combo: ComboModel) => {
    const { data, error } = await supabase
      .from(COMBOS_TABLE)
      .update({ is_active: !combo.is_active })
      .eq("id", combo.id)
      .select()
      .single();

    if (error) throw new Error(error.message);

    const updated = data as ComboModel;
    setCombos((prev) => prev.map((c) => (c.id === combo.id ? updated : c)));
    return updated;
  }, []);

  return {
    combos,
    loading,
    error,
    createCombo,
    updateCombo,
    deleteCombo,
    toggleActive,
    refetch: fetchCombos,
  };
}