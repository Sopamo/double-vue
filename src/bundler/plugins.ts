import { VitePlugin, createUnplugin } from "unplugin";
import { Bundler } from "../double/bundler";
import { getApiMap } from "./transform/apiMap";
import { updateTypescriptDefinition } from "./transform/typescriptUpdater";
import { resolve } from 'path'

// TODO: Make this configurable
const doubleBasePath = process.cwd()

const fileRegExp = /^@double\/.+\.php/
const phpFileRegExp = /\.php/

type UserOptions = {
    bundler: Bundler
};

export const unpluginPHP = createUnplugin((userOptions: UserOptions) => {
    return {
        name: 'double:php',
        resolveId(id) {
          if(fileRegExp.test(id)) {
            return resolve('./', id.replace('@double/', ''))
          }
        },
        transformInclude(id) {
            return phpFileRegExp.test(id)
        },
        transform(phpSrc, id) {
            const phpFilePath = id.replace(/\?.+/, '')
            const doublePath = phpFilePath.replace(doubleBasePath, '').replace('.php', '')
            let tsPath = doublePath
            updateTypescriptDefinition(phpSrc, tsPath)
            const apiMap = JSON.stringify(getApiMap(phpSrc))
            return {
                code: `
                  import { useDouble } from "double-vue"
                  import { defineDoublePiniaStore } from "double-vue/pinia"
                  export default function(config) {
                    return useDouble("${doublePath}", ${apiMap}, config)
                  }
                  export function createPiniaStore(options) {
                    return defineDoublePiniaStore("${doublePath}", ${apiMap}, options)
                  }
                  `,
                map: null,
            }
            return null
        }
    }
})

export const doubleVitePlugin = (): VitePlugin => {
    return unpluginPHP.vite({
        bundler: 'vite',
    })
}

export const doubleWebpackPlugin = (): VitePlugin => {
    return unpluginPHP.webpack({
        bundler: 'webpack',
    })
}
