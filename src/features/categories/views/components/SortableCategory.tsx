import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";
import type { Category } from "../../data/CategorieModel";

interface Props {
  category: Category;

  editingId: number | null;
  editValue: string;

  setEditValue: React.Dispatch<React.SetStateAction<string>>;

  startEditing: (category: Category) => void;
  cancelEditing: () => void;
  saveEditing: (id: number) => void;

  deleteCategory: (id: number) => void;
  toggleActive: (category: Category) => void;
}

export default function SortableCategory({
  category,
  editingId,
  editValue,
  setEditValue,
  startEditing,
  cancelEditing,
  saveEditing,
  deleteCategory,
  toggleActive,
}: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: category.id,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    cursor: "grab",
  };

  const isEditing = editingId === category.id;
  const isActive = category.is_active;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`cat-row ${isActive ? "" : "inactive"}`}
    >
      {/* Zone de drag uniquement */}
      <div
        className="cat-drag-handle"
        {...attributes}
        {...listeners}
        title="Déplacer"
      >
        ☰
        {isEditing ? (
        <input
          className="cat-edit-input"
          autoFocus
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              saveEditing(category.id);
            }

            if (e.key === "Escape") {
              cancelEditing();
            }
          }}
        />
      ) : (
        <span className="cat-name">
          {category.name}
          {!isActive && (
            <span className="cat-badge">
              Désactivée
            </span>
          )}
        </span>
      )}
      </div>


      <div className="cat-actions">
        {isEditing ? (
          <>
            <button
              className="cat-btn-primary small"
              onClick={() => saveEditing(category.id)}
            >
              Enregistrer
            </button>

            <button
              className="cat-btn-ghost"
              onClick={cancelEditing}
            >
              Annuler
            </button>
          </>
        ) : (
          <>
            <button
              className={`cat-switch ${isActive ? "active" : ""}`}
              onClick={() => toggleActive(category)}
            >
              <span className="cat-switch-knob" />
            </button>

            <button
              className="cat-btn-ghost"
              onClick={() => startEditing(category)}
            >
              Renommer
            </button>

            <button
              className="cat-btn-danger"
              onClick={() => deleteCategory(category.id)}
            >
              Supprimer
            </button>
          </>
        )}
      </div>
    </div>
  );
}