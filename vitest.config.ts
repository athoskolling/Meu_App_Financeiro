import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts', 'domain/**/*.test.ts'],
    environment: 'node',
  },
});
