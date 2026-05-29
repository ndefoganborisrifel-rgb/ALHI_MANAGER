import Link from "next/link";
import {
  Users, GraduationCap, TrendingUp, AlertCircle,
  UserPlus, BookOpen, CreditCard, ArrowRight,
  Calendar, Package, BarChart3, Clock,
} from "lucide-react";
import { formatCFA, getStatusLabel } from "@/lib/utils";

interface AdminDashboardProps {
  studentCount: number;
  teacherCount: number;
  totalCollected: number;
  totalExpected: number;
  recentStudents: { id: string; name: string; matricule: string; filiere: string; filiereCode: string; status: string; createdAt: string }[];
  pendingCount?: number;
  courseCount?: number;
  userName?: string;
  filiereStats: { code: string; name: string; count: number }[];
}

const STATUS_COLOR: Record<string, string> = {
  ACTIF: "#16a34a", INSCRIT: "#2563eb", ACCEPTE: "#d97706",
  ENTRETIEN: "#7c3aed", PROSPECT: "#6b7280", DOSSIER_RECU: "#0891b2",
};

const FILIERE_COLOR: Record<string, { bg: string; text: string; bar: string }> = {
  PE:  { bg: "#eff6ff", text: "#1d4ed8", bar: "#2563eb" },
  PB:  { bg: "#f0fdf4", text: "#15803d", bar: "#16a34a" },
  MBA: { bg: "#fef2f2", text: "#b91c1c", bar: "#B91C2F" },
  BBA: { bg: "#fff7ed", text: "#b45309", bar: "#d97706" },
};
const FILIERE_DEFAULT = { bg: "#f3f4f6", text: "#374151", bar: "#6b7280" };

function getFiliereColors(code: string) {
  return FILIERE_COLOR[code] ?? FILIERE_DEFAULT;
}

