/* =========================================================
   Jonny Fruits Baby DM Kit — v3 engine (Aug 13 board)
   All recipient-specific data comes from js/config.js (KIT).

   State machine:
   intro (game box) → unbox → board OVERVIEW (pawn 1 alone)
   → zoom to track start (pawn 2 pops in during the zoom)
   → [deck click: shuffle → reveal popup (dim + X) → close
      → card lands on slot → pawns walk there, camera follows] ×N
   → gift selection → address form → thanks → free explore

   Camera: the board lives inside a fixed, clipped stage and is
   moved with translate+scale — no page scrolling. This is what
   makes "screen only moves on deck interaction" enforceable, and
   it behaves identically on phones.
   ========================================================= */

const el = (id) => document.getElementById(id);
const [BW, BH] = KIT.board.size;

/* ================= build the board from config ================= */
const stage = el("stage");
const board = el("board");

function buildBoard() {
  board.style.width = BW + "px";
  board.style.height = BH + "px";
  board.style.backgroundImage = `url("${KIT.board.image}")`;

  KIT.milestones.forEach((m, i) => {
    const slot = document.createElement("div");
    slot.className = "slot";
    slot.id = `slot-${i}`;
    slot.dataset.index = i;
    const w = m.slot.w * BW, h = m.slot.h * BH;
    // 4% oversize so the overlay always covers the baked card art
    slot.style.width = w * 1.04 + "px";
    slot.style.height = h * 1.04 + "px";
    slot.style.left = m.slot.cx * BW - w * 0.52 + "px";
    slot.style.top = m.slot.cy * BH - h * 0.52 + "px";
    slot.style.transform = `rotate(${m.slot.angle}deg)`;
    slot.innerHTML =
      `<img class="slot-year" src="${m.yearCard}" alt="">` +
      `<img class="slot-face" src="${m.face}" alt="${m.alt}">`;
    board.appendChild(slot);
  });

  // pawns are anchored individually (feet on the track); no shared layout,
  // so a lone first pawn stands dead-center on the line
  KIT.pawns.forEach((p, i) => {
    const img = document.createElement("img");
    img.id = `pawn-${i}`;
    img.className = "pawn";
    img.src = p.img;
    img.alt = p.alt;
    img.style.width = p.widthFrac * BW + "px";
    img.style.zIndex = 10 - i;
    board.appendChild(img);
    // anchor low on the band so the heads read as standing ON the track
    gsap.set(img, { xPercent: -50, yPercent: -75 });
  });
}
const pawnEls = () => KIT.pawns.map((_, i) => el(`pawn-${i}`));

/* ================= track: Catmull-Rom through config waypoints ================= */
/* Sampled to arc-length so pawns walk at constant speed. */
const TRACK = (() => {
  const pts = KIT.board.track.map(([x, y]) => [x * BW, y * BH]);
  const P = (i) => pts[Math.max(0, Math.min(pts.length - 1, i))];
  const samples = [];
  const SEGS = 40;
  for (let i = 0; i < pts.length - 1; i++) {
    const [p0, p1, p2, p3] = [P(i - 1), P(i), P(i + 1), P(i + 2)];
    for (let s = 0; s < SEGS; s++) {
      const t = s / SEGS, t2 = t * t, t3 = t2 * t;
      samples.push([
        0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
        0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3),
      ]);
    }
  }
  samples.push(pts[pts.length - 1]);
  const cum = [0];
  for (let i = 1; i < samples.length; i++) {
    cum.push(cum[i - 1] + Math.hypot(samples[i][0] - samples[i - 1][0], samples[i][1] - samples[i - 1][1]));
  }
  const total = cum[cum.length - 1];
  return {
    total,
    pointAt(t) { // t: 0..1 of arc length → board px
      const target = Math.max(0, Math.min(1, t)) * total;
      let lo = 0, hi = cum.length - 1;
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (cum[mid] < target) lo = mid + 1; else hi = mid;
      }
      if (lo === 0) return { x: samples[0][0], y: samples[0][1] };
      const f = (target - cum[lo - 1]) / (cum[lo] - cum[lo - 1] || 1);
      return {
        x: samples[lo - 1][0] + (samples[lo][0] - samples[lo - 1][0]) * f,
        y: samples[lo - 1][1] + (samples[lo][1] - samples[lo - 1][1]) * f,
      };
    },
    nearestT(x, y) { // board px → t
      let best = 0, bestD = Infinity;
      for (let i = 0; i < samples.length; i++) {
        const d = (samples[i][0] - x) ** 2 + (samples[i][1] - y) ** 2;
        if (d < bestD) { bestD = d; best = i; }
      }
      return cum[best] / total;
    },
  };
})();

