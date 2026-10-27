import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

const DEFAULTS = {
  id: 1,
  loginTitle: "IT Desk",
  loginSubtitle: "بوابة طلبات الدعم الفني",
  loginPrimaryColor: "#7A1F3D",
  loginBackgroundColor: "#f8fafc",
  loginCardColor: "#ffffff",
  loginTextColor: "#1e293b",
  loginFooterText: "بوابة الدعم الداخلي",
  loginCompanyName: "الشركة",
};

export async function GET() {
  const auth = await requireAuth(["Admin"]);
  if (auth.error || !auth.user) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  let settings = await prisma.systemSettings.findUnique({ where: { id: 1 } });
  if (!settings) {
    settings = await prisma.systemSettings.create({ data: DEFAULTS });
  }
  return NextResponse.json(settings);
}

export async function PUT(req: Request) {
  const auth = await requireAuth(["Admin"]);
  if (auth.error || !auth.user) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const body = await req.json();
  const data: any = {};
  const fields = [
    "loginTitle",
    "loginSubtitle",
    "loginPrimaryColor",
    "loginBackgroundColor",
    "loginCardColor",
    "loginTextColor",
    "loginFooterText",
    "loginCompanyName",
  ];
  for (const f of fields) {
    if (body[f] !== undefined) data[f] = String(body[f]);
  }

  const settings = await prisma.systemSettings.upsert({
    where: { id: 1 },
    update: data,
    create: { ...DEFAULTS, ...data },
  });

  await prisma.activityEntry.create({
    data: {
      userId: auth.user.id,
      userName: auth.user.fullName,
      action: "تحديث تصميم صفحة تسجيل الدخول",
    },
  });

  return NextResponse.json({ success: true, settings });
}