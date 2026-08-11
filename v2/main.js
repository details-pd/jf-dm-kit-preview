/* =========================================================
   Jonny Fruits DM Kit v2 — finalized flow (Aug 10 designs)
   Screen 01 intro → Screen 02 drive → Screen 3 house popup
   → drive → Screen 4 bassinet popup → Screens 5/6 gift cards
   → form → thanks → free drive.
   ========================================================= */

const el = (id) => document.getElementById(id);
const stage = el("stage");
const scrollCue = el("scrollCue");
const car = el("car");

/* ---------- stable viewport unit ----------
   iOS collapses/expands its toolbar while scrolling, which changes vh and
   made the whole world (car included) resize mid-drive. Everything is
   sized with --u instead: 1% of the LARGE viewport (100lvh), measured
   here, which stays constant while the toolbar moves. */
let UNIT = window.innerHeight / 100;
function measureUnit() {
  const probe = document.createElement("div");
  probe.style.cssText =
    "position:fixed;top:0;left:0;width:1px;visibility:hidden;pointer-events:none;height:100vh;";
  if (window.CSS && CSS.supports("height", "100lvh")) probe.style.height = "100lvh";
  document.body.appendChild(probe);
  UNIT = probe.getBoundingClientRect().height / 100;
  probe.remove();
  document.documentElement.style.setProperty("--u", UNIT + "px");
}
measureUnit();

/* ---------- world geometry (Screen 02 frame: 4628 x 1080) ---------- */
const FRAME_W = 4628, FRAME_H = 1080;
const worldWidth = () => FRAME_W * (UNIT * 100 / FRAME_H);
const travel = () => Math.max(0, worldWidth() - window.innerWidth);

function sizeScrollDriver() {
  el("scrollDriver").style.height = window.innerHeight + travel() + "px";
}
sizeScrollDriver();
window.addEventListener("resize", () => {
  measureUnit();
  sizeScrollDriver();
});

/* ---------- car sprite + spinning wheels ----------
   The driving-pose render has a speckled near-white backdrop: flood-fill
   from the borders to clear it (interior whites like the windshield
   survive). The wheels are then lifted out of the SAME processed pixels
   as circular crops and rotated in place — seamless. */
const CAR_SRC = "assets/jonny-car-drive.png";
const CAR_ASPECT = 2156 / 2694; // sprite h/w
/* cx/cy/r are detected from the sprite's silver rims at load — hand-tuned
   values wobbled because the crop wasn't perfectly concentric */
const WHEELS = [
  { id: "wheelRear",  side: "left",  cx: 0, cy: 0, r: 0 },
  { id: "wheelFront", side: "right", cx: 0, cy: 0, r: 0 },
];
let wheelRadiusPx = 0; // on-screen radius, for rotation math

/* find each wheel's exact center: centroid of the silver rim pixels inside
   a tight window around the wheel (grays only — the blue-tinted windshield
   glass fooled a looser version of this) */
function detectWheels(px, w, h) {
  const windows = {
    left:  { x0: 0.16, x1: 0.27, y0: 0.58, y1: 0.73 },
    right: { x0: 0.71, x1: 0.83, y0: 0.58, y1: 0.73 },
  };
  WHEELS.forEach((wl) => {
    const win = windows[wl.side];
    const pts = [];
    let sx = 0, sy = 0;
    for (let y = Math.floor(win.y0 * h); y < win.y1 * h; y++) {
      for (let x = Math.floor(win.x0 * w); x < win.x1 * w; x++) {
        const i = (y * w + x) * 4;
        if (px[i + 3] < 200) continue;
        const r = px[i], g = px[i + 1], bl = px[i + 2];
        const mx = Math.max(r, g, bl), mn = Math.min(r, g, bl);
        if (mn > 170 && mx < 245 && mx - mn < 20 && bl - r < 12) {
          pts.push(x, y); sx += x; sy += y;
        }
      }
    }
    const n = pts.length / 2;
    if (!n) return;
    const cx = sx / n, cy = sy / n;
    // robust rim radius: stray bright pixels at the tire edge poison the
    // max, so take the 90th percentile distance instead
    const ds = [];
    for (let k = 0; k < pts.length; k += 2) {
      ds.push(Math.hypot(pts[k] - cx, pts[k + 1] - cy));
    }
    ds.sort((a, b) => a - b);
    const rimR = ds[Math.floor(ds.length * 0.9)];
    wl.cx = cx / w;
    wl.cy = cy / h;
    wl.r = (rimR * 1.25) / w; // into the tire ring, not past it
  });
}

