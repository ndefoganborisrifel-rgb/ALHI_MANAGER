"use client";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { ReactNode, CSSProperties } from "react";

/* ──────────────────────────────────────────────────────────────────────
   Primitives de design partagees, SI-ALHI.
   Styles inline + variables CSS (var(--...)) pour le support du mode sombre.
   Aucun tiret long ni double tiret dans les libelles.
   ────────────────────────────────────────────────────────────────────── */

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  backHref?: string;
  icon?: ReactNode;
  actions?: ReactNode;
}

/** En-tete de page standard: petit retour, titre, sous-titre, actions a droite. */
export function PageHeader({ title, subtitle, backHref, icon, actions }: PageHeaderProps) {
  return (
    <div style={{ marginBottom: "22px" }}>
      {backHref && (
        <Link
          href={backHref}
          style={{ display: "inline-flex", alignItems: "center", gap: "5px", color: "var(--text-muted)", fontSize: "12px", fontWeight: 600, textDecoration: "none", marginBottom: "10px" }}
        >
          <ArrowLeft style={{ width: "13px", height: "13px" }} />
          Retour
        </Link>
      )}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
          {icon && (
            <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "var(--red-bg)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {icon}
            </div>
          )}
          <div style={{ minWidth: 0 }}>
            <h1 style={{ fontSize: "22px", fontWeight: 800, color: "var(--text)", letterSpacing: "-0.5px", lineHeight: 1.15 }}>{title}</h1>
            {subtitle && <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "3px" }}>{subtitle}</p>}
          </div>
        </div>
        {actions && <div style={{ display: "flex", gap: "8px", alignItems: "center", flexShrink: 0 }}>{actions}</div>}
      </div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  color: string;   // couleur d'accent, ex: "#2563eb"
  bg: string;      // fond de l'icone, ex: "#eff6ff"
  sub?: string;
}

/** Carte KPI: libelle, grande valeur coloree, icone, sous-texte optionnel. */
export function StatCard({ label, value, icon, color, bg, sub }: StatCardProps) {
  return (
    <div style={{ background: "var(--bg-card)", borderRadius: "14px", padding: "18px 20px", border: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: "10px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</p>
        <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{icon}</div>
      </div>
      <div>
        <p style={{ fontSize: "26px", fontWeight: 900, color, lineHeight: 1, letterSpacing: "-0.5px" }}>{value}</p>
        {sub && <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "3px" }}>{sub}</p>}
      </div>
    </div>
  );
}

/** Conteneur carte standard, en-tete optionnel. */
export function Panel({ title, icon, action, children, style }: { title?: string; icon?: ReactNode; action?: ReactNode; children: ReactNode; style?: CSSProperties }) {
  return (
    <div style={{ background: "var(--bg-card)", borderRadius: "14px", border: "1px solid var(--border)", overflow: "hidden", ...style }}>
      {(title || action) && (
        <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
            {icon}
            {title && <span style={{ fontWeight: 700, fontSize: "13px", color: "var(--text)" }}>{title}</span>}
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

/** Bouton primaire rouge ALHI. */
export function PrimaryButton({ children, onClick, type = "button", disabled, style }: { children: ReactNode; onClick?: () => void; type?: "button" | "submit"; disabled?: boolean; style?: CSSProperties }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{ background: disabled ? "var(--bg-muted)" : "#B91C2F", color: disabled ? "var(--text-muted)" : "white", border: "none", borderRadius: "10px", padding: "10px 18px", fontSize: "13px", fontWeight: 700, cursor: disabled ? "not-allowed" : "pointer", display: "inline-flex", alignItems: "center", gap: "6px", transition: "background 0.15s", ...style }}
    >
      {children}
    </button>
  );
}

/** Badge de statut colore. La couleur sert au texte et au fond (en transparence). */
export function StatusBadge({ label, color, dot = true }: { label: string; color: string; dot?: boolean }) {
  return (
    <span style={{ fontSize: "11px", fontWeight: 600, padding: "3px 9px", borderRadius: "20px", background: `${color}18`, color, display: "inline-flex", alignItems: "center", gap: "5px", whiteSpace: "nowrap" }}>
      {dot && <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: color }} />}
      {label}
    </span>
  );
}

/** Etat vide: icone, message, action optionnelle. */
export function EmptyState({ icon, message, action }: { icon: ReactNode; message: string; action?: ReactNode }) {
  return (
    <div style={{ padding: "44px 24px", textAlign: "center" }}>
      <div style={{ display: "inline-flex", width: "52px", height: "52px", borderRadius: "14px", background: "var(--bg-muted)", alignItems: "center", justifyContent: "center", marginBottom: "12px", color: "var(--text-muted)" }}>{icon}</div>
      <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: action ? "16px" : 0 }}>{message}</p>
      {action}
    </div>
  );
}
