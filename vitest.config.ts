import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/lib/tournament-engine/**/*.test.ts', 'src/lib/tournament-engine/**/__tests__/*.ts'],
    globals: true,
    css: false,
    deps: {
      inline: []
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});
