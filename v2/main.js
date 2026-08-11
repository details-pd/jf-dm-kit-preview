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

/* ---------- world geometry (Screen 02 frame: 4628 x 1080) ---------- */
const FRAME_W = 4628, FRAME_H = 1080;
const worldWidth = () => FRAME_W * (window.innerHeight / FRAME_H);
const travel = () => Math.max(0, worldWidth() - window.innerWidth);

function sizeScrollDriver() {
  el("scrollDriver").style.height = window.innerHeight + travel() + "px";
}
sizeScrollDriver();
window.addEventListener("resize", sizeScrollDriver);

/* ---------- spinning wheels ----------
   The wheels are baked into the sprite, so we lift each wheel out as a
   circular crop of the SAME pixels and rotate it in place — seamless.
   Fractions of the sprite (center x, center y, radius), tuned to the art. */
const WHEELS = [
  { id: "wheelRear",  cx: 0.212, cy: 0.712, r: 0.088 },
  { id: "wheelFront", cx: 0.769, cy: 0.712, r: 0.088 },
];
let wheelRadiusPx = 0; // on-screen radius, for rotation math

function buildWheels() {
  const img = new Image();
  img.onload = () => {
    WHEELS.forEach((w) => {
      const size = Math.round(2 * w.r * img.width);
      const canvas = el(w.id);
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(img,
        w.cx * img.width - size / 2, w.cy * img.height - size / 2, size, size,
        0, 0, size, size);
      placeWheel(w);
    });
  };
  img.src = "assets/jonny-car.png";
}

function placeWheel(w) {
  const carW = car.offsetWidth;
  const d = 2 * w.r * carW; // sprite is square, so fractions map 1:1
  const canvas = el(w.id);
  canvas.style.width = d + "px";
  canvas.style.height = d + "px";
  canvas.style.left = w.cx * carW - d / 2 + "px";
  canvas.style.top = w.cy * carW - d / 2 + "px";
  wheelRadiusPx = d / 2;
}

window.addEventListener("resize", () => WHEELS.forEach(placeWheel));
buildWheels();

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

function render() {
  const x = window.scrollY;
  layers.forEach((layer) => {
    layer.style.transform = `translateX(${-x * parseFloat(layer.dataset.speed)}px)`;
  });
  const moving = Math.abs(x - lastX) > 0.5;
  gsap.to(car, { y: moving ? -4 : 0, duration: 0.3, overwrite: "auto" });
  spinWheels(x);
  lastX = x;
  armMilestones();
  if (x > 40) scrollCue.classList.add("hidden");
}
window.addEventListener("scroll", render, { passive: true });

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
  gsap.from("#msCard", { x: -60, opacity: 0, duration: 0.5, ease: "back.out(1.3)" });
}

milestones.forEach((m) => {
  el(m.id).addEventListener("click", (e) => {
    e.stopPropagation();
    openMilestone(m);
    if (m.id === "msBassinet") bassinetSeen = true;
  });
});

/* clicking anywhere dismisses the milestone popup (wordless, per design);
   dismissing the bassinet popup leads into the gift screen */
msPopup.addEventListener("click", () => {
  msPopup.classList.remove("open");
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
el("startBtn").addEventListener("click", () => {
  el("intro").classList.remove("open");
  window.scrollTo(0, 0);
  render();
});

/* ---------- Screens 5/6: gift cards ---------- */
const giftScreen = el("giftScreen");
let chosenGift = null;
let giftChosen = false;

function openGiftScreen() {
  giftScreen.classList.add("open");
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
  btn.addEventListener("click", () => el(btn.dataset.close).classList.remove("open")));

/* always start at the top of the drive */
if ("scrollRestoration" in history) history.scrollRestoration = "manual";
window.scrollTo(0, 0);
render();
