"use client";

import { useState } from "react";
import { Wrench, CheckCircle, AlertTriangle, Loader2 } from "lucide-react";

export function MigrateSchedulesButton() {
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [result, setResult] = useState<{ groupsCreated: number; schedulePatched: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  async function run() {
    if (!confirm("Lancer la migration des emplois du temps ? Cette operation est sans risque et idempotente.")) return;
    setStatus("loading");
    setResult(null);
    setErrorMsg("");
    try {
      const res = await fetch("/api/schedules/migrate-shared-groups", { method: "POST" });
      const raw = await res.text();
      let data: { error?: string; groupsCreated?: number; schedulePatched?: number } = {};
      if (raw) {
        try { data = JSON.parse(raw); }
        catch { throw new Error(`Reponse serveur invalide (code ${res.status}). Reessayez ou rechargez la page.`); }
      }
      if (!res.ok) throw new Error(data.error ?? `Erreur serveur (code ${res.status})`);
      setResult({ groupsCreated: data.groupsCreated ?? 0, schedulePatched: data.schedulePatched ?? 0 });
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
            Corriger les collisions de l emploi du temps
          </p>
          <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>
            Regroupe les anciens creneaux mutualises qui n ont pas encore de sharedGroupId. A executer une seule fois.
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
          {status === "idle" && <Wrench style={{ width: "13px", height: "13px" }} />}
          {status === "loading" ? "Migration en cours..." : status === "done" ? "Migration effectuee" : "Lancer la migration"}
        </button>
      </div>

      {status === "done" && result && (
        <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 14px", background: "#16a34a18", border: "1px solid #16a34a40", borderRadius: "8px", fontSize: "12px", color: "#16a34a" }}>
          <CheckCircle style={{ width: "14px", height: "14px", flexShrink: 0 }} />
          <span>
            <strong>{result.groupsCreated}</strong> groupe{result.groupsCreated !== 1 ? "s" : ""} cree{result.groupsCreated !== 1 ? "s" : ""}, <strong>{result.schedulePatched}</strong> creneau{result.schedulePatched !== 1 ? "x" : ""} corrige{result.schedulePatched !== 1 ? "s" : ""}. Les collisions doivent avoir disparu.
          </span>
        </div>
      )}

      {status === "error" && (
        <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 14px", background: "#B91C2F18", border: "1px solid #B91C2F40", borderRadius: "8px", fontSize: "12px", color: "#B91C2F" }}>
          <AlertTriangle style={{ width: "14px", height: "14px", flexShrink: 0 }} />
          {errorMsg}
        </div>
      )}

      {status === "done" && result?.schedulePatched === 0 && (
        <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>
          Aucun creneau a corriger — vos donnees sont deja a jour.
        </p>
      )}
    </div>
  );
}
