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
          Espace enseignant
        </p>
        <h1 style={{ fontSize: "22px", fontWeight: "800", marginBottom: "4px" }}>
          Mes cours et activites
        </h1>
        <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.7)" }}>
          Annee academique 2025-2026
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "20px" }}>
        {[
          { label: "Cours assignes", value: totalCourses, icon: BookOpen, color: "#2563eb", bg: "linear-gradient(135deg, #eff6ff, #dbeafe)" },
          { label: "Credits totaux", value: totalCredits, icon: ClipboardList, color: "#7c3aed", bg: "linear-gradient(135deg, #faf5ff, #ede9fe)" },
          { label: "Etudiants", value: teacher ? null : 0, icon: Users, color: "#16a34a", bg: "linear-gradient(135deg, #f0fdf4, #dcfce7)" },
        ].map((kpi) => {
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
                <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: kpi.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon style={{ width: "20px", height: "20px", color: "white" }} />
                </div>
                <div>
                  <p style={{ fontSize: "11px", color: "#6b7280", marginBottom: "2px" }}>{kpi.label}</p>
                  <p style={{ fontSize: "24px", fontWeight: "800", color: kpi.color, lineHeight: 1 }}>
                    {kpi.value ?? "n/a"}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: "20px" }}>
        {/* Course list */}
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
            <span style={{ fontWeight: "700", fontSize: "14px", color: "#111827" }}>Mes cours 2025-2026</span>
          </div>
          <div>
            {assignments.length === 0 && (
              <p style={{ padding: "32px", textAlign: "center", color: "#9ca3af", fontSize: "13px" }}>
                Aucun cours assigne pour cette annee.
              </p>
            )}
            {assignments.map((a, i) => (
              <div
                key={a.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "12px 20px",
                  borderBottom: i < assignments.length - 1 ? "1px solid #f9fafb" : "none",
                  gap: "12px",
                }}
              >
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "8px",
                    background: "#eff6ff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <BookOpen style={{ width: "16px", height: "16px", color: "#2563eb" }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: "600", fontSize: "13px", color: "#111827", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {a.course.name}
                  </p>
                  <p style={{ fontSize: "11px", color: "#9ca3af" }}>
                    {a.course.code} &bull; {a.course.credits} cred. &bull; S{a.semester}
                  </p>
                </div>
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: "600",
                    padding: "2px 8px",
                    borderRadius: "20px",
                    background: "#f0fdf4",
                    color: "#16a34a",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                  }}
                >
                  {a.course.filiere.code}
                </span>
              </div>
            ))}
          </div>
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
              { label: "Saisir les notes", href: "/examens/saisie" },
              { label: "Voir les bulletins", href: "/examens/bulletins" },
              { label: "Emploi du temps", href: "/pedagogie" },
              { label: "Mes vacations", href: "/rh" },
            ].map((item) => (
              <Link key={item.href} href={item.href} style={{ textDecoration: "none" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px",
                    borderRadius: "10px",
                    marginBottom: "4px",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.background = "#f9fafb")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.background = "transparent")}
                >
                  <span style={{ fontSize: "13px", fontWeight: "600", color: "#374151" }}>{item.label}</span>
                  <ArrowRight style={{ width: "13px", height: "13px", color: "#d1d5db" }} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
