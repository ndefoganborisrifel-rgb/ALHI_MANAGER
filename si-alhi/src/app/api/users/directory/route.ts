import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Non authentifie" }, { status: 401 });

  const users = await prisma.user.findMany({
    where: { isActive: true, id: { not: session.user.id } },
    select: { id: true, firstName: true, lastName: true, role: true, email: true },
    orderBy: [{ role: "asc" }, { lastName: "asc" }],
  });

  return NextResponse.json(users);
}
