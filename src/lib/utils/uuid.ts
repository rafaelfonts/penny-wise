/**
 * UUID utility compatible with both server and client environments
 */

// Fallback UUID generation for environments without crypto.randomUUID
function generateUUIDFallback(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

/**
 * Generate a UUID that works in both server and client environments
 */
export function generateUUID(): string {
  // Check if we're in a browser environment with crypto.randomUUID support
  if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID()
  }
  
  // Check if we're in Node.js environment with crypto.randomUUID support
  if (typeof global !== 'undefined' && global.crypto && global.crypto.randomUUID) {
    return global.crypto.randomUUID()
  }
  
  // Fallback for older environments
  return generateUUIDFallback()
}

/**
 * Generate a short ID for temporary use
 */
export function generateShortId(): string {
  return Math.random().toString(36).substring(2, 15)
} 