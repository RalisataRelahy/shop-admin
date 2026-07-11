import { useEffect, useState } from "react";
import crudService from "../data/CategoryService";
import "./CategoriesScreen.css";
import type { Category } from "../data/CategorieModel";


export default function CategoryPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");

  const loadCategories = async () => {
    const { data, error } = await crudService.getAll("categories");
    if (error) {
      console.error(error);
      setErrorMessage(error.message);
      setLoading(false);
      return;
    }
    setErrorMessage(null);
    setCategories(data ?? []);
    setLoading(false);
  };

  const addCategory = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) return;
    const { error } = await crudService.create("categories", {
      name: trimmedName,
      is_active: true,
    });
    if (error) {
      console.error(error);
      setErrorMessage(error.message);
      return;
    }
    setName("");
    setErrorMessage(null);
    loadCategories();
  };

  const deleteCategory = async (id: number) => {
    const { error } = await crudService.delete("categories", id);
    if (error) {
      console.error(error);
      setErrorMessage(error.message);
      return;
    }
    setErrorMessage(null);
    loadCategories();
  };

  const startEditing = (category: Category) => {
    setEditingId(category.id);
    setEditValue(category.name);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditValue("");
  };

  const saveEditing = async (id: number) => {
    const trimmed = editValue.trim();
    if (!trimmed) return;
    const { error } = await crudService.update("categories", id, {
      name: trimmed,
    });
    if (error) {
      console.error(error);
      setErrorMessage(error.message);
      return;
    }
    setErrorMessage(null);
    setEditingId(null);
    setEditValue("");
    loadCategories();
  };

  const toggleActive = async (category: Category) => {
    const { error } = await crudService.update("categories", category.id, {
      is_active: !category.is_active,
    });
    if (error) {
      console.error(error);
      setErrorMessage(error.message);
      return;
    }
    setErrorMessage(null);
    loadCategories();
  };

  useEffect(() => {
    loadCategories();
  }, []);

  return (
    <div className="cat-page">
      <div className="cat-container">
        <h1 className="cat-title">Gestion des catégories</h1>
        <p className="cat-subtitle">
          Ajoutez, renommez ou désactivez vos catégories.
        </p>

        {errorMessage ? <div className="cat-error">{errorMessage}</div> : null}

        <div className="cat-add-bar">
          <input
            className="cat-input"
            type="text"
            placeholder="Nom de la catégorie"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addCategory()}
          />
          <button className="cat-btn-primary" onClick={addCategory}>
            + Ajouter
          </button>
        </div>

        <div className="cat-list">
          {loading ? (
            <p className="cat-empty">Chargement…</p>
          ) : categories.length === 0 ? (
            <p className="cat-empty">Aucune catégorie pour l'instant.</p>
          ) : (
            categories.map((category) => {
              const isActive = category.is_active;
              const isEditing = editingId === category.id;
              return (
                <div
                  key={category.id}
                  className={`cat-row ${isActive ? "" : "inactive"}`}
                >
                  {isEditing ? (
                    <input
                      className="cat-edit-input"
                      autoFocus
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveEditing(category.id);
                        if (e.key === "Escape") cancelEditing();
                      }}
                    />
                  ) : (
                    <span className="cat-name">
                      {category.name}
                      {!isActive && (
                        <span className="cat-badge">Désactivée</span>
                      )}
                    </span>
                  )}

                  <div className="cat-actions">
                    {isEditing ? (
                      <>
                        <button
                          className="cat-btn-primary small"
                          onClick={() => saveEditing(category.id)}
                        >
                          Enregistrer
                        </button>
                        <button className="cat-btn-ghost" onClick={cancelEditing}>
                          Annuler
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          className={`cat-switch ${isActive ? "active" : ""}`}
                          onClick={() => toggleActive(category)}
                          title={isActive ? "Désactiver" : "Activer"}
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
            })
          )}
        </div>
      </div>
    </div>
  );
}