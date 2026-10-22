import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(req: Request) {
  const auth = await requireAuth();
  if (auth.error || !auth.user) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const user = auth.user;
  const isItOrAdmin = user.role === "IT" || user.role === "Admin";
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const status = searchParams.get("status");

  const where: any = {};
  if (!isItOrAdmin) {
    where.userId = user.id;
  } else if (userId) {
    where.userId = parseInt(userId, 10);
  }
  if (status) where.status = status;

  const tasks = await prisma.employeeTask.findMany({
    where,
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: {
      user: {
        select: { id: true, fullName: true, role: true },
      },
    },
  });

  return NextResponse.json({ tasks });
}

export async function POST(req: Request) {
  const auth = await requireAuth();
  if (auth.error || !auth.user) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const user = auth.user;
  const isItOrAdmin = user.role === "IT" || user.role === "Admin";

  const body = await req.json();
  const { title, description, taskType, userId, workDate } = body;

  if (!title || !title.trim()) {
    return NextResponse.json({ message: "عنوان المهمة مطلوب" }, { status: 400 });
  }

  // Non-IT/Admin users can only create tasks for themselves
  const targetUserId = isItOrAdmin && userId ? parseInt(userId, 10) : user.id;
  if (isItOrAdmin && userId) {
    const target = await prisma.helpdeskUser.findUnique({
      where: { id: targetUserId },
      select: { id: true, fullName: true, isActive: true },
    });
    if (!target || !target.isActive) {
      return NextResponse.json({ message: "الموظف غير موجود أو غير نشط" }, { status: 400 });
    }
  }

  const task = await prisma.employeeTask.create({
    data: {
      userId: targetUserId,
      title: title.trim(),
      description: description ? description.trim() : null,
      taskType: taskType || "Other",
      status: "Pending",
      workDate: workDate ? new Date(workDate) : new Date(),
    },
    include: {
      user: {
        select: { id: true, fullName: true, role: true },
      },
    },
  });

  return NextResponse.json({ task }, { status: 201 });
}

export async function PATCH(req: Request) {
  const auth = await requireAuth();
  if (auth.error || !auth.user) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const user = auth.user;
  const isItOrAdmin = user.role === "IT" || user.role === "Admin";

  const body = await req.json();
  const { id, status, title, description, taskType, workDate } = body;

  if (!id) {
    return NextResponse.json({ message: "معرف المهمة مطلوب" }, { status: 400 });
  }

  const task = await prisma.employeeTask.findUnique({
    where: { id: parseInt(id, 10) },
    select: { id: true, userId: true, status: true },
  });

  if (!task) {
    return NextResponse.json({ message: "المهمة غير موجودة" }, { status: 404 });
  }

  if (!isItOrAdmin && task.userId !== user.id) {
    return NextResponse.json({ message: "غير مسموح بتعديل هذه المهمة" }, { status: 403 });
  }

  const data: any = {};
  if (status !== undefined) data.status = status;
  if (status === "Completed" && task.status !== "Completed") {
    data.completedAt = new Date();
  }
  if (title !== undefined && isItOrAdmin) data.title = title.trim();
  if (description !== undefined && isItOrAdmin) data.description = description.trim();
  if (taskType !== undefined && isItOrAdmin) data.taskType = taskType;
  if (workDate !== undefined && isItOrAdmin) data.workDate = new Date(workDate);

  const updated = await prisma.employeeTask.update({
    where: { id: task.id },
    data,
    include: {
      user: {
        select: { id: true, fullName: true, role: true },
      },
    },
  });

  return NextResponse.json({ task: updated });
}
