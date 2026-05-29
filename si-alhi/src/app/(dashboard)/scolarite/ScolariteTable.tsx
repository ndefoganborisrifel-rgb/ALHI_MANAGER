"use client";

import { useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { formatCFA } from "@/lib/utils";

export type ScolariteRow = {
  id: string;
  firstName: string;
  lastName: string;
  matricule: string;
  filiereName: string;
  totalFees: number;
  totalPaid: number;
};

export function ScolariteTable({ rows }: { rows: ScolariteRow[] }) {
  const [search, setSearch] = useState("");
  const q = search.trim().toLowerCase();
  const filtered = rows.filter((r) =>
    !q
    || `${r.lastName} ${r.firstName}`.toLowerCase().includes(q)
    || `${r.firstName} ${r.lastName}`.toLowerCase().includes(q)
    || r.matricule.toLowerCase().includes(q)
    || r.filiereName.toLowerCase().includes(q)
  );

  return (
    <div style={{ background: "var(--bg-card)", borderRadius: "12px", border: "1px solid var(--border)", overflow: "hidden" }}>
      <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
        <span style={{ fontWeight: "700", fontSize: "14px", color: "var(--text)" }}>Etat des paiements ({rows.length} etudiants actifs)</span>
        <div style={{ position: "relative", minWidth: "260px", flex: "0 1 320px" }}>
          <Search style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", width: "14px", height: "14px", color: "var(--text-muted)" }} />
          <input
            type="text"
            placeholder="Rechercher par nom, matricule, filiere..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: "100%", padding: "8px 10px 8px 32px", border: "1.5px solid var(--border)", borderRadius: "8px", fontSize: "13px", background: "var(--bg-card)", color: "var(--text)", outline: "none", boxSizing: "border-box" }}
          />
        </div>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
          <thead>
            <tr style={{ background: "var(--bg-muted)", borderBottom: "1px solid var(--border)" }}>
              {["Etudiant", "Matricule", "Filiere", "Frais totaux", "Verse", "Solde", "Progression", ""].map((h) => (
                <th key={h} style={{ padding: "9px 14px", textAlign: "left", fontWeight: "600", color: "var(--text-muted)", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((student, i) => {
              const totalPaid = student.totalPaid;
              const balance = student.totalFees - totalPaid;
              const isPaidFull = balance <= 0;
              const pct = student.totalFees > 0 ? Math.min(100, Math.round((totalPaid / student.totalFees) * 100)) : 0;
              return (
                <tr key={student.id} className="row-hover" style={{ borderBottom: i < filtered.length - 1 ? "1px solid var(--border-muted)" : "none" }}>
                  <td style={{ padding: "10px 14px", fontWeight: "600", color: "var(--text)", whiteSpace: "nowrap" }}>{student.lastName} {student.firstName}</td>
                  <td style={{ padding: "10px 14px", fontFamily: "monospace", color: "var(--text-muted)", fontSize: "11px" }}>{student.matricule}</td>
                  <td style={{ padding: "10px 14px", color: "var(--text-secondary)" }}>{student.filiereName}</td>
                  <td style={{ padding: "10px 14px", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>{formatCFA(student.totalFees)}</td>
                  <td style={{ padding: "10px 14px", color: "#16a34a", fontWeight: "600", whiteSpace: "nowrap" }}>{formatCFA(totalPaid)}</td>
                  <td style={{ padding: "10px 14px", whiteSpace: "nowrap" }}>
                    <span style={{ fontWeight: "700", color: isPaidFull ? "#16a34a" : "#B91C2F" }}>{isPaidFull ? "Solde" : formatCFA(balance)}</span>
                  </td>
                  <td style={{ padding: "10px 14px", minWidth: "100px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <div style={{ flex: 1, background: "var(--border)", borderRadius: "4px", height: "5px", overflow: "hidden" }}>
                        <div style={{ width: `${pct}%`, height: "100%", background: isPaidFull ? "#16a34a" : pct >= 50 ? "#d97706" : "#B91C2F", borderRadius: "4px" }} />
                      </div>
                      <span style={{ fontSize: "10px", color: "var(--text-muted)", minWidth: "28px", textAlign: "right" }}>{pct}%</span>
                    </div>
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    <Link href={`/scolarite/${student.id}`} style={{ padding: "3px 11px", background: "#B91C2F", color: "white", borderRadius: "6px", fontSize: "11px", fontWeight: "600", textDecoration: "none" }}>
                      Gerer
                    </Link>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={8} style={{ padding: "36px", textAlign: "center", color: "var(--text-muted)" }}>Aucun etudiant ne correspond a la recherche.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
