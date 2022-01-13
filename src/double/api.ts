import { deepUnref } from "./deepUnref"

// This is the HTTP path pointing to the root double API in the laravel project
// Usually this should be https://{yourdomain}.com/double
let backendPath = ''

const assureBackendPath = () => {
    if(!backendPath) {
        throw new Error('No backend path is set. Did you call the double install function?')
    }
}

export const setBackendPath = (path: string) => {
    backendPath = path
}

export const loadData = async <Path extends keyof doubleTypes>(path: Path, config: Record<string, unknown>) => {
    assureBackendPath()
    const res = await fetch(`${backendPath}/data?path=${encodeURIComponent(path)}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ config: deepUnref(config) })
    })
    return await res.json()
}

export const callAction = async <Path extends keyof doubleTypes>(path: Path, method: string, data: Record<string, unknown>)  => {
    const res = await fetch(`${backendPath}/action?path=${encodeURIComponent(path)}&method=${encodeURIComponent(method)}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(deepUnref(data))
    })
    return await res.json()
}