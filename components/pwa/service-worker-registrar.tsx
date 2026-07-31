"use client";

import { useEffect } from "react";

/**
 * Registers `/sw.js` after the page has settled.
 *
 * Registration is deferred to the `load` event so the service worker never
 * competes with the initial render for bandwidth — this protects LCP and
 * keeps the Lighthouse performance score high.
 */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    // A stale worker in dev shadows local changes; unregister and bail out.
    if (process.env.NODE_ENV !== "production") {
      void navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => void registration.unregister());
      });
      return;
    }

    const register = () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((registration) => {
          // Activate a waiting worker immediately so users are never stuck on
          // a stale build after a deploy.
          if (registration.waiting) registration.waiting.postMessage("SKIP_WAITING");

          registration.addEventListener("updatefound", () => {
            const installing = registration.installing;
            if (!installing) return;
            installing.addEventListener("statechange", () => {
              if (installing.state === "installed" && navigator.serviceWorker.controller) {
                installing.postMessage("SKIP_WAITING");
              }
            });
          });
        })
        .catch(() => {
          // Registration failing must never break the app.
        });
    };

    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register, { once: true });
      return () => window.removeEventListener("load", register);
    }
  }, []);

  return null;
}
