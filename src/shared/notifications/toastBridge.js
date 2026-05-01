/**
 * Pont impératif pour déclencher des toasts hors React (ex. intercepteur Axios).
 * Enregistré par ToastProvider au montage.
 *
 * @typedef {{ type?: 'error' | 'success' | 'info', message: string, duration?: number }} ToastPayload
 */

/** @type {null | ((payload: ToastPayload) => void)} */
let dispatch = null

export function registerToastDispatch(fn) {
  dispatch = typeof fn === 'function' ? fn : null
}

/** @param {ToastPayload} payload */
export function dispatchToast(payload) {
  dispatch?.(payload)
}
