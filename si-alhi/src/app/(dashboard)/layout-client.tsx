"use client";
import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { RoleProvider } from "@/components/providers/RoleProvider";
import { cn } from "@/lib/utils";

interface DashboardLayoutClientProps {
  children: React.ReactNode;
  userName: string;
  userRole: string;
}

export function DashboardLayoutClient({ children, userName, userRole }: DashboardLayoutClientProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <RoleProvider role={userRole}>
      <div className="min-h-screen" style={{ background: "var(--bg)" }}>
        {/* Mobile overlay */}
        {mobileOpen && (
          <div
            className="md:hidden"
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 35 }}
            onClick={() => setMobileOpen(false)}
          />
        )}
        <Sidebar
          userRole={userRole}
          collapsed={collapsed}
          onToggle={() => setCollapsed(!collapsed)}
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
        />
        <div className={cn("transition-all duration-300", collapsed ? "md:ml-16" : "md:ml-64")}>
          <Navbar
            userName={userName}
            userRole={userRole}
            onMobileMenuToggle={() => setMobileOpen(!mobileOpen)}
          />
          <main className="p-4 md:p-6">{children}</main>
        </div>
      </div>
    </RoleProvider>
  );
}
