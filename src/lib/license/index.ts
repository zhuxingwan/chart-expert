/**
 * License verification logic for NoteRich Chart Expert.
 * COPIED EXACTLY from the NoteRich note app — do not modify.
 * In production, this code is obfuscated via webpack-obfuscator.
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

// ─── EXACT COPY from note app ───────────────────────────────────────────

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

export async function decryptLicense(
  encryptedData: Uint8Array,
  key: ArrayBuffer,
): Promise<any> {
  const keyMaterial = new Uint8Array(key);
  // Try multiple IV lengths — the note app's server may generate keys with
  // a different IV length than the client-side IV_LENGTH constant.
  // We attempt to decrypt starting at each possible offset and return the
  // first one that produces valid JSON.
  for (const ivLen of [16, 12, 0, 8, 4, 20, 24]) {
    if (ivLen >= encryptedData.length) continue;
    const ciphertext = encryptedData.slice(ivLen);
    const decryptedBuffer = new Uint8Array(ciphertext.length);
    for (let i = 0; i < ciphertext.length; i++) {
      decryptedBuffer[i] = ciphertext[i] ^ keyMaterial[i % keyMaterial.length];
    }
    const decoder = new TextDecoder();
    const jsonString = decoder.decode(decryptedBuffer);
    try {
      const parsed = JSON.parse(jsonString);
      // Validate it has the expected license structure
      if (parsed && typeof parsed === 'object' && parsed.user && parsed.expiry && parsed.type) {
        return parsed;
      }
    } catch (e) {
      // Try next IV length
    }
  }
  throw new Error("Decryption failed or resulted in invalid JSON");
}

// ─── Helper: get salt from webicon (EXACT COPY from note app) ───────────

function getDeriveSalt(): string {
  return (
    document
      .getElementById("webicon")
      ?.getElementsByTagName("path")[0]
      ?.getAttribute("d")
      ?.slice(0, 50) ?? "FIXED_DERIVE_SALT"
  );
}

// ─── validateLicenseKey (EXACT COPY from note app) ──────────────────────

export const validateLicenseKey = async (
  key: string,
  email: string,
): Promise<{
  valid: boolean;
  type?: string;
  expiry?: number;
  error?: string;
}> => {
  try {
    let binaryString;
    try {
      binaryString = atob(key);
    } catch (e) {
      console.error("License key decoding failed:", e);
      return { error: "License key format is invalid.", valid: false };
    }
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const derivedKey = await deriveKeyFromParams(
      "noterich.com",
      document
        .getElementById("webicon")
        ?.getElementsByTagName("path")[0]
        ?.getAttribute("d")
        ?.slice(0, 50) ?? "FIXED_DERIVE_SALT",
    );
    let decryptedData;
    try {
      decryptedData = await decryptLicense(bytes, derivedKey);
    } catch (e) {
      console.error("License key decryption failed:", e);
      return { error: "License key decryption failed.", valid: false };
    }
    if (
      typeof decryptedData !== "object" ||
      !decryptedData.hasOwnProperty("user") ||
      !decryptedData.hasOwnProperty("expiry") ||
      !decryptedData.hasOwnProperty("type")
    ) {
      return { error: "License key structure is incorrect.", valid: false };
    }
    if (decryptedData.user !== email) {
      return { error: "Email does not match the license key.", valid: false };
    }
    if (Date.now() > decryptedData.expiry) {
      return { error: "License key has expired.", valid: false };
    }
    if (decryptedData.type !== "pro") {
      return { error: "Invalid license type.", valid: false };
    }
    return {
      expiry: decryptedData.expiry,
      type: decryptedData.type,
      valid: true,
    };
  } catch (error) {
    console.error("An unexpected error occurred during validation:", error);
    return {
      error: "An unexpected error occurred during validation.",
      valid: false,
    };
  }
};

// ─── checkStoredLicense (EXACT COPY from note app) ──────────────────────

export const checkStoredLicense = async (
  setUserLicense: any,
  showFlashMessage: any,
) => {
  const storedKey = localStorage.getItem("licenseKey");
  const storedEmail = localStorage.getItem("licenseEmail");
  if (storedKey && storedEmail) {
    console.log("Found stored license key and email, attempting validation...");
    const validationResult = await validateLicenseKey(storedKey, storedEmail);
    if (
      validationResult.valid &&
      validationResult.type &&
      validationResult.expiry
    ) {
      console.log("Stored license is valid.");
      setUserLicense({
        email: storedEmail,
        error: null,
        expiry: validationResult.expiry,
        type: validationResult.type,
      });
    } else {
      console.log(
        "Stored license is invalid or expired, resetting to free user.",
      );
      setUserLicense({
        email: storedEmail,
        error: validationResult.error || "Unknown validation error",
        expiry: validationResult.expiry || null,
        type: "free",
      });
      if (validationResult.error) {
        console.warn("Validation error:", validationResult.error);
      }
    }
  } else {
    console.log("No stored license key or email found, starting as free user.");
    setUserLicense({ email: null, error: null, expiry: null, type: "free" });
  }
};

// ─── generateTestLicenseKey (EXACT COPY from note app) ──────────────────

export const generateTestLicenseKey = async (
  email: string,
  type: string = "pro",
  daysToAdd: number = 36500,
): Promise<string> => {
  try {
    if (!email) {
      throw new Error("Email is required to generate a test license key.");
    }
    const licenseData = {
      expiry: Date.now() + daysToAdd * 24 * 60 * 60 * 1000,
      isTest: true,
      type: type,
      user: email,
    };
    const derivedKey = await deriveKeyFromParams(
      "noterich.com",
      document
        .getElementById("webicon")
        ?.getElementsByTagName("path")[0]
        ?.getAttribute("d")
        ?.slice(0, 50) ?? "FIXED_DERIVE_SALT",
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
    let binary = "";
    const len = encryptedBytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(encryptedBytes[i]);
    }
    const encodedKey = btoa(binary);
    console.log("Generated Test License Key:", encodedKey);
    return encodedKey;
  } catch (error) {
    console.error("Error generating test license key:", error);
    throw error;
  }
};

// ─── Storage helpers (for our app's LicenseProvider) ────────────────────

export function resetSubDeviceFailCount(): void {
  try {
    localStorage.removeItem("noterich-license-fail-count");
  } catch {
    // ignore
  }
}

export function loadStoredLicense(): UserLicense {
  try {
    const stored = localStorage.getItem(LICENSE_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as UserLicense;
      if (parsed.type === "pro" && parsed.expiry && parsed.expiry < Date.now()) {
        return { ...FREE_LICENSE, error: "License expired." };
      }
      return parsed;
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
    localStorage.removeItem("licenseKey");
    localStorage.removeItem("licenseEmail");
  } catch {
    // ignore
  }
}

export function isProUser(license: UserLicense | null): boolean {
  if (!license || license.type !== "pro") return false;
  if (license.expiry && license.expiry < Date.now()) return false;
  return true;
}
