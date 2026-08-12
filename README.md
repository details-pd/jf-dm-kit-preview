# Jonny Fruits Baby DM Kit — Interactive Landing Page

Personalized gift experience for Jonny (Salesforce contact; first baby boy due August 2026).
Doubles as a Pixel Dreams capabilities showcase. Target launch: **Aug 3, 2026**.

Source material: Drive folder `2026-06 Jonny Fruits Baby DM Kit`
(Creative Deck script + storyboards, milestone illustrations, Game Board .ai).

## Experience flow (from Creative Deck script + storyboards)

1. **Intro card** — "Every great journey has many little steps." CTA *Let's celebrate*.
   Card floats/swooshes down onto the first square of the board.
2. **Game board = Carlos's "game board empty" export** (Aug 4 handoff), a 3-screen
   vertical scroll at 1920x1080 design size. An invisible SVG path traces the painted
   track and drives the pawn. Jonny's pawn (dedicated export) waits alone above the
   first photo patch. Click deck → shuffle → card reveal → polaroid pins onto its
   black patch → pawn walks the painted track to the spot before the NEXT card
   (after card 1 his wife joins him, animated, before they walk on). The page
   auto-scrolls to follow, and the deck glows/shakes to cue the next draw. 3 draws:
   - Meeting / first date — *"First step of a beautiful journey together."*
   - Wedding — *"A promise to build a life together."*
   - Baby (golden card, bolder outline, slower reveal) — *"Your greatest chapter yet."*
3. **After the 3rd card** the couple walks the final stretch, then the golden card
   zooms "like a window" into the **gift selection page**: 3 cards side by side
   (per Carlos's Aug 4 sketch) — flip any card to peek at contents; choosing one
   disables the others, then the page transitions to a separate name / phone /
   address form (gift + form intentionally split, per Aug 4 decision).
4. **Thank you** — *"Your gift is on its way…"*. Card returns to the board; user can
   freely revisit the milestones.

Gift options (Creative Deck): Once Upon a Bedtime / The Days You'll Treasure /
A Moment Together.

Easter eggs (subtle, must not dictate theme): PD three-pixel logo, Salesforce-style
cloud, basketball in Pacers navy/gold (no trademarked logo).

## Stack

Plain HTML/CSS/JS + GSAP (vendored in `js/vendor/`). No build step — deployable to
any static host. `noindex,nofollow` set; final hosting/URL TBD.

## Running locally

Any static server, e.g.:

    python3 -m http.server 8788

## MVP placeholders / open items

| Item | Status |
| --- | --- |
| Board art | SVG track placeholder — awaiting export from `Game Board .ai` (Carlos) |
| Gift selection design | Placeholder 3-card picker — final design pending |
| Form destination | **Stubbed** (`submitClaim` in `js/main.js`, TODO) — SendGrid email vs. Sheet undecided |
| Mobile approach | Basic responsive pass only — full/vertical-track decision pending (Waheed to confirm) |
| Email piece | Out of scope for this repo so far — owner undecided |
| Pawn asset | `assets/pawn.png` has magenta bg; chroma-keyed at runtime (replace with transparent PNG when provided) |