/* ================= camera ================= */
const cam = { x: 0, y: 0, s: 1 }; // translate px + scale, origin 0 0

function applyCam() {
  gsap.set(board, { x: cam.x, y: cam.y, scale: cam.s });
}

function vw() { return stage.clientWidth; }
function vh() { return stage.clientHeight; }

// scale that fits the whole board in the stage (overview shot)
function fitScale() { return Math.min(vw() / BW, vh() / BH) * 0.94; }

// play scale: a milestone card should read clearly on any screen, but
// the board may never render wider than boardMaxWidth × the viewport —
// on portrait phones that cap wins and keeps the view zoomed out
function playScale() {
  const c = KIT.camera;
  const cardH = KIT.milestones[0].slot.h * BH;
  const cardW = KIT.milestones[0].slot.w * BW;
  return Math.min(
    (c.cardHeight * vh()) / cardH,
    (c.cardMaxWidth * vw()) / cardW,
    (c.boardMaxWidth * vw()) / BW
  );
}

function clampCam(x, y, s) {
  // never show a gap on a side the board can cover
  const bw = BW * s, bh = BH * s;
  const nx = bw <= vw() ? (vw() - bw) / 2 : Math.min(0, Math.max(vw() - bw, x));
  const ny = bh <= vh() ? (vh() - bh) / 2 : Math.min(0, Math.max(vh() - bh, y));
  return { x: nx, y: ny };
}

// camera target that frames board point (bx,by) at viewport center
function camTargetFor(bx, by, s) {
  return { s, ...clampCam(vw() / 2 - bx * s, vh() / 2 - by * s, s) };
}

function cameraTo(target, dur, ease, onDone) {
  gsap.to(cam, {
    x: target.x, y: target.y, s: target.s,
    duration: dur, ease: ease || "power2.inOut",
    onUpdate: applyCam, onComplete: onDone,
  });
}

// deck matches the on-screen size of the cards on the board (Kharisel)
function sizeDeck() {
  const w = KIT.milestones[0].slot.w * BW * playScale();
  el("deckArea").style.width = Math.round(w) + "px";
}

/* ================= pawns ================= */
let pawnT = null; // null = still waiting at startPos, off the track
let partnerJoined = false; // second head pops in during the intro zoom

const startPoint = () => ({
  x: KIT.board.startPos[0] * BW,
  y: KIT.board.startPos[1] * BH,
});
const currentPawnPoint = () => (pawnT === null ? startPoint() : TRACK.pointAt(pawnT));

function renderPawnsAt(p) {
  // alone: dead-center; couple: side by side with a little air between
  const s = KIT.pawnSpread;
  const offs = partnerJoined ? [-s, s] : [0, 0];
  pawnEls().forEach((e, i) => {
    const w = KIT.pawns[i].widthFrac * BW;
    gsap.set(e, { left: p.x + offs[i] * w + "px", top: p.y + "px" });
  });
}
function positionPawns() { renderPawnsAt(currentPawnPoint()); }

function softFollow(p) { // camera tracks the walking pawns, same zoom
  const c = camTargetFor(p.x, p.y, cam.s);
  cam.x += (c.x - cam.x) * 0.12;
  cam.y += (c.y - cam.y) * 0.12;
  applyCam();
}

