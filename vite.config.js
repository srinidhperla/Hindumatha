import path from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(projectRoot, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) {
            return;
          }

          if (
            id.includes("react") ||
            id.includes("scheduler") ||
            id.includes("react-dom")
          ) {
            return "react-vendor";
          }

          if (id.includes("@reduxjs") || id.includes("react-redux")) {
            return "state-vendor";
          }

          if (id.includes("axios")) {
            return "http-vendor";
          }

          if (id.includes("recharts")) {
            return "charts-vendor";
          }

          if (id.includes("socket.io")) {
            return "realtime-vendor";
          }

          if (id.includes("@dnd-kit")) {
            return "dnd-vendor";
          }

          return "vendor";
        },
      },
    },
  },
});
