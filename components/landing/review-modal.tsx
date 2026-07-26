"use client";

import React, { useEffect, useRef } from "react";
import { X, Quote, Star } from "lucide-react";

export interface TestimonialData {
  name: string;
  role: string;
  shortQuote: string;
  fullNarrative: string;
  metrics: { label: string; value: string }[];
  avatarId: string;
  gender: "male" | "female";
}

interface ReviewModalProps {
  testimonial: TestimonialData | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ReviewModal({ testimonial, isOpen, onClose }: ReviewModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen || !testimonial) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm dark:bg-black/70" />

      {/* Modal */}
      <div
        ref={modalRef}
        className="modal-glass relative z-10 w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6 sm:p-10"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 backdrop-blur-md transition-all hover:scale-110 hover:bg-slate-200 hover:text-slate-950 dark:bg-white/10 dark:text-white/70 dark:hover:bg-white/20 dark:hover:text-white"
          aria-label="Close review"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Avatar */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/30 via-purple-500/30 to-indigo-500/30 blur-xl scale-150" />
            <div className="relative h-28 w-28 overflow-hidden rounded-full border-2 border-white shadow-2xl animate-avatar-breathe sm:h-32 sm:w-32 dark:border-white/20">
              <AvatarSVG id={testimonial.avatarId} gender={testimonial.gender} size={128} />
            </div>
          </div>
        </div>

        {/* Name & Role */}
        <div className="text-center mb-6">
          <h3 className="text-2xl font-black text-slate-950 dark:text-white sm:text-3xl">
            {testimonial.name}
          </h3>
          <p className="mt-1 text-sm font-semibold text-slate-600 dark:text-white/60">
            {testimonial.role}
          </p>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
          {testimonial.metrics.map((metric) => (
            <div
              key={metric.label}
              className="glass-subtle rounded-xl p-3 text-center"
            >
              <div className="text-lg font-black text-slate-950 dark:text-white">
                {metric.value}
              </div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-white/50">
                {metric.label}
              </div>
            </div>
          ))}
        </div>

        {/* Full Narrative */}
        <div className="relative">
          <Quote className="absolute -top-2 -left-2 h-8 w-8 text-blue-400/30" />
          <p className="relative z-10 pl-4 text-base leading-relaxed text-slate-700 dark:text-white/85 sm:text-lg">
            {testimonial.fullNarrative}
          </p>
        </div>