function walkPawnsTo(t, follow, onDone) {
  const bob = gsap.to(pawnEls(), { rotation: 4, duration: 0.18, repeat: -1, yoyo: true });
  const settle = () => {
    bob.kill();
    gsap.to(pawnEls(), { rotation: 0, duration: 0.15 });
    if (follow) {
      const p = TRACK.pointAt(t);
      cameraTo(camTargetFor(p.x, p.y, cam.s), 0.45, "power1.out", onDone);
    } else if (onDone) onDone();
  };

  if (pawnT === null) {
    // first move: step off the waiting spot straight onto the track
    const from = startPoint();
    const to = TRACK.pointAt(t);
    const state = { f: 0 };
    gsap.to(state, {
      f: 1, duration: 1.0, ease: "power1.inOut",
      onUpdate: () => {
        const p = { x: from.x + (to.x - from.x) * state.f,
                    y: from.y + (to.y - from.y) * state.f };
        renderPawnsAt(p);
        if (follow) softFollow(p);
      },
      onComplete: () => { pawnT = t; settle(); },
    });
    return;
  }

  const dist = Math.abs(t - pawnT);
  const dur = Math.max(0.7, dist / KIT.timing.walkSpeed);
  const state = { t: pawnT };
  gsap.to(state, {
    t,
    duration: dur,
    ease: "power1.inOut",
    onUpdate: () => {
      pawnT = state.t;
      positionPawns();
      if (follow) softFollow(TRACK.pointAt(state.t));
    },
    onComplete: settle,
  });
}

// where the pawns stand for milestone i: on the track, stepped back far
// enough that the heads don't cover the placed card
function milestoneStandT(i) {
  const m = KIT.milestones[i];
  const t = TRACK.nearestT(m.slot.cx * BW, m.slot.cy * BH);
  const stepBack = (m.slot.w * BW * 0.9) / TRACK.total; // ~a card-width of arc
  return Math.max(0, t - stepBack);
}

/* ================= game state ================= */
let drawn = 0;
let busy = false;
let freeExplore = false;
let chosenGift = null;

const intro = el("intro");
const reveal = el("reveal");
const revealCard = el("revealCard");
const revealInner = el("revealInner");
const revealClose = el("revealClose");
const deck = el("deck");
const deckArea = el("deckArea");
const deckBubble = el("deckBubble");
const giftSelect = el("giftSelect");
const formOverlay = el("form");
const claimForm = el("claimForm");
const formError = el("formError");
const thanks = el("thanks");

/* ================= intro: letter over dimmed board → zoom in =================
   The board is visible (dimmed) behind the landing letter from page load;
   Dive in lifts the letter + dim, then the camera zooms to the start. */
let started = false;

function primeStage() {
  stage.style.visibility = "visible";
  const fs = fitScale();
  Object.assign(cam, { s: fs, ...clampCam((vw() - BW * fs) / 2, (vh() - BH * fs) / 2, fs) });
  applyCam();
  positionPawns(); // waiting at startPos, above the first card
  gsap.set(el("pawn-1"), { opacity: 0, scale: 0.4 }); // pawn 2 joins later
  gsap.set(deckArea, { opacity: 0 });
  sizeDeck();
}

function startExperience() {
  if (busy) return;
  busy = true;
  started = true;

  const start = startPoint();
  const play = camTargetFor(start.x, start.y, playScale());

  gsap.timeline({
    onComplete: () => { busy = false; promptDeck(); },
  })
    .to("#introCard", { y: 46, opacity: 0, scale: 0.96, duration: 0.35, ease: "power1.in" }, 0)
    .to(intro, { backgroundColor: "rgba(5,7,22,0)", duration: 0.5 }, 0.15)
    .add(() => { intro.style.display = "none"; }, 0.65)
    // brief beat on the undimmed overview…
    .to({}, { duration: 0.3 })
    // …zoom to the start of the track; partner pops in mid-zoom
    .add("zoom")
    .to(cam, {
      x: play.x, y: play.y, s: play.s,
      duration: KIT.timing.introZoomDur, ease: "power2.inOut",
      onUpdate: applyCam,
    }, "zoom")
    .add(() => { partnerJoined = true; positionPawns(); },
      `zoom+=${KIT.timing.introZoomDur * 0.5}`)
    .to(el("pawn-1"), {
      opacity: 1, scale: 1, duration: 0.4, ease: "back.out(2.2)",
    }, `zoom+=${KIT.timing.introZoomDur * 0.55}`)
    .to(pawnEls(), { scale: 1.06, yoyo: true, repeat: 1, duration: 0.15 }, ">-0.1")
    .to(deckArea, { opacity: 1, duration: 0.4 }, "-=0.3");
}

