import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
});

export async function POST(req: Request) {
  const body = await req.json() as unknown;
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    // Still return 200 to avoid leaking info, but accept only valid input
    return NextResponse.json({ message: "Demande envoyee" });
  }

  const { email } = parsed.data;

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, firstName: true, lastName: true },
    });

    if (user) {
      // Find all ADMIN users
      const admins = await prisma.user.findMany({
        where: { role: "ADMIN" },
        select: { id: true },
      });

      if (admins.length > 0) {
        await prisma.notification.createMany({
          data: admins.map((admin) => ({
            userId: admin.id,
            title: "Demande de reinitialisation",
            message: `L'utilisateur ${email} a demande la reinitialisation de son mot de passe.`,
            type: "WARNING",
          })),
        });
      }
    }
  } catch {
    // Swallow errors silently: always return 200 for security
  }

  return NextResponse.json({ message: "Demande envoyee" });
}
