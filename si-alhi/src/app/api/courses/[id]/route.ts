import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const { id } = await params;
  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      filiere: true,
      ue: true,
      courseFilieres: { include: { filiere: { select: { id: true, code: true, name: true } } } },
    },
  });
  if (!course) return NextResponse.json({ error: "Cours introuvable" }, { status: 404 });
  return NextResponse.json(course);
}

const updateSchema = z.object({
  code: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  credits: z.number().int().positive().optional(),
  totalHours: z.number().int().positive().optional(),
  semester: z.number().int().min(1).max(8).optional(),
  ueCode: z.string().min(1).optional(),
  ueName: z.string().min(1).optional(),
  filiereId: z.string().min(1).optional(),
  filiereIds: z.array(z.string().min(1)).optional(),
  pvNormalePublished: z.boolean().optional(),
  pvRattrapagePublished: z.boolean().optional(),
}).partial();

export async function PATCH(req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (!["ADMIN", "SCOLARITE"].includes(session.user.role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const { id } = await params;
  const body = await req.json() as unknown;
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Données invalides" }, { status: 400 });

  const { filiereIds, ...scalarData } = parsed.data;

  // Lire l'etat actuel pour detecter les changements de publication
  const existing = await prisma.course.findUnique({
    where: { id },
    select: {
      name: true,
      pvNormalePublished: true,
      pvRattrapagePublished: true,
      filiereId: true,
      courseFilieres: { select: { filiereId: true } },
    },
  });

  // Si la liste des filieres est fournie, on la resynchronise (primaire incluse)
  if (filiereIds) {
    const primary = scalarData.filiereId ?? existing?.filiereId;
    const allFiliereIds = Array.from(new Set([...(primary ? [primary] : []), ...filiereIds]));
    await prisma.courseFiliere.deleteMany({ where: { courseId: id } });
    await prisma.courseFiliere.createMany({ data: allFiliereIds.map((fid) => ({ courseId: id, filiereId: fid })) });
  }

  const course = await prisma.course.update({
    where: { id },
    data: scalarData,
    include: {
      filiere: true,
      ue: true,
      courseFilieres: { include: { filiere: { select: { id: true, code: true, name: true } } } },
    },
  });

  // Envoyer des notifications aux etudiants lorsqu'un PV est publie
  try {
    const normaleJustPublished = scalarData.pvNormalePublished === true && existing?.pvNormalePublished === false;
    const rattrapageJustPublished = scalarData.pvRattrapagePublished === true && existing?.pvRattrapagePublished === false;

    if (normaleJustPublished || rattrapageJustPublished) {
      const courseFiliereIds = existing?.courseFilieres.map((cf) => cf.filiereId) ?? [];
      const primaryId = existing?.filiereId;
      const allFiliereIds = Array.from(new Set([...(primaryId ? [primaryId] : []), ...courseFiliereIds]));

      const students = await prisma.student.findMany({
        where: { filiereId: { in: allFiliereIds }, status: { in: ["ACTIF", "INSCRIT"] } },
        select: { userId: true },
      });

      const notifData = students
        .filter((s) => s.userId)
        .map((s) => ({
          userId: s.userId as string,
          title: normaleJustPublished ? "Résultats publiés" : "Résultats de rattrapage publiés",
          message: normaleJustPublished
            ? `Les résultats de la session normale de "${existing?.name ?? "votre cours"}" sont disponibles.`
            : `Les résultats de la session de rattrapage de "${existing?.name ?? "votre cours"}" sont disponibles.`,
          type: "SUCCESS",
        }));

      if (notifData.length > 0) {
        await prisma.notification.createMany({ data: notifData });
      }
    }
  } catch {
    // Ne pas bloquer la reponse si les notifications echouent
  }

  return NextResponse.json(course);
}

export async function DELETE(_req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const { id } = await params;

  const assignments = await prisma.courseAssignment.count({ where: { courseId: id } });
  if (assignments > 0) {
    return NextResponse.json({ error: "Ce cours a des affectations enseignants. Supprimez-les d'abord." }, { status: 409 });
  }

  const grades = await prisma.grade.count({ where: { courseId: id } });
  if (grades > 0) {
    return NextResponse.json({ error: "Ce cours a des notes enregistrées. Impossible de le supprimer sans perdre les notes des étudiants." }, { status: 409 });
  }

  await prisma.course.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
