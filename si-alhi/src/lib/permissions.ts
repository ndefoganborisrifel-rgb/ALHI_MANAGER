import { auth } from "@/auth";
import { Role } from "@/generated/prisma/enums";
import { redirect } from "next/navigation";

export type { Role };

export async function requireAuth() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session;
}

export async function requireRole(...roles: Role[]) {
  const session = await requireAuth();
  const userRole = session.user.role as Role;
  if (!roles.includes(userRole)) redirect("/dashboard");
  return session;
}

export async function requireAdmin() {
  return requireRole(Role.ADMIN);
}

export async function requireAdminOrScolarite() {
  return requireRole(Role.ADMIN, Role.SCOLARITE);
}

export function canAccessModule(role: string, module: string): boolean {
  const permissions: Record<string, string[]> = {
    admission: ["ADMIN", "SCOLARITE"],
    scolarite: ["ADMIN", "SCOLARITE"],
    pedagogie: ["ADMIN", "SCOLARITE", "ENSEIGNANT", "ETUDIANT"],
    examens: ["ADMIN", "SCOLARITE", "ENSEIGNANT", "ETUDIANT", "PARENT"],
    discipline: ["ADMIN", "SCOLARITE", "ENSEIGNANT", "ETUDIANT", "PARENT"],
    logistique: ["ADMIN"],
    stages: ["ADMIN", "SCOLARITE", "ETUDIANT"],
    rh: ["ADMIN", "ENSEIGNANT"],
    users: ["ADMIN"],
    parent: ["PARENT"],
  };
  return permissions[module]?.includes(role) ?? false;
}