/* ================= deck prompt =================
   Copy only before the first draw and after the last placement
   ("Click for a surprise"); in between the shake is the reminder. */
function promptDeck() {
  if (drawn > KIT.milestones.length) return;
  const prompts = KIT.copy.deckPrompts;
  deckBubble.textContent = prompts[Math.min(drawn, prompts.length - 1)] || "";
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

/* ================= draw: card flies from the deck, lies flat on its slot =================
   No shuffle, no popup, no X (Waheed, Aug 13 PM): clicking the deck sends
   the card straight to its board position, flipping face-up mid-flight. */
let surpriseShown = false;

function drawCard() {
  if (busy || freeExplore) return;
  if (drawn >= KIT.milestones.length) {
    // final deck click = the surprise (Kharisel, Aug 14)
    if (surpriseShown) return;
    surpriseShown = true;
    busy = true;
    deckBubble.textContent = "";
    showGiftSelect();
    return;
  }
  busy = true;
  deckBubble.textContent = "";

  const index = drawn;
  const m = KIT.milestones[index];
  const slotEl = el(`slot-${index}`);

  el("revealImg").src = m.face;
  el("revealImg").alt = m.alt;
  gsap.set(revealClose, { opacity: 0, scale: 0.4, pointerEvents: "none" });
  gsap.set(revealInner, { rotationY: 0 }); // back showing
  reveal.classList.add("fly-mode"); // transparent, click-through
  reveal.style.display = "grid";
  gsap.set(reveal, { opacity: 1 });

  const card = revealCard.getBoundingClientRect(); // centered, natural size
  const from = deck.getBoundingClientRect();
  const target = slotEl.getBoundingClientRect();
  const d = KIT.timing.flyDur;

  gsap.set(revealCard, {
    x: from.left + from.width / 2 - (card.left + card.width / 2),
    y: from.top + from.height / 2 - (card.top + card.height / 2),
    scale: from.width / card.width,
    rotation: 0,
  });
  gsap.timeline({
    onComplete: () => {
      slotEl.classList.add("filled");
      reveal.style.display = "none";
      reveal.classList.remove("fly-mode");
      gsap.set(revealCard, { x: 0, y: 0, scale: 1, rotation: 0 });
      drawn += 1;

      walkPawnsTo(milestoneStandT(index), true, () => {
        // after the last placement the deck invites one more click
        // ("Click for a surprise") instead of auto-opening the gifts
        busy = false;
        promptDeck();
      });
    },
  })
    .to(revealCard, {
      x: target.left + target.width / 2 - (card.left + card.width / 2),
      y: target.top + target.height / 2 - (card.top + card.height / 2),
      scale: target.width / card.width,
      rotation: m.slot.angle,
      duration: d,
      ease: "power2.inOut",
    }, 0)
    .to(revealInner, { rotationY: 180, duration: d * 0.8, ease: "power2.inOut" }, 0);
}

// revisit popup (free explore only): dimmed backdrop, X / ESC to close
function showReveal(index) {
  const m = KIT.milestones[index];
  el("revealImg").src = m.face;
  el("revealImg").alt = m.alt;
  gsap.set(revealInner, { rotationY: 180 });
  gsap.set(revealClose, { opacity: 0, scale: 0.4, pointerEvents: "none" });
  reveal.style.display = "grid";
  gsap.set(reveal, { opacity: 1 });

  gsap.timeline({
    onComplete: () => {
      gsap.to(revealClose, { opacity: 1, scale: 1, duration: 0.25, ease: "back.out(2)" });
      gsap.set(revealClose, { pointerEvents: "auto" });
    },
  })
    .from(revealCard, { scale: 0.5, opacity: 0, duration: 0.3, ease: "back.out(1.5)" });
}

function closeReveal() {
  gsap.to(reveal, { opacity: 0, duration: 0.25, onComplete: () => {
    reveal.style.display = "none";
  }});
}

/* ================= gift selection =================
   Card chrome + buttons are baked into Kharisel's art; the whole card is
   the click target: face-down → flip, face-up → choose. */
function buildGifts() {
  const row = el("giftRow");
  KIT.gifts.forEach((g) => {
    const card = document.createElement("div");
    card.className = "gift-flip";
    card.dataset.gift = g.name;
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", g.backAlt);
    card.innerHTML =
      `<div class="gift-flip-inner">
        <img class="gf-face gf-face-down" src="${g.back}" alt="">
        <img class="gf-face gf-face-up" src="${g.front}" alt="${g.frontAlt}">
      </div>`;
    row.appendChild(card);
  });
}

function showGiftSelect() {
  giftSelect.style.display = "grid";
  gsap.from(".gift-flip", {
    y: 60, opacity: 0, stagger: 0.1, duration: 0.45, ease: "back.out(1.4)",
    onComplete: () => { busy = false; },
  });
}

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
    let flippedAt = 0;
    const act = () => {
      if (chosenGift || card.classList.contains("disabled")) return;
      if (!card.classList.contains("flipped")) {
        card.classList.add("flipped");
        flippedAt = Date.now();
        card.setAttribute("aria-label",
          card.querySelector(".gf-face-up").alt || card.dataset.gift);
        return;
      }
      if (Date.now() - flippedAt < 450) return; // let the flip settle
      chosenGift = card.dataset.gift;
      card.classList.add("chosen");
      document.querySelectorAll(".gift-flip").forEach((other) => {
        if (other !== card) other.classList.add("disabled");
      });
      gsap.timeline()
        .to(card, { scale: 1.05, yoyo: true, repeat: 1, duration: 0.2 })
        .to(giftSelect, { opacity: 0, duration: 0.35, delay: 0.2 })
        .add(() => {
          giftSelect.style.display = "none";
          gsap.set(giftSelect, { opacity: 1 });
          el("chosenGiftLabel").textContent = chosenGift;
          formOverlay.style.display = "grid";
          gsap.from(".form-frame", {
            scale: 0.4, rotation: 8, opacity: 0, duration: 0.5, ease: "back.out(1.3)",
          });
        });
    };
    card.addEventListener("click", act);
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); act(); }
    });
  });
}

