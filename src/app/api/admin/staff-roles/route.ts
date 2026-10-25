import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

// إدارة مسميات وتصنيفات موظفي الـ IT (إضافة، تعديل، حذف)
export async function GET() {
  const auth = await requireAuth(["Admin"]);
  if (auth.error || !auth.user) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const roles = await prisma.staffRole.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { users: true } },
    },
  });

  return NextResponse.json({ roles });
}

export async function POST(req: Request) {
  const auth = await requireAuth(["Admin"]);
  if (auth.error || !auth.user) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const body = await req.json();
  const { name, description, color, isActive } = body;

  if (!name || !name.trim()) {
    return NextResponse.json({ message: "اسم المسمى الوظيفي مطلوب" }, { status: 400 });
  }

  try {
    const role = await prisma.staffRole.create({
      data: {
        name: name.trim(),
        description: description ? description.trim() : null,
        color: color || "#6366f1",
        isActive: isActive !== false,
      },
    });

    await prisma.activityEntry.create({
      data: {
        userId: auth.user.id,
        userName: auth.user.fullName,
        action: `إضافة مسمى وظيفي لموظفي IT: ${role.name}`,
      },
    });

    return NextResponse.json({ role }, { status: 201 });
  } catch (e: any) {
    if (e.code === "P2002") {
      return NextResponse.json({ message: "هذا المسمى الوظيفي موجود مسبقاً" }, { status: 409 });
    }
    return NextResponse.json({ message: e.message || "فشل إضافة المسمى الوظيفي" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const auth = await requireAuth(["Admin"]);
  if (auth.error || !auth.user) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const body = await req.json();
  const { id, name, description, color, isActive } = body;

  if (!id) {
    return NextResponse.json({ message: "معرف المسمى الوظيفي مطلوب" }, { status: 400 });
  }

  try {
    const role = await prisma.staffRole.update({
      where: { id: parseInt(id, 10) },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description: description.trim() }),
        ...(color !== undefined && { color }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    await prisma.activityEntry.create({
      data: {
        userId: auth.user.id,
        userName: auth.user.fullName,
        action: `تعديل مسمى وظيفي لموظفي IT: ${role.name}`,
      },
    });

    return NextResponse.json({ role });
  } catch (e: any) {
    if (e.code === "P2025") {
      return NextResponse.json({ message: "المسمى الوظيفي غير موجود" }, { status: 404 });
    }
    if (e.code === "P2002") {
      return NextResponse.json({ message: "هذا الاسم مستخدم من قبل مسمى آخر" }, { status: 409 });
    }
    return NextResponse.json({ message: e.message || "فشل تحديث المسمى الوظيفي" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const auth = await requireAuth(["Admin"]);
  if (auth.error || !auth.user) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ message: "معرف المسمى الوظيفي مطلوب" }, { status: 400 });
  }

  // التأكد من عدم وجود موظفين مرتبطين بهذا المسمى قبل الحذف
  const usersCount = await prisma.helpdeskUser.count({
    where: { staffRoleId: parseInt(id, 10) },
  });
  if (usersCount > 0) {
    return NextResponse.json(
      { message: "لا يمكن الحذف؛ هناك موظفون مرتبطون بهذا المسمى الوظيفي. يرجى نقلهم لمسمى آخر أولاً" },
      { status: 409 }
    );
  }

  try {
    const role = await prisma.staffRole.delete({
      where: { id: parseInt(id, 10) },
      select: { id: true, name: true },
    });

    await prisma.activityEntry.create({
      data: {
        userId: auth.user.id,
        userName: auth.user.fullName,
        action: `حذف مسمى وظيفي لموظفي IT: ${role.name}`,
      },
    });

    return NextResponse.json({ success: true, role });
  } catch (e: any) {
    if (e.code === "P2025") {
      return NextResponse.json({ message: "المسمى الوظيفي غير موجود" }, { status: 404 });
    }
    return NextResponse.json({ message: e.message || "فشل حذف المسمى الوظيفي" }, { status: 500 });
  }
}