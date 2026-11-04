(function () {
  var form = document.getElementById("contact-form");
  var note = document.getElementById("contact-note");
  if (!form) return;

  var inbox = form.getAttribute("data-email") || "tiyah.singh0308@gmail.com";

  function show(message, ok) {
    if (!note) return;
    note.hidden = false;
    note.textContent = message;
    note.classList.toggle("is-ok", !!ok);
    note.classList.toggle("is-err", !ok);
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    var first = (form.elements.namedItem("first_name") || {}).value || "";
    var last = (form.elements.namedItem("last_name") || {}).value || "";
    var email = (form.elements.namedItem("email") || {}).value || "";
    var phone = (form.elements.namedItem("phone") || {}).value || "";
    var message = (form.elements.namedItem("message") || {}).value || "";

    first = String(first).trim();
    last = String(last).trim();
    email = String(email).trim();
    phone = String(phone).trim();
    message = String(message).trim();

    if (!first || !email) {
      show("Please add your first name and email.", false);
      return;
    }

    var lines = [
      "Name: " + first + (last ? " " + last : ""),
      "Email: " + email,
      phone ? "Phone: " + phone : "",
      "",
      message || "(no message)",
    ].filter(function (line, index, arr) {
      return line !== "" || (index > 0 && arr[index - 1] !== "");
    });

    var subject = encodeURIComponent("Portfolio contact — " + first + (last ? " " + last : ""));
    var body = encodeURIComponent(lines.join("\n"));
    var href = "mailto:" + inbox + "?subject=" + subject + "&body=" + body;

    show("Opening your email app…", true);
    window.location.href = href;
  });
})();
