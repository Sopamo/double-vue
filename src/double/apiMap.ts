import { doubleTypes } from "../../dev-types"
import { ApiMapEntry } from "../vite/transform/apiMap"

let apiMap = {} as Record<keyof doubleTypes, ApiMapEntry>

const setApiMap = (map) => {
    apiMap = map
}

export { apiMap, setApiMap }