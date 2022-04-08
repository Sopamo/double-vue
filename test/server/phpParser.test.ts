import { assert, expect, test } from 'vitest'
import { getPHPMetaData } from '../../src/server/transform/phpParser'

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
                return: '5'
            }
        ]
    })
})
test('numberReturnType', () => {
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
                return: 'hi'
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
            '(1)[]'
        ],
        [
            `[1,2]`,
            '(1 | 2)[]'
        ],
        [
            `['a' => 1]`,
            `{
      a: 1
    }`
        ],
        [
            `['a' => 1, 'b' => 2,]`,
            `{
      a: 1
      b: 2
    }`
        ],
        [
            `['a' => ['b' => 2]]`,
            `{
      a: {
      b: 2s
    }
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
