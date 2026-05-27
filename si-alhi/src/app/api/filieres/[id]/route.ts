import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
  if (!["ADMIN", "SCOLARITE"].includes(session.user.role)) {
    return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json() as Record<string, unknown>;

  const allowedFields = ["bulletinsPublished", "name", "description", "totalFees"];
  const data: Record<string, unknown> = {};
  for (const key of allowedFields) {
    if (key in body) data[key] = body[key];
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Aucun champ a mettre a jour" }, { status: 400 });
  }

  const filiere = await prisma.filiere.update({ where: { id }, data });
  return NextResponse.json(filiere);
}
