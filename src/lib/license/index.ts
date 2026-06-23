/**
 * License verification logic for NoteRich Chart Expert.
 * Completely matches the NoteRich note app's license system.
 *
 * Uses XOR-based encryption with a key derived from a fixed password + salt.
 * The salt is dynamically read from the NoteRich webicon SVG path data.
 * In production, this code is obfuscated via webpack-obfuscator (see next.config.ts).
 */

const IV_LENGTH = 16;

export interface LicenseValidationResult {
  valid: boolean;
  type?: string;
  expiry?: number;
  error?: string;
}

export interface UserLicense {
  type: string;
  expiry: number | null;
  email: string | null;
  error: string | null;
}

export const FREE_LICENSE: UserLicense = {
  type: 'free',
  expiry: null,
  email: null,
  error: null,
};

const LICENSE_STORAGE_KEY = 'noterich-license';

// ─── Key derivation (matches note app exactly) ──────────────────────────

export async function deriveKeyFromParams(
  password: string,
  salt: string,
): Promise<ArrayBuffer> {
  const combined = password + salt;
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  const keyBytes = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    keyBytes[i] = (hash >> ((i % 4) * 8)) & 0xff;
  }
  return keyBytes.buffer;
}

// ─── Decryption (matches note app exactly) ──────────────────────────────

export async function decryptLicense(
  encryptedData: Uint8Array,
  key: ArrayBuffer,
): Promise<any> {
  const iv = encryptedData.slice(0, IV_LENGTH);
  const ciphertext = encryptedData.slice(IV_LENGTH);
  const keyMaterial = new Uint8Array(key);
  const decryptedBuffer = new Uint8Array(ciphertext.length);
  for (let i = 0; i < ciphertext.length; i++) {
    decryptedBuffer[i] = ciphertext[i] ^ keyMaterial[i % keyMaterial.length];
  }
  const decoder = new TextDecoder();
  const jsonString = decoder.decode(decryptedBuffer);
  try {
    return JSON.parse(jsonString);
  } catch (e) {
    throw new Error('Decryption failed or resulted in invalid JSON');
  }
}

// ─── Helper: get the derive salt from webicon SVG path ──────────────────

// The salt is the first 50 characters of the NoteRich webicon SVG path 'd' attribute.
// This is hardcoded as a fallback — the note app reads it dynamically from the DOM,
// but we also keep it here to avoid timing issues where the #webicon element might
// not be in the DOM yet when license validation runs.
const WEBICON_PATH_D = 'M22.266 3.834a12.7 12.7 0 0 1 3.194.319c10.765 2.446 7.71 15.16 7.951 23.149.02.66.055 1.165.414 1.737 1.484 1.192 3.724-.94 4.96-1.82.047 3.194.432 7.023-1.783 9.62-2.9 3.401-9.023 2.953-12.214.162-5.819-5.09-3.274-14.17-3.848-20.956-.14-.903-.248-2.55-1.277-2.806-2.546.55-1.905 9.046-1.903 11.107l-.004 14.444q-6.539.047-13.076-.021c-.035-1.486-.04-3.02-.02-4.507.13-10.036-.195-20.16.03-30.187l8.263-.016c1.381 0 3.457-.06 4.765.04.073.233.077.34.1.58.87-.008 2.717-.729 4.448-.845m-4.58 3.315c-.025.82-.23 4.093.1 4.614 2.211-.717 4-.498 4.702 2.144 1.861 6.998-2.623 17.779 4.738 22.513 1.653.982 4.264 1.003 6.168.59 2.914-1.129 3.355-3.198 3.507-6.033-2.127.555-4.656.681-5.183-2.042-1.344-6.942 2.66-16.998-4.075-21.94-1.598-1.1-4.356-1.376-6.326-1.125-1.497.216-2.325.434-3.63 1.28';

function getDeriveSalt(): string {
  if (typeof document !== 'undefined') {
    const domSalt = document
      .getElementById('webicon')
      ?.getElementsByTagName('path')[0]
      ?.getAttribute('d')
      ?.slice(0, 50);
    if (domSalt) return domSalt;
  }
  // Fallback: use the hardcoded path (first 50 chars) — identical to what the
  // note app reads from its #webicon element.
  return WEBICON_PATH_D.slice(0, 50);
}

// ─── License validation (matches note app exactly) ──────────────────────

export const validateLicenseKey = async (
  key: string,
  email: string,
): Promise<LicenseValidationResult> => {
  try {
    let binaryString: string;
    try {
      binaryString = atob(key);
    } catch (e) {
      console.error('License key decoding failed:', e);
      return { error: 'License key format is invalid.', valid: false };
    }
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const derivedKey = await deriveKeyFromParams(
      'noterich.com',
      getDeriveSalt(),
    );
    let decryptedData: any;
    try {
      decryptedData = await decryptLicense(bytes, derivedKey);
    } catch (e) {
      console.error('License key decryption failed:', e);
      return { error: 'License key decryption failed.', valid: false };
    }
    if (
      typeof decryptedData !== 'object' ||
      !decryptedData.hasOwnProperty('user') ||
      !decryptedData.hasOwnProperty('expiry') ||
      !decryptedData.hasOwnProperty('type')
    ) {
      return { error: 'License key structure is incorrect.', valid: false };
    }
    if (decryptedData.user !== email) {
      return { error: 'Email does not match the license key.', valid: false };
    }
    if (Date.now() > decryptedData.expiry) {
      return { error: 'License key has expired.', valid: false };
    }
    if (decryptedData.type !== 'pro') {
      return { error: 'Invalid license type.', valid: false };
    }
    return {
      expiry: decryptedData.expiry,
      type: decryptedData.type,
      valid: true,
    };
  } catch (error) {
    console.error('An unexpected error occurred during validation:', error);
    return {
      error: 'An unexpected error occurred during validation.',
      valid: false,
    };
  }
};

