import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import node from '@astrojs/node';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: node({
    mode: 'middleware'
  }),
  
  integrations: [
    react(),
    tailwind({
      // Use the existing Tailwind config
      configFile: './tailwind.config.ts',
      // Apply Tailwind to Astro pages
      applyBaseStyles: false,
    }),
  ],
  
  // Configure how static files are served
  publicDir: 'public',
  
  // Build configuration
  build: {
    // Output directory for Astro build
    outDir: 'dist-astro',
    assets: '_astro',
  },
  
  // Vite configuration for compatibility with existing setup
  vite: {
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './client/src'),
        '@shared': path.resolve(__dirname, './shared'),
        '@assets': path.resolve(__dirname, './attached_assets'),
      },
    },
    ssr: {
      noExternal: ['@radix-ui/*'],
    },
  },
});
