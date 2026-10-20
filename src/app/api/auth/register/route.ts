import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const settings = await prisma.systemSetting.findMany();
    const settingsMap = Object.fromEntries(settings.map((s) => [s.key, s.value]));

    if (settingsMap["AllowSelfRegistration"] !== "true") {
      return NextResponse.json({ message: "التسجيل الذاتي مغلق حالياً" }, { status: 403 });
    }

    const { fullName, titlePrefix, email, departmentId, password, confirmPassword } = await req.json();

    if (!fullName || !email || !password || !departmentId) {
      return NextResponse.json({ message: "جميع الحقول الإلزامية مطلوبة" }, { status: 400 });
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ message: "كلمة المرور وتأكيدها غير متطابقين" }, { status: 400 });
    }

    const allowShortPin = settingsMap["AllowShortPin"] === "true";
    if (!allowShortPin && password.length < 6) {
      return NextResponse.json({ message: "يجب ألا تقل كلمة المرور عن 6 خانات" }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const allowedDomain = (settingsMap["AllowedEmailDomain"] || "").trim().toLowerCase().replace(/^@/, "");

    if (allowedDomain && !normalizedEmail.endsWith(`@${allowedDomain}`)) {
      return NextResponse.json({ message: `يجب أن يكون البريد الإلكتروني تابعاً للنطاق @${allowedDomain}` }, { status: 400 });
    }

    const existingUser = await prisma.helpdeskUser.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json({ message: "البريد الإلكتروني مسجل بالفعل" }, { status: 409 });
    }

    const requiresApproval = settingsMap["RegistrationRequiresApproval"] === "true";
    const passwordHash = await hashPassword(password);

    const newUser = await prisma.helpdeskUser.create({
      data: {
        fullName: fullName.trim(),
        titlePrefix: titlePrefix || "",
        email: normalizedEmail,
        departmentId: parseInt(departmentId, 10),
        role: "User",
        passwordHash,
        mustChangePassword: false,
        isActive: true,
        isApproved: !requiresApproval,
      },
    });

    await prisma.activityEntry.create({
      data: {
        userId: newUser.id,
        userName: newUser.fullName,
        action: `تسجيل حساب جديد${requiresApproval ? " (بانتظار الموافقة)" : ""}`,
      },
    });

    // Notify admins if approval is required
    if (requiresApproval) {
      const admins = await prisma.helpdeskUser.findMany({
        where: { role: "Admin", isActive: true },
        select: { id: true },
      });

      for (const admin of admins) {
        await prisma.userNotification.create({
          data: {
            userId: admin.id,
            text: `طلب تسجيل مستخدم جديد بانتظار الموافقة: ${newUser.fullName} (${newUser.email})`,
          },
        });
      }

      return NextResponse.json({
        pendingApproval: true,
        message: "تم استلام طلب التسجيل بنجاح، وسيكون الحساب نشطاً بعد اعتماد الإدارة.",
      });
    }

    return NextResponse.json({
      pendingApproval: false,
      message: "تم إنشاء الحساب بنجاح! يمكنك الآن تسجيل الدخول.",
    });
  } catch (error: any) {
    console.error("Registration error:", error);
    let msg = "حدث خطأ أثناء إنشاء الحساب";
    if (error?.code === "P1001" || error?.message?.includes("Can't reach database server")) {
      msg = "تعذر الاتصال بقاعدة البيانات في Supabase. يرجى استخدام رابط Pooler (المنفذ 6543) بدلاً من الاتصال المباشر.";
    } else if (error?.message?.includes("relation") && error?.message?.includes("does not exist")) {
      msg = "جداول النظام غير موجودة في قاعدة البيانات. يرجى تطبيق ملف supabase-schema.sql في SQL Editor في Supabase.";
    }
    return NextResponse.json({ message: msg, errorDetails: error?.message }, { status: 500 });
  }
}
