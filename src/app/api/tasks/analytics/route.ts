import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireAuth(["Admin", "IT"]);
  if (auth.error || !auth.user) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const user = auth.user;
  const isItOrAdmin = user.role === "IT" || user.role === "Admin";
  const { searchParams } = new URL(req.url);

  const userIdFilter = searchParams.get("userId");
  const statusFilter = searchParams.get("status");
  const priorityFilter = searchParams.get("priority");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  const where: any = {};

  if (!isItOrAdmin) {
    where.userId = user.id;
  } else if (userIdFilter) {
    where.userId = parseInt(userIdFilter, 10);
  }

  if (statusFilter) where.status = statusFilter;
  if (priorityFilter) where.priority = priorityFilter;

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  const [totalTasks, tasksByStatus, tasksByPriority, tasksPerEmployee, completedPerEmployee, recentTasks, overdueTasks] =
    await Promise.all([
      prisma.employeeTask.count({ where }),
      prisma.employeeTask.groupBy({
        by: ["status"],
        where,
        _count: { id: true },
      }),
      prisma.employeeTask.groupBy({
        by: ["taskType"],
        where,
        _count: { id: true },
      }),
      prisma.employeeTask.findMany({
        where,
        include: {
          user: { select: { id: true, fullName: true, role: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.employeeTask.groupBy({
        by: ["userId"],
        where: { ...where, status: "Completed" },
        _count: { id: true },
      }),
      prisma.employeeTask.findMany({
        where,
        include: {
          user: { select: { id: true, fullName: true, role: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.employeeTask.count({
        where: {
          ...where,
          status: { not: "Completed" },
          workDate: { lt: new Date() },
        },
      }),
    ]);

  // Calculate average completion time for completed tasks
  const completedTasks = await prisma.employeeTask.findMany({
    where: { ...where, status: "Completed", completedAt: { not: null } },
    select: { createdAt: true, completedAt: true, userId: true },
  });

  let totalDurationMs = 0;
  for (const t of completedTasks) {
    if (t.createdAt && t.completedAt) {
      totalDurationMs += new Date(t.completedAt).getTime() - new Date(t.createdAt).getTime();
    }
  }
  const averageDurationHours = completedTasks.length > 0 ? totalDurationMs / completedTasks.length / (1000 * 60 * 60) : 0;

  const completedCount = tasksByStatus.find((t) => t.status === "Completed")?._count.id || 0;
  const completionRate = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  // Build per-employee stats
  const employeeStats = tasksPerEmployee.reduce((acc: any, t: any) => {
    const empId = t.userId;
    if (!acc[empId]) {
      acc[empId] = {
        userId: empId,
        fullName: t.user?.fullName || "غير معروف",
        role: t.user?.role || "User",
        total: 0,
        completed: 0,
      };
    }
    acc[empId].total++;
    if (t.status === "Completed") acc[empId].completed++;
    return acc;
  }, {});

  // Add completed counts from groupBy
  for (const c of completedPerEmployee) {
    if (employeeStats[c.userId]) {
      employeeStats[c.userId].completed = c._count.id;
    }
  }

  const employeesList = Object.values(employeeStats);

  return NextResponse.json({
    summary: {
      total: totalTasks,
      pending: tasksByStatus.find((t) => t.status === "Pending")?._count.id || 0,
      completed: completedCount,
      overdue: overdueTasks,
      completionRate,
      averageDurationHours: Math.round(averageDurationHours * 10) / 10,
    },
    byStatus: tasksByStatus.map((t) => ({ status: t.status, count: t._count.id })),
    byPriority: tasksByPriority.map((t) => ({ type: t.taskType, count: t._count.id })),
    employees: employeesList,
    recentTasks: recentTasks.map((t: any) => ({
      id: t.id,
      title: t.title,
      status: t.status,
      taskType: t.taskType,
      userId: t.userId,
      userName: t.user?.fullName || "غير معروف",
      workDate: t.workDate,
      completedAt: t.completedAt,
      createdAt: t.createdAt,
    })),
  });
}