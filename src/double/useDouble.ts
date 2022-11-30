import {reactive, ref, watch, isRef, Ref} from "vue"

import {callAction, loadData} from "./api";
import {doubleTypes} from "../../dev-types";
import {getBundler} from "./bundler";

export function useDouble<Path extends keyof doubleTypes>(path: Path, apiMap: any, config: Record<string, any> = {}):
  doubleTypes[Path]['state'] &
  doubleTypes[Path]['actions'] &
  {
    initialDataLoaded: Ref<boolean>
    isLoading: doubleTypes[Path]['isLoading']
    refresh: () => Promise<void>
  } {
  // To be able to watch the config it has to be a ref
  if (!isRef(config)) {
    config = ref(config)
  }

  const loadDoubleData = async () => {
    return await loadData(path, config)
  }
  let returnValue = null
  const returnData = {
    isLoading: {},
    initialDataLoaded: false,
    refresh: async () => {
      setData(await loadDoubleData())
    }
  }

  apiMap.getters.forEach(entry => {
    if (returnData[entry] !== undefined) {
      throw new Error('You can\'t use the getter name ' + entry + ' because it\'s already defined on this double instance.')
    }
    returnData[entry] = null
  })
  apiMap.actions.forEach(method => {
    if (returnData[method] !== undefined) {
      throw new Error('You can\'t use the action name ' + method + ' because it\'s already defined on this double instance.')
    }
    returnData.isLoading[method] = false
    returnData[method] = async function (data: Record<string, unknown>) {
      returnValue.isLoading[method] = true
      let result = null
      try {
        result = await callAction(path, method, data)
      } catch (e) {
        throw e
      } finally {
        returnValue.isLoading[method] = false
      }
      return result
    }
  })

  const setData = (newData) => {
    Object.entries(newData).forEach(([key, value]) => {
      returnValue[key] = value
    })
  }

  // TODO: Only re-request the entrypoints where their config has actually changed
  watch(config, async () => {
    setData(await loadDoubleData())
  }, {
    deep: true,
  })

  returnData.refresh().then(() => {
    returnValue.initialDataLoaded = true
  })
  returnValue = reactive(returnData)

  return returnValue
}
