---
version: 1
slug: "src-app-tsx"
primary_target: "src/App.tsx"
related_targets: ["src/screens"]
---

# BrewLog app shell and all screens

Scope: whole-app redesign (all routes). Visitor mode: Operate.
Audience and job: the owner at the brew station on a phone, logging the next dial-in shot in seconds; later reviewing history, beans, analytics.
Constraints: keep every feature and saved field; the 6-step wizard becomes one brew sheet (user approved). Avoid decorative, generic SaaS, dark/moody-only, playful.

## Direction contract

THESIS: Every extraction is a sample on a roastery QC lab sheet. The printed form is graphite; every value the user logged is ballpoint-blue ink. Refuses the category default of brown café cards, gold accent, and serif headings.

OWN-WORLD: Cool lab paper #F4F5F2, graphite ink #1C1F1E, secondary #5E6562, hairline rules #D5D9D5, measurement grid only behind data. Ink blue #1F4FD1 marks user values and the primary action, nothing else. Dialled-in green #2E7D5B by law, adjust amber, fail red, always paired with a mark (tick, delta, cross). Archivo (width axis): condensed caps for printed labels, normal width for body, tabular figures for every number. 0–4px radii, no cards: sections are ruled blocks. Dark theme: graphite sheet, pale ink.

STORY: The user sees the last shot and what changed, believes the next adjustment is one tap away, and logs the next shot without leaving the sheet.

FIRST VIEWPORT: Home on a 390px phone. Top rule: "BrewLog" and sample number + date. Readout block: active bean, then dose → yield, ratio, time in 40–48px ink numerals with printed labels. Full-width ink bar "Next shot" prefilled from the last shot. Below: dial-in trail rows with delta marks. Bottom tab bar, 4 items + log.

FORM: QC lab sheet (refractometer report), position 4 on the grounded list, seed key eae157ea. Signature interaction: brew sheet with steppers, inline timer, and deltas against the previous shot of the same bean.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
