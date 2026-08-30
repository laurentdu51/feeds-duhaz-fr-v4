import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import legacy from "@vitejs/plugin-legacy";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    allowedHosts: ['rpidob','feeds.duhaz.fr'],
    hmr: {
      host: 'feeds.duhaz.fr',
      protocol: 'wss',
      clientPort: 443,
    },
  },
  build: {
    target: ['es2015', 'safari12'],
    rollupOptions: {
      output: {
        generatedCode: { arrowFunctions: false, constBindings: false, objectShorthand: false },
      },
    },
  },
  plugins: [
    react(),
    legacy({
      targets: ['defaults', 'safari >= 12', 'ios_saf >= 12', 'not IE 11'],
      modernPolyfills: true,
    }),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
