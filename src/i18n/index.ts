import he from './he.json';
import ar from './ar.json';
import ru from './ru.json';
import en from './en.json';

export const LANGS = ['he', 'ar', 'ru', 'en'] as const;
export type Lang = (typeof LANGS)[number];
export const DEFAULT_LANG: Lang = 'he';

export const DIR: Record<Lang, 'rtl' | 'ltr'> = { he: 'rtl', ar: 'rtl', ru: 'ltr', en: 'ltr' };
export const NATIVE: Record<Lang, string> = { he: 'עברית', ar: 'العربية', ru: 'Русский', en: 'English' };
export const SHORT: Record<Lang, string> = { he: 'עב', ar: 'عر', ru: 'Ру', en: 'En' };
export const OG_LOCALE: Record<Lang, string> = { he: 'he_IL', ar: 'ar_IL', ru: 'ru_RU', en: 'en_US' };

export type Dict = typeof he;
const DICTS: Record<Lang, Dict> = { he, ar: ar as Dict, ru: ru as Dict, en: en as Dict };

export const t = (lang: Lang): Dict => DICTS[lang];

export type Page = '' | 'parents/' | 'privacy/';

/** Site-relative URL of a page in a language. Hebrew lives at the root. */
export function href(lang: Lang, page: Page = ''): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return `${base}/${lang === DEFAULT_LANG ? '' : lang + '/'}${page}`;
}

/** Absolute URL (for canonical / hreflang / OG). */
export function abs(lang: Lang, page: Page = ''): string {
  return new URL(href(lang, page), import.meta.env.SITE).toString();
}

/** Replace {name} placeholders. */
export function fmt(s: string, vars: Record<string, string | number>): string {
  return s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));
}
