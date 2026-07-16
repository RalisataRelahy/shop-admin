import { useRef, useState, type DragEvent } from "react";
import { Plus, Upload, X } from "lucide-react";
import { supabase } from "../../../../supabase/config";

export interface ComboFormState {
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  available: boolean;
}

interface AddComboPackPageProps {
  comboForm: ComboFormState;
  editingComboId: number | string | null;
  onChange: (form: ComboFormState) => void;
  onSubmit: (event: React.FormEvent) => void;
  onCancel: () => void;
}

const IMAGES_BUCKET = "shop_images";
const MAX_SIZE_MB = 5;

export default function AddComboPackPage({
  comboForm,
  editingComboId,
  onChange,
  onSubmit,
  onCancel,
}: AddComboPackPageProps) {
  const isEditing = editingComboId !== null;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const uploadFile = async (file: File) => {
    setUploadError(null);

    if (!file.type.startsWith("image/")) {
      setUploadError("Le fichier doit être une image.");
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setUploadError(`L'image ne doit pas dépasser ${MAX_SIZE_MB} Mo.`);
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadErr } = await supabase.storage
        .from(IMAGES_BUCKET)
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadErr) throw new Error(uploadErr.message);

      const { data } = supabase.storage.from(IMAGES_BUCKET).getPublicUrl(filePath);

      onChange({ ...comboForm, imageUrl: data.publicUrl });
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Échec de l'envoi de l'image");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) uploadFile(file);
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (!uploading) setIsDraggingOver(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDraggingOver(false);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDraggingOver(false);
    if (uploading) return;

    const file = event.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  };

  const handleRemoveImage = () => {
    onChange({ ...comboForm, imageUrl: "" });
    setUploadError(null);
  };

  return (
    <form className="card" onSubmit={onSubmit}>
      <div className="card-title">{isEditing ? "Modifier un pack" : "Créer un pack combo"}</div>
      <div className="card-subtitle">Configurez les informations du pack.</div>

      <div className="form-grid">
        <label className="field">
          <span>Nom du pack</span>
          <input
            value={comboForm.name}
            onChange={(event) => onChange({ ...comboForm, name: event.target.value })}
            placeholder="Ex : Family Box"
            required
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
          <span>Prix (Ar)</span>
          <input
            type="number"
            step="0.1"
            min={0}
            value={comboForm.price}
            onChange={(event) => onChange({ ...comboForm, price: Number(event.target.value) })}
            required
          />
        </label>

        <div className="field">
          <span>Image du pack</span>

          <div className="image-upload">
            {comboForm.imageUrl ? (
              <div className="image-preview">
                <img src={comboForm.imageUrl} alt="Aperçu du pack" />
                <button
                  type="button"
                  className="image-preview-remove"
                  onClick={handleRemoveImage}
                  aria-label="Retirer l'image"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div
                className={`image-dropzone ${isDraggingOver ? "image-dropzone-active" : ""}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !uploading && fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
              >
                <Upload size={18} />
                <span>
                  {uploading
                    ? "Envoi en cours..."
                    : "Glissez une image ici ou cliquez pour en choisir une"}
                </span>
                <span className="image-dropzone-hint">JPG, PNG... {MAX_SIZE_MB} Mo max</span>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelected}
              hidden
            />

            {comboForm.imageUrl && !uploading && (
              <button
                type="button"
                className="btn btn-secondary image-replace-btn"
                onClick={() => fileInputRef.current?.click()}
              >
                Changer l'image
              </button>
            )}
          </div>

          {uploadError && <p className="error-text">{uploadError}</p>}
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
        <button type="submit" className="btn btn-primary" disabled={uploading}>
          <Plus size={16} />
          {isEditing ? "Enregistrer" : "Créer"}
        </button>
        {isEditing ? (
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            Annuler
          </button>
        ) : null}
      </div>
    </form>
  );
}