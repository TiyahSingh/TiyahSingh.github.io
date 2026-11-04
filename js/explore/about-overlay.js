function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function chapterHtml(section, index) {
  const layout = section.layout || "text-only";
  const photo = section.photo || "";
  const caption = section.caption || "";
  const tilt = index % 2 ? "b" : "a";
  let media = "";
  if (photo) {
    media = `
      <figure class="about-polaroid about-polaroid-${tilt}">
        <img src="/assets/about/${escapeHtml(photo)}" alt="Portrait of Tiyah Singh.">
        <figcaption>${escapeHtml(caption)}</figcaption>
      </figure>`;
  }
  return `
    <article class="about-chapter about-${escapeHtml(layout)}">
      ${media}
      <div class="about-copy">
        <p class="about-chapter-label">Chapter ${String(index + 1).padStart(2, "0")}</p>
        <h2>${escapeHtml(section.title)}</h2>
        <p>${escapeHtml(section.copy)}</p>
      </div>
    </article>`;
}

export function createAboutOverlay(about, onExit) {
  const data = about || {};
  const overlay = document.createElement("section");
  overlay.className = "about-explore-overlay";
  overlay.hidden = true;
  overlay.setAttribute("aria-label", "About Tiyah");
  overlay.innerHTML = `
    <button type="button" class="about-explore-exit" aria-label="Exit to street">×</button>
    <div class="about-explore-scroll">
      <div class="wrap about-editorial">
        <header class="about-lead">
          <div class="about-lead-copy">
            <p class="kicker">ABOUT ME</p>
            <h1>${escapeHtml(data.who || "Who is Tiyah?")}</h1>
            <p class="about-lead-role">${escapeHtml(data.role || "Game designer & developer")}</p>
            <p class="about-lead-tagline">${escapeHtml(data.headline || "")}</p>
            <p class="about-lead-intro">${escapeHtml(data.intro || "")}</p>
          </div>
          <figure class="about-polaroid about-polaroid-hero">
            <img src="/assets/about/portrait-look.jpg" alt="Portrait of Tiyah Singh.">
            <figcaption>Tiyah Singh</figcaption>
          </figure>
        </header>
        <div class="about-chapters">
          ${(data.sections || []).map(chapterHtml).join("")}
        </div>
      </div>
    </div>
  `;

  const exit = overlay.querySelector(".about-explore-exit");
  exit.addEventListener("click", function (event) {
    event.preventDefault();
    event.stopPropagation();
    if (typeof onExit === "function") onExit();
  });

  document.body.appendChild(overlay);

  return {
    el: overlay,
    open: function () {
      overlay.hidden = false;
      overlay.scrollTop = 0;
      const scroller = overlay.querySelector(".about-explore-scroll");
      if (scroller) scroller.scrollTop = 0;
      document.body.classList.add("about-explore-open");
    },
    close: function () {
      overlay.hidden = true;
      document.body.classList.remove("about-explore-open");
    },
    isOpen: function () {
      return !overlay.hidden;
    },
  };
}
