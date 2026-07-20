"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  resolvedTheme: Theme;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [resolvedTheme, setResolvedTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = window.localStorage.getItem("calibiai-theme") as Theme | null;
    const preferred = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    const initialTheme = saved ?? preferred;
    setTheme(initialTheme);
    setResolvedTheme(initialTheme);
    document.documentElement.classList.toggle("dark", initialTheme === "dark");
    document.documentElement.style.colorScheme = initialTheme;
  }, []);

  const setThemeValue = (newTheme: Theme) => {
    setTheme(newTheme);
    setResolvedTheme(newTheme);
    window.localStorage.setItem("calibiai-theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
    document.documentElement.style.colorScheme = newTheme;
  };

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setThemeValue(newTheme);
  };

  // Listen for system theme changes
  useEffect(() => {
    if (!mounted) return;
    
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
      const saved = window.localStorage.getItem("calibiai-theme");
      if (!saved) {
        const newTheme = e.matches ? "dark" : "light";
        setThemeValue(newTheme);
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [mounted]);

  // During SSR, return children without context to avoid errors
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme: setThemeValue, toggleTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  // During SSR/prerendering, return default values instead of throwing
  if (context === undefined) {
    if (typeof window === "undefined") {
      return {
        theme: "light" as Theme,
        setTheme: () => {},
        toggleTheme: () => {},
        resolvedTheme: "light" as Theme,
      };
    }
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}