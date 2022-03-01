import { getPHPMetaData } from "./phpParser"
const fs = require('fs')

export type ApiMapEntry = { actions: string[], getters: string[] }

export function getApiMap(src: string): ApiMapEntry {
    const metaData = getPHPMetaData(src)
    return {
        getters: metaData.getters.map(entry => entry.name),
        actions: metaData.actions.map(entry => entry.name),
    }
}

export const updateApiMap = (src: string, doublePath: string) => {
    const mapPath = './doubleApiMap.ts'
    let map = {}
    const mapPrefix = 'export const apiMap = '
    if(fs.existsSync(mapPath)) {
        try {
            map = JSON.parse(fs.readFileSync(mapPath).toString().substr(mapPrefix.length - 1))
        } catch(e) {
            console.log(e)
        }
    }
    const oldData = map[doublePath]
    map[doublePath] = getApiMap(src)

    // Only write the new file if something changed
    if(JSON.stringify(oldData) != JSON.stringify(map[doublePath])) {
        fs.writeFileSync(mapPath, mapPrefix + JSON.stringify(map))
    }
}