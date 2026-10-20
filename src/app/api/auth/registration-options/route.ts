import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const settings = await prisma.systemSetting.findMany();
  const settingsMap = Object.fromEntries(settings.map((s) => [s.key, s.value]));

  const allowSelfRegistration = settingsMap["AllowSelfRegistration"] === "true";
  if (!allowSelfRegistration) {
    return NextResponse.json({ message: "التسجيل الذاتي مغلق حالياً" }, { status: 403 });
  }

  const departments = await prisma.department.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({
    registrationRequiresApproval: settingsMap["RegistrationRequiresApproval"] === "true",
    allowedEmailDomain: settingsMap["AllowedEmailDomain"] || "",
    allowShortPin: settingsMap["AllowShortPin"] === "true",
    departments,
  });
}
