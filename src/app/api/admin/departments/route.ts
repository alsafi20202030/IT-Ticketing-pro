import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAuth(["Admin"]);
  if (auth.error || !auth.user) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const departments = await prisma.department.findMany({
    include: {
      _count: {
        select: {
          users: true,
        },
      },
      assignmentRules: {
        include: {
          defaultAssignee: {
            select: { id: true, fullName: true },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({
    departments: departments.map((d) => ({
      id: d.id,
      name: d.name,
      usersCount: d._count.users,
      defaultAssignee: d.assignmentRules[0]?.defaultAssignee || null,
    })),
  });
}

export async function POST(req: Request) {
  const auth = await requireAuth(["Admin"]);
  if (auth.error || !auth.user) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const { name } = await req.json();
  if (!name || !name.trim()) {
    return NextResponse.json({ message: "اسم القسم مطلوب" }, { status: 400 });
  }

  const existing = await prisma.department.findUnique({ where: { name: name.trim() } });
  if (existing) {
    return NextResponse.json({ message: "هذا القسم موجود مسبقاً" }, { status: 409 });
  }

  const department = await prisma.department.create({
    data: { name: name.trim() },
  });

  await prisma.activityEntry.create({
    data: {
      userId: auth.user.id,
      userName: auth.user.fullName,
      action: `إضافة قسم جديد: ${department.name}`,
    },
  });

  return NextResponse.json({ department });
}

export async function PUT(req: Request) {
  const auth = await requireAuth(["Admin"]);
  if (auth.error || !auth.user) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const { id, name } = await req.json();
  if (!id || !name || !name.trim()) {
    return NextResponse.json({ message: "معرف القسم واسم القسم مطلوبان" }, { status: 400 });
  }

  const department = await prisma.department.update({
    where: { id: parseInt(id, 10) },
    data: { name: name.trim() },
  });

  await prisma.activityEntry.create({
    data: {
      userId: auth.user.id,
      userName: auth.user.fullName,
      action: `تعديل اسم القسم: ${department.name}`,
    },
  });

  return NextResponse.json({ department });
}

export async function DELETE(req: Request) {
  const auth = await requireAuth(["Admin"]);
  if (auth.error || !auth.user) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(req.url);
  const idStr = searchParams.get("id");
  const id = parseInt(idStr || "", 10);

  if (!id) {
    return NextResponse.json({ message: "معرف القسم مطلوب" }, { status: 400 });
  }

  const usersCount = await prisma.helpdeskUser.count({ where: { departmentId: id } });
  if (usersCount > 0) {
    return NextResponse.json(
      { message: "لا يمكن حذف هذا القسم لأنه يحتوي على مستخدمين مسجلين" },
      { status: 409 }
    );
  }

  await prisma.assignmentRule.deleteMany({ where: { departmentId: id } });
  await prisma.department.delete({ where: { id } });

  await prisma.activityEntry.create({
    data: {
      userId: auth.user.id,
      userName: auth.user.fullName,
      action: `حذف قسم برقم: ${id}`,
    },
  });

  return NextResponse.json({ success: true });
}
