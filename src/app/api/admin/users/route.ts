import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, hashPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAuth(["Admin"]);
  if (auth.error || !auth.user) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const users = await prisma.helpdeskUser.findMany({
    include: {
      department: true,
      _count: {
        select: {
          requestedTickets: true,
          assignedTickets: true,
        },
      },
    },
    orderBy: { id: "asc" },
  });

  return NextResponse.json({
    users: users.map((u) => ({
      id: u.id,
      fullName: u.fullName,
      titlePrefix: u.titlePrefix,
      email: u.email,
      userName: u.userName,
      phoneNumber: u.phoneNumber,
      jobTitle: u.jobTitle,
      role: u.role,
      departmentId: u.departmentId,
      department: u.department?.name || null,
      isActive: u.isActive,
      isApproved: u.isApproved,
      isOnLeave: u.isOnLeave,
      backupAssigneeId: u.backupAssigneeId,
      mustChangePassword: u.mustChangePassword,
      canViewAllTickets: u.canViewAllTickets,
      canEditAnyTicket: u.canEditAnyTicket,
      canReassignTickets: u.canReassignTickets,
      lastLoginAt: u.lastLoginAt,
      ticketsCount: u._count.requestedTickets + u._count.assignedTickets,
    })),
  });
}

export async function POST(req: Request) {
  const auth = await requireAuth(["Admin"]);
  if (auth.error || !auth.user) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const body = await req.json();
  const { fullName, titlePrefix, email, role, departmentId, jobTitle, password } = body;

  if (!fullName || !email || !password) {
    return NextResponse.json({ message: "الاسم والبريد وكلمة المرور مطلوبة" }, { status: 400 });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existing = await prisma.helpdeskUser.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    return NextResponse.json({ message: "البريد الإلكتروني مسجل مسبقاً" }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.helpdeskUser.create({
    data: {
      fullName: fullName.trim(),
      titlePrefix: titlePrefix || "",
      email: normalizedEmail,
      role: role || "User",
      departmentId: departmentId ? parseInt(departmentId, 10) : null,
      jobTitle: jobTitle || null,
      passwordHash,
      mustChangePassword: true,
      isActive: true,
      isApproved: true,
    },
  });

  await prisma.activityEntry.create({
    data: {
      userId: auth.user.id,
      userName: auth.user.fullName,
      action: `إضافة مستخدم جديد: ${user.fullName} (${user.email})`,
    },
  });

  return NextResponse.json({ user });
}

export async function PUT(req: Request) {
  const auth = await requireAuth(["Admin"]);
  if (auth.error || !auth.user) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const body = await req.json();
  const {
    id,
    fullName,
    titlePrefix,
    email,
    role,
    departmentId,
    jobTitle,
    isActive,
    isApproved,
    isOnLeave,
    backupAssigneeId,
    canViewAllTickets,
    canEditAnyTicket,
    canReassignTickets,
    resetPassword,
  } = body;

  const userId = parseInt(id, 10);
  if (!userId) {
    return NextResponse.json({ message: "معرف المستخدم مطلوب" }, { status: 400 });
  }

  const target = await prisma.helpdeskUser.findUnique({ where: { id: userId } });
  if (!target) {
    return NextResponse.json({ message: "المستخدم غير موجود" }, { status: 404 });
  }

  const updateData: any = {};
  if (fullName !== undefined) updateData.fullName = fullName.trim();
  if (titlePrefix !== undefined) updateData.titlePrefix = titlePrefix;
  if (email !== undefined) updateData.email = email.trim().toLowerCase();
  if (role !== undefined) updateData.role = role;
  if (departmentId !== undefined) updateData.departmentId = departmentId ? parseInt(departmentId, 10) : null;
  if (jobTitle !== undefined) updateData.jobTitle = jobTitle;
  if (isActive !== undefined) updateData.isActive = Boolean(isActive);
  if (isApproved !== undefined) updateData.isApproved = Boolean(isApproved);
  if (isOnLeave !== undefined) updateData.isOnLeave = Boolean(isOnLeave);
  if (backupAssigneeId !== undefined) updateData.backupAssigneeId = backupAssigneeId ? parseInt(backupAssigneeId, 10) : null;
  if (canViewAllTickets !== undefined) updateData.canViewAllTickets = Boolean(canViewAllTickets);
  if (canEditAnyTicket !== undefined) updateData.canEditAnyTicket = Boolean(canEditAnyTicket);
  if (canReassignTickets !== undefined) updateData.canReassignTickets = Boolean(canReassignTickets);

  if (resetPassword) {
    updateData.passwordHash = await hashPassword(resetPassword);
    updateData.mustChangePassword = true;
  }

  const updated = await prisma.helpdeskUser.update({
    where: { id: userId },
    data: updateData,
  });

  await prisma.activityEntry.create({
    data: {
      userId: auth.user.id,
      userName: auth.user.fullName,
      action: `تعديل بيانات المستخدم: ${updated.fullName}`,
    },
  });

  return NextResponse.json({ user: updated });
}

export async function DELETE(req: Request) {
  const auth = await requireAuth(["Admin"]);
  if (auth.error || !auth.user) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(req.url);
  const idStr = searchParams.get("id");
  const userId = parseInt(idStr || "", 10);

  if (!userId) {
    return NextResponse.json({ message: "معرف المستخدم مطلوب" }, { status: 400 });
  }

  if (userId === auth.user.id) {
    return NextResponse.json({ message: "لا يمكن حذف حسابك الحالي" }, { status: 400 });
  }

  const ticketsCount = await prisma.ticket.count({
    where: { OR: [{ requesterId: userId }, { assignedToId: userId }] },
  });

  if (ticketsCount > 0) {
    // Instead of deleting and breaking relations, deactivate the user
    await prisma.helpdeskUser.update({
      where: { id: userId },
      data: { isActive: false },
    });
    return NextResponse.json({
      message: "تم تعطيل الحساب بدلاً من الحذف لوجود تذاكر مرتبطة به في النظام.",
    });
  }

  await prisma.helpdeskUser.delete({ where: { id: userId } });
  return NextResponse.json({ success: true, message: "تم حذف المستخدم بنجاح" });
}
