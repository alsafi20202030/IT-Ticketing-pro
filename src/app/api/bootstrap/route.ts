import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { DEFAULT_SLA_HOURS } from "@/lib/sla";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ message: "غير مصرح" }, { status: 401 });
  }

  const isItOrAdmin = user.role === "IT" || user.role === "Admin";

  const [categories, departments, staff, openTickets, settings, requesters, assignmentRules] =
    await Promise.all([
      prisma.category.findMany({ orderBy: { id: "asc" } }),
      prisma.department.findMany({ orderBy: { name: "asc" } }),
      prisma.helpdeskUser.findMany({
        where: { role: "IT", isActive: true },
        select: {
          id: true,
          fullName: true,
          titlePrefix: true,
          isOnLeave: true,
        },
        orderBy: { fullName: "asc" },
      }),
      prisma.ticket.groupBy({
        by: ["assignedToId"],
        where: {
          assignedToId: { not: null },
          status: { notIn: ["Resolved", "Closed"] },
        },
        _count: { id: true },
      }),
      prisma.systemSetting.findMany(),
      prisma.helpdeskUser.findMany({
        where: {
          isActive: true,
          isApproved: true,
          ...(isItOrAdmin ? {} : { departmentId: user.departmentId || undefined }),
        },
        select: {
          id: true,
          fullName: true,
          titlePrefix: true,
          departmentId: true,
          role: true,
        },
        orderBy: { fullName: "asc" },
      }),
      isItOrAdmin
        ? prisma.assignmentRule.findMany({
            include: { defaultAssignee: { select: { id: true, fullName: true } } },
          })
        : [],
    ]);

  const settingsMap = Object.fromEntries(settings.map((s) => [s.key, s.value]));

  const staffLoad = openTickets
    .filter((t) => t.assignedToId !== null)
    .map((t) => ({ assigneeId: t.assignedToId!, count: t._count.id }));

  const slaHours = {
    urgent: parseInt(settingsMap["SlaUrgentHours"] || "4", 10),
    high: parseInt(settingsMap["SlaHighHours"] || "24", 10),
    medium: parseInt(settingsMap["SlaMediumHours"] || "72", 10),
    low: parseInt(settingsMap["SlaLowHours"] || "72", 10),
  };

  return NextResponse.json({
    user: {
      id: user.id,
      fullName: user.fullName,
      titlePrefix: user.titlePrefix,
      displayName: user.titlePrefix ? `${user.titlePrefix} ${user.fullName}` : user.fullName,
      email: user.email,
      role: user.role,
      department: user.department?.name || null,
      departmentId: user.departmentId,
      mustChangePassword: user.mustChangePassword,
      canViewAllTickets: user.canViewAllTickets,
      canEditAnyTicket: user.canEditAnyTicket,
      canReassignTickets: user.canReassignTickets,
    },
    categories,
    departments,
    staff: staff.map((s) => ({
      id: s.id,
      fullName: s.fullName,
      titlePrefix: s.titlePrefix,
      displayName: s.titlePrefix ? `${s.titlePrefix} ${s.fullName}` : s.fullName,
      isOnLeave: s.isOnLeave,
    })),
    staffLoad,
    slaHours,
    requesters: requesters.map((r) => ({
      id: r.id,
      fullName: r.fullName,
      titlePrefix: r.titlePrefix,
      displayName: r.titlePrefix ? `${r.titlePrefix} ${r.fullName}` : r.fullName,
      departmentId: r.departmentId,
      role: r.role,
    })),
    assignmentRules: assignmentRules.map((r) => ({
      departmentId: r.departmentId,
      defaultAssigneeId: r.defaultAssigneeId,
      assigneeName: r.defaultAssignee?.fullName,
    })),
    publicSettings: {
      SystemName: settingsMap["SystemName"] || "IT Desk",
      Subtitle: settingsMap["Subtitle"] || "بوابة طلبات الدعم الفني",
      PrimaryColor: settingsMap["PrimaryColor"] || "#7A1F3D",
      CompanyName: settingsMap["CompanyName"] || "الشركة",
      FooterText: settingsMap["FooterText"] || "بوابة الدعم الداخلي",
      LogoPath: settingsMap["LogoPath"] || "/logo-placeholder.svg",
      AllowSelfRegistration: settingsMap["AllowSelfRegistration"] || "true",
      RegistrationRequiresApproval: settingsMap["RegistrationRequiresApproval"] || "false",
      AllowedEmailDomain: settingsMap["AllowedEmailDomain"] || "",
      ShowPublicHomePage: settingsMap["ShowPublicHomePage"] || "false",
      AllowRequesterAssigneeChoice: settingsMap["AllowRequesterAssigneeChoice"] || "true",
      AssignmentRulesEnabled: settingsMap["AssignmentRulesEnabled"] || "true",
    },
  });
}
