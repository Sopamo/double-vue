import { Array, Class, Declaration, Engine, Entry, Expression, Method, New, Return } from 'php-parser'
const fs = require('fs')
type MethodDefinition = {
    name: string
    return: string
}

type PHPMetaData = {
    getters: MethodDefinition[]
    actions: MethodDefinition[]
}

function treeToReturnTS(tree: Expression): string {
    if (!tree) {
        return 'any'
    }

    if (tree.kind === 'array') {
        const arrayLike = tree as Array
        // @ts-ignore this is a wrong type coming from php-parser
        const children = arrayLike.items.map(item => treeToReturnTS(item))
        if(!arrayLike.items[0]) {
            return `[]`
        }
        // TODO: This does not work for all array definitions, for example for arrays where some children have explicit keys and others don't
        // TODO: Take care of proper indentation

        // @ts-ignore this is a wrong type coming from php-parser
        const allChildrenHaveKeys = !arrayLike.items.find(item => [undefined, null].includes(item?.key))
        if (!arrayLike.items[0].hasOwnProperty('key') || !allChildrenHaveKeys) {
            return `(${children.join(' | ')})[]`
        } else {
            // @ts-ignore this is a wrong type coming from php-parser
            const childData = arrayLike.items.map((item, idx) => {
                return item.key.value + ': ' + children[idx]
            })
            return `{\n      ${childData.join('\n      ')}\n    }`
            
        }
    }
    if(tree.kind === 'entry') {
        const entryLike = tree as Entry
        if (!entryLike.key) {
            return treeToReturnTS(entryLike.value)
        }
        if (entryLike.key) {
            if (entryLike.key.kind === 'string') {
                // @ts-ignore Couldn't find any types detailed enough to correctly set the type here
                const entryKey = entryLike.key.value
                // @ts-ignore
                const entryValue = entryLike.value.value
                if (entryLike.value.kind === 'string') {
                    return `${entryKey}: '${entryValue}'`
                } else if (entryLike.value.kind === 'number') {
                    return `${entryKey}: ${entryValue}`
                } else {
                    return `${entryKey}: any`
                }
            }
        }
    }
    
    return 'any'
}

export const getPHPMetaData = (src: string): PHPMetaData => {
    const parser = new Engine({
        // some options :
        parser: {
            extractDoc: true,
            php7: true
        },
        ast: {
            withPositions: false
        }
    });
    
    const responseData = {
        getters: [],
        actions: [],
    }

    try {
        const returnValue = parser.parseCode(src, '').children.find(child => child.kind === 'return') as Return
        
        
        // Sadly the php-parser typescript definition can't automatically detect which node type
        // an entry has
        // @ts-ignore
        if(!returnValue?.expr?.what?.body) {
            return responseData
        }
        const returnBody = ((returnValue.expr as New).what as Class).body

        returnBody.forEach((bodyEntry: Declaration) => {
            if (bodyEntry.kind === 'method') {
                const method = bodyEntry as Method

                let methodName = method.name
                if(typeof methodName !== 'string') {
                    methodName = methodName.name
                }

                let returnType = 'any'
                const returnValue = method.body?.children.find(child => child.kind === 'return') as undefined | Return
                if (returnValue) {
                    returnType = treeToReturnTS(returnValue.expr)
                }
                
                // We handle methods starting with a "get" followed by an uppercase character differently
                // Those are methods we call to get our data object.
                // All other methods will be available as actions to be called on demand
                if (methodName.startsWith('get')) {
                    // fs.writeFileSync('./phpanalyze-get.js', JSON.stringify(method))

                    const firstKeyCharacter = methodName.substring(3, 4)
                    if (firstKeyCharacter === firstKeyCharacter.toLocaleUpperCase()) {
                        // This is a getXyz method
                        const nameWithoutPrefix = firstKeyCharacter.toLocaleLowerCase() + methodName.substring(4)
                        responseData.getters.push({
                            name: nameWithoutPrefix,
                            return: returnType
                        })
                    }
                } else {
                    fs.writeFileSync('./phpanalyze-store.js', JSON.stringify(method))
                    responseData.actions.push({
                        name: methodName,
                        return: returnType
                    })
                }
            }
        })
    } catch(e) {
        console.log('Could not parse PHP file:')
        console.log(e)
        return responseData
    }

    return responseData
}