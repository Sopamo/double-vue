import {VitePlugin} from "unplugin";

import { createUnplugin } from 'unplugin'
const fileRegex = /\.vue/
const tsFileRegex = /\.ts/
const phpFileRegex = /\.php/
import vuePlugin from "@vitejs/plugin-vue";
import {ConfigEnv, HmrContext, ModuleNode, UserConfig} from "vite";
import {CustomPluginOptions, ResolveIdResult} from "rollup";
import { removePHP } from "./transform/removePhp";
import { getApiMap, updateApiMap } from "./transform/apiMap";
import { updateTypescriptDefinition } from "./transform/typescriptUpdater";

const vuePluginInstance = vuePlugin({})

// TODO: Make this configurable
const doubleBasePath = process.cwd()

const fs = require('fs');

// TODO:
// Move this to the unplugin https://github.com/unjs/unplugin
// syntax, so it can be used in webpack as well

const isRelevantFile = (id) => {
    const phpFilePath = id.replace(fileRegex, '.php').replace(/\?.+/, '')
    return fileRegex.test(id) && fs.existsSync(phpFilePath)
}

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
            if (false && isRelevantFile(source)) {
                const res = vuePluginInstance.resolveId.apply(this, [source, importer])
                return res
            }
        },
        load(id, options) {
            if (false && isRelevantFile(id)) {
                return vuePluginInstance.load.apply(this, [id, options])
            }
        },
        async transform(src, id, options) {
            const phpFilePath = id.replace(fileRegex, '.php').replace(/\?.+/, '')
            if (isRelevantFile(id)) {
                // TODO: Properly replace this only in the beginning of the path:
                // The third replace removes ?macro=true
                // TODO: Find out what macro=true does and remove it properly
                const doublePath = id.replace(doubleBasePath, '').replace(fileRegex, '').replace(/\?.+/, '')
                if(fs.existsSync(phpFilePath)) {
                    // fs.writeFileSync('./types/veemix.d.ts', getTypescriptDefinition(src, doublePath))
                    const phpSrc = fs.readFileSync(phpFilePath).toString()
                    updateTypescriptDefinition(phpSrc, doublePath)
                    updateApiMap(phpSrc, doublePath)
                }
            }
        }
    }
}


export const unplugin = createUnplugin(() => {
  return {
    name: 'my-first-unplugin',
    // webpack's id filter is outside of loader logic,
    // an additional hook is needed for better perf on webpack
    transformInclude (id) {
      if(tsFileRegex.test(id)) {
        const phpFilePath = id.replace(tsFileRegex, '.php').replace(/\?.+/, '')
        if(fs.existsSync(phpFilePath)) {
            const phpSrc = fs.readFileSync(phpFilePath).toString()
            const doublePath = phpFilePath.replace(doubleBasePath, '').replace('.php', '')
            updateTypescriptDefinition(phpSrc, doublePath)
            updateApiMap(phpSrc, doublePath)
        }
      }
      return null
    },
    transform() {
        return null
    }
  }
})


export const doubleTSPlugin = (): VitePlugin => {
    return unplugin.vite()
}

export const unpluginPHP = createUnplugin(() => {
    return {
        name: 'double-php',
        buildStart() {
            console.log('!!START****************************')
        },
        transformInclude(id) {
            return phpFileRegex.test(id)
        },
        transform(phpSrc, id) {
            if(phpFileRegex.test(id)) {
                const phpFilePath = id.replace(/\?.+/, '')
                const doublePath = phpFilePath.replace(doubleBasePath, '').replace('.php', '')
                updateTypescriptDefinition(phpSrc, doublePath)
                return {
                    code: `export default ${JSON.stringify(getApiMap(phpSrc))}`
                }
            }
            return null
        }
    }
})

export const doublePHPPlugin = (): VitePlugin => {
    console.log('PHPPLUGIN')
    return unpluginPHP.vite()
}