import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(req: Request) {
  const auth = await requireAuth();
  if (auth.error || !auth.user) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const priority = searchParams.get("priority");
  const categoryId = searchParams.get("categoryId");
  const assignedToId = searchParams.get("assignedToId");
  const search = searchParams.get("search");
  const scope = searchParams.get("scope"); // 'all', 'my_assigned', 'my_created'

  const user = auth.user;
  const isItOrAdmin = user.role === "IT" || user.role === "Admin";

  const whereClause: any = {};

  // Access Scope
  if (!isItOrAdmin && !user.canViewAllTickets) {
    whereClause.OR = [
      { requesterId: user.id },
      { assignedToId: user.id },
    ];
  } else if (scope === "my_assigned") {
    whereClause.assignedToId = user.id;
  } else if (scope === "my_created") {
    whereClause.requesterId = user.id;
  } else if (scope === "unassigned") {
    whereClause.assignedToId = null;
    whereClause.status = { notIn: ["Resolved", "Closed"] };
  }

  // Filters
  if (status && status !== "all") {
    whereClause.status = status;
  }
  if (priority && priority !== "all") {
    whereClause.priority = priority;
  }
  if (categoryId && categoryId !== "all") {
    whereClause.categoryId = parseInt(categoryId, 10);
  }
  if (assignedToId && assignedToId !== "all") {
    whereClause.assignedToId = parseInt(assignedToId, 10);
  }
  if (search && search.trim()) {
    const q = search.trim();
    const idSearch = !isNaN(Number(q)) ? parseInt(q, 10) : undefined;
    whereClause.OR = [
      ...(idSearch ? [{ id: idSearch }] : []),
      { title: { contains: q } },
      { description: { contains: q } },
      { requester: { fullName: { contains: q } } },
    ];
  }

  const tickets = await prisma.ticket.findMany({
    where: whereClause,
    include: {
      category: { select: { id: true, name: true } },
      requester: {
        select: {
          id: true,
          fullName: true,
          titlePrefix: true,
          email: true,
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
      _count: { select: { comments: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ tickets });
}

export async function POST(req: Request) {
  const auth = await requireAuth();
  if (auth.error || !auth.user) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const user = auth.user;
  const isItOrAdmin = user.role === "IT" || user.role === "Admin";
  const body = await req.json();
  const { title, description, priority, categoryId, assignedToId, requesterId, attachmentPath } = body;

  if (!title || !description || !categoryId) {
    return NextResponse.json({ message: "يرجى ملء جميع الحقول المطلوبة" }, { status: 400 });
  }

  // Determine actual requester
  let effectiveRequesterId = user.id;
  if (isItOrAdmin && requesterId) {
    effectiveRequesterId = parseInt(requesterId, 10);
  }

  const requester = await prisma.helpdeskUser.findUnique({
    where: { id: effectiveRequesterId },
    include: { department: true },
  });

  if (!requester) {
    return NextResponse.json({ message: "مقدم الطلب غير موجود" }, { status: 400 });
  }

  // Determine assignee
  let effectiveAssigneeId: number | null = null;
  if (assignedToId) {
    effectiveAssigneeId = parseInt(assignedToId, 10);
  } else if (requester.departmentId) {
    // Check AssignmentRule
    const rule = await prisma.assignmentRule.findUnique({
      where: { departmentId: requester.departmentId },
      include: { defaultAssignee: true },
    });

    if (rule && rule.defaultAssignee && rule.defaultAssignee.isActive) {
      if (rule.defaultAssignee.isOnLeave && rule.defaultAssignee.backupAssigneeId) {
        effectiveAssigneeId = rule.defaultAssignee.backupAssigneeId;
      } else if (!rule.defaultAssignee.isOnLeave) {
        effectiveAssigneeId = rule.defaultAssignee.id;
      }
    }
  }

  const ticket = await prisma.ticket.create({
    data: {
      title: title.trim(),
      description: description.trim(),
      priority: priority || "Medium",
      categoryId: parseInt(categoryId, 10),
      requesterId: effectiveRequesterId,
      assignedToId: effectiveAssigneeId,
      attachmentPath: attachmentPath || null,
      status: "New",
      history: {
        create: {
          action: "إنشاء التذكرة",
          byUserId: user.id,
        },
      },
    },
    include: {
      category: true,
      requester: { select: { fullName: true, titlePrefix: true } },
      assignedTo: { select: { fullName: true, titlePrefix: true } },
    },
  });

  // Notify assignee if assigned
  if (effectiveAssigneeId && effectiveAssigneeId !== user.id) {
    await prisma.userNotification.create({
      data: {
        userId: effectiveAssigneeId,
        ticketId: ticket.id,
        text: `تم إسناد تذكرة جديدة لك: #${ticket.id} ${ticket.title}`,
      },
    });
  }

  // Activity Log
  await prisma.activityEntry.create({
    data: {
      userId: user.id,
      userName: user.fullName,
      action: `إنشاء تذكرة رقم #${ticket.id} (${ticket.title})`,
    },
  });

  return NextResponse.json({ ticket });
}
