"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Users, GraduationCap, CreditCard, Calendar,
  BookOpen, ClipboardList, Package, Briefcase, UserCheck,
  Settings, ChevronLeft, ChevronRight, Bell, UserPlus, Building2
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
  { href: "/scolarite", label: "Scolarité", icon: CreditCard, roles: ["ADMIN", "SCOLARITE"] },
  { href: "/pedagogie", label: "Pédagogie", icon: Calendar, roles: ["ADMIN", "SCOLARITE", "ENSEIGNANT", "ETUDIANT"] },
  { href: "/examens", label: "Examens & Notes", icon: BookOpen, roles: ["ADMIN", "SCOLARITE", "ENSEIGNANT", "ETUDIANT", "PARENT"] },
  { href: "/discipline", label: "Discipline", icon: ClipboardList, roles: ["ADMIN", "SCOLARITE", "ENSEIGNANT", "ETUDIANT", "PARENT"] },
  { href: "/logistique", label: "Logistique", icon: Package, roles: ["ADMIN"] },
  { href: "/stages", label: "Stages", icon: Briefcase, roles: ["ADMIN", "SCOLARITE", "ETUDIANT"] },
  { href: "/rh", label: "RH & Vacations", icon: UserCheck, roles: ["ADMIN", "ENSEIGNANT"] },
  { href: "/parent", label: "Espace Parent", icon: GraduationCap, roles: ["PARENT"] },
  { href: "/users", label: "Utilisateurs", icon: Users, roles: ["ADMIN"] },
];

interface SidebarProps {
  userRole: string;
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ userRole, collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const filteredItems = navItems.filter((item) => item.roles.includes(userRole));

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-[#1A1A1A] text-white transition-all duration-300 flex flex-col",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center shrink-0 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="ALHI" className="w-8 h-8 object-contain" />
            </div>
            <div className="text-xs leading-tight min-w-0">
              <div className="font-bold text-white truncate">AFRICA LEADERSHIP</div>
              <div className="text-gray-400 truncate">HIGHER INSTITUTE</div>
            </div>
          </Link>
        )}
        {collapsed && (
          <Link href="/dashboard" className="mx-auto">
            <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="ALHI" className="w-8 h-8 object-contain" />
            </div>
          </Link>
        )}
        <button
          onClick={onToggle}
          className={cn("p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors", collapsed && "mx-auto mt-2")}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 space-y-1 px-2">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                isActive
                  ? "bg-[#B91C2F] text-white"
                  : "text-gray-400 hover:bg-white/10 hover:text-white",
                collapsed && "justify-center px-2"
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="border-t border-white/10 p-2 space-y-1">
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
            pathname === "/settings" ? "bg-[#B91C2F] text-white" : "text-gray-400 hover:bg-white/10 hover:text-white",
            collapsed && "justify-center px-2"
          )}
          title={collapsed ? "Paramètres" : undefined}
        >
          <Settings className="w-5 h-5 shrink-0" />
          {!collapsed && <span>Paramètres</span>}
        </Link>
      </div>
    </aside>
  );
}
