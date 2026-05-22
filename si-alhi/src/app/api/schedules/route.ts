import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSchema = z.object({
  courseAssignmentId: z.string().cuid().optional(),
  roomId: z.string().cuid().optional(),
  dayOfWeek: z.enum(["LUNDI", "MARDI", "MERCREDI", "JEUDI", "VENDREDI", "SAMEDI"]),
  startTime: z.string(),
  endTime: z.string(),
  academicYear: z.string().default("2025-2026"),
  semester: z.number().int().default(1),
  filiereId: z.string().cuid(),
  type: z.enum(["COURS", "TPE", "EVALUATION", "PAUSE"]).default("COURS"),
  sessionNumber: z.number().int().optional(),
  totalSessions: z.number().int().optional(),
});

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const filiereId = searchParams.get("filiereId");
  const academicYear = searchParams.get("academicYear") ?? "2025-2026";

  const schedules = await prisma.schedule.findMany({
    where: {
      academicYear,
      ...(filiereId ? { filiereId } : {}),
    },
    include: {
      courseAssignment: { include: { course: true, teacher: true } },
      room: true,
      filiere: true,
    },
    orderBy: { dayOfWeek: "asc" },
  });

  return NextResponse.json(schedules);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (!["ADMIN", "SCOLARITE"].includes(session.user.role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Données invalides" }, { status: 400 });

  // Collision check: same room, same day, same time
  if (parsed.data.roomId) {
    const collision = await prisma.schedule.findFirst({
      where: {
        roomId: parsed.data.roomId,
        dayOfWeek: parsed.data.dayOfWeek,
        startTime: parsed.data.startTime,
        academicYear: parsed.data.academicYear,
        semester: parsed.data.semester,
      },
    });
    if (collision) {
      return NextResponse.json({
        error: "Collision détectée : cette salle est déjà utilisée à ce créneau.",
        collision: true,
      }, { status: 409 });
    }
  }

  const schedule = await prisma.schedule.create({ data: parsed.data });
  return NextResponse.json(schedule, { status: 201 });
}
