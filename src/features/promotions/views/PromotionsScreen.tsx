import { useMemo, useState } from "react";
import { ImagePlus, Pencil, Plus, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { initialPromotions, type Promotion } from "../data/PromotionModels";
import "./PromotionsScreen.css";

const emptyForm = {
  title: "",
  description: "",
  discount: 0,
  code: "",
  imageUrl: "",
  active: true,
};

export default function PromotionsScreen() {
  const [promotions, setPromotions] = useState<Promotion[]>(initialPromotions);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);

  const stats = useMemo(() => {
    const active = promotions.filter((promotion) => promotion.active).length;
    return {
      total: promotions.length,
      active,
      inactive: promotions.length - active,
    };
  }, [promotions]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!form.title.trim() || !form.code.trim()) {
      return;
    }

    if (editingId !== null) {
      setPromotions((prev) =>
        prev.map((promotion) =>
          promotion.id === editingId
            ? {
                ...promotion,
                ...form,
                title: form.title.trim(),
                description: form.description.trim(),
                code: form.code.trim().toUpperCase(),
              }
            : promotion,
        ),
      );
    } else {
      const newPromotion: Promotion = {
        id: Date.now(),
        title: form.title.trim(),
        description: form.description.trim(),
        discount: Number(form.discount),
        code: form.code.trim().toUpperCase(),
        imageUrl: form.imageUrl.trim(),
        active: form.active,
      };
      setPromotions((prev) => [newPromotion, ...prev]);
    }

    setForm(emptyForm);
    setEditingId(null);
  };

  const handleEdit = (promotion: Promotion) => {
    setEditingId(promotion.id);
    setForm({
      title: promotion.title,
      description: promotion.description,
      discount: promotion.discount,
      code: promotion.code,
      imageUrl: promotion.imageUrl,
      active: promotion.active,
    });
  };

  const toggleActive = (id: number) => {
    setPromotions((prev) =>
      prev.map((promotion) => (promotion.id === id ? { ...promotion, active: !promotion.active } : promotion)),
    );
  };

  const handleDelete = (id: number) => {
    setPromotions((prev) => prev.filter((promotion) => promotion.id !== id));
    if (editingId === id) {
      setEditingId(null);
      setForm(emptyForm);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  return (
    <div className="promotions-page">
      <div className="promotions-header">
        <div>
          <h2 className="promotions-title">Gestion des promotions</h2>
          <p className="promotions-subtitle">Créez, modifiez, activez ou supprimez des offres pour votre app food.</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total</div>
          <div className="stat-value">{stats.total}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Actives</div>
          <div className="stat-value">{stats.active}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Désactivées</div>
          <div className="stat-value">{stats.inactive}</div>
        </div>
      </div>

      <div className="content-grid">
        <form className="card" onSubmit={handleSubmit}>
          <div className="card-title">{editingId ? "Modifier une promotion" : "Ajouter une promotion"}</div>
          <div className="card-subtitle">Ajoutez une image, un code promo et un statut actif ou non.</div>

          <div className="form-grid">
            <label className="field">
              <span>Nom de la promotion</span>
              <input
                value={form.title}
                onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                placeholder="Ex : Friday Feast"
              />
            </label>

            <label className="field">
              <span>Description</span>
              <textarea
                value={form.description}
                onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                rows={3}
                placeholder="Description de la promotion"
              />
            </label>

            <div className="inline-fields">
              <label className="field">
                <span>Remise (%)</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={form.discount}
                  onChange={(event) => setForm((prev) => ({ ...prev, discount: Number(event.target.value) }))}
                />
              </label>

              <label className="field">
                <span>Code promo</span>
                <input
                  value={form.code}
                  onChange={(event) => setForm((prev) => ({ ...prev, code: event.target.value }))}
                  placeholder="EX: FOOD20"
                />
              </label>
            </div>

            <label className="field">
              <span>Image URL</span>
              <input
                value={form.imageUrl}
                onChange={(event) => setForm((prev) => ({ ...prev, imageUrl: event.target.value }))}
                placeholder="https://..."
              />
            </label>

            <label className="toggle-row">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(event) => setForm((prev) => ({ ...prev, active: event.target.checked }))}
              />
              <span>Promotion active</span>
            </label>
          </div>

          <div className="actions">
            <button type="submit" className="btn btn-primary">
              <Plus size={16} />
              {editingId ? "Enregistrer" : "Ajouter"}
            </button>
            {editingId ? (
              <button type="button" className="btn btn-secondary" onClick={resetForm}>
                Annuler
              </button>
            ) : null}
          </div>
        </form>

        <div className="card">
          <div className="card-title">Liste des promotions</div>
          <div className="card-subtitle">Affichage horizontal avec image et état actif/inactif.</div>

          <div className="promotion-list">
            {promotions.map((promotion) => (
              <div className={`promotion-card ${promotion.active ? "" : "inactive"}`} key={promotion.id}>
                <img src={promotion.imageUrl || "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=80"} alt={promotion.title} className="promotion-image" />

                <div className="promotion-content">
                  <div className="promotion-top">
                    <h3>{promotion.title}</h3>
                    <span className={`status-pill ${promotion.active ? "active" : "inactive"}`}>
                      {promotion.active ? "Active" : "Désactivée"}
                    </span>
                  </div>

                  <p className="promotion-description">{promotion.description}</p>
                  <div className="promotion-meta">
                    <span>-{promotion.discount}%</span>
                    <span>{promotion.code}</span>
                  </div>

                  <div className="promotion-actions">
                    <button type="button" className="icon-btn" onClick={() => toggleActive(promotion.id)}>
                      {promotion.active ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                    </button>
                    <button type="button" className="icon-btn" onClick={() => handleEdit(promotion)}>
                      <Pencil size={16} />
                    </button>
                    <button type="button" className="icon-btn danger" onClick={() => handleDelete(promotion.id)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
