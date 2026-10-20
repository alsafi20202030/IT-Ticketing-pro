import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  const auth = await requireAuth();
  if (auth.error || !auth.user) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const notifications = await prisma.userNotification.findMany({
    where: { userId: auth.user.id },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  const unreadCount = await prisma.userNotification.count({
    where: { userId: auth.user.id, isRead: false },
  });

  return NextResponse.json({ notifications, unreadCount });
}

export async function PUT(req: Request) {
  const auth = await requireAuth();
  if (auth.error || !auth.user) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const body = await req.json().catch(() => ({}));
  const { id } = body;

  if (id) {
    await prisma.userNotification.updateMany({
      where: { id: parseInt(id, 10), userId: auth.user.id },
      data: { isRead: true },
    });
  } else {
    // Mark all as read
    await prisma.userNotification.updateMany({
      where: { userId: auth.user.id, isRead: false },
      data: { isRead: true },
    });
  }

  return NextResponse.json({ success: true });
}
