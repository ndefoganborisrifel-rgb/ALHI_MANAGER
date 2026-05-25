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
  const payment = await prisma.payment.findUnique({
    where: { id },
    include: { student: { include: { filiere: true } } },
  });

  if (!payment) return NextResponse.json({ error: "Paiement introuvable" }, { status: 404 });

  return NextResponse.json({
    id: payment.id,
    receiptNumber: payment.receiptNumber,
    amount: payment.amount,
    paymentDate: payment.paymentDate,
    paymentMethod: payment.paymentMethod,
    description: payment.description,
    type: payment.type,
    status: payment.status,
    academicYear: payment.academicYear,
    student: {
      firstName: payment.student.firstName,
      lastName: payment.student.lastName,
      matricule: payment.student.matricule,
      filiere: {
        name: payment.student.filiere.name,
        code: payment.student.filiere.code,
      },
    },
  });
}
