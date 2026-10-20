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
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
  });

  if (!ticket) {
    return NextResponse.json({ message: "التذكرة غير موجودة" }, { status: 404 });
  }

  // Only the requester can rate the ticket
  if (ticket.requesterId !== user.id) {
    return NextResponse.json({ message: "فقط صاحب التذكرة يمكنه تقييم الخدمة" }, { status: 403 });
  }

  if (ticket.status !== "Resolved" && ticket.status !== "Closed") {
    return NextResponse.json({ message: "يمكن تقييم التذكرة فقط بعد حلها أو إغلاقها" }, { status: 400 });
  }

  const { rating, comment } = await req.json();
  const numRating = parseInt(rating, 10);

  if (isNaN(numRating) || numRating < 1 || numRating > 5) {
    return NextResponse.json({ message: "التقييم يجب أن يكون بين 1 و 5 نجوم" }, { status: 400 });
  }

  const updatedTicket = await prisma.ticket.update({
    where: { id: ticket.id },
    data: {
      rating: numRating,
      ratingComment: comment ? comment.trim() : null,
    },
  });

  await prisma.ticketHistory.create({
    data: {
      ticketId: ticket.id,
      action: `تقييم الخدمة: ${numRating} نجوم`,
      byUserId: user.id,
    },
  });

  // Notify technician of rating
  if (ticket.assignedToId) {
    await prisma.userNotification.create({
      data: {
        userId: ticket.assignedToId,
        ticketId: ticket.id,
        text: `قام العميل بتقييم التذكرة #${ticket.id} بـ ${numRating} نجوم`,
      },
    });
  }

  return NextResponse.json({ ticket: updatedTicket });
}
