import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts", "components/**/*.test.tsx"],
    exclude: ["phases/**", "node_modules/**"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      // `server-only` throws by design outside a server bundle; stub it so
      // server modules can be unit tested in Vitest's Node environment.
      "server-only": path.resolve(__dirname, "test/server-only-stub.ts"),
    },
  }
});