function loadCar() {
  const img = new Image();
  img.onload = () => {
    const w = img.width, h = img.height;
    const off = document.createElement("canvas");
    off.width = w; off.height = h;
    const octx = off.getContext("2d");
    octx.drawImage(img, 0, 0);
    const data = octx.getImageData(0, 0, w, h);
    const px = data.data;
    const bgLike = (i) => {
      const r = px[i], g = px[i + 1], b = px[i + 2];
      return Math.min(r, g, b) > 222 && Math.max(r, g, b) - Math.min(r, g, b) < 20;
    };
    const visited = new Uint8Array(w * h);
    const queue = [];
    for (let x = 0; x < w; x++) queue.push(x, x + (h - 1) * w);
    for (let y = 0; y < h; y++) queue.push(y * w, y * w + w - 1);
    while (queue.length) {
      const p = queue.pop();
      if (visited[p]) continue;
      visited[p] = 1;
      if (!bgLike(p * 4)) continue;
      px[p * 4 + 3] = 0;
      const x = p % w, y = (p / w) | 0;
      if (x > 0) queue.push(p - 1);
      if (x < w - 1) queue.push(p + 1);
      if (y > 0) queue.push(p - w);
      if (y < h - 1) queue.push(p + w);
    }
    octx.putImageData(data, 0, 0);

    const carCanvas = el("carCanvas");
    carCanvas.width = w; carCanvas.height = h;
    carCanvas.getContext("2d").drawImage(off, 0, 0);

    detectWheels(px, w, h);
    WHEELS.forEach((wl) => {
      const size = Math.round(2 * wl.r * w);
      const canvas = el(wl.id);
      canvas.width = size; canvas.height = size;
      const ctx = canvas.getContext("2d");
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(off,
        wl.cx * w - size / 2, wl.cy * h - size / 2, size, size,
        0, 0, size, size);
      placeWheel(wl);
    });
  };
  img.src = CAR_SRC;
}

function placeWheel(w) {
  const carW = car.offsetWidth;
  const carH = carW * CAR_ASPECT;
  const d = 2 * w.r * carW;
  const canvas = el(w.id);
  canvas.style.width = d + "px";
  canvas.style.height = d + "px";
  canvas.style.left = w.cx * carW - d / 2 + "px";
  canvas.style.top = w.cy * carH - d / 2 + "px";
  wheelRadiusPx = d / 2;
}

window.addEventListener("resize", () => WHEELS.forEach(placeWheel));
loadCar();

function spinWheels(x) {
  if (!wheelRadiusPx) return;
  // world moves 1:1 with scroll in the car's plane; deg = arc / circumference
  const deg = (x / (2 * Math.PI * wheelRadiusPx)) * 360;
  WHEELS.forEach((w) => {
    el(w.id).style.transform = `rotate(${deg}deg)`;
  });
}

/* ---------- parallax ---------- */
const layers = document.querySelectorAll(".layer");
let lastX = 0;

/* ---------- the car can't drive past a milestone until it's been seen ----------
   Gate limits are computed analytically from the layer geometry (stale
   DOM rects let fast scroll jumps leap the wall). Landmark centers in
   stable units, from the plane offsets + hitbox fractions in styles.css:
   house  (mid plane, speed 0.7): -5u  + 36.55% of 450.8u = 159.8u
   bassinet (fg plane, speed 1.0): -24.3u + 74.8% of 475.6u = 331.4u */
const GATE_DX = 0.18; // stop with the landmark this far ahead (of vw)
const seen = { msHouse: false, msBassinet: false };

function gateLimit() {
  const vw = window.innerWidth / 100;
  const carCenter = 25 * vw + 23 * UNIT; // car left 25vw + half of 46u width
  if (!seen.msHouse) return (159.8 * UNIT - carCenter - GATE_DX * 100 * vw) / 0.7;
  if (!seen.msBassinet) return (331.4 * UNIT - carCenter - GATE_DX * 100 * vw) / 1.0;
  return Infinity;
}

function render() {
  let x = window.scrollY;
  const limit = gateLimit();
  if (x > limit) {
    x = Math.max(0, limit);
    window.scrollTo(0, x); // hard wall until the milestone is clicked
  }
  layers.forEach((layer) => {
    layer.style.transform = `translateX(${-x * parseFloat(layer.dataset.speed)}px)`;
  });
  spinWheels(x);
  lastX = x;
  armMilestones();
  if (x > 40) scrollCue.classList.add("hidden");
}
window.addEventListener("scroll", render, { passive: true });

/* ---------- scroll lock while any card/overlay is up ---------- */
function lockScroll(on) {
  document.documentElement.style.overflow = on ? "hidden" : "";
  document.body.style.overflow = on ? "hidden" : "";
}

/* ---------- milestones arm (sparkles) when the car pulls up ---------- */
const milestones = [
  { id: "msHouse", img: "assets/popup-date.png", caption: "The first step of a beautiful journey together.",
    alt: "Jonny and his wife at their first dinner date, surrounded by flowers" },
  { id: "msBassinet", img: "assets/popup-carriage.png", caption: "The greatest chapter yet",
    alt: "A vintage baby carriage beside a wrapped gift and envelope" },
];

