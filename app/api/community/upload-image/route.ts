import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import {
  MAX_UPLOAD_BYTES,
  MIME_TO_EXT,
  validateImageUpload,
} from "@/lib/community/image-upload";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: { message } }, { status });
}

async function trySupabaseUpload(
  filePath: string,
  buffer: Buffer,
  contentType: string
) {
  try {
    const supabase = createAdminSupabaseClient();
    const bucket = "community-images";

    // Idempotent: succeeds the first time, errors harmlessly afterwards.
    await supabase.storage.createBucket(bucket, {
      public: true,
      fileSizeLimit: MAX_UPLOAD_BYTES,
      allowedMimeTypes: Object.keys(MIME_TO_EXT),
    });

    const { error } = await supabase.storage
      .from(bucket)
      .upload(filePath, buffer, { contentType, upsert: false });
    if (error) return null;

    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
    return data.publicUrl || null;
  } catch {
    return null;
  }
}

/** Local dev fallback when Supabase Storage is not configured. */
async function saveLocalUpload(fileName: string, buffer: Buffer, request: Request) {
  const uploadDir = path.join(process.cwd(), "public", "uploads", "community");
  await fs.mkdir(uploadDir, { recursive: true });
  await fs.writeFile(path.join(uploadDir, fileName), buffer);
  return new URL(`/uploads/community/${fileName}`, request.url).toString();
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return jsonError("Please sign in to upload an image.", 401);

    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) return jsonError("Choose an image file to upload.");

    const buffer = Buffer.from(await file.arrayBuffer());

    // Allow-list + size cap + magic-number sniffing, so a renamed script
    // cannot be stored as an image. Unit tested in lib/community.
    const check = validateImageUpload({
      type: file.type,
      size: file.size,
      bytes: buffer,
    });
    if (!check.ok) return jsonError(check.message, check.status);
    const ext = check.ext;

    // Namespaced per user, with a random name so uploads cannot overwrite
    // each other or be guessed.
    const fileName = `${crypto.randomUUID()}.${ext}`;
    const storagePath = `posts/${user.id}/${fileName}`;

    const uploadedUrl =
      (await trySupabaseUpload(storagePath, buffer, file.type)) ??
      (await saveLocalUpload(fileName, buffer, request));

    return NextResponse.json({ data: { url: uploadedUrl } });
  } catch (error) {
    console.error("Community image upload failed", error);
    return jsonError("Could not upload the image. Please retry.", 500);
  }
}
