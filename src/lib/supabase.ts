import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    "SUPABASE_URL و SUPABASE_SERVICE_ROLE_KEY يجب تهيئتهما كمتغيرات بيئة في السيرفر",
  );
}

/**
 * عميل Supabase Administrator (Server-side فقط).
 * يُستخدم لعمليات التخزين (Storage) التي تحتاج صلاحيات خدمة (creating bucket، upload، ...).
 * لا يُnever يُستورد من جهة العميل، ولا تُعرض مفتاح الخدمة في المتصفح أو السجلات.
 */
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
  global: { headers: { "X-Client-Info": "it-desk-server" } },
});

export const LOGO_BUCKET = "it-desk-assets";

/**
 * يضمن وجود bucket الخاص بالشعارات. آمن: يُنشئ فقط إذا لم يكن موجوداً،
 * ولا يُعدّل أو يُحذف أي bucket أو بيانات قائمة.
 */
export async function ensureLogoBucket(): Promise<void> {
  const { data: buckets, error: listError } =
    await supabaseAdmin.storage.listBuckets();

  if (listError) {
    throw new Error(`فشل جلب قائمة الحاويات: ${listError.message}`);
  }

  const exists = (buckets || []).some((b) => b.name === LOGO_BUCKET);
  if (exists) return;

  const { error: createError } = await supabaseAdmin.storage.createBucket(
    LOGO_BUCKET,
    { public: true },
  );

  if (createError) {
    // إذا كان هناك competing creation من طلب متوازي، نتجاهل الخطأ إذا أصبح موجوداً
    const { data: recheck } = await supabaseAdmin.storage.getBucket(LOGO_BUCKET);
    if (!recheck) {
      throw new Error(`فشل إنشاء حاوية الشعارات: ${createError.message}`);
    }
  }
}

export function getLogoPublicUrl(filePath: string): string {
  const { data } = supabaseAdmin.storage.from(LOGO_BUCKET).getPublicUrl(filePath);
  return data.publicUrl;
}
