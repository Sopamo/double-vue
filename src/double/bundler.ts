export type Bundler = 'webpack' | 'vite' | 'rollup'
let bundler: Bundler = 'vite'

export const setBundler = (newBundler: Bundler): void => {
    bundler = newBundler
}

export const getBundler = (): Bundler => {
    return bundler
}

export const getBundlerFilePrefix = (): string => {
    if(bundler === 'webpack') {
        return '/src/'
    }
    return ''
}