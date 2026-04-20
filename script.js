// CRYPTO CARTEL — light interactions

// Hero title — staggered type-in on load ("CRYPTO" then "CARTEL", char by char)
(function typeHero() {
  const words = document.querySelectorAll(".hero__word");
  if (!words.length) return;
  const CHAR_STEP = 0.07;   // seconds between letters
  const WORD_GAP  = 0.18;   // extra pause between words
  let delay = 0.15;         // initial lead-in
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
    // trailing blinking cursor on each word while typing
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

// scroll reveal
(function reveal() {
  const targets = document.querySelectorAll(".section, .ticket, .partner, .card, .ticket-preview, .meta, .countdown__cell");
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

// Jelly Squeeze — no-op when the stage isn't on the page.
(function jellySqueeze() {
  const stage   = document.getElementById("jellyStage");
  const canvas  = document.getElementById("jellyCanvas");
  const trigger = document.getElementById("jellyTrigger");
  const follow  = document.getElementById("jellyFollow");
  const loaderTxt = document.getElementById("jellyLoaderTxt");
  if (!stage || !canvas || !trigger) return;

  const TOTAL_FRAMES = 215;
  const START_FRAME  = 70;
  const SENSITIVITY  = 5.2;
  const SMOOTHING    = 0.11;
  const BASE_URL     = "https://cerpow.github.io/cerpow-img/jelly/jelly_";

  const state = {
    images: new Array(TOTAL_FRAMES),
    loaded: 0,
    ready: false,
    currentFrame: -1,
    dragFrame: START_FRAME,
    displayFrame: START_FRAME,
    startTime: 0,
    rafId: 0,
    draggable: null,
    followMouse: false,
  };

  const ctx = canvas.getContext("2d");

  // 1) Preload image sequence
  const preload = () => {
    for (let i = 0; i < TOTAL_FRAMES; i++) {
      const img = new Image();
      img.decoding = "async";
      img.src = BASE_URL + String(i).padStart(5, "0") + ".jpg";
      const done = () => {
        state.loaded++;
        const pct = Math.round((state.loaded / TOTAL_FRAMES) * 100);
        if (loaderTxt) loaderTxt.textContent = pct + "%";
        if (state.loaded === TOTAL_FRAMES) onReady();
      };
      img.onload  = done;
      img.onerror = done;
      state.images[i] = img;
    }
  };

  // 2) Canvas sizing with DPR
  const resize = () => {
    const ratio = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight; // stage enforces 4:3 via aspect-ratio
    canvas.width  = w * ratio;
    canvas.height = h * ratio;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(ratio, ratio);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "medium";
    state.currentFrame = -1; // force redraw
  };

  // 3) Animation loop
  const clampFrame = n => Math.max(0, Math.min(TOTAL_FRAMES - 1, Math.floor(n)));

  const tick = () => {
    const now = performance.now();
    const dt  = (now - state.startTime) / 1000;
    state.startTime = now;

    const dampening = 1.0 - Math.exp(-SMOOTHING * 60 * dt);
    state.displayFrame += (state.dragFrame - state.displayFrame) * dampening;

    const f = clampFrame(state.displayFrame);
    const img = state.images[f];
    if (f !== state.currentFrame && img && img.complete && img.naturalWidth) {
      ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
      ctx.drawImage(img, 0, 0, canvas.clientWidth, canvas.clientHeight);
      state.currentFrame = f;
    }
    state.rafId = requestAnimationFrame(tick);
  };

  // 4) Wire GSAP Draggable
  const initDraggable = () => {
    if (!window.gsap || !window.Draggable) return;
    gsap.registerPlugin(Draggable);
    gsap.set(canvas, { y: START_FRAME / SENSITIVITY });

    const MAX_Y = (TOTAL_FRAMES - 1) / SENSITIVITY;
    const ARM_THRESHOLD = 0.7; // squeeze 70% of the way → armed
    let armed = false;

    state.draggable = Draggable.create(canvas, {
      trigger: trigger,
      type: "y",
      inertia: true,
      bounds: { minY: 0, maxY: MAX_Y },
      allowNativeTouchScrolling: false,
      dragResistance: 0.5,
      edgeResistance: 1,
      minDuration: 0.4,
      onDragStart() {
        armed = false;
        stage.classList.remove("is-armed", "is-sending");
      },
      onDrag() {
        state.dragFrame = this.y * SENSITIVITY;
        const nowArmed = this.y / MAX_Y > ARM_THRESHOLD;
        if (nowArmed !== armed) {
          armed = nowArmed;
          stage.classList.toggle("is-armed", armed);
        }
      },
      onThrowUpdate() { state.dragFrame = this.y * SENSITIVITY; },
      onDragEnd() {
        stage.classList.remove("is-armed");
        if (this.y / MAX_Y > ARM_THRESHOLD) {
          submitParentForm();
        }
      },
    })[0];
  };

  // Submit the enclosing form via a squeeze-send pulse, then spring jelly back
  const submitParentForm = () => {
    const form = stage.closest("form");
    if (!form) return;
    stage.classList.add("is-sending");
    setTimeout(() => stage.classList.remove("is-sending"), 700);
    const real = document.getElementById("jellySubmitReal");
    if (real) real.click(); else form.requestSubmit?.();

    // spring the jelly back to its rest position so it can be used again
    if (state.draggable) {
      gsap.to(canvas, {
        y: START_FRAME / SENSITIVITY,
        duration: 0.9,
        ease: "elastic.out(1, 0.55)",
        onUpdate() {
          const y = gsap.getProperty(canvas, "y");
          state.dragFrame = y * SENSITIVITY;
        },
        onComplete() { state.draggable.update(); },
      });
    }
  };

  // 5) Mouse-follow mode
  const onMouseMove = e => {
    if (!state.followMouse) return;
    const normY = e.clientY / window.innerHeight;
    state.dragFrame = normY * (TOTAL_FRAMES - 1);
  };

  const syncFollow = () => {
    state.followMouse = !!(follow && follow.checked);
    stage.classList.toggle("is-follow", state.followMouse);
    if (!state.draggable) return;
    if (state.followMouse) {
      state.draggable.disable();
    } else {
      state.draggable.enable();
      gsap.set(canvas, { y: state.displayFrame / SENSITIVITY });
      state.draggable.update();
    }
  };

  // 6) Ready
  const onReady = () => {
    if (state.ready) return;
    state.ready = true;
    stage.classList.add("is-ready");
    resize();
    initDraggable();
    syncFollow();
    state.startTime = performance.now();
    tick();
  };

  // kick off
  preload();
  window.addEventListener("resize", resize);
  window.addEventListener("mousemove", onMouseMove);
  if (follow) follow.addEventListener("change", syncFollow);
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
