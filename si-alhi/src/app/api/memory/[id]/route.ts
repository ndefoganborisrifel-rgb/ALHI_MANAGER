import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/authz";
import { MEMORY_DIR } from "@/lib/memory-storage";
import { unlink } from "fs/promises";
import path from "path";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function DELETE(_req: Request, { params }: RouteParams) {
  const guard = await requireRole(["ADMIN", "SCOLARITE"]);
  if (!guard.ok) return guard.response;

  const { id } = await params;
  const photo = await prisma.memoryPhoto.findUnique({ where: { id } });
  if (!photo) return NextResponse.json({ error: "Photo introuvable" }, { status: 404 });

  await prisma.memoryPhoto.delete({ where: { id } });
  // Suppression du fichier apres la base : si le fichier manque, on ignore.
  try {
    await unlink(path.join(MEMORY_DIR, path.basename(photo.fileName)));
  } catch {
    // Fichier deja absent, rien a faire
  }

  return NextResponse.json({ success: true });
}
