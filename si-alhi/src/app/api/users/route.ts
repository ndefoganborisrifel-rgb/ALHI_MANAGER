import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";
import { z } from "zod";
import { buildMatriculeCode } from "@/lib/matricule-generator";

const createSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum(["ADMIN", "SCOLARITE", "ENSEIGNANT", "ETUDIANT", "PARENT"]),
  phone: z.string().optional(),
  tempPassword: z.string().min(6).optional(),
  // Teacher fields
  speciality: z.string().optional(),
  teacherType: z.enum(["PERMANENT", "VACATAIRE"]).optional(),
  hourlyRate: z.number().optional(),
  // Student fields
  existingStudentId: z.string().optional(),
  newStudentFiliereCode: z.string().optional(),
  // Parent fields
  parentRelation: z.enum(["PERE", "MERE", "TUTEUR"]).optional(),
  parentProfession: z.string().optional(),
  linkStudentId: z.string().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    select: { id: true, email: true, firstName: true, lastName: true, role: true, isActive: true, mustChangePassword: true, createdAt: true },
    orderBy: { role: "asc" },
  });
  return NextResponse.json(users);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Données invalides" }, { status: 400 });

  const {
    tempPassword,
    speciality, teacherType, hourlyRate,
    existingStudentId, newStudentFiliereCode,
    parentRelation, parentProfession, linkStudentId,
    ...rest
  } = parsed.data;

  const password = await hash(tempPassword ?? "Alhi@2025", 12);

  const existing = await prisma.user.findUnique({ where: { email: rest.email } });
  if (existing) return NextResponse.json({ error: "Cet email est déjà utilisé" }, { status: 409 });

  const user = await prisma.user.create({
    data: { ...rest, password, mustChangePassword: true },
  });

  // Create role-specific profile
  if (rest.role === "ENSEIGNANT") {
    await prisma.teacher.create({
      data: {
        userId: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone ?? undefined,
        email: user.email,
        speciality: speciality ?? null,
        type: teacherType ?? "VACATAIRE",
        hourlyRate: hourlyRate ?? 0,
      },
    });
  }

  if (rest.role === "ETUDIANT") {
    if (existingStudentId) {
      await prisma.student.update({
        where: { id: existingStudentId },
        data: { userId: user.id },
      });
    } else if (newStudentFiliereCode) {
      const filiere = await prisma.filiere.findUnique({ where: { code: newStudentFiliereCode } });
      if (filiere) {
        const now = new Date();
        const academicYear = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
        const yearSuffix = String(academicYear).slice(-2);
        const matriculeCode = buildMatriculeCode(newStudentFiliereCode);
        const count = await prisma.student.count({ where: { filiereId: filiere.id, promotionYear: academicYear } });
        const matricule = `ALI\\${matriculeCode}${String(count + 1).padStart(3, "0")}\\${yearSuffix}`;
        await prisma.student.create({
          data: {
            userId: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone ?? undefined,
            email: user.email,
            filiereId: filiere.id,
            matricule,
            promotionYear: academicYear,
            level: 1,
            status: "ACTIF",
          },
        });
      }
    }
  }

  if (rest.role === "PARENT") {
    const parent = await prisma.parent.create({
      data: {
        userId: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone ?? undefined,
        email: user.email,
        relation: parentRelation ?? "TUTEUR",
        profession: parentProfession ?? null,
      },
    });
    if (linkStudentId) {
      await prisma.student.update({
        where: { id: linkStudentId },
        data: { parentId: parent.id },
      });
    }
  }

  return NextResponse.json({ id: user.id, email: user.email, role: user.role }, { status: 201 });
}
