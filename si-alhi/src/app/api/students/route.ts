import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { buildMatriculeCode } from "@/lib/matricule-generator";

const createSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  city: z.string().optional(),
  address: z.string().optional(),
  placeOfBirth: z.string().optional(),
  filiereCode: z.string().min(1),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional(),
  status: z.string().optional(),
});

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const filiereId = searchParams.get("filiereId");

  const students = await prisma.student.findMany({
    where: filiereId ? { filiereId } : undefined,
    include: { filiere: true },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    take: 200,
  });
  return NextResponse.json(students);
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

  const { filiereCode, dateOfBirth, email, status, ...rest } = parsed.data;

  const filiere = await prisma.filiere.findUnique({ where: { code: filiereCode } });
  if (!filiere) return NextResponse.json({ error: "Filière non trouvée" }, { status: 404 });

  const now = new Date();
  const academicStartYear = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
  const yearSuffix = String(academicStartYear).slice(-2);
  const matriculeCode = buildMatriculeCode(filiereCode);

  const count = await prisma.student.count({
    where: { filiereId: filiere.id, promotionYear: academicStartYear },
  });
  const seq = count + 1;
  const matricule = `ALI/${matriculeCode}${String(seq).padStart(3, "0")}/${yearSuffix}`;

  const student = await prisma.student.create({
    data: {
      ...rest,
      email: email || undefined,
      filiereId: filiere.id,
      matricule,
      promotionYear: academicStartYear,
      level: 1,
      status: (status as "PROSPECT" | "DOSSIER_RECU" | "ENTRETIEN" | "ACCEPTE" | "INSCRIT" | "ACTIF") ?? "PROSPECT",
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
    },
  });

  return NextResponse.json(student, { status: 201 });
}
