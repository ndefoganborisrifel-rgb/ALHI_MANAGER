import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { CreditCard, BookOpen, FileText, ArrowRight } from "lucide-react";
import { formatCFA } from "@/lib/utils";

export async function StudentDashboard({ userId }: { userId: string }) {
  const student = await prisma.student.findFirst({
    where: { userId },
    include: {
      filiere: true,
      payments: { where: { status: "VALIDE" }, orderBy: { paymentDate: "desc" } },
      grades: { where: { academicYear: "2025-2026" }, include: { course: true }, take: 10 },
    },
  });

  if (!student) return (
    <div style={{ textAlign: "center", padding: "48px", color: "#9ca3af" }}>
      Profil etudiant non trouve.
    </div>
  );

  const totalPaid = student.payments.reduce((sum, p) => sum + p.amount, 0);
  const balance = (student.filiere.totalFees ?? 0) - totalPaid;
  const isPaidFull = balance <= 0;
  const pct = student.filiere.totalFees > 0 ? Math.min(100, Math.round((totalPaid / student.filiere.totalFees) * 100)) : 0;

  const recentGrades = student.grades.slice(0, 5);

  return (
    <div style={{ maxWidth: "900px" }}>
      {/* Welcome header */}
      <div
        style={{
          background: "linear-gradient(135deg, #1A1A1A 0%, #B91C2F 100%)",
          borderRadius: "16px",
          padding: "24px 28px",
          marginBottom: "20px",
          color: "white",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ position: "absolute", top: "-30px", right: "-30px", width: "140px", height: "140px", borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
        <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "1px" }}>
          Bienvenue
        </p>
        <h1 style={{ fontSize: "22px", fontWeight: "800", marginBottom: "4px" }}>
          {student.firstName} {student.lastName}
        </h1>
        <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.7)" }}>
          {student.matricule} &bull; {student.filiere.name}
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "20px" }}>
        <div>
          {/* Payment card */}
          <div
            style={{
              background: "white",
              borderRadius: "14px",
              padding: "20px",
              marginBottom: "16px",
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
              border: "1px solid #f3f4f6",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <CreditCard style={{ width: "18px", height: "18px", color: "white" }} />
                </div>
                <span style={{ fontWeight: "700", fontSize: "15px", color: "#111827" }}>Scolarite</span>
              </div>
              <span
                style={{
                  padding: "3px 10px",
                  borderRadius: "20px",
                  fontSize: "11px",
                  fontWeight: "700",
                  background: isPaidFull ? "#f0fdf4" : "#fff1f2",
                  color: isPaidFull ? "#16a34a" : "#B91C2F",
                }}
              >
                {isPaidFull ? "Solde" : `Reste : ${formatCFA(balance)}`}
              </span>
            </div>
            <div style={{ marginBottom: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ fontSize: "12px", color: "#6b7280" }}>Verse</span>
                <span style={{ fontSize: "12px", fontWeight: "700", color: "#16a34a" }}>{formatCFA(totalPaid)}</span>
              </div>
              <div style={{ background: "#f3f4f6", borderRadius: "6px", height: "8px", overflow: "hidden" }}>
                <div
                  style={{
                    width: `${pct}%`,
                    height: "100%",
                    background: isPaidFull ? "#16a34a" : pct >= 50 ? "#d97706" : "#B91C2F",
                    borderRadius: "6px",
                  }}
                />
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: "11px", color: "#9ca3af" }}>Frais totaux : {formatCFA(student.filiere.totalFees)}</span>
              <span style={{ fontSize: "11px", fontWeight: "700", color: "#374151" }}>{pct}%</span>
            </div>
          </div>

          {/* Recent grades */}
          {recentGrades.length > 0 && (
            <div
              style={{
                background: "white",
                borderRadius: "14px",
                boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                overflow: "hidden",
                border: "1px solid #f3f4f6",
              }}
            >
              <div style={{ padding: "14px 20px", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <BookOpen style={{ width: "16px", height: "16px", color: "#B91C2F" }} />
                  <span style={{ fontWeight: "700", fontSize: "14px", color: "#111827" }}>Mes notes recentes</span>
                </div>
                <Link href="/examens" style={{ fontSize: "11px", color: "#B91C2F", textDecoration: "none", fontWeight: "600", display: "flex", alignItems: "center", gap: "3px" }}>
                  Voir tout <ArrowRight style={{ width: "11px", height: "11px" }} />
                </Link>
              </div>
              {recentGrades.map((g, i) => {
                const note = g.noteFinal;
                const passed = note != null && note >= 10;
                return (
                  <div
                    key={g.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 20px",
                      borderBottom: i < recentGrades.length - 1 ? "1px solid #f9fafb" : "none",
                    }}
                  >
                    <div>
                      <p style={{ fontSize: "13px", fontWeight: "600", color: "#111827" }}>{g.course.name}</p>
                      <p style={{ fontSize: "11px", color: "#9ca3af" }}>{g.course.code} &bull; S{g.semester}</p>
                    </div>
                    <span
                      style={{
                        fontSize: "16px",
                        fontWeight: "800",
                        color: note == null ? "#9ca3af" : passed ? "#16a34a" : "#B91C2F",
                      }}
                    >
                      {note != null ? `${note.toFixed(2)}/20` : "n/a"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div
          style={{
            background: "white",
            borderRadius: "14px",
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            overflow: "hidden",
            border: "1px solid #f3f4f6",
          }}
        >
          <div style={{ padding: "14px 20px", borderBottom: "1px solid #f3f4f6" }}>
            <span style={{ fontWeight: "700", fontSize: "14px", color: "#111827" }}>Acces rapide</span>
          </div>
          <div style={{ padding: "8px" }}>
            {[
              { label: "Mes notes et bulletins", href: "/examens", icon: BookOpen },
              { label: "Mon suivi paiements", href: "/scolarite", icon: CreditCard },
              { label: "Pedagogie et emploi du temps", href: "/pedagogie", icon: FileText },
              { label: "Mon stage", href: "/stages", icon: FileText },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href} style={{ textDecoration: "none" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "12px",
                      borderRadius: "10px",
                      marginBottom: "4px",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.background = "#f9fafb")}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.background = "transparent")}
                  >
                    <div style={{ width: "34px", height: "34px", borderRadius: "8px", background: "#fff1f2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon style={{ width: "16px", height: "16px", color: "#B91C2F" }} />
                    </div>
                    <span style={{ fontSize: "13px", fontWeight: "600", color: "#374151" }}>{item.label}</span>
                    <ArrowRight style={{ width: "13px", height: "13px", color: "#d1d5db", marginLeft: "auto" }} />
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Student info summary */}
          <div style={{ margin: "8px 12px 12px", background: "#f9fafb", borderRadius: "10px", padding: "14px" }}>
            <p style={{ fontSize: "10px", color: "#9ca3af", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "10px" }}>
              Informations
            </p>
            {[
              { label: "Filiere", val: student.filiere.name },
              { label: "Niveau", val: `Annee ${student.level}` },
              { label: "Annee promo.", val: String(student.promotionYear) },
            ].map(({ label, val }) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ fontSize: "11px", color: "#6b7280" }}>{label}</span>
                <span style={{ fontSize: "11px", fontWeight: "700", color: "#111827" }}>{val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
