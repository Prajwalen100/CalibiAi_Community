"use client";

const companies = [
  "Clevrr AI",
  "DevionX",
  "Colega AI",
  "Stelloworks",
  "VRAMP Technologies",
];

/** Continuously scrolling partner marquee used on the public landing page. */
export function TrustedByBanner() {
  // Two identical groups let the animation loop without a visible jump.
  const marqueeCompanies = [...companies, ...companies];

  return (
    <section className="relative overflow-hidden py-16 sm:py-20">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent dark:via-white/10" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex justify-center">
          <span className="inline-flex items-center rounded-full border border-slate-200/80 bg-white/70 px-5 py-2 text-xs font-extrabold uppercase tracking-widest text-slate-500 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-white/5 dark:text-white/50">
            Trusted By
          </span>
        </div>
      </div>

      <div className="trusted-marquee relative border-y border-slate-200/70 py-7 dark:border-white/10">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-slate-50 to-transparent dark:from-slate-950 sm:w-40" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-slate-50 to-transparent dark:from-slate-950 sm:w-40" />
        <div className="trusted-marquee-track flex w-max items-center">
          {marqueeCompanies.map((name, index) => (
            <div
              key={`${name}-${index}`}
              aria-hidden={index >= companies.length}
              className="trusted-logo-item shrink-0 px-8 text-xl font-extrabold tracking-tight text-slate-600 sm:px-12 sm:text-2xl md:px-16 dark:text-white/60"
              style={{ fontVariationSettings: "'wght' 800" }}
            >
              {name}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
