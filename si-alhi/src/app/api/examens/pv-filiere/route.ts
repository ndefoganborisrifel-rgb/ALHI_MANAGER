import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { calculateGeneralAverage, getMention } from "@/lib/grade-calculator";

/**
 * GET /api/examens/pv-filiere?filiereId=&session=&year=&semester=
 *
 * Retourne le PV complet d'une filiere : toutes les matieres en colonnes,
 * tous les etudiants en lignes avec leur note par matiere, moyenne et decision.
 * session = NORMALE  -> notes de la session normale
 * session = RATTRAPAGE -> note de rattrapage si elle existe, sinon note normale
 *                         (situation consolidee apres rattrapage)
 */
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (!["ADMIN", "SCOLARITE", "ENSEIGNANT"].includes(session.user.role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const filiereId = searchParams.get("filiereId");
  const pvSession = searchParams.get("session") === "RATTRAPAGE" ? "RATTRAPAGE" : "NORMALE";
  const academicYear = searchParams.get("year") ?? "2025-2026";
  const semester = parseInt(searchParams.get("semester") ?? "1");

  if (!filiereId) return NextResponse.json({ error: "Filière non spécifiée" }, { status: 400 });

  const filiere = await prisma.filiere.findUnique({
    where: { id: filiereId },
    include: {
      courses: {
        where: { semester },
        orderBy: [{ ueCode: "asc" }, { code: "asc" }],
      },
      students: {
        where: { status: { in: ["ACTIF", "INSCRIT"] } },
        orderBy: { lastName: "asc" },
        include: {
          grades: {
            where: { academicYear, semester },
            include: { course: { select: { credits: true } } },
          },
        },
      },
    },
  });

  if (!filiere) return NextResponse.json({ error: "Filière introuvable" }, { status: 404 });

  const courses = filiere.courses.map((c) => ({
    id: c.id,
    code: c.code,
    name: c.name,
    credits: c.credits,
    ueCode: c.ueCode,
  }));

  const students = filiere.students.map((student) => {
    // Pour chaque matiere, on retient la note effective selon la session demandee
    const noteByCourse: Record<string, number | null> = {};
    const gradeItems: Array<{ average: number | null; credits: number }> = [];

    for (const course of filiere.courses) {
      const normale = student.grades.find((g) => g.courseId === course.id && g.session === "NORMALE");
      const ratt = student.grades.find((g) => g.courseId === course.id && g.session === "RATTRAPAGE");
      const effective = pvSession === "RATTRAPAGE" ? (ratt ?? normale) : normale;
      const note = effective?.noteFinal ?? null;
      noteByCourse[course.id] = note;
      if (note != null) gradeItems.push({ average: note, credits: course.credits });
    }

    const avg = calculateGeneralAverage(gradeItems);
    const validatedCredits = filiere.courses.reduce((sum, course) => {
      const note = noteByCourse[course.id];
      return note != null && note >= 14 ? sum + course.credits : sum;
    }, 0);
    const isAdmis = avg != null && avg >= 14;

    return {
      id: student.id,
      matricule: student.matricule,
      firstName: student.firstName,
      lastName: student.lastName,
      notes: noteByCourse,
      average: avg,
      mention: getMention(avg),
      validatedCredits,
      decision: isAdmis ? "Admis" : "Ajourné",
    };
  });

  // Classement par moyenne decroissante
  const sorted = [...students].sort((a, b) => (b.average ?? -1) - (a.average ?? -1));
  const ranked = students.map((s) => ({ ...s, rank: sorted.findIndex((r) => r.id === s.id) + 1 }));

  const admisCount = ranked.filter((s) => s.decision === "Admis").length;
  const totalCredits = courses.reduce((sum, c) => sum + c.credits, 0);

  return NextResponse.json({
    filiere: { code: filiere.code, name: filiere.name },
    session: pvSession,
    academicYear,
    semester,
    courses,
    totalCredits,
    students: ranked,
    stats: {
      total: ranked.length,
      admis: admisCount,
      ajourne: ranked.length - admisCount,
    },
  });
}
