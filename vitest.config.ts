import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.{ts,tsx}', 'src/domain/**/*.test.ts'],
    environment: 'node',
  },
});
