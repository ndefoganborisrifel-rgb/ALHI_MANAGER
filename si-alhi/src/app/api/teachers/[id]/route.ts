import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const updateSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional().nullable(),
  speciality: z.string().optional().nullable(),
  type: z.enum(["PERMANENT", "VACATAIRE"]).optional(),
  hourlyRate: z.number().int().nonnegative().optional(),
});

export async function GET(_req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id } = await params;
  const teacher = await prisma.teacher.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, email: true, isActive: true, role: true, createdAt: true } },
      assignments: { include: { course: true, schedules: true } },
      payments: { orderBy: [{ year: "desc" }, { month: "desc" }] },
      filiereManaged: true,
    },
  });

  if (!teacher) return NextResponse.json({ error: "Enseignant introuvable" }, { status: 404 });
  return NextResponse.json(teacher);
}

export async function PATCH(req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (!["ADMIN", "SCOLARITE"].includes(session.user.role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Données invalides", details: parsed.error.issues }, { status: 400 });

  const { email, firstName, lastName, ...teacherRest } = parsed.data;

  const teacher = await prisma.teacher.findUnique({ where: { id } });
  if (!teacher) return NextResponse.json({ error: "Enseignant introuvable" }, { status: 404 });

  await prisma.user.update({
    where: { id: teacher.userId },
    data: {
      ...(email ? { email } : {}),
      ...(firstName ? { firstName } : {}),
      ...(lastName ? { lastName } : {}),
    },
  });

  const updated = await prisma.teacher.update({
    where: { id },
    data: {
      ...teacherRest,
      ...(firstName ? { firstName } : {}),
      ...(lastName ? { lastName } : {}),
      ...(email ? { email } : {}),
    },
    include: { user: { select: { id: true, email: true, role: true, isActive: true } } },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (!["ADMIN", "SCOLARITE"].includes(session.user.role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const { id } = await params;
  const teacher = await prisma.teacher.findUnique({ where: { id } });
  if (!teacher) return NextResponse.json({ error: "Enseignant introuvable" }, { status: 404 });

  await prisma.user.update({
    where: { id: teacher.userId },
    data: { isActive: false },
  });

  return NextResponse.json({ success: true });
}
