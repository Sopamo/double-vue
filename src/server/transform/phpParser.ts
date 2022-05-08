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
        // TODO: This does not work properly for all array definitions.
        // For example for arrays where some children have explicit keys and others don't
        // TODO: Take care of proper indentation

        // @ts-ignore this is a wrong type coming from php-parser
        const noItemHasKey = arrayLike.items.every(item => !item.hasOwnProperty('key') || [undefined, null].includes(item?.key))
        
        if (noItemHasKey) {
            return `(${children.join(' | ')})[]`
        } else {
            let keylessIndex = 0
            // @ts-ignore this is a wrong type coming from php-parser
            const childData = arrayLike.items.map((item, idx) => {
                // For items without a key, the key is a number starting from 0
                // and being 1 larger than the last numeric key
                // https://www.php.net/manual/en/language.types.array.php
                let key = item.key?.value
                if([undefined, null].includes(key)) {
                    key = keylessIndex++
                } else {
                    if(item.key.kind === 'number') {
                        keylessIndex = parseInt(item.key.value) + 1
                    }
                }
                return key + ': ' + children[idx]
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
            if (['string', 'number'].includes(entryLike.key.kind)) {
                return treeToReturnTS(entryLike.value)
            }
        }
    }

    if(['number', 'string'].includes(tree.kind)) {
        // @ts-ignore value actually does exist
        return tree.value
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
        // fs.writeFileSync('debug.json', JSON.stringify(returnBody))
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