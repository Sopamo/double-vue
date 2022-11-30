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

    const config = metaData.getters.map(entry => {
      const getterConfigKey = 'get' + entry.name[0].toUpperCase() + entry.name.substring(1)
      return `${getterConfigKey}?: Record<string, string>`
    })

    const getters = metaData.getters.map(entry => {
        return `\n      ${entry.name}: ${entry.return}`
    })

    const actions = metaData.actions.map(entry => {
        return `\n      ${entry.name}: (options?: Record<string, any>) => Promise<unknown>`
    })

    const isLoading = metaData.actions.map(entry => {
        return `\n      ${entry.name}?: boolean`
    })


    const tsDefinition = `declare module "@double${id}.php" {
  export default (config: { ${config.join(", ")} }):{
    state: { ${getters.join("")}
    }
    actions: { ${actions.join("")}
    }
    isLoading: { ${isLoading.join("")}
    }
  } => {}
}
`
    return {
        tsDefinition,
        tsID,
    }
}
