import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
  return NextResponse.json({
    id: session.user.id,
    firstName: session.user.name?.split(" ")[0] ?? "",
    lastName: session.user.name?.split(" ").slice(1).join(" ") ?? "",
    role: session.user.role,
  });
}
