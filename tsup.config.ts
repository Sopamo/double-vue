import { defineConfig } from 'tsup'

export default defineConfig((options) => {
  return {
    entry: ['src/index.ts', 'src/nuxt.ts', 'src/bundler.ts'],
    treeshake: true,
    format: ['esm', 'cjs'], // ESM is for our browser-targeted bundles, cjs for the bundler plugins.
    sourcemap: true,
    clean: !options.watch,
    minify: !options.watch,
  }
})