import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { calculateFinalGrade } from "@/lib/grade-calculator";

/**
 * POST /api/grades/recompute
 *
 * Recalcule la note finale de toutes les notes existantes avec la formule
 * en vigueur (CC 50% + Examen 50%). A lancer apres un changement de formule
 * pour mettre a jour les notes saisies avant la modification.
 * Admin uniquement, idempotent.
 */
export async function POST() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const grades = await prisma.grade.findMany({
      select: { id: true, cc1: true, cc2: true, examScore: true, rattrapageScore: true, noteFinal: true },
    });

    let updated = 0;
    const updates: Promise<unknown>[] = [];
    for (const g of grades) {
      const newNote = calculateFinalGrade(g.cc1, g.cc2, g.examScore, g.rattrapageScore);
      // Ne mettre a jour que si la valeur change (a 0.001 pres)
      const changed = (g.noteFinal == null) !== (newNote == null) ||
        (g.noteFinal != null && newNote != null && Math.abs(g.noteFinal - newNote) > 0.001);
      if (changed) {
        updates.push(prisma.grade.update({ where: { id: g.id }, data: { noteFinal: newNote } }));
        updated++;
      }
    }

    await Promise.all(updates);

    return NextResponse.json({
      message: `Recalcul terminé : ${updated} note(s) mise(s) à jour sur ${grades.length}.`,
      updated,
      total: grades.length,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erreur inconnue lors du recalcul";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
