import { redirect } from "next/navigation";
import { getAdminSession, usingDefaultAdminCredentials, DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_PASSWORD } from "@/lib/admin/auth";
import { AdminSignInForm } from "./sign-in-form";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ next?: string }>;

export default async function AdminSignInPage({ searchParams }: { searchParams: SearchParams }) {
  const { next } = await searchParams;
  const session = await getAdminSession();
  const destination = next && next.startsWith("/admin") ? next : "/admin";

  if (session) redirect(destination);

  return (
    <AdminSignInForm
      next={destination}
      demo={
        usingDefaultAdminCredentials()
          ? { email: DEFAULT_ADMIN_EMAIL, password: DEFAULT_ADMIN_PASSWORD }
          : null
      }
    />
  );
}
