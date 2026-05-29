"use client";

import { useState } from "react";
import { KeyRound, Loader2, CheckCircle, Eye, EyeOff } from "lucide-react";

export function ChangePasswordForm() {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (newPwd.length < 8) { setError("Le mot de passe doit contenir au moins 8 caracteres."); return; }
    if (newPwd !== confirm) { setError("Les mots de passe ne correspondent pas."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword: newPwd }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur lors du changement.");
      setSuccess(true);
      setTimeout(() => { setOpen(false); setSuccess(false); setCurrent(""); setNewPwd(""); setConfirm(""); }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "7px 14px", border: "1.5px solid var(--border)", borderRadius: "8px", background: "var(--bg-card)", color: "var(--text)", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}
      >
        <KeyRound style={{ width: "14px", height: "14px" }} />
        Changer
      </button>
    );
  }

  return (
    <div style={{ background: "var(--bg-muted)", borderRadius: "10px", padding: "16px", border: "1px solid var(--border)" }}>
      {success ? (
        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#16a34a", fontWeight: "600", fontSize: "13px" }}>
          <CheckCircle style={{ width: "16px", height: "16px" }} />
          Mot de passe modifie avec succes !
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <p style={{ fontSize: "12px", fontWeight: "700", color: "var(--text)", marginBottom: "12px" }}>Modifier le mot de passe</p>
          {error && (
            <div style={{ marginBottom: "10px", padding: "8px 12px", background: "#B91C2F18", border: "1px solid #B91C2F40", borderRadius: "7px", fontSize: "12px", color: "#B91C2F" }}>
              {error}
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div>
              <label style={{ fontSize: "11px", fontWeight: "600", color: "var(--text-muted)", display: "block", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.4px" }}>Nouveau mot de passe</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showNew ? "text" : "password"}
                  value={newPwd}
                  onChange={(e) => setNewPwd(e.target.value)}
                  placeholder="Minimum 8 caracteres"
                  required
                  style={{ width: "100%", padding: "8px 36px 8px 12px", border: "1.5px solid var(--border)", borderRadius: "7px", fontSize: "13px", background: "var(--bg-card)", color: "var(--text)", outline: "none", boxSizing: "border-box" }}
                />
                <button type="button" onClick={() => setShowNew(!showNew)} style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
                  {showNew ? <EyeOff style={{ width: "14px", height: "14px" }} /> : <Eye style={{ width: "14px", height: "14px" }} />}
                </button>
              </div>
            </div>
            <div>
              <label style={{ fontSize: "11px", fontWeight: "600", color: "var(--text-muted)", display: "block", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.4px" }}>Confirmer le mot de passe</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repetez le mot de passe"
                required
                style={{ width: "100%", padding: "8px 12px", border: "1.5px solid var(--border)", borderRadius: "7px", fontSize: "13px", background: "var(--bg-card)", color: "var(--text)", outline: "none", boxSizing: "border-box" }}
              />
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px", marginTop: "14px" }}>
            <button
              type="submit"
              disabled={loading || !newPwd || !confirm}
              style={{ padding: "8px 16px", background: loading || !newPwd || !confirm ? "var(--bg-muted)" : "#B91C2F", color: loading || !newPwd || !confirm ? "var(--text-muted)" : "white", border: "none", borderRadius: "7px", fontSize: "13px", fontWeight: "700", cursor: loading || !newPwd || !confirm ? "not-allowed" : "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              {loading && <Loader2 style={{ width: "13px", height: "13px" }} className="animate-spin" />}
              {loading ? "Mise a jour..." : "Valider"}
            </button>
            <button
              type="button"
              onClick={() => { setOpen(false); setError(""); setCurrent(""); setNewPwd(""); setConfirm(""); }}
              style={{ padding: "8px 14px", border: "1.5px solid var(--border)", borderRadius: "7px", background: "var(--bg-card)", color: "var(--text)", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}
            >
              Annuler
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
