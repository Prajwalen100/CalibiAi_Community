import Link from "next/link";
import { Home, Search, Sparkles } from "lucide-react";

export default function NotFound() {
  return (
    <div className="relative min-h-[70vh] flex items-center justify-center px-4">
      {/* Background glow */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-brand-500/10 via-transparent to-purple-500/10 blur-[100px] opacity-50 dark:opacity-30" />
      
      <div className="text-center max-w-md">
        <div className="inline-flex items-center gap-2 rounded-full bg-brand-50/50 px-4 py-2 text-xs font-bold text-brand-700 backdrop-blur-md shadow-sm dark:bg-brand-950/30 dark:text-brand-300 mb-6">
          <Sparkles className="h-3.5 w-3.5 text-brand-500" />
          <span>Page not found</span>
        </div>
        
        <h1 className="text-4xl font-black text-primary sm:text-5xl md:text-6xl mb-4">
          404
        </h1>
        
        <p className="text-lg text-secondary mb-8">
          Sorry, we couldn&apos;t find the page you&apos;re looking for. It might have been moved or doesn&apos;t exist.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/" className="btn-primary group">
            <Home className="h-4 w-4" />
            Go Home
          </Link>
          <Link href="/community" className="btn-secondary">
            <Search className="h-4 w-4" />
            Explore Community
          </Link>
        </div>
        
        <p className="mt-8 text-sm text-subtle">
          Or try searching for what you need
        </p>
      </div>
    </div>
  );
}