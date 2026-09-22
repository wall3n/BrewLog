---
name: BrewLog
description: A roastery QC lab sheet for logging and dialling in coffee extractions.
colors:
  lab-paper: "#F4F5F2"
  fill-cell: "#FBFBF9"
  pressed-well: "#E9ECE8"
  hairline: "#D3D8D3"
  section-rule: "#1C1F1E"
  graphite: "#1C1F1E"
  graphite-secondary: "#545B58"
  graphite-tertiary: "#6A716D"
  ballpoint-ink: "#1F4FD1"
  ink-pressed: "#173DA6"
  ink-faded: "#9DB2EC"
  ink-wash: "rgba(31, 79, 209, 0.07)"
  on-ink: "#FFFFFF"
  dialled-green: "#2B7A57"
  dialled-wash: "rgba(43, 122, 87, 0.09)"
  adjust-amber: "#9A5E0C"
  adjust-wash: "rgba(154, 94, 12, 0.09)"
  fail-red: "#B0392D"
  fail-wash: "rgba(176, 57, 45, 0.08)"
  grid-line: "rgba(28, 31, 30, 0.055)"
  scrim: "rgba(20, 22, 21, 0.42)"
typography:
  display:
    fontFamily: "'Archivo Variable', 'Archivo', ui-sans-serif, system-ui, sans-serif"
    fontSize: "36px"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.015em"
    fontVariation: "'wdth' 78"
  headline:
    fontFamily: "'Archivo Variable', 'Archivo', ui-sans-serif, system-ui, sans-serif"
    fontSize: "20px"
    fontWeight: 650
    lineHeight: 1.05
    letterSpacing: "-0.01em"
    fontVariation: "'wdth' 82"
  readout:
    fontFamily: "'Archivo Variable', 'Archivo', ui-sans-serif, system-ui, sans-serif"
    fontSize: "40px"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: "-0.03em"
    fontFeature: "\"tnum\" 1, \"lnum\" 1"
    fontVariation: "'wdth' 88"
  readout-field:
    fontFamily: "'Archivo Variable', 'Archivo', ui-sans-serif, system-ui, sans-serif"
    fontSize: "28px"
    fontWeight: 500
    lineHeight: 1.05
    letterSpacing: "-0.02em"
    fontFeature: "\"tnum\" 1, \"lnum\" 1"
    fontVariation: "'wdth' 90"
  timer:
    fontFamily: "'Archivo Variable', 'Archivo', ui-sans-serif, system-ui, sans-serif"
    fontSize: "80px"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "-0.04em"
    fontFeature: "\"tnum\" 1, \"lnum\" 1"
    fontVariation: "'wdth' 90"
  title:
    fontFamily: "'Archivo Variable', 'Archivo', ui-sans-serif, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 600
    lineHeight: 1.25
  body:
    fontFamily: "'Archivo Variable', 'Archivo', ui-sans-serif, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.45
    fontFeature: "\"tnum\" 1, \"lnum\" 1"
    fontVariation: "'wdth' 100"
  action:
    fontFamily: "'Archivo Variable', 'Archivo', ui-sans-serif, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 600
    lineHeight: 1.45
  label:
    fontFamily: "'Archivo Variable', 'Archivo', ui-sans-serif, system-ui, sans-serif"
    fontSize: "11.5px"
    fontWeight: 600
    letterSpacing: "0.07em"
    fontVariation: "'wdth' 75"
rounded:
  hair: "1px"
  frame: "2px"
  inner: "3px"
  control: "4px"
  sheet-desktop: "8px"
  sheet: "10px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  block: "32px"
  page: "40px"
