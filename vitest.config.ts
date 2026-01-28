import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['src/domain/**/*.ts', 'src/usecases/**/*.ts'],
      exclude: ['**/*.spec.ts', '**/index.ts'],
      thresholds: {
        statements: 70,
        branches: 70,
        functions: 70,
        lines: 70,
      },
    },
  },
  resolve: {
    alias: {
      '@domain': path.resolve(__dirname, './src/domain'),
      '@usecases': path.resolve(__dirname, './src/usecases'),
      '@adapters': path.resolve(__dirname, './src/adapters'),
      '@infrastructure': path.resolve(__dirname, './src/infrastructure'),
    },
  },
})
