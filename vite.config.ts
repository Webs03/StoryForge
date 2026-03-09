import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    allowedHosts: true,
    proxy: {
      "/api/reddit": {
        target: "https://www.reddit.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/reddit/, ""),
      },
      "/api/openlibrary": {
        target: "https://openlibrary.org",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/openlibrary/, ""),
      },
      "/api/googlebooks": {
        target: "https://www.googleapis.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/googlebooks/, ""),
      },
      "/api/gutendex": {
        target: "https://gutendex.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/gutendex/, ""),
      },
      "/api/gutenberg": {
        target: "https://www.gutenberg.org",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/gutenberg/, ""),
      },
    }
  },
  plugins: [react()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