        {/* Stars */}
        <div className="mt-8 flex justify-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className="h-5 w-5 fill-amber-400 text-amber-400"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Inline SVG Avatar Component ──────────────────────────── */
function AvatarSVG({
  id,
  size = 128,
}: {
  id: string;
  gender: "male" | "female";
  size?: number;
}) {
  // Generate different 3D-style avatars based on ID
  const avatars: Record<string, React.ReactNode> = {
    "ai-engineer": (
      <svg viewBox="0 0 128 128" width={size} height={size}>
        <defs>
          <linearGradient id="skin-1" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fcd5b4" />
            <stop offset="100%" stopColor="#f0b88a" />
          </linearGradient>
          <linearGradient id="bg-1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e3a5f" />
            <stop offset="100%" stopColor="#2d1b69" />
          </linearGradient>
          <filter id="shadow-1">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.3" />
          </filter>
        </defs>
        <circle cx="64" cy="64" r="62" fill="url(#bg-1)" />
        {/* Body/Shoulders */}
        <ellipse cx="64" cy="120" rx="36" ry="24" fill="#2563eb" />
        <ellipse cx="64" cy="118" rx="32" ry="20" fill="#3b82f6" />
        {/* Head */}
        <ellipse cx="64" cy="52" rx="26" ry="28" fill="url(#skin-1)" filter="url(#shadow-1)" />
        {/* Hair - AI engineer style */}
        <path d="M38 48 Q40 25 64 22 Q88 25 90 48 Q88 35 64 32 Q40 35 38 48Z" fill="#1a1a2e" />
        <path d="M38 48 Q38 42 42 38" fill="none" stroke="#1a1a2e" strokeWidth="3" />
        {/* Eyes */}
        <ellipse cx="52" cy="50" rx="4" ry="4.5" fill="#1a1a2e" />
        <ellipse cx="76" cy="50" rx="4" ry="4.5" fill="#1a1a2e" />
        <circle cx="53" cy="49" r="1.5" fill="white" opacity="0.8" />
        <circle cx="77" cy="49" r="1.5" fill="white" opacity="0.8" />
        {/* Eyebrows */}
        <path d="M46 43 Q52 40 58 43" fill="none" stroke="#1a1a2e" strokeWidth="2" strokeLinecap="round" />
        <path d="M70 43 Q76 40 82 43" fill="none" stroke="#1a1a2e" strokeWidth="2" strokeLinecap="round" />
        {/* Slight smile */}
        <path d="M56 62 Q64 67 72 62" fill="none" stroke="#c0846b" strokeWidth="2" strokeLinecap="round" />
        {/* Glasses - tech look */}
        <rect x="44" y="45" width="16" height="12" rx="3" fill="none" stroke="#475569" strokeWidth="2" />
        <rect x="68" y="45" width="16" height="12" rx="3" fill="none" stroke="#475569" strokeWidth="2" />
        <line x1="60" y1="51" x2="68" y2="51" stroke="#475569" strokeWidth="2" />
        {/* Neural network pattern on shirt */}
        <circle cx="56" cy="110" r="2" fill="#60a5fa" opacity="0.8" />
        <circle cx="72" cy="108" r="2" fill="#60a5fa" opacity="0.8" />
        <circle cx="64" cy="115" r="2" fill="#60a5fa" opacity="0.8" />
        <line x1="56" y1="110" x2="64" y2="115" stroke="#60a5fa" strokeWidth="0.8" opacity="0.6" />
        <line x1="72" y1="108" x2="64" y2="115" stroke="#60a5fa" strokeWidth="0.8" opacity="0.6" />
        <line x1="56" y1="110" x2="72" y2="108" stroke="#60a5fa" strokeWidth="0.8" opacity="0.6" />
      </svg>
    ),
    "cs-grad": (
      <svg viewBox="0 0 128 128" width={size} height={size}>
        <defs>
          <linearGradient id="skin-2" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#d4a574" />
            <stop offset="100%" stopColor="#b8875a" />
          </linearGradient>
          <linearGradient id="bg-2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0f172a" />
            <stop offset="100%" stopColor="#1e1b4b" />
          </linearGradient>
        </defs>
        <circle cx="64" cy="64" r="62" fill="url(#bg-2)" />
        {/* Graduation Cap */}
        <rect x="38" y="22" width="52" height="6" rx="1" fill="#1e293b" />
        <polygon points="64,14 88,25 64,36 40,25" fill="#1e293b" />
        <line x1="64" y1="14" x2="64" y2="22" stroke="#334155" strokeWidth="2" />
        {/* Tassel */}
        <line x1="82" y1="25" x2="90" y2="38" stroke="#f59e0b" strokeWidth="2" />
        <circle cx="90" cy="40" r="3" fill="#f59e0b" />
        {/* Body/Shoulders */}
        <ellipse cx="64" cy="120" rx="36" ry="24" fill="#1e293b" />
        <ellipse cx="64" cy="118" rx="32" ry="20" fill="#334155" />
        {/* Head */}
        <ellipse cx="64" cy="55" rx="26" ry="28" fill="url(#skin-2)" />
        {/* Hair */}
        <path d="M38 50 Q40 30 64 27 Q88 30 90 50 Q88 38 64 35 Q40 38 38 50Z" fill="#1a1a1a" />
        {/* Eyes */}
        <ellipse cx="52" cy="53" rx="4" ry="4.5" fill="#1a1a1a" />
        <ellipse cx="76" cy="53" rx="4" ry="4.5" fill="#1a1a1a" />
        <circle cx="53" cy="52" r="1.5" fill="white" opacity="0.7" />
        <circle cx="77" cy="52" r="1.5" fill="white" opacity="0.7" />
        {/* Warm smile */}
        <path d="M55 65 Q64 71 73 65" fill="none" stroke="#8b6347" strokeWidth="2" strokeLinecap="round" />
        {/* Eyebrows - confident */}
        <path d="M46 46 Q52 43 58 46" fill="none" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M70 46 Q76 43 82 46" fill="none" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round" />
        {/* Code symbol on shirt */}
        <text x="58" y="116" fill="#60a5fa" fontSize="12" fontFamily="monospace" fontWeight="bold">{"</>"}</text>
      </svg>
    ),
    "data-scientist": (
      <svg viewBox="0 0 128 128" width={size} height={size}>
        <defs>
          <linearGradient id="skin-3" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffe0c2" />
            <stop offset="100%" stopColor="#f0c8a0" />
          </linearGradient>
          <linearGradient id="bg-3" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#312e81" />
            <stop offset="100%" stopColor="#1e3a5f" />
          </linearGradient>
          <linearGradient id="hair-3" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#4a2c17" />
            <stop offset="100%" stopColor="#2d1b0e" />
          </linearGradient>
        </defs>
        <circle cx="64" cy="64" r="62" fill="url(#bg-3)" />
        {/* Body/Shoulders */}
        <ellipse cx="64" cy="120" rx="36" ry="24" fill="#7c3aed" />
        <ellipse cx="64" cy="118" rx="32" ry="20" fill="#8b5cf6" />
        {/* Head */}
        <ellipse cx="64" cy="55" rx="26" ry="28" fill="url(#skin-3)" />
        {/* Long hair */}
        <path d="M36 55 Q38 25 64 20 Q90 25 92 55 Q90 35 64 30 Q38 35 36 55Z" fill="url(#hair-3)" />
        <path d="M36 55 Q34 65 36 80" fill="none" stroke="url(#hair-3)" strokeWidth="8" strokeLinecap="round" />
        <path d="M92 55 Q94 65 92 80" fill="none" stroke="url(#hair-3)" strokeWidth="8" strokeLinecap="round" />
        {/* Eyes - larger, expressive */}
        <ellipse cx="52" cy="53" rx="4.5" ry="5" fill="#1a1a1a" />
        <ellipse cx="76" cy="53" rx="4.5" ry="5" fill="#1a1a1a" />
        <circle cx="53.5" cy="51.5" r="2" fill="white" opacity="0.8" />
        <circle cx="77.5" cy="51.5" r="2" fill="white" opacity="0.8" />
        {/* Eyelashes */}
        <path d="M47 48 Q49 46 51 48" fill="none" stroke="#1a1a1a" strokeWidth="1" />
        <path d="M77 48 Q79 46 81 48" fill="none" stroke="#1a1a1a" strokeWidth="1" />
        {/* Eyebrows */}
        <path d="M46 45 Q52 42 58 45" fill="none" stroke="#3d2412" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M70 45 Q76 42 82 45" fill="none" stroke="#3d2412" strokeWidth="1.8" strokeLinecap="round" />
        {/* Soft smile */}
        <path d="M57 65 Q64 69 71 65" fill="none" stroke="#d4956b" strokeWidth="1.8" strokeLinecap="round" />
        {/* Blush */}
        <ellipse cx="44" cy="60" rx="5" ry="3" fill="#fca5a5" opacity="0.3" />
        <ellipse cx="84" cy="60" rx="5" ry="3" fill="#fca5a5" opacity="0.3" />
        {/* Data chart on shirt */}
        <rect x="54" y="106" width="4" height="12" rx="1" fill="#c4b5fd" opacity="0.8" />
        <rect x="60" y="102" width="4" height="16" rx="1" fill="#a78bfa" opacity="0.8" />
        <rect x="66" y="108" width="4" height="10" rx="1" fill="#8b5cf6" opacity="0.8" />
        <rect x="72" y="100" width="4" height="18" rx="1" fill="#7c3aed" opacity="0.8" />
      </svg>
    ),
    "ml-student": (
      <svg viewBox="0 0 128 128" width={size} height={size}>
        <defs>
          <linearGradient id="skin-4" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#e8c4a0" />
            <stop offset="100%" stopColor="#d4a87c" />
          </linearGradient>
          <linearGradient id="bg-4" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#064e3b" />
            <stop offset="100%" stopColor="#1e3a5f" />
          </linearGradient>
        </defs>
        <circle cx="64" cy="64" r="62" fill="url(#bg-4)" />
        {/* Body */}
        <ellipse cx="64" cy="120" rx="36" ry="24" fill="#059669" />
        <ellipse cx="64" cy="118" rx="32" ry="20" fill="#10b981" />
        {/* Head */}
        <ellipse cx="64" cy="55" rx="26" ry="28" fill="url(#skin-4)" />
        {/* Hair - curly/textured */}
        <path d="M38 48 Q38 22 64 18 Q90 22 90 48" fill="#1a1a1a" />
        <circle cx="42" cy="38" r="5" fill="#1a1a1a" />
        <circle cx="52" cy="30" r="5" fill="#1a1a1a" />
        <circle cx="64" cy="26" r="5" fill="#1a1a1a" />
        <circle cx="76" cy="30" r="5" fill="#1a1a1a" />
        <circle cx="86" cy="38" r="5" fill="#1a1a1a" />
        {/* Eyes - thoughtful look */}
        <ellipse cx="52" cy="53" rx="4" ry="4.5" fill="#1a1a1a" />
        <ellipse cx="76" cy="53" rx="4" ry="4.5" fill="#1a1a1a" />
        <circle cx="53" cy="52" r="1.5" fill="white" opacity="0.8" />
        <circle cx="77" cy="52" r="1.5" fill="white" opacity="0.8" />
        {/* Thinking expression - slight tilt */}
        <path d="M46 45 Q52 44 57 46" fill="none" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" />
        <path d="M71 44 Q77 43 83 45" fill="none" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" />
        {/* Concentrated smile */}
        <path d="M58 64 Q64 67 70 64" fill="none" stroke="#b8845e" strokeWidth="1.8" strokeLinecap="round" />
        {/* ML brain icon on shirt */}
        <circle cx="64" cy="112" r="8" fill="none" stroke="#6ee7b7" strokeWidth="1.5" opacity="0.8" />
        <path d="M58 112 Q61 108 64 112 Q67 116 70 112" fill="none" stroke="#6ee7b7" strokeWidth="1.5" opacity="0.8" />
        <circle cx="60" cy="110" r="1.5" fill="#6ee7b7" opacity="0.8" />
        <circle cx="68" cy="114" r="1.5" fill="#6ee7b7" opacity="0.8" />
      </svg>
    ),
    "web-developer": (
      <svg viewBox="0 0 128 128" width={size} height={size}>
        <defs>
          <linearGradient id="skin-5" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fcd5b4" />
            <stop offset="100%" stopColor="#e8b88a" />
          </linearGradient>
          <linearGradient id="bg-5" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7c2d12" />
            <stop offset="100%" stopColor="#4c1d95" />
          </linearGradient>
        </defs>
        <circle cx="64" cy="64" r="62" fill="url(#bg-5)" />
        {/* Body */}
        <ellipse cx="64" cy="120" rx="36" ry="24" fill="#ea580c" />
        <ellipse cx="64" cy="118" rx="32" ry="20" fill="#f97316" />
        {/* Head */}
        <ellipse cx="64" cy="55" rx="26" ry="28" fill="url(#skin-5)" />
        {/* Hair - side swept */}
        <path d="M38 50 Q40 28 64 24 Q85 26 88 45 Q86 32 64 28 Q42 30 38 50Z" fill="#2d1b0e" />
        <path d="M38 50 Q36 42 40 38 Q44 34 50 38" fill="#2d1b0e" />
        {/* Eyes */}
        <ellipse cx="52" cy="53" rx="4" ry="4.5" fill="#1a1a1a" />
        <ellipse cx="76" cy="53" rx="4" ry="4.5" fill="#1a1a1a" />
        <circle cx="53" cy="52" r="1.5" fill="white" opacity="0.8" />
        <circle cx="77" cy="52" r="1.5" fill="white" opacity="0.8" />
        {/* Confident expression */}
        <path d="M46 45 Q52 43 58 45" fill="none" stroke="#2d1b0e" strokeWidth="2" strokeLinecap="round" />
        <path d="M70 45 Q76 43 82 45" fill="none" stroke="#2d1b0e" strokeWidth="2" strokeLinecap="round" />
        {/* Wide smile */}
        <path d="M54 64 Q64 72 74 64" fill="none" stroke="#c0846b" strokeWidth="2.5" strokeLinecap="round" />
        {/* Browser window icon on shirt */}
        <rect x="54" y="104" width="20" height="16" rx="2" fill="none" stroke="#fed7aa" strokeWidth="1.5" opacity="0.8" />
        <line x1="54" y1="108" x2="74" y2="108" stroke="#fed7aa" strokeWidth="1" opacity="0.6" />
        <circle cx="57" cy="106" r="1" fill="#ef4444" opacity="0.8" />
        <circle cx="60" cy="106" r="1" fill="#f59e0b" opacity="0.8" />
        <circle cx="63" cy="106" r="1" fill="#10b981" opacity="0.8" />
      </svg>
    ),
  };

  return avatars[id] || avatars["ai-engineer"];
}

export { AvatarSVG };
