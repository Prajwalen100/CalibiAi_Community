import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getStudentAccess } from "@/lib/auth/student-access";

const STUDENT_ONLY_PREFIXES = [
  "/academy",
  "/learning-hub",
  "/programs",
  "/community",
  "/placements",
  "/success-stories",
  "/blog",
  "/dashboard",
] as const;

function isStudentOnlyPath(pathname: string) {
  return STUDENT_ONLY_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

function redirectWithCookies(url: URL, response: NextResponse) {
  const redirected = NextResponse.redirect(url);
  for (const cookie of response.cookies.getAll()) redirected.cookies.set(cookie);
  return redirected;
}

export async function proxy(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const response = NextResponse.next({ request });

  if (!supabaseUrl || !supabaseAnonKey) return response;

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        response.cookies.set({ name, value, ...options });
      },
      remove(name: string, options: CookieOptions) {
        response.cookies.set({ name, value: "", ...options });
      },
    },
  });

  // getUser validates and refreshes the auth session when necessary. An auth
  // outage must not take down public marketing pages.
  let user = null;
  try {
    const result = await supabase.auth.getUser();
    user = result.data.user;
  } catch {
    if (!isStudentOnlyPath(request.nextUrl.pathname)) return response;
  }

  if (!isStudentOnlyPath(request.nextUrl.pathname)) return response;

  if (!user) {
    const signIn = new URL("/signin", request.url);
    signIn.searchParams.set("mode", "sign-in");
    return redirectWithCookies(signIn, response);
  }

  const access = await getStudentAccess(supabase, user.id);
  if (access.isEmployer) {
    return redirectWithCookies(new URL("/employer/dashboard", request.url), response);
  }
  if (!access.canAccessStudentArea) {
    return redirectWithCookies(new URL(access.nextPath, request.url), response);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
