import Link from "next/link";
import { Users, GraduationCap, TrendingUp, AlertCircle, UserPlus, BookOpen, CreditCard, ArrowRight } from "lucide-react";
import { formatCFA, getStatusLabel } from "@/lib/utils";

interface AdminDashboardProps {
  studentCount: number;
  teacherCount: number;
  totalCollected: number;
  recentStudents: { id: string; name: string; matricule: string; filiere: string; status: string }[];
  pendingCount?: number;
  courseCount?: number;
}

const STATUS_DOT: Record<string, string> = {
  ACTIF: "#16a34a",
  INSCRIT: "#2563eb",
  ACCEPTE: "#d97706",
  ENTRETIEN: "#7c3aed",
  PROSPECT: "#6b7280",
  DOSSIER_RECU: "#0891b2",
};

export function AdminDashboard({
  studentCount,
  teacherCount,
  totalCollected,
  recentStudents,
  pendingCount = 0,
  courseCount = 0,
}: AdminDashboardProps) {
  const kpis = [
    {
      label: "Etudiants actifs",
      value: studentCount,
      icon: GraduationCap,
      accent: "#2563eb",
      bg: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
      iconBg: "#2563eb",
      trend: null,
    },
    {
      label: "Enseignants",
      value: teacherCount,
      icon: Users,
      accent: "#16a34a",
      bg: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
      iconBg: "#16a34a",
      trend: null,
    },
    {
      label: "Recettes 2025-2026",
      value: formatCFA(totalCollected),
      icon: TrendingUp,
      accent: "#B91C2F",
      bg: "linear-gradient(135deg, #fff1f2 0%, #fecdd3 100%)",
      iconBg: "#B91C2F",
      isText: true,
      trend: null,
    },
    {
      label: "En attente",
      value: pendingCount,
      icon: AlertCircle,
      accent: "#d97706",
      bg: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)",
      iconBg: "#d97706",
      trend: null,
    },
  ];

  const quickActions = [
    { label: "Nouvelle admission", href: "/admission", icon: UserPlus, color: "#B91C2F" },
    { label: "Saisir des notes", href: "/examens", icon: BookOpen, color: "#2563eb" },
    { label: "Scolarite", href: "/scolarite", icon: CreditCard, color: "#16a34a" },
    { label: "Utilisateurs", href: "/users", icon: Users, color: "#7c3aed" },
  ];

  return (
    <div style={{ maxWidth: "1200px" }}>
      {/* Header */}
      <div
        style={{
          background: "linear-gradient(135deg, #1A1A1A 0%, #B91C2F 100%)",
          borderRadius: "16px",
          padding: "28px 32px",
          marginBottom: "24px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-40px",
            right: "-40px",
            width: "200px",
            height: "200px",
            borderRadius: "50%",
            background: "rgba(255,255,255,0.05)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-60px",
            right: "100px",
            width: "160px",
            height: "160px",
            borderRadius: "50%",
            background: "rgba(255,255,255,0.04)",
            pointerEvents: "none",
          }}
        />
        <div style={{ position: "relative", zIndex: 1 }}>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "12px", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "1px" }}>
            Annee academique
          </p>
          <h1 style={{ color: "white", fontSize: "26px", fontWeight: "800", marginBottom: "4px" }}>
            Tableau de bord SI-ALHI
          </h1>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "14px" }}>
            Africa Leadership Higher Institute, Yaounde, Cameroun. 2025-2026
          </p>
        </div>
      </div>

      {/* KPI Cards */}
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
                boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                border: "1px solid rgba(255,255,255,0.8)",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: "12px", color: "#6b7280", fontWeight: "500", marginBottom: "8px" }}>
                    {kpi.label}
                  </p>
                  <p style={{ fontSize: "28px", fontWeight: "800", color: kpi.accent, lineHeight: 1 }}>
                    {kpi.isText ? kpi.value : (kpi.value as number).toLocaleString("fr-FR")}
                  </p>
                </div>
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "12px",
                    background: kpi.iconBg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Icon style={{ width: "22px", height: "22px", color: "white" }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "20px" }}>
        {/* Recent students */}
        <div
          style={{
            background: "white",
            borderRadius: "14px",
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            overflow: "hidden",
            border: "1px solid #f3f4f6",
          }}
        >
          <div
            style={{
              padding: "16px 20px",
              borderBottom: "1px solid #f3f4f6",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <h2 style={{ fontSize: "15px", fontWeight: "700", color: "#111827" }}>
              Dernieres inscriptions
            </h2>
            <Link
              href="/admission"
              style={{ fontSize: "12px", color: "#B91C2F", textDecoration: "none", fontWeight: "600", display: "flex", alignItems: "center", gap: "4px" }}
            >
              Voir tout <ArrowRight style={{ width: "12px", height: "12px" }} />
            </Link>
          </div>

          <div style={{ padding: "8px 0" }}>
            {recentStudents.length === 0 && (
              <p style={{ padding: "24px", textAlign: "center", color: "#9ca3af", fontSize: "13px" }}>
                Aucun etudiant recent
              </p>
            )}
            {recentStudents.map((student, i) => (
              <Link
                key={student.id}
                href={`/admission/${student.id}`}
                style={{ textDecoration: "none" }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "12px 20px",
                    borderBottom: i < recentStudents.length - 1 ? "1px solid #f9fafb" : "none",
                    transition: "background 0.1s",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.background = "#f9fafb")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.background = "transparent")}
                >
                  {/* Avatar circle */}
                  <div
                    style={{
                      width: "38px",
                      height: "38px",
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #1A1A1A, #B91C2F)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      fontSize: "13px",
                      fontWeight: "700",
                      flexShrink: 0,
                      marginRight: "12px",
                    }}
                  >
                    {student.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: "14px", fontWeight: "600", color: "#111827", marginBottom: "2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {student.name}
                    </p>
                    <p style={{ fontSize: "11px", color: "#9ca3af" }}>
                      {student.matricule} &bull; {student.filiere}
                    </p>
                  </div>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      fontSize: "11px",
                      fontWeight: "600",
                      padding: "3px 8px",
                      borderRadius: "20px",
                      background: `${STATUS_DOT[student.status] ?? "#6b7280"}15`,
                      color: STATUS_DOT[student.status] ?? "#6b7280",
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                    }}
                  >
                    <span
                      style={{
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        background: STATUS_DOT[student.status] ?? "#6b7280",
                      }}
                    />
                    {getStatusLabel(student.status)}
                  </span>
                </div>
              </Link>
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
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #f3f4f6" }}>
            <h2 style={{ fontSize: "15px", fontWeight: "700", color: "#111827" }}>
              Actions rapides
            </h2>
          </div>
          <div style={{ padding: "12px" }}>
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link key={action.href} href={action.href} style={{ textDecoration: "none" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "12px",
                      borderRadius: "10px",
                      marginBottom: "4px",
                      transition: "background 0.1s",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.background = "#f9fafb")}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.background = "transparent")}
                  >
                    <div
                      style={{
                        width: "38px",
                        height: "38px",
                        borderRadius: "10px",
                        background: `${action.color}15`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Icon style={{ width: "18px", height: "18px", color: action.color }} />
                    </div>
                    <span style={{ fontSize: "14px", fontWeight: "600", color: "#374151" }}>
                      {action.label}
                    </span>
                    <ArrowRight style={{ width: "14px", height: "14px", color: "#d1d5db", marginLeft: "auto" }} />
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Mini stats */}
          <div style={{ margin: "8px 12px 12px", background: "#f9fafb", borderRadius: "10px", padding: "14px" }}>
            <p style={{ fontSize: "11px", color: "#9ca3af", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "10px" }}>
              Apercu
            </p>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              <span style={{ fontSize: "12px", color: "#6b7280" }}>Total etudiants</span>
              <span style={{ fontSize: "12px", fontWeight: "700", color: "#111827" }}>{studentCount}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              <span style={{ fontSize: "12px", color: "#6b7280" }}>Enseignants</span>
              <span style={{ fontSize: "12px", fontWeight: "700", color: "#111827" }}>{teacherCount}</span>
            </div>
            {courseCount > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: "12px", color: "#6b7280" }}>Cours</span>
                <span style={{ fontSize: "12px", fontWeight: "700", color: "#111827" }}>{courseCount}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
