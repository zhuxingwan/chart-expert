/**
 * License verification logic for NoteRich Chart Expert.
 *
 * In production, this code is obfuscated via webpack-obfuscator (see next.config.ts).
 * The validation calls the PayProGlobal license API to verify the key + email pair.
 */

export interface LicenseValidationResult {
  valid: boolean
  type?: string // 'pro' | 'free'
  expiry?: number | null // Unix timestamp (ms)
  error?: string | null
}

export interface UserLicense {
  type: string // 'pro' | 'free'
  expiry: number | null
  email: string | null
  error: string | null
}

export const FREE_LICENSE: UserLicense = {
  type: 'free',
  expiry: null,
  email: null,
  error: null,
}

const LICENSE_STORAGE_KEY = 'noterich-license'
const LICENSE_API_BASE = 'https://store.payproglobal.com/api'

/**
 * Validate a license key + email against the PayProGlobal API.
 * Returns the validation result with type and expiry if valid.
 */
export async function validateLicenseKey(
  licenseKey: string,
  email: string,
): Promise<LicenseValidationResult> {
  try {
    const response = await fetch(
      `${LICENSE_API_BASE}/v1/license/validate`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          licenseKey,
          email,
          productId: 126640,
        }),
      },
    )

    if (!response.ok) {
      // Try fallback: some PPG endpoints use a different path
      const fallback = await fetch(
        `${LICENSE_API_BASE}/license/validate?key=${encodeURIComponent(licenseKey)}&email=${encodeURIComponent(email)}`,
      )
      if (!fallback.ok) {
        return {
          valid: false,
          error: 'License verification failed. Please check your key and email.',
        }
      }
      const data = await fallback.json()
      return parseValidationResponse(data, email)
    }

    const data = await response.json()
    return parseValidationResponse(data, email)
  } catch (e) {
    return {
      valid: false,
      error: 'Network error during license verification. Please try again.',
    }
  }
}

function parseValidationResponse(
  data: unknown,
  email: string,
): LicenseValidationResult {
  const d = data as Record<string, unknown>
  // PayProGlobal returns different shapes; handle common ones
  if (d.valid === true || d.isValid === true || d.status === 'valid') {
    const expiry = d.expiry ? new Date(d.expiry as string).getTime() : d.expiryDate ? new Date(d.expiryDate as string).getTime() : null
    return {
      valid: true,
      type: 'pro',
      expiry: expiry ?? null,
      error: null,
    }
  }
  return {
    valid: false,
    error: (d.error as string) || (d.message as string) || 'Invalid license key or email.',
  }
}

/**
 * Generate a test license key for development/testing.
 * This calls a test endpoint or generates a local test key.
 */
export async function generateTestLicenseKey(email: string): Promise<string> {
  // In production, this would call a backend test endpoint.
  // For now, generate a test key that passes local validation.
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 10)
  const emailHash = btoa(email).substring(0, 8).toUpperCase()
  return `NR-TEST-${emailHash}-${timestamp.toString(36).toUpperCase()}-${random.toUpperCase()}`
}

/**
 * Reset the sub-device fail count (called on successful validation).
 */
export function resetSubDeviceFailCount(): void {
  try {
    localStorage.removeItem('noterich-license-fail-count')
  } catch {
    // ignore
  }
}

/**
 * Load the saved license from localStorage.
 * Returns the stored license or a free default.
 */
export function loadStoredLicense(): UserLicense {
  try {
    const stored = localStorage.getItem(LICENSE_STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored) as UserLicense
      // Check expiry — if expired, downgrade to free
      if (parsed.type === 'pro' && parsed.expiry && parsed.expiry < Date.now()) {
        return { ...FREE_LICENSE, error: 'License expired. Please renew your Pro subscription.' }
      }
      return parsed
    }
  } catch {
    // ignore
  }
  return FREE_LICENSE
}

/**
 * Save the license to localStorage.
 */
export function saveStoredLicense(license: UserLicense): void {
  try {
    localStorage.setItem(LICENSE_STORAGE_KEY, JSON.stringify(license))
  } catch {
    // ignore
  }
}

/**
 * Clear the stored license (downgrade to free).
 */
export function clearStoredLicense(): void {
  try {
    localStorage.removeItem(LICENSE_STORAGE_KEY)
  } catch {
    // ignore
  }
}

/**
 * Check if the user currently has an active Pro license.
 */
export function isProUser(license: UserLicense | null): boolean {
  if (!license || license.type !== 'pro') return false
  if (license.expiry && license.expiry < Date.now()) return false
  return true
}
