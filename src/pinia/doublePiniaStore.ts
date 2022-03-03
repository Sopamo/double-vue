import { reactive, ref, toRefs } from "vue";
import type { _GettersTree, DefineStoreOptions, StateTree, StoreDefinition, Store, _StoreWithState } from "pinia";
import { doubleTypes } from "../../dev-types";
import { callAction, loadData } from "../double/api";
import { defineStore } from 'pinia'
import { ApiMapEntry } from "../vite/transform/apiMap";

export function defineDoublePiniaStore<
    Path extends keyof doubleTypes,
    Id extends string,
    State extends StateTree = {},
    Getters extends _GettersTree<State> = {},
    Actions = {}
>(path: Path, options: Omit<DefineStoreOptions<Id, State, Getters, Actions>, 'id'>): () => Promise<Store<
    Id,
    State & doubleTypes[Path]['state'] & { isLoading: doubleTypes[Path]['isLoading'] },
    Getters,
    Actions & { refresh: () => Promise<void> } & doubleTypes[Path]['actions']
>> {
    return () => {
        return new Promise((resolve, reject) => {
            injectDouble(path, options).then((storeOptions) => {
                // @ts-ignore
                const id: Id = path
                resolve(defineStore(id, storeOptions)())
            }).catch((e) => {
                throw e
            })
        })
        
    }
}

export async function injectDouble<
    Path extends keyof doubleTypes,
    Id extends string,
    State extends StateTree = {},
    Getters extends _GettersTree<State> = {},
    Actions = {}
>(path: Path, options: Omit<DefineStoreOptions<Id, State, Getters, Actions>, 'id'>):
    Promise<Omit<DefineStoreOptions<
        Id,
        State & doubleTypes[Path]['state'] & { isLoading: doubleTypes[Path]['isLoading'] },
        Getters,
        Actions & { refresh: () => Promise<void> } & doubleTypes[Path]['actions']
    >, 'id'>> {

    const originalState = options.state

    // Todo: This might not be the best idea, as options.state is a function which returns a unique state object and all of those
    // state objects will use the same `double` store
    const apiMap = (await import(/* @vite-ignore */path + '.php')).default
    // @ts-ignore
    options.state = () => {
        const double = useDouble(path, apiMap)
        // @ts-ignore
        if (options.actions.refresh === undefined) {
            // @ts-ignore
            options.actions.refresh = function () {
                double.refresh()
            }
        }

        Object.entries(double.actions).forEach(([k, v]) => {
            options.actions[k] = v
        })
        let state = {}
        if (originalState) {
            state = originalState()
        }
        Object.entries(double.state).forEach(([k, v]) => {
            state[k] = v
        })
        return state
    }
    if (options.actions === undefined) {
        // @ts-ignore
        options.actions = {}
    }

    // @ts-ignore
    return options
}

export function useDouble<Path extends keyof doubleTypes>(path: Path, apiMap: ApiMapEntry): { state: doubleTypes[Path]['state'], refresh: () => Promise<void>, actions: object } {
    let state = {
        isLoading: reactive<Record<string, boolean>>({}),
    }
    apiMap.getters.forEach(entry => {
        state[entry] = ref(null)
    })
    const refresh = () => {
        return loadData(path)
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
    apiMap.actions.forEach(method => {
        actions[method] = async function (data: Record<string, unknown>) {
            state.isLoading[method] = true
            let result = null
            try {
                result = await callAction(path, method, data)
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
