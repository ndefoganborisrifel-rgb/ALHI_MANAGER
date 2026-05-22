import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id } = await params;
  const student = await prisma.student.findUnique({
    where: { id },
    include: { filiere: true, payments: true, grades: { include: { course: true } } },
  });
  if (!student) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  if (session.user.role === "ETUDIANT") {
    const self = await prisma.student.findFirst({ where: { userId: session.user.id } });
    if (self?.id !== id) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  return NextResponse.json(student);
}

export async function PATCH(req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (!["ADMIN", "SCOLARITE"].includes(session.user.role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();

  const student = await prisma.student.update({
    where: { id },
    data: body,
  });
  return NextResponse.json(student);
}
