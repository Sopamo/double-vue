import fs from 'fs'

// As the project using this library will provide it's own type definition for the type "doubleTypes" we remove it from our type definition
let types = fs.readFileSync('./dist/index.d.ts').toString()
types = types.replace(/import { . as doubleTypes }.+/, '')
fs.writeFileSync('./dist/index.d.ts', types)

let piniaTypes = fs.readFileSync('./dist/pinia/index.d.ts').toString()
piniaTypes = piniaTypes.replace(/import { . as doubleTypes }.+/, '')
fs.writeFileSync('./dist/pinia/index.d.ts', piniaTypes)


// Copy pinia output files to the root, so it can be imported with 'double-vue/pinia' instead of 'double-vue/dist/pinia'
fs.copyFileSync('./dist/pinia/index.js', './pinia.js')
fs.copyFileSync('./dist/pinia/index.d.ts', './pinia.d.ts')

let piniaCode = fs.readFileSync('./pinia.js').toString()
piniaCode = piniaCode.replace(/'\.\.\/chunk-/g, '\'./dist/chunk-')
fs.writeFileSync('pinia.js', piniaCode)