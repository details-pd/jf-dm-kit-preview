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
    introHeadline: "Every great journey<br>has many little steps.",
    introSub: "A little something from your friends at Pixel Dreams",
    introCta: "Let’s celebrate",
    deckPrompts: [
      "Click the deck to shuffle!",
      "One memory placed — draw again!",
      "Two down — keep going!",
      "One last card…",
    ],
    giftTitle: "Pick the gift you’d love to receive",
    giftSub: "Flip each card to peek inside, then choose one.",
    formTitle: "Where should it fly to?",
    formGiftLead: "Your gift:",
    formChangeCta: "change my mind",
    formPhoneLabel: "Phone number",
    formAddressLabel: "Delivery address",
    formSubmitCta: "Send it my way",
    formMissing: "Please fill in your phone number and address.",
    formFailed: "Hmm, that didn’t send — mind trying once more?",
    thanksTitle: "Thank you — your gift is on its way!",
    thanksBody: "Here’s to many more wonderful memories and milestones ahead.",
    thanksCta: "Wander the board",
    explorePrompt: "Click a memory to revisit it.",
  },

  board: {
    image: "assets/v3/board-play.jpg",
    // native design space; all fractions map onto this (w, h)
    size: [1938, 3258],
    // where the pawns wait before the first draw (above milestone 1's card)
    startPos: [0.225, 0.168],
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
  pawns: [
    { img: "assets/v3/head-jonny.png", alt: "" },
    { img: "assets/v3/head-kelly.png", alt: "" },
  ],
  pawnWidthFrac: 0.075, // of board width, per head

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

  // gift options (Kharisel's redesigned cards pending — art will swap in)
  gifts: [
    {
      name: "Once Upon a Bedtime",
      emoji: "\u{1F4DA}",
      tagline: "The beginning of a lifetime of stories.",
      art: "assets/gift-books.jpg",
      alt: "A set of children's books with a bookmark that reads: a reader lives a thousand lives",
    },
    {
      name: "The Days You'll Treasure",
      emoji: "\u{1F4F8}",
      tagline: "Preserve the little moments that become the big ones.",
      art: "assets/gift-keepsake.jpg",
      alt: "A keepsake memory box with drawers, baby shoes, and blankets",
    },
    {
      name: "A Moment Together",
      emoji: "\u{1F33F}",
      tagline: "Rest and reconnection during life’s biggest transition.",
      art: "assets/gift-spa.jpg",
      alt: "A couple enjoying a relaxing spa day together",
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
