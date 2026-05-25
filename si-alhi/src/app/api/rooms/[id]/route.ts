import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const updateSchema = z.object({
  code: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  capacity: z.number().int().positive().optional(),
  building: z.string().optional().nullable(),
  floor: z.string().optional().nullable(),
  hasProjector: z.boolean().optional(),
  hasComputers: z.boolean().optional(),
  isAvailable: z.boolean().optional(),
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

  const room = await prisma.room.update({
    where: { id },
    data: parsed.data,
  });
  return NextResponse.json(room);
}

export async function DELETE(_req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (!["ADMIN", "SCOLARITE"].includes(session.user.role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const { id } = await params;

  const activeSchedules = await prisma.schedule.count({ where: { roomId: id } });
  if (activeSchedules > 0) {
    return NextResponse.json({ error: "Cette salle est utilisée dans des plannings actifs" }, { status: 409 });
  }

  await prisma.room.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
