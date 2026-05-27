import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { BookOpen, FileText, Award, ClipboardList, ArrowRight, GraduationCap } from "lucide-react";

export default async function ExamensPage() {
  const session = await auth();
  const role = session?.user.role ?? "ETUDIANT";

  const [filieres, totalGrades, students] = await Promise.all([
    prisma.filiere.findMany({ orderBy: { name: "asc" } }),
    prisma.grade.count({ where: { academicYear: "2025-2026" } }),
    prisma.student.count({ where: { status: { in: ["ACTIF", "INSCRIT"] } } }),
  ]);

  const canEnterGrades = ["ADMIN", "SCOLARITE", "ENSEIGNANT"].includes(role);

  const kpis = [
    { label: "Notes saisies", value: totalGrades, color: "#2563eb", icon: BookOpen },
    { label: "Etudiants actifs", value: students, color: "#16a34a", icon: GraduationCap },
    { label: "Filieres", value: filieres.length, color: "#B91C2F", icon: Award },
  ];

  const actions = [
    ...(canEnterGrades ? [{ label: "Saisir les notes CC1, CC2, Examen", href: "/examens/saisie", icon: BookOpen, desc: "Remplir les notes des etudiants par cours" }] : []),
    { label: "Consulter et imprimer les bulletins", href: "/examens/bulletins", icon: FileText, desc: "Bulletins semestriels par etudiant" },
    ...(canEnterGrades ? [
      { label: "PV de notes (CC et Examen)", href: "/examens/pv", icon: ClipboardList, desc: "Proces-verbal officiel des notes" },
      { label: "PV de deliberation", href: "/examens/deliberation", icon: Award, desc: "Deliberation et decisions du jury" },
    ] : []),
  ];

  return (
    <div style={{ maxWidth: "1100px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: "800", color: "var(--text)", marginBottom: "3px" }}>SI-Examens et Notes</h1>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Saisie des notes et generation des bulletins, 2025-2026</p>
        </div>
        {canEnterGrades && (
          <div style={{ display: "flex", gap: "8px" }}>
            <Link href="/examens/saisie" style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "8px 16px", background: "var(--bg-card)", color: "var(--text)", border: "1.5px solid var(--border)", borderRadius: "9px", fontWeight: "600", fontSize: "12px", textDecoration: "none" }}>
              <BookOpen style={{ width: "14px", height: "14px" }} />Saisir les notes
            </Link>
            <Link href="/examens/bulletins" style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "8px 16px", background: "#B91C2F", color: "white", borderRadius: "9px", fontWeight: "700", fontSize: "12px", textDecoration: "none" }}>
              <FileText style={{ width: "14px", height: "14px" }} />Bulletins
            </Link>
          </div>
        )}
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px", marginBottom: "18px" }}>
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} style={{ background: "var(--bg-card)", borderRadius: "12px", padding: "18px", border: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "14px" }}>
              <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: `${kpi.color}20`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon style={{ width: "22px", height: "22px", color: kpi.color }} />
              </div>
              <div>
                <p style={{ fontSize: "28px", fontWeight: "800", color: kpi.color, lineHeight: 1, marginBottom: "3px" }}>{kpi.value.toLocaleString("fr-FR")}</p>
                <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>{kpi.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "16px" }}>
        {/* Actions */}
        <div style={{ background: "var(--bg-card)", borderRadius: "12px", border: "1px solid var(--border)", overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)" }}>
            <span style={{ fontWeight: "700", fontSize: "14px", color: "var(--text)" }}>Actions disponibles</span>
          </div>
          <div style={{ padding: "6px" }}>
            {actions.map((action) => {
              const Icon = action.icon;
              return (
                <Link key={action.href} href={action.href} style={{ textDecoration: "none", display: "block" }}>
                  <div className="card-hover" style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px", borderRadius: "10px", marginBottom: "2px", cursor: "pointer" }}>
                    <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: "var(--red-bg)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon style={{ width: "18px", height: "18px", color: "#B91C2F" }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: "13px", fontWeight: "600", color: "var(--text)", marginBottom: "1px" }}>{action.label}</p>
                      <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>{action.desc}</p>
                    </div>
                    <ArrowRight style={{ width: "14px", height: "14px", color: "var(--text-muted)" }} />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Filieres */}
        <div style={{ background: "var(--bg-card)", borderRadius: "12px", border: "1px solid var(--border)", overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)" }}>
            <span style={{ fontWeight: "700", fontSize: "14px", color: "var(--text)" }}>Filieres</span>
          </div>
          <div style={{ padding: "8px" }}>
            {filieres.map((f, i) => (
              <div key={f.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px", borderRadius: "8px", background: "var(--bg-muted)", marginBottom: i < filieres.length - 1 ? "4px" : "0" }}>
                <div>
                  <p style={{ fontWeight: "600", fontSize: "12px", color: "var(--text)", marginBottom: "1px" }}>{f.name}</p>
                  <p style={{ fontSize: "10px", color: "var(--text-muted)", fontFamily: "monospace" }}>{f.code}</p>
                </div>
                <Link href={`/examens/bulletins?filiere=${f.id}`} style={{ padding: "3px 10px", background: "var(--bg-card)", border: "1.5px solid var(--border)", borderRadius: "6px", fontSize: "11px", fontWeight: "600", color: "var(--text)", textDecoration: "none" }}>
                  Bulletins
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