components:
  button-primary:
    backgroundColor: "{colors.ballpoint-ink}"
    textColor: "{colors.on-ink}"
    typography: "{typography.action}"
    rounded: "{rounded.control}"
    padding: "10px 18px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.ink-pressed}"
  button-primary-lg:
    backgroundColor: "{colors.ballpoint-ink}"
    textColor: "{colors.on-ink}"
    rounded: "{rounded.control}"
    padding: "14px 22px"
    height: "54px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.graphite}"
    typography: "{typography.action}"
    rounded: "{rounded.control}"
    padding: "10px 18px"
    height: "44px"
  button-ghost-hover:
    backgroundColor: "{colors.fill-cell}"
  button-danger:
    backgroundColor: "transparent"
    textColor: "{colors.fail-red}"
    rounded: "{rounded.control}"
    padding: "10px 18px"
    height: "44px"
  button-danger-hover:
    backgroundColor: "{colors.fail-wash}"
  input-field:
    backgroundColor: "{colors.fill-cell}"
    textColor: "{colors.ballpoint-ink}"
    rounded: "{rounded.control}"
    padding: "10px 12px"
    height: "44px"
  stepper:
    backgroundColor: "{colors.fill-cell}"
    textColor: "{colors.ballpoint-ink}"
    typography: "{typography.readout-field}"
    rounded: "{rounded.control}"
    height: "56px"
  chip:
    backgroundColor: "{colors.fill-cell}"
    textColor: "{colors.graphite}"
    rounded: "{rounded.control}"
    padding: "6px 12px"
    height: "36px"
  chip-active:
    backgroundColor: "{colors.ink-wash}"
    textColor: "{colors.ballpoint-ink}"
  readout-cell:
    backgroundColor: "{colors.fill-cell}"
    textColor: "{colors.ballpoint-ink}"
    typography: "{typography.readout}"
    padding: "12px 12px 10px"
  flag-stamp:
    textColor: "{colors.dialled-green}"
    typography: "{typography.label}"
    rounded: "{rounded.frame}"
    padding: "4px 8px 4px 6px"
  nav-log:
    backgroundColor: "{colors.ballpoint-ink}"
    textColor: "{colors.on-ink}"
    rounded: "{rounded.control}"
    width: "64px"
    height: "48px"
  sheet:
    backgroundColor: "{colors.lab-paper}"
    rounded: "{rounded.sheet}"
    padding: "8px 16px 24px"
---

# Design System: BrewLog

## Overview

**Creative North Star: "The QC Lab Sheet"**

Every extraction is a sample on a roastery quality-control sheet, the kind a refractometer report prints onto. The form itself is printed in graphite on cool lab paper: condensed caps labels, hairline rules, heavy rules between sections. Everything the user wrote on the form is in ballpoint-blue ink. The screen reads as a filled-in sheet, not as an app dashboard. The difference between printed and written is the main visual device.

The density suits a working form. Numbers are the product, so readouts are big (40px on Home, 80px on the timer face), always tabular, and framed in fill-in cells. Surfaces stay flat and ruled. Depth appears only when something lies on top of the sheet (a bottom sheet, a dropdown). Color is rare on purpose: outside the ink, only the three outcome colors appear, and each one comes with a mark, so the sheet still reads in greyscale.

The world rejects the café category default of brown cards, a gold accent and serif headings. It also rejects generic SaaS cards and a dark-only moody look. Dark theme is the same sheet in graphite with pale ink, not a different mood.

**Key Characteristics:**
- Graphite printed form, ballpoint-blue logged values.
- One variable family (Archivo) with its width axis carrying the hierarchy: condensed caps for printed labels, normal width for body.
- Tabular, lining figures everywhere.
- Ruled blocks instead of cards; boxes only for fill-in fields and controls.
- The measurement grid appears only behind data.
- Outcome color is always paired with a tick, delta or cross mark.

## Colors

A cool, near-neutral paper and graphite palette with one ink (ballpoint blue) and three outcome colors held in reserve.

### Primary
- **Ballpoint Ink** (`ballpoint-ink`): every value the user logged (dose, yield, ratio, time, grind, temperature, tasting cells, notes, flavour tags, selected method), the caret, focus rings, and the primary action. Hover and press darken to **Ink Pressed** (`ink-pressed`). **Ink Wash** (`ink-wash`) is the selected-state fill behind a user's choice. **Ink Faded** (`ink-faded`) outlines logged flavour tags.

