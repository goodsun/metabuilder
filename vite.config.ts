import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { nodePolyfills } from "vite-plugin-node-polyfills";

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
      protocolImports: true,
    }),
  ],
  server: {
    port: 3000,
    host: "0.0.0.0",
    open: true,
  },
  define: {
    // Remove these as they will be handled by nodePolyfills plugin
  },
  resolve: {
    alias: {
      util: "util",
      crypto: "crypto-browserify",
      stream: "stream-browserify",
      buffer: "buffer",
      events: "events",
      os: "os-browserify",
      path: "path-browserify",
      fs: "browserify-fs",
      http: "stream-http",
      https: "https-browserify",
      zlib: "browserify-zlib",
      vm: "vm-browserify",
      url: "url",
      assert: "assert",
    },
  },
  optimizeDeps: {
    include: [
      "buffer",
      "crypto-browserify",
      "stream-browserify",
      "util",
      "arweave",
      "events",
      "os-browserify",
      "path-browserify",
      "browserify-fs",
      "stream-http",
      "https-browserify",
      "browserify-zlib",
      "vm-browserify",
      "url",
      "assert",
    ],
    esbuildOptions: {
      define: {
        global: "globalThis",
      },
    },
  },
  build: {
    rollupOptions: {
      external: [],
    },
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
});
