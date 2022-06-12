import fs from 'fs'

// As the project using this library will provide it's own type definition for the type "doubleTypes" we remove it from our type definition
let types = fs.readFileSync('./dist/index.d.ts').toString()
types = types.replace(/import { doubleTypes } .+/, '')
fs.writeFileSync('./dist/index.d.ts', types)

fs.writeFileSync('./dist/cjs/package.json', '{"type":"commonjs"}')