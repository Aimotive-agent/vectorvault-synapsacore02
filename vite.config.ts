import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { nodePolyfills } from 'vite-plugin-node-polyfills';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
    nodePolyfills({
      // Polyfills for Node.js core modules
      include: ['module', 'path', 'fs', 'os', 'crypto', 'buffer', 'stream', 'util'],
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      // Do NOT mark react/jsx-runtime or node builtins as external here:
      // externals end up as bare import specifiers in the browser bundle and
      // kill the app at load ("Failed to resolve module specifier").
      // vite-plugin-node-polyfills shims any node builtin a dependency needs.
    },
  },
  define: {
    // Handle Node.js global variables
    'process.env': {},
    'global': {}
  },
}));
