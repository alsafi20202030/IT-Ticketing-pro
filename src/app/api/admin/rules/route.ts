import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAuth(["Admin"]);
  if (auth.error || !auth.user) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const [departments, rules, staff] = await Promise.all([
    prisma.department.findMany({ orderBy: { name: "asc" } }),
    prisma.assignmentRule.findMany({
      include: { defaultAssignee: true },
    }),
    prisma.helpdeskUser.findMany({
      where: { role: "IT", isActive: true },
      select: { id: true, fullName: true, titlePrefix: true },
    }),
  ]);

  const rulesMap = new Map(rules.map((r) => [r.departmentId, r]));

  const result = departments.map((d) => {
    const rule = rulesMap.get(d.id);
    return {
      departmentId: d.id,
      department: d.name,
      assigneeId: rule ? rule.defaultAssigneeId : null,
      assignee: rule?.defaultAssignee?.fullName || null,
      staff,
    };
  });

  return NextResponse.json(result);
}

export async function PUT(req: Request) {
  const auth = await requireAuth(["Admin"]);
  if (auth.error || !auth.user) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const { departmentId, assigneeId } = await req.json();

  if (!departmentId || !assigneeId) {
    return NextResponse.json({ message: "القسم وموظف الدعم مطلوبان" }, { status: 400 });
  }

  const dId = parseInt(departmentId, 10);
  const aId = parseInt(assigneeId, 10);

  const rule = await prisma.assignmentRule.upsert({
    where: { departmentId: dId },
    update: { defaultAssigneeId: aId },
    create: { departmentId: dId, defaultAssigneeId: aId },
  });

  await prisma.activityEntry.create({
    data: {
      userId: auth.user.id,
      userName: auth.user.fullName,
      action: `تحديث قاعدة الإسناد التلقائي للقسم #${dId}`,
    },
  });

  return NextResponse.json({ success: true, rule });
}
