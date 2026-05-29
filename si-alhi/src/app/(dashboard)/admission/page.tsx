import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { UserPlus, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/ui/PageUI";
import { AdmissionTable } from "./AdmissionTable";

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

      {/* Table avec recherche */}
      <AdmissionTable
        rows={students.map((s) => ({
          id: s.id,
          firstName: s.firstName,
          lastName: s.lastName,
          matricule: s.matricule,
          phone: s.phone,
          filiereName: s.filiere.name,
          status: s.status,
          createdAt: s.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