### Tertiary (outcome only)
- **Dialled Green** (`dialled-green`), **Adjust Amber** (`adjust-amber`), **Fail Red** (`fail-red`): the three extraction outcome flags, with their washes (`dialled-wash`, `adjust-wash`, `fail-wash`) as the selected fill of the outcome toggles. Fail Red also marks destructive actions and the save-blocking warning.

### Neutral
- **Lab Paper** (`lab-paper`): the page, the sidebar, the bottom bar and the sheet overlay.
- **Fill Cell** (`fill-cell`): inside fill-in fields, steppers, chips, and filled readout cells.
- **Pressed Well** (`pressed-well`): hover and press rows, segmented-control track, chart bar track.
- **Hairline** (`hairline`): 1px rules between rows, field borders, cell dividers.
- **Section Rule** (`section-rule`): the 1px (Home readout: 2px) heavy rule on top of every section block and ledger.
- **Graphite** (`graphite`), **Graphite Secondary** (`graphite-secondary`), **Graphite Tertiary** (`graphite-tertiary`): printed text, printed labels and units, and hints/metadata.
- **Grid Line** (`grid-line`): the 12px measurement grid.

The dark theme redefines every token under `[data-theme="dark"]` and under `prefers-color-scheme: dark` (system). The values are in the sidecar. The build tuned three contract values: green `#2E7D5B` became `#2B7A57`, secondary `#5E6562` became `#545B58` and hairline `#D5D9D5` became `#D3D8D3`. The build values are normative.

### Named Rules
**The Ballpoint Rule.** Ink blue marks only what the user logged and the primary action. Computed values (EY, averages, auto-solved recipe numbers, counts) print in graphite. If the user did not write it, it is not blue.

**The Outcome-Only Rule.** Green, amber and red belong to the Dialled In / Needs Adjustment / Failure flags and nothing else. They never appear without a mark (tick, delta, cross), so a flag still reads in greyscale.

**The Graphite Mark Rule.** Bean freshness and roast level are printed as graphite marks, not color. Freshness is a filled dot when the bean is in the window and a hollow dot when it is outside. Roast is hollow, half or full for light, medium or dark.

## Typography

**Display Font:** Archivo Variable, condensed through the `wdth` axis (with Archivo, ui-sans-serif, system-ui fallbacks)
**Body Font:** Archivo Variable at normal width
**Label/Mono Font:** Archivo Variable at `wdth` 75, uppercase; figures use tabular lining numerals (`tnum`, `lnum`) globally, and no separate mono face is used

**Character:** One grotesque carries the whole sheet. Width does the work that a second family would do elsewhere: narrow and heavy for the printed headings, compressed caps for the form labels, full width for reading.

### Hierarchy
- **Display** (700, 36px / 30px under 1024px, line-height 1, `wdth` 78): page titles. Detail titles use the same cut at 34px, the brew sheet title at 28px, the welcome logo at 56px / 48px.
- **Headline** (650, 20px, `wdth` 82): section headings in blocks that need a heading word, not a label. Bean name on Home is 24px, `wdth` 84.
- **Readout** (500, 40px / 36px under 560px, `wdth` 88, -0.03em): Home's last-shot numerals. The detail readout grids use 30px, steppers 28px (21px at the medium size), the timer 80px / 64px at weight 400. Units sit beside the value at 14 to 16px in graphite secondary.
- **Title** (600, 16px, 1.25): ledger row titles; 17px for the bean row on the brew sheet.
- **Body** (400, 15px, 1.45): running text. Notes cap at 60ch.
- **Label** (600, 11.5px, 0.07em, uppercase, `wdth` 75): every printed form label, table head, section label, method badge and flag mark (flag marks at 700). Field-row keys use 10.5px in graphite tertiary.

### Named Rules
**The Printed Label Rule.** A printed label is always condensed caps in graphite. A written value is never caps and never condensed.

**The Below-the-Heading Rule.** Metadata (sample number, method, logged date, roast level, outcome stamp) sits in a ruled field row *under* the heading, label over value, split by hairlines. It never stands above a heading as a kicker.

