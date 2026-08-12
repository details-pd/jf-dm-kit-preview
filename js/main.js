/* =========================================================
   Jonny Fruits Baby DM Kit — MVP interaction flow
   State machine:
   intro → board → (deck draw ×3: shuffle → reveal → fly to slot)
   → golden card zoom → carriage scene → stamp peel → form
   → thank you → free explore
   ========================================================= */

const MILESTONES = [
  {
    img: "assets/milestone-1.png",
    alt: "Polaroid of Jonny and his wife on their first date",
    caption: "First step of a beautiful journey together.",
  },
  {
    img: "assets/milestone-2.png",
    alt: "Polaroid of Jonny and his wife on their wedding day",
    caption: "A promise to build a life together.",
  },
  {
    img: "assets/milestone-3.png",
    alt: "Polaroid of a baby carriage with a gift box and envelope",
    caption: "Your greatest chapter yet.",
  },
];

const el = (id) => document.getElementById(id);

const intro = el("intro");
const board = el("board");
const deck = el("deck");
const deckBubble = el("deckBubble");
const reveal = el("reveal");
const revealCard = el("revealCard");
const revealInner = el("revealInner");
const revealImg = el("revealImg");
const revealCaption = el("revealCaption");
const scene = el("scene");
const stampHotspot = el("stampHotspot");
const giftSelect = el("giftSelect");
const formOverlay = el("form");
const claimForm = el("claimForm");
const formError = el("formError");
const thanks = el("thanks");

let drawn = 0;          // how many milestone cards have been drawn
let busy = false;       // animation lock
let freeExplore = false;

/* ---------- pawn: dedicated exports from the Aug 4 handoff ---------- */
function loadPawn() {
  gsap.set([el("pawnJonny"), el("pawnCouple")], { xPercent: -50 });
}

/* ---------- pawn movement along the track ---------- */
const track = () => document.getElementById("trackPath");
let pawnT = 0; // current position along the path, 0..1

// convert a point at fraction t of the path into page coordinates
function pathPointAt(t) {
  const p = track();
  const pt = p.getPointAtLength(t * p.getTotalLength());
  return new DOMPoint(pt.x, pt.y).matrixTransform(p.getScreenCTM());
}

function positionPawn(t) {
  pawnT = t;
  const pw = el("pawnWrap");
  const boardRect = board.getBoundingClientRect();
  const pos = pathPointAt(t);
  const w = pw.offsetWidth, h = pw.offsetHeight;
  // anchor the pawn's feet (bottom-center) on the track, but never let his
  // head poke above the board edge (happens on phones, where the pawn's
  // minimum pixel size is large relative to the scaled-down board)
  gsap.set(pw, {
    left: pos.x - boardRect.left - w / 2 + "px",
    top: Math.max(4, pos.y - boardRect.top - h * 0.92) + "px",
  });
}

// path fraction just before each slot ("the spot before the card"),
// computed from live layout
function slotWaypoints() {
  const p = track();
  const centers = [0, 1, 2].map((i) => {
    const r = el(`slot-${i}`).querySelector(".slot-frame").getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  });
  return centers.map((c) => {
    let best = 0, bestD = Infinity;
    for (let s = 0; s <= 300; s++) {
      const t = s / 300;
      const pos = pathPointAt(t);
      const d = (pos.x - c.x) ** 2 + (pos.y - c.y) ** 2;
      if (d < bestD) { bestD = d; best = t; }
    }
    return Math.max(0.02, best - 0.07);
  });
}

// keep the walking pawn in view on the 3-screen board
function scrollToPathPoint(t, onDone) {
  const pos = pathPointAt(t);
  const targetY = Math.max(0, window.scrollY + pos.y - window.innerHeight * 0.55);
  const state = { y: window.scrollY };
  gsap.to(state, {
    y: targetY,
    duration: Math.min(1.2, Math.abs(targetY - state.y) / 900 + 0.3),
    ease: "power1.inOut",
    onUpdate: () => window.scrollTo(0, state.y),
    onComplete: onDone,
  });
}

