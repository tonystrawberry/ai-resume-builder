export const RESUME_LOCALES = [
  { id: "en", label: "English", language: "English" },
  { id: "ja", label: "日本語", language: "Japanese" },
  { id: "fr", label: "Français", language: "French" },
] as const;

export type ResumeLocaleId = (typeof RESUME_LOCALES)[number]["id"];

export function isResumeLocale(value: string): value is ResumeLocaleId {
  return RESUME_LOCALES.some((l) => l.id === value);
}

export function localeLanguageName(locale: string): string {
  return (
    RESUME_LOCALES.find((l) => l.id === locale)?.language ?? locale
  );
}
