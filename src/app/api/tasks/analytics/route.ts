import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireAuth(["Admin", "IT", "User"]);
  if (auth.error || !auth.user) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const user = auth.user;
  const isItOrAdmin = user.role === "IT" || user.role === "Admin";

  const { searchParams } = new URL(req.url);
  const requestedUserId = searchParams.get("userId");
  const search = (searchParams.get("search") || "").trim();

  // الموظف العادي يرى إحصائيات نفسه فقط
  let targetUserIds: number[] = [];
  if (!isItOrAdmin) {
    targetUserIds = [user.id];
  } else if (requestedUserId) {
    const id = parseInt(requestedUserId, 10);
    if (!isNaN(id)) targetUserIds = [id];
  }

  // قائمة الموظفين المراد عرض إحصائياتهم
  const employeesWhere: any = {
    isActive: true,
    isApproved: true,
  };
  if (search) {
    employeesWhere.fullName = { contains: search };
  }
  if (targetUserIds.length > 0) {
    employeesWhere.id = { in: targetUserIds };
  }

  const employees = await prisma.helpdeskUser.findMany({
    where: employeesWhere,
    select: {
      id: true,
      fullName: true,
      role: true,
      departmentId: true,
      department: { select: { name: true } },
    },
    orderBy: { fullName: "asc" },
  });

  const ids = employees.map((e) => e.id);

  // مهام هؤلاء الموظفين من قاعدة البيانات الفعلية
  const tasks = await prisma.employeeTask.findMany({
    where: { userId: { in: ids.length ? ids : [-1] } },
    select: { id: true, userId: true, status: true, workDate: true },
  });

  const now = new Date();

  const employeesStats = employees.map((e) => {
    const et = tasks.filter((t) => t.userId === e.id);
    const completed = et.filter((t) => t.status === "Completed").length;
    const pending = et.filter((t) => t.status !== "Completed").length;
    const overdue = et.filter((t) => t.status !== "Completed" && new Date(t.workDate) < now).length;
    return {
      id: e.id,
      fullName: e.fullName,
      role: e.role,
      department: e.department?.name || null,
      totalTasks: et.length,
      completedTasks: completed,
      pendingTasks: pending,
      overdueTasks: overdue,
      completionRate: et.length ? Math.round((completed / et.length) * 100) : 0,
    };
  });

  const totalTasks = tasks.length;
  const totalCompleted = tasks.filter((t) => t.status === "Completed").length;
  const totalPending = totalTasks - totalCompleted;
  const totalOverdue = tasks.filter((t) => t.status !== "Completed" && new Date(t.workDate) < now).length;

  return NextResponse.json({
    employees: employeesStats,
    summary: {
      totalTasks,
      totalCompleted,
      totalPending,
      totalOverdue,
    },
    myId: user.id,
    isItOrAdmin,
    canViewAll: isItOrAdmin || user.canViewAllTickets,
  });
}