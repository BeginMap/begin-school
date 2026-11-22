// Curated photos and wall textures taken from Begin Map (beginmap/begin-nav, read-only).
// Every photo was looked at before use; see CREDITS.md for the decision on each one.
//   src   — path inside begin-nav/public
//   crop  — [x, y, w, h] as fractions of the original (removes close faces / alcohol ads)
//   fb    — came from Facebook (`credit: "fb"` in Begin Map); hidden at once by FLAGS.fbPhotos
//   color — also build a colour version (colour appears only in the finale)
//   plan  — position on the 2000×1500 Begin Map plan (for the campus hotspots)
// Captions / alt texts live in src/i18n/<lang>.json → photos.<id>

export interface PhotoDef {
  id: string;
  src: string;
  crop?: [number, number, number, number];
  fb?: boolean;
  color?: boolean;
  plan?: [number, number];
  /** widest variant worth building (small wall textures stay small) */
  max?: number;
}

export const PHOTOS: PhotoDef[] = [
  // gate & street
  { id: 'gate-1', src: 'photos/gate/gate-1.jpg', plan: [1076, 1896] },
  { id: 'gate-2', src: 'photos/gate/gate-2.jpg', plan: [1076, 1896] },
  { id: 'gate-5', src: 'photos/gate/gate-5.jpg', plan: [1076, 1896] },
  { id: 'gate-6', src: 'photos/gate/gate-6.jpg', plan: [1076, 1896] },
  { id: 'gate-8', src: 'photos/gate/gate-8.jpg', plan: [1076, 1896] },
  { id: 'gate-9', src: 'photos/gate/gate-9.jpg', plan: [980, 1781] },
  { id: 'gate-10', src: 'photos/gate/gate-10.jpg', plan: [980, 1781] },
  { id: 'street-1', src: 'photos/street/street-1.jpg', plan: [1376, 1816] },
  { id: 'street-4', src: 'photos/street/street-4.jpg', plan: [1376, 1816], crop: [0.2, 0.0, 0.66, 0.78] },
  { id: 'street-7', src: 'photos/street/street-7.jpg', plan: [1376, 1816] },
  // courtyard
  { id: 'courtyard-north', src: 'photos/courtyard-north-b.jpg', plan: [869, 929], color: true },
  { id: 'courtyard-tall', src: 'photos/courtyard-north-b.jpg', plan: [869, 929], color: true, crop: [0.3, 0, 0.42, 1] },
  { id: 'courtyard-east', src: 'photos/courtyard-east-b.jpg', plan: [1227, 992] },
  { id: 'yard-1', src: 'photos/yard/yard-1-c.jpg', plan: [826, 1078] },
  { id: 'yard-3', src: 'photos/yard/yard-3-c.jpg', plan: [826, 1078], color: true },
  { id: 'yard-5', src: 'photos/yard/yard-5-c.jpg', plan: [826, 1078] },
  { id: 'yard-9', src: 'photos/yard/yard-9-c.jpg', plan: [826, 1078] },
  { id: 'yard-10', src: 'photos/yard/yard-10-c.jpg', plan: [826, 1078] },
  { id: 'yard-13', src: 'photos/yard/yard-13-c.jpg', plan: [826, 1078] },
  { id: 'yard-14', src: 'photos/yard/yard-14-c.jpg', plan: [826, 1078] },
  { id: 'yard-15', src: 'photos/yard/yard-15-c.jpg', plan: [826, 1078] },
  // halls
  { id: 'eshkol-3', src: 'photos/eshkol/eshkol-3.jpg', plan: [1835, 800] },
  { id: 'eshkol-4', src: 'photos/eshkol/eshkol-4.jpg', plan: [1835, 800] },
  { id: 'pis-1', src: 'photos/pis/pis-1.jpg', plan: [35, 200] },
  { id: 'pis-2', src: 'photos/pis/pis-2.jpg', plan: [35, 200] },
  // events — from Facebook, faces already blurred in Begin Map; crops remove close-ups and an alcohol ad
  { id: 'ev-1', src: 'photos/event/ev-1-b.jpg', fb: true, plan: [912, 1149] },
  { id: 'ev-6', src: 'photos/event/ev-6.jpg', fb: true, plan: [993, 1106] },
  { id: 'ev-8', src: 'photos/event/ev-8-c.jpg', fb: true, plan: [940, 1185], crop: [0, 0, 1, 0.56] },
  { id: 'hall-2', src: 'photos/hall/hall-2-b.jpg', fb: true, plan: [190, 165] },
  { id: 'hall-3', src: 'photos/hall/hall-3-b.jpg', fb: true, plan: [190, 165] },
  { id: 'hall-4', src: 'photos/hall/hall-4-b.jpg', fb: true, plan: [190, 165], crop: [0, 0.48, 1, 0.52] },
  { id: 'court-2', src: 'photos/court/court-2-b.jpg', fb: true, plan: [1130, 230], crop: [0, 0.5, 1, 0.5] },
  { id: 'court-3', src: 'photos/court/court-3-b.jpg', fb: true, plan: [1130, 230] },
  { id: 'htb-1', src: 'photos/htb/htb-1-b.jpg', fb: true, plan: [886, 615] },
  { id: 'htb-2', src: 'photos/htb/htb-2-b.jpg', fb: true, plan: [886, 615] },
  { id: 'htb-3', src: 'photos/htb/htb-3.jpg', fb: true, plan: [886, 615] },
  { id: 'eshkol-1', src: 'photos/eshkol/eshkol-1-c.jpg', fb: true, plan: [1835, 800], crop: [0, 0.05, 1, 0.57] },
  { id: 'eshkol-2', src: 'photos/eshkol/eshkol-2-b.jpg', fb: true, plan: [1835, 800], crop: [0, 0.06, 1, 0.58] },
  // the school plan (Begin Map), cropped around the route entrance → דולפין
  { id: 'plan-route', src: 'maps/plan.jpg', crop: [0.35, 0.3733, 0.22, 0.6133], max: 440 },
  // corridor wall textures (rectified pieces of the Begin Map author's photos)
  { id: 'door-dolphin', src: 'models/ehall/cor_s.jpg', max: 1152 },
  { id: 'wall-marganit', src: 'models/ehall/k_cor_marg.jpg', max: 1500 },
  { id: 'board-books', src: 'models/ehall/k_board_books.jpg', max: 1600 },
  { id: 'board-art', src: 'models/ehall/k_board_art.jpg', max: 1600 },
  { id: 'board-music', src: 'models/ehall/k_board_music.jpg', max: 1600 },
  { id: 'board-sport', src: 'models/ehall/k_board_sport_a.jpg', max: 1600 },
  { id: 'wall-words', src: 'models/ehall/s_words.jpg', max: 1024 },
  { id: 'wall-music', src: 'models/ehall/t_music.jpg', max: 640 },
  { id: 'plaque-kalanit', src: 'models/ehall/k_plaque_kalanit.jpg', max: 300 },
  { id: 'plaque-iris', src: 'models/ehall/k_plaque_iris.jpg', max: 300 },
  { id: 'plaque-narkis', src: 'models/ehall/k_plaque_narkis.jpg', max: 300 },
  { id: 'plaque-hatzav', src: 'models/ehall/k_plaque_hatzav.jpg', max: 300 },
  { id: 'plaque-tzivoni', src: 'models/ehall/k_plaque_tzivoni.jpg', max: 300 },
];

export const PHOTO_BY_ID = Object.fromEntries(PHOTOS.map((p) => [p.id, p]));
