import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { calculateFinalGrade } from "@/lib/grade-calculator";

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

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (!["ADMIN", "ENSEIGNANT"].includes(session.user.role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = upsertSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Données invalides" }, { status: 400 });

  const { cc1, cc2, examScore, rattrapageScore, studentId, courseId, session: gradeSession, academicYear, semester } = parsed.data;
  const noteFinal = calculateFinalGrade(cc1, cc2, examScore, rattrapageScore);

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

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get("studentId");
  const courseId = searchParams.get("courseId");

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
