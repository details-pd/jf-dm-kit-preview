# Jonny Fruits Baby DM Kit — Interactive Landing Page

Personalized gift experience for Jonny Fruits (Salesforce contact; baby boy **Henry**,
2026). Doubles as a Pixel Dreams capabilities showcase — and as a **reusable engine**
for future life-event gifts (first reuse: Courtney's baby shower).

Design source: Kharisel's `PD-Jonny-Fruits-Baby-DM-Kit-Design-Assets.ai`
(Drive folder `PD Jonny Fruits Baby DM kit design assets`), Aug 13 handoff.

## Experience flow (v3, per Aug 13 sync)

1. **Intro game box** — "Every great journey has many little steps." CTA *Let's
   celebrate* unboxes the lid → establishing view of the whole board → camera zooms
   to the track start. The first head-pawn waits alone; the second pops in during
   the zoom, before the first draw. *(Beginning-screen redesign pending from
   Kharisel: bulked-up copy, dim background.)*
2. **Board play** — four milestones in draw order: The Team Founding (2018),
   Contract Talks Begin (2021), Signing Day (2022), Henry: Franchise Cornerstone
   (2026). Board slots show white **year cards**; click the deck → shuffle → card
   reveal popup (dimmed backdrop, **X** to close) → the card lands on its slot →
   the heads walk the track there and the **camera follows**. The screen never
   moves on its own — only deck interaction advances it (Sarah's requirement).
3. **After the 4th card** → gift selection (flip cards; choosing one disables the
   rest) → phone/address form → thank-you → free explore (drag/scroll the board,
   click placed cards to revisit).

The claim posts to the "Jonny Fruits Claim Notifier" Apps Script web app
(`apps-script-backups/jonny-fruits-claim-notifier`), which emails the team.

## Re-skinning for a new recipient / event

Everything recipient-specific lives in **`js/config.js`** (`KIT`): name, copy,
milestone faces + year cards + slot transforms, head-pawn images, track waypoints,
gifts, notifier endpoint, pacing. Swap the assets and edit that one file — no
`main.js` changes.

New board art workflow: get the .ai (PDF-compatible), then use the extraction
script (see session scratchpad `extract.py`, or regenerate) to export pieces and
measure slot transforms → drop into `assets/<version>/` + update `KIT.milestones`
and `KIT.board.track`.

## Stack

Plain HTML/CSS/JS + GSAP (vendored). Camera-driven fixed stage (no page scroll) —
same behavior on desktop and mobile. No build step; static hosting
(GitHub Pages: `details-pd.github.io/jf-dm-kit-preview/`). `noindex,nofollow`.

## Running locally

    python3 -m http.server 8788

## Open items

| Item | Status |
| --- | --- |
| Beginning screen | Approved unboxing kept; Kharisel's redesigned mockup pending |
| Gift cards | Gifts are changing; Kharisel's card designs pending (current: emoji fronts + photo backs) |
| Notifier recipients | details@ only → add Kharisel for testing → Sarah at go-live |
| v2 | Frozen at `/v2/` — do not touch |
