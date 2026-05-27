"use client";
import { createContext, useContext } from "react";

export type Role = "ADMIN" | "SCOLARITE" | "ENSEIGNANT" | "ETUDIANT" | "PARENT";

const RoleContext = createContext<Role>("ETUDIANT");

export function RoleProvider({ role, children }: { role: string; children: React.ReactNode }) {
  return <RoleContext.Provider value={role as Role}>{children}</RoleContext.Provider>;
}

export function useRole(): Role {
  return useContext(RoleContext);
}

/** True for staff who may manage academic data (timetable, students, etc.). */
export function useCanManage(): boolean {
  const role = useRole();
  return role === "ADMIN" || role === "SCOLARITE";
}
