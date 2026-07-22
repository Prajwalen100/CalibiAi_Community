"use client";

import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="relative min-h-[70vh] flex items-center justify-center px-4">
      {/* Background glow */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-rose-500/10 via-transparent to-amber-500/10 blur-[100px] opacity-50 dark:opacity-30" />
      
      <div className="text-center max-w-md">
        <div className="inline-flex items-center gap-2 rounded-full bg-rose-50/50 px-4 py-2 text-xs font-bold text-rose-700 backdrop-blur-md shadow-sm dark:bg-rose-950/30 dark:text-rose-300 mb-6">
          <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />
          <span>Error</span>
        </div>
        
        <h1 className="text-3xl font-black text-primary sm:text-4xl mb-4">
          Something went wrong
        </h1>
        
        <p className="text-secondary mb-6">
          An unexpected error occurred. Our team has been notified.
        </p>
        
        {error.digest && (
          <p className="text-xs text-subtle font-mono mb-6">
            Error ID: {error.digest}
          </p>
        )}
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button 
            onClick={reset}
            className="btn-primary group"
          >
            <RefreshCw className="h-4 w-4 transition-transform group-hover:rotate-90" />
            Try again
          </button>
          <Link href="/" className="btn-secondary">
            <Home className="h-4 w-4" />
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}