# Content checklist — what the school must confirm

Everything here is either hidden on the site or shown only in a neutral / attributed form until confirmed.
**How to switch a fact on:** set `verified: true` (and `value`) in `src/data/facts.ts`, edit the four texts in `src/i18n/*.json` if the wording should become definite, rebuild (`npm run build`) and push.

Most important first. "Where on the site" names the section / key.

| # | Question for the school | Current status / source | Where on the site | Ask whom |
|---|---|---|---|---|
| 1 | **May we publish the 20 Facebook event photos?** (13 are used, all face-blurred and cropped, list in CREDITS.md) | Unconfirmed rights. Shown by default; `PUBLIC_FB_PHOTOS=0` hides all of them | Life, campus hotspots | Principal / spokesperson |
| 2 | **How do pupils get into ז׳ at Begin in Eilat, and when?** Registration dates, assignment (רובע), welcome letters | MoE circular 0386: the local authority assigns and notifies. Eilat's registration page covers only א׳ and kindergartens | FAQ (parents), Parents → Registration | School office, municipality education dept. |
| 3 | **Official phone** — is 08-6336792 correct? | Shown *attributed* to the municipality list (eilat.muni.il/רשימת-בתי-הספר/) | Finale, FAQ, Parents → Contact | School office |
| 4 | **Exact address**: מלכת שבא 2 (Wikipedia) or מלכת שבא 28 (municipality)? | Street shown, number hidden | Getting here, Parents → Route | School office |
| 5 | **Welcome / orientation day for new ז׳ pupils** — is there one, when? | Hidden | could go to Day + FAQ | Middle-school (חט״ב) coordinator |
| 6 | **Bell times and length of the day** | Hidden; the site says "the school will announce" | Day, FAQ (kids) | חט״ב office |
| 7 | **What to bring on the first day; uniform (תלבושת אחידה)** | Hidden; FAQ says "the school will send a list" | FAQ (kids), Parents → pending list | חט״ב office |
| 8 | **Ability groups (הקבצות) in maths and English?** | Hidden | Parents → pending list | Pedagogical coordinator |
| 9 | **Do pupils change rooms between lessons or stay in their class?** | Hidden | could go to Changes | חט״ב coordinator |
| 10 | **Support for new immigrants (ulpan)** — is there a programme? | Neutral: "there is a room called אולפן — ask the school" | FAQ (parents), Parents → New immigrants | Counsellor (יועצת) |
| 11 | **Special majors: dance (מחול) and music (מוזיקה) — still current? Full list of מגמות** | Shown *attributed* ("according to public sources… check with the school"); the 2016 list is not published | Life note, FAQ | Upper-school (חט״ע) coordinator |
| 12 | **"פלדה כחולה" (Air Force programme from ט׳)** — current, who can join? | Hidden (rooms with this name exist on the map) | could go to Life | חט״ע coordinator |
| 13 | **Founded 1994?** | Hidden | — | Office |
| 14 | **≈1485 pupils, 44 classes (2025)?** | Hidden (no counters with unconfirmed numbers) | — | Office |
| 15 | **י״ג track "ניהול משפטי"** | Hidden | — | חט״ע coordinator |
| 16 | **Official website / social pages** to link from the footer | Old site begin.edu1.org.il is dead (DNS does not resolve); none linked. Careful: beginhs.co.il is a different school (Rosh HaAyin) | Footer | Office |
| 17 | **Is the site endorsed by the school?** If yes, the footer line "not the official site" can change | Footer says it is made by the Begin Map team | Footer | Principal |
| 18 | **Real quotes from pupils** (with permission) | Hidden slot `src/data/testimonials.ts`, `FLAGS.testimonials` | Life | Pupils' council via the school |
| 19 | **Room-name themes** — are the groups right (birds, flowers, sea, trees, Negev & Arava, heroes of the Tanakh, aircraft)? | Built only from words whose meaning is certain; uncertain names left out | Names | Any teacher |
| 20 | **Shelters and evacuation** — still 4 ממ״ד (library, חט״ב, two in חט״ע) and the earthquake plan from the official scheme? | From Begin Map data | Safe, Parents | Safety officer |

## Sources used

- Wikipedia (he), revision 16.10.2026 — name, namesake, structure.
- Eilat municipality, list of schools: https://eilat.muni.il/רשימת-בתי-הספר/ (address "מלכת שבא 28", phone 08-6336792, institution code 644492). The principal's name is listed there; **not published on this site** by rule.
- Eilat municipality, pupil registration: https://eilat.muni.il/רישום-תלמידים/ (א׳ and kindergartens only).
- Ministry of Education circular 0386 (1.2.2023): https://apps.education.gov.il/Mankal/Horaa.aspx?siduri=485
- Begin Map data and photos (author's own survey).

## Never published (by rule)

Names of the principal or teachers, grades, rankings, bagrut pass rates, "best school in town", pupil quotes that were not provided by the school.
