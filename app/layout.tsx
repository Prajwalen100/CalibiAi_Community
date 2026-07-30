import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ChromeSlot } from "@/components/site-chrome";
import { ThemeProvider } from "@/components/theme-provider";
import { GlobalAiAssistant } from "@/components/global-ai-assistant";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "CalibiAI — verified, hire-ready applied-AI engineers",
  description: "CalibiAI helps engineering students build verified AI profiles and connect with startups that trust proof over certificates.",
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
        </ThemeProvider>
      </body>
    </html>
  );
}