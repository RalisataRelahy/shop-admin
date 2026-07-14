import { useEffect, useState } from "react";
import crudService from "../data/ProductsServices";
import { uploadProductImage } from "../../../supabase/storage";
import "./ProductsScreen.css";
import { supabase } from "../../../supabase/config";

export interface ProductVariant {
  id?: string | number;
  name: string;
  price: number;
  display_order: number;
  is_available: boolean;
}

export interface ProductsModel {
  id: number | string;
  name: string;
  category_id: number | string;
  description: string;
  image_url: string;
  is_active: boolean;
  product_variants: ProductVariant[];
}

interface Category {
  id: number | string;
  name: string;
  is_active: boolean;
}

interface VariantFormState {
  name: string;
  price: string;
  display_order: number;
}

interface ProductFormState {
  name: string;
  category_id: string;
  description: string;
  image_url: string;
  variants: VariantFormState[];
}

const emptyForm: ProductFormState = {
  name: "",
  category_id: "",
  description: "",
  image_url: "",
  variants: [
    {
      name: "Standard",
      price: "",
      display_order: 1,
    },
  ],
};

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductsModel[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState<ProductFormState>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const loadProducts = async () => {
    const { data, error } = await supabase
      .from("products")
      .select(`
        *,
        categories(name),
        product_variants(*)
       `);
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

  // VARIANT CRUD
  const addVariant = () => {
    setForm((prev) => ({
      ...prev,
      variants: [
        ...prev.variants,
        {
          name: "",
          price: "",
          display_order: prev.variants.length + 1,
        },
      ],
    }));
  };

  const updateVariant = (
    index: number,
    field: keyof VariantFormState,
    value: string
  ) => {
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.map((v, i) =>
        i === index ? { ...v, [field]: value } : v
      ),
    }));
  };

  const removeVariant = (index: number) => {
    if (form.variants.length <= 1) {
      setErrorMessage("Un produit doit avoir au moins une variante");
      return;
    }

    setForm((prev) => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index),
    }));
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
    if (submitting) return; // évite les doubles clics / double soumission

    if (!form.name.trim()) {
      setErrorMessage("Le nom est obligatoire");
      return;
    }

    if (!form.category_id) {
      setErrorMessage("La catégorie est obligatoire");
      return;
    }

    if (form.variants.length === 0) {
      setErrorMessage("Ajoutez au moins une variante");
      return;
    }

    for (const v of form.variants) {
      if (!v.name.trim()) {
        setErrorMessage("Chaque variante doit avoir un nom");
        return;
      }

      if (Number(v.price) <= 0 || Number.isNaN(Number(v.price))) {
        setErrorMessage("Le prix doit être supérieur à 0");
        return;
      }
    }

    setSubmitting(true);

    try {
      let imageUrl = form.image_url;

      // On n'upload que si une image a été sélectionnée ET n'a pas déjà
      // été envoyée via le bouton "Confirmer l'envoi" (sinon double upload).
      if (selectedFile && !imageUrl) {
        setUploadingImage(true);
        imageUrl = await uploadProductImage(selectedFile, form.name);
        setUploadingImage(false);
      }

      // 1 - création produit
      const { data: product, error: productError } = await crudService.create(
        "products",
        {
          name: form.name.trim(),
          category_id: form.category_id,
          description: form.description,
          image_url: imageUrl,
          is_active: true,
        }
      );

      if (productError) throw productError;

      // crudService.create peut renvoyer soit un objet, soit un tableau
      // selon l'implémentation du service : on sécurise l'extraction de l'id.
      const createdProduct = Array.isArray(product) ? product[0] : product;
      if (!createdProduct?.id) {
        throw new Error("Le produit a été créé mais son identifiant est introuvable");
      }

      // 2 - création variantes
      const variants = form.variants.map((v) => ({
        product_id: createdProduct.id,
        name: v.name,
        price: Number(v.price),
        is_available: true,
      }));

      const { error: variantError } = await crudService.insertMany(
        "product_variants",
        variants
      );
      if (variantError) throw variantError;

      resetForm();
      await loadProducts();
    } catch (e) {
      setUploadingImage(false);
      setErrorMessage(`Erreur création produit: ${e} `);
    } finally {
      setSubmitting(false);
    }
  };

  const deleteProduct = async (id: number | string, name: string) => {
    const confirmed = window.confirm(
      `Supprimer définitivement "${name}" ? Cette action est irréversible.`
    );
    if (!confirmed) return;

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

    // Une nouvelle sélection invalide une éventuelle image déjà confirmée.
    setSelectedFile(file);
    setForm((prev) => ({ ...prev, image_url: "" }));

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
      const publicUrl = await uploadProductImage(selectedFile, form.name);
      setForm((prev) => ({ ...prev, image_url: publicUrl }));
      // On vide selectedFile pour éviter un ré-upload au submit, tout en
      // gardant l'aperçu visible (form.image_url pilote l'affichage confirmé).
      setSelectedFile(null);
      setErrorMessage(null);
    } catch (err) {
      console.error(err);
      setErrorMessage(
        err instanceof Error ? err.message : "Erreur lors de l'upload de l'image"
      );
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

              <div className="prod-field-full">
                <label className="prod-label">Variantes / Tailles</label>

                {form.variants.map((variant, index) => (
                  <div key={index} className="variant-row">
                    <input
                      className="prod-input"
                      placeholder="Nom (MM, GM...)"
                      value={variant.name}
                      onChange={(e) =>
                        updateVariant(index, "name", e.target.value)
                      }
                    />

                    <input
                      className="prod-input"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Prix"
                      value={variant.price}
                      onChange={(e) =>
                        updateVariant(index, "price", e.target.value)
                      }
                    />

                    <button
                      type="button"
                      className="prod-btn-danger"
                      onClick={() => removeVariant(index)}
                    >
                      X
                    </button>
                  </div>
                ))}

                <button type="button" className="prod-btn-ghost" onClick={addVariant}>
                  + Ajouter une variante
                </button>
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
                  <label className="prod-dropzone-label">
                    <p>
                      {uploadingImage
                        ? "Upload en cours…"
                        : "Glissez une image ici ou cliquez pour sélectionner"}
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      className="prod-dropzone-input"
                      onChange={(event) =>
                        handleImageSelection(event.target.files?.[0] ?? null)
                      }
                    />
                  </label>
                </div>
                {previewImage && !form.image_url && (
                  <div className="prod-image-preview-card">
                    <img
                      src={previewImage}
                      alt="Aperçu de l'image"
                      className="prod-image-preview"
                    />
                    <div className="prod-image-preview-info">
                      <span className="prod-image-confirmed">Aperçu prêt</span>
                      <p className="prod-uploaded-url">
                        Cette image sera envoyée après confirmation.
                      </p>
                      <button
                        type="button"
                        className="prod-btn-primary small"
                        onClick={handleConfirmUpload}
                        disabled={uploadingImage}
                      >
                        {uploadingImage ? "Envoi en cours…" : "Confirmer l'envoi"}
                      </button>
                    </div>
                  </div>
                )}
                {form.image_url && (
                  <div className="prod-image-preview-card">
                    <img
                      src={form.image_url}
                      alt="Image envoyée"
                      className="prod-image-preview"
                    />
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
              <button
                className="prod-btn-primary"
                onClick={addProduct}
                disabled={submitting}
              >
                {submitting ? "Enregistrement…" : "Enregistrer"}
              </button>
              <button
                type="button"
                className="prod-btn-ghost"
                onClick={resetForm}
                disabled={submitting}
              >
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
                    <div className="prod-card-price">
                      {product.product_variants?.map((v, i) => (
                        <div key={v.id ?? `${product.id}-${v.name}-${i}`}>
                          {v.name} : {v.price.toLocaleString()} Ar
                        </div>
                      ))}
                    </div>
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
                    onClick={() => deleteProduct(product.id, product.name)}
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