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
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
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
        weekStart: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    // Regroupe par cle unique : meme filiere + jour + heure + semestre + annee
    // + semaine (les creneaux ponctuels de semaines differentes ne sont pas
    // des doublons : les semaines sont independantes).
    const groups = new Map<string, typeof allSchedules>();
    for (const s of allSchedules) {
      const week = s.weekStart ? s.weekStart.toISOString().slice(0, 10) : "recurrent";
      const key = `${s.filiereId}|${s.dayOfWeek}|${s.startTime}|${s.semester}|${s.academicYear}|${week}`;
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

      const [, ...rest] = sorted;
      toDelete.push(...rest.map((s) => s.id));
      groupsAffected++;
    }

    // Supprimer par lots (SQLite : max 999 variables par requete)
    const BATCH = 400;

    // 1. Supprimer d'abord les presences liees (FK : Attendance.scheduleId -> Schedule.id)
    for (let i = 0; i < toDelete.length; i += BATCH) {
      const chunk = toDelete.slice(i, i + BATCH);
      await prisma.attendance.deleteMany({ where: { scheduleId: { in: chunk } } });
    }

    // 2. Supprimer les creneaux dupliques
    let deleted = 0;
    for (let i = 0; i < toDelete.length; i += BATCH) {
      const chunk = toDelete.slice(i, i + BATCH);
      const res = await prisma.schedule.deleteMany({ where: { id: { in: chunk } } });
      deleted += res.count;
    }

    return NextResponse.json({
      message: `Nettoyage terminé : ${deleted} doublon(s) supprimé(s) dans ${groupsAffected} groupe(s).`,
      deleted,
      groupsAffected,
    });
  } catch (e) {
    // Toujours renvoyer du JSON, meme en cas d erreur, pour que le client puisse l afficher
    const message = e instanceof Error ? e.message : "Erreur inconnue lors du nettoyage";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
