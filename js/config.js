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
   ========================================================= */

const KIT = {
  recipient: {
    name: "Jonny Fruits",   // goes into the claim email payload
  },

  copy: {
    pageTitle: "Every Great Journey",
    introHeadline: "Team is everything.",
    // Kharisel's Aug 14 landing letter — one entry per paragraph
    introBody: [
      "Jonny and Kelly,",
      "Who you have beside you makes a world of difference in the game of life. And boy, do you two make a killer team.",
      "Your last few years have been full of adventure preparing you for the greatest adventure of all: <strong>Parenthood.</strong>",
      "As you enter this new chapter, we invite you to take a moment to revisit the moments that made you you, with a little surprise waiting at the end.",
      "Cheering you on always,<br>The Pixel Dreams Team",
    ],
    introCta: "Dive in",
    // bubble copy by number of cards already placed; empty = deck just
    // shakes as the reminder (Sarah via Kharisel, Aug 14). The final
    // entry invites the deck click that reveals the gifts.
    deckPrompts: [
      "Take me to the next milestone",
      "",
      "",
      "",
      "Click for a surprise",
    ],
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
    thanksBody: "Expect it to arrive within two weeks. Congratulations again, Jonny and Kelly.",
    thanksCta: "Back to the board",
    explorePrompt: "Click a memory to revisit it.",
  },

  board: {
    image: "assets/v3/board-play.jpg",
    // native design space; all fractions map onto this (w, h)
    size: [1938, 3258],
    // where the pawns wait before the first draw — clear ABOVE milestone
    // 1's card, not overlapping it (Kharisel, Aug 14)
    startPos: [0.225, 0.140],
    // pawn track — traced along the painted band's centerline, start → finish
    // (verify against the art with tools/ + trackviz when the board changes)
    track: [
      [0.205, 0.332], [0.293, 0.364], [0.383, 0.397], [0.473, 0.419],
      [0.560, 0.432], [0.660, 0.450], [0.755, 0.480], [0.833, 0.530],
      [0.805, 0.585], [0.720, 0.607], [0.600, 0.622], [0.483, 0.638],
      [0.370, 0.646], [0.260, 0.652], [0.148, 0.669], [0.107, 0.715],
      [0.126, 0.762], [0.215, 0.810], [0.335, 0.831], [0.445, 0.846],
      [0.550, 0.853], [0.650, 0.858], [0.735, 0.882], [0.775, 0.935],
    ],
  },

  // game pieces (sticker heads). The second pawn pops in during the
  // intro zoom, BEFORE the first draw (Sarah, Aug 13).
  // widthFrac = the sticker's native size in the .ai design
  // (piece export px / board render px), per head
  pawns: [
    { img: "assets/v3/head-jonny.png", alt: "", widthFrac: 0.133 },
    { img: "assets/v3/head-kelly.png", alt: "", widthFrac: 0.160 },
  ],
  // side-by-side offset as a fraction of each head's width — 0.52 leaves
  // a sliver of space between the heads (Kharisel, Aug 14)
  pawnSpread: 0.52,

  deck: {
    back: "assets/v3/card-back.png",
  },

  // milestones IN DRAW ORDER. slot = measured transform of the baked
  // card art on the board (see assets/v3/slots.json — regenerate with
  // the extraction script when the board art changes).
  milestones: [
    {
      id: "founding",
      face: "assets/v3/face-founding.png",
      yearCard: "assets/v3/year-2018.png",
      alt: "Memory card: The Team Founding, 2018 — two glasses raised in a toast",
      slot: { cx: 0.2338, cy: 0.2565, w: 0.1977, h: 0.1533, angle: -3.81 },
    },
    {
      id: "contract",
      face: "assets/v3/face-contract.png",
      yearCard: "assets/v3/year-2021.png",
      alt: "Memory card: Contract Talks Begin, 2021 — an engagement ring",
      slot: { cx: 0.6698, cy: 0.3986, w: 0.1956, h: 0.1533, angle: -3.49 },
    },
    {
      id: "signing",
      face: "assets/v3/face-signing.png",
      yearCard: "assets/v3/year-2022.png",
      alt: "Memory card: Signing Day, 2022 — a wedding cake topped with a heart",
      slot: { cx: 0.3092, cy: 0.6211, w: 0.1977, h: 0.1533, angle: -3.07 },
    },
    {
      id: "henry",
      face: "assets/v3/face-henry.png",
      yearCard: "assets/v3/year-2026.png",
      alt: "Memory card: Henry, Franchise Cornerstone, 2026 — a baby bottle",
      slot: { cx: 0.6298, cy: 0.8406, w: 0.1977, h: 0.1533, angle: 3.54 },
    },
  ],

  // gift options — Kharisel's Aug 14 card designs (chrome + buttons baked
  // into the art; the whole card is the click target)
  gifts: [
    {
      name: "The Rookie Kit",
      back: "assets/v3/gift-rookie-back.png",
      front: "assets/v3/gift-rookie-front.png",
      backAlt: "Face-down gift card with a basketball sticker — flip to reveal",
      frontAlt: "The Rookie Kit — a Pacers baby tee. Click to choose this gift.",
    },
    {
      name: "The Highlight Reel",
      back: "assets/v3/gift-highlight-back.png",
      front: "assets/v3/gift-highlight-front.png",
      backAlt: "Face-down gift card with a photo-album sticker — flip to reveal",
      frontAlt: "The Highlight Reel — a baby photo album. Click to choose this gift.",
    },
    {
      name: "The Sixth Man",
      back: "assets/v3/gift-sixthman-back.png",
      front: "assets/v3/gift-sixthman-front.png",
      backAlt: "Face-down gift card with a serving-dish sticker — flip to reveal",
      frontAlt: "The Sixth Man — a CookUnity gift card. Click to choose this gift.",
    },
  ],

  notifier: {
    endpoint:
      "https://script.google.com/macros/s/AKfycbzlAoT1Me_uVJ1aaQ0XFCjO7a_a5NtdeF32CpvJkaZ5uyEaiXJ-YZTEsBQRbJ5E4X4-WQ/exec",
  },

  // play-zoom framing: a milestone card aims for ~cardHeight of the
  // viewport, but the board never renders wider than boardMaxWidth ×
  // viewport width — that cap is what keeps phones zoomed OUT
  camera: {
    cardHeight: 0.29,
    cardMaxWidth: 0.70,
    boardMaxWidth: 1.6,
  },

  // animation pacing (Sarah asked for snappier transitions, Aug 13)
  timing: {
    flipDur: 0.45,        // card flip in the revisit popup
    flyDur: 0.6,          // deck → slot flight of a drawn card
    introZoomDur: 0.7,    // overview → play zoom
    overviewHold: 0.8,    // beat on the establishing shot
    walkSpeed: 0.10,      // path fraction per second the pawns walk
  },
};
