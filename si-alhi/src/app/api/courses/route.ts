import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const filiereId = searchParams.get("filiereId");

  const courses = await prisma.course.findMany({
    where: filiereId ? { filiereId } : undefined,
    include: { ue: true, filiere: true },
    orderBy: { code: "asc" },
  });
  return NextResponse.json(courses);
}
