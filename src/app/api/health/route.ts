import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const dbUrl = process.env.DATABASE_URL || "";
  const jwtSecretSet = Boolean(process.env.JWT_SECRET);

  let maskedUrl = "NOT_SET";
  let host = "";
  let port = "";
  let isPooler = false;
  let isDirect = false;

  if (dbUrl) {
    try {
      // Mask password: postgres://user:password@host:port/db
      maskedUrl = dbUrl.replace(/:\/\/([^:]+):([^@]+)@/, "://$1:****@");
      const urlObj = new URL(dbUrl.startsWith("postgres") ? dbUrl.replace(/^postgres:/, "http:") : dbUrl);
      host = urlObj.hostname;
      port = urlObj.port;
      isPooler = host.includes("pooler.supabase.com") || dbUrl.includes("pgbouncer=true") || port === "6543";
      isDirect = host.startsWith("db.") && host.includes("supabase.co");
    } catch {
      maskedUrl = "INVALID_URL_FORMAT";
    }
  }

  try {
    // 1. Test basic connectivity
    await prisma.$queryRaw`SELECT 1 as connected`;

    // 2. Check if tables exist and count records
    const [usersCount, deptsCount, settingsCount] = await Promise.all([
      prisma.helpdeskUser.count().catch(() => -1),
      prisma.department.count().catch(() => -1),
      prisma.systemSetting.count().catch(() => -1),
    ]);

    const tablesExist = usersCount >= 0 && deptsCount >= 0 && settingsCount >= 0;

    return NextResponse.json({
      status: "connected",
      database: {
        connected: true,
        maskedUrl,
        host,
        port,
        isPooler,
        isDirect,
        warning: isDirect
          ? "تنبيه: أنت تستخدم الاتصال المباشر (Direct IPv6). في Vercel Serverless يُفضل استخدام رابط Pooler (المتوافق مع IPv4) عبر المنفذ 6543 لمنع انقطاع الاتصال."
          : null,
      },
      tables: {
        tablesExist,
        usersCount,
        departmentsCount: deptsCount,
        settingsCount,
        needsSeed: usersCount === 0,
      },
      jwtConfigured: jwtSecretSet,
      message: tablesExist
        ? usersCount > 0
          ? "الاتصال بقاعدة بيانات Supabase يعمل بنجاح وكافة الجداول والبيانات موجودة!"
          : "الاتصال يعمل ولكن الجداول فارغة. يرجى تشغيل سكربت supabase-schema.sql في Supabase SQL Editor."
        : "الاتصال يعمل ولكن الجداول غير منشأة بعد في قاعدة البيانات. يرجى تشغيل سكربت supabase-schema.sql في Supabase SQL Editor.",
    });
  } catch (error: any) {
    console.error("Health check database error:", error);

    let solutionHint = "تحقق من صحة رابط DATABASE_URL وكلمة مرور قاعدة البيانات في Vercel.";
    if (error.code === "P1001" || error.message?.includes("Can't reach database server")) {
      solutionHint =
        "تعذر الوصول لخادم قاعدة البيانات. في Supabase على Vercel، يجب استخدام رابط Transaction Pooler (المنفذ 6543) بدلاً من الاتصال المباشر لأن خوادم Vercel لا تدعم IPv6 المباشر للنسخة المجانية في Supabase.";
    } else if (error.message?.includes("password authentication failed")) {
      solutionHint = "كلمة المرور الخاصة بقاعدة البيانات غير صحيحة داخل DATABASE_URL.";
    } else if (error.message?.includes("relation") && error.message?.includes("does not exist")) {
      solutionHint = "قاعدة البيانات متصلة ولكن الجداول لم تُنشأ بعد. قم بتشغيل سكربت supabase-schema.sql في SQL Editor في Supabase.";
    }

    return NextResponse.json(
      {
        status: "error",
        error: {
          code: error.code || "UNKNOWN",
          name: error.name,
          message: error.message,
        },
        database: {
          connected: false,
          maskedUrl,
          host,
          port,
          isPooler,
          isDirect,
        },
        jwtConfigured: jwtSecretSet,
        solutionHint,
      },
      { status: 500 }
    );
  }
}
