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
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
        {breadcrumb}
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
      {breadcrumb}
      {/* Sidebars are already `lg:`/`xl:`-gated, so below lg this collapses to
          a single full-width column with no leftover gap. */}
      <div className="flex gap-4 lg:flex-row lg:gap-6">
        {leftSidebar}
        <main className="min-w-0 flex-1">{children}</main>
        {rightSidebar}
      </div>
    </div>
  );
}
