import { Plus } from "lucide-react";
import type { MenuItem } from "../../products/data/ProductsModels";

export interface ComboFormState {
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  itemIds: number[];
  available: boolean;
}

interface AddComboPackPageProps {
  comboForm: ComboFormState;
  editingComboId: number | null;
  menuItems: MenuItem[];
  onChange: (form: ComboFormState) => void;
  onSubmit: (event: React.FormEvent) => void;
  onCancel: () => void;
  onToggleComboItem: (itemId: number) => void;
}

export default function AddComboPackPage({
  comboForm,
  editingComboId,
  menuItems,
  onChange,
  onSubmit,
  onCancel,
  onToggleComboItem,
}: AddComboPackPageProps) {
  return (
    <form className="card" onSubmit={onSubmit}>
      <div className="card-title">{editingComboId ? "Modifier un pack" : "Créer un pack combo"}</div>
      <div className="card-subtitle">Assemblez plusieurs menus dans un pack à prix réduit.</div>

      <div className="form-grid">
        <label className="field">
          <span>Nom du pack</span>
          <input
            value={comboForm.name}
            onChange={(event) => onChange({ ...comboForm, name: event.target.value })}
            placeholder="Ex : Family Box"
          />
        </label>

        <label className="field">
          <span>Description</span>
          <textarea
            value={comboForm.description}
            onChange={(event) => onChange({ ...comboForm, description: event.target.value })}
            rows={3}
            placeholder="Description du combo"
          />
        </label>

        <label className="field">
          <span>Prix (€)</span>
          <input
            type="number"
            step="0.1"
            value={comboForm.price}
            onChange={(event) => onChange({ ...comboForm, price: Number(event.target.value) })}
          />
        </label>

        <label className="field">
          <span>Image URL</span>
          <input
            value={comboForm.imageUrl}
            onChange={(event) => onChange({ ...comboForm, imageUrl: event.target.value })}
            placeholder="https://..."
          />
        </label>

        <div className="field">
          <span>Éléments inclus</span>
          <div className="chip-list">
            {menuItems.map((item) => (
              <button
                type="button"
                key={item.id}
                className={`chip ${comboForm.itemIds.includes(item.id) ? "selected" : ""}`}
                onClick={() => onToggleComboItem(item.id)}
              >
                {item.name}
              </button>
            ))}
          </div>
        </div>

        <label className="toggle-row">
          <input
            type="checkbox"
            checked={comboForm.available}
            onChange={(event) => onChange({ ...comboForm, available: event.target.checked })}
          />
          <span>Pack disponible</span>
        </label>
      </div>

      <div className="actions">
        <button type="submit" className="btn btn-primary">
          <Plus size={16} />
          {editingComboId ? "Enregistrer" : "Créer"}
        </button>
        {editingComboId ? (
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            Annuler
          </button>
        ) : null}
      </div>
    </form>
  );
}