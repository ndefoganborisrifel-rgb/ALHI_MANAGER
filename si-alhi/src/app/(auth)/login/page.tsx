"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";

function ALHILogo({ size = 80 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 280 100"
      width={size * 2.8}
      height={size}
      style={{ display: "block" }}
    >
      <g opacity="0.55" fill="#ffffff">
        <path d="M95 8 C98 8 104 10 108 14 C112 18 114 22 115 27 C116 32 114 37 112 40 C110 43 111 47 110 51 C109 55 107 60 105 64 C103 68 101 72 98 75 C95 78 92 80 89 80 C86 80 83 79 81 77 C79 75 79 72 80 69 C81 66 80 63 79 60 C78 57 76 54 75 51 C74 48 74 44 73 41 C72 38 70 35 69 32 C68 29 68 25 69 22 C70 19 72 16 75 13 C78 10 82 8 86 8 C89 8 92 8 95 8Z" />
      </g>
      <text x="14" y="72" fontFamily="Arial Black,Arial,sans-serif" fontSize="62" fontWeight="900" fill="white" letterSpacing="-2">a</text>
      <text x="54" y="72" fontFamily="Arial Black,Arial,sans-serif" fontSize="62" fontWeight="900" fill="white" letterSpacing="-2">l</text>
      <text x="72" y="72" fontFamily="Arial Black,Arial,sans-serif" fontSize="62" fontWeight="900" fill="white" letterSpacing="-2">i</text>
      <circle cx="82" cy="14" r="7" fill="white" />
      <line x1="120" y1="15" x2="120" y2="85" stroke="rgba(255,255,255,0.4)" strokeWidth="2" />
      <text x="132" y="38" fontFamily="Arial Black,Arial,sans-serif" fontSize="18" fontWeight="900" fill="white" letterSpacing="1">AFRICA</text>
      <text x="132" y="60" fontFamily="Arial Black,Arial,sans-serif" fontSize="18" fontWeight="900" fill="white" letterSpacing="1">LEADERSHIP</text>
      <text x="132" y="80" fontFamily="Arial Black,Arial,sans-serif" fontSize="13" fontWeight="700" fill="rgba(255,255,255,0.75)" letterSpacing="2">HIGHER INSTITUTE</text>
    </svg>
  );
}