function armMilestones() {
  milestones.forEach((m) => {
    const node = el(m.id);
    const rect = node.getBoundingClientRect();
    const carRect = car.getBoundingClientRect();
    const dx = rect.left + rect.width / 2 - (carRect.left + carRect.width / 2);
    const near = dx > window.innerWidth * 0.02 && dx < window.innerWidth * 0.45;
    node.classList.toggle("armed", near);
  });
}

/* ---------- Screens 3/4: spotlight popups ---------- */
const msPopup = el("msPopup");
let bassinetSeen = false;

function openMilestone(m) {
  const node = el(m.id);
  const r = node.getBoundingClientRect();
  msPopup.style.setProperty("--spot-x", r.left + r.width / 2 + "px");
  msPopup.style.setProperty("--spot-y", r.top + r.height / 2 + "px");
  el("msCardImg").src = m.img;
  el("msCardImg").alt = m.alt;
  el("msCaption").textContent = m.caption;
  msPopup.classList.add("open");
  lockScroll(true); // the car stays put until the card is dismissed
  gsap.from("#msCard", { x: -60, opacity: 0, duration: 0.5, ease: "back.out(1.3)" });
}

milestones.forEach((m) => {
  el(m.id).addEventListener("click", (e) => {
    e.stopPropagation();
    openMilestone(m);
    seen[m.id] = true; // the gate ahead of this landmark opens
    if (m.id === "msBassinet") bassinetSeen = true;
  });
});

/* clicking anywhere dismisses the milestone popup (wordless, per design);
   dismissing the bassinet popup leads into the gift screen */
msPopup.addEventListener("click", () => {
  msPopup.classList.remove("open");
  lockScroll(false);
  if (bassinetSeen && !giftChosen) {
    setTimeout(() => openGiftScreen(), 250);
  } else {
    gsap.fromTo(car, { scale: 1 }, { scale: 1.05, yoyo: true, repeat: 1, duration: 0.2 });
  }
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && msPopup.classList.contains("open")) msPopup.click();
});

/* ---------- Screen 01: intro ---------- */
el("intro").classList.add("open");
lockScroll(true);
el("startBtn").addEventListener("click", () => {
  el("intro").classList.remove("open");
  lockScroll(false);
  window.scrollTo(0, 0);
  render();
});

/* ---------- Screens 5/6: gift cards ---------- */
const giftScreen = el("giftScreen");
let chosenGift = null;
let giftChosen = false;

function openGiftScreen() {
  giftScreen.classList.add("open");
  lockScroll(true);
  gsap.from(".gift-card", { y: 60, opacity: 0, stagger: 0.12, duration: 0.5, ease: "back.out(1.3)" });
}

function resetGiftSelection() {
  chosenGift = null;
  document.querySelectorAll(".gift-card").forEach((c) =>
    c.classList.remove("chosen", "disabled", "flipped"));
}

document.querySelectorAll(".gift-card").forEach((card) => {
  const flip = () => {
    if (chosenGift || card.classList.contains("disabled")) return;
    card.classList.toggle("flipped");
  };
  card.querySelector(".gift-inner").addEventListener("click", flip);
  card.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); flip(); }
  });
  card.querySelector(".gift-choose").addEventListener("click", (e) => {
    e.stopPropagation();
    if (chosenGift) return;
    chosenGift = card.dataset.gift;
    giftChosen = true;
    card.classList.add("chosen");
    document.querySelectorAll(".gift-card").forEach((o) => {
      if (o !== card) o.classList.add("disabled");
    });
    setTimeout(() => {
      giftScreen.classList.remove("open");
      el("chosenGiftLabel").textContent = chosenGift;
      el("formScreen").classList.add("open");
      gsap.from(".form-card", { y: 40, opacity: 0, duration: 0.5, ease: "back.out(1.3)" });
    }, 600);
  });
});

el("changeGiftBtn").addEventListener("click", () => {
  el("formScreen").classList.remove("open");
  giftChosen = false;
  resetGiftSelection();
  openGiftScreen();
});

/* ---------- form ---------- */
el("claimForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const formError = el("formError");
  formError.textContent = "";
  const name = el("fName").value.trim();
  const phone = el("fPhone").value.trim();
  const address = el("fAddress").value.trim();
  if (!name || !phone || !address) {
    formError.textContent = "Please fill in your name, phone number, and address.";
    return;
  }
  const payload = { gift: chosenGift, name, phone, address, submittedAt: new Date().toISOString() };
  // TODO(backend): Apps Script notifier is deployed; wire the fetch here
  // once the one-time authorization is granted.
  console.log("CLAIM SUBMISSION (v2 stub):", payload);
  el("formScreen").classList.remove("open");
  el("thanksScreen").classList.add("open");
});

document.querySelectorAll("[data-close]").forEach((btn) =>
  btn.addEventListener("click", () => {
    el(btn.dataset.close).classList.remove("open");
    if (!document.querySelector(".overlay.open")) lockScroll(false);
  }));

/* always start at the top of the drive */
if ("scrollRestoration" in history) history.scrollRestoration = "manual";
window.scrollTo(0, 0);
render();
