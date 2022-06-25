import {reactive, ref, watch, isRef } from "vue"

import { callAction, loadData } from "./api";
import { doubleTypes } from "../../dev-types";
import { getBundler } from "./bundler";

export async function useDouble<Path extends keyof doubleTypes>(path: Path, config: Record<string, any> = {}):
    Promise<
        doubleTypes[Path]['state'] &
        doubleTypes[Path]['actions'] &
        { isLoading: doubleTypes[Path]['isLoading'] } &
        { refresh: () => Promise<void> }
    > {
    // To be able to watch the config it has to be a ref
    if(!isRef(config)) {
        config = ref(config)
    }

    const loadInitialDoubleData = async () => {
        return await loadData(path, config)
    }
    let data = {} as any

    const apiMap = await getApiMap(path)

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
    setData(await loadInitialDoubleData())

    const isLoading = reactive<Record<string, boolean>>({})

    // TODO: Only re-request the entrypoints where their config has actually changed
    watch(config, async () => {
        setData(await loadInitialDoubleData())
    }, {
        deep: true,
    })

    const actions = {}
    apiMap.actions.forEach(method => {
        isLoading[method] = false
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

    const refresh = async () => {
        setData(await loadInitialDoubleData())
    }

    return {
        ...data,
        ...actions,
        isLoading,
        refresh,
    }
}

export async function getApiMap(path: string): Promise<{ getters: string[], actions: string[] }> {
    let apiMap = null
    if(getBundler() === 'webpack') {
        // Webpack can't dynamically import files from the root folder, so we have to remove the mandatory /src/ prefix
        // because we need it to be hardcodet in the import call.
        path = path.replace(/^\/?src\//, '')
        apiMap = (await import(/* webpackPreload: true */ '/src/' + path + '.php')).default
    } else {
        apiMap = (await import(/* @vite-ignore */ path + '.php')).default
    }
    if(!apiMap) {
        console.error(`Could not fetch the ${path}.php file. Try restarting your dev server.`)
    }
    return apiMap
}