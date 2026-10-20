import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const settings = await prisma.systemSetting.findMany();
    const settingsMap = Object.fromEntries(settings.map((s) => [s.key, s.value]));
    return NextResponse.json(settingsMap);
  } catch (error) {
    console.error("Error fetching public settings:", error);
    // Return sensible defaults if database is not reachable at build/cold start
    return NextResponse.json({
      SystemName: "IT Desk",
      Subtitle: "بوابة طلبات الدعم الفني",
      PrimaryColor: "#7A1F3D",
      CompanyName: "الشركة",
      FooterText: "بوابة الدعم الداخلي",
      LogoPath: "/logo-placeholder.svg",
      AllowSelfRegistration: "true",
      RegistrationRequiresApproval: "false",
      AllowedEmailDomain: "",
      ShowPublicHomePage: "false",
      PublicDescription: "بوابة طلبات الدعم الفني وتقنية المعلومات الموحدة",
      SlaUrgentHours: "4",
      SlaHighHours: "24",
      SlaMediumHours: "72",
      SlaLowHours: "72",
      AllowShortPin: "false",
      AssignmentRulesEnabled: "true",
      AllowRequesterAssigneeChoice: "true",
      LoginBackgroundPath: "",
      NavPosition: "right",
    });
  }
}
