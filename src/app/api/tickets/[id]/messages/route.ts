import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (auth.error || !auth.user) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const { id } = await params;
  const ticketId = parseInt(id, 10);
  if (isNaN(ticketId)) {
    return NextResponse.json({ message: "معرف التذكرة غير صالح" }, { status: 400 });
  }

  const user = auth.user;
  const isItOrAdmin = user.role === "IT" || user.role === "Admin";

  const messages = await prisma.ticketMessage.findMany({
    where: isItOrAdmin
      ? { ticketId }
      : { ticketId, isStaffOnly: false },
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
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (auth.error || !auth.user) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const { id } = await params;
  const ticketId = parseInt(id, 10);
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
  const { text, isStaffOnly } = body;

  if (!text || !text.trim()) {
    return NextResponse.json({ message: "نص الرسالة مطلوب" }, { status: 400 });
  }

  const isItOrAdmin = user.role === "IT" || user.role === "Admin";
  const effectiveStaffOnly = isItOrAdmin ? Boolean(isStaffOnly) : false;

  const message = await prisma.ticketMessage.create({
    data: {
      ticketId: ticket.id,
      userId: user.id,
      body: text.trim(),
      senderName: user.fullName,
      isFromRequester: user.id === ticket.requesterId,
      isStaffOnly: effectiveStaffOnly,
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
      action: effectiveStaffOnly ? "إرسال رسالة داخلية للموظفين" : "إرسال رسالة في المحادثة",
      byUserId: user.id,
    },
  });

  // Notify counterparty (skip for staff-only internal messages)
  if (!effectiveStaffOnly) {
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
  }

  return NextResponse.json({ message }, { status: 201 });
}
