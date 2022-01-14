export const removePHP = (src: string) => {
    // TODO: Do this properly
    return src.replace(/\<\?php(.|\n)*\?\>/, '')
}