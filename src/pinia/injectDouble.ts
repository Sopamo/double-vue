import {reactive, ref, toRefs} from "vue";
import {apiMap} from "../double/apiMap";
import type {_GettersTree, DefineStoreOptions, StateTree} from "pinia";
import { doubleTypes } from "../../dev-types";
import { deepUnref } from "../double/deepUnref";

export function injectDouble<
        Path extends keyof doubleTypes,
        Id extends string,
        State extends StateTree = {},
        Getters extends _GettersTree<State> = {},
        Actions = {}
    >(path: Path, options: Omit<DefineStoreOptions<Id, State, Getters, Actions>, 'id'>): 
        Omit<DefineStoreOptions<
            Id,
            State & doubleTypes[Path]['state'] & { isLoading: doubleTypes[Path]['isLoading'] },
            Getters,
            Actions & { refresh: () => Promise<void>} & doubleTypes[Path]['actions']
        >, 'id'> {
    const originalState = options.state

    // Todo: This might not be the best idea, as options.state is a function which returns a unique state object and all of those
    // state objects will use the same `double` store
    const double = useDouble(path)

    // @ts-ignore
    options.state = () => {
        let state = {}
        if(originalState) {
            state = originalState()
        }
        Object.entries(double.state).forEach(([k, v]) => {
            state[k] = v
        })
        return state
    }
    if(options.actions === undefined) {
        // @ts-ignore
        options.actions = {}
    }

    // @ts-ignore
    if(options.actions.refresh === undefined) {
        // @ts-ignore
        options.actions.refresh = function() {
            double.refresh()
        }
    }

    Object.entries(double.actions).forEach(([k, v]) => {
        options.actions[k] = v
    })

    // @ts-ignore
    return options
}

export function useDouble<Path extends keyof doubleTypes>(path: Path): {state: doubleTypes[Path], refresh: () => Promise<void>, actions: object} {
    const loadInitialVeemixData = async () => {
        const res = await fetch('http://localhost/double/data?path=' + encodeURIComponent(path), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify([]),
        })
        return await res.json()
    }
    let state = {
        isLoading: reactive<Record<string, boolean>>({}),
    }
    apiMap[path].getters.forEach(entry => {
        state[entry] = ref(null)
    })
    const refresh = () => {
        return loadInitialVeemixData()
            .then(server => {
                Object.entries(server).forEach(([key, value]) => {
                    state[key].value = value
                })
            })
            .catch((e) => {
                console.log('ERROR:')
                console.log(e)
            })
    }
    refresh()

    let actions = {}
    apiMap[path].actions.forEach(method => {
        actions[method] = async function(data: Record<string, unknown>) {
            state.isLoading[method] = true
            let result = null
            try {
                const response = await fetch('http://localhost/double/action?path=' + encodeURIComponent(path) + '&method=' + encodeURIComponent(method), {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(deepUnref(data))
                })
                result = await response.json()
                state.isLoading[method] = false
            } catch (e) {
                state.isLoading[method] = false
                throw e
            }
            return result
        }
    })

    return {
        actions,
        state,
        refresh,
    }
}
