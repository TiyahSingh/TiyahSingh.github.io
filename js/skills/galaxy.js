(function () {
  "use strict";

  const DATA = window.SKILL_GALAXY;
  if (!DATA || !DATA.orbits) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const system = document.getElementById("galaxy-system");
  const decor = document.getElementById("galaxy-decor");
  const starsCanvas = document.getElementById("galaxy-stars");
  const categoryPanel = document.getElementById("galaxy-category-panel");
  const skillPanel = document.getElementById("galaxy-skill-panel");
  const backdrop = document.getElementById("galaxy-backdrop");

  if (!system) return;

  /* ---------- stars canvas ---------- */
  function initStars() {
    if (!starsCanvas) return;
    const ctx = starsCanvas.getContext("2d");
    let w = 0;
    let h = 0;
    let stars = [];
    let shooting = [];
    let raf = 0;

    function resize() {
      w = starsCanvas.width = window.innerWidth * devicePixelRatio;
      h = starsCanvas.height = window.innerHeight * devicePixelRatio;
      starsCanvas.style.width = "100%";
      starsCanvas.style.height = "100%";
      const count = Math.min(900, Math.floor((w * h) / 4500));
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: (Math.random() * 1.4 + 0.2) * devicePixelRatio,
        a: Math.random() * 0.7 + 0.2,
        tw: Math.random() * Math.PI * 2,
        sp: 0.01 + Math.random() * 0.03,
      }));
    }

    function spawnShoot() {
      if (reduceMotion) return;
      if (Math.random() > 0.015) return;
      shooting.push({
        x: Math.random() * w,
        y: Math.random() * h * 0.5,
        len: 40 + Math.random() * 80,
        spd: 6 + Math.random() * 8,
        life: 1,
        ang: Math.PI * 0.15 + Math.random() * 0.2,
      });
    }

    function frame() {
      ctx.clearRect(0, 0, w, h);
      for (const s of stars) {
        s.tw += s.sp;
        const a = s.a * (0.55 + 0.45 * Math.sin(s.tw));
        ctx.beginPath();
        ctx.fillStyle = `rgba(255,240,255,${a})`;
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      spawnShoot();
      for (let i = shooting.length - 1; i >= 0; i--) {
        const sh = shooting[i];
        const dx = Math.cos(sh.ang) * sh.len;
        const dy = Math.sin(sh.ang) * sh.len;
        const g = ctx.createLinearGradient(sh.x, sh.y, sh.x + dx, sh.y + dy);
        g.addColorStop(0, `rgba(255,200,255,${sh.life})`);
        g.addColorStop(1, "rgba(180,160,255,0)");
        ctx.strokeStyle = g;
        ctx.lineWidth = 1.5 * devicePixelRatio;
        ctx.beginPath();
        ctx.moveTo(sh.x, sh.y);
        ctx.lineTo(sh.x + dx, sh.y + dy);
        ctx.stroke();
        sh.x += Math.cos(sh.ang) * sh.spd;
        sh.y += Math.sin(sh.ang) * sh.spd;
        sh.life -= 0.02;
        if (sh.life <= 0) shooting.splice(i, 1);
      }
      raf = requestAnimationFrame(frame);
    }

    resize();
    window.addEventListener("resize", resize);
    if (reduceMotion) {
      ctx.clearRect(0, 0, w, h);
      for (const s of stars) {
        ctx.beginPath();
        ctx.fillStyle = `rgba(255,240,255,${s.a})`;
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      frame();
    }
  }

  /* ---------- decorations (real sticker images) ---------- */
  const STICKERS = [
    "heart.png", "sparkles.png", "star.png", "moon.png", "butterfly.png",
    "phone.png", "laptop.png", "teddy.png", "satellite.png", "planet.png",
    "dizzy.png", "cherry.png", "ribbon.png", "crystal.png", "kiss.png",
  ];

  function placeDecor() {
    if (!decor) return;
    decor.innerHTML = "";
    const n = window.matchMedia("(max-width: 720px)").matches ? 12 : 20;
    for (let i = 0; i < n; i++) {
      const el = document.createElement("img");
      const file = STICKERS[i % STICKERS.length];
      el.className = "galaxy-float galaxy-float--img";
      el.src = "/assets/galaxy/" + file;
      el.alt = "";
      el.setAttribute("aria-hidden", "true");
      el.draggable = false;
      el.style.left = `${6 + Math.random() * 88}%`;
      el.style.top = `${8 + Math.random() * 78}%`;
      el.style.setProperty("--d", `${(Math.random() * 5 + 4.5).toFixed(1)}s`);
      el.style.setProperty("--delay", `${(-Math.random() * 8).toFixed(1)}s`);
      el.style.setProperty("--scale", `${(0.7 + Math.random() * 0.85).toFixed(2)}`);
      el.style.setProperty("--rot", `${(Math.random() * 36 - 18).toFixed(0)}deg`);
      decor.appendChild(el);
    }
  }

  /* ---------- build orbits ---------- */
  function levelMeta(level) {
    return DATA.levels[level] || DATA.levels.discovered;
  }

  function buildSystem() {
    system.innerHTML = "";

    const core = document.createElement("button");
    core.type = "button";
    core.className = "galaxy-core";
    core.setAttribute("aria-label", DATA.title);
    core.innerHTML = `
      <span class="galaxy-core__glow"></span>
      <span class="galaxy-core__body"></span>
      <span class="galaxy-core__ring"></span>
      <span class="galaxy-core__label">${escapeHtml(DATA.title)}</span>
    `;
    core.addEventListener("click", () => closeAll());
    system.appendChild(core);

    DATA.orbits.forEach((orbit, index) => {
      const size = 34 + index * 11; /* % of system */
      const ring = document.createElement("div");
      ring.className = "galaxy-ring";
      ring.dataset.orbit = orbit.id;
      ring.style.setProperty("--i", String(index));
      ring.style.setProperty("--hue", String(orbit.hue));
      ring.style.setProperty("--size", `${size}%`);
      ring.style.setProperty("--spin", `${(52 + index * 16) * (index % 2 ? 1 : -1)}s`);

      const path = document.createElement("div");
      path.className = "galaxy-ring__path";
      ring.appendChild(path);

      const angle = (index / DATA.orbits.length) * 360 + (index % 2 ? 28 : -18);
      const holder = document.createElement("div");
      holder.className = "galaxy-ring__holder";
      holder.style.setProperty("--angle", `${angle}deg`);

      const planet = document.createElement("button");
      planet.type = "button";
      planet.className = `galaxy-planet galaxy-planet--${orbit.planet}`;
      planet.dataset.orbitId = orbit.id;
      planet.style.setProperty("--hue", String(orbit.hue));
      planet.setAttribute("aria-expanded", "false");
      planet.setAttribute("aria-controls", "galaxy-category-panel");
      planet.innerHTML = `
        <span class="galaxy-planet__halo"></span>
        <span class="galaxy-planet__body"></span>
        <span class="galaxy-planet__shine"></span>
        <span class="galaxy-planet__sat" aria-hidden="true"></span>
        <span class="galaxy-planet__name">
          <span class="galaxy-planet__title">${escapeHtml(orbit.short)}</span>
        </span>
      `;
      planet.addEventListener("click", (e) => {
        e.stopPropagation();
        openCategory(orbit, planet);
      });
      holder.appendChild(planet);
      ring.appendChild(holder);

      for (let m = 0; m < 2; m++) {
        const moonHold = document.createElement("div");
        moonHold.className = "galaxy-moonlet-hold";
        moonHold.style.setProperty("--angle", `${angle + 85 + m * 110}deg`);
        const moon = document.createElement("span");
        moon.className = "galaxy-moonlet";
        moon.setAttribute("aria-hidden", "true");
        moonHold.appendChild(moon);
        ring.appendChild(moonHold);
      }

      system.appendChild(ring);
    });
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function starsMarkup(n) {
    return Array.from({ length: 4 }, (_, i) =>
      `<span class="galaxy-lvl-star${i < n ? " is-on" : ""}" aria-hidden="true"></span>`
    ).join("");
  }

  /* ---------- panels ---------- */
  let activePlanet = null;

  function openCategory(orbit, planetBtn) {
    closeSkill();
    if (activePlanet && activePlanet !== planetBtn) {
      activePlanet.classList.remove("is-active");
      activePlanet.setAttribute("aria-expanded", "false");
    }
    activePlanet = planetBtn;
    planetBtn.classList.add("is-active");
    planetBtn.setAttribute("aria-expanded", "true");

    const skillsHtml = orbit.skills
      .map((sk) => {
        const meta = levelMeta(sk.level);
        return `
          <button type="button" class="galaxy-skill-chip" data-skill="${escapeHtml(sk.id)}" data-orbit="${escapeHtml(orbit.id)}" style="--hue:${orbit.hue}">
            <span class="galaxy-skill-chip__glow" data-level="${escapeHtml(sk.level)}"></span>
            <span class="galaxy-skill-chip__name">${escapeHtml(sk.name)}</span>
            <span class="galaxy-skill-chip__lvl">${escapeHtml(meta.label)}</span>
            <span class="galaxy-skill-chip__stars">${starsMarkup(meta.stars)}</span>
          </button>
        `;
      })
      .join("");

    categoryPanel.innerHTML = `
      <div class="galaxy-panel__chrome">
        <img class="galaxy-panel__sticker galaxy-panel__sticker--tl" src="/assets/galaxy/heart.png" alt="" aria-hidden="true">
        <img class="galaxy-panel__sticker galaxy-panel__sticker--tr" src="/assets/galaxy/sparkles.png" alt="" aria-hidden="true">
        <button type="button" class="galaxy-panel__close" aria-label="Close">×</button>
        <p class="galaxy-panel__eyebrow">${escapeHtml(orbit.cute || "a little corner of my galaxy")}</p>
        <h2 class="galaxy-panel__title">${escapeHtml(orbit.name)}</h2>
        <p class="galaxy-panel__desc">${escapeHtml(orbit.description)}</p>
        <div class="galaxy-panel__legend" aria-hidden="true">
          ${Object.entries(DATA.levels)
            .map(
              ([key, lv]) =>
                `<span class="galaxy-legend" data-level="${key}"><span class="galaxy-legend__dot"></span>${escapeHtml(lv.label)}</span>`
            )
            .join("")}
        </div>
        <div class="galaxy-panel__skills" role="list">${skillsHtml}</div>
        <p class="galaxy-panel__hint">tap a skill for more ♡</p>
      </div>
    `;

    categoryPanel.hidden = false;
    categoryPanel.classList.add("is-open");
    if (backdrop) {
      backdrop.hidden = false;
      backdrop.classList.add("is-open");
    }
    requestAnimationFrame(() => categoryPanel.classList.add("is-visible"));

    categoryPanel.querySelector(".galaxy-panel__close")?.addEventListener("click", closeAll);
    categoryPanel.querySelectorAll(".galaxy-skill-chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        const skill = orbit.skills.find((s) => s.id === chip.dataset.skill);
        if (skill) openSkill(orbit, skill);
      });
    });
  }

  function openSkill(orbit, skill) {
    const meta = levelMeta(skill.level);
    skillPanel.innerHTML = `
      <div class="galaxy-panel__chrome galaxy-panel__chrome--skill">
        <img class="galaxy-panel__sticker galaxy-panel__sticker--tl" src="/assets/galaxy/star.png" alt="" aria-hidden="true">
        <button type="button" class="galaxy-panel__close" aria-label="Close">×</button>
        <p class="galaxy-panel__eyebrow">from ${escapeHtml(orbit.short.toLowerCase())}</p>
        <h3 class="galaxy-panel__title galaxy-panel__title--sm">${escapeHtml(skill.name)}</h3>
        <p class="galaxy-panel__tech">${escapeHtml(skill.tech || "")}</p>
        <div class="galaxy-panel__level" data-level="${escapeHtml(skill.level)}">
          <span class="galaxy-panel__level-label">${escapeHtml(meta.label)}</span>
          <span class="galaxy-panel__level-stars">${starsMarkup(meta.stars)}</span>
          <span class="galaxy-panel__level-blurb">${escapeHtml(meta.blurb)}</span>
        </div>
        <p class="galaxy-panel__desc">${escapeHtml(skill.note || "")}</p>
        <button type="button" class="galaxy-panel__back">← back</button>
      </div>
    `;
    categoryPanel.classList.add("is-dimmed");
    skillPanel.hidden = false;
    skillPanel.classList.add("is-open");
    requestAnimationFrame(() => skillPanel.classList.add("is-visible"));
    skillPanel.querySelector(".galaxy-panel__close")?.addEventListener("click", closeSkill);
    skillPanel.querySelector(".galaxy-panel__back")?.addEventListener("click", closeSkill);
  }

  function closeSkill() {
    skillPanel.classList.remove("is-visible", "is-open");
    skillPanel.hidden = true;
    skillPanel.innerHTML = "";
    categoryPanel.classList.remove("is-dimmed");
  }

  function closeAll() {
    closeSkill();
    categoryPanel.classList.remove("is-visible", "is-open");
    categoryPanel.hidden = true;
    categoryPanel.innerHTML = "";
    if (backdrop) {
      backdrop.classList.remove("is-open");
      backdrop.hidden = true;
    }
    if (activePlanet) {
      activePlanet.classList.remove("is-active");
      activePlanet.setAttribute("aria-expanded", "false");
      activePlanet = null;
    }
  }

  backdrop?.addEventListener("click", closeAll);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (!skillPanel.hidden) closeSkill();
      else closeAll();
    }
  });

  /* soft parallax on pointer */
  if (!reduceMotion) {
    const stage = document.querySelector(".galaxy-stage");
    stage?.addEventListener("pointermove", (e) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 12;
      const y = (e.clientY / window.innerHeight - 0.5) * 10;
      system.style.transform = `translate(${x}px, ${y}px)`;
    });
  }

  /* explore exit */
  const params = new URLSearchParams(location.search);
  if (params.get("from") === "explore") {
    document.body.classList.add("from-explore");
  }

  initStars();
  placeDecor();
  buildSystem();
  window.addEventListener("resize", () => {
    placeDecor();
  });
})();
