import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Non authentifie" }, { status: 401 });

  const conversations = await prisma.conversation.findMany({
    where: { participants: { some: { userId: session.user.id } } },
    include: {
      participants: {
        include: { user: { select: { id: true, firstName: true, lastName: true, role: true } } },
      },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { updatedAt: "desc" },
  });

  const myParticipant = (convId: string) =>
    conversations.find((c) => c.id === convId)?.participants.find((p) => p.userId === session.user!.id);

  const result = conversations.map((conv) => {
    const lastMsg = conv.messages[0] ?? null;
    const me = myParticipant(conv.id);
    const unread = me?.lastReadAt == null
      ? conv.messages.length
      : conv.messages.filter((m) => m.createdAt > me.lastReadAt!).length;
    const other = conv.participants.find((p) => p.userId !== session.user!.id);
    return {
      id: conv.id,
      updatedAt: conv.updatedAt,
      lastMessage: lastMsg ? { content: lastMsg.content, createdAt: lastMsg.createdAt } : null,
      unread,
      other: other ? { id: other.user.id, firstName: other.user.firstName, lastName: other.user.lastName, role: other.user.role } : null,
    };
  });

  return NextResponse.json(result);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Non authentifie" }, { status: 401 });

  const body = await req.json() as { targetUserId: string; content: string };
  if (!body.targetUserId || !body.content?.trim()) {
    return NextResponse.json({ error: "Donnees invalides" }, { status: 400 });
  }

  const targetUser = await prisma.user.findUnique({ where: { id: body.targetUserId } });
  if (!targetUser) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });

  // Check if conversation already exists between the two users
  const existing = await prisma.conversation.findFirst({
    where: {
      AND: [
        { participants: { some: { userId: session.user.id } } },
        { participants: { some: { userId: body.targetUserId } } },
      ],
    },
  });

  let convId: string;
  if (existing) {
    convId = existing.id;
  } else {
    const conv = await prisma.conversation.create({
      data: {
        participants: {
          create: [{ userId: session.user.id }, { userId: body.targetUserId }],
        },
      },
    });
    convId = conv.id;
  }

  const message = await prisma.message.create({
    data: { conversationId: convId, senderId: session.user.id, content: body.content.trim() },
    include: { sender: { select: { id: true, firstName: true, lastName: true, role: true } } },
  });

  await prisma.conversation.update({ where: { id: convId }, data: { updatedAt: new Date() } });

  return NextResponse.json({ conversationId: convId, message });
}
