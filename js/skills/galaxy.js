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
      const size = 36 + index * 10.5;
      const ring = document.createElement("div");
      ring.className = "galaxy-ring";
      ring.dataset.orbit = orbit.id;
      ring.style.setProperty("--i", String(index));
      ring.style.setProperty("--hue", String(orbit.hue));
      ring.style.setProperty("--size", `${size}%`);
      ring.style.setProperty("--spin", `${(60 + index * 18) * (index % 2 ? 1 : -1)}s`);

      const path = document.createElement("div");
      path.className = "galaxy-ring__path";
      ring.appendChild(path);

      const angle = (index / DATA.orbits.length) * 360 + (index % 2 ? 32 : -22);
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
      if (orbit.planet === "ringed" || index === 4) planet.classList.add("has-rings");
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
      holder.appendChild(planet);
      ring.appendChild(holder);
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
        <button type="button" class="galaxy-panel__close" aria-label="Close">×</button>
        <p class="galaxy-panel__eyebrow">${escapeHtml(orbit.cute || "skills")}</p>
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
        <button type="button" class="galaxy-panel__close" aria-label="Close">×</button>
        <p class="galaxy-panel__eyebrow">${escapeHtml(orbit.short)}</p>
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

  buildSystem();
})();
