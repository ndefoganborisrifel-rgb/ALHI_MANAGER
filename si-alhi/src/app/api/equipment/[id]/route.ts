import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const updateSchema = z.object({
  code: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  category: z.string().optional(),
  brand: z.string().optional().nullable(),
  serialNumber: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  roomId: z.string().cuid().optional().nullable(),
  status: z.enum(["FONCTIONNEL", "EN_PANNE", "EN_MAINTENANCE", "REFORME"]).optional(),
  purchaseDate: z.string().optional().nullable(),
  purchasePrice: z.number().int().optional().nullable(),
  lastMaintenanceDate: z.string().optional().nullable(),
  nextMaintenanceDate: z.string().optional().nullable(),
});

export async function PATCH(req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (!["ADMIN", "SCOLARITE"].includes(session.user.role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Données invalides", details: parsed.error.issues }, { status: 400 });

  const { purchaseDate, lastMaintenanceDate, nextMaintenanceDate, ...rest } = parsed.data;

  const equipment = await prisma.equipment.update({
    where: { id },
    data: {
      ...rest,
      purchaseDate: purchaseDate ? new Date(purchaseDate) : purchaseDate === null ? null : undefined,
      lastMaintenanceDate: lastMaintenanceDate ? new Date(lastMaintenanceDate) : lastMaintenanceDate === null ? null : undefined,
      nextMaintenanceDate: nextMaintenanceDate ? new Date(nextMaintenanceDate) : nextMaintenanceDate === null ? null : undefined,
    },
  });
  return NextResponse.json(equipment);
}

export async function DELETE(_req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (!["ADMIN", "SCOLARITE"].includes(session.user.role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const { id } = await params;
  await prisma.equipment.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
