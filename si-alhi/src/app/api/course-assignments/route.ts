import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSchema = z.object({
  courseId: z.string().cuid(),
  teacherId: z.string().cuid(),
  academicYear: z.string().min(1),
  semester: z.number().int().min(1),
});

const deleteSchema = z.object({
  id: z.string().cuid(),
});

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const filiereId = searchParams.get("filiereId");
  const academicYear = searchParams.get("academicYear");

  const assignments = await prisma.courseAssignment.findMany({
    where: {
      ...(filiereId ? { OR: [{ course: { filiereId } }, { course: { courseFilieres: { some: { filiereId } } } }] } : {}),
      ...(academicYear ? { academicYear } : {}),
    },
    include: {
      course: { include: { filiere: true, courseFilieres: { select: { filiereId: true } } } },
      teacher: true,
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(assignments);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (!["ADMIN", "SCOLARITE"].includes(session.user.role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Données invalides", details: parsed.error.issues }, { status: 400 });

  const { courseId, teacherId, academicYear, semester } = parsed.data;

  const assignment = await prisma.courseAssignment.upsert({
    where: { courseId_teacherId_academicYear_semester: { courseId, teacherId, academicYear, semester } },
    update: {},
    create: { courseId, teacherId, academicYear, semester },
    include: { course: true, teacher: true },
  });

  return NextResponse.json(assignment, { status: 201 });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (!["ADMIN", "SCOLARITE"].includes(session.user.role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = deleteSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Données invalides" }, { status: 400 });

  await prisma.courseAssignment.delete({ where: { id: parsed.data.id } });
  return NextResponse.json({ success: true });
}