// ─── Check stored license on app load (matches note app) ────────────────

export const checkStoredLicense = async (
  setUserLicense: (license: UserLicense) => void,
  onError?: (error: string) => void,
): Promise<void> => {
  const storedKey = localStorage.getItem('licenseKey');
  const storedEmail = localStorage.getItem('licenseEmail');
  if (storedKey && storedEmail) {
    const validationResult = await validateLicenseKey(storedKey, storedEmail);
    if (
      validationResult.valid &&
      validationResult.type &&
      validationResult.expiry
    ) {
      setUserLicense({
        email: storedEmail,
        error: null,
        expiry: validationResult.expiry,
        type: validationResult.type,
      });
    } else {
      setUserLicense({
        email: storedEmail,
        error: validationResult.error || 'Unknown validation error',
        expiry: validationResult.expiry || null,
        type: 'free',
      });
      if (validationResult.error && onError) {
        onError(validationResult.error);
      }
    }
  } else {
    setUserLicense({ email: null, error: null, expiry: null, type: 'free' });
  }
};

// ─── Test license key generation (matches note app exactly) ─────────────

export const generateTestLicenseKey = async (
  email: string,
  type: string = 'pro',
  daysToAdd: number = 36500,
): Promise<string> => {
  try {
    if (!email) {
      throw new Error('Email is required to generate a test license key.');
    }
    const licenseData = {
      expiry: Date.now() + daysToAdd * 24 * 60 * 60 * 1000,
      isTest: true,
      type: type,
      user: email,
    };
    const derivedKey = await deriveKeyFromParams(
      'noterich.com',
      getDeriveSalt(),
    );

    const encryptLicense = async (
      data: any,
      key: ArrayBuffer,
    ): Promise<Uint8Array> => {
      const encoder = new TextEncoder();
      const jsonString = JSON.stringify(data);
      const dataBytes = encoder.encode(jsonString);
      const iv = new Uint8Array(IV_LENGTH);
      const timestamp = Date.now();
      for (let i = 0; i < IV_LENGTH; i++) {
        iv[i] = (timestamp >> (i * 8)) & 0xff;
      }
      const keyMaterial = new Uint8Array(key);
      const encryptedBuffer = new Uint8Array(dataBytes.length);
      for (let i = 0; i < dataBytes.length; i++) {
        encryptedBuffer[i] = dataBytes[i] ^ keyMaterial[i % keyMaterial.length];
      }
      const result = new Uint8Array(iv.length + encryptedBuffer.length);
      result.set(iv, 0);
      result.set(encryptedBuffer, iv.length);
      return result;
    };

    const encryptedBytes = await encryptLicense(licenseData, derivedKey);
    let binary = '';
    const len = encryptedBytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(encryptedBytes[i]);
    }
    const encodedKey = btoa(binary);
    return encodedKey;
  } catch (error) {
    console.error('Error generating test license key:', error);
    throw error;
  }
};

// ─── Storage helpers ────────────────────────────────────────────────────

export function resetSubDeviceFailCount(): void {
  try {
    localStorage.removeItem('noterich-license-fail-count');
  } catch {
    // ignore
  }
}

export function loadStoredLicense(): UserLicense {
  try {
    // Use the same localStorage keys as the note app
    const storedKey = localStorage.getItem('licenseKey');
    const storedEmail = localStorage.getItem('licenseEmail');
    if (storedKey && storedEmail) {
      // We can't synchronously validate here (validation is async), so
      // return a placeholder that will be re-validated on mount by
      // checkStoredLicense(). For now, assume valid if keys exist.
      // The provider will call checkStoredLicense() on mount to verify.
      const storedLicense = localStorage.getItem(LICENSE_STORAGE_KEY);
      if (storedLicense) {
        const parsed = JSON.parse(storedLicense) as UserLicense;
        if (parsed.type === 'pro' && parsed.expiry && parsed.expiry < Date.now()) {
          return { ...FREE_LICENSE, error: 'License expired. Please renew your Pro subscription.' };
        }
        return parsed;
      }
    }
  } catch {
    // ignore
  }
  return FREE_LICENSE;
}

export function saveStoredLicense(license: UserLicense): void {
  try {
    localStorage.setItem(LICENSE_STORAGE_KEY, JSON.stringify(license));
  } catch {
    // ignore
  }
}

export function clearStoredLicense(): void {
  try {
    localStorage.removeItem(LICENSE_STORAGE_KEY);
    // Also clear the note app's keys
    localStorage.removeItem('licenseKey');
    localStorage.removeItem('licenseEmail');
  } catch {
    // ignore
  }
}

export function isProUser(license: UserLicense | null): boolean {
  if (!license || license.type !== 'pro') return false;
  if (license.expiry && license.expiry < Date.now()) return false;
  return true;
}
