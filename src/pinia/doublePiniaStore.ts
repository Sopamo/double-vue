// @ts-ignore
import type { _GettersTree, DefineStoreOptions, StateTree, Store, _StoreWithState } from "pinia";
// @ts-ignore
import { defineStore } from 'pinia';
import { doubleTypes } from "../../dev-types";
import { getApiMap, useDouble } from "../double/useDouble";

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
    const double = await useDouble(path)
    const apiMap = await getApiMap(path)
    
    // TODO: Properly fix @ts-ignore stuff

    // @ts-ignore
    options.state = () => {
        // @ts-ignore
        if(options.actions.refresh !== undefined) {
            console.warn('Overriding the refresh action is currently not supported. You can create a customRefresh action which calls double\'s refresh action.')
        }
        // @ts-ignore
        options.actions.refresh = function () {
            double.refresh()
        }

        apiMap.actions.forEach((action) => {
            if(options.actions[action] !== undefined) {
                console.warn('You can not specify the ' + action + ' action if your PHP file already defines it. You can create your own custom action which calls this action.')
            }
            options.actions[action] = double[action]
        })
        let state = {}
        if (originalState) {
            state = originalState()
        }
        // In this context "getter" means a double getter (e.g. getBlogEntries) and not a pinia getter.
        apiMap.getters.forEach((getter) => {
            state[getter] = double[getter]
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
