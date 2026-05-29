"use client";
import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, GraduationCap, CreditCard, Calendar,
  BookOpen, ClipboardList, Package, Briefcase, UserCheck,
  Settings, ChevronLeft, ChevronRight, UserPlus, BookMarked
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: string[];
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard, roles: ["ADMIN", "SCOLARITE", "ENSEIGNANT", "ETUDIANT", "PARENT"] },
  { href: "/admission", label: "Admission", icon: UserPlus, roles: ["ADMIN", "SCOLARITE"] },
  { href: "/scolarite", label: "Scolarite", icon: CreditCard, roles: ["ADMIN", "SCOLARITE"] },
  { href: "/pedagogie", label: "Pedagogie", icon: Calendar, roles: ["ADMIN", "SCOLARITE", "ENSEIGNANT", "ETUDIANT"] },
  { href: "/pedagogie/cours", label: "Matieres", icon: BookMarked, roles: ["ADMIN", "SCOLARITE", "ENSEIGNANT"] },
  { href: "/examens", label: "Examens et Notes", icon: BookOpen, roles: ["ADMIN", "SCOLARITE", "ENSEIGNANT", "ETUDIANT", "PARENT"] },
  { href: "/discipline", label: "Discipline", icon: ClipboardList, roles: ["ADMIN", "SCOLARITE", "ENSEIGNANT", "ETUDIANT", "PARENT"] },
  { href: "/logistique", label: "Logistique", icon: Package, roles: ["ADMIN"] },
  { href: "/stages", label: "Stages", icon: Briefcase, roles: ["ADMIN", "SCOLARITE", "ETUDIANT"] },
  { href: "/rh", label: "RH et Vacations", icon: UserCheck, roles: ["ADMIN", "ENSEIGNANT"] },
  { href: "/parent", label: "Espace Parent", icon: GraduationCap, roles: ["PARENT"] },
  { href: "/users", label: "Utilisateurs", icon: Users, roles: ["ADMIN"] },
];

interface SidebarProps {
  userRole: string;
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ userRole, collapsed, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const filteredItems = navItems.filter((item) => item.roles.includes(userRole));

  // Close sidebar on navigation (mobile)
  useEffect(() => {
    if (onMobileClose) onMobileClose();
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <aside
      className={mobileOpen ? "sidebar-mobile-open" : "sidebar-mobile-closed"}
      style={{
        position: "fixed",
        left: 0,
        top: 0,
        zIndex: 40,
        height: "100vh",
        background: "#1A1A1A",
        color: "white",
        display: "flex",
        flexDirection: "column",
        transition: "width 0.3s, transform 0.3s",
        width: collapsed ? "64px" : "240px",
      }}
    >
      {/* Logo */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: collapsed ? "center" : "space-between",
        padding: "12px",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        minHeight: "60px",
      }}>
        {!collapsed && (
          <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none", minWidth: 0, flex: 1 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="ALHI" style={{ height: "34px", width: "auto", maxWidth: "120px", objectFit: "contain" }} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: "800", color: "white", fontSize: "12px", letterSpacing: "0.3px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                AFRICA LEADERSHIP
              </div>
              <div style={{ color: "rgba(255,255,255,0.45)", fontSize: "9px", letterSpacing: "0.5px" }}>
                HIGHER INSTITUTE
              </div>
            </div>
          </Link>
        )}
        {collapsed && (
          <Link href="/dashboard">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="ALHI" style={{ height: "34px", width: "auto", maxWidth: "120px", objectFit: "contain" }} />
          </Link>
        )}
        <button
          onClick={onToggle}
          style={{
            padding: "4px",
            borderRadius: "6px",
            background: "rgba(255,255,255,0.08)",
            border: "none",
            color: "rgba(255,255,255,0.5)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            marginLeft: collapsed ? "0" : "4px",
          }}
        >
          {collapsed ? <ChevronRight style={{ width: "14px", height: "14px" }} /> : <ChevronLeft style={{ width: "14px", height: "14px" }} />}
        </button>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
        {filteredItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: collapsed ? "10px" : "9px 10px",
                borderRadius: "8px",
                marginBottom: "2px",
                textDecoration: "none",
                justifyContent: collapsed ? "center" : "flex-start",
                background: isActive ? "#B91C2F" : "transparent",
                color: isActive ? "white" : "rgba(255,255,255,0.55)",
                fontSize: "13px",
                fontWeight: isActive ? "600" : "400",
                transition: "all 0.15s",
              }}
              className={!isActive ? "hover:!bg-white/10 hover:!text-white" : ""}
            >
              <Icon className="w-[18px] h-[18px] shrink-0" />
              {!collapsed && <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div style={{ padding: "8px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <Link
          href="/settings"
          title={collapsed ? "Parametres" : undefined}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: collapsed ? "10px" : "9px 10px",
            borderRadius: "8px",
            textDecoration: "none",
            justifyContent: collapsed ? "center" : "flex-start",
            background: pathname === "/settings" ? "#B91C2F" : "transparent",
            color: pathname === "/settings" ? "white" : "rgba(255,255,255,0.55)",
            fontSize: "13px",
            fontWeight: "400",
            transition: "all 0.15s",
          }}
          className={pathname !== "/settings" ? "hover:!bg-white/10 hover:!text-white" : ""}
        >
          <Settings className="w-[18px] h-[18px] shrink-0" />
          {!collapsed && <span>Parametres</span>}
        </Link>
      </div>
    </aside>
  );
}
