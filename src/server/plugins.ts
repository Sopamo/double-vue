import { VitePlugin, createUnplugin } from "unplugin";
import { Bundler } from "../double/bundler";
import { getApiMap } from "./transform/apiMap";
import { updateTypescriptDefinition } from "./transform/typescriptUpdater";

// TODO: Make this configurable
const doubleBasePath = process.cwd()

const phpFileRegex = /\.php/

type UserOptions = {
    bundler: Bundler
};

export const unpluginPHP = createUnplugin((userOptions: UserOptions) => {
    return {
        name: 'double-php',
        transformInclude(id) {
            return phpFileRegex.test(id)
        },
        transform(phpSrc, id) {
            if(phpFileRegex.test(id)) {
                const phpFilePath = id.replace(/\?.+/, '')
                const doublePath = phpFilePath.replace(doubleBasePath, '').replace('.php', '')
                let tsPath = doublePath
                if(userOptions.bundler === 'webpack') {
                    tsPath = tsPath.replace(/^\/src\//, '')
                }
                updateTypescriptDefinition(phpSrc, tsPath)
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
    return unpluginPHP.vite({
        bundler: 'vite',
    })
}

export const doubleWebpackPlugin = (): VitePlugin => {
    return unpluginPHP.webpack({
        bundler: 'webpack',
    })
}

export const doubleRollupPlugin = (): VitePlugin => {
    return unpluginPHP.rollup({
        bundler: 'rollup',
    })
}