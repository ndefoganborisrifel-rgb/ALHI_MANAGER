import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { BookOpen, Users, ArrowRight, ClipboardList } from "lucide-react";

export async function TeacherDashboard({ userId }: { userId: string }) {
  const teacher = await prisma.teacher.findFirst({ where: { userId } });
  const assignments = teacher
    ? await prisma.courseAssignment.findMany({
        where: { teacherId: teacher.id, academicYear: "2025-2026" },
        include: { course: { include: { filiere: true } } },
      })
    : [];

  const totalCourses = assignments.length;
  const totalCredits = assignments.reduce((sum, a) => sum + a.course.credits, 0);

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
        <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.55)", marginBottom: "3px", textTransform: "uppercase", letterSpacing: "1px" }}>Espace enseignant</p>
        <h1 style={{ fontSize: "20px", fontWeight: "800" }}>Mes cours et activités</h1>
        <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.65)" }}>Année académique 2025-2026</p>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px", marginBottom: "18px" }}>
        {[
          { label: "Cours assignés", value: totalCourses, icon: BookOpen, color: "#2563eb" },
          { label: "Crédits totaux", value: totalCredits, icon: ClipboardList, color: "#7c3aed" },
          { label: "Étudiants", value: "...", icon: Users, color: "#16a34a" },
        ].map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} style={{
              background: "var(--bg-card)",
              borderRadius: "12px",
              padding: "16px",
              border: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}>
              <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: `${kpi.color}20`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon style={{ width: "18px", height: "18px", color: kpi.color }} />
              </div>
              <div>
                <p style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "2px" }}>{kpi.label}</p>
                <p style={{ fontSize: "22px", fontWeight: "800", color: kpi.color, lineHeight: 1 }}>{kpi.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 260px", gap: "16px" }}>
        {/* Course list */}
        <div style={{ background: "var(--bg-card)", borderRadius: "12px", border: "1px solid var(--border)", overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)" }}>
            <span style={{ fontWeight: "700", fontSize: "13px", color: "var(--text)" }}>Mes cours 2025-2026</span>
          </div>
          {assignments.length === 0 && (
            <p style={{ padding: "28px", textAlign: "center", color: "var(--text-muted)", fontSize: "13px" }}>Aucun cours assigné.</p>
          )}
          {assignments.map((a, i) => (
            <div key={a.id} style={{
              display: "flex",
              alignItems: "center",
              padding: "10px 16px",
              borderBottom: i < assignments.length - 1 ? "1px solid var(--border-muted)" : "none",
              gap: "10px",
            }}>
              <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <BookOpen style={{ width: "14px", height: "14px", color: "#2563eb" }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: "600", fontSize: "13px", color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.course.name}</p>
                <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>{a.course.code} &bull; {a.course.credits} cred. &bull; S{a.semester}</p>
              </div>
              <span style={{ fontSize: "9px", fontWeight: "600", padding: "2px 7px", borderRadius: "20px", background: "#f0fdf4", color: "#16a34a", whiteSpace: "nowrap", flexShrink: 0 }}>
                {a.course.filiere.code}
              </span>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div style={{ background: "var(--bg-card)", borderRadius: "12px", border: "1px solid var(--border)", overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)" }}>
            <span style={{ fontWeight: "700", fontSize: "13px", color: "var(--text)" }}>Accès rapide</span>
          </div>
          <div style={{ padding: "6px" }}>
            {[
              { label: "Saisir les notes", href: "/examens/saisie" },
              { label: "PV de notes", href: "/examens/pv" },
              { label: "Emploi du temps", href: "/pedagogie" },
              { label: "Mes vacations", href: "/rh" },
            ].map((item) => (
              <Link key={item.href} href={item.href} style={{ textDecoration: "none", display: "block" }}>
                <div className="card-hover" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px", borderRadius: "8px", marginBottom: "2px", cursor: "pointer" }}>
                  <span style={{ fontSize: "12px", fontWeight: "500", color: "var(--text)" }}>{item.label}</span>
                  <ArrowRight style={{ width: "12px", height: "12px", color: "var(--text-muted)" }} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
