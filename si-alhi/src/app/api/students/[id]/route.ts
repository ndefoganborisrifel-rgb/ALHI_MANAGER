import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const updateSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  dateOfBirth: z.string().optional().nullable(),
  gender: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  placeOfBirth: z.string().optional().nullable(),
  emergencyContact: z.string().optional().nullable(),
  emergencyPhone: z.string().optional().nullable(),
  status: z.enum(["PROSPECT", "DOSSIER_RECU", "ENTRETIEN", "ACCEPTE", "INSCRIT", "ACTIF", "SUSPENDU", "DIPLOME"]).optional(),
  level: z.number().int().min(1).max(5).optional(),
  specializationId: z.string().optional().nullable(),
});

export async function GET(_req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id } = await params;
  const student = await prisma.student.findUnique({
    where: { id },
    include: {
      filiere: { include: { specializations: true } },
      specialization: true,
      parent: true,
      payments: { orderBy: { paymentDate: "desc" } },
      grades: {
        include: { course: { include: { ue: true } } },
        orderBy: { createdAt: "desc" },
      },
      internships: { orderBy: { createdAt: "desc" }, take: 1 },
      attendances: { orderBy: { date: "desc" }, take: 50 },
    },
  });
  if (!student) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  if (session.user.role === "ETUDIANT") {
    const self = await prisma.student.findFirst({ where: { userId: session.user.id } });
    if (self?.id !== id) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  return NextResponse.json(student);
}

// Contact fields a student is allowed to change on their own profile. Status,
// level and specialization stay admin-only so a student cannot promote
// themselves or alter their academic record.
const selfUpdateSchema = z.object({
  phone: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  emergencyContact: z.string().optional().nullable(),
  emergencyPhone: z.string().optional().nullable(),
});

export async function PATCH(req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id } = await params;
  const role = session.user.role;
  const isStaff = role === "ADMIN" || role === "SCOLARITE";

  // A student may edit ONLY their own profile, and only the contact fields.
  if (!isStaff) {
    if (role !== "ETUDIANT") return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    const self = await prisma.student.findFirst({ where: { userId: session.user.id }, select: { id: true } });
    if (!self || self.id !== id) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

    const body = await req.json();
    const parsed = selfUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Données invalides", details: parsed.error.issues }, { status: 400 });
    }
    const { email, ...rest } = parsed.data;
    const student = await prisma.student.update({
      where: { id },
      data: { ...rest, ...(email !== undefined ? { email: email || null } : {}) },
      include: { filiere: true },
    });
    return NextResponse.json(student);
  }

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides", details: parsed.error.issues }, { status: 400 });
  }

  const { dateOfBirth, email, ...rest } = parsed.data;

  const student = await prisma.student.update({
    where: { id },
    data: {
      ...rest,
      email: email || null,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
    },
    include: { filiere: true },
  });
  return NextResponse.json(student);
}
