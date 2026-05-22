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
  const balance = payment.student.filiere.totalFees - totalPaid;

  // Return receipt data as JSON for now (PDF generation in browser via @react-pdf/renderer)
  return NextResponse.json({
    receiptNumber: payment.receiptNumber,
    date: payment.paymentDate,
    studentName: `${payment.student.lastName} ${payment.student.firstName}`,
    matricule: payment.student.matricule,
    filiere: payment.student.filiere.name,
    level: payment.student.level,
    totalAmount: payment.student.filiere.totalFees,
    amount: payment.amount,
    balance: Math.max(0, balance),
    amountInWords: amountToWords(payment.amount),
    academicYear: payment.academicYear,
    description: payment.description,
  });
}
