"use client";

import { ShieldCheck, Zap, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "default" | "icon-only" | "text-only" | "gradient";
  showGlow?: boolean;
}

const sizeClasses = {
  sm: { icon: "h-5 w-5", text: "text-base", container: "h-8 w-8" },
  md: { icon: "h-6 w-6", text: "text-lg", container: "h-10 w-10" },
  lg: { icon: "h-8 w-8", text: "text-xl", container: "h-12 w-12" },
  xl: { icon: "h-10 w-10", text: "text-2xl", container: "h-16 w-16" },
};

export function BrandLogo({
  className,
  size = "md",
  variant = "default",
  showGlow = false,
}: BrandLogoProps) {
  const sizes = sizeClasses[size];

  if (variant === "icon-only") {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 via-indigo-600 to-purple-600 text-white shadow-lg",
          sizes.container,
          showGlow && "animate-pulse-glow",
          className
        )}
        aria-hidden="true"
      >
        <ShieldCheck className={sizes.icon} />
      </div>
    );
  }

  if (variant === "text-only") {
    return (
      <span className={cn("bg-gradient-to-r from-slate-900 via-brand-600 to-indigo-600 bg-clip-text text-transparent dark:from-white dark:via-brand-300 dark:to-indigo-300 font-black", sizes.text, className)}>
        CalibiAI
      </span>
    );
  }

  if (variant === "gradient") {
    return (
      <div className={cn("inline-flex items-center gap-2", className)}>
        <div className={cn(
          "flex items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 via-indigo-600 to-purple-600 text-white shadow-lg",
          sizes.container,
          showGlow && "animate-pulse-glow"
        )}>
          <ShieldCheck className={sizes.icon} />
        </div>
        <span className={cn("bg-gradient-to-r from-slate-900 via-brand-600 to-indigo-600 bg-clip-text text-transparent dark:from-white dark:via-brand-300 dark:to-indigo-300 font-black", sizes.text)}>
          CalibiAI
        </span>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className={cn(
        "flex items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 via-indigo-600 to-purple-600 text-white shadow-md transition-all duration-300 hover:scale-105 hover:shadow-brand-500/30",
        sizes.container,
        showGlow && "animate-pulse-glow"
      )}>
        <ShieldCheck className={sizes.icon} />
      </div>
      <span className={cn("bg-gradient-to-r from-slate-900 via-brand-600 to-indigo-600 bg-clip-text text-transparent dark:from-white dark:via-brand-300 dark:to-indigo-300 font-black", sizes.text)}>
        CalibiAI
      </span>
    </div>
  );
}

/* Animated Brand Logo for Hero sections */
export function AnimatedBrandLogo({
  className,
  size = "xl",
}: { className?: string; size?: "sm" | "md" | "lg" | "xl" }) {
  return (
    <div className={cn("relative inline-flex items-center gap-3", className)}>
      <div className="relative">
        {/* Glow rings */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-brand-500/30 via-indigo-500/20 to-purple-500/30 blur-2xl opacity-50 animate-pulse-glow -z-10" />
        
        <div className={cn(
          "relative flex items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 via-indigo-600 to-purple-600 text-white shadow-xl",
          sizeClasses[size].container
        )}>
          <ShieldCheck className={cn(sizeClasses[size].icon, "animate-float-slow")} />
        </div>
      </div>
      
      <span className="bg-gradient-to-r from-slate-900 via-brand-600 to-indigo-600 bg-clip-text text-transparent dark:from-white dark:via-brand-300 dark:to-indigo-300 font-black">
        CalibiAI
      </span>
    </div>
  );
}

/* Compact logo for headers/footers */
export function CompactBrandLogo({
  className,
}: { className?: string } = {}) {
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 via-indigo-600 to-purple-600 text-white shadow-sm">
        <ShieldCheck className="h-4 w-4" />
      </div>
      <span className="bg-gradient-to-r from-slate-900 via-brand-600 to-indigo-600 bg-clip-text text-transparent dark:from-white dark:via-brand-300 dark:to-indigo-300 font-black text-base">
        CalibiAI
      </span>
    </div>
  );
}