import type { SupportLocale } from "@/lib/i18n/locales";

/** A display name may not contain angle brackets: they have no place in a name, and a name like `<img src=x onerror=…>` only ever shows up in someone probing for XSS. */
export function hasAngleBrackets(displayName: string): boolean {
  return /[<>]/.test(displayName);
}

const ANGLE_BRACKETS_ERROR: Record<SupportLocale | "en", string> = {
  ar: "لا يمكن أن يحتوي اسم العرض على الرمزين < أو >.",
  es: "El nombre para mostrar no puede contener los símbolos < ni >.",
  tr: "Görünen ad < veya > karakterlerini içeremez.",
  en: "Display name can't contain the characters < or >.",
};

export function angleBracketsError(locale: SupportLocale | null): string {
  return ANGLE_BRACKETS_ERROR[locale ?? "en"];
}