function walkPawnTo(t, onDone) {
  const pw = el("pawnWrap");
  const state = { t: pawnT };
  const dist = Math.abs(t - pawnT);
  const dur = Math.max(0.8, dist * 4);
  // waddle while walking
  const bob = gsap.to(pw, { rotation: 4, duration: 0.18, repeat: -1, yoyo: true });
  gsap.to(state, {
    t,
    duration: dur,
    ease: "power1.inOut",
    onUpdate: () => positionPawn(state.t),
    onComplete: () => {
      bob.kill();
      gsap.to(pw, { rotation: 0, duration: 0.15 });
      if (onDone) onDone();
    },
  });
}

// wife appears beside Jonny after the first milestone
function wifeJoins(onDone) {
  const couple = el("pawnCouple");
  gsap.timeline({ onComplete: onDone })
    .to(el("pawnJonny"), { opacity: 0, duration: 0.35 }, 0.1)
    .fromTo(couple, { opacity: 0, y: -18 }, { opacity: 1, y: 0, duration: 0.45, ease: "back.out(2)" }, 0)
    .to(el("pawnWrap"), { scale: 1.08, yoyo: true, repeat: 1, duration: 0.18 }, 0.1);
}

window.addEventListener("resize", () => {
  if (board.style.visibility === "visible") positionPawn(pawnT);
});

/* ---------- intro: unbox → board overview → zoom into play ----------
   The lid flies off the game box, the yellow fades to reveal the WHOLE
   board scaled down (establishing view, per Sarah's note), and after a
   beat the camera zooms into the top of the board where Jonny waits. */
function startExperience() {
  if (busy) return;
  busy = true;

  const introCard = el("introCard");
  const deckArea = document.querySelector(".deck-area");

  board.style.visibility = "visible";
  window.scrollTo(0, 0); // the journey starts at the top of the board
  positionPawn(0); // Jonny waits at the start of the track

  // fit the entire board inside the viewport for the overview shot
  const fit = Math.min((window.innerHeight * 0.94) / board.offsetHeight, 1);
  gsap.set(board, { scale: fit, transformOrigin: "50% 0%", opacity: 0 });
  gsap.set(deckArea, { opacity: 0 });

  gsap.timeline({
    onComplete: () => {
      gsap.set(board, { clearProps: "transform,opacity" });
      positionPawn(0); // re-anchor at full scale
      busy = false;
      promptDeck();
    },
  })
    // a little anticipation wiggle, then the lid flies off
    .to(introCard, { rotation: -2, duration: 0.09, repeat: 3, yoyo: true }, 0)
    .to(introCard, {
      y: -window.innerHeight * 1.2,
      x: -window.innerWidth * 0.12,
      rotation: -16,
      rotationX: 28,
      scale: 1.08,
      duration: 0.9,
      ease: "power2.in",
    }, 0.4)
    // the base drops away as the box empties
    .to(".box-base", { y: 60, opacity: 0, duration: 0.5, ease: "power1.in" }, 0.6)
    // yellow fades out; the miniature board fades in underneath
    .to(intro, { backgroundColor: "rgba(242,178,27,0)", duration: 0.7 }, 0.7)
    .to(board, { opacity: 1, duration: 0.6 }, 0.8)
    .add(() => { intro.style.display = "none"; }, 1.5)
    // hold the establishing view of the full board…
    .to({}, { duration: 1.3 })
    // …then zoom into the top of the board where the journey begins
    .to(board, { scale: 1, duration: 1.7, ease: "power2.inOut" })
    .to(deckArea, { opacity: 1, duration: 0.5 }, "-=0.4");
}

/* ---------- deck prompts: shake + golden highlight pulse ---------- */
function promptDeck() {
  if (drawn >= MILESTONES.length) return;
  deckBubble.textContent =
    drawn === 0 ? "Click the deck to shuffle!" :
    drawn === 1 ? "One memory placed — draw again!" :
                  "One last card…";
  gsap.fromTo(deck, { rotation: -3 }, {
    rotation: 3, duration: 0.12, repeat: 7, yoyo: true,
    onComplete: () => gsap.set(deck, { rotation: 0 }),
  });
  gsap.fromTo(deck,
    { filter: "drop-shadow(0 0 0px rgba(255,215,106,0))" },
    { filter: "drop-shadow(0 0 22px rgba(255,215,106,0.95))",
      duration: 0.45, repeat: 5, yoyo: true,
      onComplete: () => gsap.set(deck, { filter: "none" }) });
}

