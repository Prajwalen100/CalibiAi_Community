import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts", "components/**/*.test.tsx"],
    exclude: ["phases/**", "node_modules/**"],
  },
  resolve: { alias: { "@": path.resolve(__dirname, ".") } }
});
