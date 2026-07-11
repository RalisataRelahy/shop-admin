import { useEffect, useState } from "react";
import crudService from "../data/ProductsServices";
import { uploadProductImage } from "../../../supabase/storage";
import "./ProductsScreen.css";

export interface ProductsModel {
  id: number | string;
  name: string;
  category_id: number | string;
  description: string;
  price: number;
  image_url: string;
  is_active: boolean;
}

interface Category {
  id: number | string;
  name: string;
  is_active: boolean;
}

const emptyForm = {
  name: "",
  category_id: "",
  description: "",
  price: "",
  image_url: "",
};

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductsModel[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const loadProducts = async () => {
    const { data, error } = await crudService.getAll("products");
    if (error) {
      console.error(error);
      setErrorMessage(error.message);
      setLoading(false);
      return;
    }
    setErrorMessage(null);
    setProducts(data ?? []);
    setLoading(false);
  };

  const loadCategories = async () => {
    const { data, error } = await crudService.getAll("categories");
    if (error) {
      console.error(error);
      return;
    }
    setCategories(data ?? []);
  };

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  const categoryName = (categoryId: number | string) =>
    categories.find((c) => c.id === categoryId)?.name ?? "Sans catégorie";

  const resetForm = () => {
    setForm(emptyForm);
    setShowForm(false);
    setPreviewImage(null);
    setSelectedFile(null);
  };

  const addProduct = async () => {
    const trimmedName = form.name.trim();
    if (!trimmedName || !form.category_id || !form.price) return;

    try {
      let imageUrl = form.image_url.trim();

      if (selectedFile) {
        setUploadingImage(true);
        imageUrl = await uploadProductImage(selectedFile,trimmedName);
        setUploadingImage(false);
      }

      const { error } = await crudService.create("products", {
        name: trimmedName,
        category_id: form.category_id,
        description: form.description.trim(),
        price: Number(form.price),
        image_url: imageUrl,
        is_active: true,
      });

      if (error) {
        console.error(error);
        setErrorMessage(error.message);
        return;
      }

      setErrorMessage(null);
      resetForm();
      loadProducts();
    } catch (err) {
      console.error(err);
      setUploadingImage(false);
      setErrorMessage(err instanceof Error ? err.message : "Erreur lors de l'upload de l'image");
    }
  };

  const deleteProduct = async (id: number | string) => {
    const { error } = await crudService.delete("products", id);
    if (error) {
      console.error(error);
      setErrorMessage(error.message);
      return;
    }
    setErrorMessage(null);
    loadProducts();
  };

  const handleImageSelection = (file: File | null) => {
    if (!file) return;

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewImage(reader.result as string);
    };
    reader.readAsDataURL(file);
    setErrorMessage(null);
  };

  const handleConfirmUpload = async () => {
    if (!selectedFile) return;

    try {
      setUploadingImage(true);
      const publicUrl = await uploadProductImage(selectedFile);
      setForm((prev) => ({ ...prev, image_url: publicUrl }));
      setErrorMessage(null);
    } catch (err) {
      console.error(err);
      setErrorMessage(err instanceof Error ? err.message : "Erreur lors de l'upload de l'image");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
    const file = event.dataTransfer.files?.[0];
    handleImageSelection(file ?? null);
  };

  const toggleActive = async (product: ProductsModel) => {
    const { error } = await crudService.update("products", product.id, {
      is_active: !product.is_active,
    });
    if (error) {
      console.error(error);
      setErrorMessage(error.message);
      return;
    }
    setErrorMessage(null);
    loadProducts();
  };

  return (
    <div className="prod-page">
      <div className="prod-container">
        <div className="prod-header">
          <div>
            <h1 className="prod-title">Gestion des Menus/Plat</h1>
            <p className="prod-subtitle">
              Consultez, ajoutez, supprimez ou désactivez vos plats/menus.
            </p>
          </div>
          <button
            className="prod-btn-primary"
            onClick={() => setShowForm((prev) => !prev)}
          >
            {showForm ? "Fermer" : "+ Ajouter un plat"}
          </button>
        </div>

        {errorMessage && <div className="prod-error">{errorMessage}</div>}

        {showForm && (
          <div className="prod-form">
            <div className="prod-form-grid">
              <div className="prod-field">
                <label className="prod-label">Nom</label>
                <input
                  className="prod-input"
                  type="text"
                  placeholder="Ex: Pizza Margherita"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div className="prod-field">
                <label className="prod-label">Catégorie</label>
                <select
                  className="prod-input"
                  value={form.category_id}
                  onChange={(e) =>
                    setForm({ ...form, category_id: e.target.value })
                  }
                >
                  <option value="">Sélectionner…</option>
                  {categories
                    .filter((c) => c.is_active)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="prod-field">
                <label className="prod-label">Prix</label>
                <input
                  className="prod-input"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0Ar"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                />
              </div>

              <div className="prod-field prod-field-full">
                <label className="prod-label">Image</label>
                <div
                  className={`prod-dropzone ${dragActive ? "is-dragging" : ""}`}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setDragActive(true);
                  }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={handleDrop}
                >
                  <p>{uploadingImage ? "Upload en cours…" : "Glissez une image ici ou cliquez pour sélectionner"}</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) => handleImageSelection(event.target.files?.[0] ?? null)}
                  />
                </div>
                {previewImage && (
                  <div className="prod-image-preview-card">
                    <img src={previewImage} alt="Aperçu de l'image" className="prod-image-preview" />
                    <div className="prod-image-preview-info">
                      <span className="prod-image-confirmed">Aperçu prêt</span>
                      <p className="prod-uploaded-url">Cette image sera envoyée après confirmation.</p>
                      <button type="button" className="prod-btn-primary small" onClick={handleConfirmUpload} disabled={uploadingImage}>
                        {uploadingImage ? "Envoi en cours…" : "Confirmer l'envoi"}
                      </button>
                    </div>
                  </div>
                )}
                {form.image_url && !previewImage && (
                  <div className="prod-image-preview-card">
                    <img src={form.image_url} alt="Image envoyée" className="prod-image-preview" />
                    <div className="prod-image-preview-info">
                      <span className="prod-image-confirmed">✓ Upload confirmé</span>
                      <p className="prod-uploaded-url">{form.image_url}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="prod-field prod-field-full">
                <label className="prod-label">Description</label>
                <textarea
                  className="prod-input prod-textarea"
                  placeholder="Décrivez le produit…"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="prod-form-actions">
              <button className="prod-btn-primary" onClick={addProduct}>
                Enregistrer
              </button>
              <button className="prod-btn-ghost" onClick={resetForm}>
                Annuler
              </button>
            </div>
          </div>
        )}

        <div className="prod-grid">
          {loading ? (
            <p className="prod-empty">Chargement…</p>
          ) : products.length === 0 ? (
            <p className="prod-empty">Aucun produit pour l'instant.</p>
          ) : (
            products.map((product) => (
              <div
                key={product.id}
                className={`prod-card ${product.is_active ? "" : "inactive"}`}
              >
                <div className="prod-card-image">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} />
                  ) : (
                    <div className="prod-card-image-placeholder">Pas d'image</div>
                  )}
                  {!product.is_active && (
                    <span className="prod-badge">Désactivé</span>
                  )}
                </div>

                <div className="prod-card-body">
                  <div className="prod-card-top">
                    <h3 className="prod-card-name">{product.name}</h3>
                    <span className="prod-card-price">
                      {product.price.toFixed(2)} Ar
                    </span>
                  </div>
                  <span className="prod-card-category">
                    Category : {categoryName(product.category_id)}
                  </span>
                  {product.description && (
                    <p className="prod-card-desc">{product.description}</p>
                  )}
                </div>

                <div className="prod-card-actions">
                  <button
                    className={`prod-switch ${product.is_active ? "active" : ""}`}
                    onClick={() => toggleActive(product)}
                    title={product.is_active ? "Désactiver" : "Activer"}
                  >
                    <span className="prod-switch-knob" />
                  </button>
                  <button
                    className="prod-btn-danger"
                    onClick={() => deleteProduct(product.id)}
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}