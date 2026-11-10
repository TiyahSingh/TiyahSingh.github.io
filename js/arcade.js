(function () {
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var title = document.getElementById("title-screen");

  function hideTitle(target) {
    document.body.classList.remove("title-on");
    if (title) title.hidden = true;
    if (!target) return;
    var node = document.querySelector(target);
    if (node) node.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
  }

  if (title) {
    if (location.hash) hideTitle("");
    else document.body.classList.add("title-on");
    var start = document.getElementById("press-start");
    if (start) start.addEventListener("click", function () { hideTitle("#play"); });
    title.querySelectorAll("a[href^='#']").forEach(function (link) {
      link.addEventListener("click", function (event) {
        event.preventDefault();
        hideTitle(link.getAttribute("href"));
      });
    });
    var back = document.getElementById("show-title");
    if (back) back.addEventListener("click", function () {
      if (title) title.hidden = false;
      document.body.classList.add("title-on");
      window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
    });
  }

  document.querySelectorAll(".cab").forEach(function (cab) {
    cab.addEventListener("click", function (event) {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
      event.preventDefault();
      cab.classList.add("is-lit");
      var href = cab.getAttribute("href");
      window.setTimeout(function () { window.location.href = href; }, reduced ? 0 : 280);
    });
  });

  document.querySelectorAll(".skill").forEach(function (button) {
    button.addEventListener("click", function () {
      var open = button.getAttribute("aria-expanded") === "true";
      document.querySelectorAll(".skill").forEach(function (other) {
        other.setAttribute("aria-expanded", "false");
        var panel = document.getElementById(other.getAttribute("aria-controls"));
        if (panel) panel.hidden = true;
      });
      if (!open) {
        button.setAttribute("aria-expanded", "true");
        var panel = document.getElementById(button.getAttribute("aria-controls"));
        if (panel) panel.hidden = false;
      }
    });
  });

  function activateVideos(root) {
    if (!root) return;
    root.querySelectorAll("iframe[data-src]").forEach(function (frame) {
      if (!frame.getAttribute("src")) {
        frame.setAttribute("src", frame.getAttribute("data-src"));
      }
    });
  }

  document.querySelectorAll("[data-tab]").forEach(function (tab) {
    tab.addEventListener("click", function () {
      var name = tab.getAttribute("data-tab");
      document.querySelectorAll("[data-tab]").forEach(function (other) {
        var on = other === tab;
        other.setAttribute("aria-selected", on ? "true" : "false");
      });
      document.querySelectorAll("[data-panel]").forEach(function (panel) {
        var show = panel.getAttribute("data-panel") === name;
        panel.hidden = !show;
        if (show) activateVideos(panel);
      });
    });
  });

  var help = document.getElementById("help");
  var helpOpen = document.getElementById("help-open");
  if (help && helpOpen && help.showModal) {
    helpOpen.addEventListener("click", function () { help.showModal(); });
  }

  var navToggle = document.getElementById("nav-toggle");
  var navShell = document.querySelector(".nav-shell");
  var primaryNav = document.getElementById("primary-nav");
  if (navToggle && navShell && primaryNav) {
    function setNavOpen(open) {
      navShell.classList.toggle("is-open", open);
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
      navToggle.textContent = open ? "Close" : "Menu";
    }
    navToggle.addEventListener("click", function (event) {
      event.stopPropagation();
      setNavOpen(!navShell.classList.contains("is-open"));
    });
    primaryNav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () { setNavOpen(false); });
    });
    document.addEventListener("click", function (event) {
      if (!navShell.contains(event.target)) setNavOpen(false);
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") setNavOpen(false);
    });
  }
})();
