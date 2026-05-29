import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { getStatusLabel, formatDate } from "@/lib/utils";
import { UserPlus, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/ui/PageUI";

const STAGE_CONFIG = [
  { key: "PROSPECT", label: "Prospects", dot: "#6b7280" },
  { key: "DOSSIER_RECU", label: "Dossier recu", dot: "#d97706" },
  { key: "ENTRETIEN", label: "Entretien", dot: "#7c3aed" },
  { key: "ACCEPTE", label: "Acceptes", dot: "#2563eb" },
  { key: "INSCRIT", label: "Inscrits", dot: "#0891b2" },
  { key: "ACTIF", label: "Actifs", dot: "#16a34a" },
];

export default async function AdmissionPage() {
  const students = await prisma.student.findMany({
    include: { filiere: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const total = students.length;
  const counts = Object.fromEntries(STAGE_CONFIG.map((s) => [s.key, students.filter((st) => st.status === s.key).length]));

  return (
    <div style={{ maxWidth: "1200px" }}>
      <PageHeader
        title="SI-Admission"
        subtitle={`${total} dossier${total !== 1 ? "s" : ""} au total`}
        backHref="/dashboard"
        icon={<UserPlus style={{ width: "22px", height: "22px", color: "#B91C2F" }} />}
        actions={(
          <Link href="/admission/nouveau" style={{ display: "inline-flex", alignItems: "center", gap: "7px", padding: "10px 18px", background: "#B91C2F", color: "white", borderRadius: "10px", fontWeight: 700, fontSize: "13px", textDecoration: "none" }}>
            <UserPlus style={{ width: "15px", height: "15px" }} />Nouveau candidat
          </Link>
        )}
      />

      {/* Pipeline */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "10px", marginBottom: "20px" }}>
        {STAGE_CONFIG.map((stage, i) => {
          const count = counts[stage.key] ?? 0;
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          return (
            <div key={stage.key} style={{
              background: "var(--bg-card)",
              borderRadius: "12px",
              padding: "14px",
              border: `1.5px solid ${stage.dot}30`,
              position: "relative",
            }}>
              {i < STAGE_CONFIG.length - 1 && (
                <div style={{ position: "absolute", right: "-9px", top: "50%", transform: "translateY(-50%)", zIndex: 2, background: "var(--bg)", borderRadius: "50%", width: "18px", height: "18px", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--border)" }}>
                  <ChevronRight style={{ width: "10px", height: "10px", color: "var(--text-muted)" }} />
                </div>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "7px" }}>
                <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: stage.dot }} />
                <span style={{ fontSize: "9px", color: "var(--text-muted)", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.3px" }}>{stage.label}</span>
              </div>
              <p style={{ fontSize: "28px", fontWeight: "800", color: stage.dot, lineHeight: 1, marginBottom: "3px" }}>{count}</p>
              <p style={{ fontSize: "10px", color: "var(--text-muted)" }}>{pct}%</p>
            </div>
          );
        })}
      </div>

      {/* Table */}
      <div style={{ background: "var(--bg-card)", borderRadius: "12px", border: "1px solid var(--border)", overflow: "hidden" }}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)" }}>
          <span style={{ fontWeight: "700", fontSize: "14px", color: "var(--text)" }}>Liste des candidats</span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ background: "var(--bg-muted)", borderBottom: "1px solid var(--border)" }}>
                {["Candidat", "Matricule", "Filiere", "Date dossier", "Statut", ""].map((h) => (
                  <th key={h} style={{ padding: "9px 14px", textAlign: "left", fontWeight: "600", color: "var(--text-muted)", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {students.map((student, i) => {
                const stageCfg = STAGE_CONFIG.find((s) => s.key === student.status);
                return (
                  <tr key={student.id} className="row-hover" style={{ borderBottom: i < students.length - 1 ? "1px solid var(--border-muted)" : "none" }}>
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
                    <td style={{ padding: "10px 14px", color: "var(--text-secondary)" }}>{student.filiere.name}</td>
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
              {students.length === 0 && (
                <tr><td colSpan={6} style={{ padding: "36px", textAlign: "center", color: "var(--text-muted)" }}>Aucun candidat. Commencez par ajouter un nouveau candidat.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
