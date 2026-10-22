import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { supabaseAdmin, ensureLogoBucket, getLogoPublicUrl, LOGO_BUCKET } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 ميغابايت
const ALLOWED_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/svg+xml",
  "image/webp",
];
const ALLOWED_EXTENSIONS = ["png", "jpeg", "jpg", "svg", "webp"];
const BLOCKED_EXTENSIONS = [
  "exe",
  "bat",
  "sh",
  "js",
  "ts",
  "jsx",
  "tsx",
  "php",
  "py",
  "pl",
  "rb",
  "msi",
  "cmd",
  "com",
  "vbs",
  "ps1",
];

function getExtension(filename: string): string {
  const parts = filename.split(".");
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "";
}

export async function POST(req: Request) {
  const auth = await requireAuth(["Admin"]);
  if (auth.error || !auth.user) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("logo") as File | null;
    if (!file) {
      return NextResponse.json({ message: "لم يتم اختيار ملف" }, { status: 400 });
    }

    // التحقق من الحجم
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { message: "حجم الملف أكبر من الحد المسموح (2 ميغابايت)" },
        { status: 400 },
      );
    }

    // التحقق من النوع والمExtension معًا لمنع الملفات التنفيذية/غير الموثوقة
    const ext = getExtension(file.name);
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json(
        { message: "امتداد الملف غير مسموح (png, jpg, svg, webp فقط)" },
        { status: 400 },
      );
    }
    if (BLOCKED_EXTENSIONS.includes(ext)) {
      return NextResponse.json(
        { message: "نوع الملف محظور لأسباب أمنية" },
        { status: 400 },
      );
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { message: "نوع الملف غير مدعوم (png, jpg, svg, webp فقط)" },
        { status: 400 },
      );
    }

    // التأكد من وجود حاوية التخزين (آمنة: تُنشأ فقط إذا لم تكن موجودة)
    await ensureLogoBucket();

    const buffer = Buffer.from(await file.arrayBuffer());
    const safeName = `logos/logo-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 10)}.${ext}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from(LOGO_BUCKET)
      .upload(safeName, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json(
        { message: `فشل رفع الملف للتخزين: ${uploadError.message}` },
        { status: 500 },
      );
    }

    const logoPath = getLogoPublicUrl(safeName);

    // حفظ الرابط في الإعدادات باستخدام المفتاح الحالي LogoPath (لا يُحذف الشعار القديم قبل نجاح الرفع)
    await prisma.systemSetting.upsert({
      where: { key: "LogoPath" },
      update: { value: logoPath },
      create: { key: "LogoPath", value: logoPath },
    });

    await prisma.activityEntry.create({
      data: {
        userId: auth.user.id,
        userName: auth.user.fullName,
        action: "رفع شعار النظام",
      },
    });

    return NextResponse.json({ success: true, logoPath });
  } catch (e: any) {
    // لا تُسجل مفاتيح الخدمة أو أسرار النظام
    return NextResponse.json(
      { message: e.message || "فشل رفع الشعار" },
      { status: 500 },
    );
  }
}
