import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const updateSchema = z.object({
  status: z.enum(["BROUILLON", "VALIDE", "PAYE"]).optional(),
  hoursValidated: z.number().nonnegative().optional(),
  hourlyRate: z.number().int().nonnegative().optional(),
});

export async function PATCH(req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (!["ADMIN", "SCOLARITE"].includes(session.user.role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Données invalides", details: parsed.error.issues }, { status: 400 });

  const existing = await prisma.teacherPayment.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Paiement introuvable" }, { status: 404 });

  const { hoursValidated, hourlyRate, status } = parsed.data;

  const newHours = hoursValidated ?? existing.hoursValidated;
  const newRate = hourlyRate ?? existing.hourlyRate;
  const totalAmount = (hoursValidated !== undefined || hourlyRate !== undefined)
    ? Math.round(newHours * newRate)
    : undefined;

  const payment = await prisma.teacherPayment.update({
    where: { id },
    data: {
      ...(status ? { status } : {}),
      ...(hoursValidated !== undefined ? { hoursValidated } : {}),
      ...(hourlyRate !== undefined ? { hourlyRate } : {}),
      ...(totalAmount !== undefined ? { totalAmount } : {}),
    },
    include: { teacher: true },
  });

  return NextResponse.json(payment);
}

export async function DELETE(_req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (!["ADMIN", "SCOLARITE"].includes(session.user.role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const { id } = await params;
  const existing = await prisma.teacherPayment.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Paiement introuvable" }, { status: 404 });
  if (existing.status !== "BROUILLON") {
    return NextResponse.json({ error: "Seuls les paiements en brouillon peuvent être supprimés" }, { status: 409 });
  }

  await prisma.teacherPayment.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
