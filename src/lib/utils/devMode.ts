/**
 * Dev Mode Session Management
 *
 * Persists dev mode state across pages during development
 * using sessionStorage (cleared when browser tab closes)
 */

const DEV_MODE_KEY = 'wedding_dev_mode'

/**
 * Check if dev mode is enabled in current session
 */
export function isDevModeEnabled(): boolean {
  if (typeof window === 'undefined') return false
  return sessionStorage.getItem(DEV_MODE_KEY) === 'true'
}

/**
 * Enable dev mode for current session
 */
export function enableDevMode(): void {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(DEV_MODE_KEY, 'true')
  console.log('🔧 Dev mode enabled for this session')
}

/**
 * Disable dev mode for current session
 */
export function disableDevMode(): void {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(DEV_MODE_KEY)
  console.log('🔧 Dev mode disabled')
}

/**
 * Toggle dev mode state
 */
export function toggleDevMode(): boolean {
  const newState = !isDevModeEnabled()
  if (newState) {
    enableDevMode()
  } else {
    disableDevMode()
  }
  return newState
}