**The Tabular Rule.** Every number is tabular and lining, so columns of shots align digit for digit.

## Layout

Mobile-first, single column. Content sits in a centered column (max 840px, 920px at 1440px and up; Home and the brew sheet narrow to 720px). The page padding is 16px on phones, 24px / 32px from 640px, and 40px (48px wide) on desktop. Under 1024px a fixed bottom bar holds four tabs and a central ink "log" key (64 × 48px). From 1024px a 248px left sidebar (264px at 1440px) replaces it, with the wordmark at the top.

Blocks stack with 28 to 36px between them (32px is the usual gap). Inside a block, the rhythm is 4 / 8 / 12 / 16px. Readout grids have three columns and drop to two under 480px. Home readings have four columns and drop to two under 560px. Parameter steppers sit in a two-column grid (16px row gap, 12px column gap). Touch targets are at least 44px (`--tap`). Primary rows are 56 to 64px.

The brew sheet ends in a sticky save bar ruled with a section rule. It shows the running summary in ink and the save state.

### Named Rules
**The Grid-Behind-Data Rule.** The 12px measurement grid sits only behind filled readout cells, the timer face and the chart. Empty tracks, page backgrounds and forms stay plain paper.

## Elevation & Depth

The sheet is flat. Sections are separated by rules and tone (paper, fill cell, pressed well), not by shadows. Shadows appear only when a layer physically lies on top of the sheet. The one small exception is the raised active segment in a segmented toggle.

### Shadow Vocabulary
- **Sheet** (`box-shadow: 0 -8px 32px rgba(20,22,21,0.12), 0 -1px 4px rgba(20,22,21,0.06)`): bottom sheets and the More sheet on phones.
- **Pop** (`box-shadow: 0 8px 24px rgba(20,22,21,0.12), 0 2px 6px rgba(20,22,21,0.06)`): centered modal from 640px, filter dropdown menu.
- **Segment lift** (`box-shadow: 0 1px 2px rgba(0,0,0,0.12)`): active segment in segmented toggles only.
- **Focus halo** (`box-shadow: 0 0 0 3px` ink wash): focused fields, search bar and stepper.

### Named Rules
**The Ruled Block Rule.** A section is a ruled block: a section rule on top, a condensed-caps label, content, and no box, no radius, no fill. Bordered boxes are only for things you fill in or press (fields, steppers, chips, method and outcome toggles, the readout frame, the timer face).

## Shapes

The corners are nearly square. Controls use 4px. Readout frames, the timer face, the chart box and the outcome stamp use 2px. Tasting score cells use 1px. Inner segments of steppers and toggles use 3px. Only overlays soften: the bottom sheet uses 10px top corners and the centered modal 8px. Circles are reserved for the freshness and roast marks, and the slider thumb (22px hollow ring in ink). Dashed borders mean empty or not yet filled: the empty bean slot, the auto-computed recipe cell, empty states and subtle chips.

## Components

### Buttons
Plain printed controls that press in.
- **Shape:** squared (4px).
- **Primary:** ink fill, white text (dark: navy on pale ink), 15px/600, 44px minimum; large variant 54px for the sheet's save and first-run actions. The Home "Next shot" bar is a full-width primary.
- **Hover / Press:** hover darkens to Ink Pressed (hover-capable devices only); press scales to 0.98 over 90ms on the ease-out curve; disabled drops to 40% opacity.
- **Ghost:** transparent with a hairline border and graphite text; hover lifts the border to graphite secondary and fills with fill cell.
- **Danger:** ghost shape with fail-red text; hover fills fail wash.
- **Link:** ink text, 600, no box, 44px tap height.

