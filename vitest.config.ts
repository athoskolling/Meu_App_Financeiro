import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.{ts,tsx}', 'domain/**/*.test.ts'],
    environment: 'node',
  },
});
