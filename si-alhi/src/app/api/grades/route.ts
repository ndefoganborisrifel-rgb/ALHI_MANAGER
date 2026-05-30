import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { calculateFinalGrade } from "@/lib/grade-calculator";
import { requireRole, getTeacherCourseIds } from "@/lib/authz";

const upsertSchema = z.object({
  studentId: z.string().cuid(),
  courseId: z.string().cuid(),
  cc1: z.number().min(0).max(20).optional().nullable(),
  cc2: z.number().min(0).max(20).optional().nullable(),
  examScore: z.number().min(0).max(20).optional().nullable(),
  rattrapageScore: z.number().min(0).max(20).optional().nullable(),
  session: z.enum(["NORMALE", "RATTRAPAGE"]).default("NORMALE"),
  academicYear: z.string().default("2025-2026"),
  semester: z.number().int().min(1).max(2).default(1),
});

const deleteSchema = z.object({
  studentId: z.string().cuid(),
  courseId: z.string().cuid(),
  session: z.enum(["NORMALE", "RATTRAPAGE"]).default("NORMALE"),
  academicYear: z.string().default("2025-2026"),
  semester: z.number().int().min(1).max(2).default(1),
});

export async function POST(req: Request) {
  const guard = await requireRole(["ADMIN", "SCOLARITE", "ENSEIGNANT"]);
  if (!guard.ok) return guard.response;

  const body = await req.json();
  const parsed = upsertSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Donnees invalides" }, { status: 400 });

  // A teacher may only touch grades for courses they are assigned to. We bind
  // the allowed course ids into a Zod refinement so the ownership rule is part
  // of validation, not an afterthought.
  if (guard.user.role === "ENSEIGNANT") {
    const ownedCourseIds = await getTeacherCourseIds(guard.user.id);
    const ownership = upsertSchema
      .refine((d) => ownedCourseIds.includes(d.courseId), {
        message: "Vous ne pouvez gerer que les notes de vos matieres",
        path: ["courseId"],
      })
      .safeParse(parsed.data);
    if (!ownership.success) {
      return NextResponse.json({ error: ownership.error.issues[0]?.message ?? "Acces refuse" }, { status: 403 });
    }
  }

  const { cc1, cc2, examScore, rattrapageScore, studentId, courseId, session: gradeSession, academicYear, semester } = parsed.data;

  // Pour le rattrapage : les CC proviennent de la session normale, seul l'examen est repasse.
  let effectiveCc1 = cc1;
  let effectiveCc2 = cc2;
  if (gradeSession === "RATTRAPAGE") {
    const normaleGrade = await prisma.grade.findFirst({
      where: { studentId, courseId, session: "NORMALE", academicYear, semester },
      select: { cc1: true, cc2: true },
    });
    if (normaleGrade) {
      effectiveCc1 = normaleGrade.cc1;
      effectiveCc2 = normaleGrade.cc2;
    }
  }
  const noteFinal = calculateFinalGrade(effectiveCc1, effectiveCc2, examScore ?? rattrapageScore, null);

  const grade = await prisma.grade.upsert({
    where: {
      studentId_courseId_academicYear_semester_session: {
        studentId, courseId, academicYear, semester, session: gradeSession,
      },
    },
    update: { cc1, cc2, examScore, rattrapageScore, noteFinal },
    create: { studentId, courseId, cc1, cc2, examScore, rattrapageScore, noteFinal, session: gradeSession, academicYear, semester },
  });

  return NextResponse.json(grade, { status: 201 });
}

export async function DELETE(req: Request) {
  const guard = await requireRole(["ADMIN", "SCOLARITE", "ENSEIGNANT"]);
  if (!guard.ok) return guard.response;

  const body = await req.json();
  const parsed = deleteSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Donnees invalides" }, { status: 400 });

  if (guard.user.role === "ENSEIGNANT") {
    const ownedCourseIds = await getTeacherCourseIds(guard.user.id);
    if (!ownedCourseIds.includes(parsed.data.courseId)) {
      return NextResponse.json({ error: "Vous ne pouvez gerer que les notes de vos matieres" }, { status: 403 });
    }
  }

  const { studentId, courseId, session: gradeSession, academicYear, semester } = parsed.data;
  await prisma.grade.deleteMany({
    where: { studentId, courseId, session: gradeSession, academicYear, semester },
  });

  return NextResponse.json({ success: true });
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non authentifie" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get("studentId");
  const courseId = searchParams.get("courseId");

  // Students may only read their own grades.
  if (session.user.role === "ETUDIANT") {
    const self = await prisma.student.findFirst({ where: { userId: session.user.id }, select: { id: true } });
    if (!self || (studentId && studentId !== self.id)) {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }
    const grades = await prisma.grade.findMany({
      where: { studentId: self.id, ...(courseId ? { courseId } : {}) },
      include: { course: true, student: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(grades);
  }

  const grades = await prisma.grade.findMany({
    where: {
      ...(studentId ? { studentId } : {}),
      ...(courseId ? { courseId } : {}),
    },
    include: { course: true, student: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(grades);
}