### Chips
- **Style:** fill cell, hairline border, 4px, 36px high, 13.5px/500 graphite.
- **State:** active chips take ink wash, ink border and ink text (a user's choice is ink). The subtle variant is dashed and transparent. Active filter tags carry an inline remove button.

### Inputs / Fields
- **Style:** printed caps label above, fill-cell box with a hairline border, 4px, 44px, value in ink at 16px/500, placeholder in graphite tertiary.
- **Focus:** border turns ink with a 3px ink-wash halo; no outline inside fields.
- **Stepper (signature):** a three-part cell (44px minus, value, 44px plus) 56px high, value in ink at 28px tabular. It has a hint or target range on the label line and a graphite delta against the previous shot below ("−0.5 vs last", "Same as last").

### Navigation
- **Mobile:** bottom bar on paper with a hairline top, labels 11px/600 condensed, inactive graphite tertiary, active graphite. The center key is the ink log button.
- **Desktop:** sidebar on paper with a hairline right edge. Rows are 40px, 14px/500 graphite secondary; hover and active use a pressed-well fill, and active is graphite at 600.
- **Tabs:** 14px/600 on a hairline base; the active tab is graphite.

### Readout Grid (signature)
Label-over-value cells in a ruled grid on top of the grid paper. Printed caps label, then the ink numeral with a graphite unit. Computed cells (EY, averages) print the numeral in graphite. On Home the readout frame is a 2px-radius hairline box of four readings, each with a graphite delta line under it.

### Field Row
A hairline-ruled strip of label-over-value pairs under a detail heading. Keys are 10.5px caps in tertiary, values 14px/500. The outcome stamp aligns to the far end.

### Outcome Marks
- **Flag mark:** condensed caps at 700 in the outcome color with a 2.25-stroke icon (tick, delta, cross). **Stamp** variant adds a 1.5px currentColor border at 2px radius, like a rubber stamp on the sheet.
- **Outcome toggles:** three 64px cells on fill cell. Selected takes the outcome wash, border and text.

### Ledgers and Tables
Rows under a section rule, split by hairlines, 56 to 64px high. Title 16px/600, sub line 13.5px graphite secondary, logged metrics in ink. Dial-in tables use caps heads, tabular cells, the latest row at 650, and a flag icon at the far column.

### Tasting Cells
Cupping-form boxes, not stars. They are 20px squares with a 1.5px graphite-tertiary outline, filled solid ink when scored, inside 44px tap cells.

### Timer Face
Grid paper box (2px), 80px ink numerals (64px on phones), a caption beneath and a start/stop row. Pour stages run below it as numbered rows; the active stage takes the ink wash.

### Named Rules
**The Unset Until Tasted Rule.** Tasting and outcome start unset on every new sheet, even when prefilled from the last shot. Save stays disabled, with a "mark the outcome" hint, until an outcome is chosen.

**The Ink Settles Rule.** Motion is quiet: 90ms press, 120ms state changes, one ease-out curve (`cubic-bezier(0.16, 1, 0.3, 1)`). The one signature move is ink settling into the paper on readout values (520ms fade from a 4px blur, staggered by 60ms per cell). All animation stops under `prefers-reduced-motion`.

## Do's and Don'ts

### Do:
- **Do** print every logged value in ballpoint ink and every computed value in graphite (The Ballpoint Rule).
- **Do** open every section with a section rule and a condensed-caps label (11.5px, 600, `wdth` 75, 0.07em).
- **Do** put detail metadata in a ruled field row under the heading.
- **Do** pair every outcome color with its tick, delta or cross mark.
- **Do** keep figures tabular and lining, and keep units in graphite secondary beside the value.
- **Do** keep tap targets at 44px or more and primary rows at 56 to 64px.
- **Do** show deltas against the previous shot of the same bean in graphite under the value.
- **Do** keep corners at 4px or less on anything that is not an overlay.

### Don't:
- **Don't** wrap sections in cards (filled, shadowed or rounded containers); sections are ruled blocks.
- **Don't** place a label, eyebrow or kicker above a heading.
- **Don't** use green, amber or red for anything but the outcome flags, and never without a mark.
- **Don't** color freshness or roast; use the graphite filled/hollow and hollow/half/full marks.
- **Don't** put the measurement grid behind forms, empty cells or page backgrounds.
- **Don't** use ink blue for decoration, computed numbers or headings.
- **Don't** drift toward the café default: brown cards, gold accent, serif headings.
- **Don't** prefill tasting or outcome on a new sheet.
