import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    target: "es2022",
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          routing: ["@tanstack/react-router"],
          accessibility: ["react-aria-components"],
          data: ["dexie", "zod"],
          remote: ["@supabase/supabase-js"],
        },
      },
    },
  },
});
