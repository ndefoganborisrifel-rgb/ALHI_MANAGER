import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/authz";
import { MEMORY_DIR } from "@/lib/memory-storage";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};
const MAX_SIZE = 8 * 1024 * 1024; // 8 Mo

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non authentifie" }, { status: 401 });

  const photos = await prisma.memoryPhoto.findMany({
    orderBy: [{ promotionYear: "desc" }, { createdAt: "desc" }],
    select: { id: true, promotionYear: true, caption: true, createdAt: true },
  });
  return NextResponse.json(photos);
}

export async function POST(req: Request) {
  const guard = await requireRole(["ADMIN", "SCOLARITE"]);
  if (!guard.ok) return guard.response;

  try {
    const form = await req.formData();
    const file = form.get("file");
    const promotionYear = parseInt(String(form.get("promotionYear") ?? ""));
    const caption = String(form.get("caption") ?? "").trim() || null;

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Aucun fichier recu" }, { status: 400 });
    }
    if (!promotionYear || promotionYear < 2000 || promotionYear > 2100) {
      return NextResponse.json({ error: "Annee de promotion invalide" }, { status: 400 });
    }
    const ext = ALLOWED_TYPES[file.type];
    if (!ext) {
      return NextResponse.json({ error: "Format non supporte. Utilisez JPG, PNG ou WebP." }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "Fichier trop volumineux (8 Mo maximum)" }, { status: 400 });
    }

    const fileName = `${Date.now()}_${crypto.randomBytes(6).toString("hex")}${ext}`;
    await mkdir(MEMORY_DIR, { recursive: true });
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(MEMORY_DIR, fileName), buffer);

    const photo = await prisma.memoryPhoto.create({
      data: { promotionYear, caption, fileName, mimeType: file.type, uploadedById: guard.user.id },
    });

    return NextResponse.json(photo, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erreur lors de l'envoi de la photo";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
