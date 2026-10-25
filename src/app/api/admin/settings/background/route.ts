import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { supabaseAdmin, ensureLogoBucket, LOGO_BUCKET } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 ميغابايت
const ALLOWED_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
];
const ALLOWED_EXTENSIONS = ["png", "jpeg", "jpg", "webp"];

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
    const file = formData.get("background") as File | null;
    if (!file) {
      return NextResponse.json({ message: "لم يتم اختيار ملف" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { message: "حجم الملف أكبر من الحد المسموح (5 ميغابايت)" },
        { status: 400 }
      );
    }

    const ext = getExtension(file.name);
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json(
        { message: "امتداد الملف غير مسموح (png, jpg, webp فقط)" },
        { status: 400 }
      );
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { message: "نوع الملف غير مدعوم (png, jpg, webp فقط)" },
        { status: 400 }
      );
    }

    await ensureLogoBucket();

    const buffer = Buffer.from(await file.arrayBuffer());
    const safeName = `backgrounds/bg-${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from(LOGO_BUCKET)
      .upload(safeName, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json(
        { message: `فشل رفع صورة الخلفية للتخزين: ${uploadError.message}` },
        { status: 500 }
      );
    }

    const { data: publicUrl } = supabaseAdmin.storage
      .from(LOGO_BUCKET)
      .getPublicUrl(safeName);

    // حفظ المسار في الإعدادات
    await prisma.systemSetting.upsert({
      where: { key: "BackgroundPath" },
      update: { value: publicUrl.publicUrl },
      create: { key: "BackgroundPath", value: publicUrl.publicUrl },
    });

    await prisma.activityEntry.create({
      data: {
        userId: auth.user.id,
        userName: auth.user.fullName,
        action: "رفع صورة خلفية للنظام",
      },
    });

    return NextResponse.json({ success: true, backgroundPath: publicUrl.publicUrl });
  } catch (e: any) {
    return NextResponse.json(
      { message: e.message || "فشل رفع صورة الخلفية" },
      { status: 500 }
    );
  }
}