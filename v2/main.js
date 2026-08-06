/* =========================================================
   Jonny Fruits DM Kit v2 — side-scrolling parallax drive
   Vertical page scroll drives the world horizontally.
   Flow: intro (blurred world + card) → drive → church popup
   → drive → bassinet → gift flip cards → form → thanks.
   ========================================================= */

const el = (id) => document.getElementById(id);
const stage = el("stage");
const scrollCue = el("scrollCue");
const car = el("car");

/* ---------- car sprites: strip the render's beige backdrop ----------
   Flood-fill from the borders so interior whites (racing stripes,
   headlights) survive — a plain chroma key would eat them. */
function loadCarSprite(canvasId, src) {
  const canvas = el(canvasId);
  const img = new Image();
  img.onload = () => {
    const w = (canvas.width = img.width);
    const h = (canvas.height = img.height);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);
    const data = ctx.getImageData(0, 0, w, h);
    const px = data.data;
    const bgLike = (i) => {
      const r = px[i], g = px[i + 1], b = px[i + 2];
      const max = Math.max(r, g, b), min = Math.min(r, g, b);
      return min > 195 && max - min < 26; // pale, low-saturation beige/white
    };
    const visited = new Uint8Array(w * h);
    const queue = [];
    for (let x = 0; x < w; x++) { queue.push(x, x + (h - 1) * w); }
    for (let y = 0; y < h; y++) { queue.push(y * w, y * w + w - 1); }
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
    ctx.putImageData(data, 0, 0);
  };
  img.src = src;
}
loadCarSprite("carJonny", "assets/car-jonny.png");
loadCarSprite("carCouple", "assets/car-couple.png");

/* wife joins the drive after the wedding milestone */
function wifeJoinsCar() {
  gsap.timeline()
    .to("#carJonny", { opacity: 0, duration: 0.35 }, 0.1)
    .fromTo("#carCouple", { opacity: 0 }, { opacity: 1, duration: 0.45 }, 0)
    .fromTo(car, { scale: 1 }, { scale: 1.06, yoyo: true, repeat: 1, duration: 0.2 }, 0.1);
}

/* ---------- world geometry ---------- */
// how far the world scrolls horizontally, in viewport-widths
const WORLD_VW = 5.6;
const worldWidth = () => WORLD_VW * window.innerWidth;
const travel = () => worldWidth() - window.innerWidth;

function sizeScrollDriver() {
  // vertical scroll distance == horizontal travel distance
  el("scrollDriver").style.height = window.innerHeight + travel() + "px";
}
sizeScrollDriver();
window.addEventListener("resize", sizeScrollDriver);

/* ---------- parallax ---------- */
const layers = document.querySelectorAll(".layer");

function render() {
  const x = window.scrollY; // 1px scrolled = 1px of world travel
  layers.forEach((layer) => {
    layer.style.transform = `translateX(${-x * parseFloat(layer.dataset.speed)}px)`;
  });
  // car bobs and wheels spin while moving
  const moving = Math.abs(x - lastX) > 0.5;
  gsap.to(car, { y: moving ? -4 : 0, duration: 0.3, overwrite: "auto" });
  document.querySelectorAll(".hub").forEach((h) => {
    h.style.transformOrigin = "center";
    h.style.transform = `rotate(${x * 0.8}deg)`;
  });
  lastX = x;
  armMilestones();
  if (x > 40) scrollCue.classList.add("hidden");
}
let lastX = 0;
window.addEventListener("scroll", render, { passive: true });

/* ---------- milestones arm when the car reaches them ---------- */
const milestones = [
  { id: "msChurch", popup: "weddingPopup", seen: false },
  { id: "msBassinet", popup: "giftPopup", seen: false },
];

function armMilestones() {
  milestones.forEach((m) => {
    const node = el(m.id);
    const rect = node.getBoundingClientRect();
    const carRect = car.getBoundingClientRect();
    // armed while the landmark sits AHEAD of the car (car pulls up beside
    // it, not on top of it) — dx is landmark-center minus car-center
    const dx = rect.left + rect.width / 2 - (carRect.left + carRect.width / 2);
    const near = dx > window.innerWidth * 0.02 && dx < window.innerWidth * 0.45;
    node.classList.toggle("armed", near);
  });
}

/* ---------- popups on blurred backdrops ---------- */
function openPopup(id) {
  stage.classList.add("blurred");
  el(id).classList.add("open");
  gsap.from("#" + id + " .popup-card", { y: 40, opacity: 0, scale: 0.92, duration: 0.45, ease: "back.out(1.4)" });
}
function closePopup(id) {
  el(id).classList.remove("open");
  if (!document.querySelector(".popup-overlay.open")) stage.classList.remove("blurred");
}

let wifeAboard = false;
document.querySelectorAll("[data-close]").forEach((btn) =>
  btn.addEventListener("click", () => {
    closePopup(btn.dataset.close);
    // closing the wedding card is the moment she hops in
    if (btn.dataset.close === "weddingPopup" && !wifeAboard) {
      wifeAboard = true;
      wifeJoinsCar();
    }
  }));

el("msChurch").addEventListener("click", () => openPopup("weddingPopup"));
el("msBassinet").addEventListener("click", () => openPopup("giftPopup"));

/* ---------- intro ---------- */
stage.classList.add("blurred");
el("intro").classList.add("open");
el("startBtn").addEventListener("click", () => {
  closePopup("intro");
  window.scrollTo(0, 0);
});

/* ---------- gift selection (flip → choose → form) ---------- */
let chosenGift = null;

function resetGiftSelection() {
  chosenGift = null;
  document.querySelectorAll(".gift-flip").forEach((c) =>
    c.classList.remove("chosen", "disabled", "flipped"));
}

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
    document.querySelectorAll(".gift-flip").forEach((o) => {
      if (o !== card) o.classList.add("disabled");
    });
    setTimeout(() => {
      closePopup("giftPopup");
      el("chosenGiftLabel").textContent = chosenGift;
      openPopup("formPopup");
    }, 550);
  });
});

el("changeGiftBtn").addEventListener("click", () => {
  closePopup("formPopup");
  resetGiftSelection();
  openPopup("giftPopup");
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
  // TODO(backend): same Apps Script notifier as v1 (pending the one-time
  // authorization click); wire the fetch here once it's live.
  console.log("CLAIM SUBMISSION (v2 stub):", payload);
  closePopup("formPopup");
  openPopup("thanksPopup");
});
