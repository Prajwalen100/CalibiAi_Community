import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#08111f",
        muted: "#5b6577",
        brand: {
          50: "#eef8ff",
          100: "#d8efff",
          500: "#1f8fff",
          600: "#0b6ed8",
          700: "#0757ae"
        },
        signal: "#15b88a"
      },
      boxShadow: {
        soft: "0 24px 80px rgba(8, 17, 31, 0.10)"
      }
    }
  },
  plugins: []
};
export default config;
