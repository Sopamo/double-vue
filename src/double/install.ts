import { setBackendPath } from "./api"
import { setApiMap } from "./apiMap"

export const installDouble = (apiMap, backendPath) => {
    setApiMap(apiMap)
    setBackendPath(backendPath)
}