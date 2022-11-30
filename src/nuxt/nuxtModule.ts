import {
    defineNuxtModule,
    extendViteConfig,
} from '@nuxt/kit'
import type { NuxtModule } from '@nuxt/schema'


import { doubleVitePlugin } from '../bundler/plugins'

export const doubleNuxtModule: NuxtModule = defineNuxtModule({
    meta: {
      // Usually  npm package name of your module
      name: 'double-vue',
      // Compatibility constraints
      compatibility: {
        // Semver version of supported nuxt versions
        nuxt: '^3.0.0'
      }
    },
    async setup() {
        extendViteConfig((config) => {
            config.plugins.push(doubleVitePlugin())

            return config
        })
    },
})
