import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { calculateSlaStatus, DEFAULT_SLA_HOURS } from "@/lib/sla";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAuth(["Admin", "IT"]);
  if (auth.error || !auth.user) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    total,
    newTickets,
    inProgress,
    waitingEmployee,
    resolved,
    closed,
    unassigned,
    pendingAccounts,
    allTickets,
    delayReasons,
    resolvedToday,
    settings,
  ] = await Promise.all([
    prisma.ticket.count(),
    prisma.ticket.count({ where: { status: "New" } }),
    prisma.ticket.count({ where: { status: "InProgress" } }),
    prisma.ticket.count({ where: { status: "WaitingEmployee" } }),
    prisma.ticket.count({ where: { status: "Resolved" } }),
    prisma.ticket.count({ where: { status: "Closed" } }),
    prisma.ticket.count({ where: { assignedToId: null, status: { notIn: ["Resolved", "Closed"] } } }),
    prisma.helpdeskUser.count({ where: { isApproved: false, isActive: true } }),
    prisma.ticket.findMany({
      select: {
        id: true,
        status: true,
        priority: true,
        createdAt: true,
        resolvedAt: true,
        heldDurationMs: true,
        holdStartedAt: true,
        requester: { select: { department: { select: { name: true } } } },
      },
    }),
    prisma.ticketDelayReason.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { fullName: true } },
        ticket: { select: { title: true } },
      },
    }),
    prisma.ticketHistory.count({
      where: {
        action: { contains: "Resolved" },
        at: { gte: today },
      },
    }),
    prisma.systemSetting.findMany(),
  ]);

  const settingsMap = Object.fromEntries(settings.map((s) => [s.key, s.value]));
  const slaHours = {
    urgent: parseInt(settingsMap["SlaUrgentHours"] || "4", 10),
    high: parseInt(settingsMap["SlaHighHours"] || "24", 10),
    medium: parseInt(settingsMap["SlaMediumHours"] || "72", 10),
    low: parseInt(settingsMap["SlaLowHours"] || "72", 10),
  };

  let overdueCount = 0;
  let totalResolved = 0;
  let onTimeResolved = 0;
  let totalResolutionHours = 0;

  for (const t of allTickets) {
    const sla = calculateSlaStatus(t, slaHours);
    if (!["Resolved", "Closed"].includes(t.status)) {
      if (sla.isOverdue) overdueCount++;
    } else if (t.resolvedAt) {
      totalResolved++;
      if (!sla.isOverdue) onTimeResolved++;
      const resHours = (new Date(t.resolvedAt).getTime() - new Date(t.createdAt).getTime()) / (1000 * 60 * 60);
      totalResolutionHours += resHours;
    }
  }

  const averageResolutionHours = totalResolved > 0 ? +(totalResolutionHours / totalResolved).toFixed(1) : 0;
  const onTimePercent = totalResolved > 0 ? Math.round((onTimeResolved / totalResolved) * 100) : 100;

  // By Department Breakdown
  const deptMap: Record<string, number> = {};
  for (const t of allTickets) {
    const dName = t.requester?.department?.name || "بدون قسم";
    deptMap[dName] = (deptMap[dName] || 0) + 1;
  }
  const byDepartment = Object.entries(deptMap).map(([department, count]) => ({ department, count }));

  // By Status Breakdown
  const byStatus = [
    { status: "جديدة", count: newTickets, key: "New" },
    { status: "قيد المعالجة", count: inProgress, key: "InProgress" },
    { status: "بانتظار الموظف", count: waitingEmployee, key: "WaitingEmployee" },
    { status: "تم الحل", count: resolved, key: "Resolved" },
    { status: "مغلقة", count: closed, key: "Closed" },
  ];

  return NextResponse.json({
    total,
    newTickets,
    inProgress,
    waitingEmployee,
    resolved,
    closed,
    resolvedToday,
    unassigned,
    pendingAccounts: auth.user.role === "Admin" ? pendingAccounts : 0,
    averageResolutionHours,
    overdueCount,
    onTimePercent,
    delayReasons: delayReasons.map((d) => ({
      ticketId: d.ticketId,
      ticketTitle: d.ticket.title,
      reason: d.reason,
      createdAt: d.createdAt,
      by: d.user.fullName,
    })),
    byStatus,
    byDepartment,
  });
}
