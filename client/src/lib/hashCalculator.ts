/**
 * Hash Calculator
 * Calculates SHA-256 hash of files for VirusTotal verification
 */

/**
 * Calculate SHA-256 hash of a file
 * Uses the Web Crypto API available in modern browsers
 */
export async function calculateSHA256(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Calculate SHA-256 hash of a Blob
 */
export async function calculateSHA256Blob(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Format hash for display
 */
export function formatHash(hash: string): string {
  return hash.toUpperCase();
}

/**
 * Verify hash format (SHA-256 should be 64 hex characters)
 */
export function isValidSHA256(hash: string): boolean {
  return /^[a-fA-F0-9]{64}$/.test(hash);
}
