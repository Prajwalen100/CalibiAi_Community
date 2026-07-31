import { SkeletonDashboard } from "@/components/responsive/skeleton";

/**
 * Route-level loading UI for the dashboard.
 *
 * The dashboard runs several Supabase queries in parallel, so this streams a
 * page-shaped skeleton immediately rather than a spinner. Because the skeleton
 * mirrors the real layout's grid, swapping to content causes no layout shift.
 */
export default function DashboardLoading() {
  return <SkeletonDashboard />;
}
