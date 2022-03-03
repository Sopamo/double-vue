import { doubleTypes } from "../../dev-types"
import { deepUnref } from "./deepUnref"
let backendPath = ''

/**
 * Custom headers we sent with every requests
 * This will most probably be used for an auth header
 */
let customHeaders: Record<string, string> = {}

const assureBackendPath = () => {
    if(!backendPath) {
        throw new Error('No backend path is set. Did you call the double install function?')
    }
}

/**
 * This sets the HTTP path pointing to the root double API in the Laravel project
 * By default this should be https://{yourdomain}.com/double
 * 
 * @param path 
 */
export const setBackendPath = (path: string): void => {
    backendPath = path
}

/**
 * Sets the custom headers. This overrides all existing custom headers
 * @example { Cookie: 'myCookie=1', 'x-my-custom-header': 5 }
 * @param headers An object where the keys are the names of the header and the values are the values that should be set
 */
export const setCustomHeaders = (headers: Record<string, string>): void => {
    customHeaders = headers
}

/**
 * Sets a single header that will be sent with every request
 * 
 * @param header the name of the header
 * @param value the value that should be set for that header
 */
export const setCustomHeader = (header: string, value: string): void => {
    customHeaders[header] = value
}

export const getHeaders = (): Record<string, string> => {
    const baseHeaders = {
        'Content-Type': 'application/json'
    }
    return {
        ...baseHeaders,
        ...customHeaders,
    }
}

export const loadData = async <Path extends keyof doubleTypes>(path: Path, config: Record<string, unknown> = {}) => {
    assureBackendPath()
    const res = await fetch(`${backendPath}/data?path=${encodeURIComponent(path)}`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ config: deepUnref(config) })
    })
    return await res.json()
}

export const callAction = async <Path extends keyof doubleTypes>(path: Path, method: string, data: Record<string, unknown>)  => {
    assureBackendPath()
    const res = await fetch(`${backendPath}/action?path=${encodeURIComponent(path)}&method=${encodeURIComponent(method)}`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(deepUnref(data))
    })
    return await res.json()
}