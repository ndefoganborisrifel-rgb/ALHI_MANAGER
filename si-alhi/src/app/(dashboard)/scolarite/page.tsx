import { prisma } from "@/lib/prisma";
import { formatCFA } from "@/lib/utils";
import { CreditCard, AlertCircle, CheckCircle, TrendingUp } from "lucide-react";
import { PageHeader, StatCard } from "@/components/ui/PageUI";
import { ScolariteTable } from "./ScolariteTable";

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
        subtitle="Gestion des paiements et du recouvrement, 2025-2026."
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
        <StatCard label="Total collecté" value={formatCFA(totalCollected)} icon={<CheckCircle style={{ width: "18px", height: "18px", color: "#16a34a" }} />} color="#16a34a" bg="#f0fdf4" sub="paiements validés" />
        <StatCard label="Taux recouvrement" value={`${recoveryRate}%`} icon={<TrendingUp style={{ width: "18px", height: "18px", color: "#2563eb" }} />} color="#2563eb" bg="#eff6ff" sub="de l objectif" />
        <StatCard label="Étudiants à jour" value={fullySolved} icon={<CreditCard style={{ width: "18px", height: "18px", color: "#16a34a" }} />} color="#16a34a" bg="#f0fdf4" sub="solde réglé" />
        <StatCard label="Avec solde restant" value={studentsWithDebt} icon={<AlertCircle style={{ width: "18px", height: "18px", color: "#d97706" }} />} color="#d97706" bg="#fff7ed" sub="a relancer" />
      </div>

      {/* Table avec recherche */}
      <ScolariteTable
        rows={students.map((s) => ({
          id: s.id,
          firstName: s.firstName,
          lastName: s.lastName,
          matricule: s.matricule,
          filiereName: s.filiere.name,
          totalFees: s.filiere.totalFees,
          totalPaid: s.payments.reduce((sum, p) => sum + p.amount, 0),
        }))}
      />
    </div>
  );
}
