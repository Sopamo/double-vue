export const escapeRegex = (value: string) => {
    return value.replace( /[\-\[\]{}()*+?.,\\\^$|#\s]/g, "\\$&" )
}