import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";
import { z } from "zod";

const createSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  speciality: z.string().optional(),
  type: z.enum(["PERMANENT", "VACATAIRE"]).default("VACATAIRE"),
  hourlyRate: z.number().int().nonnegative().default(0),
  // Assign one or more subjects at creation time.
  courseIds: z.array(z.string().cuid()).optional().default([]),
  academicYear: z.string().default("2025-2026"),
  semester: z.number().int().min(1).max(2).default(1),
});

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const teachers = await prisma.teacher.findMany({
    include: {
      user: { select: { id: true, email: true, isActive: true, role: true } },
      assignments: { include: { course: true } },
      payments: { orderBy: { createdAt: "desc" }, take: 12 },
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });
  return NextResponse.json(teachers);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (!["ADMIN", "SCOLARITE", "ENSEIGNANT"].includes(session.user.role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Données invalides", details: parsed.error.issues }, { status: 400 });

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) return NextResponse.json({ error: "Cet email est déjà utilisé" }, { status: 409 });

  const tempPassword = "ALHI2025!";
  const hashedPassword = await hash(tempPassword, 12);

  const user = await prisma.user.create({
    data: {
      email: parsed.data.email,
      password: hashedPassword,
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      phone: parsed.data.phone,
      role: "ENSEIGNANT",
      mustChangePassword: true,
    },
  });

  const teacher = await prisma.teacher.create({
    data: {
      userId: user.id,
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      email: parsed.data.email,
      phone: parsed.data.phone,
      speciality: parsed.data.speciality,
      type: parsed.data.type,
      hourlyRate: parsed.data.hourlyRate,
    },
    include: { user: { select: { id: true, email: true, role: true } } },
  });

  // Assign the selected subjects to the freshly created teacher.
  if (parsed.data.courseIds.length > 0) {
    await prisma.courseAssignment.createMany({
      data: parsed.data.courseIds.map((courseId) => ({
        courseId,
        teacherId: teacher.id,
        academicYear: parsed.data.academicYear,
        semester: parsed.data.semester,
      })),
    });
  }

  const withAssignments = await prisma.teacher.findUnique({
    where: { id: teacher.id },
    include: {
      user: { select: { id: true, email: true, role: true } },
      assignments: { include: { course: true } },
    },
  });

  return NextResponse.json({ ...withAssignments, tempPassword }, { status: 201 });
}
