import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// GitHub Pages serves the site under /<repo>/; the Pages workflow sets PAGES_BASE (see docs/publishing.md).
export default defineConfig({
  base: (globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env.PAGES_BASE ?? '/',
  plugins: [react()],
  test: {
    include: ['tests/**/*.test.{ts,tsx}'],
    environment: 'node',
  },
});
