import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: { id: string } }) {
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
    include: {
      category: true,
      requester: {
        select: {
          id: true,
          fullName: true,
          titlePrefix: true,
          email: true,
          jobTitle: true,
          department: { select: { id: true, name: true } },
        },
      },
      assignedTo: {
        select: {
          id: true,
          fullName: true,
          titlePrefix: true,
          email: true,
        },
      },
      comments: {
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
        orderBy: { createdAt: "asc" },
      },
      history: {
        include: {
          byUser: {
            select: {
              id: true,
              fullName: true,
              titlePrefix: true,
            },
          },
        },
        orderBy: { at: "desc" },
      },
      delayReasons: {
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!ticket) {
    return NextResponse.json({ message: "التذكرة غير موجودة" }, { status: 404 });
  }

  // Permission check
  const canView =
    isItOrAdmin ||
    user.canViewAllTickets ||
    ticket.requesterId === user.id ||
    ticket.assignedToId === user.id ||
    (!ticket.assignedToId && !["Resolved", "Closed"].includes(ticket.status));

  if (!canView) {
    return NextResponse.json({ message: "ليس لديك صلاحية لعرض هذه التذكرة" }, { status: 403 });
  }

  // Filter internal comments for normal users
  const visibleComments = isItOrAdmin
    ? ticket.comments
    : ticket.comments.filter((c) => !c.isInternal);

  return NextResponse.json({
    ticket: {
      ...ticket,
      comments: visibleComments,
    },
  });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
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
    include: { requester: true, assignedTo: true },
  });

  if (!ticket) {
    return NextResponse.json({ message: "التذكرة غير موجودة" }, { status: 404 });
  }

  const canEdit =
    isItOrAdmin ||
    user.canEditAnyTicket ||
    ticket.assignedToId === user.id ||
    ticket.requesterId === user.id;

  if (!canEdit) {
    return NextResponse.json({ message: "ليس لديك صلاحية لتعديل هذه التذكرة" }, { status: 403 });
  }

  const body = await req.json();
  const { status, priority, assignedToId, delayReason } = body;

  const updateData: any = {};
  const historyEntries: string[] = [];

  // Status Change
  if (status && status !== ticket.status) {
    updateData.status = status;
    const now = new Date();

    if (ticket.status === "OnHold" && status !== "OnHold" && ticket.holdStartedAt) {
      const duration = now.getTime() - new Date(ticket.holdStartedAt).getTime();
      updateData.heldDurationMs = (ticket.heldDurationMs || 0) + duration;
      updateData.holdStartedAt = null;
    }

    if (status === "OnHold") {
      updateData.holdStartedAt = now;
      if (delayReason) {
        await prisma.ticketDelayReason.create({
          data: {
            ticketId: ticket.id,
            userId: user.id,
            reason: delayReason.trim(),
          },
        });
      }
    }

    if (status === "Resolved") {
      updateData.resolvedAt = now;
    } else if (ticket.status === "Resolved") {
      updateData.resolvedAt = null;
    }

    historyEntries.push(`تغيير الحالة من ${ticket.status} إلى ${status}`);

    // Notify requester
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

  // Priority Change
  if (priority && priority !== ticket.priority) {
    updateData.priority = priority;
    historyEntries.push(`تغيير الأولوية من ${ticket.priority} إلى ${priority}`);
  }

  // Assignee Change
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

  // Save changes
  const updatedTicket = await prisma.ticket.update({
    where: { id: ticket.id },
    data: updateData,
  });

  // Create history entries
  for (const action of historyEntries) {
    await prisma.ticketHistory.create({
      data: {
        ticketId: ticket.id,
        action,
        byUserId: user.id,
      },
    });
  }

  return NextResponse.json({ ticket: updatedTicket });
}
