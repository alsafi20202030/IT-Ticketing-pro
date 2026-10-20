import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAuth();
  if (auth.error || !auth.user) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const ticketId = parseInt(params.id, 10);
  if (isNaN(ticketId)) {
    return NextResponse.json({ message: "معرف التذكرة غير صالح" }, { status: 400 });
  }

  const user = auth.user;
  const isItOrAdmin = user.role === "IT" || user.role === "Admin";

  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
  });

  if (!ticket) {
    return NextResponse.json({ message: "التذكرة غير موجودة" }, { status: 404 });
  }

  const body = await req.json();
  const { text, isInternal, attachmentPath } = body;

  if (!text || !text.trim()) {
    return NextResponse.json({ message: "نص الرد مطلوب" }, { status: 400 });
  }

  // Only IT or Admin can post internal comments
  const effectiveIsInternal = isItOrAdmin ? Boolean(isInternal) : false;

  const comment = await prisma.ticketComment.create({
    data: {
      ticketId: ticket.id,
      userId: user.id,
      text: text.trim(),
      isInternal: effectiveIsInternal,
      attachmentPath: attachmentPath || null,
    },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          titlePrefix: true,
          role: true,
        },
      },
    },
  });

  // History entry
  await prisma.ticketHistory.create({
    data: {
      ticketId: ticket.id,
      action: effectiveIsInternal ? "إضافة ملاحظة داخلية" : "إضافة رد",
      byUserId: user.id,
    },
  });

  // Notifications
  if (!effectiveIsInternal) {
    // Notify requester if reply is from technician
    if (ticket.requesterId !== user.id) {
      await prisma.userNotification.create({
        data: {
          userId: ticket.requesterId,
          ticketId: ticket.id,
          text: `رد جديد على تذكرتك #${ticket.id} من ${user.fullName}`,
        },
      });
    }

    // Notify assignee if reply is from requester
    if (ticket.assignedToId && ticket.assignedToId !== user.id) {
      await prisma.userNotification.create({
        data: {
          userId: ticket.assignedToId,
          ticketId: ticket.id,
          text: `رد جديد من العميل على التذكرة #${ticket.id}`,
        },
      });
    }
  }

  return NextResponse.json({ comment });
}
