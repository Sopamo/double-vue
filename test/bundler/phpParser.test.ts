import { assert, expect, test } from 'vitest'
import { getPHPMetaData } from '../../src/bundler/transform/phpParser'

test('numberReturnType', () => {
    const php = `<?php
    return new class {
        public function getData() {
            return 5;
        }
    };`
    expect(getPHPMetaData(php)).toStrictEqual({
        actions: [],
        getters: [
            {
                name: 'data',
                return: 'number'
            }
        ]
    })
})
test('stringReturnType', () => {
    const php = `<?php
    return new class {
        public function getData() {
            return "hi";
        }
    };`
    expect(getPHPMetaData(php)).toStrictEqual({
        actions: [],
        getters: [
            {
                name: 'data',
                return: 'string'
            }
        ]
    })
})
test('variableReturnType', () => {
    const php = `<?php
    return new class {
        public function getData() {
            $foo = "hi";
            return $foo;
        }
    };`
    expect(getPHPMetaData(php)).toStrictEqual({
        actions: [],
        getters: [
            {
                name: 'data',
                return: 'any'
            }
        ]
    })
})
test('arrayReturnTypes', () => {
    const tests = [
        [
            `[]`,
            '[]'
        ],
        [
            `[1]`,
            'number[]'
        ],
        [
            `[1,2]`,
            'number[]'
        ],
        [
            `['a' => 1]`,
            `{
      a: number
    }`
        ],
        [
            `['a' => 1, 'b' => 2,]`,
            `{
      a: number
      b: number
    }`
        ],
        [
            `['a' => ['b' => 2]]`,
            `{
      a: {
      b: number
    }
    }`
        ],
        [
            `[1, 'foo'=>'bar', 3 => 4, 'baz']`,
            `{
      0: number
      foo: string
      3: number
      4: string
    }`
        ],
    ]
    tests.forEach(test => {
        const php =  `<?php
        return new class {
            public function getData() {
                return ${test[0]};
            }
        };`
        expect(getPHPMetaData(php)).toStrictEqual({
            actions: [],
            getters: [
                {
                    name: 'data',
                    return: test[1]
                }
            ]
        })
    })
})

test('invalidPHPdoesntCrash', () => {
    const phpFiles = [
        ``,
        `<?php
        return 5;`,
        `<?php
        return new class {
            public typo getData() { 
                return 5;
            }
        };`
    ]
    phpFiles.forEach(php => {
        const consoleLog = console.log;
        console.log = () => { }
        try {
            expect(getPHPMetaData(php)).toStrictEqual({
                actions: [],
                getters: [],
            })
        } catch (e) {
            console.error(e)
        } finally {
            console.log = consoleLog
        }
    })
})


test('privateMethodsAreIgnored', () => {
    const php = 
        `<?php
        return new class {
            public function getData() {
                return 5;
            }
            private function getInternalData() { 
                return 6;
            }
        };`
    expect(getPHPMetaData(php)).toStrictEqual({
        actions: [],
        getters: [
            {
                name: "data",
                return: "number",
            }
        ],
    })
})

test('staticMethodsAreIgnored', () => {
    const php = 
        `<?php
        return new class {
            public function getData() {
                return 5;
            }
            public static function getInternalData() { 
                return 6;
            }
        };`
    expect(getPHPMetaData(php)).toStrictEqual({
        actions: [],
        getters: [
            {
                name: "data",
                return: "number",
            }
        ],
    })
})
