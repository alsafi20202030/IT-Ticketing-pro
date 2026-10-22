import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth();
  if (auth.error || !auth.user) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const ticketId = parseInt(params.id, 10);
  if (isNaN(ticketId)) {
    return NextResponse.json({ message: "معرف التذكرة غير صالح" }, { status: 400 });
  }

  const messages = await prisma.ticketMessage.findMany({
    where: { ticketId },
    orderBy: { createdAt: "asc" },
    include: {
      user: {
        select: { id: true, fullName: true, role: true },
      },
    },
  });

  return NextResponse.json({ messages });
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth();
  if (auth.error || !auth.user) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const ticketId = parseInt(params.id, 10);
  if (isNaN(ticketId)) {
    return NextResponse.json({ message: "معرف التذكرة غير صالح" }, { status: 400 });
  }

  const user = auth.user;
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    select: { id: true, requesterId: true, assignedToId: true, title: true },
  });

  if (!ticket) {
    return NextResponse.json({ message: "التذكرة غير موجودة" }, { status: 404 });
  }

  const body = await req.json();
  const { text } = body;

  if (!text || !text.trim()) {
    return NextResponse.json({ message: "نص الرسالة مطلوب" }, { status: 400 });
  }

  const message = await prisma.ticketMessage.create({
    data: {
      ticketId: ticket.id,
      userId: user.id,
      body: text.trim(),
      senderName: user.fullName,
      isFromRequester: user.id === ticket.requesterId,
    },
    include: {
      user: {
        select: { id: true, fullName: true, role: true },
      },
    },
  });

  // History entry
  await prisma.ticketHistory.create({
    data: {
      ticketId: ticket.id,
      action: "إرسال رسالة في المحادثة",
      byUserId: user.id,
    },
  });

  // Notify counterparty
  const isRequester = user.id === ticket.requesterId;
  const notifyUserId = isRequester ? ticket.assignedToId : ticket.requesterId;
  if (notifyUserId && notifyUserId !== user.id) {
    await prisma.userNotification.create({
      data: {
        userId: notifyUserId,
        ticketId: ticket.id,
        text: `رسالة جديدة في التذكرة #${ticket.id} "${ticket.title}" من ${user.fullName}`,
      },
    });
  }

  return NextResponse.json({ message }, { status: 201 });
}
