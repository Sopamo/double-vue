import {reactive, ref, watch} from "vue-demi"

import { apiMap } from "./apiMap";
import { callAction, loadData } from "./api";
import { doubleTypes } from "../../dev-types";

export async function useDouble<Path extends keyof doubleTypes>(path: Path, config: Record<string, any> = {}): Promise<doubleTypes[Path]> {
    // To be able to watch the config it has to be a ref
    // Even though we don't really need it to be one
    config = ref(config)
    const loadInitialVeemixData = async () => {
        return await loadData(path, config)
    }
    let data = {} as any

    apiMap[path].getters.forEach(entry => {
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
        setData(await loadInitialVeemixData())
    } catch(e) {
        console.log(e)
    }

    const isLoading = reactive<Record<string, boolean>>({})

    // TODO: Only re-request the entrypoints where their config has actually changed
    watch(config, async () => {
        setData(await loadInitialVeemixData())
    }, {
        deep: true,
    })
    return {
        ...data,
        isLoading,
        post: async function(method, data) {
            isLoading[method] = true
            try {
                const response = await callAction(path, method, data)
                isLoading[method] = false
                return response
            } catch (e) {
                isLoading[method] = false
                throw e
            }
        }
    }
}
