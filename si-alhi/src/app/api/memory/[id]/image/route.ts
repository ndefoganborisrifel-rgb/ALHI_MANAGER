import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { MEMORY_DIR } from "@/lib/memory-storage";
import { readFile } from "fs/promises";
import path from "path";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id } = await params;
  const photo = await prisma.memoryPhoto.findUnique({ where: { id } });
  if (!photo) return NextResponse.json({ error: "Photo introuvable" }, { status: 404 });

  try {
    // path.basename empeche toute traversee de repertoire
    const buffer = await readFile(path.join(MEMORY_DIR, path.basename(photo.fileName)));
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": photo.mimeType,
        "Cache-Control": "private, max-age=86400",
      },
    });
  } catch {
    return NextResponse.json({ error: "Fichier introuvable sur le serveur" }, { status: 404 });
  }
}