/* ---------- draw sequence ---------- */
function drawCard() {
  if (busy || freeExplore || drawn >= MILESTONES.length) return;
  busy = true;

  const m = MILESTONES[drawn];
  const isGolden = drawn === 2;

  // 1. shuffle animation on the deck
  const cards = deck.querySelectorAll(".deck-card");
  const shuffle = gsap.timeline({ onComplete: popCard });
  cards.forEach((c, i) => {
    shuffle.to(c, {
      x: gsap.utils.random(-30, 30),
      y: gsap.utils.random(-24, 10),
      rotation: gsap.utils.random(-18, 18),
      duration: 0.16,
    }, i * 0.05)
    .to(c, { x: 0, y: 0, rotation: 0, duration: 0.18 }, ">");
  });
  shuffle.repeat(1);

  // 2. card pops to screen and flips to reveal the illustration
  function popCard() {
    revealImg.src = m.img;
    revealImg.alt = m.alt;
    revealCaption.textContent = m.caption;
    revealCard.classList.toggle("golden", isGolden);
    gsap.set(revealInner, { rotationY: 0 });
    reveal.style.display = "grid";

    const revealDur = isGolden ? 1.6 : 0.7; // golden card = slower reveal
    const holdTime = isGolden ? 1.6 : 1.1;

    gsap.timeline({ onComplete: () => setTimeout(flyToSlot, holdTime * 1000) })
      .from(revealCard, {
        scale: 0.2, y: 240, rotation: -12, duration: 0.55, ease: "back.out(1.4)",
      })
      .to(revealInner, { rotationY: 180, duration: revealDur, ease: "power2.inOut" });
  }

  // 3. every card flies onto its board slot, then the pawn advances:
  //    card 1 — Jonny walks there alone and his wife joins him at the slot;
  //    card 3 (golden) — the couple walks to it, then we zoom through the card
  function flyToSlot() {
    const slot = el(`slot-${drawn}`);
    const frame = slot.querySelector(".slot-frame");
    const target = frame.getBoundingClientRect();
    const from = revealCard.getBoundingClientRect();

    gsap.timeline({
      onComplete: () => {
        placeInSlot(slot, m);
        reveal.style.display = "none";
        gsap.set(revealCard, { x: 0, y: 0, scale: 1, opacity: 1 });
        drawn += 1;
        // the pawn advances to the spot just BEFORE the next card
        // (after the 3rd card it walks the final stretch to the last photo)
        const wp = isGolden ? 1 : slotWaypoints()[drawn];
        const advance = () => scrollToPathPoint(wp, () => walkPawnTo(wp, () => {
          if (isGolden) {
            zoomThroughCard(slot); // straight into gift selection
          } else {
            busy = false;
            promptDeck(); // deck highlight cues the next draw
          }
        }));
        // first milestone placed: his wife joins him (animated) before they walk on
        if (drawn === 1) wifeJoins(advance); else advance();
      },
    })
      .to(reveal, { backgroundColor: "rgba(32,26,16,0)", duration: 0.5 }, 0)
      .to(revealCard, {
        x: target.left + target.width / 2 - (from.left + from.width / 2),
        y: target.top + target.height / 2 - (from.top + from.height / 2),
        scale: target.width / from.width,
        rotation: gsap.utils.random(-6, 6),
        duration: 0.9,
        ease: "power2.inOut",
      }, 0)
      .to(revealCard, { opacity: 0, duration: 0.15 }, "-=0.1");
  }
}

function placeInSlot(slot, m) {
  const frame = slot.querySelector(".slot-frame");
  frame.innerHTML = "";
  const img = document.createElement("img");
  img.src = m.img;
  img.alt = m.alt;
  frame.appendChild(img);
  slot.classList.add("filled");
}

