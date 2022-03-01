import {
    defineNuxtModule,
    extendViteConfig,
} from '@nuxt/kit-edge'

import { doublePHPPlugin, doubleTSPlugin, doubleVuePlugin } from '../vite/plugins'

export const doubleNuxtModule = defineNuxtModule({
    setup() {
        extendViteConfig((config) => {
            if(!config.optimizeDeps) {
                config.optimizeDeps = {
                    exclude: []
                }
            }
            config.optimizeDeps.exclude.push('vue-demi')
            config.plugins.push(doubleVuePlugin())
            config.plugins.push(doubleTSPlugin())
            config.plugins.push(doublePHPPlugin())

            return config
        })
    },
})
