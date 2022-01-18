import {
    defineNuxtModule,
    extendViteConfig,
} from '@nuxt/kit-edge'
import { doubleTSPlugin, doubleVuePlugin } from '../vite/plugins'

export const doubleNuxtModule = defineNuxtModule({
    async setup() {
        extendViteConfig((config) => {
            if(!config.optimizeDeps) {
                config.optimizeDeps = {
                    exclude: []
                }
            }
            config.optimizeDeps.exclude.push('vue-demi')
            config.plugins.push(doubleVuePlugin())
            config.plugins.push(doubleTSPlugin())
            return config
        })
    },
})