/* ---------- golden card: zoom "through the window" into the scene ---------- */
function zoomThroughCard(slot) {
  const frameRect = slot.querySelector(".slot-frame").getBoundingClientRect();
  gsap.set(revealInner, { rotationY: 180 }); // front face showing
  reveal.style.display = "grid";
  gsap.set(reveal, { opacity: 1, backgroundColor: "rgba(32,26,16,0)" });
  const from = revealCard.getBoundingClientRect();
  gsap.set(revealCard, {
    x: frameRect.left + frameRect.width / 2 - (from.left + from.width / 2),
    y: frameRect.top + frameRect.height / 2 - (from.top + from.height / 2),
    scale: frameRect.width / from.width,
  });
  gsap.timeline({ onComplete: showGiftSelect })
    .to(reveal, { backgroundColor: "rgba(32,26,16,0.55)", duration: 0.4 }, 0)
    .to(revealCard, { x: 0, y: 0, scale: 1, duration: 0.5, ease: "power2.out" }, 0)
    .to(revealCard, { scale: 6, duration: 1.0, ease: "power3.in" }, 0.65)
    .to(reveal, { opacity: 0, duration: 0.35 }, "-=0.35");
}

/* ---------- gift selection page (follows the 3rd milestone directly) ---------- */
function showGiftSelect() {
  reveal.style.display = "none";
  gsap.set(reveal, { opacity: 1, backgroundColor: "rgba(32,26,16,0.55)" });
  gsap.set(revealCard, { x: 0, y: 0, scale: 1 });
  giftSelect.style.display = "grid";
  gsap.from(".gift-flip", {
    y: 60, opacity: 0, stagger: 0.12, duration: 0.5, ease: "back.out(1.4)",
    onComplete: () => { busy = false; },
  });
}

/* ---------- final scene ---------- */
function enterScene() {
  reveal.style.display = "none";
  gsap.set(reveal, { opacity: 1, backgroundColor: "rgba(32,26,16,0.55)" });
  gsap.set(revealCard, { x: 0, y: 0, scale: 1 });
  scene.style.display = "grid";
  busy = false;

  gsap.from(".scene-stage", { scale: 1.25, opacity: 0, duration: 0.9, ease: "power2.out" });
  gsap.from("#sceneBubble", { y: -16, opacity: 0, delay: 0.7, duration: 0.4 });
  // pulse the stamp so the click target is discoverable
  gsap.to("#stamp", { scale: 1.12, repeat: -1, yoyo: true, duration: 0.7, delay: 1.2 });
}

/* ---------- stamp peel → gift selection (separate from the form) ---------- */
let chosenGift = null;

function peelStamp() {
  if (busy) return;
  busy = true;
  gsap.killTweensOf("#stamp");

  gsap.timeline({
    onComplete: () => {
      scene.style.display = "none";
      giftSelect.style.display = "grid";
      gsap.from(".gift-flip", {
        y: 60, opacity: 0, stagger: 0.12, duration: 0.5, ease: "back.out(1.4)",
        onComplete: () => { busy = false; },
      });
    },
  })
    // stamp peels off and zooms into frame
    .to("#stamp", { rotationX: 25, y: -10, duration: 0.25, ease: "power1.in" })
    .to("#stamp", { scale: 14, opacity: 0, duration: 0.7, ease: "power3.in" });
}

/* ---------- gift flip cards: flip to peek, choose one, others go null ---------- */
// second thoughts welcome — the form links back here
function resetGiftSelection() {
  chosenGift = null;
  document.querySelectorAll(".gift-flip").forEach((c) => {
    c.classList.remove("chosen", "disabled", "flipped");
  });
}

function changeGift() {
  formOverlay.style.display = "none";
  resetGiftSelection();
  giftSelect.style.display = "grid";
  gsap.from(".gift-flip", { y: 40, opacity: 0, stagger: 0.08, duration: 0.4, ease: "back.out(1.3)" });
}

function setupGiftCards() {
  document.querySelectorAll(".gift-flip").forEach((card) => {
    const flip = () => {
      if (chosenGift || card.classList.contains("disabled")) return;
      card.classList.toggle("flipped");
    };
    card.addEventListener("click", flip);
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); flip(); }
    });
    card.querySelector(".gf-select").addEventListener("click", (e) => {
      e.stopPropagation();
      if (chosenGift) return;
      chosenGift = card.dataset.gift;
      card.classList.add("chosen");
      document.querySelectorAll(".gift-flip").forEach((other) => {
        if (other !== card) other.classList.add("disabled");
      });
      // brief beat on the chosen card, then transition to the form page
      gsap.timeline()
        .to(card, { scale: 1.05, yoyo: true, repeat: 1, duration: 0.22 })
        .to(giftSelect, { opacity: 0, duration: 0.4, delay: 0.25 })
        .add(() => {
          giftSelect.style.display = "none";
          gsap.set(giftSelect, { opacity: 1 });
          el("chosenGiftLabel").textContent = chosenGift;
          formOverlay.style.display = "grid";
          gsap.from(".form-stamp-frame", {
            scale: 0.4, rotation: 8, opacity: 0, duration: 0.6, ease: "back.out(1.3)",
          });
        });
    });
  });
}

