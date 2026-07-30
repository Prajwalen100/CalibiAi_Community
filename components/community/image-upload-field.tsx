"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus, Link2, Loader2, Upload, X } from "lucide-react";

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPTED = "image/jpeg,image/png,image/webp,image/gif";

type Mode = "upload" | "url";

/**
 * Image field for the create-post form.
 *
 * Previously the form only accepted a pasted URL, which meant a member with an
 * image on their device had to host it somewhere first. This adds a real file
 * upload (with preview) while keeping the paste-a-URL path for people who
 * already have a link. Either way the resolved URL is submitted through the
 * same hidden `image_url` input, so the server action is unchanged.
 */
export function ImageUploadField({ name = "image_url" }: { name?: string }) {
  const [mode, setMode] = useState<Mode>("upload");
  const [url, setUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewFailed, setPreviewFailed] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function uploadFile(file: File) {
    setError(null);
    setPreviewFailed(false);

    // Validate client-side for instant feedback; the API re-checks everything.
    if (!ACCEPTED.split(",").includes(file.type)) {
      setError("Upload a JPG, PNG, WEBP or GIF image.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Image must be 5 MB or smaller.");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/community/upload-image", {
        method: "POST",
        body: formData,
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error?.message ?? "Could not upload the image.");
      }
      const uploadedUrl = payload?.data?.url;
      if (typeof uploadedUrl !== "string" || !uploadedUrl) {
        throw new Error("Upload finished but no image URL was returned.");
      }
      setUrl(uploadedUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not upload the image.");
    } finally {
      setUploading(false);
      // Allow re-selecting the same file after an error.
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function clear() {
    setUrl("");
    setError(null);
    setPreviewFailed(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="label">Image (optional)</label>
        <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-0.5 dark:bg-slate-800">
          <button
            type="button"
            onClick={() => setMode("upload")}
            className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-bold transition ${
              mode === "upload"
                ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white"
                : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
            }`}
          >
            <Upload className="h-3.5 w-3.5" /> Upload
          </button>
          <button
            type="button"
            onClick={() => setMode("url")}
            className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-bold transition ${
              mode === "url"
                ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white"
                : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
            }`}
          >
            <Link2 className="h-3.5 w-3.5" /> Paste URL
          </button>
        </div>
      </div>

      {/* The value actually submitted, whichever mode produced it. */}
      <input type="hidden" name={name} value={url} />

      {mode === "upload" ? (
        <div className="mt-1">
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED}
            className="sr-only"
            aria-label="Upload an image"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void uploadFile(file);
            }}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/50 px-4 py-6 text-sm font-semibold text-slate-600 transition hover:border-brand-400 hover:bg-brand-50/40 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-300 dark:hover:border-brand-400/50 dark:hover:bg-brand-950/20"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Uploading…
              </>
            ) : (
              <>
                <ImagePlus className="h-4 w-4" />
                {url ? "Choose a different image" : "Choose an image to upload"}
              </>
            )}
          </button>
          <p className="mt-1.5 text-xs text-slate-500">JPG, PNG, WEBP or GIF · up to 5 MB</p>
        </div>
      ) : (
        <input
          className="input mt-1"
          type="url"
          value={url}
          onChange={(event) => {
            setUrl(event.target.value);
            setPreviewFailed(false);
            setError(null);
          }}
          placeholder="https://..."
          aria-label="Image URL"
        />
      )}

      {error && (
        <p className="mt-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300">
          {error}
        </p>
      )}

      {url && !previewFailed && (
        <div className="relative mt-3 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
          {/* Unoptimized: uploads can come from Supabase Storage or a pasted
              third-party host, neither of which is in next.config images. */}
          <Image
            src={url}
            alt="Selected image preview"
            width={640}
            height={360}
            unoptimized
            className="max-h-56 w-full bg-slate-50 object-contain dark:bg-slate-900"
            onError={() => setPreviewFailed(true)}
          />
          <button
            type="button"
            onClick={clear}
            aria-label="Remove image"
            className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-slate-900/70 text-white transition hover:bg-slate-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {url && previewFailed && (
        <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
          Could not load a preview for that URL. It will still be saved with your post.
        </p>
      )}
    </div>
  );
}
