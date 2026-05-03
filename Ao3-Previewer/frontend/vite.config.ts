import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    visualizer({
      open: true,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  server: {
    headers: {
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id: string) => {
          if (
            id.includes("node_modules/react") ||
            id.includes("node_modules/react-dom") ||
            id.includes("node_modules/react-router")
          ) {
            return "vendor-react";
          }
          if (
            id.includes("node_modules/@mui") ||
            id.includes("node_modules/@emotion") ||
            id.includes("node_modules/@popperjs")
          ) {
            return "vendor-mui";
          }
          if (
            id.includes("node_modules/@tiptap") ||
            id.includes("node_modules/prosemirror")
          ) {
            return "vendor-tiptap";
          }
          if (id.includes("node_modules/@sentry")) {
            return "vendor-sentry";
          }
        },
      },
    },
  },
});
