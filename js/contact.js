(function () {
  var form = document.getElementById("contact-form");
  var note = document.getElementById("contact-note");
  var button = form ? form.querySelector(".contact-submit") : null;
  if (!form) return;

  var inbox = form.getAttribute("data-email") || "tiyah.singh0308@gmail.com";
  var endpoint = "https://formsubmit.co/ajax/" + encodeURIComponent(inbox);

  function show(message, ok) {
    if (!note) return;
    note.hidden = false;
    note.textContent = message;
    note.classList.toggle("is-ok", !!ok);
    note.classList.toggle("is-err", !ok);
  }

  var params = new URLSearchParams(location.search);
  if (params.get("sent") === "1") {
    show("Message sent. Thanks for writing in.", true);
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    var first = String((form.elements.namedItem("first_name") || {}).value || "").trim();
    var last = String((form.elements.namedItem("last_name") || {}).value || "").trim();
    var email = String((form.elements.namedItem("email") || {}).value || "").trim();
    var phone = String((form.elements.namedItem("phone") || {}).value || "").trim();
    var message = String((form.elements.namedItem("message") || {}).value || "").trim();

    if (!first || !email) {
      show("Please add your first name and email.", false);
      return;
    }

    if (button) {
      button.disabled = true;
      button.textContent = "Sending…";
    }
    show("Sending your message…", true);

    var payload = {
      first_name: first,
      last_name: last,
      email: email,
      phone: phone || "—",
      message: message || "(no message)",
      _subject: "Portfolio contact — " + first + (last ? " " + last : ""),
      _template: "table",
      _replyto: email,
    };

    fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    })
      .then(function (response) {
        return response.json().catch(function () {
          return { ok: response.ok };
        }).then(function (data) {
          if (!response.ok) throw new Error((data && data.message) || "Send failed");
          return data;
        });
      })
      .then(function () {
        form.reset();
        show("Message sent. I’ll get back to you soon.", true);
      })
      .catch(function () {
        show("Couldn’t send right now. Email me at " + inbox + " instead.", false);
      })
      .finally(function () {
        if (button) {
          button.disabled = false;
          button.textContent = "Send";
        }
      });
  });
})();
