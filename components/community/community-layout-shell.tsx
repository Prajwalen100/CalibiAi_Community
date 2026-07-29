"use client";

import React from "react";
import { usePathname } from "next/navigation";

interface CommunityLayoutShellProps {
  breadcrumb: React.ReactNode;
  leftSidebar: React.ReactNode;
  rightSidebar: React.ReactNode;
  children: React.ReactNode;
}

export function CommunityLayoutShell({
  breadcrumb,
  leftSidebar,
  rightSidebar,
  children,
}: CommunityLayoutShellProps) {
  const pathname = usePathname() || "";
  const hideSidebars =
    pathname === "/community/jobs/opportunities" ||
    pathname.startsWith("/community/jobs/opportunities/") ||
    (pathname.startsWith("/community/jobs/") && pathname.includes("/apply"));

  if (hideSidebars) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {breadcrumb}
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {breadcrumb}
      <div className="flex gap-6 lg:flex-row">
        {leftSidebar}
        <main className="min-w-0 flex-1">{children}</main>
        {rightSidebar}
      </div>
    </div>
  );
}
