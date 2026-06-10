import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/schedules/migrate-shared-groups
 *
 * Migration one-shot : parcourt tous les creneaux sans sharedGroupId,
 * regroupe ceux qui partagent le meme courseAssignmentId + jour + heure
 * + semestre, et leur assigne un sharedGroupId commun.
 *
 * A appeler une seule fois depuis la console (admin uniquement).
 * Idempotent : un creneau deja groupe n est pas retouche.
 */
export async function POST() {
  try {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  // On cible uniquement les creneaux sans sharedGroupId qui ont un courseAssignmentId
  const ungrouped = await prisma.schedule.findMany({
    where: { sharedGroupId: null, courseAssignmentId: { not: null } },
    select: {
      id: true,
      courseAssignmentId: true,
      dayOfWeek: true,
      startTime: true,
      semester: true,
    },
  });

  // Construire une map : cle = "assignmentId|day|start|semester" → liste d ids
  const groups = new Map<string, string[]>();
  for (const s of ungrouped) {
    const key = `${s.courseAssignmentId}|${s.dayOfWeek}|${s.startTime}|${s.semester}`;
    const arr = groups.get(key) ?? [];
    arr.push(s.id);
    groups.set(key, arr);
  }

  // Ne traiter que les groupes d au moins 2 creneaux (vrais doublons multi-filiere)
  let patchedCount = 0;
  const updates: Promise<unknown>[] = [];

  for (const [, ids] of groups) {
    if (ids.length < 2) continue;
    const newGroupId = `grp_migr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    updates.push(
      prisma.schedule.updateMany({
        where: { id: { in: ids } },
        data: { sharedGroupId: newGroupId },
      })
    );
    patchedCount += ids.length;
  }

  await Promise.all(updates);

  return NextResponse.json({
    message: `Migration terminée : ${patchedCount} créneaux regroupés en ${updates.length} groupes.`,
    groupsCreated: updates.length,
    schedulePatched: patchedCount,
  });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erreur inconnue lors de la migration";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
