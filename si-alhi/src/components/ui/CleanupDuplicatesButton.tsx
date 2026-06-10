"use client";

import { useState } from "react";
import { Trash2, CheckCircle, AlertTriangle, Loader2 } from "lucide-react";

export function CleanupDuplicatesButton() {
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [result, setResult] = useState<{ deleted: number; groupsAffected: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  async function run() {
    if (!confirm("Supprimer tous les créneaux dupliqués ? Cette opération est irréversible. Les créneaux les plus complets seront conservés.")) return;
    setStatus("loading");
    setResult(null);
    setErrorMsg("");
    try {
      const res = await fetch("/api/schedules/cleanup-duplicates", { method: "POST" });
      // Lire le texte d abord pour eviter "unexpected end of JSON input" si la reponse est vide
      const raw = await res.text();
      let data: { error?: string; deleted?: number; groupsAffected?: number } = {};
      if (raw) {
        try { data = JSON.parse(raw); }
        catch { throw new Error(`Réponse serveur invalide (code ${res.status}). Réessayez ou rechargez la page.`); }
      }
      if (!res.ok) throw new Error(data.error ?? `Erreur serveur (code ${res.status})`);
      setResult({ deleted: data.deleted ?? 0, groupsAffected: data.groupsAffected ?? 0 });
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
            Supprimer les créneaux dupliqués
          </p>
          <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>
            Nettoie les doublons dans l emploi du temps : même filière, même jour, même heure. Le créneau le plus complet est conservé.
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
          {status === "idle" && <Trash2 style={{ width: "13px", height: "13px" }} />}
          {status === "loading" ? "Nettoyage en cours..." : status === "done" ? "Nettoyage effectué" : "Nettoyer les doublons"}
        </button>
      </div>

      {status === "done" && result && (
        <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 14px", background: "#16a34a18", border: "1px solid #16a34a40", borderRadius: "8px", fontSize: "12px", color: "#16a34a" }}>
          <CheckCircle style={{ width: "14px", height: "14px", flexShrink: 0 }} />
          <span>
            <strong>{result.deleted}</strong> doublon{result.deleted !== 1 ? "s" : ""} supprimé{result.deleted !== 1 ? "s" : ""} dans <strong>{result.groupsAffected}</strong> groupe{result.groupsAffected !== 1 ? "s" : ""}. Les collisions doivent avoir disparu.
          </span>
        </div>
      )}

      {status === "done" && result?.deleted === 0 && (
        <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>
          Aucun doublon détecté, vos données sont propres.
        </p>
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
