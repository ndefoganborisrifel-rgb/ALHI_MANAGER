import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const filieres = await prisma.filiere.findMany({
    include: {
      _count: { select: { courses: true, students: true } },
      responsable: true,
    },
    orderBy: { code: "asc" },
  });
  return NextResponse.json(filieres);
}
