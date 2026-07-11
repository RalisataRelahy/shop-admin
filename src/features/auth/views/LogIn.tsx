import { type FormEvent, useState } from "react";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { supabase } from "../../../supabase/config";
import { useNavigate, Link } from "react-router-dom";
import "./login.css";

export default function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const login = async (e: FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    navigate("/dashboard");
  };

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={login}>
        <div className="login-brand">
          <div className="login-brand-mark">Shop+</div>
          <div>
            <h1>Connexion</h1>
            <p>Accédez à votre tableau de bord.</p>
          </div>
        </div>

        {error && <div className="error">{error}</div>}

        <input
          type="email"
          placeholder="Adresse email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <div className="password">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="button" onClick={() => setShowPassword(!showPassword)}>
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        <button className="login-btn" disabled={loading}>
          {loading ? "Connexion..." : <><LogIn size={18} />Se connecter</>}
        </button>

        <p className="auth-link">
          Pas encore de compte ? <Link to="/signup">Créer un compte</Link>
        </p>
      </form>
    </div>
  );
}