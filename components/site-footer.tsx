import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200/60 bg-white/60 backdrop-blur-lg dark:border-slate-800/80 dark:bg-slate-950/80 transition-colors">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 text-sm text-slate-600 sm:px-6 md:grid-cols-3 lg:px-8 dark:text-slate-400">
        <div className="md:col-span-2">
          <Link href="/" className="flex items-center gap-2 text-base font-black text-slate-900 dark:text-white">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-500 text-white shadow-sm">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <span>CalibiAI</span>
          </Link>
          <p className="mt-3 max-w-md text-xs leading-relaxed">
            CalibiAI helps engineering students become verified, hire-ready applied-AI engineers through real projects, hands-on assessments, and trusted talent profiles.
          </p>
          <p className="mt-6 text-[11px] text-slate-400 dark:text-slate-500">
            © {new Date().getFullYear()} CalibiAI Ecosystem. All rights reserved.
          </p>
        </div>

        <div>
          <p className="font-bold text-slate-900 dark:text-white">Platform</p>
          <div className="mt-3 grid gap-2 text-xs">
            <Link href="/academy" className="hover:text-brand-600 dark:hover:text-brand-400">Academy</Link>
            <Link href="/community" className="hover:text-brand-600 dark:hover:text-brand-400">Community</Link>
            <Link href="/placements" className="hover:text-brand-600 dark:hover:text-brand-400">Placements</Link>
            <Link href="/blog" className="hover:text-brand-600 dark:hover:text-brand-400">Blog</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