export function AdminDashboard({
  studentCount, teacherCount, totalCollected, totalExpected,
  recentStudents, pendingCount = 0, courseCount = 0,
  userName = "Directrice", filiereStats,
}: AdminDashboardProps) {

  const collectionRate = totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0;
  const maxCount = Math.max(...filiereStats.map((f) => f.count), 1);

  const now = new Date();
  const dateLabel = now.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <div style={{ maxWidth: "1280px" }}>

      {/* ── HERO BANNER ─────────────────────────────────────────────── */}
      <div style={{
        background: "linear-gradient(135deg, #0f0f0f 0%, #1A1A1A 40%, #8B1424 80%, #B91C2F 100%)",
        borderRadius: "20px",
        padding: "28px 32px",
        marginBottom: "22px",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        gap: "20px",
      }}>
        {/* Decorative circles */}
        <div style={{ position: "absolute", top: "-60px", right: "-60px", width: "220px", height: "220px", borderRadius: "50%", background: "rgba(255,255,255,0.04)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "-30px", right: "180px", width: "120px", height: "120px", borderRadius: "50%", background: "rgba(255,255,255,0.03)", pointerEvents: "none" }} />
        <svg style={{ position: "absolute", bottom: 0, left: 0, width: "100%", height: "80px", opacity: 0.12, pointerEvents: "none" }} viewBox="0 0 1200 80" preserveAspectRatio="none">
          <path d="M0,60 Q300,20 600,50 T1200,40 L1200,80 L0,80Z" fill="white" />
        </svg>

        {/* Logo */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="ALHI" style={{ width: "64px", height: "64px", objectFit: "contain", filter: "brightness(0) invert(1)", flexShrink: 0, position: "relative", zIndex: 1 }} />

        <div style={{ position: "relative", zIndex: 1 }}>
          <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "2px", marginBottom: "4px" }}>
            Annee academique 2025-2026
          </p>
          <h1 style={{ color: "white", fontSize: "26px", fontWeight: "900", marginBottom: "4px", letterSpacing: "-0.5px" }}>
            Bienvenue, {userName.split(" ")[0]}
          </h1>
          <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "13px" }}>
            Africa Leadership Higher Institute, Yaounde, Cameroun
          </p>
        </div>

        <div style={{ marginLeft: "auto", textAlign: "right", position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", justifyContent: "flex-end", marginBottom: "4px" }}>
            <Clock style={{ width: "12px", height: "12px", color: "rgba(255,255,255,0.5)" }} />
            <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "11px", textTransform: "capitalize" }}>{dateLabel}</p>
          </div>
          <p style={{ color: "rgba(255,255,255,0.90)", fontSize: "13px", fontWeight: "600" }}>SI-ALHI v1.0</p>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "10px" }}>Systeme d&apos;Information</p>
        </div>
      </div>

      {/* ── KPI CARDS ───────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px", marginBottom: "20px" }}>
        {[
          { label: "Etudiants actifs", value: studentCount.toLocaleString("fr-FR"), icon: GraduationCap, color: "#2563eb", bg: "#eff6ff", sub: `${courseCount} cours` },
          { label: "En attente admiss.", value: pendingCount.toLocaleString("fr-FR"), icon: AlertCircle, color: "#d97706", bg: "#fff7ed", sub: "dossiers a traiter" },
          { label: "Enseignants", value: teacherCount.toLocaleString("fr-FR"), icon: Users, color: "#16a34a", bg: "#f0fdf4", sub: "corps enseignant" },
          { label: "Recettes collectees", value: formatCFA(totalCollected), icon: TrendingUp, color: "#B91C2F", bg: "#fef2f2", sub: `${collectionRate}% de l'objectif` },
        ].map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} style={{
              background: "var(--bg-card)",
              borderRadius: "14px",
              padding: "18px 20px",
              border: "1px solid var(--border)",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <p style={{ fontSize: "11px", fontWeight: "600", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>{kpi.label}</p>
                <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: kpi.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon style={{ width: "18px", height: "18px", color: kpi.color }} />
                </div>
              </div>
              <div>
                <p style={{ fontSize: "26px", fontWeight: "900", color: kpi.color, lineHeight: 1, letterSpacing: "-0.5px" }}>{kpi.value}</p>
                <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "3px" }}>{kpi.sub}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── MIDDLE ROW ──────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 300px", gap: "16px", marginBottom: "16px" }}>

        {/* Répartition par filière */}
        <div style={{ background: "var(--bg-card)", borderRadius: "14px", border: "1px solid var(--border)", overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "8px" }}>
            <BarChart3 style={{ width: "15px", height: "15px", color: "#B91C2F" }} />
            <span style={{ fontWeight: "700", fontSize: "13px", color: "var(--text)" }}>Etudiants par filiere</span>
          </div>
          <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: "14px" }}>
            {filiereStats.map((f) => {
              const c = getFiliereColors(f.code);
              const pct = Math.round((f.count / maxCount) * 100);
              return (
                <div key={f.code}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "5px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "10px", fontWeight: "700", padding: "2px 7px", borderRadius: "12px", background: c.bg, color: c.text, letterSpacing: "0.3px" }}>{f.code}</span>
                      <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: "500" }}>{f.name}</span>
                    </div>
                    <span style={{ fontSize: "16px", fontWeight: "800", color: c.bar }}>{f.count}</span>
                  </div>
                  <div style={{ height: "7px", background: "var(--bg-muted)", borderRadius: "4px", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: c.bar, borderRadius: "4px", transition: "width 0.6s ease" }} />
                  </div>
                </div>
              );
            })}
            {filiereStats.length === 0 && <p style={{ fontSize: "13px", color: "var(--text-muted)", textAlign: "center", padding: "16px" }}>Aucune donnee</p>}
          </div>
        </div>

        {/* Recouvrement financier */}
        <div style={{ background: "var(--bg-card)", borderRadius: "14px", border: "1px solid var(--border)", overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "8px" }}>
            <CreditCard style={{ width: "15px", height: "15px", color: "#B91C2F" }} />
            <span style={{ fontWeight: "700", fontSize: "13px", color: "var(--text)" }}>Recouvrement 2025-2026</span>
          </div>
          <div style={{ padding: "20px 18px" }}>
            {/* Donut-like gauge */}
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <div style={{ position: "relative", display: "inline-block" }}>
                <svg width="120" height="120" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="48" fill="none" stroke="var(--bg-muted)" strokeWidth="12" />
                  <circle
                    cx="60" cy="60" r="48" fill="none"
                    stroke="#B91C2F" strokeWidth="12"
                    strokeDasharray={`${Math.min(collectionRate, 100) * 3.016} 301.6`}
                    strokeLinecap="round"
                    transform="rotate(-90 60 60)"
                  />
                </svg>
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: "22px", fontWeight: "900", color: "#B91C2F" }}>{collectionRate}%</span>
                  <span style={{ fontSize: "9px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>collecte</span>
                </div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", background: "var(--bg-muted)", borderRadius: "8px" }}>
                <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>Montant collecte</span>
                <span style={{ fontSize: "12px", fontWeight: "700", color: "#16a34a" }}>{formatCFA(totalCollected)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", background: "var(--bg-muted)", borderRadius: "8px" }}>
                <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>Objectif theorique</span>
                <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--text)" }}>{formatCFA(totalExpected)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", background: "#fef2f2", borderRadius: "8px" }}>
                <span style={{ fontSize: "11px", color: "#b91c1c" }}>Reste a recouvrer</span>
                <span style={{ fontSize: "12px", fontWeight: "700", color: "#B91C2F" }}>{formatCFA(Math.max(totalExpected - totalCollected, 0))}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Acces rapides */}
        <div style={{ background: "var(--bg-card)", borderRadius: "14px", border: "1px solid var(--border)", overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)" }}>
            <span style={{ fontWeight: "700", fontSize: "13px", color: "var(--text)" }}>Acces rapides</span>
          </div>
          <div style={{ padding: "10px" }}>
            {[
              { label: "Nouvelle admission", href: "/admission/nouveau", icon: UserPlus, color: "#2563eb" },
              { label: "Saisie de notes", href: "/examens/saisie", icon: BookOpen, color: "#16a34a" },
              { label: "Scolarite", href: "/scolarite", icon: CreditCard, color: "#B91C2F" },
              { label: "Planning", href: "/pedagogie", icon: Calendar, color: "#7c3aed" },
              { label: "Logistique", href: "/logistique", icon: Package, color: "#d97706" },
              { label: "Utilisateurs", href: "/users", icon: Users, color: "#0891b2" },
            ].map((a) => {
              const Icon = a.icon;
              return (
                <Link key={a.href} href={a.href} style={{ textDecoration: "none", display: "block" }}>
                  <div className="card-hover" style={{ display: "flex", alignItems: "center", gap: "10px", padding: "9px 10px", borderRadius: "8px", marginBottom: "2px" }}>
                    <div style={{ width: "30px", height: "30px", borderRadius: "8px", background: `${a.color}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon style={{ width: "14px", height: "14px", color: a.color }} />
                    </div>
                    <span style={{ fontSize: "12px", fontWeight: "500", color: "var(--text)", flex: 1 }}>{a.label}</span>
                    <ArrowRight style={{ width: "11px", height: "11px", color: "var(--text-muted)" }} />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── RECENT STUDENTS ─────────────────────────────────────────── */}
      <div style={{ background: "var(--bg-card)", borderRadius: "14px", border: "1px solid var(--border)", overflow: "hidden" }}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <GraduationCap style={{ width: "15px", height: "15px", color: "#B91C2F" }} />
            <span style={{ fontWeight: "700", fontSize: "13px", color: "var(--text)" }}>Dernieres inscriptions</span>
          </div>
          <Link href="/admission" style={{ fontSize: "11px", color: "#B91C2F", textDecoration: "none", fontWeight: "600", display: "flex", alignItems: "center", gap: "4px" }}>
            Voir tout <ArrowRight style={{ width: "11px", height: "11px" }} />
          </Link>
        </div>

        {recentStudents.length === 0 ? (
          <p style={{ padding: "32px", textAlign: "center", color: "var(--text-muted)", fontSize: "13px" }}>Aucun etudiant recent</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "var(--bg-muted)" }}>
                  {["Etudiant", "Matricule", "Filiere", "Statut", "Date inscription"].map((h) => (
                    <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: "10px", fontWeight: "700", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentStudents.map((s, i) => {
                  const dot = STATUS_COLOR[s.status] ?? "#6b7280";
                  const fc = getFiliereColors(s.filiereCode);
                  const initials = s.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
                  const dateStr = new Date(s.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
                  return (
                    <tr key={s.id} style={{ borderBottom: i < recentStudents.length - 1 ? "1px solid var(--border-muted)" : "none" }}>
                      <td style={{ padding: "10px 16px" }}>
                        <Link href={`/admission/${s.id}`} style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "10px" }}>
                          <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "linear-gradient(135deg, #1A1A1A, #B91C2F)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "10px", fontWeight: "800", flexShrink: 0 }}>
                            {initials}
                          </div>
                          <span style={{ fontSize: "13px", fontWeight: "600", color: "var(--text)", whiteSpace: "nowrap" }}>{s.name}</span>
                        </Link>
                      </td>
                      <td style={{ padding: "10px 16px" }}>
                        <code style={{ fontSize: "11px", fontFamily: "monospace", color: "var(--text-secondary)", background: "var(--bg-muted)", padding: "2px 6px", borderRadius: "4px" }}>{s.matricule}</code>
                      </td>
                      <td style={{ padding: "10px 16px" }}>
                        <span style={{ fontSize: "11px", fontWeight: "600", padding: "3px 8px", borderRadius: "12px", background: fc.bg, color: fc.text }}>{s.filiere}</span>
                      </td>
                      <td style={{ padding: "10px 16px" }}>
                        <span style={{ fontSize: "11px", fontWeight: "600", padding: "3px 9px", borderRadius: "20px", background: `${dot}15`, color: dot, display: "inline-flex", alignItems: "center", gap: "4px" }}>
                          <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: dot }} />
                          {getStatusLabel(s.status)}
                        </span>
                      </td>
                      <td style={{ padding: "10px 16px" }}>
                        <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{dateStr}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
