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
    if (event.target.closest("a, .cart")) blip();
  });
})();
