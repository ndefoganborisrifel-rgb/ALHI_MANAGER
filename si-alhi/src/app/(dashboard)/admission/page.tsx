import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { getStatusLabel, formatDate } from "@/lib/utils";
import { UserPlus, ChevronRight } from "lucide-react";

const STAGE_CONFIG = [
  { key: "PROSPECT", label: "Prospects", dot: "#6b7280", bg: "#f9fafb" },
  { key: "DOSSIER_RECU", label: "Dossier recu", dot: "#d97706", bg: "#fffbeb" },
  { key: "ENTRETIEN", label: "Entretien", dot: "#7c3aed", bg: "#faf5ff" },
  { key: "ACCEPTE", label: "Acceptes", dot: "#2563eb", bg: "#eff6ff" },
  { key: "INSCRIT", label: "Inscrits", dot: "#0891b2", bg: "#ecfeff" },
  { key: "ACTIF", label: "Actifs", dot: "#16a34a", bg: "#f0fdf4" },
];

export default async function AdmissionPage() {
  const students = await prisma.student.findMany({
    include: { filiere: true, parent: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const statusCounts = Object.fromEntries(
    STAGE_CONFIG.map((s) => [s.key, students.filter((st) => st.status === s.key).length])
  );
  const total = students.length;

  return (
    <div style={{ maxWidth: "1200px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: "800", color: "#111827", marginBottom: "4px" }}>
            SI-Admission
          </h1>
          <p style={{ fontSize: "14px", color: "#6b7280" }}>
            Pipeline de candidatures, {total} dossier{total !== 1 ? "s" : ""} au total
          </p>
        </div>
        <Link
          href="/admission/nouveau"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 20px",
            background: "#B91C2F",
            color: "white",
            borderRadius: "10px",
            fontWeight: "700",
            fontSize: "14px",
            textDecoration: "none",
          }}
        >
          <UserPlus style={{ width: "16px", height: "16px" }} />
          Nouveau candidat
        </Link>
      </div>

      {/* Pipeline cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "12px", marginBottom: "24px" }}>
        {STAGE_CONFIG.map((stage, i) => {
          const count = statusCounts[stage.key] ?? 0;
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          return (
            <div
              key={stage.key}
              style={{
                background: stage.bg,
                borderRadius: "14px",
                padding: "16px",
                border: `2px solid ${stage.dot}30`,
                position: "relative",
                overflow: "hidden",
              }}
            >
              {i < STAGE_CONFIG.length - 1 && (
                <div
                  style={{
                    position: "absolute",
                    right: "-10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    zIndex: 2,
                    background: "white",
                    borderRadius: "50%",
                    width: "20px",
                    height: "20px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                  }}
                >
                  <ChevronRight style={{ width: "12px", height: "12px", color: "#9ca3af" }} />
                </div>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: stage.dot, flexShrink: 0 }} />
                <span style={{ fontSize: "10px", color: "#6b7280", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.3px" }}>
                  {stage.label}
                </span>
              </div>
              <p style={{ fontSize: "32px", fontWeight: "800", color: stage.dot, lineHeight: 1, marginBottom: "4px" }}>
                {count}
              </p>
              <p style={{ fontSize: "10px", color: "#9ca3af" }}>{pct}% du total</p>
            </div>
          );
        })}
      </div>

      {/* Table */}
      <div
        style={{
          background: "white",
          borderRadius: "14px",
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          overflow: "hidden",
          border: "1px solid #f3f4f6",
        }}
      >
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #f3f4f6" }}>
          <h2 style={{ fontSize: "15px", fontWeight: "700", color: "#111827" }}>
            Liste des candidats ({total})
          </h2>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ background: "#f9fafb", borderBottom: "1px solid #f3f4f6" }}>
                {["Candidat", "Matricule", "Filiere", "Date dossier", "Statut", ""].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "10px 16px",
                      textAlign: "left",
                      fontWeight: "600",
                      color: "#6b7280",
                      fontSize: "11px",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {students.map((student, i) => {
                const stageCfg = STAGE_CONFIG.find((s) => s.key === student.status);
                return (
                  <tr
                    key={student.id}
                    style={{
                      borderBottom: i < students.length - 1 ? "1px solid #f9fafb" : "none",
                    }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLTableRowElement).style.background = "#f9fafb")}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLTableRowElement).style.background = "transparent")}
                  >
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div
                          style={{
                            width: "32px",
                            height: "32px",
                            borderRadius: "50%",
                            background: "linear-gradient(135deg, #1A1A1A, #B91C2F)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "white",
                            fontSize: "11px",
                            fontWeight: "700",
                            flexShrink: 0,
                          }}
                        >
                          {student.firstName[0]}{student.lastName[0]}
                        </div>
                        <div>
                          <p style={{ fontWeight: "600", color: "#111827" }}>{student.lastName} {student.firstName}</p>
                          {student.phone && <p style={{ fontSize: "11px", color: "#9ca3af" }}>{student.phone}</p>}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px", fontFamily: "monospace", color: "#6b7280", fontSize: "11px" }}>
                      {student.matricule}
                    </td>
                    <td style={{ padding: "12px 16px", color: "#374151" }}>{student.filiere.name}</td>
                    <td style={{ padding: "12px 16px", color: "#6b7280" }}>{formatDate(student.createdAt)}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          padding: "3px 10px",
                          borderRadius: "20px",
                          fontSize: "11px",
                          fontWeight: "600",
                          background: stageCfg ? `${stageCfg.dot}18` : "#f3f4f6",
                          color: stageCfg ? stageCfg.dot : "#6b7280",
                        }}
                      >
                        <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: stageCfg?.dot ?? "#6b7280" }} />
                        {getStatusLabel(student.status)}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <Link
                        href={`/admission/${student.id}`}
                        style={{
                          display: "inline-block",
                          padding: "4px 12px",
                          background: "#B91C2F",
                          color: "white",
                          borderRadius: "6px",
                          fontSize: "11px",
                          fontWeight: "600",
                          textDecoration: "none",
                        }}
                      >
                        Voir
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {students.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: "40px", textAlign: "center", color: "#9ca3af" }}>
                    Aucun candidat enregistre. Commencez par ajouter un nouveau candidat.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
