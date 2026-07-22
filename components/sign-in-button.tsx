import Link from "next/link";
import { Building2, GraduationCap } from "lucide-react";

/**
 * Header auth entry points — clear Student vs Employer paths for first-time visitors.
 */
export function SignInButton() {
  return (
    <div className="flex items-center gap-2">
      <Link
        href="/signin?mode=sign-in"
        className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-white/80 px-3 py-2 text-xs font-bold text-secondary shadow-sm transition-all duration-200 hover:border-brand-500 hover:text-brand-600 dark:border-slate-800/80 dark:bg-slate-900/80 dark:text-slate-200 dark:hover:border-brand-400 sm:px-4"
      >
        <GraduationCap className="hidden h-3.5 w-3.5 sm:inline" />
        Student login
      </Link>
      <Link
        href="/employer/signin?mode=sign-in"
        className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-3 py-2 text-xs font-bold text-white shadow-sm transition-all duration-200 hover:bg-brand-600 dark:bg-white dark:text-slate-900 dark:hover:bg-brand-100 sm:px-4"
      >
        <Building2 className="hidden h-3.5 w-3.5 sm:inline" />
        Employer login
      </Link>
    </div>
  );
}
