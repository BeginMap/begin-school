// Hidden slot for real quotes from pupils. Empty on purpose: nothing here may be invented.
// When the school provides genuine quotes (with permission), add them and set FLAGS.testimonials = true
// in src/data/facts.ts. One entry per language version of a quote.
export interface Quote { lang: 'he' | 'ar' | 'ru' | 'en'; text: string; who: string }
export const TESTIMONIALS: Quote[] = [];
