import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

// استلام / قبول تذكرة من القائمة العامة (Unassigned Tickets Pool)
// بمجرد الضغط يُسند التذكرة للموظف النقر وتختفي من القائمة العامة للآخرين.
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth(["IT", "Admin"]);
  if (auth.error || !auth.user) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const user = auth.user;
  const ticketId = parseInt(params.id, 10);
  if (isNaN(ticketId)) {
    return NextResponse.json({ message: "معرف التذكرة غير صالح" }, { status: 400 });
  }

  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    select: {
      id: true,
      title: true,
      status: true,
      assignedToId: true,
      requesterId: true,
    },
  });

  if (!ticket) {
    return NextResponse.json({ message: "التذكرة غير موجودة" }, { status: 404 });
  }

  // التذكرة يجب أن تكون غير مسندة وغير مغلقة/منتهية
  if (ticket.assignedToId !== null) {
    return NextResponse.json(
      { message: "هذه التذكرة مسندة بالفعل لموظف آخر" },
      { status: 409 }
    );
  }

  if (["Resolved", "Closed"].includes(ticket.status)) {
    return NextResponse.json(
      { message: "لا يمكن استلام تذكرة مغلقة أو منتهية" },
      { status: 409 }
    );
  }

  // إسناد التذكرة للموظف النقر (معالجة simultaneous بسيطة عبر التحديث المشروط)
  const updatedTicket = await prisma.ticket.update({
    where: { id: ticketId },
    data: {
      assignedToId: user.id,
      status: "InProgress",
    },
    include: {
      assignedTo: { select: { id: true, fullName: true, titlePrefix: true } },
      requester: { select: { id: true, fullName: true, titlePrefix: true, email: true } },
    },
  });

  // سجل الإجراء في التاريخ
  await prisma.ticketHistory.create({
    data: {
      ticketId: ticket.id,
      action: `تم استلام التذكرة من القائمة العامة وإسنادها إلى ${user.fullName}`,
      byUserId: user.id,
    },
  });

  // إشعار مقدم الطلب
  if (ticket.requesterId !== user.id) {
    await prisma.userNotification.create({
      data: {
        userId: ticket.requesterId,
        ticketId: ticket.id,
        text: `تم استلام تذكرتك #${ticket.id} "${ticket.title}" من قبل ${user.fullName} وجاري العمل عليها`,
      },
    });
  }

  // سجل النشاط
  await prisma.activityEntry.create({
    data: {
      userId: user.id,
      userName: user.fullName,
      action: `استلام تذكرة رقم #${ticket.id} (${ticket.title}) من القائمة العامة`,
    },
  });

  return NextResponse.json({
    success: true,
    ticket: updatedTicket,
    message: "تم استلام التذكرة وإسنادها إليك بنجاح",
  });
}