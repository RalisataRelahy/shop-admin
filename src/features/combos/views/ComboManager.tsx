import { useState, type FormEvent } from "react";
import AddComboPackPage, { type ComboFormState } from "./components/AddComboPackage";
import { useCombos } from "../data/useCombo";
import { type ComboModel } from "../data/ComboModel";
import './ComboManager.css'
const emptyForm: ComboFormState = {
  name: "",
  description: "",
  price: 0,
  imageUrl: "",
  available: true,
};

export default function ComboManagerPage() {
  const { combos, loading, error, createCombo, updateCombo, deleteCombo, toggleActive } =
    useCombos();

  const [comboForm, setComboForm] = useState<ComboFormState>(emptyForm);
  const [editingComboId, setEditingComboId] = useState<ComboModel["id"] | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<ComboModel["id"] | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const resetForm = () => {
    setComboForm(emptyForm);
    setEditingComboId(null);
    setFormError(null);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      if (editingComboId !== null) {
        await updateCombo(editingComboId, comboForm);
      } else {
        await createCombo(comboForm);
      }
      resetForm();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (combo: ComboModel) => {
    setEditingComboId(combo.id);
    setFormError(null);
    setComboForm({
      name: combo.name,
      description: combo.description,
      price: combo.price,
      imageUrl: combo.image_url,
      available: combo.is_active,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: ComboModel["id"]) => {
    if (!window.confirm("Supprimer ce pack combo ? Cette action est définitive.")) return;
    setDeletingId(id);
    try {
      await deleteCombo(id);
      if (editingComboId === id) resetForm();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Suppression impossible");
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleActive = async (combo: ComboModel) => {
    try {
      await toggleActive(combo);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Impossible de changer la disponibilité");
    }
  };

  return (
    <div className="page">
      <AddComboPackPage
        comboForm={comboForm}
        editingComboId={editingComboId}
        onChange={setComboForm}
        onSubmit={handleSubmit}
        onCancel={resetForm}
      />

      {submitting && <p className="hint-text">Enregistrement en cours...</p>}
      {formError && <p className="error-text">{formError}</p>}

      <div className="card-title" style={{ marginTop: 32 }}>
        Packs existants
      </div>

      {loading && <p className="hint-text">Chargement des packs...</p>}
      {error && <p className="error-text">Erreur : {error}</p>}
      {!loading && !error && combos.length === 0 && (
        <p className="empty-hint">Aucun pack combo pour le moment. Créez-en un ci-dessus.</p>
      )}

      <div className="card-list">
        {combos.map((combo) => (
          <div
            key={combo.id}
            className={`card combo-row ${combo.is_active ? "" : "combo-row-inactive"}`}
          >
            <img
              src={combo.image_url}
              alt={combo.name}
              width={56}
              height={56}
              className="combo-row-image"
            />
            <div className="combo-row-info">
              <strong>{combo.name}</strong>
              <span className="combo-row-price">{combo.price.toFixed(2)} €</span>
              <span className="combo-row-meta">
                {combo.is_active ? "Disponible" : "Indisponible"}
              </span>
            </div>
            <div className="actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => handleToggleActive(combo)}
                disabled={deletingId === combo.id}
              >
                {combo.is_active ? "Désactiver" : "Activer"}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => handleEdit(combo)}
                disabled={deletingId === combo.id}
              >
                Modifier
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => handleDelete(combo.id)}
                disabled={deletingId === combo.id}
              >
                {deletingId === combo.id ? "Suppression..." : "Supprimer"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}