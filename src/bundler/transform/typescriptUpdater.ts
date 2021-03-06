import { escapeRegex } from "../../double/helpers"
import { getTypescriptDefinition } from "./typescriptGenerator"
const path = require('path')
const fs = require('fs')

export const updateTypescriptDefinition = (src: string, doublePath: string) => {
    const typesPath = './src/double.d.ts'

    const {tsDefinition, tsID} = getTypescriptDefinition(src, doublePath)
    if(!fs.existsSync(path.dirname(typesPath))) {
        fs.mkdirSync(path.dirname(typesPath))
    }
    let existingTypes = ''
    if(fs.existsSync(typesPath)) {
        existingTypes = fs.readFileSync(typesPath).toString()
    }
    const beginIndicator = '// BEGIN: ' + escapeRegex(doublePath) + '\n'
    const endIndicator = '// END: ' + escapeRegex(doublePath) + '\n\n'
    let newTypes = existingTypes.replace(new RegExp(beginIndicator + '[\\s\\S]*' + endIndicator), '')
    newTypes += beginIndicator + tsDefinition + endIndicator

    // Update the global `double` type
    const globalBeginIndicator = '\n\ntype doubleTypes = {\n'
    const globalEndIndicator = '}\n'
    const globalTypeRegex = new RegExp(globalBeginIndicator + '([^}]*)' + globalEndIndicator)
    const existingGlobalTypeBlock = newTypes.match(globalTypeRegex)
    newTypes = newTypes.replace(globalTypeRegex, '')
    let globalTypes = ''
    if(existingGlobalTypeBlock) {
        globalTypes = existingGlobalTypeBlock[1]
        globalTypes = globalTypes.replace(new RegExp('\[ \t]*\'' + doublePath + '\':.*\\n'), '')
    }

    globalTypes += `  '${doublePath}': ${tsID}MainType\n`

    newTypes += globalBeginIndicator + globalTypes + globalEndIndicator

    fs.writeFileSync(typesPath, newTypes)
}