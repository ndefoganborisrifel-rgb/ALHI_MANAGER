import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  category: z.string().min(1),
  brand: z.string().optional(),
  serialNumber: z.string().optional(),
  location: z.string().optional(),
  roomId: z.string().cuid().optional(),
  status: z.enum(["FONCTIONNEL", "EN_PANNE", "EN_MAINTENANCE", "REFORME"]).default("FONCTIONNEL"),
  purchaseDate: z.string().optional(),
  purchasePrice: z.number().int().optional(),
  lastMaintenanceDate: z.string().optional(),
  nextMaintenanceDate: z.string().optional(),
});

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const roomId = searchParams.get("roomId");

  const equipment = await prisma.equipment.findMany({
    where: roomId ? { roomId } : undefined,
    include: { room: true },
    orderBy: { code: "asc" },
  });
  return NextResponse.json(equipment);
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

  const { purchaseDate, lastMaintenanceDate, nextMaintenanceDate, ...rest } = parsed.data;

  const equipment = await prisma.equipment.create({
    data: {
      ...rest,
      purchaseDate: purchaseDate ? new Date(purchaseDate) : undefined,
      lastMaintenanceDate: lastMaintenanceDate ? new Date(lastMaintenanceDate) : undefined,
      nextMaintenanceDate: nextMaintenanceDate ? new Date(nextMaintenanceDate) : undefined,
    },
  });
  return NextResponse.json(equipment, { status: 201 });
}
