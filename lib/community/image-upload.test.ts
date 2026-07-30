import { describe, expect, it } from "vitest";
import {
  MAX_UPLOAD_BYTES,
  matchesSignature,
  validateImageUpload,
} from "./image-upload";

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const JPG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
const GIF = Buffer.from("GIF89a", "ascii");
const WEBP = Buffer.concat([
  Buffer.from("RIFF", "ascii"),
  Buffer.from([0x00, 0x00, 0x00, 0x00]),
  Buffer.from("WEBP", "ascii"),
]);
const HTML = Buffer.from("<html><script>alert(1)</script>", "ascii");

describe("matchesSignature", () => {
  it("accepts real image bytes", () => {
    expect(matchesSignature("png", PNG)).toBe(true);
    expect(matchesSignature("jpg", JPG)).toBe(true);
    expect(matchesSignature("gif", GIF)).toBe(true);
    expect(matchesSignature("webp", WEBP)).toBe(true);
  });

  it("rejects bytes that do not match the claimed type", () => {
    expect(matchesSignature("png", JPG)).toBe(false);
    expect(matchesSignature("jpg", PNG)).toBe(false);
    expect(matchesSignature("webp", Buffer.from("RIFFxxxxAVI ", "ascii"))).toBe(false);
  });

  it("rejects unknown extensions and truncated buffers", () => {
    expect(matchesSignature("svg", PNG)).toBe(false);
    expect(matchesSignature("png", Buffer.from([0x89]))).toBe(false);
  });
});

describe("validateImageUpload", () => {
  it("accepts a well-formed png", () => {
    const result = validateImageUpload({
      type: "image/png",
      size: PNG.length,
      bytes: PNG,
    });
    expect(result).toEqual({ ok: true, ext: "png" });
  });

  it("rejects a disallowed MIME type", () => {
    const result = validateImageUpload({
      type: "image/svg+xml",
      size: 100,
      bytes: PNG,
    });
    expect(result).toMatchObject({ ok: false, status: 422 });
  });

  it("rejects an empty file", () => {
    const result = validateImageUpload({ type: "image/png", size: 0, bytes: PNG });
    expect(result).toMatchObject({ ok: false, status: 422 });
  });

  it("rejects a file over the size cap", () => {
    const result = validateImageUpload({
      type: "image/png",
      size: MAX_UPLOAD_BYTES + 1,
      bytes: PNG,
    });
    expect(result).toMatchObject({ ok: false, status: 413 });
  });

  it("rejects a script disguised with an image MIME type", () => {
    // The core reason for sniffing: the client controls `type`.
    const result = validateImageUpload({
      type: "image/png",
      size: HTML.length,
      bytes: HTML,
    });
    expect(result).toMatchObject({
      ok: false,
      status: 422,
      message: "That file does not look like a valid image.",
    });
  });

  it("caps uploads at 5 MB", () => {
    expect(MAX_UPLOAD_BYTES).toBe(5 * 1024 * 1024);
  });
});