/* ================= form submit → notifier ================= */
function submitClaim(e) {
  e.preventDefault();
  formError.textContent = "";

  const phone = el("fPhone").value.trim();
  const address = el("fAddress").value.trim();
  if (!phone || !address) {
    formError.textContent = KIT.copy.formMissing;
    return;
  }

  const payload = {
    gift: chosenGift,
    name: KIT.recipient.name,
    phone,
    address,
    instructions: el("fInstructions").value.trim(), // optional
    submittedAt: new Date().toISOString(),
  };

  const submitBtn = claimForm.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  const originalLabel = submitBtn.textContent;
  submitBtn.textContent = "Sending…";

  fetch(KIT.notifier.endpoint, {
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
      formError.textContent = KIT.copy.formFailed;
    })
    .finally(() => {
      submitBtn.disabled = false;
      submitBtn.textContent = originalLabel;
    });
}

/* ================= thanks → free explore ================= */
function showThanks() {
  thanks.style.display = "grid";
  gsap.from(".thanks-card", { y: 40, opacity: 0, duration: 0.5, ease: "back.out(1.4)" });
}

function startFreeExplore() {
  thanks.style.display = "none";
  freeExplore = true;
  deckBubble.textContent = KIT.copy.explorePrompt;

  document.querySelectorAll(".slot.filled").forEach((slot) => {
    slot.addEventListener("click", () => {
      if (dragMoved) return;
      showReveal(Number(slot.dataset.index));
    });
  });
  // ease out to a view of the whole journey
  const fs = Math.max(fitScale(), playScale() * 0.55);
  const p = TRACK.pointAt(1);
  cameraTo(camTargetFor(p.x, p.y, fs), 1.2, "power2.inOut");
}

