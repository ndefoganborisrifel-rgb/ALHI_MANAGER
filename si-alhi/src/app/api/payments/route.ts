import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSchema = z.object({
  studentId: z.string().cuid(),
  amount: z.number().positive(),
  paymentMethod: z.enum(["ESPECES", "VIREMENT", "ORANGE_MONEY", "MTN_MOMO", "CHEQUE"]).default("ESPECES"),
  type: z.enum(["INSCRIPTION", "TRANCHE1", "TRANCHE2", "TRANCHE3", "AUTRE"]).default("TRANCHE1"),
  academicYear: z.string().default("2025-2026"),
  description: z.string().default("FRAIS SCOLARITE"),
});

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const payments = await prisma.payment.findMany({
    include: { student: true },
    orderBy: { paymentDate: "desc" },
    take: 100,
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
  if (!parsed.success) return NextResponse.json({ error: "Données invalides" }, { status: 400 });

  // Generate receipt number
  const year = new Date().getFullYear();
  const count = await prisma.payment.count({ where: { academicYear: parsed.data.academicYear } });
  const receiptNumber = `REC-${year}-${String(count + 1).padStart(5, "0")}`;

  const payment = await prisma.payment.create({
    data: {
      ...parsed.data,
      receiptNumber,
      status: "VALIDE",
    },
  });

  return NextResponse.json(payment, { status: 201 });
}
