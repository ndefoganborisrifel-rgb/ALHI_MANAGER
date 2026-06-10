import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const filiereId = searchParams.get("filiereId");

  const courses = await prisma.course.findMany({
    where: filiereId
      ? { OR: [{ filiereId }, { courseFilieres: { some: { filiereId } } }] }
      : undefined,
    include: {
      ue: true,
      filiere: true,
      courseFilieres: { include: { filiere: { select: { id: true, code: true, name: true } } } },
    },
    orderBy: [{ filiere: { code: "asc" } }, { code: "asc" }],
  });
  return NextResponse.json(courses);
}

const createSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  credits: z.number().int().positive(),
  totalHours: z.number().int().positive(),
  semester: z.number().int().min(1).max(8),
  filiereId: z.string().min(1),
  filiereIds: z.array(z.string().min(1)).optional(),
  ueCode: z.string().min(1),
  ueName: z.string().min(1),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (!["ADMIN", "SCOLARITE"].includes(session.user.role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const body = await req.json() as unknown;
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Données invalides", details: parsed.error.flatten() }, { status: 400 });

  const existing = await prisma.course.findFirst({ where: { code: parsed.data.code } });
  if (existing) return NextResponse.json({ error: "Un cours avec ce code existe déjà" }, { status: 409 });

  const { filiereIds, ...courseData } = parsed.data;
  // Liste complete des filieres concernees (primaire incluse, sans doublon)
  const allFiliereIds = Array.from(new Set([courseData.filiereId, ...(filiereIds ?? [])]));

  const ue = await prisma.uE.upsert({
    where: { code_filiereId: { code: courseData.ueCode, filiereId: courseData.filiereId } },
    update: {},
    create: { code: courseData.ueCode, name: courseData.ueName, filiereId: courseData.filiereId, semester: courseData.semester, totalCredits: courseData.credits },
  });

  const course = await prisma.course.create({
    data: {
      ...courseData,
      ueId: ue.id,
      courseFilieres: { create: allFiliereIds.map((fid) => ({ filiereId: fid })) },
    },
    include: {
      filiere: true,
      ue: true,
      courseFilieres: { include: { filiere: { select: { id: true, code: true, name: true } } } },
    },
  });
  return NextResponse.json(course, { status: 201 });
}
