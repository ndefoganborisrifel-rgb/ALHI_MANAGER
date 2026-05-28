"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2, Globe, Mail, Lock } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    const result = await signIn("credentials", { email, password, redirect: false });
    if (result?.error) {
      setError("Email ou mot de passe incorrect.");
      setIsLoading(false);
    } else {
      router.push(callbackUrl);
      router.refresh();
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", fontFamily: "'Inter',system-ui,-apple-system,sans-serif", background: "#FAF8F4" }}>
      {/* LEFT BRAND PANEL */}
      <div className="login-brand-panel" style={{
        flex: "1 1 50%",
        backgroundImage: "url('/imagelogin.jpeg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        display: "flex",
        flexDirection: "column",
        padding: "32px 40px",
        position: "relative",
        overflow: "hidden",
        color: "white",
      }}>
        {/* Dark + red overlay for readability */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(160deg, rgba(140,15,30,0.82) 0%, rgba(30,10,10,0.75) 100%)", zIndex: 1 }} />

        {/* Top: SI-ALHI badge */}
        <div style={{ position: "relative", zIndex: 2, display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ height: "26px", width: "73px", borderRadius: "6px", background: "white", display: "flex", alignItems: "center", justifyContent: "center", padding: "3px 4px" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="ALI" style={{ width: "65px", height: "20px", objectFit: "contain" }} />
          </div>
          <span style={{ fontSize: "13px", fontWeight: "700", letterSpacing: "1.5px", textTransform: "uppercase", color: "rgba(255,255,255,0.95)" }}>SI-ALHI</span>
        </div>

        {/* Center logo card */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative", zIndex: 2, gap: "20px" }}>
          {/* Glass logo card */}
          <div style={{
            background: "rgba(255,255,255,0.12)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            border: "1px solid rgba(255,255,255,0.22)",
            borderRadius: "18px",
            padding: "24px 30px 20px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "14px",
            minWidth: "260px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.18)",
          }}>
            {/* Real ALI logo — white background rectangle, horizontal */}
            <div style={{
              width: "190px",
              height: "68px",
              borderRadius: "10px",
              background: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "6px",
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="ALI" style={{ width: "178px", height: "64px", objectFit: "contain" }} />
            </div>
          </div>

          {/* Divider line */}
          <div style={{ width: "60px", height: "1px", background: "rgba(255,255,255,0.35)" }} />

          {/* Tagline */}
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.92)", fontWeight: "500", marginBottom: "4px" }}>
              Systeme d&apos;Information Academique
            </p>
            <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.7)", fontStyle: "italic" }}>
              Excellence et Leadership in Afrique Centrale
            </p>
          </div>
        </div>

        {/* Bottom: location */}
        <div style={{ position: "relative", zIndex: 2, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "6px" }}>
          <Globe style={{ width: "13px", height: "13px", color: "rgba(255,255,255,0.7)" }} />
          <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.75)" }}>Yaounde, Cameroun</span>
        </div>

      </div>

      {/* RIGHT FORM PANEL */}
      <div style={{
        flex: "1 1 50%",
        background: "#FAF8F4",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 32px",
        minHeight: "100vh",
        position: "relative",
      }}>
        {/* Mobile logo */}
        <div className="login-mobile-logo" style={{ marginBottom: "28px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
          <div style={{ height: "48px", width: "134px", borderRadius: "10px", background: "white", border: "1.5px solid #B91C2F", display: "flex", alignItems: "center", justifyContent: "center", padding: "4px 8px" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="ALI" style={{ width: "118px", height: "42px", objectFit: "contain" }} />
          </div>
          <div>
            <p style={{ fontSize: "13px", fontWeight: "800", color: "#B91C2F", textTransform: "uppercase", letterSpacing: "0.5px" }}>Africa Leadership Higher Institute</p>
          </div>
        </div>

        <div style={{ width: "100%", maxWidth: "420px" }}>
          {/* Heading */}
          <div style={{ marginBottom: "32px" }}>
            <h1 style={{ fontSize: "30px", fontWeight: "800", color: "#1A1A1A", marginBottom: "6px", letterSpacing: "-0.5px" }}>
              Bienvenue
            </h1>
            <p style={{ fontSize: "14px", color: "#4b5563" }}>
              Connectez-vous a votre espace SI-ALHI
            </p>
          </div>

          {error && (
            <div style={{ marginBottom: "20px", padding: "13px 16px", background: "#fef2f2", border: "1.5px solid #fecaca", borderRadius: "10px", fontSize: "13.5px", color: "#b91c1c", display: "flex", alignItems: "center", gap: "10px" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#b91c1c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div style={{ marginBottom: "18px" }}>
              <label htmlFor="email" style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "8px" }}>
                Adresse email
              </label>
              <div style={{ position: "relative" }}>
                <Mail style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", width: "16px", height: "16px", color: "#9ca3af", pointerEvents: "none" }} />
                <input
                  id="email"
                  type="email"
                  placeholder="votre@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="login-input"
                  style={{ width: "100%", padding: "13px 14px 13px 42px", border: "1.5px solid #B91C2F", borderRadius: "10px", fontSize: "14px", color: "#111827", outline: "none", background: "#ffffff", boxSizing: "border-box", transition: "border-color 0.15s, box-shadow 0.15s" }}
                  onFocus={(e) => { e.target.style.boxShadow = "0 0 0 3px rgba(185,28,47,0.10)"; }}
                  onBlur={(e) => { e.target.style.boxShadow = "none"; }}
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: "8px" }}>
              <label htmlFor="password" style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "8px" }}>
                Mot de passe
              </label>
              <div style={{ position: "relative" }}>
                <Lock style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", width: "16px", height: "16px", color: "#9ca3af", pointerEvents: "none" }} />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  style={{ width: "100%", padding: "13px 46px 13px 42px", border: "1.5px solid #E5E1D8", borderRadius: "10px", fontSize: "14px", color: "#111827", outline: "none", background: "#F4F0E8", boxSizing: "border-box", transition: "border-color 0.15s, box-shadow 0.15s" }}
                  onFocus={(e) => { e.target.style.borderColor = "#B91C2F"; e.target.style.background = "#ffffff"; e.target.style.boxShadow = "0 0 0 3px rgba(185,28,47,0.10)"; }}
                  onBlur={(e) => { e.target.style.borderColor = "#E5E1D8"; e.target.style.background = "#F4F0E8"; e.target.style.boxShadow = "none"; }}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: "4px", display: "flex", alignItems: "center" }}>
                  {showPassword ? <EyeOff style={{ width: "16px", height: "16px" }} /> : <Eye style={{ width: "16px", height: "16px" }} />}
                </button>
              </div>
            </div>

            {/* Forgot password */}
            <div style={{ textAlign: "right", marginBottom: "24px" }}>
              <Link href="/mot-de-passe-oublie" style={{ fontSize: "13px", color: "#B91C2F", textDecoration: "none", fontWeight: "500" }}>
                Mot de passe oublie ?
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              style={{ width: "100%", padding: "14px", background: isLoading ? "#d1d5db" : "#B91C2F", color: "white", border: "none", borderRadius: "10px", fontSize: "15px", fontWeight: "700", cursor: isLoading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", transition: "opacity 0.15s, transform 0.1s", letterSpacing: "0.3px", boxShadow: isLoading ? "none" : "0 4px 14px rgba(185,28,47,0.30)" }}
              onMouseEnter={(e) => { if (!isLoading) { (e.currentTarget as HTMLButtonElement).style.background = "#9b1727"; } }}
              onMouseLeave={(e) => { if (!isLoading) { (e.currentTarget as HTMLButtonElement).style.background = "#B91C2F"; } }}
            >
              {isLoading ? (
                <><Loader2 style={{ width: "17px", height: "17px", animation: "spin 1s linear infinite" }} />Connexion en cours...</>
              ) : "Se connecter"}
            </button>
          </form>

          {/* Divider with school name */}
          <div style={{ margin: "32px 0 20px", display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ flex: 1, height: "1px", background: "#D6D0C2" }} />
            <span style={{ fontSize: "10.5px", color: "#6b7280", whiteSpace: "nowrap", fontWeight: "600", letterSpacing: "1.5px" }}>AFRICA LEADERSHIP HIGHER INSTITUTE</span>
            <div style={{ flex: 1, height: "1px", background: "#D6D0C2" }} />
          </div>

          {/* Contact info */}
          <div style={{ textAlign: "center", marginBottom: "22px" }}>
            <p style={{ fontSize: "12px", color: "#6b7280", lineHeight: "1.8" }}>
              Chateau Ngoa Ekele, Yaounde, Cameroun<br />
              +237 657 75 54 87 / +237 678 25 25 13
            </p>
          </div>

          {/* Flag + tagline */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
            <svg width="22" height="16" viewBox="0 0 60 40" style={{ borderRadius: "2px", flexShrink: 0 }}>
              <rect x="0" y="0" width="20" height="40" fill="#007A5E" />
              <rect x="20" y="0" width="20" height="40" fill="#CE1126" />
              <rect x="40" y="0" width="20" height="40" fill="#FCD116" />
              <polygon points="30,15 32,21 38,21 33,25 35,31 30,27 25,31 27,25 22,21 28,21" fill="#FCD116" />
            </svg>
            <span style={{ fontSize: "13px", color: "#1A1A1A", fontStyle: "italic", fontFamily: "'Georgia',serif" }}>
              Excellence and Leadership in Central Africa
            </span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .login-brand-panel { display: none !important; }
        .login-mobile-logo { display: flex !important; }
        @media (min-width: 768px) {
          .login-brand-panel { display: flex !important; }
          .login-mobile-logo { display: none !important; }
        }
      `}</style>
    </div>
  );
}
