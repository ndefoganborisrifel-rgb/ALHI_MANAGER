"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2, Mail, Lock } from "lucide-react";
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

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Email ou mot de passe incorrect.");
      setIsLoading(false);
    } else {
      router.push(callbackUrl);
      router.refresh();
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* LEFT SIDE - Brand panel */}
      <div
        style={{
          display: "none",
          flex: "0 0 45%",
          background: "#B91C2F",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "48px 40px",
          position: "relative",
          overflow: "hidden",
        }}
        className="md-left-panel"
      >
        {/* Watermark ALHI text */}
        <div
          style={{
            position: "absolute",
            bottom: "-40px",
            right: "-20px",
            fontSize: "220px",
            fontWeight: "900",
            color: "rgba(255,255,255,0.06)",
            letterSpacing: "-8px",
            lineHeight: 1,
            userSelect: "none",
            pointerEvents: "none",
          }}
        >
          ALHI
        </div>
        {/* Geometric circles */}
        <div
          style={{
            position: "absolute",
            top: "-60px",
            left: "-60px",
            width: "240px",
            height: "240px",
            borderRadius: "50%",
            border: "40px solid rgba(255,255,255,0.05)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "80px",
            left: "40px",
            width: "120px",
            height: "120px",
            borderRadius: "50%",
            border: "20px solid rgba(255,255,255,0.06)",
            pointerEvents: "none",
          }}
        />

        {/* Center content */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative", zIndex: 1 }}>
          <div
            style={{
              width: "100px",
              height: "100px",
              borderRadius: "20px",
              background: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "28px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
              overflow: "hidden",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="ALHI" style={{ width: "88px", height: "88px", objectFit: "contain" }} />
          </div>
          <h1
            style={{
              color: "white",
              fontSize: "28px",
              fontWeight: "800",
              textAlign: "center",
              letterSpacing: "1px",
              textTransform: "uppercase",
              lineHeight: "1.2",
              marginBottom: "8px",
            }}
          >
            Africa Leadership
            <br />
            Higher Institute
          </h1>
          <p
            style={{
              color: "rgba(255,255,255,0.75)",
              fontSize: "14px",
              textAlign: "center",
              marginTop: "12px",
              fontStyle: "italic",
              letterSpacing: "0.3px",
            }}
          >
            Excellence et Leadership en Afrique Centrale
          </p>
          <div
            style={{
              width: "50px",
              height: "3px",
              background: "rgba(255,255,255,0.3)",
              borderRadius: "2px",
              marginTop: "24px",
            }}
          />
        </div>

        {/* Bottom address */}
        <div style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "12px", lineHeight: "1.7" }}>
            Chateau Ngoa Ekele, Yaounde, Cameroun
          </p>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "12px" }}>
            +237 657 75 54 87 / +237 676 25 85 13
          </p>
        </div>
      </div>

      {/* RIGHT SIDE - Login form */}
      <div
        style={{
          flex: 1,
          background: "white",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "40px 32px",
          minHeight: "100vh",
        }}
      >
        {/* Top logo (visible on mobile, subtle on desktop) */}
        <div style={{ width: "100%", maxWidth: "380px", textAlign: "center" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="ALHI" style={{ width: "32px", height: "32px" }} />
            <span style={{ fontWeight: "700", fontSize: "15px", color: "#1A1A1A" }}>SI-ALHI</span>
          </div>
        </div>

        {/* Form area */}
        <div style={{ width: "100%", maxWidth: "380px" }}>
          <div style={{ marginBottom: "32px" }}>
            <h1
              style={{
                fontSize: "30px",
                fontWeight: "800",
                color: "#1A1A1A",
                marginBottom: "6px",
              }}
            >
              Bienvenue
            </h1>
            <p style={{ fontSize: "14px", color: "#6b7280" }}>
              Connectez-vous a votre espace SI-ALHI
            </p>
          </div>

          {error && (
            <div
              style={{
                marginBottom: "20px",
                padding: "12px 16px",
                background: "#fef2f2",
                border: "1.5px solid #fecaca",
                borderRadius: "10px",
                fontSize: "13px",
                color: "#b91c1c",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span style={{ fontSize: "16px" }}>&#9888;</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div style={{ marginBottom: "18px" }}>
              <label
                htmlFor="email"
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: "600",
                  color: "#374151",
                  marginBottom: "6px",
                }}
              >
                Adresse email
              </label>
              <div style={{ position: "relative" }}>
                <Mail
                  style={{
                    position: "absolute",
                    left: "13px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: "16px",
                    height: "16px",
                    color: "#9ca3af",
                    pointerEvents: "none",
                  }}
                />
                <input
                  id="email"
                  type="email"
                  placeholder="votre@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  style={{
                    width: "100%",
                    padding: "12px 14px 12px 40px",
                    border: "1.5px solid #e5e7eb",
                    borderRadius: "10px",
                    fontSize: "14px",
                    color: "#1A1A1A",
                    outline: "none",
                    background: "#f9fafb",
                    boxSizing: "border-box",
                    transition: "border-color 0.15s, background 0.15s",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#B91C2F";
                    e.target.style.background = "white";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#e5e7eb";
                    e.target.style.background = "#f9fafb";
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: "8px" }}>
              <label
                htmlFor="password"
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: "600",
                  color: "#374151",
                  marginBottom: "6px",
                }}
              >
                Mot de passe
              </label>
              <div style={{ position: "relative" }}>
                <Lock
                  style={{
                    position: "absolute",
                    left: "13px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: "16px",
                    height: "16px",
                    color: "#9ca3af",
                    pointerEvents: "none",
                  }}
                />
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
                    padding: "12px 44px 12px 40px",
                    border: "1.5px solid #e5e7eb",
                    borderRadius: "10px",
                    fontSize: "14px",
                    color: "#1A1A1A",
                    outline: "none",
                    background: "#f9fafb",
                    boxSizing: "border-box",
                    transition: "border-color 0.15s, background 0.15s",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#B91C2F";
                    e.target.style.background = "white";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#e5e7eb";
                    e.target.style.background = "#f9fafb";
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#9ca3af",
                    padding: "2px",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  {showPassword ? <EyeOff style={{ width: "16px", height: "16px" }} /> : <Eye style={{ width: "16px", height: "16px" }} />}
                </button>
              </div>
            </div>

            {/* Forgot password link */}
            <div style={{ textAlign: "right", marginBottom: "24px" }}>
              <Link
                href="/mot-de-passe-oublie"
                style={{
                  fontSize: "12px",
                  color: "#B91C2F",
                  textDecoration: "none",
                  fontWeight: "500",
                }}
              >
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
                background: isLoading ? "#d1d5db" : "#B91C2F",
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
                transition: "background 0.15s, transform 0.1s",
                letterSpacing: "0.3px",
              }}
              onMouseEnter={(e) => {
                if (!isLoading) (e.currentTarget as HTMLButtonElement).style.background = "#9b1625";
              }}
              onMouseLeave={(e) => {
                if (!isLoading) (e.currentTarget as HTMLButtonElement).style.background = "#B91C2F";
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 style={{ width: "17px", height: "17px", animation: "spin 1s linear infinite" }} />
                  Connexion en cours...
                </>
              ) : (
                "Se connecter"
              )}
            </button>
          </form>
        </div>

        {/* Bottom contact */}
        <div style={{ width: "100%", maxWidth: "380px", textAlign: "center" }}>
          <p style={{ fontSize: "11px", color: "#9ca3af" }}>
            Chateau Ngoa Ekele, Yaounde, Cameroun
          </p>
          <p style={{ fontSize: "11px", color: "#9ca3af", marginTop: "2px" }}>
            +237 657 75 54 87 / +237 676 25 85 13
          </p>
          <p style={{ fontSize: "11px", color: "#d1d5db", marginTop: "8px" }}>
            02 ANS AU CAMEROUN &amp; 03 ANS EN FRANCE. PIGE
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @media (min-width: 768px) {
          .md-left-panel {
            display: flex !important;
          }
        }
      `}</style>
    </div>
  );
}
