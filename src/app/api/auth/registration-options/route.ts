import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
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
  } catch (error) {
    console.error("Error in registration options:", error);
    return NextResponse.json({
      registrationRequiresApproval: false,
      allowedEmailDomain: "",
      allowShortPin: false,
      departments: [],
    });
  }
}
