# Credits and photo decisions

## Sources

- **Photos, corridor textures, school plan, building outlines, room names, walk grid, evacuation data:** Begin Map (`beginmap/begin-nav`), made by its author from their own photos — "фото: Begin Map". Copied by `scripts/import-assets.mjs`, never hot-linked.
- **20 event photos marked `credit: "fb"` in Begin Map** come from Facebook posts. Faces were already blurred in Begin Map (`-b`/`-c` versions are the only ones used). Publication rights are **not confirmed** — see CONTENT-CHECKLIST.md. All of them disappear at once with `PUBLIC_FB_PHOTOS=0`.
- **Font:** Rubik (SIL Open Font License 1.1), self-hosted via Fontsource.
- **Libraries:** Astro (MIT), GSAP + ScrollTrigger (GSAP Standard No-Charge License), Lenis (MIT), qrcode (MIT), sharp (Apache-2.0).
- Municipality list of schools (phone, attributed): https://eilat.muni.il/רשימת-בתי-הספר/

## Every photo, looked at before use

Rule (brief §14 + Begin Map owner's rule): no recognisable pupil's face in close-up; only face-blurred versions; crops remove close-ups.

| id | source | used in | decision |
|---|---|---|---|
| gate-1, gate-2, gate-5, gate-6, gate-8, gate-9, gate-10 | Begin Map | day, campus, getting, safe, parents | no people |
| street-1, street-4, street-7 | Begin Map | day, campus, getting | no people; street-4 cropped to the stop sign |
| courtyard-north | Begin Map | day, campus, finale (colour), OG | distant small figures only |
| courtyard-east | Begin Map | campus | no people |
| yard-1, yard-9, yard-10 | Begin Map | campus, parents | small distant figures, faces already blurred |
| yard-3, yard-5, yard-13, yard-14, yard-15 | Begin Map | day, campus, life | yard-15 has two pupils from behind/blurred — kept small in the campus dialog only |
| eshkol-3, eshkol-4 | Begin Map | campus, life | empty foyer |
| pis-1, pis-2 | Begin Map | day, campus | no people |
| ev-1 | Facebook | life, campus | wide shot, faces blurred, people small |
| ev-6 | Facebook | life, campus | prizes only, no people |
| ev-8 | Facebook | life, campus | **cropped to the top 56 %** (confetti, sky, buildings) — the crowd of pupils below is cut out |
| hall-2 | Facebook | life, campus | dancers far away, dark, blurred |
| hall-3 | Facebook | life, campus | ceremony from a distance, faces blurred |
| hall-4 | Facebook | life, campus | **cropped to the lower 52 %** — removes an alcohol (0.0 % beer) advert above the stage |
| court-2 | Facebook | life, campus | **cropped to the lower half** — wheelchair wheels and cones only, the pupil's head is cut out |
| court-3 | Facebook | life, campus | football from behind, distant |
| htb-1, htb-2, htb-3 | Facebook | life, campus | decorated corridors, no pupils |
| eshkol-1 | Facebook | life, campus | **cropped to 5–62 %**: stage and speaker; audience heads cut out |
| eshkol-2 | Facebook | life, campus | **cropped to 6–64 %**: memorial ceremony on stage, figures small and blurred; audience cut out |
| ev-2, ev-3, ev-4, ev-5, ev-7, hall-1, court-1 | Facebook | **not used** | close-ups of pupils with prizes / crowd close-up / girl in close-up / alcohol advert (hall-1) |
| corridor textures (door-dolphin, wall-marganit, board-*, wall-words, wall-music, plaque-*) | Begin Map `public/models/ehall` | day, names, life | rectified pieces of walls; no pupils. Not used: `k_sign_elec` (staff name), `post_a` (memorial poster with a person), `v_nobel` (portraits), `kitot` (dated notice) |
| plan-route | Begin Map `public/maps/plan.jpg` | Begin Map phone | crop of the school plan around the route |

Begin Map icon (`icons/icon-192.png`) is used only in the "You won't get lost" block, as the brief asks.
