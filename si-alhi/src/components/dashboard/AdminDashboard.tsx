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

const STATUS_COLOR: Record<string, string> = {
  ACTIF: "#16a34a", INSCRIT: "#2563eb", ACCEPTE: "#d97706",
  ENTRETIEN: "#7c3aed", PROSPECT: "#6b7280", DOSSIER_RECU: "#0891b2",
};

export function AdminDashboard({ studentCount, teacherCount, totalCollected, recentStudents, pendingCount = 0, courseCount = 0 }: AdminDashboardProps) {
  const kpis = [
    { label: "Etudiants actifs", value: studentCount, icon: GraduationCap, color: "#2563eb" },
    { label: "Enseignants", value: teacherCount, icon: Users, color: "#16a34a" },
    { label: "Recettes 2025-2026", value: formatCFA(totalCollected), icon: TrendingUp, color: "#B91C2F", isText: true },
    { label: "En attente", value: pendingCount, icon: AlertCircle, color: "#d97706" },
  ];

  const quickActions = [
    { label: "Nouvelle admission", href: "/admission", icon: UserPlus },
    { label: "Saisir des notes", href: "/examens", icon: BookOpen },
    { label: "Scolarite", href: "/scolarite", icon: CreditCard },
    { label: "Utilisateurs", href: "/users", icon: Users },
  ];

  return (
    <div style={{ maxWidth: "1200px" }}>
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #1A1A1A 0%, #B91C2F 100%)",
        borderRadius: "16px",
        padding: "24px 28px",
        marginBottom: "20px",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        gap: "16px",
      }}>
        <div style={{ position: "absolute", top: "-40px", right: "-40px", width: "180px", height: "180px", borderRadius: "50%", background: "rgba(255,255,255,0.05)", pointerEvents: "none" }} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="ALHI" style={{ width: "48px", height: "48px", objectFit: "contain", filter: "brightness(0) invert(1)", flexShrink: 0 }} />
        <div>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "11px", marginBottom: "3px", textTransform: "uppercase", letterSpacing: "1px" }}>
            Annee academique 2025-2026
          </p>
          <h1 style={{ color: "white", fontSize: "22px", fontWeight: "800" }}>
            Tableau de bord SI-ALHI
          </h1>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px" }}>
            Africa Leadership Higher Institute, Yaounde, Cameroun
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px", marginBottom: "20px" }}>
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} style={{
              background: "var(--bg-card)",
              borderRadius: "12px",
              padding: "18px",
              border: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              gap: "14px",
            }}>
              <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: `${kpi.color}20`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon style={{ width: "22px", height: "22px", color: kpi.color }} />
              </div>
              <div>
                <p style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "2px" }}>{kpi.label}</p>
                <p style={{ fontSize: "22px", fontWeight: "800", color: kpi.color, lineHeight: 1 }}>
                  {kpi.isText ? kpi.value : (kpi.value as number).toLocaleString("fr-FR")}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "16px" }}>
        {/* Recent students */}
        <div style={{ background: "var(--bg-card)", borderRadius: "12px", border: "1px solid var(--border)", overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontWeight: "700", fontSize: "14px", color: "var(--text)" }}>Dernieres inscriptions</span>
            <Link href="/admission" style={{ fontSize: "11px", color: "#B91C2F", textDecoration: "none", fontWeight: "600", display: "flex", alignItems: "center", gap: "3px" }}>
              Voir tout <ArrowRight style={{ width: "11px", height: "11px" }} />
            </Link>
          </div>
          {recentStudents.length === 0 && (
            <p style={{ padding: "32px", textAlign: "center", color: "var(--text-muted)", fontSize: "13px" }}>Aucun etudiant recent</p>
          )}
          {recentStudents.map((s) => {
            const dot = STATUS_COLOR[s.status] ?? "#6b7280";
            return (
              <Link key={s.id} href={`/admission/${s.id}`} style={{ textDecoration: "none", display: "block" }}>
                <div className="row-hover" style={{ display: "flex", alignItems: "center", padding: "10px 18px", borderBottom: "1px solid var(--border-muted)", cursor: "pointer" }}>
                  <div style={{ width: "34px", height: "34px", borderRadius: "50%", background: "linear-gradient(135deg, #1A1A1A, #B91C2F)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "11px", fontWeight: "700", flexShrink: 0, marginRight: "10px" }}>
                    {s.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: "13px", fontWeight: "600", color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.name}</p>
                    <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>{s.matricule} &bull; {s.filiere}</p>
                  </div>
                  <span style={{ fontSize: "10px", fontWeight: "600", padding: "2px 8px", borderRadius: "20px", background: `${dot}18`, color: dot, whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: "4px" }}>
                    <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: dot }} />
                    {getStatusLabel(s.status)}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Quick actions */}
        <div style={{ background: "var(--bg-card)", borderRadius: "12px", border: "1px solid var(--border)", overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)" }}>
            <span style={{ fontWeight: "700", fontSize: "14px", color: "var(--text)" }}>Actions rapides</span>
          </div>
          <div style={{ padding: "8px" }}>
            {quickActions.map((a) => {
              const Icon = a.icon;
              return (
                <Link key={a.href} href={a.href} style={{ textDecoration: "none", display: "block" }}>
                  <div className="card-hover" style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px", borderRadius: "8px", marginBottom: "2px", cursor: "pointer" }}>
                    <div style={{ width: "34px", height: "34px", borderRadius: "8px", background: "var(--red-bg)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon style={{ width: "16px", height: "16px", color: "#B91C2F" }} />
                    </div>
                    <span style={{ fontSize: "13px", fontWeight: "500", color: "var(--text)" }}>{a.label}</span>
                    <ArrowRight style={{ width: "13px", height: "13px", color: "var(--text-muted)", marginLeft: "auto" }} />
                  </div>
                </Link>
              );
            })}
          </div>
          <div style={{ margin: "8px", background: "var(--bg-muted)", borderRadius: "8px", padding: "12px" }}>
            <p style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>Apercu</p>
            {[["Total etudiants", studentCount], ["Enseignants", teacherCount], ...(courseCount > 0 ? [["Cours", courseCount]] : [])].map(([l, v]) => (
              <div key={String(l)} style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>{l}</span>
                <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--text)" }}>{String(v)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
