import { setBackendPath } from "./api"
import { setBundler, Bundler } from "./bundler"


/**
 * This sets the HTTP path pointing to the root double API in the Laravel project
 * By default this should be https://{yourdomain}.com/double
 * 
 * @param backendPath 
 */
export const installDouble = (backendPath: string, bundler: Bundler) => {
    setBackendPath(backendPath)
    setBundler(bundler)
}