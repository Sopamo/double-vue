import {VitePlugin} from "unplugin";

const fileRegex = /\.v\.php/
const tsFileRegex = /\.ts\.php/
import vuePlugin from "@vitejs/plugin-vue";
import {ConfigEnv, HmrContext, ModuleNode, UserConfig} from "vite";
import {CustomPluginOptions, ResolveIdResult} from "rollup";
import { removePHP } from "./transform/removePhp";
import { updateApiMap } from "./transform/apiMap";
import { updateTypescriptDefinition } from "./transform/typescriptUpdater";

const vuePluginInstance = vuePlugin({})

// TODO: Make this configurable
const doubleBasePath = process.cwd()

const fs = require('fs');
const engine = require('php-parser');

// TODO:
// Move this to the unplugin https://github.com/unjs/unplugin
// syntax, so it can be used in webpack as well

export const doubleVuePlugin = (): VitePlugin => {
    return {
        enforce: 'pre',
        name: 'transform-v-php',
        handleHotUpdate(ctx: HmrContext): Array<ModuleNode> | void | Promise<Array<ModuleNode> | void> {
            return vuePluginInstance.handleHotUpdate.apply(this, [ctx])
        },
        config(config: UserConfig, env: ConfigEnv) {
            return vuePluginInstance.config.apply(this, [config, env])
        },
        configResolved(config) {
            return vuePluginInstance.configResolved.apply(this, [config])
        },
        configureServer: vuePluginInstance.configureServer,
        resolveId(source: string, importer: string | undefined, options: { custom?: CustomPluginOptions; ssr?: boolean }): Promise<ResolveIdResult> | ResolveIdResult {
            if (fileRegex.test(source)) {
                const res = vuePluginInstance.resolveId.apply(this, [source, importer])
                return res
            }
        },
        load(id, options) {
            if (fileRegex.test(id)) {
                return vuePluginInstance.load.apply(this, [id.replace(fileRegex, '.vue'), options])
            }
        },
        async transform(src, id, options) {
            if (fileRegex.test(id)) {
                // TODO: Properly replace this only in the beginning of the path:
                const doublePath = id.replace(doubleBasePath, '').replace(fileRegex, '')

                // fs.writeFileSync('./types/veemix.d.ts', getTypescriptDefinition(src, doublePath))
                updateTypescriptDefinition(src, doublePath)
                updateApiMap(src, doublePath)

                src = removePHP(src)
                const res = await vuePluginInstance.transform.apply(this, [src, id.replace(fileRegex, '.vue'), options])

                res.code = res.code.replace('const _sfc_main = defineComponent({', `const _sfc_main = defineComponent({veemixPath: 'veemix${doublePath}',\n`)
                return res
            }
        }
    }
}


export const doubleTSPlugin = (): VitePlugin => {
    return {
        enforce: 'pre',
        name: 'transform-ts-php',
        async transform(src, id, options) {
            if (tsFileRegex.test(id)) {
                const doublePath = id.replace(doubleBasePath, '').replace(tsFileRegex, '')

                updateTypescriptDefinition(src, doublePath)
                updateApiMap(src, doublePath)

                src = removePHP(src)

                // TODO: Remove script blocks properly
                src = src.replace('<script lang="ts">', '')
                src = src.replace('</script>', '')
                return {
                    code: src
                }
            }
        }
    }
}