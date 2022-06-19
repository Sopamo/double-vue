import {
    defineNuxtModule,
    extendViteConfig,
} from '@nuxt/kit-edge'

import { doubleVitePlugin } from '../bundler/plugins'

export const doubleNuxtModule = defineNuxtModule({
    setup() {
        extendViteConfig((config) => {
            if(!config.optimizeDeps) {
                config.optimizeDeps = {
                    exclude: []
                }
            }
            config.plugins.push(doubleVitePlugin())

            return config
        })
    },
})