function ALHILogoSmall() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 100" width="120" height="43" style={{ display: "block" }}>
      <g opacity="0.55" fill="#B91C2F">
        <path d="M95 8 C98 8 104 10 108 14 C112 18 114 22 115 27 C116 32 114 37 112 40 C110 43 111 47 110 51 C109 55 107 60 105 64 C103 68 101 72 98 75 C95 78 92 80 89 80 C86 80 83 79 81 77 C79 75 79 72 80 69 C81 66 80 63 79 60 C78 57 76 54 75 51 C74 48 74 44 73 41 C72 38 70 35 69 32 C68 29 68 25 69 22 C70 19 72 16 75 13 C78 10 82 8 86 8 C89 8 92 8 95 8Z" />
      </g>
      <text x="14" y="72" fontFamily="Arial Black,Arial,sans-serif" fontSize="62" fontWeight="900" fill="#B91C2F" letterSpacing="-2">a</text>
      <text x="54" y="72" fontFamily="Arial Black,Arial,sans-serif" fontSize="62" fontWeight="900" fill="#B91C2F" letterSpacing="-2">l</text>
      <text x="72" y="72" fontFamily="Arial Black,Arial,sans-serif" fontSize="62" fontWeight="900" fill="#B91C2F" letterSpacing="-2">i</text>
      <circle cx="82" cy="14" r="7" fill="#B91C2F" />
      <line x1="120" y1="15" x2="120" y2="85" stroke="#d1d5db" strokeWidth="2" />
      <text x="132" y="38" fontFamily="Arial Black,Arial,sans-serif" fontSize="18" fontWeight="900" fill="#1A1A1A" letterSpacing="1">AFRICA</text>
      <text x="132" y="60" fontFamily="Arial Black,Arial,sans-serif" fontSize="18" fontWeight="900" fill="#1A1A1A" letterSpacing="1">LEADERSHIP</text>
      <text x="132" y="80" fontFamily="Arial Black,Arial,sans-serif" fontSize="13" fontWeight="700" fill="#555555" letterSpacing="2">HIGHER INSTITUTE</text>
    </svg>
  );
}

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
    <div style={{ minHeight: "100vh", display: "flex", fontFamily: "'Inter',system-ui,-apple-system,sans-serif" }}>
      {/* LEFT - Brand panel */}
      <div className="login-brand-panel" style={{
        flex: "0 0 42%",
        background: "linear-gradient(145deg, #B91C2F 0%, #8B1222 60%, #6B0D1A 100%)",
        display: "flex",
        flexDirection: "column",
        padding: "48px 44px",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Decorative circles */}
        <div style={{ position: "absolute", top: "-80px", right: "-80px", width: "300px", height: "300px", borderRadius: "50%", border: "50px solid rgba(255,255,255,0.04)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "-60px", left: "-60px", width: "240px", height: "240px", borderRadius: "50%", border: "40px solid rgba(255,255,255,0.05)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: "40%", left: "50%", transform: "translate(-50%,-50%)", width: "500px", height: "500px", borderRadius: "50%", background: "radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />
        {/* ALHI watermark */}
        <div style={{ position: "absolute", bottom: "-20px", right: "-10px", fontSize: "180px", fontWeight: "900", color: "rgba(255,255,255,0.04)", letterSpacing: "-8px", lineHeight: 1, userSelect: "none", pointerEvents: "none", fontFamily: "Arial Black,Arial,sans-serif" }}>ALHI</div>

        {/* Top: small logo */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "white", fontWeight: "900", fontSize: "14px", fontFamily: "Arial Black,Arial,sans-serif" }}>ali</span>
            </div>
            <span style={{ color: "rgba(255,255,255,0.9)", fontSize: "13px", fontWeight: "600", letterSpacing: "1px", textTransform: "uppercase" }}>SI-ALHI</span>
          </div>
        </div>

        {/* Center: main logo + tagline */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative", zIndex: 1 }}>
          <div style={{ marginBottom: "32px", background: "rgba(255,255,255,0.1)", borderRadius: "20px", padding: "20px 28px", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.15)" }}>
            <ALHILogo size={56} />
          </div>
          <div style={{ width: "40px", height: "2px", background: "rgba(255,255,255,0.3)", borderRadius: "1px", marginBottom: "20px" }} />
          <p style={{ color: "rgba(255,255,255,0.85)", fontSize: "15px", textAlign: "center", lineHeight: "1.6", maxWidth: "240px" }}>
            Systeme d&apos;Information<br />Africa Leadership Higher Institute
          </p>
          <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "12px", textAlign: "center", marginTop: "10px", fontStyle: "italic" }}>
            Excellence et Leadership en Afrique Centrale
          </p>
        </div>

        {/* Bottom: contact */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ width: "32px", height: "2px", background: "rgba(255,255,255,0.2)", borderRadius: "1px", marginBottom: "14px" }} />
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "11.5px", lineHeight: "1.8" }}>
            Chateau Ngoa Ekele, Yaounde, Cameroun
          </p>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "11.5px" }}>
            +237 657 75 54 87 / +237 676 25 85 13
          </p>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "11px", marginTop: "6px" }}>
            02 ANS AU CAMEROUN, 03 ANS EN FRANCE. PIGE
          </p>
        </div>
      </div>

      {/* RIGHT - Form */}
      <div style={{
        flex: 1,
        background: "var(--bg-card, #ffffff)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 32px",
        minHeight: "100vh",
        position: "relative",
      }}>
        {/* Mobile logo (hidden on desktop) */}
        <div className="login-mobile-logo" style={{ marginBottom: "32px", textAlign: "center" }}>
          <ALHILogoSmall />
        </div>

        <div style={{ width: "100%", maxWidth: "400px" }}>
          {/* Header */}
          <div style={{ marginBottom: "36px" }}>
            <h1 style={{ fontSize: "28px", fontWeight: "800", color: "var(--text, #111827)", marginBottom: "6px", letterSpacing: "-0.5px" }}>
              Bienvenue
            </h1>
            <p style={{ fontSize: "14px", color: "var(--text-secondary, #4b5563)" }}>
              Connectez-vous a votre espace SI-ALHI
            </p>
          </div>

          {/* Error banner */}
          {error && (
            <div style={{
              marginBottom: "20px",
              padding: "13px 16px",
              background: "#fef2f2",
              border: "1.5px solid #fecaca",
              borderRadius: "10px",
              fontSize: "13.5px",
              color: "#b91c1c",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#b91c1c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div style={{ marginBottom: "20px" }}>
              <label htmlFor="email" style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "var(--text-secondary, #374151)", marginBottom: "7px" }}>
                Adresse email
              </label>
              <div style={{ position: "relative" }}>
                <svg style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
                <input
                  id="email"
                  type="email"
                  placeholder="votre@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="login-input"
                  style={{
                    width: "100%",
                    padding: "12px 14px 12px 42px",
                    border: "1.5px solid var(--border, #e5e7eb)",
                    borderRadius: "10px",
                    fontSize: "14px",
                    color: "var(--text, #111827)",
                    outline: "none",
                    background: "var(--bg-muted, #f9fafb)",
                    boxSizing: "border-box",
                    transition: "border-color 0.15s, background 0.15s, box-shadow 0.15s",
                  }}
                  onFocus={(e) => { e.target.style.borderColor = "#B91C2F"; e.target.style.background = "var(--bg-card,#fff)"; e.target.style.boxShadow = "0 0 0 3px rgba(185,28,47,0.08)"; }}
                  onBlur={(e) => { e.target.style.borderColor = "var(--border,#e5e7eb)"; e.target.style.background = "var(--bg-muted,#f9fafb)"; e.target.style.boxShadow = "none"; }}
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: "10px" }}>
              <label htmlFor="password" style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "var(--text-secondary, #374151)", marginBottom: "7px" }}>
                Mot de passe
              </label>
              <div style={{ position: "relative" }}>
                <svg style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  style={{
                    width: "100%",
                    padding: "12px 46px 12px 42px",
                    border: "1.5px solid var(--border, #e5e7eb)",
                    borderRadius: "10px",
                    fontSize: "14px",
                    color: "var(--text, #111827)",
                    outline: "none",
                    background: "var(--bg-muted, #f9fafb)",
                    boxSizing: "border-box",
                    transition: "border-color 0.15s, background 0.15s, box-shadow 0.15s",
                  }}
                  onFocus={(e) => { e.target.style.borderColor = "#B91C2F"; e.target.style.background = "var(--bg-card,#fff)"; e.target.style.boxShadow = "0 0 0 3px rgba(185,28,47,0.08)"; }}
                  onBlur={(e) => { e.target.style.borderColor = "var(--border,#e5e7eb)"; e.target.style.background = "var(--bg-muted,#f9fafb)"; e.target.style.boxShadow = "none"; }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: "4px", display: "flex", alignItems: "center" }}
                >
                  {showPassword
                    ? <EyeOff style={{ width: "16px", height: "16px" }} />
                    : <Eye style={{ width: "16px", height: "16px" }} />}
                </button>
              </div>
            </div>

            {/* Forgot password */}
            <div style={{ textAlign: "right", marginBottom: "28px" }}>
              <Link href="/mot-de-passe-oublie" style={{ fontSize: "12.5px", color: "#B91C2F", textDecoration: "none", fontWeight: "500" }}>
                Mot de passe oublie ?
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: "100%",
                padding: "13px",
                background: isLoading ? "#d1d5db" : "linear-gradient(135deg, #B91C2F 0%, #8B1222 100%)",
                color: "white",
                border: "none",
                borderRadius: "10px",
                fontSize: "15px",
                fontWeight: "700",
                cursor: isLoading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                transition: "opacity 0.15s, transform 0.1s",
                letterSpacing: "0.3px",
                boxShadow: isLoading ? "none" : "0 4px 14px rgba(185,28,47,0.35)",
              }}
              onMouseEnter={(e) => { if (!isLoading) { (e.currentTarget as HTMLButtonElement).style.opacity = "0.92"; (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)"; } }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)"; }}
            >
              {isLoading ? (
                <>
                  <Loader2 style={{ width: "17px", height: "17px", animation: "spin 1s linear infinite" }} />
                  Connexion en cours...
                </>
              ) : "Se connecter"}
            </button>
          </form>

          {/* Divider */}
          <div style={{ margin: "28px 0", display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ flex: 1, height: "1px", background: "var(--border, #e5e7eb)" }} />
            <span style={{ fontSize: "11px", color: "var(--text-muted, #9ca3af)", whiteSpace: "nowrap" }}>AFRICA LEADERSHIP HIGHER INSTITUTE</span>
            <div style={{ flex: 1, height: "1px", background: "var(--border, #e5e7eb)" }} />
          </div>

          {/* Bottom info */}
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: "11.5px", color: "var(--text-muted, #9ca3af)", lineHeight: "1.8" }}>
              Chateau Ngoa Ekele, Yaounde, Cameroun<br />
              +237 657 75 54 87 / +237 676 25 85 13
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .login-brand-panel { display: none !important; }
        .login-mobile-logo { display: block; }
        @media (min-width: 768px) {
          .login-brand-panel { display: flex !important; }
          .login-mobile-logo { display: none !important; }
        }
        html.dark .login-input::placeholder { color: #6b7280; }
      `}</style>
    </div>
  );
}
