import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export type Role = "ADMIN" | "SCOLARITE" | "ENSEIGNANT" | "ETUDIANT" | "PARENT";

export type SessionUser = {
  id: string;
  role: Role;
};

type GuardResult =
  | { ok: true; user: SessionUser }
  | { ok: false; response: NextResponse };

/**
 * Loads the session and checks the role against an allow-list.
 * Returns the typed user when allowed, or a ready-to-return 401/403 response.
 * Every mutating route must call this before touching Prisma, even when the UI
 * already hides the action: the API is the real security boundary.
 */
export async function requireRole(roles: Role[]): Promise<GuardResult> {
  const session = await auth();
  if (!session?.user) {
    return { ok: false, response: NextResponse.json({ error: "Non authentifie" }, { status: 401 }) };
  }
  const user = { id: session.user.id, role: session.user.role as Role };
  if (!roles.includes(user.role)) {
    return { ok: false, response: NextResponse.json({ error: "Acces refuse" }, { status: 403 }) };
  }
  return { ok: true, user };
}

/** Resolves the Teacher row tied to a User account, if any. */
export async function getTeacherByUserId(userId: string) {
  return prisma.teacher.findUnique({ where: { userId }, select: { id: true } });
}

/** Course ids the teacher (resolved from the user account) is assigned to. */
export async function getTeacherCourseIds(userId: string): Promise<string[]> {
  const teacher = await getTeacherByUserId(userId);
  if (!teacher) return [];
  const assignments = await prisma.courseAssignment.findMany({
    where: { teacherId: teacher.id },
    select: { courseId: true },
  });
  return assignments.map((a) => a.courseId);
}

/** True when the teacher account is assigned to teach the given course. */
export async function teacherOwnsCourse(userId: string, courseId: string): Promise<boolean> {
  const teacher = await getTeacherByUserId(userId);
  if (!teacher) return false;
  const count = await prisma.courseAssignment.count({
    where: { teacherId: teacher.id, courseId },
  });
  return count > 0;
}
