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
        return `\n    ${entry.name}: ${entry.return}`
    })

    const actions = metaData.actions.map(entry => {
        return `\n    ${entry.name}: (options?: Record<string, any>) => Promise<unknown>`
    })

    const isLoading = metaData.actions.map(entry => {
        return `\n    ${entry.name}?: boolean`
    })


    const tsDefinition = `type ${tsID}MainType = {
  state: { ${getters.join("")}
  }
  actions: { ${actions.join("")}
  }
  isLoading: { ${isLoading.join("")}
  }
}
`
    return {
        tsDefinition,
        tsID,
    }
}
