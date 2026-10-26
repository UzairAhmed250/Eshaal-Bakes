const KARACHI_TIMEZONE = "Asia/Karachi";

/**
 * Formats an integer PKR amount (e.g. 3800 -> "PKR 3,800").
 */
export function formatPKR(amountPkr: number): string {
  const rounded = Math.round(Number.isFinite(amountPkr) ? amountPkr : 0);
  return `PKR ${rounded.toLocaleString("en-PK")}`;
}

/**
 * Formats an ISO date or YYYY-MM-DD string in Asia/Karachi timezone.
 */
export function formatDateKarachi(dateInput: string | Date): string {
  const date =
    typeof dateInput === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)
      ? new Date(`${dateInput}T12:00:00+05:00`)
      : new Date(dateInput);

  if (Number.isNaN(date.getTime())) {
    return String(dateInput);
  }

  return new Intl.DateTimeFormat("en-PK", {
    timeZone: KARACHI_TIMEZONE,
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

/**
 * Formats a timestamp with date and time in Asia/Karachi timezone.
 */
export function formatDateTimeKarachi(dateInput: string | Date): string {
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) {
    return String(dateInput);
  }
  return new Intl.DateTimeFormat("en-PK", {
    timeZone: KARACHI_TIMEZONE,
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

/**
 * Normalizes a Pakistani mobile phone number to canonical 11-digit format `03XXXXXXXXX`.
 * Accepts `03XX-XXXXXXX`, `03XXXXXXXXX`, `+923XXXXXXXXX`, or `923XXXXXXXXX`.
 * Returns null if invalid.
 */
export function normalizePakistaniPhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (/^03\d{9}$/.test(digits)) {
    return digits;
  }
  if (/^923\d{9}$/.test(digits)) {
    return `0${digits.slice(2)}`;
  }
  return null;
}

/**
 * Formats digits as `03XX-XXXXXXX` while typing or displaying.
 */
export function formatPakistaniPhoneDisplay(raw: string): string {
  const normalized = normalizePakistaniPhone(raw);
  if (normalized) {
    return `${normalized.slice(0, 4)}-${normalized.slice(4)}`;
  }
  const digits = raw.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 4) {
    return digits;
  }
  return `${digits.slice(0, 4)}-${digits.slice(4, 11)}`;
}

/**
 * Normalizes an order code to uppercase `EB-XXXXXX`.
 */
export function formatOrderCode(raw: string): string {
  const cleaned = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (cleaned.startsWith("EB") && cleaned.length > 2) {
    return `EB-${cleaned.slice(2, 8)}`;
  }
  return cleaned;
}

/**
 * Converts a Pakistani phone (`03001234567` or `923001234567`) into E.164 digits (`923001234567`) for wa.me links.
 */
export function toWhatsAppPhone(phone: string): string {
  const normalized = normalizePakistaniPhone(phone);
  if (normalized) {
    return `92${normalized.slice(1)}`;
  }
  return phone.replace(/\D/g, "");
}
