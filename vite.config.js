import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Dev:  `npm run dev`   → Vite serves on 5173 and proxies /api (REST) to the
//                         backend on :8000.
// Prod: `npm run build` → static files land in build/, matching the org's
//                         deploy pipeline, which rsyncs a folder named
//                         exactly `build/` to the web server's document root.
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "build",
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
});
