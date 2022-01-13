import { setBackendPath } from "./api"
import { setComponentMap } from "./componentMap"

export const installDouble = (componentMap, backendPath) => {
    setComponentMap(componentMap)
    setBackendPath(backendPath)
}