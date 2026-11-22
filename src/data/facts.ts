// Facts about the school. Every fact carries a status.
//   verified: true  → shown as a plain fact
//   verified: false → shown only in a neutral / attributed form, or hidden (see `show`)
// When the school confirms a fact: set verified: true (and fill `value` if needed), rebuild.
// Every unverified fact has a line in CONTENT-CHECKLIST.md.

export interface Fact<T = string> {
  verified: boolean;
  /** what to do while unverified: 'hide' | 'attributed' (shown with its source) | 'neutral' (shown without specifics) */
  show: 'hide' | 'attributed' | 'neutral' | 'plain';
  value: T | null;
  source: string;
}

const f = <T>(x: Fact<T>) => x;

export const FACTS = {
  fullName: f({ verified: true, show: 'plain', value: 'בית ספר תיכון ע"ש מנחם בגין, אילת', source: 'Wikipedia (he), rev. 16.10.2026; sign at the main gate (photo gate-2)' }),
  namedAfter: f({ verified: true, show: 'plain', value: 'Menachem Begin, 6th Prime Minister of Israel', source: 'Wikipedia (he)' }),
  structure: f({ verified: true, show: 'plain', value: 'six-year state school, ז׳–ט׳ middle + י׳–י״ב upper', source: 'Wikipedia (he); separate חט"ב / חט"ע zones in Begin Map' }),
  busStop: f({ verified: true, show: 'plain', value: 'תיכון בגין / מלכת שבא', source: 'Begin Map photo street-4' }),
  shelters: f({ verified: true, show: 'plain', value: '4', source: 'Begin Map data/rooms.json (category shelter)' }),
  publicShelterSign: f({ verified: true, show: 'plain', value: 'בבית ספר זה יש מרחב מוגן פתוח לציבור', source: 'Begin Map photo gate-8' }),
  computerRooms: f({ verified: true, show: 'plain', value: '9', source: 'Begin Map data/rooms.json (category computers)' }),

  // ---- to be confirmed by the school
  street: f({ verified: true, show: 'plain', value: 'מלכת שבא', source: 'all sources agree on the street; bus stop name' }),
  houseNumber: f({ verified: false, show: 'hide', value: null as string | null, source: 'Wikipedia: מלכת שבא 2; Eilat municipality school list (eilat.muni.il/רשימת-בתי-הספר/): מלכת שבא 28' }),
  phone: f({ verified: false, show: 'attributed', value: '08-6336792', source: 'Eilat municipality school list https://eilat.muni.il/רשימת-בתי-הספר/ ; several directories' }),
  founded: f({ verified: false, show: 'hide', value: '1994', source: 'Wikipedia infobox' }),
  students: f({ verified: false, show: 'hide', value: '1485', source: 'Wikipedia (2025)' }),
  classes: f({ verified: false, show: 'hide', value: '44', source: 'Wikipedia (2025)' }),
  grade13: f({ verified: false, show: 'hide', value: 'י״ג — ניהול משפטי', source: 'Wikipedia' }),
  majorsArts: f({ verified: false, show: 'attributed', value: 'מחול, מוזיקה', source: 'Wikipedia, eilat.city' }),
  blueSteel: f({ verified: false, show: 'hide', value: 'פלדה כחולה — IAF programme from ט׳', source: 'Wikipedia; rooms «פלדה כחולה» exist in Begin Map' }),
  ulpan: f({ verified: false, show: 'neutral', value: null, source: 'room «אולפן» exists in Begin Map; programme unknown' }),
  bellTimes: f({ verified: false, show: 'hide', value: null, source: 'unknown' }),
  levels: f({ verified: false, show: 'hide', value: null, source: 'unknown (הקבצות in maths / English)' }),
  roomChanges: f({ verified: false, show: 'hide', value: null, source: 'unknown (do pupils change rooms between lessons?)' }),
  openDay: f({ verified: false, show: 'hide', value: null, source: 'unknown (welcome day for new pupils)' }),
  uniform: f({ verified: false, show: 'hide', value: null, source: 'unknown' }),
  firstDayKit: f({ verified: false, show: 'hide', value: null, source: 'unknown' }),
  registration: f({ verified: false, show: 'attributed', value: null, source: 'MoE circular 0386 (1.2.2023): the local authority assigns elementary pupils to a middle school and notifies parents; Eilat registration page https://eilat.muni.il/רישום-תלמידים/ covers א׳ and kindergartens only' }),
};

export const LINKS = {
  beginMap: 'https://beginmap.github.io/begin-nav/',
  muniSchools: 'https://eilat.muni.il/%D7%A8%D7%A9%D7%99%D7%9E%D7%AA-%D7%91%D7%AA%D7%99-%D7%94%D7%A1%D7%A4%D7%A8/',
  muniRegistration: 'https://eilat.muni.il/%D7%A8%D7%99%D7%A9%D7%95%D7%9D-%D7%AA%D7%9C%D7%9E%D7%99%D7%93%D7%99%D7%9D/',
  repo: 'https://github.com/BeginMap/begin-school',
};

// Main gate, from Begin Map GPS calibration anchors (data/calibration.json, plan point 1025,1808)
export const GATE = { lat: 29.5620174, lng: 34.9392256 };
export const MAPS = {
  google: `https://www.google.com/maps/search/?api=1&query=${GATE.lat},${GATE.lng}`,
  waze: `https://waze.com/ul?ll=${GATE.lat},${GATE.lng}&navigate=yes`,
};

// Feature flags
export const FLAGS = {
  /** 20 event photos come from Facebook; publication rights are unconfirmed. PUBLIC_FB_PHOTOS=0 hides all of them at once. */
  fbPhotos: (import.meta.env.PUBLIC_FB_PHOTOS ?? '1') !== '0',
  /** Real quotes from pupils — hidden until the school provides genuine ones (see src/data/testimonials.ts). */
  testimonials: false,
};
