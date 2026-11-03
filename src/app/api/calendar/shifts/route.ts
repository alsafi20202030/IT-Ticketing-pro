import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireAuth();
  if (auth.error || !auth.user) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const user = auth.user;
  const isItOrAdmin = user.role === "IT" || user.role === "Admin";
  const { searchParams } = new URL(req.url);

  const date = searchParams.get("date");
  const userIdFilter = searchParams.get("userId");

  const where: any = {};

  if (!isItOrAdmin) {
    where.userId = user.id;
  } else if (userIdFilter) {
    where.userId = parseInt(userIdFilter, 10);
  }

  if (date) {
    where.workDate = {
      gte: new Date(date),
      lt: new Date(new Date(date).getTime() + 24 * 60 * 60 * 1000),
    };
  }

  const tasks = await prisma.employeeTask.findMany({
    where,
    include: {
      user: { select: { id: true, fullName: true, role: true } },
    },
    orderBy: { workDate: "asc" },
  });

  const shifts = tasks.map((t: any) => ({
    id: t.id,
    staffId: t.userId,
    staffName: t.user?.fullName || "غير معروف",
    date: t.workDate ? new Date(t.workDate).toISOString().split("T")[0] : new Date(t.createdAt).toISOString().split("T")[0],
    startTime: "09:00",
    endTime: "17:00",
    status: t.status === "Completed" ? "busy" : "available",
    role: t.user?.role || "User",
  }));

  return NextResponse.json({ shifts });
}