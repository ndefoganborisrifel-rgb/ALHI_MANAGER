import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const updateSchema = z.object({
  companyName: z.string().min(1).optional(),
  companyAddress: z.string().optional().nullable(),
  companyPhone: z.string().optional().nullable(),
  tutorName: z.string().optional().nullable(),
  tutorEmail: z.string().optional().nullable(),
  tutorPhone: z.string().optional().nullable(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  topic: z.string().optional().nullable(),
  status: z.enum(["EN_RECHERCHE", "CONVENTION_SIGNEE", "EN_COURS", "TERMINE", "SOUTENU"]).optional(),
  defenseDate: z.string().optional().nullable(),
  jury: z.string().optional().nullable(),
  defenseNote: z.number().min(0).max(20).optional().nullable(),
});

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

  const { startDate, endDate, defenseDate, ...rest } = parsed.data;

  const internship = await prisma.internship.update({
    where: { id },
    data: {
      ...rest,
      startDate: startDate ? new Date(startDate) : startDate === null ? null : undefined,
      endDate: endDate ? new Date(endDate) : endDate === null ? null : undefined,
      defenseDate: defenseDate ? new Date(defenseDate) : defenseDate === null ? null : undefined,
    },
    include: { student: { include: { filiere: true } } },
  });

  return NextResponse.json(internship);
}

export async function DELETE(_req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (!["ADMIN", "SCOLARITE"].includes(session.user.role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const { id } = await params;
  await prisma.internship.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
