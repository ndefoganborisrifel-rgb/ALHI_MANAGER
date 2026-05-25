import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  capacity: z.number().int().positive(),
  building: z.string().optional(),
  floor: z.string().optional(),
  hasProjector: z.boolean().default(false),
  hasComputers: z.boolean().default(false),
});

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const rooms = await prisma.room.findMany({
    include: {
      _count: { select: { equipment: true, schedules: true } },
    },
    orderBy: { code: "asc" },
  });
  return NextResponse.json(rooms);
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

  const existing = await prisma.room.findUnique({ where: { code: parsed.data.code } });
  if (existing) return NextResponse.json({ error: "Ce code est déjà utilisé" }, { status: 409 });

  const room = await prisma.room.create({ data: parsed.data });
  return NextResponse.json(room, { status: 201 });
}
