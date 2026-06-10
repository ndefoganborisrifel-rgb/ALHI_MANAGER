"use client";

import { useState } from "react";
import { Calculator, CheckCircle, AlertTriangle, Loader2 } from "lucide-react";

export function RecomputeGradesButton() {
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [result, setResult] = useState<{ updated: number; total: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  async function run() {
    if (!confirm("Recalculer toutes les notes finales avec la formule actuelle (CC 50% + Examen 50%) ? Les notes saisies avant le changement seront mises à jour.")) return;
    setStatus("loading");
    setResult(null);
    setErrorMsg("");
    try {
      const res = await fetch("/api/grades/recompute", { method: "POST" });
      const raw = await res.text();
      let data: { error?: string; updated?: number; total?: number } = {};
      if (raw) {
        try { data = JSON.parse(raw); }
        catch { throw new Error(`Réponse serveur invalide (code ${res.status}). Réessayez ou rechargez la page.`); }
      }
      if (!res.ok) throw new Error(data.error ?? `Erreur serveur (code ${res.status})`);
      setResult({ updated: data.updated ?? 0, total: data.total ?? 0 });
      setStatus("done");
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Erreur inconnue");
      setStatus("error");
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
        <div>
          <p style={{ fontSize: "13px", fontWeight: "600", color: "var(--text)", marginBottom: "2px" }}>
            Recalculer les notes finales
          </p>
          <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>
            Applique la formule actuelle (CC 50% + Examen 50%) à toutes les notes déjà saisies. À lancer après un changement de formule.
          </p>
        </div>
        <button
          onClick={run}
          disabled={status === "loading" || status === "done"}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "8px 16px",
            background: status === "done" ? "#16a34a" : status === "loading" ? "var(--bg-muted)" : "#B91C2F",
            color: status === "loading" ? "var(--text-muted)" : "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "12px",
            fontWeight: "700",
            cursor: status === "loading" || status === "done" ? "not-allowed" : "pointer",
            flexShrink: 0,
          }}
        >
          {status === "loading" && <Loader2 style={{ width: "13px", height: "13px" }} className="animate-spin" />}
          {status === "done" && <CheckCircle style={{ width: "13px", height: "13px" }} />}
          {status === "idle" && <Calculator style={{ width: "13px", height: "13px" }} />}
          {status === "loading" ? "Recalcul en cours..." : status === "done" ? "Recalcul effectué" : "Recalculer les notes"}
        </button>
      </div>

      {status === "done" && result && (
        <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 14px", background: "#16a34a18", border: "1px solid #16a34a40", borderRadius: "8px", fontSize: "12px", color: "#16a34a" }}>
          <CheckCircle style={{ width: "14px", height: "14px", flexShrink: 0 }} />
          <span>
            <strong>{result.updated}</strong> note{result.updated !== 1 ? "s" : ""} mise{result.updated !== 1 ? "s" : ""} à jour sur <strong>{result.total}</strong>.
          </span>
        </div>
      )}

      {status === "error" && (
        <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 14px", background: "#B91C2F18", border: "1px solid #B91C2F40", borderRadius: "8px", fontSize: "12px", color: "#B91C2F" }}>
          <AlertTriangle style={{ width: "14px", height: "14px", flexShrink: 0 }} />
          {errorMsg}
        </div>
      )}
    </div>
  );
}
