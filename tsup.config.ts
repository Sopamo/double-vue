import { defineConfig } from 'tsup'

export default defineConfig((options) => {
  return {
    entry: {
      'index': 'src/index.ts',
      'pinia/index': 'src/pinia.ts',
      'nuxt/index': 'src/nuxt.ts',
      'bundler/index': 'src/bundler.ts',
    },
    treeshake: true,
    splitting: true, // Important, otherwise the pinia part of double doesn't use the same double installation as the normal "useDouble"
    dts: true,
    format: ['esm', 'cjs'], // ESM is for our browser-targeted bundles, cjs for the bundler plugins.
    sourcemap: true,
    clean: !options.watch,
    minify: !options.watch,
  }
})