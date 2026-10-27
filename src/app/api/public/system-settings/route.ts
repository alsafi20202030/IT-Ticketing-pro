import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    let settings = await prisma.systemSettings.findUnique({ where: { id: 1 } });
    if (!settings) {
      settings = await prisma.systemSettings.create({
        data: {
          id: 1,
          loginTitle: "IT Desk",
          loginSubtitle: "بوابة طلبات الدعم الفني",
          loginPrimaryColor: "#7A1F3D",
          loginBackgroundColor: "#f8fafc",
          loginCardColor: "#ffffff",
          loginTextColor: "#1e293b",
          loginFooterText: "بوابة الدعم الداخلي",
          loginCompanyName: "الشركة",
        },
      });
    }
    return NextResponse.json(settings);
  } catch (error) {
    return NextResponse.json({
      id: 1,
      loginTitle: "IT Desk",
      loginSubtitle: "بوابة طلبات الدعم الفني",
      loginPrimaryColor: "#7A1F3D",
      loginBackgroundColor: "#f8fafc",
      loginCardColor: "#ffffff",
      loginTextColor: "#1e293b",
      loginFooterText: "بوابة الدعم الداخلي",
      loginCompanyName: "الشركة",
    });
  }
}