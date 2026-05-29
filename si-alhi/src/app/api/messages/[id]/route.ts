import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

interface RouteParams { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
  const { id } = await params;

  const conv = await prisma.conversation.findUnique({
    where: { id },
    include: {
      participants: {
        include: { user: { select: { id: true, firstName: true, lastName: true, role: true } } },
      },
      messages: {
        orderBy: { createdAt: "asc" },
        include: { sender: { select: { id: true, firstName: true, lastName: true, role: true } } },
      },
    },
  });

  if (!conv) return NextResponse.json({ error: "Conversation introuvable" }, { status: 404 });
  if (!conv.participants.some((p) => p.userId === session.user!.id)) {
    return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
  }

  // Mark as read
  await prisma.conversationParticipant.updateMany({
    where: { conversationId: id, userId: session.user.id },
    data: { lastReadAt: new Date() },
  });

  return NextResponse.json(conv);
}

export async function POST(req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
  const { id } = await params;

  const conv = await prisma.conversation.findUnique({
    where: { id },
    include: { participants: { select: { userId: true } } },
  });
  if (!conv) return NextResponse.json({ error: "Conversation introuvable" }, { status: 404 });
  if (!conv.participants.some((p) => p.userId === session.user!.id)) {
    return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
  }

  const body = await req.json() as { content: string };
  if (!body.content?.trim()) return NextResponse.json({ error: "Message vide" }, { status: 400 });

  const message = await prisma.message.create({
    data: { conversationId: id, senderId: session.user.id, content: body.content.trim() },
    include: { sender: { select: { id: true, firstName: true, lastName: true, role: true } } },
  });

  await prisma.conversation.update({ where: { id }, data: { updatedAt: new Date() } });

  return NextResponse.json(message);
}
