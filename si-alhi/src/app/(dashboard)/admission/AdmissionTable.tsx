"use client";

import { useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { getStatusLabel, formatDate } from "@/lib/utils";

const STAGE_CONFIG = [
  { key: "PROSPECT", label: "Prospects", dot: "#6b7280" },
  { key: "DOSSIER_RECU", label: "Dossier reçu", dot: "#d97706" },
  { key: "ENTRETIEN", label: "Entretien", dot: "#7c3aed" },
  { key: "ACCEPTE", label: "Acceptés", dot: "#2563eb" },
  { key: "INSCRIT", label: "Inscrits", dot: "#0891b2" },
  { key: "ACTIF", label: "Actifs", dot: "#16a34a" },
];

export type AdmissionRow = {
  id: string;
  firstName: string;
  lastName: string;
  matricule: string;
  phone: string | null;
  filiereName: string;
  status: string;
  createdAt: string;
};

export function AdmissionTable({ rows }: { rows: AdmissionRow[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const q = search.trim().toLowerCase();

  const filtered = rows.filter((r) => {
    const matchStatus = !statusFilter || r.status === statusFilter;
    const matchSearch = !q
      || `${r.lastName} ${r.firstName}`.toLowerCase().includes(q)
      || `${r.firstName} ${r.lastName}`.toLowerCase().includes(q)
      || r.matricule.toLowerCase().includes(q)
      || r.filiereName.toLowerCase().includes(q)
      || (r.phone ?? "").toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  return (
    <div style={{ background: "var(--bg-card)", borderRadius: "12px", border: "1px solid var(--border)", overflow: "hidden" }}>
      <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
        <span style={{ fontWeight: "700", fontSize: "14px", color: "var(--text)" }}>Liste des candidats</span>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <div style={{ position: "relative", minWidth: "240px" }}>
            <Search style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", width: "14px", height: "14px", color: "var(--text-muted)" }} />
            <input
              type="text"
              placeholder="Rechercher un candidat, matricule..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: "100%", padding: "8px 10px 8px 32px", border: "1.5px solid var(--border)", borderRadius: "8px", fontSize: "13px", background: "var(--bg-card)", color: "var(--text)", outline: "none", boxSizing: "border-box" }}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: "8px 12px", border: "1.5px solid var(--border)", borderRadius: "8px", fontSize: "13px", background: "var(--bg-card)", color: "var(--text)", outline: "none", minWidth: "150px" }}
          >
            <option value="">Tous les statuts</option>
            {STAGE_CONFIG.map((s) => (
              <option key={s.key} value={s.key}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
          <thead>
            <tr style={{ background: "var(--bg-muted)", borderBottom: "1px solid var(--border)" }}>
              {["Candidat", "Matricule", "Filière", "Date dossier", "Statut", ""].map((h) => (
                <th key={h} style={{ padding: "9px 14px", textAlign: "left", fontWeight: "600", color: "var(--text-muted)", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((student, i) => {
              const stageCfg = STAGE_CONFIG.find((s) => s.key === student.status);
              return (
                <tr key={student.id} className="row-hover" style={{ borderBottom: i < filtered.length - 1 ? "1px solid var(--border-muted)" : "none" }}>
                  <td style={{ padding: "10px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
                      <div style={{ width: "30px", height: "30px", borderRadius: "50%", background: "linear-gradient(135deg, #1A1A1A, #B91C2F)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "10px", fontWeight: "700", flexShrink: 0 }}>
                        {student.firstName[0]}{student.lastName[0]}
                      </div>
                      <div>
                        <p style={{ fontWeight: "600", color: "var(--text)" }}>{student.lastName} {student.firstName}</p>
                        {student.phone && <p style={{ fontSize: "10px", color: "var(--text-muted)" }}>{student.phone}</p>}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "10px 14px", fontFamily: "monospace", color: "var(--text-secondary)", fontSize: "11px" }}>{student.matricule}</td>
                  <td style={{ padding: "10px 14px", color: "var(--text-secondary)" }}>{student.filiereName}</td>
                  <td style={{ padding: "10px 14px", color: "var(--text-muted)" }}>{formatDate(student.createdAt)}</td>
                  <td style={{ padding: "10px 14px" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "2px 9px", borderRadius: "20px", fontSize: "10px", fontWeight: "600", background: stageCfg ? `${stageCfg.dot}18` : "var(--bg-muted)", color: stageCfg ? stageCfg.dot : "var(--text-muted)" }}>
                      <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: stageCfg?.dot ?? "var(--text-muted)" }} />
                      {getStatusLabel(student.status)}
                    </span>
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    <Link href={`/admission/${student.id}`} style={{ padding: "3px 11px", background: "#B91C2F", color: "white", borderRadius: "6px", fontSize: "11px", fontWeight: "600", textDecoration: "none" }}>
                      Voir
                    </Link>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={6} style={{ padding: "36px", textAlign: "center", color: "var(--text-muted)" }}>Aucun candidat ne correspond a la recherche.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
