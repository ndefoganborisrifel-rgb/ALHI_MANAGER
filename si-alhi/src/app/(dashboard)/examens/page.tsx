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
    { label: "Notes saisies", value: totalGrades, color: "#2563eb", bg: "linear-gradient(135deg, #eff6ff, #dbeafe)", icon: BookOpen },
    { label: "Etudiants actifs", value: students, color: "#16a34a", bg: "linear-gradient(135deg, #f0fdf4, #dcfce7)", icon: GraduationCap },
    { label: "Filieres", value: filieres.length, color: "#B91C2F", bg: "linear-gradient(135deg, #fff1f2, #fecdd3)", icon: Award },
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
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: "800", color: "#111827", marginBottom: "4px" }}>
            SI-Examens et Notes
          </h1>
          <p style={{ fontSize: "14px", color: "#6b7280" }}>
            Saisie des notes et generation des bulletins, annee 2025-2026
          </p>
        </div>
        {canEnterGrades && (
          <div style={{ display: "flex", gap: "10px" }}>
            <Link
              href="/examens/saisie"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "7px",
                padding: "9px 18px",
                background: "white",
                color: "#374151",
                border: "1.5px solid #e5e7eb",
                borderRadius: "10px",
                fontWeight: "600",
                fontSize: "13px",
                textDecoration: "none",
              }}
            >
              <BookOpen style={{ width: "15px", height: "15px" }} />
              Saisir les notes
            </Link>
            <Link
              href="/examens/bulletins"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "7px",
                padding: "9px 18px",
                background: "#B91C2F",
                color: "white",
                borderRadius: "10px",
                fontWeight: "700",
                fontSize: "13px",
                textDecoration: "none",
              }}
            >
              <FileText style={{ width: "15px", height: "15px" }} />
              Bulletins
            </Link>
          </div>
        )}
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "24px" }}>
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              style={{
                background: kpi.bg,
                borderRadius: "14px",
                padding: "20px 24px",
                border: "1px solid rgba(255,255,255,0.8)",
                boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                display: "flex",
                alignItems: "center",
                gap: "16px",
              }}
            >
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "12px",
                  background: kpi.color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Icon style={{ width: "24px", height: "24px", color: "white" }} />
              </div>
              <div>
                <p style={{ fontSize: "32px", fontWeight: "800", color: kpi.color, lineHeight: 1, marginBottom: "4px" }}>
                  {kpi.value.toLocaleString("fr-FR")}
                </p>
                <p style={{ fontSize: "12px", color: "#6b7280", fontWeight: "500" }}>{kpi.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "20px" }}>
        {/* Actions */}
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
            <h2 style={{ fontSize: "15px", fontWeight: "700", color: "#111827" }}>Actions disponibles</h2>
          </div>
          <div style={{ padding: "8px" }}>
            {actions.map((action) => {
              const Icon = action.icon;
              return (
                <Link key={action.href} href={action.href} style={{ textDecoration: "none" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "14px",
                      padding: "14px 12px",
                      borderRadius: "10px",
                      marginBottom: "4px",
                      cursor: "pointer",
                      transition: "background 0.1s",
                    }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.background = "#f9fafb")}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.background = "transparent")}
                  >
                    <div
                      style={{
                        width: "42px",
                        height: "42px",
                        borderRadius: "10px",
                        background: "#fff1f2",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Icon style={{ width: "20px", height: "20px", color: "#B91C2F" }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: "14px", fontWeight: "600", color: "#111827", marginBottom: "2px" }}>
                        {action.label}
                      </p>
                      <p style={{ fontSize: "11px", color: "#9ca3af" }}>{action.desc}</p>
                    </div>
                    <ArrowRight style={{ width: "16px", height: "16px", color: "#d1d5db" }} />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Filieres */}
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
            <h2 style={{ fontSize: "15px", fontWeight: "700", color: "#111827" }}>Filieres</h2>
          </div>
          <div style={{ padding: "8px" }}>
            {filieres.map((f, i) => (
              <div
                key={f.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px",
                  borderRadius: "10px",
                  marginBottom: i < filieres.length - 1 ? "4px" : "0",
                  background: "#f9fafb",
                }}
              >
                <div>
                  <p style={{ fontWeight: "600", fontSize: "13px", color: "#111827", marginBottom: "2px" }}>{f.name}</p>
                  <p style={{ fontSize: "10px", color: "#9ca3af", fontFamily: "monospace" }}>{f.code}</p>
                </div>
                <Link
                  href={`/examens/bulletins?filiere=${f.id}`}
                  style={{
                    padding: "4px 10px",
                    background: "white",
                    border: "1.5px solid #e5e7eb",
                    borderRadius: "6px",
                    fontSize: "11px",
                    fontWeight: "600",
                    color: "#374151",
                    textDecoration: "none",
                  }}
                >
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
