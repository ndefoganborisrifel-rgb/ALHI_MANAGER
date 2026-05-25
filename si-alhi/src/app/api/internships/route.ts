import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSchema = z.object({
  studentId: z.string().cuid(),
  companyName: z.string().min(1),
  companyAddress: z.string().optional(),
  companyPhone: z.string().optional(),
  tutorName: z.string().optional(),
  tutorEmail: z.string().email().optional().or(z.literal("")),
  tutorPhone: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  topic: z.string().optional(),
  status: z.enum(["EN_RECHERCHE", "CONVENTION_SIGNEE", "EN_COURS", "TERMINE", "SOUTENU"]).default("EN_RECHERCHE"),
  defenseDate: z.string().optional(),
  jury: z.string().optional(),
  defenseNote: z.number().min(0).max(20).optional(),
});

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get("studentId");

  const internships = await prisma.internship.findMany({
    where: studentId ? { studentId } : undefined,
    include: { student: { include: { filiere: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(internships);
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

  const { startDate, endDate, defenseDate, tutorEmail, ...rest } = parsed.data;

  const internship = await prisma.internship.create({
    data: {
      ...rest,
      tutorEmail: tutorEmail || undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      defenseDate: defenseDate ? new Date(defenseDate) : undefined,
    },
    include: { student: { include: { filiere: true } } },
  });

  return NextResponse.json(internship, { status: 201 });
}
