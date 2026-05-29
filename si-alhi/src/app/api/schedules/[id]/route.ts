import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const updateSchema = z.object({
  dayOfWeek: z.enum(["LUNDI", "MARDI", "MERCREDI", "JEUDI", "VENDREDI", "SAMEDI"]).optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  roomId: z.string().cuid().optional().nullable(),
  type: z.enum(["COURS", "TPE", "EVALUATION", "PAUSE"]).optional(),
  sessionNumber: z.number().int().optional().nullable(),
  totalSessions: z.number().int().optional().nullable(),
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

  const existing = await prisma.schedule.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Créneau introuvable" }, { status: 404 });

  const roomId = parsed.data.roomId !== undefined ? parsed.data.roomId : existing.roomId;
  const dayOfWeek = parsed.data.dayOfWeek ?? existing.dayOfWeek;
  const startTime = parsed.data.startTime ?? existing.startTime;

  if (roomId) {
    const collision = await prisma.schedule.findFirst({
      where: {
        id: { not: id },
        roomId,
        dayOfWeek,
        startTime,
        academicYear: existing.academicYear,
        semester: existing.semester,
      },
    });
    if (collision) {
      return NextResponse.json({
        error: "Collision détectée : cette salle est déjà utilisée à ce créneau.",
        collision: true,
      }, { status: 409 });
    }
  }

  const schedule = await prisma.schedule.update({
    where: { id },
    data: parsed.data,
    include: {
      courseAssignment: { include: { course: true, teacher: true } },
      room: true,
      filiere: true,
    },
  });

  return NextResponse.json(schedule);
}

export async function DELETE(_req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (!["ADMIN", "SCOLARITE"].includes(session.user.role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const { id } = await params;
  const existing = await prisma.schedule.findUnique({ where: { id }, select: { sharedGroupId: true } });
  if (existing?.sharedGroupId) {
    // Creneau mutualise : on supprime toute la serie liee (toutes les filieres concernees)
    await prisma.schedule.deleteMany({ where: { sharedGroupId: existing.sharedGroupId } });
  } else {
    await prisma.schedule.delete({ where: { id } });
  }
  return NextResponse.json({ success: true });
}
