/* =========================================================
   KIT CONFIG — everything recipient-specific lives HERE.
   Re-skinning this experience for a new person / life event
   (e.g. a baby shower) should mean: swap the assets referenced
   below and edit these values. No changes to main.js.

   Coordinate conventions:
   - board fractions: 0..1 of board width/height (x right, y down)
   - slot angle: degrees, CSS clockwise
   - track: waypoints in board fractions; main.js smooths them
     into a path (Catmull-Rom), pawns travel along it

   NOTE ON Y VALUES (Aug 19): the board art is Kharisel's artboard with
   360 render-px of cream inserted under the top frame, so the couple can
   stand on the top red piece without their heads running off the board
   (tools/build-board-v4.py). Every y below is therefore the artboard
   value mapped through y' = (y * 6516 + 360) / 6876. Re-run that tool if
   the artboard changes; it prints these numbers.
   ========================================================= */

const KIT = {
  recipient: {
    name: "Jonny Fruits",   // goes into the claim email payload
  },

  copy: {
    pageTitle: "Congratulations, Jonny and Kelly!",
    introHeadline: "Team is everything.",
    // Kharisel's Aug 14 landing letter — one entry per paragraph
    introBody: [
      "Jonny and Kelly,",
      "Who you have beside you makes a world of difference in the game of life. And boy, do you two make a killer team.",
      "Your last few years have been full of adventure preparing you for the greatest adventure of all: <strong>Parenthood.</strong>",
      "As you enter this new chapter, we invite you to take a moment to revisit the moments that made you <em>you</em>, with a little surprise waiting at the end.",
      "Cheering you on always,<br>The Pixel Dreams Team",
    ],
    introCta: "Dive in",
    giftTitle: "Time to Celebrate",
    giftSub: "We’d love to send you a gift to commemorate this incredible moment in your lives. Browse the options below and choose your favorite.",
    formTitle: "Great choice. Tell us where to send the gift!",
    formGiftLead: "Your gift:",
    formChangeCta: "Change my mind",
    formPhoneLabel: "Phone number",
    formAddressLabel: "Delivery address",
    formInstructionsLabel: "Delivery instructions",
    formSubmitCta: "Submit",
    formMissing: "Please fill in your phone number and address.",
    formFailed: "Hmm, that didn’t send — mind trying once more?",
    thanksTitle: "Your gift is on the way!",
    thanksBody: "Expect it to arrive within two weeks.<br>Congratulations again, Jonny and Kelly.",
    thanksCta: "Back to the board",
    // labels for assistive tech — the visible words are baked into the art
    startLabelAlt: "Start the Journey",
    clickCardAlt: "Click me — reveal this milestone",
    surpriseAlt: "Click for a surprise",
  },

  board: {
    image: "assets/v4/board-play.jpg?v=1",
    // native design space; all fractions map onto this (w, h)
    size: [1938, 3438],
    // the couple waits together on the TOP RED piece (Waheed, Aug 19)
    startPos: [0.777, 0.1177],
    // where they end up after the last milestone: the second-to-last
    // (black) piece. Sits high enough on that piece that their heads stay
    // clear of the baked "Click for a surprise" pill below them.
    endPos: [0.778, 0.902],

    // "Start the Journey" — Kharisel bakes this into the artboard, but it
    // lands exactly where the couple has to stand, so build-board-v4.py
    // lifts it out as a sprite and erases it from the raster. Placed here
    // shifted left of its artboard position to clear the heads; main.js
    // fades it out once the first card is turned.
    startLabel: {
      img: "assets/v4/label-start.png?v=1",
      x: 0.3277,
      y: 0.0781,
      w: 0.3186,
    },

    // the final blue piece + its baked pill: what flashes and what you
    // click to open the gifts (Waheed, Aug 19)
    surprise: {
      // click target, generous enough for a thumb on a phone
      hit: { x: 0.706, y: 0.912, w: 0.246, h: 0.082 },
      // the glow that pulses on the piece — centred on the baked pill
      glow: { x: 0.826, y: 0.9506, r: 0.20 },
    },

    // pawn track — traced along the painted band's centerline, start → finish
    // (verify against the art with tools/ + trackviz when the board changes)
    track: [
      [0.945, 0.0732], [0.845, 0.0922], [0.762, 0.1234], [0.660, 0.1547],
      [0.550, 0.1737], [0.440, 0.1945], [0.350, 0.2182], [0.295, 0.2466],
      [0.253, 0.2798], [0.222, 0.3158],
      [0.205, 0.3670], [0.293, 0.3973], [0.383, 0.4286], [0.473, 0.4494],
      [0.560, 0.4617], [0.660, 0.4788], [0.755, 0.5072], [0.833, 0.5546],
      [0.805, 0.6067], [0.720, 0.6276], [0.600, 0.6418], [0.483, 0.6570],
      [0.370, 0.6645], [0.260, 0.6702], [0.148, 0.6863], [0.107, 0.7299],
      [0.126, 0.7745], [0.215, 0.8199], [0.335, 0.8398], [0.445, 0.8541],
      [0.550, 0.8607], [0.650, 0.8654], [0.735, 0.8882], [0.775, 0.9384],
    ],
  },

  // game pieces (sticker heads). Both are on the board together from the
  // moment it appears (Waheed, Aug 19 — Kelly no longer joins later).
  // widthFrac = the sticker's native size in the .ai design
  // (piece export px / board render px), per head
  pawns: [
    { img: "assets/v3/head-jonny.png?v=2", alt: "", widthFrac: 0.133 },
    { img: "assets/v3/head-kelly.png?v=2", alt: "", widthFrac: 0.160 },
  ],
  // side-by-side offset as a fraction of each head's width — 0.41 gives
  // the slight overlap in Kharisel's Aug 14 pawn mock
  pawnSpread: 0.41,

  // the card art that replaces a year card when that milestone is next up
  clickCard: "assets/v4/card-clickme.png?v=1",

  // milestones IN ORDER. slot = measured transform of the baked
  // card art on the board (see assets/v3/slots.json — regenerate with
  // the extraction script when the board art changes).
  milestones: [
    // pawnPos = where the heads stand once this card is turned (feet anchor,
    // board fractions) — measured from Kharisel's Aug 14 placement mockups
    {
      id: "founding",
      face: "assets/v3/face-founding.png?v=2",
      yearCard: "assets/v3/year-2018.png?v=2",
      alt: "Memory card: The Team Founding, 2018 — two glasses raised in a toast",
      slot: { cx: 0.2338, cy: 0.2954, w: 0.1977, h: 0.1453, angle: -3.81 },
      pawnPos: [0.435, 0.1945], // stops clear of the card text
    },
    {
      id: "contract",
      face: "assets/v3/face-contract.png?v=2",
      yearCard: "assets/v3/year-2021.png?v=2",
      alt: "Memory card: Contract Talks Begin, 2021 — an engagement ring",
      slot: { cx: 0.6698, cy: 0.4301, w: 0.1956, h: 0.1453, angle: -3.49 },
      pawnPos: [0.414, 0.4371], // stops clear of the card text
    },
    {
      id: "signing",
      face: "assets/v3/face-signing.png?v=2",
      yearCard: "assets/v3/year-2022.png?v=2",
      alt: "Memory card: Signing Day, 2022 — a wedding cake topped with a heart",
      slot: { cx: 0.3092, cy: 0.6409, w: 0.1977, h: 0.1453, angle: -3.07 },
      pawnPos: [0.536, 0.6503], // stops clear of the card text
    },
    {
      id: "henry",
      face: "assets/v3/face-henry.png?v=2",
      yearCard: "assets/v3/year-2026.png?v=2",
      alt: "Memory card: Henry, Franchise Cornerstone, 2026 — a baby bottle",
      slot: { cx: 0.6298, cy: 0.8489, w: 0.1977, h: 0.1453, angle: 3.54 },
      pawnPos: [0.365, 0.8446], // stops clear of the card text
    },
  ],

  // gift options — Kharisel's Aug 19 card designs (chrome + buttons baked
  // into the art; the whole card is the click target)
  gifts: [
    {
      name: "The Rookie Kit",
      back: "assets/v3/gift-rookie-back.png?v=2",
      front: "assets/v3/gift-rookie-front.png?v=4",
      backAlt: "Face-down gift card with a basketball sticker — flip to reveal",
      frontAlt:
        "The Rookie Kit — a collection of Indiana Pacers–themed baby essentials to welcome the newest little fan. Click to choose this gift.",
    },
    {
      name: "The Highlight Reel",
      back: "assets/v3/gift-highlight-back.png?v=2",
      front: "assets/v3/gift-highlight-front.png?v=4",
      backAlt: "Face-down gift card with a photo-album sticker — flip to reveal",
      frontAlt:
        "The Highlight Reel — items to help preserve the little moments as they unfold. Click to choose this gift.",
    },
    {
      name: "The Sixth Man",
      back: "assets/v3/gift-sixthman-back.png?v=2",
      front: "assets/v3/gift-sixthman-front.png?v=4",
      backAlt: "Face-down gift card with a serving-dish sticker — flip to reveal",
      frontAlt:
        "The Sixth Man — chef-made CookUnity meals delivered to the door. Click to choose this gift.",
    },
  ],

  notifier: {
    endpoint:
      "https://script.google.com/macros/s/AKfycbzlAoT1Me_uVJ1aaQ0XFCjO7a_a5NtdeF32CpvJkaZ5uyEaiXJ-YZTEsBQRbJ5E4X4-WQ/exec",
  },

  // play-zoom framing: a milestone card aims for ~cardHeight of the
  // viewport, but the board never renders wider than boardMaxWidth ×
  // viewport width — that cap is what keeps phones zoomed OUT.
  // Roomier than v3 now that the deck no longer occupies the right rail
  // (Sarah, Aug 19: "if we remove this deck of cards, we can zoom in more").
  camera: {
    cardHeight: 0.34,
    cardMaxWidth: 0.78,
    boardMaxWidth: 1.6,
  },

  // animation pacing (Sarah asked for snappier transitions, Aug 13)
  timing: {
    flipDur: 0.45,        // card flip in the revisit popup
    turnDur: 0.44,        // a board card turning over in place
    introZoomDur: 0.85,   // overview → play zoom (glimpse + zoom ≈ 1s total)
    overviewHold: 0.8,    // beat on the establishing shot
    walkSpeed: 0.20,      // board HEIGHTS per second — constant pace
    nextPrompt: 0.5,      // beat before the next card invites a click
  },
};
