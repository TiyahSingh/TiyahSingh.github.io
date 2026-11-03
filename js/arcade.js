(function () {
  var button = document.getElementById("sfx");
  if (!button) return;
  var on = localStorage.getItem("sfx") === "on";
  var ctx;

  function label() {
    button.textContent = on ? "SFX ON" : "SFX OFF";
    button.setAttribute("aria-pressed", on ? "true" : "false");
  }

  function blip() {
    if (!on) return;
    ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(640, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.04, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.11);
  }

  label();
  button.addEventListener("click", function () {
    on = !on;
    localStorage.setItem("sfx", on ? "on" : "off");
    label();
    blip();
  });

  document.addEventListener("click", function (event) {
    if (event.target.closest("a, .cart, .press-start, .skill")) blip();
  });

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

  document.querySelectorAll("[data-tab]").forEach(function (tab) {
    tab.addEventListener("click", function () {
      var name = tab.getAttribute("data-tab");
      document.querySelectorAll("[data-tab]").forEach(function (other) {
        var on = other === tab;
        other.setAttribute("aria-selected", on ? "true" : "false");
      });
      document.querySelectorAll("[data-panel]").forEach(function (panel) {
        panel.hidden = panel.getAttribute("data-panel") !== name;
      });
    });
  });

  var help = document.getElementById("help");
  var helpOpen = document.getElementById("help-open");
  if (help && helpOpen && help.showModal) {
    helpOpen.addEventListener("click", function () { help.showModal(); });
  }
})();
