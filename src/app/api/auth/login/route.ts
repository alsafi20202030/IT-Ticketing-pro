import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, signToken, AUTH_COOKIE } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ message: "البريد الإلكتروني وكلمة المرور مطلوبان" }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await prisma.helpdeskUser.findFirst({
      where: {
        OR: [
          { email: normalizedEmail },
          { userName: normalizedEmail },
        ],
      },
      include: { department: true },
    });

    if (!user) {
      return NextResponse.json({ message: "البريد الإلكتروني أو كلمة المرور غير صحيحة" }, { status: 401 });
    }

    if (user.lockedUntilUtc && new Date(user.lockedUntilUtc) > new Date()) {
      const diffMinutes = Math.ceil((new Date(user.lockedUntilUtc).getTime() - Date.now()) / (1000 * 60));
      return NextResponse.json(
        { message: `الحساب مقفل مؤقتًا لكثرة المحاولات الخاطئة. يرجى المحاولة بعد ${diffMinutes} دقيقة.` },
        { status: 401 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json({ message: "تم تعطيل هذا الحساب. يرجى التواصل مع مسؤول النظام." }, { status: 401 });
    }

    if (!user.isApproved) {
      return NextResponse.json({ message: "الحساب قيد المراجعة والموافقة من قبل الإدارة." }, { status: 401 });
    }

    const isValid = await verifyPassword(password, user.passwordHash);

    if (!isValid) {
      const failedAttempts = user.failedLoginAttempts + 1;
      let lockedUntilUtc = null;

      if (failedAttempts >= 5) {
        lockedUntilUtc = new Date(Date.now() + 15 * 60 * 1000); // Lock for 15 minutes
      }

      await prisma.helpdeskUser.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: lockedUntilUtc ? 0 : failedAttempts,
          lockedUntilUtc,
        },
      });

      return NextResponse.json({ message: "البريد الإلكتروني أو كلمة المرور غير صحيحة" }, { status: 401 });
    }

    // Success login
    const updatedUser = await prisma.helpdeskUser.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockedUntilUtc: null,
        lastLoginAt: new Date(),
      },
    });

    // Activity log
    await prisma.activityEntry.create({
      data: {
        userId: user.id,
        userName: user.fullName,
        action: "تسجيل الدخول",
      },
    });

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.fullName,
    });

    const res = NextResponse.json({
      user: {
        id: user.id,
        fullName: user.fullName,
        titlePrefix: user.titlePrefix,
        email: user.email,
        role: user.role,
        department: user.department?.name || null,
        mustChangePassword: user.mustChangePassword,
        canViewAllTickets: user.canViewAllTickets,
        canEditAnyTicket: user.canEditAnyTicket,
        canReassignTickets: user.canReassignTickets,
      },
    });

    res.cookies.set(AUTH_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 14 * 24 * 60 * 60, // 14 days
    });

    return res;
  } catch (error: any) {
    console.error("Login error:", error);
    let msg = "حدث خطأ غير متوقع في الخادم";
    if (error?.code === "P1001" || error?.message?.includes("Can't reach database server")) {
      msg = "تعذر الاتصال بقاعدة البيانات في Supabase. يرجى استخدام رابط Pooler (المنفذ 6543) بدلاً من الاتصال المباشر.";
    } else if (error?.message?.includes("relation") && error?.message?.includes("does not exist")) {
      msg = "جداول النظام غير موجودة في قاعدة البيانات. يرجى تطبيق ملف supabase-schema.sql في SQL Editor في Supabase.";
    } else if (error?.code?.startsWith("P")) {
      msg = `خطأ في قاعدة البيانات (${error.code}): يرجى مراجعة صفحة التشخيص /api/health`;
    }
    return NextResponse.json({ message: msg, errorDetails: error?.message }, { status: 500 });
  }
}
