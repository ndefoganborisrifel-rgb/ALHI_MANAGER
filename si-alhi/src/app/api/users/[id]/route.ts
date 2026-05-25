import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";
import { z } from "zod";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const updateSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().optional().nullable(),
  role: z.enum(["ADMIN", "SCOLARITE", "ENSEIGNANT", "ETUDIANT", "PARENT"]).optional(),
  isActive: z.boolean().optional(),
  resetPassword: z.boolean().optional(),
});

export async function GET(_req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, firstName: true, lastName: true, phone: true, role: true, isActive: true, mustChangePassword: true, createdAt: true, updatedAt: true },
  });

  if (!user) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
  return NextResponse.json(user);
}

export async function PATCH(req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Données invalides", details: parsed.error.issues }, { status: 400 });

  const { resetPassword, ...rest } = parsed.data;

  let plainPassword: string | undefined;
  let passwordData: { password?: string; mustChangePassword?: boolean } = {};

  if (resetPassword) {
    const year = new Date().getFullYear();
    plainPassword = `ALHI${year}!`;
    const hashed = await hash(plainPassword, 12);
    passwordData = { password: hashed, mustChangePassword: true };
  }

  const user = await prisma.user.update({
    where: { id },
    data: { ...rest, ...passwordData },
    select: { id: true, email: true, firstName: true, lastName: true, phone: true, role: true, isActive: true, mustChangePassword: true },
  });

  return NextResponse.json({ ...user, ...(plainPassword ? { tempPassword: plainPassword } : {}) });
}

export async function DELETE(_req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const { id } = await params;
  await prisma.user.update({
    where: { id },
    data: { isActive: false },
  });

  return NextResponse.json({ success: true });
}
