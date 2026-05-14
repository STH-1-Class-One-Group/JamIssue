import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    include: ['test/**/*.test.ts', 'test/**/*.test.tsx'],
    clearMocks: true,
    restoreMocks: true,
    coverage: {
      provider: 'v8',
      all: true,
      reportsDirectory: './coverage/typescript',
      reporter: ['text', 'json-summary', 'html'],
      include: ['src/**/*.{ts,tsx}', 'scripts/**/*.ts', 'deploy/api-worker-shell/**/*.ts'],
      exclude: [
        '**/*.d.ts',
        '**/*.config.*',
        '**/node_modules/**',
        'coverage/**',
        'deploy/api-worker-shell/.wrangler/**',
        'docs/**',
        'infra/nginx/site/**',
        'test/**',
      ],
    },
  },
});
