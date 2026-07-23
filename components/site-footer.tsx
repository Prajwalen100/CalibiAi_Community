import Link from "next/link";
import { Github, Twitter, Linkedin } from "lucide-react";
import { ScrollReveal } from "@/components/scroll-reveal";
import { CompactBrandLogo } from "@/components/brand-logo";

export function SiteFooter() {
  return (
    <footer className="relative overflow-hidden border-t border-slate-200/60 bg-white/60 backdrop-blur-2xl transition-colors dark:border-slate-800/80 dark:bg-slate-950/80">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-brand-500/5 via-transparent to-transparent opacity-0 dark:opacity-10" />

      <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-8 md:flex-row md:justify-between">
          {/* Logo & Copyright */}
          <ScrollReveal direction="up" delay={100}>
            <div className="text-center md:text-left">
              <Link href="/" className="inline-flex items-center gap-2 text-base font-black text-primary">
                <CompactBrandLogo />
              </Link>
              <p className="mt-3 text-xs text-subtle">
                © {new Date().getFullYear()} CalibiAI Ecosystem. All rights reserved.
              </p>
            </div>
          </ScrollReveal>

          {/* Links */}
          <ScrollReveal direction="up" delay={200}>
            <div className="flex flex-wrap items-center justify-center gap-8 text-xs">
              <div>
                <p className="font-bold text-primary mb-3">Discover</p>
                <div className="grid gap-2">
                  <Link href="/#story" className="text-secondary transition hover:text-brand-600 dark:hover:text-brand-400">
                    Our story
                  </Link>
                  <Link href="/#testimonials" className="text-secondary transition hover:text-brand-600 dark:hover:text-brand-400">
                    Testimonials
                  </Link>
                </div>
              </div>
              <div>
                <p className="font-bold text-primary mb-3">Get started</p>
                <div className="grid gap-2">
                  <Link href="/signin?mode=sign-in" className="text-secondary transition hover:text-brand-600 dark:hover:text-brand-400">
                    Student login
                  </Link>
                  <Link href="/employer/signin?mode=sign-in" className="text-secondary transition hover:text-brand-600 dark:hover:text-brand-400">
                    Employer login
                  </Link>
                </div>
              </div>
              <div>
                <p className="font-bold text-primary mb-3">Legal</p>
                <div className="grid gap-2">
                  <Link href="/privacy" className="text-secondary transition hover:text-brand-600 dark:hover:text-brand-400">
                    Privacy Policy
                  </Link>
                  <Link href="/terms" className="text-secondary transition hover:text-brand-600 dark:hover:text-brand-400">
                    Terms of Service
                  </Link>
                </div>
              </div>
            </div>
          </ScrollReveal>

          {/* Social */}
          <ScrollReveal direction="up" delay={300}>
            <div className="flex items-center gap-3">
              <a
                href="https://github.com/CalibiAI"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200/80 bg-white/80 text-slate-500 transition hover:border-brand-500 hover:text-brand-600 dark:border-slate-800/80 dark:bg-slate-900/80 dark:text-slate-400"
                aria-label="GitHub"
              >
                <Github className="h-4 w-4" />
              </a>
              <a
                href="https://twitter.com/CalibiAI"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200/80 bg-white/80 text-slate-500 transition hover:border-brand-500 hover:text-brand-600 dark:border-slate-800/80 dark:bg-slate-900/80 dark:text-slate-400"
                aria-label="Twitter"
              >
                <Twitter className="h-4 w-4" />
              </a>
              <a
                href="https://linkedin.com/company/calibiai"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200/80 bg-white/80 text-slate-500 transition hover:border-brand-500 hover:text-brand-600 dark:border-slate-800/80 dark:bg-slate-900/80 dark:text-slate-400"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-4 w-4" />
              </a>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </footer>
  );
}
