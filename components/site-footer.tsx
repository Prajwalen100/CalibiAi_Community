import Link from "next/link";
import { Instagram, Linkedin } from "lucide-react";
import { CompactBrandLogo } from "@/components/brand-logo";

export function SiteFooter() {
  return (
    <footer className="relative overflow-hidden border-t border-slate-200/70 dark:border-white/8">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-blue-100/50 via-transparent to-transparent dark:from-blue-950/20" />

      <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-8 md:flex-row md:justify-between">
          {/* Logo & Copyright */}
          <div className="text-center md:text-left">
            <Link href="/" className="inline-flex items-center gap-2">
              <CompactBrandLogo />
            </Link>
            <p className="mt-3 text-xs text-slate-500 dark:text-white/30">
              © {new Date().getFullYear()} CalibiAI Ecosystem. All rights reserved.
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-wrap items-center justify-center gap-8 text-xs">
            <div>
              <p className="font-bold text-slate-700 dark:text-white/60 mb-3">Discover</p>
              <div className="grid gap-2">
                <Link href="/#how-it-works" className="text-slate-500 transition hover:text-slate-900 dark:text-white/30 dark:hover:text-white/70">
                  How It Works
                </Link>
                <Link href="/#testimonials" className="text-slate-500 transition hover:text-slate-900 dark:text-white/30 dark:hover:text-white/70">
                  Testimonials
                </Link>
              </div>
            </div>
            <div>
              <p className="font-bold text-slate-700 dark:text-white/60 mb-3">Get started</p>
              <div className="grid gap-2">
                <Link href="/signin?mode=sign-in" className="text-slate-500 transition hover:text-slate-900 dark:text-white/30 dark:hover:text-white/70">
                  Student login
                </Link>
                <Link href="/employer/signin?mode=sign-in" className="text-slate-500 transition hover:text-slate-900 dark:text-white/30 dark:hover:text-white/70">
                  Employer login
                </Link>
              </div>
            </div>
            <div>
              <p className="font-bold text-slate-700 dark:text-white/60 mb-3">Legal</p>
              <div className="grid gap-2">
                <Link href="/privacy" className="text-slate-500 transition hover:text-slate-900 dark:text-white/30 dark:hover:text-white/70">
                  Privacy Policy
                </Link>
                <Link href="/terms" className="text-slate-500 transition hover:text-slate-900 dark:text-white/30 dark:hover:text-white/70">
                  Terms of Service
                </Link>
              </div>
            </div>
          </div>

          {/* Social */}
          <div className="flex items-center gap-3">
            <a
              href="https://www.instagram.com/calibiai?igsh=M3FqemVmcmI5cTFj&utm_source=qr"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white/70 text-slate-500 transition hover:bg-white hover:text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-white/40 dark:hover:bg-white/10 dark:hover:text-white/70"
              aria-label="Instagram"
            >
              <Instagram className="h-4 w-4" />
            </a>
            <a
              href="https://www.linkedin.com/company/calibi/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white/70 text-slate-500 transition hover:bg-white hover:text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-white/40 dark:hover:bg-white/10 dark:hover:text-white/70"
              aria-label="LinkedIn"
            >
              <Linkedin className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
