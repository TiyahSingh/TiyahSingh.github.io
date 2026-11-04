(function () {
  "use strict";

  const DATA = window.SKILL_GALAXY;
  if (!DATA || !DATA.orbits) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const system = document.getElementById("galaxy-system");
  const categoryPanel = document.getElementById("galaxy-category-panel");
  const skillPanel = document.getElementById("galaxy-skill-panel");
  const backdrop = document.getElementById("galaxy-backdrop");

  if (!system) return;

  /* deliberate constellation layout — not nested spinning rings */
  const LAYOUT = [
    { x: 50, y: 12, hue: 320 }, /* Design — top */
    { x: 86, y: 32, hue: 280 }, /* Games — upper right */
    { x: 86, y: 70, hue: 190 }, /* Code — lower right */
    { x: 50, y: 90, hue: 145 }, /* Data — bottom */
    { x: 14, y: 70, hue: 45 },  /* Story — lower left */
    { x: 14, y: 32, hue: 0 },   /* Extra — upper left */
  ];

  function levelMeta(level) {
    return DATA.levels[level] || DATA.levels.discovered;
  }

  function buildSystem() {
    system.innerHTML = "";

    const art = document.createElement("div");
    art.className = "galaxy-orbit-art";
    art.setAttribute("aria-hidden", "true");
    art.innerHTML = `
      <svg class="galaxy-orbit-svg" viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid meet">
        <ellipse class="galaxy-orbit-line" cx="500" cy="500" rx="210" ry="170" transform="rotate(-18 500 500)" />
        <ellipse class="galaxy-orbit-line galaxy-orbit-line--b" cx="500" cy="500" rx="310" ry="250" transform="rotate(12 500 500)" />
        <ellipse class="galaxy-orbit-line galaxy-orbit-line--c" cx="500" cy="500" rx="400" ry="330" transform="rotate(-8 500 500)" />
        <ellipse class="galaxy-orbit-line galaxy-orbit-line--d" cx="500" cy="500" rx="470" ry="390" transform="rotate(22 500 500)" />
      </svg>
    `;
    system.appendChild(art);

    const core = document.createElement("button");
    core.type = "button";
    core.className = "galaxy-core";
    core.setAttribute("aria-label", "my skills galaxy");
    core.innerHTML = `
      <span class="galaxy-core__glow"></span>
      <span class="galaxy-core__body"></span>
      <span class="galaxy-core__ring"></span>
      <span class="galaxy-core__label">my skills galaxy</span>
    `;
    core.addEventListener("click", () => closeAll());
    system.appendChild(core);

    DATA.orbits.forEach((orbit, index) => {
      const spot = LAYOUT[index] || { x: 50, y: 50, hue: 300 };
      const planet = document.createElement("button");
      planet.type = "button";
      planet.className = `galaxy-planet galaxy-planet--${orbit.planet} galaxy-planet--neon`;
      if (orbit.planet === "ringed" || index === 1 || index === 4) {
        planet.classList.add("has-rings");
      }
      planet.dataset.orbitId = orbit.id;
      planet.style.setProperty("--hue", String(spot.hue));
      planet.style.setProperty("--x", spot.x + "%");
      planet.style.setProperty("--y", spot.y + "%");
      planet.style.setProperty("--delay", (index * 0.35).toFixed(2) + "s");
      planet.setAttribute("aria-expanded", "false");
      planet.setAttribute("aria-controls", "galaxy-category-panel");
      planet.innerHTML = `
        <span class="galaxy-planet__halo"></span>
        <span class="galaxy-planet__body"></span>
        <span class="galaxy-planet__shine"></span>
        <span class="galaxy-planet__name">
          <span class="galaxy-planet__title">${escapeHtml(orbit.short)}</span>
        </span>
      `;
      planet.addEventListener("click", (e) => {
        e.stopPropagation();
        openCategory(orbit, planet);
      });
      system.appendChild(planet);
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
          <button type="button" class="galaxy-skill-chip" data-skill="${escapeHtml(sk.id)}" data-orbit="${escapeHtml(orbit.id)}" style="--hue:${planetBtn.style.getPropertyValue("--hue") || orbit.hue}">
            <span class="galaxy-skill-chip__name">${escapeHtml(sk.name)}</span>
            <span class="galaxy-skill-chip__stars" aria-label="${escapeHtml(meta.label)}">${starsMarkup(meta.stars)}</span>
          </button>
        `;
      })
      .join("");

    const hue = planetBtn.style.getPropertyValue("--hue") || orbit.hue;
    categoryPanel.innerHTML = `
      <div class="galaxy-planet-frame" style="--hue:${escapeHtml(String(hue))}">
        <span class="galaxy-planet-frame__ring" aria-hidden="true"></span>
        <span class="galaxy-planet-frame__glow" aria-hidden="true"></span>
        <div class="galaxy-planet-frame__surface">
          <button type="button" class="galaxy-panel__close" aria-label="Close">×</button>
          <div class="galaxy-planet-frame__scroll">
            <h2 class="galaxy-panel__title">${escapeHtml(orbit.name)}</h2>
            <p class="galaxy-panel__desc">${escapeHtml(orbit.description)}</p>
            <div class="galaxy-panel__skills" role="list">${skillsHtml}</div>
          </div>
        </div>
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
      <div class="galaxy-planet-frame galaxy-planet-frame--mini" style="--hue:${escapeHtml(String(orbit.hue))}">
        <span class="galaxy-planet-frame__ring" aria-hidden="true"></span>
        <span class="galaxy-planet-frame__glow" aria-hidden="true"></span>
        <div class="galaxy-planet-frame__surface">
          <button type="button" class="galaxy-panel__close" aria-label="Close">×</button>
          <div class="galaxy-planet-frame__scroll">
            <h3 class="galaxy-panel__title galaxy-panel__title--sm">${escapeHtml(skill.name)}</h3>
            <p class="galaxy-panel__tech">${escapeHtml(skill.tech || "")}</p>
            <p class="galaxy-panel__level-simple">${starsMarkup(meta.stars)} <span>${escapeHtml(meta.label)}</span></p>
            <p class="galaxy-panel__desc">${escapeHtml(skill.note || "")}</p>
            <button type="button" class="galaxy-panel__back">← back</button>
          </div>
        </div>
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

  if (!reduceMotion) {
    const stage = document.querySelector(".galaxy-stage");
    stage?.addEventListener("pointermove", (e) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 8;
      const y = (e.clientY / window.innerHeight - 0.5) * 6;
      system.style.transform = `translate(${x}px, ${y}px)`;
    });
  }

  buildSystem();
})();
