export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PHONE_REGEX = /^\d{10}$/;

/**
 * Reduce a stored or imported phone number to the 10-digit form the forms expect:
 * "+91 98765 43210" / "098765 43210" -> "9876543210". Anything else is returned as digits only.
 */
export function normalizeMobile(value: unknown): string {
    const digits = String(value ?? '').replace(/\D/g, '');
    if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
    if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
    return digits;
}
