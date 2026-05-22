import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";
import { z } from "zod";

const createSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum(["ADMIN", "SCOLARITE", "ENSEIGNANT", "ETUDIANT", "PARENT"]),
  phone: z.string().optional(),
  tempPassword: z.string().min(6).optional(),
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

  const { tempPassword, ...rest } = parsed.data;
  const password = await hash(tempPassword ?? "Alhi@2025", 12);

  const existing = await prisma.user.findUnique({ where: { email: rest.email } });
  if (existing) return NextResponse.json({ error: "Cet email est déjà utilisé" }, { status: 409 });

  const user = await prisma.user.create({
    data: { ...rest, password, mustChangePassword: true },
  });

  return NextResponse.json({ id: user.id, email: user.email, role: user.role }, { status: 201 });
}
