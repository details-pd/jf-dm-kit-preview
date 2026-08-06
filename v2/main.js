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
    const near = Math.abs(rect.left + rect.width / 2 - (carRect.left + carRect.width / 2)) < window.innerWidth * 0.25;
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

document.querySelectorAll("[data-close]").forEach((btn) =>
  btn.addEventListener("click", () => closePopup(btn.dataset.close)));

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
