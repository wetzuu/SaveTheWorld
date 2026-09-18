// Reveal-on-scroll, nav behavior, small touches. No dependencies.

// Footer year
document.getElementById("year").textContent = new Date().getFullYear();

// Copy the contact address without taking the visitor away from the page.
document.querySelectorAll(".copy-email").forEach((button) => {
  button.addEventListener("click", async () => {
    const label = button.querySelector(".copy-email-label");
    button.disabled = true;
    try {
      await navigator.clipboard.writeText(button.dataset.email);
      label.textContent = "Copied!";
    } catch {
      label.textContent = "Copy unavailable";
    }
    setTimeout(() => {
      label.textContent = "Copy";
      button.disabled = false;
    }, 1800);
  });
});

// Header border + signature dachshund scroll-progress indicator.
const header = document.querySelector(".site-header");
const dog = document.querySelector(".header-dog");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const DOG_W = 40;
const DOG_PAD = 14;
let lastX = -1;
let walkTimer;

const onScroll = () => {
  header.classList.toggle("scrolled", window.scrollY > 8);

  if (reducedMotion.matches) {
    clearTimeout(walkTimer);
    dog.classList.remove("walking", "flip");
    dog.style.transform = `translateX(${DOG_PAD}px)`;
    lastX = -1;
    return;
  }

  const max = document.documentElement.scrollHeight - window.innerHeight;
  const progress = max > 0 ? Math.max(0, Math.min(window.scrollY / max, 1)) : 0;
  const track = header.clientWidth - DOG_W - DOG_PAD * 2;
  const x = DOG_PAD + progress * track;

  if (Math.abs(x - lastX) > 0.5) {
    dog.classList.toggle("flip", x < lastX);
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
reducedMotion.addEventListener("change", onScroll);

// Mobile nav toggle
const toggle = document.querySelector(".nav-toggle");
const menu = document.getElementById("nav-menu");
toggle.closest(".nav").classList.add("nav-enhanced");
const closeMenu = () => {
  menu.classList.remove("open");
  toggle.setAttribute("aria-expanded", "false");
};
toggle.addEventListener("click", () => {
  const open = menu.classList.toggle("open");
  toggle.setAttribute("aria-expanded", String(open));
});
// Close menu when a link is chosen
menu.addEventListener("click", (e) => {
  if (e.target.closest("a")) closeMenu();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && menu.classList.contains("open")) {
    closeMenu();
    toggle.focus();
  }
});
document.addEventListener("click", (event) => {
  if (!event.target.closest(".nav")) closeMenu();
});
window.matchMedia("(min-width: 641px)").addEventListener("change", closeMenu);

// Mark the link(s) for the section currently in view — this drives both the
// nav underline and the side rail's active node, so they stay in lockstep.
const sectionLinks = [...document.querySelectorAll("a[data-section]")];
const sectionIds = [...new Set(sectionLinks.map((a) => a.dataset.section))];
const setActiveSection = (id) => {
  sectionLinks.forEach((link) => {
    const active = link.dataset.section === id;
    link.classList.toggle("active", active);
    if (active) link.setAttribute("aria-current", "location");
    else link.removeAttribute("aria-current");
  });
};
if ("IntersectionObserver" in window) {
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

  // Content stays visible if observers are unsupported or motion is reduced.
  if (!reducedMotion.matches) {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            entry.target.classList.remove("reveal-pending");
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    document.querySelectorAll(".reveal").forEach((el) => {
      // Above-the-fold content should never wait for an animation callback.
      if (el.getBoundingClientRect().top < window.innerHeight) return;
      observer.observe(el);
      el.classList.add("reveal-pending");
    });
    reducedMotion.addEventListener("change", () => {
      if (!reducedMotion.matches) return;
      observer.disconnect();
      document.querySelectorAll(".reveal-pending").forEach((el) => {
        el.classList.remove("reveal-pending");
      });
    });
  }
}
