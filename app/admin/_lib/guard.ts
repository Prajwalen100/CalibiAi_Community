import { redirect } from "next/navigation";
import { getAdminSession, type AdminSession } from "@/lib/admin/auth";

/**
 * Every admin page calls this first. Unauthenticated visitors are sent to the
 * standalone admin sign-in and returned to the page they asked for.
 */
export async function requireAdmin(next: string): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) redirect(`/admin/signin?next=${encodeURIComponent(next)}`);
  return session;
}
