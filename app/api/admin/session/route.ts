import { NextResponse } from "next/server";
import { z } from "zod";
import {
  ADMIN_SESSION_COOKIE,
  adminSessionCookieOptions,
  createAdminSessionToken,
  getAdminSession,
  verifyAdminCredentials,
} from "@/lib/admin/auth";

export const dynamic = "force-dynamic";

const signInSchema = z.object({
  email: z.string().trim().min(3).max(180),
  password: z.string().min(1).max(200),
});

export async function GET() {
  const session = await getAdminSession();
  return NextResponse.json({ data: { session } });
}

export async function POST(request: Request) {
  let payload: z.infer<typeof signInSchema>;
  try {
    payload = signInSchema.parse(await request.json());
  } catch {
    return NextResponse.json(
      { error: { code: "VALIDATION", message: "Enter both an email and a password." } },
      { status: 422 }
    );
  }

  if (!verifyAdminCredentials(payload.email, payload.password)) {
    return NextResponse.json(
      { error: { code: "INVALID_CREDENTIALS", message: "Incorrect admin email or password." } },
      { status: 401 }
    );
  }

  const { token, session } = createAdminSessionToken(payload.email);
  const response = NextResponse.json({ data: { session } });
  response.cookies.set(ADMIN_SESSION_COOKIE, token, adminSessionCookieOptions());
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ data: { signedOut: true } });
  response.cookies.set(ADMIN_SESSION_COOKIE, "", adminSessionCookieOptions(0));
  return response;
}
