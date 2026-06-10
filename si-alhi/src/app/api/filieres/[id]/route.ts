import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (!["ADMIN", "SCOLARITE"].includes(session.user.role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json() as Record<string, unknown>;

  const allowedFields = ["bulletinsPublished", "pvPublished", "coursesPublished", "name", "description", "totalFees"];
  const data: Record<string, unknown> = {};
  for (const key of allowedFields) {
    if (key in body) data[key] = body[key];
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Aucun champ à mettre à jour" }, { status: 400 });
  }

  // Check current state before updating (for notifications)
  const currentFiliere = await prisma.filiere.findUnique({
    where: { id },
    select: { name: true, bulletinsPublished: true, pvPublished: true, coursesPublished: true },
  });

  const filiere = await prisma.filiere.update({ where: { id }, data });

  // Send notifications when bulletinsPublished becomes true
  if (data.bulletinsPublished === true && !currentFiliere?.bulletinsPublished) {
    await sendNotifications(id, currentFiliere?.name ?? "la filière", "bulletins");
  }

  // Send notifications when pvPublished becomes true
  if (data.pvPublished === true && !currentFiliere?.pvPublished) {
    await sendNotifications(id, currentFiliere?.name ?? "la filière", "pv");
  }

  // Send notifications when coursesPublished becomes true
  if (data.coursesPublished === true && !currentFiliere?.coursesPublished) {
    await sendNotifications(id, currentFiliere?.name ?? "la filière", "courses");
  }

  return NextResponse.json(filiere);
}

async function sendNotifications(filiereId: string, filiereName: string, type: "bulletins" | "pv" | "courses") {
  const students = await prisma.student.findMany({
    where: { filiereId, status: { in: ["ACTIF", "INSCRIT"] } },
    include: { parent: { include: { user: true } } },
  });

  const assignments = await prisma.courseAssignment.findMany({
    where: { course: { filiereId }, academicYear: "2025-2026" },
    include: { teacher: { include: { user: true } } },
    distinct: ["teacherId"],
  });

  const title = type === "bulletins" ? "Bulletins disponibles" : type === "pv" ? "PV de notes disponibles" : "Matières disponibles";
  const studentLink = type === "courses" ? "/pedagogie/matieres" : "/examens";
  const teacherLink = type === "bulletins" ? "/examens/bulletins" : "/examens/pv";

  const notifications: { userId: string; title: string; message: string; type: string; link: string }[] = [];

  for (const student of students) {
    if (!student.userId) continue;
    const msg = type === "bulletins"
      ? `Les bulletins de notes de ${filiereName} sont maintenant disponibles.`
      : type === "pv"
      ? `Les PV de notes de ${filiereName} ont été publiés. Consultez vos résultats.`
      : `La liste des matières de ${filiereName} est maintenant disponible.`;
    notifications.push({ userId: student.userId, title, message: msg, type: "INFO", link: studentLink });

    if (student.parent?.userId) {
      const parentMsg = type === "bulletins"
        ? `Les bulletins de notes de ${filiereName} pour ${student.firstName} ${student.lastName} sont disponibles.`
        : type === "pv"
        ? `Les PV de notes de ${filiereName} pour ${student.firstName} ${student.lastName} ont été publiés.`
        : `La liste des matières de ${filiereName} pour ${student.firstName} ${student.lastName} est disponible.`;
      notifications.push({ userId: student.parent.userId, title, message: parentMsg, type: "INFO", link: studentLink });
    }
  }

  if (type === "courses") {
    if (notifications.length > 0) await prisma.notification.createMany({ data: notifications });
    return;
  }

  for (const a of assignments) {
    const teacherTitle = type === "bulletins" ? "Bulletins publiés" : "PV publiés";
    const teacherMsg = type === "bulletins"
      ? `Les bulletins de ${filiereName} ont été publiés et sont visibles par les étudiants.`
      : `Les PV de notes de ${filiereName} ont été publiés.`;
    notifications.push({ userId: a.teacher.userId, title: teacherTitle, message: teacherMsg, type: "INFO", link: teacherLink });
  }

  if (notifications.length > 0) await prisma.notification.createMany({ data: notifications });
}