/* ---------- form submit ----------
   Posts the claim to the "Jonny Fruits Claim Notifier" Apps Script web
   app, which emails the team. On failure the form stays open so the one
   submission that matters can be retried. */
const CLAIM_ENDPOINT =
  "https://script.google.com/macros/s/AKfycbzlAoT1Me_uVJ1aaQ0XFCjO7a_a5NtdeF32CpvJkaZ5uyEaiXJ-YZTEsBQRbJ5E4X4-WQ/exec";

function submitClaim(e) {
  e.preventDefault();
  formError.textContent = "";

  const phone = el("fPhone").value.trim();
  const address = el("fAddress").value.trim();

  if (!phone || !address) {
    formError.textContent = "Please fill in your phone number and address.";
    return;
  }

  const payload = {
    gift: chosenGift,
    name: "Jonny Fruits", // the gift ships to Jonny by definition
    phone,
    address,
    submittedAt: new Date().toISOString(),
  };

  const submitBtn = claimForm.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  const originalLabel = submitBtn.textContent;
  submitBtn.textContent = "Sending…";

  fetch(CLAIM_ENDPOINT, {
    method: "POST",
    // text/plain keeps this a "simple" request (no CORS preflight),
    // which is what Apps Script web apps expect
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(payload),
  })
    .then((r) => r.json())
    .then((j) => {
      if (!j.ok) throw new Error(j.error || "notifier returned not-ok");
      formOverlay.style.display = "none";
      showThanks();
    })
    .catch((err) => {
      console.error("claim submission failed:", err);
      formError.textContent =
        "Hmm, that didn’t send — mind trying once more?";
    })
    .finally(() => {
      submitBtn.disabled = false;
      submitBtn.textContent = originalLabel;
    });
}

/* ---------- thanks → free explore ---------- */
function showThanks() {
  // golden card is already on the board (placed before the zoom transition)
  drawn = 3;
  thanks.style.display = "grid";
  gsap.from(".thanks-card", { y: 40, opacity: 0, duration: 0.6, ease: "back.out(1.4)" });
}

function startFreeExplore() {
  thanks.style.display = "none";
  freeExplore = true;
  deckBubble.textContent = "Click a memory to revisit it."; // couple already stands at slot 3

  // milestones become clickable to re-view
  document.querySelectorAll(".slot.filled").forEach((slot) => {
    slot.addEventListener("click", () => {
      const i = Number(slot.dataset.index);
      const m = MILESTONES[i];
      revealImg.src = m.img;
      revealImg.alt = m.alt;
      revealCaption.textContent = m.caption;
      revealCard.classList.toggle("golden", i === 2);
      gsap.set(revealInner, { rotationY: 180 });
      reveal.style.display = "grid";
      gsap.from(revealCard, { scale: 0.5, opacity: 0, duration: 0.4, ease: "back.out(1.5)" });
    });
  });

  // clicking the backdrop closes the re-view
  reveal.addEventListener("click", () => {
    if (freeExplore) reveal.style.display = "none";
  });
}

/* ---------- wire up ---------- */
// always begin at the top of the board (the browser otherwise restores
// the previous scroll position on reload)
if ("scrollRestoration" in history) history.scrollRestoration = "manual";
window.scrollTo(0, 0);

loadPawn();
setupGiftCards();
el("celebrateBtn").addEventListener("click", startExperience);
deck.addEventListener("click", drawCard);
deck.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") { e.preventDefault(); drawCard(); }
});
stampHotspot.addEventListener("click", peelStamp);
el("changeGiftBtn").addEventListener("click", changeGift);
claimForm.addEventListener("submit", submitClaim);
el("exploreBtn").addEventListener("click", startFreeExplore);
