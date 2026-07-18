import Link from "next/link";
import { SignInButton } from "@/components/sign-in-button";

const links = [
  ["Programs", "/programs"],
  ["Colleges", "/for-colleges"],
  ["Startups", "/for-startups"],
  ["Placements", "/success-stories"],
  ["Blog", "/blog"],
  ["Company", "/about"]
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="text-lg font-black tracking-tight text-ink">CalibiAI</Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 lg:flex">
          {links.map(([label, href]) => <Link key={href} href={href} className="hover:text-ink">{label}</Link>)}
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="hidden text-sm font-semibold text-slate-700 hover:text-ink sm:inline">Dashboard</Link>
          <SignInButton />
        </div>
      </div>
    </header>
  );
}
