import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatCFA } from "@/lib/utils";
import { CreditCard, AlertCircle, CheckCircle, TrendingUp } from "lucide-react";
import { PageHeader, StatCard } from "@/components/ui/PageUI";

export default async function ScolaritePage() {
  const students = await prisma.student.findMany({
    include: { filiere: true, payments: { where: { status: "VALIDE" } } },
    where: { status: { in: ["ACTIF", "INSCRIT"] } },
    orderBy: { lastName: "asc" },
  });

  const totalExpected = students.reduce((sum, s) => sum + s.filiere.totalFees, 0);
  const totalCollected = students.reduce((sum, s) => sum + s.payments.reduce((ps, p) => ps + p.amount, 0), 0);
  const recoveryRate = totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0;
  const studentsWithDebt = students.filter((s) => s.payments.reduce((sum, p) => sum + p.amount, 0) < s.filiere.totalFees).length;
  const fullySolved = students.length - studentsWithDebt;

  return (
    <div style={{ maxWidth: "1200px" }}>
      <PageHeader
        title="SI-Scolarite"
        subtitle="Gestion des paiements et du recouvrement, 2025-2026"
        backHref="/dashboard"
        icon={<CreditCard style={{ width: "22px", height: "22px", color: "#B91C2F" }} />}
      />

      {/* Progress bar */}
      <div style={{ background: "var(--bg-card)", borderRadius: "12px", padding: "18px 20px", marginBottom: "16px", border: "1px solid var(--border)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
          <span style={{ fontSize: "13px", fontWeight: "600", color: "var(--text)" }}>Taux de recouvrement global</span>
          <span style={{ fontSize: "20px", fontWeight: "800", color: recoveryRate >= 80 ? "#16a34a" : recoveryRate >= 50 ? "#d97706" : "#B91C2F" }}>{recoveryRate}%</span>
        </div>
        <div style={{ background: "var(--border)", borderRadius: "8px", height: "8px", overflow: "hidden" }}>
          <div style={{ width: `${Math.min(recoveryRate, 100)}%`, height: "100%", background: recoveryRate >= 80 ? "#16a34a" : recoveryRate >= 50 ? "#d97706" : "#B91C2F", borderRadius: "8px" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "5px" }}>
          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{formatCFA(totalCollected)} collectes</span>
          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>objectif : {formatCFA(totalExpected)}</span>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px", marginBottom: "18px" }}>
        <StatCard label="Total collecte" value={formatCFA(totalCollected)} icon={<CheckCircle style={{ width: "18px", height: "18px", color: "#16a34a" }} />} color="#16a34a" bg="#f0fdf4" sub="paiements valides" />
        <StatCard label="Taux recouvrement" value={`${recoveryRate}%`} icon={<TrendingUp style={{ width: "18px", height: "18px", color: "#2563eb" }} />} color="#2563eb" bg="#eff6ff" sub="de l'objectif" />
        <StatCard label="Etudiants a jour" value={fullySolved} icon={<CreditCard style={{ width: "18px", height: "18px", color: "#16a34a" }} />} color="#16a34a" bg="#f0fdf4" sub="solde regle" />
        <StatCard label="Avec solde restant" value={studentsWithDebt} icon={<AlertCircle style={{ width: "18px", height: "18px", color: "#d97706" }} />} color="#d97706" bg="#fff7ed" sub="a relancer" />
      </div>

      {/* Table */}
      <div style={{ background: "var(--bg-card)", borderRadius: "12px", border: "1px solid var(--border)", overflow: "hidden" }}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)" }}>
          <span style={{ fontWeight: "700", fontSize: "14px", color: "var(--text)" }}>Etat des paiements ({students.length} etudiants actifs)</span>
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
              {students.map((student, i) => {
                const totalPaid = student.payments.reduce((sum, p) => sum + p.amount, 0);
                const balance = student.filiere.totalFees - totalPaid;
                const isPaidFull = balance <= 0;
                const pct = student.filiere.totalFees > 0 ? Math.min(100, Math.round((totalPaid / student.filiere.totalFees) * 100)) : 0;
                return (
                  <tr key={student.id} className="row-hover" style={{ borderBottom: i < students.length - 1 ? "1px solid var(--border-muted)" : "none" }}>
                    <td style={{ padding: "10px 14px", fontWeight: "600", color: "var(--text)", whiteSpace: "nowrap" }}>{student.lastName} {student.firstName}</td>
                    <td style={{ padding: "10px 14px", fontFamily: "monospace", color: "var(--text-muted)", fontSize: "11px" }}>{student.matricule}</td>
                    <td style={{ padding: "10px 14px", color: "var(--text-secondary)" }}>{student.filiere.name}</td>
                    <td style={{ padding: "10px 14px", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>{formatCFA(student.filiere.totalFees)}</td>
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
              {students.length === 0 && (
                <tr><td colSpan={8} style={{ padding: "36px", textAlign: "center", color: "var(--text-muted)" }}>Aucun etudiant actif</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
