import path from 'path'
import { defineConfig } from 'vitest/config'

// Mirrors jsconfig.json (`baseUrl: "."`, imports written as `src/...`).
export default defineConfig({
  resolve: {
    alias: {
      src: path.resolve(__dirname, 'src')
    }
  },
  // This codebase puts JSX in plain .js files too (Next's compiler allows it), so parse all of
  // src as JSX. The automatic runtime means files need no `import React`.
  esbuild: { jsx: 'automatic', loader: 'jsx', include: /src\/.*\.jsx?$/, exclude: [] },
  test: {
    environment: 'node',
    include: ['src/**/*.test.{js,jsx}']
  }
})
