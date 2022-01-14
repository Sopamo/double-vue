import {
    defineNuxtModule,
    extendViteConfig,
} from '@nuxt/kit'
import { doubleTSPlugin, doubleVuePlugin } from '../vite/plugins'

export const double = defineNuxtModule({
    async setup() {
        extendViteConfig((config) => {
            config.plugins.push(doubleVuePlugin())
            config.plugins.push(doubleTSPlugin())
            return config
        })
    },
})
