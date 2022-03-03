import { VitePlugin, createUnplugin } from "unplugin";
import { getApiMap } from "./transform/apiMap";
import { updateTypescriptDefinition } from "./transform/typescriptUpdater";

// TODO: Make this configurable
const doubleBasePath = process.cwd()

const phpFileRegex = /\.php/

export const unpluginPHP = createUnplugin(() => {
    return {
        name: 'double-php',
        transformInclude(id) {
            return phpFileRegex.test(id)
        },
        transform(phpSrc, id) {
            if(phpFileRegex.test(id)) {
                const phpFilePath = id.replace(/\?.+/, '')
                const doublePath = phpFilePath.replace(doubleBasePath, '').replace('.php', '')
                updateTypescriptDefinition(phpSrc, doublePath)
                return {
                    code: `export default ${JSON.stringify(getApiMap(phpSrc))}`,
                    map: null,
                }
            }
            return null
        }
    }
})

export const doubleVitePlugin = (): VitePlugin => {
    return unpluginPHP.vite()
}

export const doubleWebpackPlugin = (): VitePlugin => {
    return unpluginPHP.webpack()
}

export const doubleRollupPlugin = (): VitePlugin => {
    return unpluginPHP.rollup()
}