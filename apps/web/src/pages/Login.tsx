import { FormEvent, useState } from "react";
import { useAuth } from "../auth/AuthContext";

export function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("admin@demo.local");
  const [password, setPassword] = useState("Admin123!");
  const [error, setError] = useState("");

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Giris basarisiz");
    }
  }

  return (
    <main className="login-page">
      <form className="login-card" onSubmit={onSubmit}>
        <div className="login-brand">
          <span className="brand-mark">HK</span>
          <div>
            <strong>Harun Karaca</strong>
            <small>Muhasebe ve E-Donusum Platformu</small>
          </div>
        </div>
        <h1>Harun Karaca Muhasebe ve E-Donusum Paneli</h1>
        <p className="login-subtitle">Akaryakit istasyonlari icin muhasebe, e-donusum ve mali entegrasyon sureclerini yonetin.</p>
        <label>E-posta<input value={email} onChange={(event) => setEmail(event.target.value)} /></label>
        <label>Parola<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} /></label>
        {error && <p className="error">{error}</p>}
        <button>Giris yap</button>
        <p className="hint">Demo: admin@demo.local / Admin123!</p>
      </form>
    </main>
  );
}
