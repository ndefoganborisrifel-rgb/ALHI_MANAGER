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

  // ADMIN et SCOLARITE voient tout; un etudiant voit ses paiements;
  // un parent voit ceux de ses enfants; les autres roles n'ont pas acces.
  let where: object | undefined;
  if (["ADMIN", "SCOLARITE"].includes(session.user.role)) {
    where = undefined;
  } else if (session.user.role === "ETUDIANT") {
    const self = await prisma.student.findFirst({ where: { userId: session.user.id }, select: { id: true } });
    if (!self) return NextResponse.json([]);
    where = { studentId: self.id };
  } else if (session.user.role === "PARENT") {
    const parent = await prisma.parent.findFirst({ where: { userId: session.user.id }, select: { id: true } });
    if (!parent) return NextResponse.json([]);
    where = { student: { parentId: parent.id } };
  } else {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const payments = await prisma.payment.findMany({
    where,
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
    include: { student: { select: { userId: true, firstName: true, lastName: true, parent: { select: { userId: true } } } } },
  });

  // Notifier l'etudiant et son parent du paiement enregistre
  try {
    const typeLabels: Record<string, string> = {
      INSCRIPTION: "frais d'inscription",
      TRANCHE1: "1re tranche de scolarité",
      TRANCHE2: "2e tranche de scolarité",
      TRANCHE3: "3e tranche de scolarité",
      TRANCHE4: "4e tranche de scolarité",
      AUTRE: "versement",
    };
    const typeLabel = typeLabels[parsed.data.type] ?? "paiement";
    const amountFmt = new Intl.NumberFormat("fr-FR").format(parsed.data.amount) + " FCFA";
    const notifs: { userId: string; title: string; message: string; type: string; link: string }[] = [];
    if (payment.student.userId) {
      notifs.push({
        userId: payment.student.userId,
        title: "Paiement enregistré",
        message: `Un paiement de ${amountFmt} (${typeLabel}) a été enregistré sur votre compte. Reçu : ${receiptNumber}.`,
        type: "SUCCESS",
        link: "/scolarite",
      });
    }
    if (payment.student.parent?.userId) {
      notifs.push({
        userId: payment.student.parent.userId,
        title: "Paiement enregistré",
        message: `Un paiement de ${amountFmt} (${typeLabel}) a été enregistré pour ${payment.student.firstName} ${payment.student.lastName}.`,
        type: "SUCCESS",
        link: "/parent",
      });
    }
    if (notifs.length > 0) await prisma.notification.createMany({ data: notifs });
  } catch {
    // Ne pas bloquer la reponse si les notifications echouent
  }

  return NextResponse.json(payment, { status: 201 });
}
