"use client";
import { signOut } from "next-auth/react";
import { Bell, LogOut, User, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NavbarProps {
  userName: string;
  userRole: string;
  onMobileMenuToggle?: () => void;
}

const roleLabels: Record<string, string> = {
  ADMIN: "Administrateur",
  SCOLARITE: "Service Scolarité",
  ENSEIGNANT: "Enseignant",
  ETUDIANT: "Étudiant",
  PARENT: "Parent",
};

export function Navbar({ userName, userRole, onMobileMenuToggle }: NavbarProps) {
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 md:px-6 py-3 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-4">
        <button
          onClick={onMobileMenuToggle}
          className="md:hidden p-2 rounded-lg hover:bg-gray-100"
        >
          <Menu className="w-5 h-5 text-gray-600" />
        </button>
        <div className="hidden md:block">
          <p className="text-xs text-gray-500">Année académique 2025-2026</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-600">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-[#B91C2F] rounded-full" />
        </button>

        <div className="flex items-center gap-2 pl-3 border-l border-gray-200">
          <div className="w-8 h-8 bg-[#B91C2F] rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-gray-900">{userName}</p>
            <p className="text-xs text-gray-500">{roleLabels[userRole] ?? userRole}</p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="text-gray-500 hover:text-red-600"
        >
          <LogOut className="w-4 h-4" />
        </Button>
      </div>
    </header>
  );
}
