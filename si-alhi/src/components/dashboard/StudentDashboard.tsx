import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { CreditCard, BookOpen, FileText, ArrowRight, Calendar } from "lucide-react";
import { formatCFA } from "@/lib/utils";

export async function StudentDashboard({ userId }: { userId: string }) {
  const student = await prisma.student.findFirst({
    where: { userId },
    include: {
      filiere: true,
      payments: { where: { status: "VALIDE" }, orderBy: { paymentDate: "desc" } },
      grades: { where: { academicYear: "2025-2026" }, include: { course: true }, take: 8 },
    },
  });

  if (!student) return (
    <div style={{ textAlign: "center", padding: "48px", color: "var(--text-muted)" }}>Profil etudiant non trouve.</div>
  );

  const totalPaid = student.payments.reduce((sum, p) => sum + p.amount, 0);
  const balance = (student.filiere.totalFees ?? 0) - totalPaid;
  const isPaidFull = balance <= 0;
  const pct = student.filiere.totalFees > 0 ? Math.min(100, Math.round((totalPaid / student.filiere.totalFees) * 100)) : 0;
  const recentGrades = student.grades.slice(0, 5);

  return (
    <div style={{ maxWidth: "900px" }}>
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #1A1A1A 0%, #B91C2F 100%)",
        borderRadius: "14px",
        padding: "20px 24px",
        marginBottom: "18px",
        color: "white",
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: "-30px", right: "-30px", width: "120px", height: "120px", borderRadius: "50%", background: "rgba(255,255,255,0.05)", pointerEvents: "none" }} />
        <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.55)", marginBottom: "3px", textTransform: "uppercase", letterSpacing: "1px" }}>Espace etudiant</p>
        <h1 style={{ fontSize: "20px", fontWeight: "800" }}>{student.firstName} {student.lastName}</h1>
        <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.65)" }}>{student.matricule} &bull; {student.filiere.name}</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "16px" }}>
        <div>
          {/* Payment card */}
          <div style={{ background: "var(--bg-card)", borderRadius: "12px", padding: "18px", marginBottom: "14px", border: "1px solid var(--border)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <CreditCard style={{ width: "16px", height: "16px", color: "white" }} />
                </div>
                <span style={{ fontWeight: "700", fontSize: "14px", color: "var(--text)" }}>Scolarite</span>
              </div>
              <span style={{ padding: "2px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "700", background: isPaidFull ? "#16a34a20" : "#B91C2F20", color: isPaidFull ? "#16a34a" : "#B91C2F" }}>
                {isPaidFull ? "Solde" : `Reste : ${formatCFA(balance)}`}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
              <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Verse</span>
              <span style={{ fontSize: "12px", fontWeight: "700", color: "#16a34a" }}>{formatCFA(totalPaid)}</span>
            </div>
            <div style={{ background: "var(--border)", borderRadius: "6px", height: "7px", overflow: "hidden", marginBottom: "6px" }}>
              <div style={{ width: `${pct}%`, height: "100%", background: isPaidFull ? "#16a34a" : pct >= 50 ? "#d97706" : "#B91C2F", borderRadius: "6px" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>Total : {formatCFA(student.filiere.totalFees)}</span>
              <span style={{ fontSize: "10px", fontWeight: "700", color: "var(--text-secondary)" }}>{pct}%</span>
            </div>
          </div>

          {/* Recent grades */}
          {recentGrades.length > 0 && (
            <div style={{ background: "var(--bg-card)", borderRadius: "12px", border: "1px solid var(--border)", overflow: "hidden" }}>
              <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                  <BookOpen style={{ width: "15px", height: "15px", color: "#B91C2F" }} />
                  <span style={{ fontWeight: "700", fontSize: "13px", color: "var(--text)" }}>Notes recentes</span>
                </div>
                <Link href="/examens" style={{ fontSize: "11px", color: "#B91C2F", textDecoration: "none", fontWeight: "600", display: "flex", alignItems: "center", gap: "3px" }}>
                  Tout voir <ArrowRight style={{ width: "11px", height: "11px" }} />
                </Link>
              </div>
              {recentGrades.map((g, i) => {
                const note = g.noteFinal;
                const passed = note != null && note >= 10;
                return (
                  <div key={g.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 16px", borderBottom: i < recentGrades.length - 1 ? "1px solid var(--border-muted)" : "none" }}>
                    <div>
                      <p style={{ fontSize: "13px", fontWeight: "600", color: "var(--text)" }}>{g.course.name}</p>
                      <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>{g.course.code} &bull; S{g.semester}</p>
                    </div>
                    <span style={{ fontSize: "16px", fontWeight: "800", color: note == null ? "var(--text-muted)" : passed ? "#16a34a" : "#B91C2F" }}>
                      {note != null ? `${note.toFixed(2)}/20` : "n/a"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div style={{ background: "var(--bg-card)", borderRadius: "12px", border: "1px solid var(--border)", overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)" }}>
            <span style={{ fontWeight: "700", fontSize: "13px", color: "var(--text)" }}>Acces rapide</span>
          </div>
          <div style={{ padding: "6px" }}>
            {[
              { label: "Mes notes et mon bulletin", href: "/examens", icon: BookOpen },
              { label: "Suivi paiements", href: "/scolarite", icon: CreditCard },
              { label: "Emploi du temps", href: "/pedagogie", icon: Calendar },
              { label: "Mon stage", href: "/stages", icon: FileText },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href} style={{ textDecoration: "none", display: "block" }}>
                  <div className="card-hover" style={{ display: "flex", alignItems: "center", gap: "9px", padding: "10px", borderRadius: "8px", marginBottom: "2px", cursor: "pointer" }}>
                    <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "var(--red-bg)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon style={{ width: "15px", height: "15px", color: "#B91C2F" }} />
                    </div>
                    <span style={{ fontSize: "12px", fontWeight: "500", color: "var(--text)" }}>{item.label}</span>
                    <ArrowRight style={{ width: "12px", height: "12px", color: "var(--text-muted)", marginLeft: "auto" }} />
                  </div>
                </Link>
              );
            })}
          </div>
          <div style={{ margin: "6px 8px 8px", background: "var(--bg-muted)", borderRadius: "8px", padding: "12px" }}>
            <p style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>Informations</p>
            {[["Filiere", student.filiere.name], ["Niveau", `Annee ${student.level}`], ["Promo", String(student.promotionYear)]].map(([l, v]) => (
              <div key={l} style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>{l}</span>
                <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--text)" }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
