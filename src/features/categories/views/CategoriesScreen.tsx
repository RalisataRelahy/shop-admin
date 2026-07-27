import { useEffect, useState } from "react";
import {
  DndContext,
  closestCenter,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";

import crudService from "../data/CategoryService";
import type { Category } from "../data/CategorieModel";
import SortableCategory from "./components/SortableCategory";

import "./CategoriesScreen.css";

export default function CategoryPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [name, setName] = useState("");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    setLoading(true);

    const { data, error } = await crudService.getAll("categories");

    if (error) {
      setErrorMessage(error.message);
      setLoading(false);
      return;
    }

    setCategories(data ?? []);
    setErrorMessage(null);
    setLoading(false);
  }

  async function addCategory() {
    const trimmed = name.trim();

    if (!trimmed) return;

    const { error } = await crudService.create("categories", {
      name: trimmed,
      is_active: true,
    });

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setName("");
    loadCategories();
  }

  async function deleteCategory(id: number) {
    const { error } = await crudService.delete("categories", id);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    loadCategories();
  }

  async function toggleActive(category: Category) {
    await crudService.update("categories", category.id, {
      is_active: !category.is_active,
    });

    loadCategories();
  }

  function startEditing(category: Category) {
    setEditingId(category.id);
    setEditValue(category.name);
  }

  function cancelEditing() {
    setEditingId(null);
    setEditValue("");
  }

  async function saveEditing(id: number) {
    if (!editValue.trim()) return;

    await crudService.update("categories", id, {
      name: editValue,
    });

    cancelEditing();

    loadCategories();
  }

  async function saveDisplayOrder(list: Category[]) {
    for (let i = 0; i < list.length; i++) {
      await crudService.update("categories", list[i].id, {
        display_order: i,
      });
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over) return;

    if (active.id === over.id) return;

    const oldIndex = categories.findIndex(
      (c) => c.id === active.id
    );

    const newIndex = categories.findIndex(
      (c) => c.id === over.id
    );

    const newList = arrayMove(
      categories,
      oldIndex,
      newIndex
    );

    setCategories(newList);

    await saveDisplayOrder(newList);
  }

  return (
    <div className="cat-page">
      <div className="cat-container">

        <h1 className="cat-title">
          Gestion des catégories
        </h1>

        <p className="cat-subtitle">
          Faites glisser les catégories pour changer leur ordre.
        </p>

        {errorMessage && (
          <div className="cat-error">
            {errorMessage}
          </div>
        )}

        <div className="cat-add-bar">

          <input
            className="cat-input"
            value={name}
            placeholder="Nom de la catégorie"
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" && addCategory()
            }
          />

          <button
            className="cat-btn-primary"
            onClick={addCategory}
          >
            Ajouter
          </button>

        </div>

        {loading ? (
          <p>Chargement...</p>
        ) : (

          <DndContext
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >

            <SortableContext
              items={categories.map((c) => c.id)}
              strategy={verticalListSortingStrategy}
            >

              <div className="cat-list">

                {categories.map((category) => (

                  <SortableCategory
                    key={category.id}
                    category={category}
                    editingId={editingId}
                    editValue={editValue}
                    setEditValue={setEditValue}
                    startEditing={startEditing}
                    cancelEditing={cancelEditing}
                    saveEditing={saveEditing}
                    deleteCategory={deleteCategory}
                    toggleActive={toggleActive}
                  />

                ))}

              </div>

            </SortableContext>

          </DndContext>

        )}

      </div>
    </div>
  );
}