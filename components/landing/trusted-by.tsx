"use client";

import { Mouse } from "lucide-react";

const companies = [
  "Clevrr AI",
  "DevionX",
  "Colega AI",
  "Stelloworks",
  "VRAMP Technologies",
];

export function TrustedByBanner() {
  return (
    <section className="relative py-16 sm:py-20">
      {/* Top divider */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Trusted By Pill */}
        <div className="flex justify-center mb-10">
          <span
            className="inline-flex items-center gap-2 rounded-full px-5 py-2 text-xs font-extrabold uppercase tracking-widest text-white/50"
            style={{
              backdropFilter: "blur(16px) saturate(180%)",
              WebkitBackdropFilter: "blur(16px) saturate(180%)",
              background: "rgba(255, 255, 255, 0.04)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
            }}
          >
            Trusted By
          </span>
        </div>

        {/* Logo Row with Spotlight Effect */}
        <div className="trusted-logo-group flex flex-wrap items-center justify-center gap-x-8 gap-y-6 sm:gap-x-12 lg:gap-x-16">
          {companies.map((name) => (
            <div
              key={name}
              className="trusted-logo-item cursor-default select-none text-lg sm:text-xl md:text-2xl font-extrabold tracking-tight text-white/60 transition-all duration-300 ease-in-out"
              style={{ fontVariationSettings: "'wght' 800" }}
            >
              {name}
            </div>
          ))}
        </div>

        {/* Bottom divider with scroll icon */}
        <div className="mt-12 flex flex-col items-center gap-3">
          <div className="h-px w-full max-w-md bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          <div className="animate-bounce-gentle text-white/30">
            <Mouse className="h-5 w-5" />
          </div>
        </div>
      </div>
    </section>
  );
}
