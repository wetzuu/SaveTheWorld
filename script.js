// Reveal-on-scroll, nav behavior, small touches. No dependencies.

// Footer year
document.getElementById("year").textContent = new Date().getFullYear();

// Copy the contact address without taking the visitor away from the page.
document.querySelectorAll(".copy-email").forEach((button) => {
  button.addEventListener("click", async () => {
    const label = button.querySelector(".copy-email-label");
    const originalLabel = label.textContent;
    try {
      await navigator.clipboard.writeText(button.dataset.email);
      label.textContent = "Copied!";
    } catch {
      label.textContent = "Copy unavailable";
    }
    setTimeout(() => { label.textContent = originalLabel; }, 1800);
  });
});

// Header border once scrolled + pixel dachshund that walks the header line.
// The dog's position doubles as a scroll progress indicator; it faces the
// direction you're scrolling and trots while the page moves.
const header = document.querySelector(".site-header");
const dog = document.querySelector(".header-dog");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const DOG_W = 40;
const DOG_PAD = 14;
let lastX = -1;
let walkTimer;

const onScroll = () => {
  header.classList.toggle("scrolled", window.scrollY > 8);

  if (reducedMotion.matches) return; // dog stays put by the logo

  const max = document.documentElement.scrollHeight - window.innerHeight;
  const progress = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
  const track = header.clientWidth - DOG_W - DOG_PAD * 2;
  const x = DOG_PAD + progress * track;

  if (Math.abs(x - lastX) > 0.5) {
    dog.classList.toggle("flip", x < lastX); // face the way it's walking
    dog.classList.add("walking");
    clearTimeout(walkTimer);
    walkTimer = setTimeout(() => dog.classList.remove("walking"), 220);
  }
  lastX = x;
  dog.style.transform = `translateX(${x}px)`;
};

onScroll();
window.addEventListener("scroll", onScroll, { passive: true });
window.addEventListener("resize", onScroll, { passive: true });

// Mobile nav toggle
const toggle = document.querySelector(".nav-toggle");
const menu = document.getElementById("nav-menu");
toggle.addEventListener("click", () => {
  const open = menu.classList.toggle("open");
  toggle.setAttribute("aria-expanded", String(open));
});
// Close menu when a link is chosen
menu.addEventListener("click", (e) => {
  if (e.target.tagName === "A") {
    menu.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
  }
});

// Mark the link(s) for the section currently in view — this drives both the
// nav underline and the side rail's active node, so they stay in lockstep.
const sectionLinks = [...document.querySelectorAll("a[data-section]")];
const sectionIds = [...new Set(sectionLinks.map((a) => a.dataset.section))];
const setActiveSection = (id) => {
  sectionLinks.forEach((link) => {
    link.classList.toggle("active", link.dataset.section === id);
  });
};
const sectionObserver = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) setActiveSection(entry.target.id);
    }
  },
  { rootMargin: "-35% 0px -60% 0px" }
);
sectionIds.forEach((id) => {
  const section = document.getElementById(id);
  if (section) sectionObserver.observe(section);
});

// The ticker loops by translating one half of the track off-screen, so each
// half has to be at least a viewport wide or a gap sweeps through on large
// displays. Clone the authored entries until it is, and keep the scroll speed
// constant (~70px/s) regardless of how many copies that takes.
const tickerTrack = document.querySelector(".ticker-track");

if (tickerTrack && !reducedMotion.matches) {
  const PX_PER_SEC = 90;
  // Snapshot the authored entries before any cloning; the live nodes get
  // replaced below, so keep detached copies as the source of truth.
  const authored = [...tickerTrack.children]
    .slice(0, Math.ceil(tickerTrack.children.length / 2))
    .map((el) => el.cloneNode(true));

  let setWidth = 0;
  let copies = 0;

  const fillTicker = () => {
    if (!setWidth) return;
    const needed = Math.max(2, Math.ceil(window.innerWidth / setWidth) + 1);
    if (needed === copies) return;
    copies = needed;

    const half = document.createDocumentFragment();
    for (let i = 0; i < copies; i++) {
      authored.forEach((el) => half.appendChild(el.cloneNode(true)));
    }
    tickerTrack.replaceChildren();
    tickerTrack.append(half.cloneNode(true), half); // two identical halves → seamless -50%
    tickerTrack.style.animationDuration = `${(setWidth * copies) / PX_PER_SEC}s`;
  };

  // Measure only once the webfont is in — measuring against the fallback makes
  // the track come out too narrow and a gap sweeps through mid-loop.
  const measure = () => {
    setWidth = [...tickerTrack.children]
      .slice(0, authored.length)
      .reduce((sum, el) => sum + el.getBoundingClientRect().width, 0);
    copies = 0;
    fillTicker();
  };

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(measure);
  } else {
    measure();
  }
  window.addEventListener("resize", fillTicker, { passive: true });
}

// Hero stats shuffle their digits for about a second the first time they scroll
// into view, then land on the real figure.
const stats = document.querySelector(".hero-stats");
const statNums = [...document.querySelectorAll(".stat-num")];

// The values are real claims ("05 projects shipped"), so they must end up
// correct even if the shuffle never runs.
const settleStats = () => {
  statNums.forEach((el) => {
    el.textContent = el.dataset.value;
    el.classList.remove("shuffling");
  });
};

if (stats && statNums.length && !reducedMotion.matches) {
  const SHUFFLE_MS = 1000;
  const FRAME_MS = 60; // digit swap rate — fast enough to blur, slow enough to read

  const randomDigits = (length) =>
    Array.from({ length }, () => Math.floor(Math.random() * 10)).join("");

  const shuffle = (el, delay) => {
    const final = el.dataset.value;

    setTimeout(() => {
      el.classList.add("shuffling");
      const start = performance.now();
      let lastFrame = 0;

      const spin = (now) => {
        if (now - start >= SHUFFLE_MS) {
          el.textContent = final;
          el.classList.remove("shuffling");
          return;
        }
        if (now - lastFrame >= FRAME_MS) {
          el.textContent = randomDigits(final.length);
          lastFrame = now;
        }
        requestAnimationFrame(spin);
      };
      requestAnimationFrame(spin);
    }, delay);
  };

  const statsObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        statNums.forEach((el, i) => shuffle(el, i * 90)); // staggered, left to right
        statsObserver.disconnect();
      }
    },
    { threshold: 0.25 }
  );
  statsObserver.observe(stats);
}

// Reveal on scroll (respects prefers-reduced-motion via CSS)
const observer = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    }
  },
  { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
);
document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));

// Safety net: if reveals haven't fired shortly after the page is visible
// (old browser, odd embed context), show everything rather than a blank page.
const revealAll = () => {
  document.querySelectorAll(".reveal:not(.visible)").forEach((el) => el.classList.add("visible"));
};
setTimeout(() => {
  if (document.visibilityState === "visible" && !document.querySelector(".reveal.visible")) {
    revealAll();
    settleStats(); // never leave the stats showing their starting values
  }
}, 2000);
