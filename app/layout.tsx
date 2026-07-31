import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ChromeSlot } from "@/components/site-chrome";
import { ThemeProvider } from "@/components/theme-provider";
import { GlobalAiAssistant } from "@/components/global-ai-assistant";
import { ServiceWorkerRegistrar } from "@/components/pwa/service-worker-registrar";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  // Existing title/description are unchanged so current SEO is preserved.
  title: "CalibiAI — verified, hire-ready applied-AI engineers",
  description: "CalibiAI helps engineering students build verified AI profiles and connect with startups that trust proof over certificates.",
  applicationName: "CalibiAI",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    // Lets iOS launch the app chrome-less from the home screen.
    capable: true,
    title: "CalibiAI",
    // `black-translucent` lets our own header paint under the status bar; the
    // safe-area insets in the mobile chrome keep content clear of it.
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: ["/favicon.ico"],
  },
  formatDetection: {
    // Stops iOS auto-linking numbers in the UI (scores, day counts) as phone links.
    telephone: false,
  },
};

/**
 * `viewport-fit=cover` is what makes `env(safe-area-inset-*)` resolve to real
 * values on notched devices — without it the insets are always 0 and the app
 * would render under the Dynamic Island / home indicator.
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  // Zoom is intentionally left enabled: capping it fails the Lighthouse
  // accessibility audit and blocks low-vision users.
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f9ff" },
    { media: "(prefers-color-scheme: dark)", color: "#050816" },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // The assistant is a signed-in product feature, never a public landing-page
  // widget. Resolve this server-side so it does not briefly appear before the
  // client can discover that the visitor is anonymous.
  let isAuthenticated = false;
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    isAuthenticated = Boolean(user);
  } catch {
    // Keep the public site usable when the auth service is unavailable.
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        {/* Theme bootstrap. Loaded with next/script's beforeInteractive
            strategy so Next injects it into the document ahead of hydration
            instead of React rendering it — a raw <script> inside the layout
            triggers React's "script tag while rendering a component" error
            and never re-executes when the tree regenerates on the client. */}
        <Script id="calibiai-theme-init" strategy="beforeInteractive">
          {`(function(){try{var key='calibiai-theme';var saved=localStorage.getItem(key);var theme=(saved==='dark'||saved==='light')?saved:(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.classList.toggle('dark',theme==='dark');document.documentElement.style.colorScheme=theme;}catch(e){}})();`}
        </Script>
        <ThemeProvider>
          <ChromeSlot>
            <SiteHeader />
          </ChromeSlot>
          <main>{children}</main>
          <ChromeSlot>
            <SiteFooter isAuthenticated={isAuthenticated} />
          </ChromeSlot>
          {isAuthenticated && <GlobalAiAssistant />}
          {/* PWA runtime: worker registration + the custom install banner. */}
          <ServiceWorkerRegistrar />
          <InstallPrompt />
        </ThemeProvider>
      </body>
    </html>
  );
}