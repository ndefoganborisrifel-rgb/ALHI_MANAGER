"use client";
import { useState } from "react";
import Link from "next/link";
import { Loader2, ArrowLeft, Mail } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json() as { message?: string; error?: string };

      if (!res.ok && data.error) {
        setError(data.error);
      } else {
        setSuccess(true);
      }
    } catch {
      setError("Une erreur est survenue. Veuillez reessayer.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #1A1A1A 0%, #2d2d2d 50%, #111 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div style={{ width: "100%", maxWidth: "420px" }}>
        <div
          style={{
            background: "white",
            borderRadius: "16px",
            boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
            overflow: "hidden",
          }}
        >
          {/* Red header */}
          <div
            style={{
              background: "#B91C2F",
              padding: "28px 32px 24px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "12px",
                marginBottom: "8px",
              }}
            >
              <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "white", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.2)" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo.png" alt="ALHI" style={{ width: "34px", height: "34px", objectFit: "contain" }} />
              </div>
              <div style={{ textAlign: "left" }}>
                <div style={{ color: "white", fontWeight: "800", fontSize: "18px", letterSpacing: "0.5px" }}>
                  ALHI
                </div>
                <div style={{ color: "rgba(255,255,255,0.75)", fontSize: "10px", lineHeight: "1.3" }}>
                  Africa Leadership Higher Institute
                </div>
              </div>
            </div>
            <p style={{ color: "rgba(255,255,255,0.85)", fontSize: "12px", marginTop: "6px" }}>
              Systeme d&apos;Information SI-ALHI
            </p>
          </div>

          {/* Body */}
          <div style={{ padding: "32px" }}>
            {success ? (
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    width: "56px",
                    height: "56px",
                    background: "#f0fdf4",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 16px",
                  }}
                >
                  <Mail style={{ width: "24px", height: "24px", color: "#15803d" }} />
                </div>
                <h2
                  style={{
                    fontSize: "18px",
                    fontWeight: "700",
                    color: "#1A1A1A",
                    marginBottom: "12px",
                  }}
                >
                  Demande envoyee
                </h2>
                <p
                  style={{
                    fontSize: "13px",
                    color: "#555",
                    lineHeight: "1.6",
                    marginBottom: "20px",
                  }}
                >
                  Si un compte existe pour cet email, l&apos;administrateur systeme a ete notifie.
                  Contactez l&apos;administration au{" "}
                  <strong style={{ color: "#1A1A1A" }}>+237 657 75 54 87</strong>{" "}
                  pour obtenir votre nouveau mot de passe.
                </p>
                <Link
                  href="/login"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    color: "#B91C2F",
                    fontSize: "13px",
                    fontWeight: "600",
                    textDecoration: "none",
                  }}
                >
                  <ArrowLeft style={{ width: "14px", height: "14px" }} />
                  Retour a la connexion
                </Link>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: "24px" }}>
                  <h1
                    style={{
                      fontSize: "20px",
                      fontWeight: "700",
                      color: "#1A1A1A",
                      marginBottom: "6px",
                    }}
                  >
                    Mot de passe oublie ?
                  </h1>
                  <p style={{ fontSize: "13px", color: "#666", lineHeight: "1.5" }}>
                    Entrez votre adresse email et un administrateur sera notifie pour reinitialiser votre mot de passe.
                  </p>
                </div>

                {error && (
                  <div
                    style={{
                      marginBottom: "16px",
                      padding: "10px 14px",
                      background: "#fef2f2",
                      border: "1px solid #fecaca",
                      borderRadius: "8px",
                      fontSize: "13px",
                      color: "#b91c1c",
                    }}
                  >
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div style={{ marginBottom: "20px" }}>
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
                          left: "12px",
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
                          padding: "10px 14px 10px 38px",
                          border: "1.5px solid #d1d5db",
                          borderRadius: "8px",
                          fontSize: "14px",
                          color: "#1A1A1A",
                          outline: "none",
                          transition: "border-color 0.15s",
                          boxSizing: "border-box",
                        }}
                        onFocus={(e) => (e.target.style.borderColor = "#B91C2F")}
                        onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    style={{
                      width: "100%",
                      padding: "11px",
                      background: isLoading ? "#e5e7eb" : "#B91C2F",
                      color: isLoading ? "#9ca3af" : "white",
                      border: "none",
                      borderRadius: "8px",
                      fontSize: "14px",
                      fontWeight: "700",
                      cursor: isLoading ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      transition: "background 0.15s",
                    }}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 style={{ width: "16px", height: "16px", animation: "spin 1s linear infinite" }} />
                        Envoi en cours...
                      </>
                    ) : (
                      "Envoyer"
                    )}
                  </button>
                </form>

                <div style={{ marginTop: "20px", textAlign: "center" }}>
                  <Link
                    href="/login"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                      color: "#6b7280",
                      fontSize: "13px",
                      textDecoration: "none",
                    }}
                  >
                    <ArrowLeft style={{ width: "13px", height: "13px" }} />
                    Retour a la connexion
                  </Link>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div
            style={{
              padding: "12px 32px 20px",
              textAlign: "center",
            }}
          >
            <p style={{ fontSize: "11px", color: "#9ca3af" }}>
              Chateau Ngoa Ekele, Yaounde, Cameroun
            </p>
            <p style={{ fontSize: "11px", color: "#9ca3af", marginTop: "2px" }}>
              +237 657 75 54 87 / +237 676 25 85 13
            </p>
          </div>
        </div>

        <p style={{ textAlign: "center", color: "#6b7280", fontSize: "11px", marginTop: "16px" }}>
          02 ANS AU CAMEROUN &amp; 03 ANS EN FRANCE. PIGE
        </p>

        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}
