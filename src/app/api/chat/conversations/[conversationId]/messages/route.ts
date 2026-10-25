import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { conversationId: string } }
) {
  const auth = await requireAuth();
  if (auth.error || !auth.user) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const user = auth.user;
  const isAdmin = user.role === "Admin";
  const conversationId = parseInt(params.conversationId, 10);
  if (isNaN(conversationId)) {
    return NextResponse.json({ message: "معرف المحادثة غير صالح" }, { status: 400 });
  }

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      participants: { include: { user: { select: { id: true, fullName: true, role: true } } } },
      ticket: { select: { id: true, title: true, assignedToId: true, requesterId: true } },
    },
  });

  if (!conversation) {
    return NextResponse.json({ message: "المحادثة غير موجودة" }, { status: 404 });
  }

  const isParticipant = conversation.participants.some((p) => p.userId === user.id);
  if (!isAdmin && !isParticipant) {
    return NextResponse.json({ message: "ليس لديك صلاحية عرض هذه المحادثة" }, { status: 403 });
  }

  // موظف الـ IT يرى فقط محادثات التذاكر المسندة إليه
  if (user.role === "IT" && conversation.ticketId) {
    if (conversation.ticket?.assignedToId !== user.id && conversation.ticket?.requesterId !== user.id) {
      return NextResponse.json({ message: "ليس لديك صلاحية عرض هذه المحادثة" }, { status: 403 });
    }
  }

  const messages = await prisma.chatMessage.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
    include: {
      sender: { select: { id: true, fullName: true, role: true, staffRole: { select: { id: true, name: true, color: true } } } },
    },
  });

  // تحديد الرسائل كمقروءة للمستخدم الحالي
  await prisma.chatMessage.updateMany({
    where: { conversationId, senderId: { not: user.id }, isRead: false },
    data: { isRead: true },
  });

  await prisma.conversationParticipant.updateMany({
    where: { conversationId, userId: user.id },
    data: { lastReadAt: new Date() },
  });

  return NextResponse.json({ messages, conversation });
}

// إرسال رسالة جديدة في المحادثة
// body: { text }
export async function POST(
  req: Request,
  { params }: { params: { conversationId: string } }
) {
  const auth = await requireAuth();
  if (auth.error || !auth.user) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const user = auth.user;
  const isAdmin = user.role === "Admin";
  const conversationId = parseInt(params.conversationId, 10);
  if (isNaN(conversationId)) {
    return NextResponse.json({ message: "معرف المحادثة غير صالح" }, { status: 400 });
  }

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      participants: { include: { user: { select: { id: true, fullName: true } } } },
      ticket: { select: { id: true, title: true, requesterId: true, assignedToId: true } },
    },
  });

  if (!conversation) {
    return NextResponse.json({ message: "المحادثة غير موجودة" }, { status: 404 });
  }

  const isParticipant = conversation.participants.some((p) => p.userId === user.id);
  if (!isAdmin && !isParticipant) {
    return NextResponse.json({ message: "ليس لديك صلاحية الإرسال في هذه المحادثة" }, { status: 403 });
  }

  // موظف الـ IT يرسل فقط في محادثات التذاكر المسندة إليه
  if (user.role === "IT" && conversation.ticketId) {
    if (conversation.ticket?.assignedToId !== user.id && conversation.ticket?.requesterId !== user.id) {
      return NextResponse.json({ message: "ليس لديك صلاحية الإرسال في هذه المحادثة" }, { status: 403 });
    }
  }

  const body = await req.json();
  const { text } = body;
  if (!text || !text.trim()) {
    return NextResponse.json({ message: "نص الرسالة مطلوب" }, { status: 400 });
  }

  const message = await prisma.chatMessage.create({
    data: {
      conversationId,
      senderId: user.id,
      body: text.trim(),
    },
    include: {
      sender: { select: { id: true, fullName: true, role: true, staffRole: { select: { id: true, name: true, color: true } } } },
    },
  });

  // إشعار المشاركين الآخرين
  const otherParticipants = conversation.participants.filter((p) => p.userId !== user.id);
  for (const p of otherParticipants) {
    await prisma.userNotification.create({
      data: {
        userId: p.userId,
        ticketId: conversation.ticketId ?? null,
        text: `رسالة جديدة في المحادثة "${conversation.title}" من ${user.fullName}`,
      },
    });
  }

  // تحديث وقت التعديل على المحادثة
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  });

  return NextResponse.json({ message }, { status: 201 });
}