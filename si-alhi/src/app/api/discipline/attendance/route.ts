import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const entrySchema = z.object({
  studentId: z.string().cuid(),
  date: z.string(),
  status: z.enum(["PRESENT", "ABSENT", "RETARD", "EXCUSE"]),
  justification: z.string().optional().nullable(),
});

const batchSchema = z.object({
  entries: z.array(entrySchema),
  scheduleId: z.string().cuid().optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (!["ADMIN", "SCOLARITE", "ENSEIGNANT"].includes(session.user.role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = batchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides", details: parsed.error.issues }, { status: 400 });
  }

  let scheduleId = parsed.data.scheduleId;
  if (!scheduleId) {
    const anySchedule = await prisma.schedule.findFirst();
    if (!anySchedule) {
      return NextResponse.json(
        { error: "Aucune séance configurée. Veuillez d'abord configurer un planning." },
        { status: 422 }
      );
    }
    scheduleId = anySchedule.id;
  }

  const results = await Promise.allSettled(
    parsed.data.entries.map(async (entry) => {
      const date = new Date(entry.date + "T00:00:00");
      return prisma.attendance.upsert({
        where: {
          studentId_scheduleId_date: {
            studentId: entry.studentId,
            scheduleId: scheduleId!,
            date,
          },
        },
        update: { status: entry.status, justification: entry.justification ?? null },
        create: {
          studentId: entry.studentId,
          scheduleId: scheduleId!,
          date,
          status: entry.status,
          justification: entry.justification ?? null,
        },
      });
    })
  );

  const succeeded = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.filter((r) => r.status === "rejected").length;

  return NextResponse.json({ succeeded, failed, total: results.length });
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get("studentId");
  const dateFrom = searchParams.get("from");
  const dateTo = searchParams.get("to");

  const attendances = await prisma.attendance.findMany({
    where: {
      ...(studentId ? { studentId } : {}),
      ...(dateFrom || dateTo ? {
        date: {
          ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
          ...(dateTo ? { lte: new Date(dateTo) } : {}),
        },
      } : {}),
    },
    include: { student: true, schedule: true },
    orderBy: { date: "desc" },
    take: 100,
  });

  return NextResponse.json(attendances);
}
