/**
 * Validation helpers for community image uploads.
 *
 * Extracted from the route handler so the security-relevant rules (allow-list,
 * size cap, and magic-number sniffing) can be unit tested without booting a
 * request.
 */

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

/**
 * Allow-list keyed by MIME type. The stored extension comes from this map, not
 * from the client-supplied filename, so `evil.html` cannot be written with an
 * executable extension.
 */
export const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

/** Magic-number prefixes so a declared MIME type must match the real bytes. */
export function matchesSignature(ext: string, bytes: Buffer | Uint8Array): boolean {
  const b = Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes);
  switch (ext) {
    case "jpg":
      return b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
    case "png":
      return (
        b.length >= 4 &&
        b[0] === 0x89 &&
        b[1] === 0x50 &&
        b[2] === 0x4e &&
        b[3] === 0x47
      );
    case "gif":
      return b.length >= 3 && b.subarray(0, 3).toString("ascii") === "GIF";
    case "webp":
      return (
        b.length >= 12 &&
        b.subarray(0, 4).toString("ascii") === "RIFF" &&
        b.subarray(8, 12).toString("ascii") === "WEBP"
      );
    default:
      return false;
  }
}

export type UploadValidation =
  | { ok: true; ext: string }
  | { ok: false; message: string; status: number };

/** Applies every upload rule in the order the route checks them. */
export function validateImageUpload(input: {
  type: string;
  size: number;
  bytes: Buffer | Uint8Array;
}): UploadValidation {
  const ext = MIME_TO_EXT[input.type];
  if (!ext) {
    return { ok: false, message: "Upload a JPG, PNG, WEBP or GIF image.", status: 422 };
  }
  if (input.size <= 0) {
    return { ok: false, message: "The uploaded image is empty.", status: 422 };
  }
  if (input.size > MAX_UPLOAD_BYTES) {
    return { ok: false, message: "Image must be 5 MB or smaller.", status: 413 };
  }
  if (!matchesSignature(ext, input.bytes)) {
    return { ok: false, message: "That file does not look like a valid image.", status: 422 };
  }
  return { ok: true, ext };
}
