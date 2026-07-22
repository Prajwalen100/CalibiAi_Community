"use client";

import { usePathname } from "next/navigation";

/**
 * Hides its children on routes where a full-viewport chrome-less experience
 * is preferred (e.g. the sign-in / sign-up page). The children (header or
 * footer) are still server-rendered by the root layout, but we visually
 * suppress them here.
 */
export function ChromeSlot({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hide =
    pathname?.startsWith("/signin") ||
    pathname?.startsWith("/employer/signin") ||
    pathname?.startsWith("/employer/onboarding") ||
    pathname?.startsWith("/employer/dashboard");
  if (hide) return null;
  return <>{children}</>;
}
