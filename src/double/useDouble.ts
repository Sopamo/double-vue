import {reactive, ref, watch, isRef } from "vue-demi"

import { callAction, loadData } from "./api";
import { doubleTypes } from "../../dev-types";

export async function useDouble<Path extends keyof doubleTypes>(path: Path, config: Record<string, any> = {}):
    Promise<
        doubleTypes[Path]['state'] &
        doubleTypes[Path]['actions'] &
        { isLoading: doubleTypes[Path]['isLoading'] }
    > {
    // To be able to watch the config it has to be a ref
    if(!isRef(config)) {
        config = ref(config)
    }

    const loadInitialDoubleData = async () => {
        return await loadData(path, config)
    }
    let data = {} as any

    const apiMap = (await import(/* @vite-ignore */path + '.php')).default
    if(!apiMap) {
        console.error(`Could not fetch the ${path}.php file. Try restarting your dev server.`)
    }
    apiMap.getters.forEach(entry => {
        data[entry] = ref(null)
    })
    const setData = (newData) => {
        Object.entries(newData).forEach(([key, value]) => {
            if(data[key] === undefined) {
                data[key] = ref(value)
            } else {
                data[key].value = value
            }
        })
    }
    try {
        setData(await loadInitialDoubleData())
    } catch(e) {
        console.log(e)
    }

    const isLoading = reactive<Record<string, boolean>>({})

    // TODO: Only re-request the entrypoints where their config has actually changed
    watch(config, async () => {
        setData(await loadInitialDoubleData())
    }, {
        deep: true,
    })

    const actions = {}
    apiMap.actions.forEach(method => {
        actions[method] = async function(data: Record<string, unknown>) {
            isLoading[method] = true
            let result = null
            try {
                result = await callAction(path, method, data)
                isLoading[method] = false
            } catch (e) {
                isLoading[method] = false
                throw e
            }
            return result
        }
    })

    return {
        ...data,
        ...actions,
        isLoading
    }
}
