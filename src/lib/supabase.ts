import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export const supabaseAdmin = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
      global: { headers: { "X-Client-Info": "it-desk-server" } },
    })
  : null;

export const LOGO_BUCKET = "it-desk-assets";

export async function ensureLogoBucket(): Promise<void> {
  if (!supabaseAdmin) {
    console.warn("Supabase credentials not configured; logo bucket skipping.");
    return;
  }
  const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets();
  if (listError) {
    throw new Error(`Failed to list buckets: ${listError.message}`);
  }
  const exists = (buckets || []).some((b) => b.name === LOGO_BUCKET);
  if (exists) return;
  const { error: createError } = await supabaseAdmin.storage.createBucket(LOGO_BUCKET, { public: true });
  if (createError) {
    const { data: recheck } = await supabaseAdmin.storage.getBucket(LOGO_BUCKET);
    if (!recheck) throw new Error(`Failed to create bucket: ${createError.message}`);
  }
}

export function getLogoPublicUrl(filePath: string): string {
  if (!supabaseAdmin) return "/placeholder-logo.svg";
  const { data } = supabaseAdmin.storage.from(LOGO_BUCKET).getPublicUrl(filePath);
  return data.publicUrl;
}