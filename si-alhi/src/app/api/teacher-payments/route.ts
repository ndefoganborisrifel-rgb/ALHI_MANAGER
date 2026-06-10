import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSchema = z.object({
  teacherId: z.string().cuid(),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2020),
  hoursValidated: z.number().nonnegative(),
  hourlyRate: z.number().int().nonnegative(),
});

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const teacherId = searchParams.get("teacherId");

  // Un enseignant ne voit que ses propres vacations; ADMIN et SCOLARITE voient tout.
  let where: { teacherId?: string } | undefined = teacherId ? { teacherId } : undefined;
  if (session.user.role === "ENSEIGNANT") {
    const self = await prisma.teacher.findUnique({ where: { userId: session.user.id }, select: { id: true } });
    if (!self) return NextResponse.json([]);
    where = { teacherId: self.id };
  } else if (!["ADMIN", "SCOLARITE"].includes(session.user.role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const payments = await prisma.teacherPayment.findMany({
    where,
    include: { teacher: true },
    orderBy: [{ year: "desc" }, { month: "desc" }],
  });
  return NextResponse.json(payments);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (!["ADMIN", "SCOLARITE"].includes(session.user.role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Données invalides", details: parsed.error.issues }, { status: 400 });

  const { teacherId, month, year, hoursValidated, hourlyRate } = parsed.data;
  const totalAmount = Math.round(hoursValidated * hourlyRate);

  const payment = await prisma.teacherPayment.upsert({
    where: { teacherId_month_year: { teacherId, month, year } },
    update: { hoursValidated, hourlyRate, totalAmount },
    create: { teacherId, month, year, hoursValidated, hourlyRate, totalAmount },
    include: { teacher: true },
  });

  return NextResponse.json(payment, { status: 201 });
}
