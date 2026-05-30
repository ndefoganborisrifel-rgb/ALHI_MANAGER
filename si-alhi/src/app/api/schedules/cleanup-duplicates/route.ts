import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/schedules/cleanup-duplicates
 *
 * Supprime les creneaux dupliques (meme filiere + jour + heure + semestre +
 * annee academique). Pour chaque groupe de doublons, conserve le creneau le
 * plus complet (avec courseAssignmentId en priorite) et supprime les autres.
 * Operation admin uniquement, idempotente.
 */
export async function POST() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
  }

  const allSchedules = await prisma.schedule.findMany({
    select: {
      id: true,
      filiereId: true,
      dayOfWeek: true,
      startTime: true,
      semester: true,
      academicYear: true,
      courseAssignmentId: true,
      sharedGroupId: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  // Regroupe par cle unique : meme filiere + jour + heure + semestre + annee
  const groups = new Map<string, typeof allSchedules>();
  for (const s of allSchedules) {
    const key = `${s.filiereId}|${s.dayOfWeek}|${s.startTime}|${s.semester}|${s.academicYear}`;
    const arr = groups.get(key) ?? [];
    arr.push(s);
    groups.set(key, arr);
  }

  const toDelete: string[] = [];
  let groupsAffected = 0;

  for (const [, slots] of groups) {
    if (slots.length <= 1) continue;

    // Conserver le meilleur : 1) avec courseAssignmentId 2) le plus recent
    const sorted = [...slots].sort((a, b) => {
      if (a.courseAssignmentId && !b.courseAssignmentId) return -1;
      if (!a.courseAssignmentId && b.courseAssignmentId) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    const [keep, ...rest] = sorted;
    void keep;
    toDelete.push(...rest.map((s) => s.id));
    groupsAffected++;
  }

  if (toDelete.length > 0) {
    await prisma.schedule.deleteMany({ where: { id: { in: toDelete } } });
  }

  return NextResponse.json({
    message: `Nettoyage termine : ${toDelete.length} doublon(s) supprime(s) dans ${groupsAffected} groupe(s).`,
    deleted: toDelete.length,
    groupsAffected,
  });
}
