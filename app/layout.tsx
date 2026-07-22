import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ChromeSlot } from "@/components/site-chrome";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: "CalibiAI — verified, hire-ready applied-AI engineers",
  description: "CalibiAI helps engineering students build verified AI profiles and connect with startups that trust proof over certificates.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var key='calibiai-theme';var saved=localStorage.getItem(key);var theme=(saved==='dark'||saved==='light')?saved:(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.classList.toggle('dark',theme==='dark');document.documentElement.style.colorScheme=theme;}catch(e){}})();`,
          }}
        />
        <ThemeProvider>
          <ChromeSlot>
            <SiteHeader />
          </ChromeSlot>
          <main>{children}</main>
          <ChromeSlot>
            <SiteFooter />
          </ChromeSlot>
        </ThemeProvider>
      </body>
    </html>
  );
}