/* --- manual pan: drag / touch-drag / wheel, clamped ---
   Active during play too (between animations), not just free explore —
   the camera still auto-follows on each draw. */
const canPan = () => freeExplore || !busy;
let dragging = false, dragMoved = false, lastX = 0, lastY = 0;
stage.addEventListener("pointerdown", (e) => {
  if (!canPan()) return;
  dragging = true; dragMoved = false;
  lastX = e.clientX; lastY = e.clientY;
});
window.addEventListener("pointermove", (e) => {
  if (!dragging) return;
  const dx = e.clientX - lastX, dy = e.clientY - lastY;
  if (Math.abs(dx) + Math.abs(dy) > 3) dragMoved = true;
  lastX = e.clientX; lastY = e.clientY;
  const c = clampCam(cam.x + dx, cam.y + dy, cam.s);
  cam.x = c.x; cam.y = c.y;
  applyCam();
});
window.addEventListener("pointerup", () => { dragging = false; });
stage.addEventListener("wheel", (e) => {
  if (!canPan()) return;
  e.preventDefault();
  const c = clampCam(cam.x - e.deltaX, cam.y - e.deltaY, cam.s);
  cam.x = c.x; cam.y = c.y;
  applyCam();
}, { passive: false });

/* ================= resize: keep current framing sane ================= */
window.addEventListener("resize", () => {
  if (stage.style.visibility !== "visible") return;
  positionPawns();
  sizeDeck();
  if (!started) { // still on the landing letter: keep the overview fit
    const fs = fitScale();
    Object.assign(cam, { s: fs, ...clampCam((vw() - BW * fs) / 2, (vh() - BH * fs) / 2, fs) });
    applyCam();
    return;
  }
  const p = currentPawnPoint();
  const s = freeExplore ? cam.s : (drawn === 0 && busy ? cam.s : playScale());
  Object.assign(cam, camTargetFor(p.x, p.y, s));
  applyCam();
});

/* ================= copy from config ================= */
function applyCopy() {
  document.title = KIT.copy.pageTitle;
  el("introHeadline").innerHTML = KIT.copy.introHeadline;
  el("introBody").innerHTML = KIT.copy.introBody.map((p) => `<p>${p}</p>`).join("");
  el("celebrateBtn").textContent = KIT.copy.introCta;
  el("giftTitle").textContent = KIT.copy.giftTitle;
  el("giftSub").textContent = KIT.copy.giftSub;
  el("formTitle").textContent = KIT.copy.formTitle;
  el("formGiftLead").firstChild.textContent = KIT.copy.formGiftLead + " ";
  el("changeGiftBtn").textContent = KIT.copy.formChangeCta;
  el("fPhoneLabel").textContent = KIT.copy.formPhoneLabel;
  el("fAddressLabel").textContent = KIT.copy.formAddressLabel;
  el("fInstructionsLabel").textContent = KIT.copy.formInstructionsLabel;
  el("submitBtn").textContent = KIT.copy.formSubmitCta;
  el("thanksTitle").textContent = KIT.copy.thanksTitle;
  el("thanksBody").textContent = KIT.copy.thanksBody;
  el("exploreBtn").textContent = KIT.copy.thanksCta;
}

/* ================= wire up ================= */
if ("scrollRestoration" in history) history.scrollRestoration = "manual";
window.scrollTo(0, 0);

buildBoard();
buildGifts();
applyCopy();
setupGiftCards();
primeStage(); // board (dimmed) is the landing backdrop
el("celebrateBtn").addEventListener("click", startExperience);
deck.addEventListener("click", drawCard);
deck.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") { e.preventDefault(); drawCard(); }
});
revealClose.addEventListener("click", closeReveal);
// ESC works like the X (only once the X itself is active)
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" &&
      getComputedStyle(reveal).display !== "none" &&
      revealClose.style.pointerEvents === "auto") {
    closeReveal();
  }
});
el("changeGiftBtn").addEventListener("click", changeGift);
claimForm.addEventListener("submit", submitClaim);
el("exploreBtn").addEventListener("click", startFreeExplore);
