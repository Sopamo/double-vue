import { setBackendPath } from "./api"

/**
 * This sets the HTTP path pointing to the root double API in the Laravel project
 * By default this should be https://{yourdomain}.com/double
 * 
 * @param backendPath 
 */
export const installDouble = (backendPath: string) => {
    setBackendPath(backendPath)
}