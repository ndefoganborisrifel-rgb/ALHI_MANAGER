import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non authentifie" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const filiereId = searchParams.get("filiereId");

  const courses = await prisma.course.findMany({
    where: filiereId ? { filiereId } : undefined,
    include: { ue: true, filiere: true },
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
  ueCode: z.string().min(1),
  ueName: z.string().min(1),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
  if (!["ADMIN", "SCOLARITE"].includes(session.user.role)) {
    return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
  }

  const body = await req.json() as unknown;
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Donnees invalides", details: parsed.error.flatten() }, { status: 400 });

  const existing = await prisma.course.findFirst({ where: { code: parsed.data.code } });
  if (existing) return NextResponse.json({ error: "Un cours avec ce code existe deja" }, { status: 409 });

  const ue = await prisma.uE.upsert({
    where: { code_filiereId: { code: parsed.data.ueCode, filiereId: parsed.data.filiereId } },
    update: {},
    create: { code: parsed.data.ueCode, name: parsed.data.ueName, filiereId: parsed.data.filiereId, semester: parsed.data.semester, totalCredits: parsed.data.credits },
  });

  const course = await prisma.course.create({
    data: { ...parsed.data, ueId: ue.id },
    include: { filiere: true, ue: true },
  });
  return NextResponse.json(course, { status: 201 });
}
