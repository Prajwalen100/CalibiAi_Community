"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Share, SquarePlus, X } from "lucide-react";

/** The Chromium-only event that lets us defer and re-trigger the install UI. */
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const DISMISS_KEY = "calibiai-install-dismissed-at";
/** "Not now" snoozes the banner rather than hiding it forever. */
const SNOOZE_MS = 14 * 24 * 60 * 60 * 1000;
/** Give the page time to settle before interrupting the user. */
const SHOW_DELAY_MS = 3000;

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari predates `display-mode` and uses this non-standard flag.
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isSnoozed() {
  try {
    const raw = window.localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    return Date.now() - Number(raw) < SNOOZE_MS;
  } catch {
    return false;
  }
}

function isIos() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  // iPadOS 13+ reports as a Mac, so also check for touch support.
  return /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
}

/**
 * Custom install banner.
 *
 * On Chromium we capture `beforeinstallprompt` and drive the native dialog.
 * Safari/iOS never fires that event, so we show concise "Add to Home Screen"
 * instructions instead. Once installed, the banner never appears again.
 */
export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  // Resolved lazily on first client render. The initializer runs once and is
  // never evaluated on the server, so SSR output stays stable.
  const [iosHint] = useState(() => (typeof navigator === "undefined" ? false : isIos()));
  const reduceMotion = useReducedMotion();

  const dismiss = useCallback(() => {
    setVisible(false);
    try {
      window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      // Private mode: the banner simply returns next session.
    }
  }, []);

  useEffect(() => {
    // Installed users must never see the prompt again.
    if (isStandalone() || isSnoozed()) return;

    let timer: ReturnType<typeof setTimeout> | undefined;

    const onBeforeInstallPrompt = (event: Event) => {
      // Suppress Chrome's default mini-infobar; we present our own UI.
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      timer = setTimeout(() => setVisible(true), SHOW_DELAY_MS);
    };

    const onInstalled = () => {
      setVisible(false);
      setDeferredPrompt(null);
      try {
        window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
      } catch {
        /* no-op */
      }
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);

    // iOS has no install event — offer the manual path after the same delay.
    if (iosHint) {
      timer = setTimeout(() => setVisible(true), SHOW_DELAY_MS);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      if (timer) clearTimeout(timer);
    };
  }, [iosHint]);

  const install = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setVisible(false);
    if (outcome === "dismissed") {
      try {
        window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
      } catch {
        /* no-op */
      }
    }
  }, [deferredPrompt]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          role="dialog"
          aria-labelledby="install-prompt-title"
          aria-describedby="install-prompt-body"
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 24 }}
          animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 24 }}
          transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
          // Floats above the mobile tab bar; anchored bottom-right on desktop.
          className="fixed inset-x-3 bottom-[calc(var(--mobile-tabbar-height)+env(safe-area-inset-bottom)+0.75rem)] z-[90] mx-auto max-w-md rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-2xl backdrop-blur-xl lg:inset-x-auto lg:bottom-6 lg:right-6 lg:mx-0 dark:border-slate-800 dark:bg-slate-900/95"
        >
          <div className="flex items-start gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/icons/icon-192.png"
              alt=""
              width={44}
              height={44}
              className="h-11 w-11 shrink-0 rounded-xl"
              loading="lazy"
              decoding="async"
            />
            <div className="min-w-0 flex-1">
              <p id="install-prompt-title" className="text-sm font-bold text-slate-900 dark:text-white">
                Install CalibiAI
              </p>
              <p id="install-prompt-body" className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
                {iosHint ? (
                  <span className="inline-flex flex-wrap items-center gap-1">
                    Tap <Share className="inline h-3.5 w-3.5" aria-label="the Share button" /> then
                    <SquarePlus className="inline h-3.5 w-3.5" aria-hidden="true" />
                    <span className="font-semibold">Add to Home Screen</span>
                  </span>
                ) : (
                  "Add it to your home screen for instant, full-screen, offline-ready access."
                )}
              </p>
            </div>
            <button
              type="button"
              onClick={dismiss}
              aria-label="Dismiss install prompt"
              className="-mr-1 -mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:hover:bg-white/10 dark:hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-3 flex items-center gap-2">
            {!iosHint && (
              <button
                type="button"
                onClick={install}
                className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-bold text-white transition-colors hover:bg-brand-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:bg-brand-500 dark:hover:bg-brand-400"
              >
                Install CalibiAI
              </button>
            )}
            <button
              type="button"
              onClick={dismiss}
              className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-white/5"
            >
              Not now
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
