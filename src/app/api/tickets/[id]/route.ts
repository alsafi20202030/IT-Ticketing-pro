import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (auth.error || !auth.user) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const user = auth.user;
  const isItOrAdmin = user.role === "IT" || user.role === "Admin";

  const { id } = await params;
  const ticketId = parseInt(id, 10);
  if (isNaN(ticketId)) {
    return NextResponse.json({ message: "معرف التذكرة غير صالح" }, { status: 400 });
  }

  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: {
      category: { select: { id: true, name: true } },
      requester: {
        select: {
          id: true,
          fullName: true,
          titlePrefix: true,
          department: { select: { id: true, name: true } },
        },
      },
      assignedTo: { select: { id: true, fullName: true, titlePrefix: true, role: true } },
      comments: {
        include: {
          user: { select: { id: true, fullName: true, titlePrefix: true, role: true } },
        },
        orderBy: { createdAt: "asc" },
      },
      history: {
        include: { byUser: { select: { id: true, fullName: true, titlePrefix: true } } },
        orderBy: { at: "desc" },
        take: 50,
      },
      delayReasons: {
        include: { user: { select: { id: true, fullName: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!ticket) {
    return NextResponse.json({ message: "التذكرة غير موجودة" }, { status: 404 });
  }

  const canView =
    isItOrAdmin ||
    user.canViewAllTickets ||
    ticket.requesterId === user.id ||
    ticket.assignedToId === user.id ||
    (!ticket.assignedToId && !["Resolved", "Closed"].includes(ticket.status));

  if (!canView) {
    return NextResponse.json({ message: "ليس لديك صلاحية لعرض هذه التذكرة" }, { status: 403 });
  }

  const visibleComments = isItOrAdmin ? ticket.comments : ticket.comments.filter((c) => !c.isInternal);

  return NextResponse.json({
    ticket: { ...ticket, comments: visibleComments },
  });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (auth.error || !auth.user) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const user = auth.user;
  const isItOrAdmin = user.role === "IT" || user.role === "Admin";

  const { id } = await params;
  const ticketId = parseInt(id, 10);
  if (isNaN(ticketId)) {
    return NextResponse.json({ message: "معرف التذكرة غير صالح" }, { status: 400 });
  }

  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket) {
    return NextResponse.json({ message: "التذكرة غير موجودة" }, { status: 404 });
  }

  const canEdit =
    isItOrAdmin ||
    user.canEditAnyTicket ||
    ticket.requesterId === user.id ||
    ticket.assignedToId === user.id;
  if (!canEdit) {
    return NextResponse.json({ message: "ليس لديك صلاحية تعديل هذه التذكرة" }, { status: 403 });
  }

  const body = await req.json();
  const { title, description, status, priority, categoryId, assignedToId } = body;

  const updateData: any = {};
  const historyEntries: string[] = [];

  if (title !== undefined && title !== null && String(title).trim() !== "" && String(title).trim() !== ticket.title) {
    updateData.title = String(title).trim();
    historyEntries.push(`تعديل العنوان من "${ticket.title}" إلى "${String(title).trim()}"`);
  }

  if (description !== undefined && description !== null && description !== ticket.description) {
    updateData.description = description;
    historyEntries.push("تعديل وصف التذكرة");
  }

  if (priority !== undefined && priority !== null && priority !== ticket.priority) {
    updateData.priority = priority;
    historyEntries.push(`تغيير الأولوية من ${ticket.priority} إلى ${priority}`);
  }

  if (categoryId !== undefined && categoryId !== null && parseInt(categoryId, 10) !== ticket.categoryId) {
    updateData.categoryId = parseInt(categoryId, 10);
    historyEntries.push("تعديل فئة التذكرة");
  }

  if (status !== undefined && status !== null && status !== ticket.status) {
    const now = new Date();
    if (status === "WaitingEmployee") {
      updateData.holdStartedAt = now;
    }
    if (status === "Resolved") {
      updateData.resolvedAt = now;
    } else if (ticket.status === "Resolved") {
      updateData.resolvedAt = null;
      updateData.holdStartedAt = null;
    }
    updateData.status = status;
    historyEntries.push(`تغيير الحالة من ${ticket.status} إلى ${status}`);

    if (ticket.requesterId !== user.id) {
      await prisma.userNotification.create({
        data: {
          userId: ticket.requesterId,
          ticketId: ticket.id,
          text: `تم تحديث حالة تذكرتك #${ticket.id} إلى: ${status}`,
        },
      });
    }
  }

  if (assignedToId !== undefined && assignedToId !== ticket.assignedToId) {
    const canReassign = isItOrAdmin || user.canReassignTickets;
    if (!canReassign) {
      return NextResponse.json({ message: "ليس لديك صلاحية لإعادة إسناد التذكرة" }, { status: 403 });
    }

    const newAssigneeId = assignedToId ? parseInt(assignedToId, 10) : null;
    updateData.assignedToId = newAssigneeId;

    let assigneeName = "غير مسندة";
    if (newAssigneeId) {
      const newAssignee = await prisma.helpdeskUser.findUnique({ where: { id: newAssigneeId } });
      assigneeName = newAssignee?.fullName || "محدد";

      if (newAssigneeId !== user.id) {
        await prisma.userNotification.create({
          data: {
            userId: newAssigneeId,
            ticketId: ticket.id,
            text: `تم إسناد التذكرة #${ticket.id} (${ticket.title}) لك`,
          },
        });
      }
    }

    historyEntries.push(`إسناد التذكرة إلى: ${assigneeName}`);
  }

  if (Object.keys(updateData).length === 0) {
    const current = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        category: true,
        requester: { select: { fullName: true, titlePrefix: true } },
        assignedTo: { select: { fullName: true, titlePrefix: true } },
      },
    });
    return NextResponse.json({ ticket: current, message: "لا توجد تغييرات لحفظها" });
  }

  const updatedTicket = await prisma.ticket.update({ where: { id: ticketId }, data: updateData });

  for (const action of historyEntries) {
    await prisma.ticketHistory.create({
      data: { ticketId: ticket.id, action, byUserId: user.id },
    });
  }

  await prisma.activityEntry.create({
    data: { userId: user.id, userName: user.fullName, action: `تعديل التذكرة #${ticket.id}` },
  });

  try {
    if (updateData.status === "InProgress") {
      const assigneeId = updateData.assignedToId ?? ticket.assignedToId;
      if (assigneeId) {
        const existingTask = await prisma.employeeTask.findFirst({ where: { ticketId: ticket.id } });
        if (!existingTask) {
          await prisma.employeeTask.create({
            data: {
              userId: assigneeId,
              ticketId: ticket.id,
              title: updateData.title ?? ticket.title,
              description: updateData.description ?? ticket.description,
              taskType: "RequestHandling",
              status: "Pending",
            },
          });
        }
      }
    }
  } catch (e) {
    console.error("Auto task creation failed:", e);
  }

  return NextResponse.json({ ticket: updatedTicket });
}