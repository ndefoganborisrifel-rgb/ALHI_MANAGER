"use client";
import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { cn } from "@/lib/utils";

interface DashboardLayoutClientProps {
  children: React.ReactNode;
  userName: string;
  userRole: string;
}

export function DashboardLayoutClient({ children, userName, userRole }: DashboardLayoutClientProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <Sidebar
        userRole={userRole}
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
      />
      <div className={cn("transition-all duration-300", collapsed ? "ml-16" : "ml-64")}>
        <Navbar userName={userName} userRole={userRole} />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
