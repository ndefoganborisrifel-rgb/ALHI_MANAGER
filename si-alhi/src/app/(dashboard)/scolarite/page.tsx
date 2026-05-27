import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatCFA } from "@/lib/utils";
import { CreditCard, AlertCircle, CheckCircle, TrendingUp } from "lucide-react";

export default async function ScolaritePage() {
  const students = await prisma.student.findMany({
    include: {
      filiere: true,
      payments: { where: { status: "VALIDE" } },
    },
    where: { status: { in: ["ACTIF", "INSCRIT"] } },
    orderBy: { lastName: "asc" },
  });

  const totalExpected = students.reduce((sum, s) => sum + s.filiere.totalFees, 0);
  const totalCollected = students.reduce(
    (sum, s) => sum + s.payments.reduce((ps, p) => ps + p.amount, 0),
    0
  );
  const recoveryRate = totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0;
  const studentsWithDebt = students.filter((s) => {
    const paid = s.payments.reduce((sum, p) => sum + p.amount, 0);
    return paid < s.filiere.totalFees;
  }).length;
  const fullySolved = students.length - studentsWithDebt;

  const kpis = [
    { label: "Total collecte", value: formatCFA(totalCollected), icon: CheckCircle, color: "#16a34a", bg: "linear-gradient(135deg, #f0fdf4, #dcfce7)" },
    { label: "Taux de recouvrement", value: `${recoveryRate}%`, icon: TrendingUp, color: "#2563eb", bg: "linear-gradient(135deg, #eff6ff, #dbeafe)" },
    { label: "Etudiants a jour", value: fullySolved, icon: CreditCard, color: "#B91C2F", bg: "linear-gradient(135deg, #fff1f2, #fecdd3)" },
    { label: "Avec solde restant", value: studentsWithDebt, icon: AlertCircle, color: "#d97706", bg: "linear-gradient(135deg, #fffbeb, #fef3c7)" },
  ];

  return (
    <div style={{ maxWidth: "1200px" }}>
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: "800", color: "#111827", marginBottom: "4px" }}>
          SI-Scolarite
        </h1>
        <p style={{ fontSize: "14px", color: "#6b7280" }}>
          Gestion des paiements et du recouvrement, annee 2025-2026
        </p>
      </div>

      {/* Progress bar */}
      <div
        style={{
          background: "white",
          borderRadius: "14px",
          padding: "20px 24px",
          marginBottom: "20px",
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          border: "1px solid #f3f4f6",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
          <span style={{ fontSize: "13px", fontWeight: "600", color: "#374151" }}>
            Taux de recouvrement global
          </span>
          <span style={{ fontSize: "20px", fontWeight: "800", color: recoveryRate >= 80 ? "#16a34a" : recoveryRate >= 50 ? "#d97706" : "#B91C2F" }}>
            {recoveryRate}%
          </span>
        </div>
        <div style={{ background: "#f3f4f6", borderRadius: "8px", height: "10px", overflow: "hidden" }}>
          <div
            style={{
              width: `${Math.min(recoveryRate, 100)}%`,
              height: "100%",
              background: recoveryRate >= 80 ? "linear-gradient(90deg, #16a34a, #22c55e)" : recoveryRate >= 50 ? "linear-gradient(90deg, #d97706, #f59e0b)" : "linear-gradient(90deg, #B91C2F, #ef4444)",
              borderRadius: "8px",
              transition: "width 0.5s ease",
            }}
          />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "6px" }}>
          <span style={{ fontSize: "11px", color: "#9ca3af" }}>{formatCFA(totalCollected)} collectes</span>
          <span style={{ fontSize: "11px", color: "#9ca3af" }}>objectif : {formatCFA(totalExpected)}</span>
        </div>
      </div>

      {/* KPI cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "24px" }}>
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              style={{
                background: kpi.bg,
                borderRadius: "14px",
                padding: "20px",
                border: "1px solid rgba(255,255,255,0.8)",
                boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "10px",
                    background: kpi.color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Icon style={{ width: "20px", height: "20px", color: "white" }} />
                </div>
                <div>
                  <p style={{ fontSize: "11px", color: "#6b7280", marginBottom: "2px" }}>{kpi.label}</p>
                  <p style={{ fontSize: "20px", fontWeight: "800", color: kpi.color, lineHeight: 1 }}>
                    {typeof kpi.value === "number" ? kpi.value.toLocaleString("fr-FR") : kpi.value}
                  </p>
                </div>
              </div>
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
            Etat des paiements ({students.length} etudiants actifs)
          </h2>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ background: "#f9fafb", borderBottom: "1px solid #f3f4f6" }}>
                {["Etudiant", "Matricule", "Filiere", "Frais totaux", "Verse", "Solde restant", "Progression", "Actions"].map((h) => (
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
                const totalPaid = student.payments.reduce((sum, p) => sum + p.amount, 0);
                const balance = student.filiere.totalFees - totalPaid;
                const isPaidFull = balance <= 0;
                const pct = student.filiere.totalFees > 0
                  ? Math.min(100, Math.round((totalPaid / student.filiere.totalFees) * 100))
                  : 0;
                return (
                  <tr
                    key={student.id}
                    style={{
                      borderBottom: i < students.length - 1 ? "1px solid #f9fafb" : "none",
                      transition: "background 0.1s",
                    }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLTableRowElement).style.background = "#f9fafb")}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLTableRowElement).style.background = "transparent")}
                  >
                    <td style={{ padding: "12px 16px", fontWeight: "600", color: "#111827", whiteSpace: "nowrap" }}>
                      {student.lastName} {student.firstName}
                    </td>
                    <td style={{ padding: "12px 16px", fontFamily: "monospace", color: "#6b7280", fontSize: "11px" }}>
                      {student.matricule}
                    </td>
                    <td style={{ padding: "12px 16px", color: "#374151" }}>
                      {student.filiere.name}
                    </td>
                    <td style={{ padding: "12px 16px", color: "#374151", whiteSpace: "nowrap" }}>
                      {formatCFA(student.filiere.totalFees)}
                    </td>
                    <td style={{ padding: "12px 16px", color: "#16a34a", fontWeight: "600", whiteSpace: "nowrap" }}>
                      {formatCFA(totalPaid)}
                    </td>
                    <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                      <span style={{ fontWeight: "700", color: isPaidFull ? "#16a34a" : "#B91C2F" }}>
                        {isPaidFull ? "Solde" : formatCFA(balance)}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", minWidth: "100px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{ flex: 1, background: "#f3f4f6", borderRadius: "4px", height: "6px", overflow: "hidden" }}>
                          <div
                            style={{
                              width: `${pct}%`,
                              height: "100%",
                              background: isPaidFull ? "#16a34a" : pct >= 50 ? "#d97706" : "#B91C2F",
                              borderRadius: "4px",
                            }}
                          />
                        </div>
                        <span style={{ fontSize: "11px", color: "#6b7280", minWidth: "30px", textAlign: "right" }}>{pct}%</span>
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <Link
                        href={`/scolarite/${student.id}`}
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
                        Gerer
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {students.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ padding: "40px", textAlign: "center", color: "#9ca3af", fontSize: "14px" }}>
                    Aucun etudiant actif
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
