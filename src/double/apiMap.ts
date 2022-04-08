import { doubleTypes } from "../../dev-types"
import { ApiMapEntry } from "../server/transform/apiMap"

let apiMap = {} as Record<keyof doubleTypes, ApiMapEntry>

const setApiMap = (map) => {
    apiMap = map
}

export { apiMap, setApiMap }