import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { amountToWords } from "@/lib/amount-to-words";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id } = await params;
  const payment = await prisma.payment.findUnique({
    where: { id },
    include: {
      student: {
        include: { filiere: true, payments: { where: { status: "VALIDE" } } },
      },
    },
  });

  if (!payment) return NextResponse.json({ error: "Paiement introuvable" }, { status: 404 });

  const totalPaid = payment.student.payments.reduce((sum, p) => sum + p.amount, 0);
  const balance = Math.max(0, payment.student.filiere.totalFees - totalPaid);

  return NextResponse.json({
    id: payment.id,
    receiptNumber: payment.receiptNumber,
    date: payment.paymentDate,
    paymentDate: payment.paymentDate,
    paymentMethod: payment.paymentMethod,
    type: payment.type,
    status: payment.status,
    academicYear: payment.academicYear,
    description: payment.description,
    amount: payment.amount,
    amountInWords: amountToWords(payment.amount),
    balance,
    studentName: `${payment.student.lastName} ${payment.student.firstName}`,
    matricule: payment.student.matricule,
    filiere: payment.student.filiere.name,
    level: payment.student.level,
    totalAmount: payment.student.filiere.totalFees,
    student: {
      firstName: payment.student.firstName,
      lastName: payment.student.lastName,
      matricule: payment.student.matricule,
      filiere: { name: payment.student.filiere.name, code: payment.student.filiere.code },
    },
  });
}
