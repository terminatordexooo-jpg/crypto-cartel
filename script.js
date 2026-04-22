// CRYPTO CARTEL — light interactions

// Hero title — staggered type-in on load ("CRYPTO" then "CARTEL", char by char)
(function typeHero() {
  const words = document.querySelectorAll(".hero__word");
  if (!words.length) return;
  const CHAR_STEP = 0.07;
  const WORD_GAP  = 0.18;
  let delay = 0.15;
  words.forEach(word => {
    const text = word.textContent;
    word.textContent = "";
    [...text].forEach(ch => {
      const span = document.createElement("span");
      span.className = "hero__char";
      span.textContent = ch;
      span.style.animationDelay = delay.toFixed(2) + "s";
      word.appendChild(span);
      delay += CHAR_STEP;
    });
    const cursor = document.createElement("span");
    cursor.className = "hero__cursor";
    cursor.style.animationDelay = (delay - CHAR_STEP).toFixed(2) + "s";
    word.appendChild(cursor);
    delay += WORD_GAP;
  });
})();

// countdown to 17 May 2026, 19:00 CET
(function countdown() {
  const target = new Date("2026-05-17T19:00:00+02:00").getTime();
  const el = document.getElementById("countdown");
  if (!el) return;
  const nums = el.querySelectorAll("[data-unit]");

  function tick() {
    const now = Date.now();
    let diff = Math.max(0, target - now);

    const d = Math.floor(diff / 86400000); diff -= d * 86400000;
    const h = Math.floor(diff / 3600000);  diff -= h * 3600000;
    const m = Math.floor(diff / 60000);    diff -= m * 60000;
    const s = Math.floor(diff / 1000);

    const pad = n => String(n).padStart(2, "0");
    const values = { days: pad(d), hours: pad(h), minutes: pad(m), seconds: pad(s) };
    nums.forEach(n => { n.textContent = values[n.dataset.unit]; });
  }
  tick();
  setInterval(tick, 1000);
})();

// public ticket — 1 week timer; at T-0 price flips to $250
(function publicTicketTimer() {
  const STORAGE_KEY = "cc.publicPriceDeadline";
  const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

  const el = document.getElementById("publicTimer");
  if (!el) return;

  let deadline = parseInt(localStorage.getItem(STORAGE_KEY) || "0", 10);
  if (!deadline || deadline < Date.now()) {
    deadline = Date.now() + WEEK_MS;
    localStorage.setItem(STORAGE_KEY, String(deadline));
  }

  const cells = el.querySelectorAll("[data-unit]");
  const priceEl = document.querySelector('.ticket__amount[data-unit="price"]');
  const noteEl  = document.querySelector('.ticket__note');
  const pad = n => String(n).padStart(2, "0");

  function tick() {
    const diff = deadline - Date.now();
    if (diff <= 0) {
      if (priceEl) priceEl.textContent = "250";
      if (noteEl)  noteEl.style.display = "none";
      el.style.display = "none";
      return;
    }
    let left = diff;
    const d = Math.floor(left / 86400000); left -= d * 86400000;
    const h = Math.floor(left / 3600000);  left -= h * 3600000;
    const m = Math.floor(left / 60000);    left -= m * 60000;
    const s = Math.floor(left / 1000);
    const values = { d: pad(d), h: pad(h), m: pad(m), s: pad(s) };
    cells.forEach(c => { c.textContent = values[c.dataset.unit]; });
  }
  tick();
  setInterval(tick, 1000);
})();

// scroll reveal
(function reveal() {
  const targets = document.querySelectorAll(".section, .ticket, .partner, .card, .cashback__tile, .meta, .countdown__cell");
  targets.forEach(t => t.classList.add("reveal"));

  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add("is-in");
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.1, rootMargin: "0px 0px -40px 0px" });

  targets.forEach(t => io.observe(t));
})();

// nav highlight on scroll
(function navState() {
  const nav = document.querySelector(".nav");
  if (!nav) return;
  const onScroll = () => {
    nav.style.boxShadow = window.scrollY > 10 ? "0 10px 30px rgba(0,0,0,0.4)" : "none";
  };
  window.addEventListener("scroll", onScroll, { passive: true });
})();
