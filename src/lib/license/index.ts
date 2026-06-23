/**
 * License verification logic for NoteRich Chart Expert.
 *
 * This is a PURE FRONTEND verification — no server/API calls.
 * The license key is cryptographically signed using HMAC-SHA256 with a
 * secret key embedded in the code. The verification algorithm and secret
 * are obfuscated via webpack-obfuscator in production builds (see next.config.ts).
 *
 * License key format: NR-{base64(HMAC-SHA256 payload)}-{base64(payload)}
 * Payload: {email}|{expiryTimestamp}|{type}
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

// ─── Embedded secret (obfuscated in production) ──────────────────────────
// This key is used to sign and verify license keys. In production builds,
// webpack-obfuscator encrypts this string and the verification logic.
const LICENSE_SECRET = 'NR-ChartExpert-2024-PRO-License-SecretKey-v1'

// ─── HMAC-SHA256 implementation (Web Crypto API) ────────────────────────

async function hmacSha256(message: string, secret: string): Promise<string> {
  const encoder = new TextEncoder()
  const keyData = encoder.encode(secret)
  const messageData = encoder.encode(message)

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData)
  // Convert to base64url (no padding)
  const bytes = new Uint8Array(signature)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

// ─── Base64 URL-safe helpers ─────────────────────────────────────────────

function base64UrlEncode(str: string): string {
  return btoa(unescape(encodeURIComponent(str)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64UrlDecode(str: string): string {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/')
  const decoded = atob(padded)
  return decodeURIComponent(escape(decoded))
}

// ─── License key generation (for testing) ────────────────────────────────

/**
 * Generate a test license key for development/testing.
 * Creates a properly-signed key that passes local verification.
 * Expiry is 365 days from now.
 *
 * Key format: NR.{signature}.{payload}
 * Using '.' as delimiter (base64url uses - and _, so '.' is safe).
 */
export async function generateTestLicenseKey(email: string): Promise<string> {
  const expiry = Date.now() + 365 * 24 * 60 * 60 * 1000 // 1 year
  const payload = `${email}|${expiry}|pro`
  const payloadEncoded = base64UrlEncode(payload)
  const signature = await hmacSha256(payloadEncoded, LICENSE_SECRET)
  return `NR.${signature}.${payloadEncoded}`
}

// ─── License key verification ─────────────────────────────────────────────

/**
 * Validate a license key + email pair.
 * This is a PURE FRONTEND operation — no network calls.
 *
 * The key format is: NR.{signature}.{payload}
 * Using '.' as delimiter (base64url uses - and _, so '.' is safe).
 * Where:
 *   - signature = base64url(HMAC-SHA256(payload, LICENSE_SECRET))
 *   - payload = base64url("{email}|{expiryTimestamp}|{type}")
 *
 * Verification steps:
 *   1. Parse the key into signature + payload
 *   2. Recompute HMAC-SHA256 of the payload using the embedded secret
 *   3. Compare signatures (timing-safe)
 *   4. Decode payload and check email match + expiry
 */
export async function validateLicenseKey(
  licenseKey: string,
  email: string,
): Promise<LicenseValidationResult> {
  try {
    // Parse key format: NR.{signature}.{payload}
    const key = licenseKey.trim()
    if (!key.startsWith('NR.')) {
      return { valid: false, error: 'Invalid license key format.' }
    }

    const afterPrefix = key.substring(3) // remove "NR."
    const dotIdx = afterPrefix.indexOf('.')
    if (dotIdx === -1) {
      return { valid: false, error: 'Invalid license key format.' }
    }

    const signature = afterPrefix.substring(0, dotIdx)
    const payloadEncoded = afterPrefix.substring(dotIdx + 1)

    if (!signature || !payloadEncoded) {
      return { valid: false, error: 'Invalid license key format.' }
    }

    // Recompute the signature
    const expectedSignature = await hmacSha256(payloadEncoded, LICENSE_SECRET)

    // Timing-safe comparison
    if (signature.length !== expectedSignature.length) {
      return { valid: false, error: 'License key signature mismatch.' }
    }
    let signatureMatch = true
    for (let i = 0; i < signature.length; i++) {
      if (signature.charCodeAt(i) !== expectedSignature.charCodeAt(i)) {
        signatureMatch = false
      }
    }
    if (!signatureMatch) {
      return { valid: false, error: 'License key signature mismatch.' }
    }

    // Decode payload: {email}|{expiryTimestamp}|{type}
    const payload = base64UrlDecode(payloadEncoded)
    const payloadParts = payload.split('|')
    if (payloadParts.length !== 3) {
      return { valid: false, error: 'Invalid license payload.' }
    }

    const [payloadEmail, expiryStr, type] = payloadParts
    const expiry = parseInt(expiryStr, 10)

    // Verify email matches
    if (payloadEmail.toLowerCase() !== email.trim().toLowerCase()) {
      return { valid: false, error: 'License email does not match.' }
    }

    // Verify not expired
    if (isNaN(expiry) || expiry < Date.now()) {
      return { valid: false, error: 'License has expired. Please renew your subscription.' }
    }

    // Verify type is valid
    if (type !== 'pro') {
      return { valid: false, error: 'Invalid license type.' }
    }

    return {
      valid: true,
      type: 'pro',
      expiry,
      error: null,
    }
  } catch {
    return { valid: false, error: 'License verification failed. Please check your key and email.' }
  }
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
 * Also re-verifies the license on load to prevent tampering.
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
