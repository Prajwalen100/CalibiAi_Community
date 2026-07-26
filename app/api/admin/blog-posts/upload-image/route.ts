import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin/auth";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_BYTES = 5 * 1024 * 1024;
const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

function unauthorized() {
  return NextResponse.json(
    { error: { code: "UNAUTHENTICATED", message: "Sign in at /admin/signin to upload blog images." } },
    { status: 401 }
  );
}

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: { code: "UPLOAD", message } }, { status });
}

function publicUrlFromRequest(request: Request, pathname: string) {
  return new URL(pathname, request.url).toString();
}

async function trySupabaseUpload(filePath: string, buffer: Buffer, contentType: string) {
  try {
    const supabase = createAdminSupabaseClient();
    const bucket = "blog-images";

    await supabase.storage.createBucket(bucket, {
      public: true,
      fileSizeLimit: MAX_BYTES,
      allowedMimeTypes: Object.keys(MIME_TO_EXT),
    });

    const { error } = await supabase.storage.from(bucket).upload(filePath, buffer, {
      contentType,
      upsert: false,
    });

    if (error) return null;

    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
    return data.publicUrl || null;
  } catch {
    return null;
  }
}

async function saveLocalUpload(fileName: string, buffer: Buffer, request: Request) {
  const uploadDir = path.join(process.cwd(), "public", "uploads", "blog");
  await fs.mkdir(uploadDir, { recursive: true });
  await fs.writeFile(path.join(uploadDir, fileName), buffer);
  return publicUrlFromRequest(request, `/uploads/blog/${fileName}`);
}

export async function POST(request: Request) {
  if (!(await getAdminSession())) return unauthorized();

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) return jsonError("Choose an image file to upload.");

  const ext = MIME_TO_EXT[file.type];
  if (!ext) return jsonError("Upload a JPG, PNG, WEBP or GIF image.", 422);
  if (file.size <= 0) return jsonError("The uploaded image is empty.", 422);
  if (file.size > MAX_BYTES) return jsonError("Image must be 5 MB or smaller.", 413);

  const buffer = Buffer.from(await file.arrayBuffer());
  const fileName = `${crypto.randomUUID()}.${ext}`;
  const storagePath = `covers/${fileName}`;

  const supabaseUrl = await trySupabaseUpload(storagePath, buffer, file.type);
  const url = supabaseUrl ?? (await saveLocalUpload(fileName, buffer, request));

  return NextResponse.json({ data: { url } });
}
