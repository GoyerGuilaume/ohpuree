import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Chemins relatifs : indispensable pour que le build fonctionne dans la WebView Capacitor.
  base: './',
  build: {
    target: 'es2022',
  },
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
