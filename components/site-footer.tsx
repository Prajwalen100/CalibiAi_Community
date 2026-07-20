import Link from "next/link";
import { ShieldCheck, Github, Twitter, Linkedin } from "lucide-react";
import { ScrollReveal } from "@/components/scroll-reveal";
import { CompactBrandLogo } from "@/components/brand-logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200/60 bg-white/60 backdrop-blur-2xl transition-colors dark:border-slate-800/80 dark:bg-slate-950/80 glass-panel-subtle relative overflow-hidden">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-t from-brand-500/5 via-transparent to-transparent opacity-0 dark:opacity-10 pointer-events-none" />
      
      <div className="relative mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-3 lg:px-8">
        <ScrollReveal direction="up" delay={100} className="md:col-span-2">
          <div>
            <Link href="/" className="flex items-center gap-2 text-base font-black text-primary">
              <CompactBrandLogo />
            </Link>
            <p className="mt-3 max-w-md text-xs leading-relaxed text-secondary">
              CalibiAI helps engineering students become verified, hire-ready applied-AI engineers through real projects, hands-on assessments, and trusted talent profiles.
            </p>
            <p className="mt-6 text-[11px] text-subtle">
              © {new Date().getFullYear()} CalibiAI Ecosystem. All rights reserved.
            </p>
            
            {/* Social Links */}
            <div className="mt-6 flex items-center gap-4">
              <a href="https://github.com/CalibiAI" target="_blank" rel="noopener noreferrer" className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200/80 bg-white/80 backdrop-blur-md text-slate-500 transition-all duration-200 hover:border-brand-500 hover:text-brand-600 hover:bg-white/90 dark:border-slate-800/80 dark:bg-slate-900/80 dark:text-slate-400 dark:hover:border-brand-400 dark:hover:text-brand-400" aria-label="GitHub">
                <Github className="h-4 w-4" />
              </a>
              <a href="https://twitter.com/CalibiAI" target="_blank" rel="noopener noreferrer" className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200/80 bg-white/80 backdrop-blur-md text-slate-500 transition-all duration-200 hover:border-brand-500 hover:text-brand-600 hover:bg-white/90 dark:border-slate-800/80 dark:bg-slate-900/80 dark:text-slate-400 dark:hover:border-brand-400 dark:hover:text-brand-400" aria-label="Twitter">
                <Twitter className="h-4 w-4" />
              </a>
              <a href="https://linkedin.com/company/calibiai" target="_blank" rel="noopener noreferrer" className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200/80 bg-white/80 backdrop-blur-md text-slate-500 transition-all duration-200 hover:border-brand-500 hover:text-brand-600 hover:bg-white/90 dark:border-slate-800/80 dark:bg-slate-900/80 dark:text-slate-400 dark:hover:border-brand-400 dark:hover:text-brand-400" aria-label="LinkedIn">
                <Linkedin className="h-4 w-4" />
              </a>
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal direction="up" delay={200}>
          <div>
            <p className="font-bold text-primary">Platform</p>
            <div className="mt-3 grid gap-2 text-xs">
              <Link href="/academy" className="text-secondary transition-colors duration-200 hover:text-brand-600 dark:hover:text-brand-400">Academy</Link>
              <Link href="/community" className="text-secondary transition-colors duration-200 hover:text-brand-600 dark:hover:text-brand-400">Community</Link>
              <Link href="/placements" className="text-secondary transition-colors duration-200 hover:text-brand-600 dark:hover:text-brand-400">Placements</Link>
              <Link href="/blog" className="text-secondary transition-colors duration-200 hover:text-brand-600 dark:hover:text-brand-400">Blog</Link>
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal direction="up" delay={300}>
          <div>
            <p className="font-bold text-primary">Resources</p>
            <div className="mt-3 grid gap-2 text-xs">
              <Link href="/community/showcase" className="text-secondary transition-colors duration-200 hover:text-brand-600 dark:hover:text-brand-400">Project Showcase</Link>
              <Link href="/community/challenges" className="text-secondary transition-colors duration-200 hover:text-brand-600 dark:hover:text-brand-400">AI Challenges</Link>
              <Link href="/community/events" className="text-secondary transition-colors duration-200 hover:text-brand-600 dark:hover:text-brand-400">Events</Link>
              <Link href="/community/jobs" className="text-secondary transition-colors duration-200 hover:text-brand-600 dark:hover:text-brand-400">Job Board</Link>
              <Link href="/community/mentors" className="text-secondary transition-colors duration-200 hover:text-brand-600 dark:hover:text-brand-400">Mentors</Link>
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal direction="up" delay={400}>
          <div>
            <p className="font-bold text-primary">Legal</p>
            <div className="mt-3 grid gap-2 text-xs">
              <Link href="/privacy" className="text-secondary transition-colors duration-200 hover:text-brand-600 dark:hover:text-brand-400">Privacy Policy</Link>
              <Link href="/terms" className="text-secondary transition-colors duration-200 hover:text-brand-600 dark:hover:text-brand-400">Terms of Service</Link>
              <Link href="/cookies" className="text-secondary transition-colors duration-200 hover:text-brand-600 dark:hover:text-brand-400">Cookie Policy</Link>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </footer>
  );
}
