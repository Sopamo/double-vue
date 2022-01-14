import { getPHPMetaData } from "./phpParser"

export const getTypescriptDefinition = (src: string, id: string) => {
    const metaData = getPHPMetaData(src)
    const tsID = id
        .toLowerCase()
        .replaceAll(/[^a-zA-Z0-9\/]/g, 'x')
        .split('/')
        .filter((part: string) => !!part)
        .map((part: string) => {
            return `${part[0].toLocaleUpperCase()}${part.slice(1)}`
        })
        .join('')

    const getters = metaData.getters.map(entry => {
        return `  ${entry.name}: ${entry.return}`
    })

    const actions = metaData.actions.map(entry => {
        return `
${entry.name}: {
    exception: string|null
    headers: Record<string, string>
    original: Record<string, any>
}
`
    })

    const isLoading = metaData.actions.map(entry => {
        return `  ${entry.name}?: boolean`
    })


    const tsDefinition = `
type ${tsID}PostTypes = {
  ${actions.join("\n  ")}
}
type ${tsID}LoadingTypes = {
  ${isLoading.join("\n  ")}
}
type ${tsID}MainType = {
  ${getters.join("\n  ")}
  isLoading: ${tsID}LoadingTypes
  post: <MethodName extends keyof ${tsID}PostTypes>(methodName: MethodName, data: Record<string, any>) => Promise<${tsID}PostTypes[MethodName]>
}
`
    return {
        tsDefinition,
        tsID,
    }
}
