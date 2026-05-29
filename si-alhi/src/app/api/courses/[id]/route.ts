import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
  const { id } = await params;
  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      filiere: true,
      ue: true,
      courseFilieres: { include: { filiere: { select: { id: true, code: true, name: true } } } },
    },
  });
  if (!course) return NextResponse.json({ error: "Cours introuvable" }, { status: 404 });
  return NextResponse.json(course);
}

const updateSchema = z.object({
  code: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  credits: z.number().int().positive().optional(),
  totalHours: z.number().int().positive().optional(),
  semester: z.number().int().min(1).max(8).optional(),
  ueCode: z.string().min(1).optional(),
  ueName: z.string().min(1).optional(),
  filiereId: z.string().min(1).optional(),
  filiereIds: z.array(z.string().min(1)).optional(),
}).partial();

export async function PATCH(req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
  if (!["ADMIN", "SCOLARITE"].includes(session.user.role)) {
    return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
  }
  const { id } = await params;
  const body = await req.json() as unknown;
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Donnees invalides" }, { status: 400 });

  const { filiereIds, ...scalarData } = parsed.data;

  // Si la liste des filieres est fournie, on la resynchronise (primaire incluse)
  if (filiereIds) {
    const primary = scalarData.filiereId ?? (await prisma.course.findUnique({ where: { id }, select: { filiereId: true } }))?.filiereId;
    const allFiliereIds = Array.from(new Set([...(primary ? [primary] : []), ...filiereIds]));
    await prisma.courseFiliere.deleteMany({ where: { courseId: id } });
    await prisma.courseFiliere.createMany({ data: allFiliereIds.map((fid) => ({ courseId: id, filiereId: fid })) });
  }

  const course = await prisma.course.update({
    where: { id },
    data: scalarData,
    include: {
      filiere: true,
      ue: true,
      courseFilieres: { include: { filiere: { select: { id: true, code: true, name: true } } } },
    },
  });
  return NextResponse.json(course);
}

export async function DELETE(_req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Acces refuse" }, { status: 403 });

  const { id } = await params;

  const assignments = await prisma.courseAssignment.count({ where: { courseId: id } });
  if (assignments > 0) {
    return NextResponse.json({ error: "Ce cours a des affectations enseignants. Supprimez-les d'abord." }, { status: 409 });
  }

  await prisma.course.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
