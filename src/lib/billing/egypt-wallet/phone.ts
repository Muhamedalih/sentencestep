/** Arabic-Indic and Persian digits to ASCII, and the Arabic decimal and thousands marks to . and , */
export function toAsciiDigits(text: string): string {
  return text
    .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 0x06f0))
    .replace(/٫/g, ".")
    .replace(/٬/g, ",");
}

/**
 * An Egyptian mobile number in the one form the database stores: eleven digits starting 01
 * (010 Vodafone, 011 Etisalat, 012 Orange, 015 WE). Accepts what people actually type: Arabic digits,
 * spaces and dashes, a leading +20, 0020 or 20, or the number without its leading zero. Anything
 * that is not exactly such a number gives null, so a typo is caught instead of stored.
 */
export function normalizeEgyptPhone(input: string): string | null {
  let digits = toAsciiDigits(input).replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) digits = digits.slice(1);
  else if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.includes("+")) return null;

  if (digits.startsWith("20") && digits.length === 12) digits = `0${digits.slice(2)}`;
  else if (digits.length === 10 && digits.startsWith("1")) digits = `0${digits}`;

  return /^01[0125]\d{8}$/.test(digits) ? digits : null;
}
