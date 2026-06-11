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
  type: z.enum(["COURS", "TPE", "CC", "EVALUATION", "PAUSE", "FERIER", "EXCURSION", "AUTRE"]).default("COURS"),
  sessionNumber: z.number().int().optional(),
  totalSessions: z.number().int().optional(),
  label: z.string().optional(),
  weekStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

// Creneaux recurrents (cours, tpe, controle continu) : un seul creneau couvre
// automatiquement toutes les semaines du semestre. Les autres types
// (evaluation, ferie, excursion...) sont ponctuels et rattaches a une semaine
// precise (weekStart), donc independants d'une semaine a l'autre.
const RECURRING_TYPES = new Set(["COURS", "TPE", "CC"]);

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const filiereId = searchParams.get("filiereId");
  const academicYear = searchParams.get("academicYear") ?? "2025-2026";
  const weekStartParam = searchParams.get("weekStart");
  const weekStartDate = weekStartParam ? new Date(`${weekStartParam}T00:00:00.000Z`) : null;

  const schedules = await prisma.schedule.findMany({
    where: {
      academicYear,
      ...(filiereId ? { filiereId } : {}),
      // Un creneau recurrent (weekStart nul) apparait toutes les semaines ;
      // un creneau ponctuel n'apparait que pour sa semaine.
      ...(weekStartDate ? { OR: [{ weekStart: null }, { weekStart: weekStartDate }] } : {}),
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

  const { roomId, dayOfWeek, startTime, academicYear, semester, courseAssignmentId, filiereId, type, weekStart } = parsed.data;

  // Creneaux ponctuels (evaluation, ferie, excursion...) : rattaches a une
  // semaine precise, independants des autres semaines.
  const isRecurring = RECURRING_TYPES.has(type);
  if (!isRecurring && !weekStart) {
    return NextResponse.json({ error: "La semaine est requise pour ce type de créneau." }, { status: 400 });
  }
  const weekStartDate = isRecurring ? null : new Date(`${weekStart}T00:00:00.000Z`);

  // Portee des collisions : un creneau recurrent n'entre en collision qu'avec
  // d'autres creneaux recurrents (toutes semaines confondues). Un creneau
  // ponctuel entre en collision avec les creneaux recurrents (toujours
  // presents) et avec les creneaux ponctuels de la meme semaine uniquement :
  // les semaines sont independantes les unes des autres.
  const weekScope = isRecurring
    ? { weekStart: null }
    : { OR: [{ weekStart: null }, { weekStart: weekStartDate }] };

  // Determiner les filieres concernees : si la matiere est mutualisee, on
  // programme automatiquement le creneau dans toutes ses filieres.
  let targetFiliereIds = [filiereId];
  let teacherId: string | null = null;
  if (courseAssignmentId) {
    const assignment = await prisma.courseAssignment.findUnique({
      where: { id: courseAssignmentId },
      select: {
        teacherId: true,
        course: { select: { filiereId: true, courseFilieres: { select: { filiereId: true } } } },
      },
    });
    if (assignment) {
      teacherId = assignment.teacherId;
      const courseFiliereIds = assignment.course.courseFilieres.map((cf) => cf.filiereId);
      const all = courseFiliereIds.length > 0 ? courseFiliereIds : [assignment.course.filiereId];
      // On garde uniquement les filieres reellement liees, en s'assurant que
      // la filiere active est incluse.
      targetFiliereIds = Array.from(new Set([filiereId, ...all]));
    }
  }
  const isMutualized = targetFiliereIds.length > 1;

  // Collision salle (hors filieres mutualisees du meme creneau)
  if (roomId) {
    const roomCollision = await prisma.schedule.findFirst({
      where: { roomId, dayOfWeek, startTime, academicYear, semester, filiereId: { notIn: targetFiliereIds }, ...weekScope },
    });
    if (roomCollision) {
      return NextResponse.json({ error: "Collision détectée : cette salle est déjà occupée à ce créneau.", collision: true }, { status: 409 });
    }
  }

  // Collision enseignant (un autre cours, pas la version mutualisee)
  if (teacherId) {
    const teacherConflict = await prisma.schedule.findFirst({
      where: {
        dayOfWeek, startTime, academicYear, semester,
        filiereId: { notIn: targetFiliereIds },
        courseAssignment: { teacherId },
        ...weekScope,
      },
    });
    if (teacherConflict) {
      return NextResponse.json({ error: "Collision détectée : cet enseignant est déjà programmé à ce créneau.", collision: true }, { status: 409 });
    }
  }

  // Collision filiere : chaque filiere concernee doit etre libre a ce creneau
  const filiereConflict = await prisma.schedule.findFirst({
    where: { filiereId: { in: targetFiliereIds }, dayOfWeek, startTime, academicYear, semester, ...weekScope },
    include: { filiere: { select: { name: true } } },
  });
  if (filiereConflict) {
    return NextResponse.json({
      error: `Collision détectée : la filière ${filiereConflict.filiere.name} a déjà un créneau à cette heure.`,
      collision: true,
    }, { status: 409 });
  }

  // Creation : un creneau par filiere concernee, lies par sharedGroupId si mutualise
  const sharedGroupId = isMutualized ? `grp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}` : null;
  const created = await prisma.$transaction(
    targetFiliereIds.map((fid) =>
      prisma.schedule.create({ data: { ...parsed.data, filiereId: fid, sharedGroupId, weekStart: weekStartDate } })
    )
  );

  // Notification aux etudiants de chaque filiere concernee
  try {
    const filieres = await prisma.filiere.findMany({ where: { id: { in: targetFiliereIds } }, select: { id: true, name: true } });
    const students = await prisma.student.findMany({
      where: { filiereId: { in: targetFiliereIds }, status: { in: ["ACTIF", "INSCRIT"] } },
      select: { userId: true, filiereId: true },
    });
    const dayFr: Record<string, string> = { LUNDI: "lundi", MARDI: "mardi", MERCREDI: "mercredi", JEUDI: "jeudi", VENDREDI: "vendredi", SAMEDI: "samedi" };
    const notifs = students
      .filter((s) => s.userId)
      .map((s) => {
        const fname = filieres.find((f) => f.id === s.filiereId)?.name ?? "votre filière";
        return {
          userId: s.userId as string,
          title: "Emploi du temps mis à jour",
          message: `Un nouveau créneau a été ajouté le ${dayFr[dayOfWeek] ?? dayOfWeek} de ${startTime} pour ${fname}.`,
          type: "INFO",
        };
      });
    if (notifs.length > 0) await prisma.notification.createMany({ data: notifs });
  } catch {
    // Ne pas bloquer la reponse si les notifications echouent
  }

  return NextResponse.json({ ...created[0], mutualized: isMutualized, filiereCount: created.length }, { status: 201 });
}
