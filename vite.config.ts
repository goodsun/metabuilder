import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: "0.0.0.0",
    open: true,
  },
  define: {
    global: "globalThis",
    process: JSON.stringify({
      env: {},
      version: "v18.0.0",
      browser: true,
      platform: "browser",
      nextTick: "(fn) => setTimeout(fn, 0)",
    }),
  },
  resolve: {
    alias: {
      util: "util",
      crypto: "crypto-browserify",
      stream: "stream-browserify",
      buffer: "buffer",
    },
  },
  optimizeDeps: {
    include: [
      "buffer",
      "crypto-browserify",
      "stream-browserify",
      "util",
      "arweave",
    ],
  },
});
