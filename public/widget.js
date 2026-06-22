/**
 * FieldOS AI embeddable lead-capture widget.
 *
 * Usage on a customer's website:
 *   <script src="https://app.fieldos.ai/widget.js" data-widget-key="UUID" defer></script>
 *
 * Renders a floating "Get a quote" button + a small modal form that posts to
 * /api/widget/submit. Self-contained: no framework, scoped styles, derives the
 * API origin from its own <script src> so it works on any domain.
 */
(function () {
  "use strict";

  var script = document.currentScript;
  if (!script) return;
  var widgetKey = script.getAttribute("data-widget-key");
  if (!widgetKey) {
    console.error("[FieldOS] widget.js: missing data-widget-key");
    return;
  }
  var origin = new URL(script.src).origin;
  var ORANGE = "#FF5A1F";

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    attrs = attrs || {};
    for (var k in attrs) {
      if (k === "style") node.style.cssText = attrs[k];
      else node.setAttribute(k, attrs[k]);
    }
    (children || []).forEach(function (c) {
      node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    });
    return node;
  }

  function init(config) {
    var businessName = (config && config.business_name) || "us";

    var panel = el("div", {
      style:
        "position:fixed;bottom:84px;right:20px;width:320px;max-width:calc(100vw - 40px);background:#fff;border-radius:12px;box-shadow:0 8px 30px rgba(21,24,27,0.18);padding:20px;font-family:system-ui,sans-serif;z-index:2147483647;display:none;",
    });

    panel.innerHTML =
      '<h3 style="margin:0 0 4px;font-size:17px;color:#15181B;">Request a quote</h3>' +
      '<p style="margin:0 0 14px;font-size:13px;color:#5B6770;">Tell ' +
      businessName +
      " what you need and they'll get back to you.</p>";

    var form = el("form");
    function field(name, placeholder, type, required) {
      var input = el(type === "textarea" ? "textarea" : "input", {
        name: name,
        placeholder: placeholder,
        style:
          "width:100%;box-sizing:border-box;margin-bottom:10px;padding:11px 12px;border:1px solid #E2DFD9;border-radius:8px;font-size:14px;font-family:inherit;",
      });
      if (type && type !== "textarea") input.type = type;
      if (type === "textarea") input.rows = 3;
      if (required) input.required = true;
      return input;
    }

    form.appendChild(field("contact_name", "Your name", "text", true));
    form.appendChild(field("contact_phone", "Phone", "tel", false));
    form.appendChild(field("contact_email", "Email", "email", false));
    form.appendChild(field("message", "What do you need help with?", "textarea", true));
    // Honeypot — hidden from humans, tempting to bots.
    var honey = field("company_website", "", "text", false);
    honey.style.display = "none";
    honey.tabIndex = -1;
    honey.setAttribute("autocomplete", "off");
    form.appendChild(honey);

    var submit = el("button", {
      type: "submit",
      style:
        "width:100%;padding:12px;background:" +
        ORANGE +
        ";color:#fff;border:none;border-radius:8px;font-size:15px;font-weight:600;cursor:pointer;",
    });
    submit.textContent = "Send";
    form.appendChild(submit);

    var status = el("p", {
      style: "margin:10px 0 0;font-size:13px;color:#5B6770;text-align:center;",
    });
    form.appendChild(status);
    panel.appendChild(form);

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      submit.disabled = true;
      submit.textContent = "Sending…";
      var fd = new FormData(form);
      var payload = { widget_public_key: widgetKey };
      fd.forEach(function (v, k) {
        if (v) payload[k] = v;
      });

      fetch(origin + "/api/widget/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
        .then(function (r) {
          return r.json();
        })
        .then(function (res) {
          if (res && res.ok) {
            form.style.display = "none";
            status.style.display = "none";
            var done = el("p", {
              style: "margin:12px 0;font-size:14px;color:#15803D;text-align:center;",
            });
            done.textContent = "Thanks! We'll be in touch shortly.";
            panel.appendChild(done);
          } else {
            status.textContent = (res && res.error) || "Something went wrong.";
            submit.disabled = false;
            submit.textContent = "Send";
          }
        })
        .catch(function () {
          status.textContent = "Couldn't send — please try again.";
          submit.disabled = false;
          submit.textContent = "Send";
        });
    });

    var button = el("button", {
      "aria-label": "Request a quote",
      style:
        "position:fixed;bottom:20px;right:20px;padding:14px 20px;background:" +
        ORANGE +
        ";color:#fff;border:none;border-radius:999px;font-family:system-ui,sans-serif;font-size:15px;font-weight:600;box-shadow:0 4px 14px rgba(255,90,31,0.4);cursor:pointer;z-index:2147483647;",
    });
    button.textContent = "Get a quote";
    button.addEventListener("click", function () {
      panel.style.display = panel.style.display === "none" ? "block" : "none";
    });

    document.body.appendChild(button);
    document.body.appendChild(panel);
  }

  fetch(origin + "/api/widget/config/" + widgetKey)
    .then(function (r) {
      return r.json();
    })
    .then(function (res) {
      if (res && res.ok && res.data && res.data.enabled) init(res.data);
    })
    .catch(function () {
      /* widget silently does nothing if config can't load */
    });
})();
