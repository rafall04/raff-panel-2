/**
 * Indonesian phone number handling for the login form.
 *
 * Mirrors raf-bot-v2's `lib/phone-validator.js` normalizePhone so the panel and
 * the backend agree on what a number means. Two reasons this must happen on the
 * client rather than being left to the backend:
 *
 * 1. `otpRequestValidation` matches `/^(\+62|62|0)[0-9]{9,12}$/` against the RAW
 *    value before its sanitizer runs, so "+62 812-3456-7890" — the way people
 *    actually write their number — is rejected outright.
 * 2. The backend's OTP attempt lockout is keyed on the raw string it receives,
 *    so sending a canonical form keeps one customer in one bucket.
 */

/** Canonical form the backend expects: 62 followed by 9-12 digits. */
const CANONICAL_PHONE_PATTERN = /^62[0-9]{9,12}$/;

/**
 * Normalize whatever the customer typed into the backend's canonical 62… form.
 * Accepts "+62 812-3456-7890", "0812 3456 7890", "62812...", "812...".
 *
 * Returns "" when there is nothing usable. The branches deliberately mirror
 * raf-bot-v2's normalizePhone — if that changes, change this too.
 */
export function normalizePhoneNumber(raw: string): string {
  const digits = raw.replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  if (digits.startsWith("628")) {
    return digits;
  }

  if (digits.startsWith("08")) {
    return `62${digits.slice(1)}`;
  }

  if (digits.startsWith("8") && digits.length >= 10) {
    return `62${digits}`;
  }

  if (digits.startsWith("62")) {
    return digits;
  }

  return digits.length >= 9 ? `62${digits}` : digits;
}

/** Whether a normalized number will pass the backend's validator. */
export function isValidIndonesianPhone(normalized: string): boolean {
  return CANONICAL_PHONE_PATTERN.test(normalized);
}
