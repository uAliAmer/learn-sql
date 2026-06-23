import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// PGlite ships a WASM + data bundle. Exclude from dep pre-bundling so Vite
// serves the package's own ESM + asset URLs correctly.
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ["@electric-sql/pglite"],
  },
  worker: {
    format: "es",
  },
});
