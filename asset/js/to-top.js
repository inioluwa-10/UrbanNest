/* =========================================================
   Return-to-top button (shared by every page)
   — injects its own markup, so pages only need this <script>.
   Unique bits:
     1. a circular progress RING that fills as you scroll,
     2. a live PERCENTAGE readout of how far down you are,
     3. a little UrbanNest house that LIFTS OFF on click and
        confirms "TOP" once you're back at the start.
   ========================================================= */
(function () {
  if (window.__toTopInit) return;          // idempotent if included twice
  window.__toTopInit = true;

  const reduceMotion = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "to-top";
  btn.title = "Return to top";
  btn.setAttribute("aria-label", "Return to top of page");
  btn.innerHTML =
    '<svg class="to-top-ring" viewBox="0 0 56 56" aria-hidden="true" focusable="false">' +
      '<circle class="track" cx="28" cy="28" r="24"></circle>' +
      '<circle class="bar" cx="28" cy="28" r="24"></circle>' +
    "</svg>" +
    '<span class="to-top-face" aria-hidden="true">' +
      '<svg class="to-top-house" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
        '<path d="M3 11.4 12 4l9 7.4V20a1 1 0 0 1-1 1h-5.5v-6h-5v6H4a1 1 0 0 1-1-1z"></path>' +
      "</svg>" +
      '<span class="to-top-pct">0%</span>' +
    "</span>";
  document.body.appendChild(btn);

  const bar  = btn.querySelector(".bar");
  const pct  = btn.querySelector(".to-top-pct");
  const R    = 24;
  const CIRC = 2 * Math.PI * R;
  bar.style.strokeDasharray  = CIRC;
  bar.style.strokeDashoffset = CIRC;

  let raf = 0;
  let labelT = 0;
  let locked = false;                       // freeze the label while showing "TOP"

  function paintLabel(p) {
    if (!locked) pct.textContent = Math.round(p * 100) + "%";
  }

  function update() {
    raf = 0;
    const doc = document.documentElement;
    const max = Math.max(1, (doc.scrollHeight || 0) - window.innerHeight);
    const p = Math.min(1, Math.max(0, (window.pageYOffset || doc.scrollTop || 0) / max));
    bar.style.strokeDashoffset = CIRC * (1 - p);
    // 400px on long pages, but scale down on short pages so the button
    // still shows up well before the bottom (never on non-scrollable ones).
    const threshold = Math.min(400, Math.max(80, max * 0.25));
    const scrolled = (window.pageYOffset || doc.scrollTop || 0);
    btn.classList.toggle("show", (scrolled > threshold) || btn.classList.contains("hold"));
    paintLabel(p);
  }

  function schedule() {
    if (!raf) raf = requestAnimationFrame(update);
  }

  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule, { passive: true });

  btn.addEventListener("click", function () {
    clearTimeout(labelT);
    locked = true;
    pct.textContent = "TOP";
    btn.classList.add("hold");
    if (!reduceMotion) {
      btn.classList.remove("launch");
      void btn.offsetWidth;                 // restart the animation
      btn.classList.add("launch");
    }
    const top = 0;
    if ("scrollBehavior" in document.documentElement.style && !reduceMotion) {
      window.scrollTo({ top: top, behavior: "smooth" });
    } else {
      window.scrollTo(0, top);
    }
    labelT = setTimeout(function () {
      btn.classList.remove("launch", "hold");
      locked = false;
      update();
    }, reduceMotion ? 150 : 1000);
  });

  // Keyboard: Home / End jump (only when the button isn't the focus target typing elsewhere)
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Home" || e.target !== document.body) return;
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    schedule();
  });

  update();
  window.addEventListener("load", update);  // recalc after images settle
})();
