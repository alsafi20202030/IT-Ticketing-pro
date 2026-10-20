import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAuth(["Admin"]);
  if (auth.error || !auth.user) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const logs = await prisma.activityEntry.findMany({
    take: 50,
    orderBy: { at: "desc" },
  });

  return NextResponse.json({ logs });
}
