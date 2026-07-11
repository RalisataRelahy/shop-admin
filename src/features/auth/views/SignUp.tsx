import { type FormEvent, useState } from "react";
import { Eye, EyeOff, UserPlus } from "lucide-react";
import { supabase } from "../../../supabase/config";
import { useNavigate, Link } from "react-router-dom";
import "./login.css";

const MIN_PASSWORD_LENGTH = 6;

export default function SignUpPage() {
    const navigate = useNavigate();

    const [fullName, setFullName] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        const trimmedName = fullName.trim();
        const trimmedPhone = phone.trim();
        const trimmedEmail = email.trim();

        if (!trimmedName || !trimmedEmail) {
            setError("Veuillez renseigner votre nom et votre email.");
            return;
        }

        if (password.length < MIN_PASSWORD_LENGTH) {
            setError(`Le mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères.`);
            return;
        }

        if (password !== confirmPassword) {
            setError("Les mots de passe ne correspondent pas.");
            return;
        }

        setLoading(true);

        const { data, error: signUpError } = await supabase.auth.signUp({
            email: trimmedEmail,
            password,
        });

        if (signUpError) {
            setLoading(false);
            setError(signUpError.message);
            return;
        }

        if (!data.user) {
            setLoading(false);
            setError("Une erreur inattendue est survenue. Veuillez réessayer.");
            return;
        }

        // Le profil doit être créé dans tous les cas, que la session
        // soit disponible immédiatement (confirmation email désactivée)
        // ou non (confirmation email requise).
        const { error: profileError } = await supabase.from("profiles").insert({
            id: data.user.id,
            pseudo: trimmedName,
            phone: trimmedPhone,
            role: "admin",
        });
        setLoading(false);
        if (profileError) {
            setError(
                "Votre compte a été créé mais le profil n'a pas pu être enregistré : " +
                    profileError.message,
            );
            return;
        }

        if (!data.session) {
            // Confirmation email requise : pas de session tant que l'email
            // n'est pas confirmé.
            setSuccess(
                "Compte créé ! Vérifiez votre boîte mail pour confirmer votre adresse avant de vous connecter.",
            );
            setFullName("");
            setPhone("");
            setEmail("");
            setPassword("");
            setConfirmPassword("");
            return;
        }

        navigate("/dashboard");
    };

    return (
        <div className="login-page">
            <form className="login-card" onSubmit={handleSubmit}>
                <div className="login-brand">
                    <div className="login-brand-mark">Shop+</div>
                    <div>
                        <h1>Créer un compte</h1>
                        <p>Commencez à gérer votre restaurant.</p>
                    </div>
                </div>

                {error && <div className="error">{error}</div>}
                {success && <div className="success">{success}</div>}

                <input
                    type="text"
                    placeholder="Nom complet"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    disabled={loading}
                    required
                />

                <input
                    type="email"
                    placeholder="Adresse email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    required
                />

                <input
                    type="tel"
                    placeholder="Téléphone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={loading}
                />

                <div className="password">
                    <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Mot de passe"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        minLength={MIN_PASSWORD_LENGTH}
                        disabled={loading}
                        required
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                        disabled={loading}
                    >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>

                <div className="password">
                    <input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirmer le mot de passe"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        minLength={MIN_PASSWORD_LENGTH}
                        disabled={loading}
                        required
                    />
                    <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        aria-label={showConfirmPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                        disabled={loading}
                    >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>

                <button className="login-btn" disabled={loading} aria-busy={loading}>
                    {loading ? "Création..." : <><UserPlus size={18} />Créer mon compte</>}
                </button>

                <p className="auth-link">
                    Vous avez déjà un compte ? <Link to="/login">Se connecter</Link>
                </p>
            </form>
        </div>
    );
}