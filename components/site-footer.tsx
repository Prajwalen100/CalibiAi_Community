import Link from "next/link";
import { Github, Twitter, Linkedin } from "lucide-react";
import { ScrollReveal } from "@/components/scroll-reveal";
import { CompactBrandLogo } from "@/components/brand-logo";

export function SiteFooter() {
  return (
    <footer className="relative overflow-hidden border-t border-slate-200/60 bg-white/60 backdrop-blur-2xl transition-colors dark:border-slate-800/80 dark:bg-slate-950/80 glass-panel-subtle">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-brand-500/5 via-transparent to-transparent opacity-0 dark:opacity-10" />

      <div className="relative mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-4 lg:px-8">
        <ScrollReveal direction="up" delay={100} className="md:col-span-1">
          <div>
            <Link href="/" className="flex items-center gap-2 text-base font-black text-primary">
              <CompactBrandLogo />
            </Link>
            <p className="mt-3 max-w-md text-xs leading-relaxed text-secondary">
              Learn. Build. Lead. — practical, industry-driven AI education for the next generation of innovators.
            </p>
            <p className="mt-6 text-[11px] text-subtle">
              © {new Date().getFullYear()} CalibiAI Ecosystem. All rights reserved.
            </p>
            <div className="mt-6 flex items-center gap-4">
              <a
                href="https://github.com/CalibiAI"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200/80 bg-white/80 text-slate-500 transition hover:border-brand-500 hover:text-brand-600 dark:border-slate-800/80 dark:bg-slate-900/80 dark:text-slate-400"
                aria-label="GitHub"
              >
                <Github className="h-4 w-4" />
              </a>
              <a
                href="https://twitter.com/CalibiAI"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200/80 bg-white/80 text-slate-500 transition hover:border-brand-500 hover:text-brand-600 dark:border-slate-800/80 dark:bg-slate-900/80 dark:text-slate-400"
                aria-label="Twitter"
              >
                <Twitter className="h-4 w-4" />
              </a>
              <a
                href="https://linkedin.com/company/calibiai"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200/80 bg-white/80 text-slate-500 transition hover:border-brand-500 hover:text-brand-600 dark:border-slate-800/80 dark:bg-slate-900/80 dark:text-slate-400"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-4 w-4" />
              </a>
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal direction="up" delay={200}>
          <div>
            <p className="font-bold text-primary">Discover</p>
            <div className="mt-3 grid gap-2 text-xs">
              <Link href="/#why" className="text-secondary transition hover:text-brand-600 dark:hover:text-brand-400">
                Why CalibiAI
              </Link>
              <Link href="/#story" className="text-secondary transition hover:text-brand-600 dark:hover:text-brand-400">
                Our story
              </Link>
              <Link href="/#testimonials" className="text-secondary transition hover:text-brand-600 dark:hover:text-brand-400">
                Testimonials
              </Link>
              <Link href="/#motto" className="text-secondary transition hover:text-brand-600 dark:hover:text-brand-400">
                Our motto
              </Link>
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal direction="up" delay={300}>
          <div>
            <p className="font-bold text-primary">Get started</p>
            <div className="mt-3 grid gap-2 text-xs">
              <Link href="/signin?mode=sign-in" className="text-secondary transition hover:text-brand-600 dark:hover:text-brand-400">
                Student login
              </Link>
              <Link href="/signin?mode=sign-up" className="text-secondary transition hover:text-brand-600 dark:hover:text-brand-400">
                Student sign up
              </Link>
              <Link href="/employer/signin?mode=sign-in" className="text-secondary transition hover:text-brand-600 dark:hover:text-brand-400">
                Employer login
              </Link>
              <Link href="/employer/signin?mode=sign-up" className="text-secondary transition hover:text-brand-600 dark:hover:text-brand-400">
                Employer sign up
              </Link>
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal direction="up" delay={400}>
          <div>
            <p className="font-bold text-primary">Legal</p>
            <div className="mt-3 grid gap-2 text-xs">
              <Link href="/privacy" className="text-secondary transition hover:text-brand-600 dark:hover:text-brand-400">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-secondary transition hover:text-brand-600 dark:hover:text-brand-400">
                Terms of Service
              </Link>
              <Link href="/cookies" className="text-secondary transition hover:text-brand-600 dark:hover:text-brand-400">
                Cookie Policy
              </Link>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </footer>
  );
}
