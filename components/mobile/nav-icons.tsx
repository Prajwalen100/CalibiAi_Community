"use client";

import {
  BookOpen,
  Briefcase,
  Globe,
  Home,
  LayoutDashboard,
  LifeBuoy,
  Newspaper,
  Settings,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";

import type { MobileNavIconName } from "@/lib/navigation/mobile-nav";

/**
 * Maps serializable icon names to Lucide components.
 *
 * The nav config is shared with server components, which cannot pass component
 * references to the client, so the lookup happens here on the client side.
 */
export const MOBILE_NAV_ICONS: Record<MobileNavIconName, LucideIcon> = {
  home: Home,
  book: BookOpen,
  users: Users,
  globe: Globe,
  user: UserRound,
  dashboard: LayoutDashboard,
  news: Newspaper,
  briefcase: Briefcase,
  settings: Settings,
  support: LifeBuoy,
};
