/* =========================================================
   Pavel Tcacenco — Portfolio interactions
   - coverage / scroll progress bar
   - animated terminal hero (typing + sequential output)
   - tech stack marquee (CSS-driven; pauses on hover)
   - sticky header shadow + scroll-spy (aria-current)
   - animated stat counters
   - reflective-learning accordion
   - subtle reveal-on-scroll
   - mobile menu + accessible mailto contact form
   All motion respects prefers-reduced-motion.
   ========================================================= */
(function () {
  "use strict";

  /* Mark that JS is running so reveal-on-scroll can hide elements.
     If JS fails to load, CSS keeps all content visible. */
  document.documentElement.classList.add("js");

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- Current year in footer ---- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---- Sticky header shadow + coverage bar ---- */
  var header = document.getElementById("siteHeader");
  var covFill = document.getElementById("covFill");
  var covReadout = document.getElementById("covReadout");
  var compactCoverage = window.matchMedia("(max-width: 520px)");

  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    if (header) header.classList.toggle("scrolled", y > 8);

    var docH = document.documentElement.scrollHeight - window.innerHeight;
    var pct = docH > 0 ? Math.min(100, Math.max(0, (y / docH) * 100)) : 0;
    var roundedPct = Math.round(pct);
    if (covFill) covFill.style.width = pct + "%";
    if (covReadout) covReadout.textContent = compactCoverage.matches ? roundedPct + "%" : "coverage " + roundedPct + "%";
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  onScroll();

  /* ---- Mobile menu toggle ---- */
  var navToggle = document.getElementById("navToggle");
  var navMenu = document.getElementById("navMenu");
  function closeMenu() {
    if (!navMenu) return;
    navMenu.classList.remove("open");
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", "Open menu");
  }
  if (navToggle && navMenu) {
    navToggle.addEventListener("click", function () {
      var open = navMenu.classList.toggle("open");
      navToggle.setAttribute("aria-expanded", String(open));
      navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });
    navMenu.addEventListener("click", function (e) {
      if (e.target.closest("a")) closeMenu();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeMenu();
    });
  }

  /* ---- Reveal on scroll ---- */
  var revealEls = Array.prototype.slice.call(document.querySelectorAll(".reveal"));
  function revealAll() {
    revealEls.forEach(function (el) {
      el.style.transition = "none";
      el.classList.add("in");
    });
  }
  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealAll();
  } else {
    var revObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          revObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    revealEls.forEach(function (el) { revObserver.observe(el); });
    // Graceful fallback if the observer never fires (e.g. embedded iframe).
    setTimeout(revealAll, 1500);
  }

  /* ---- Scroll-spy: highlight active section in nav ---- */
  var sections = Array.prototype.slice.call(document.querySelectorAll("main section[id]"));
  var navLinks = {};
  document.querySelectorAll('.nav-menu a[href^="#"]').forEach(function (a) {
    navLinks[a.getAttribute("href").slice(1)] = a;
  });
  function setActive(id) {
    Object.keys(navLinks).forEach(function (key) {
      if (key === id) navLinks[key].setAttribute("aria-current", "true");
      else navLinks[key].removeAttribute("aria-current");
    });
  }
  if ("IntersectionObserver" in window && sections.length) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting && navLinks[entry.target.id]) setActive(entry.target.id);
      });
    }, { rootMargin: "-45% 0px -50% 0px", threshold: 0 });
    sections.forEach(function (s) { spy.observe(s); });
  }

  /* ---- Animated terminal hero ---- */
  (function terminal() {
    var cmdEl = document.getElementById("termCmd");
    var cursor = document.getElementById("termCursor");
    var out = document.getElementById("termOut");
    if (!cmdEl || !out) return;
    var lines = Array.prototype.slice.call(out.querySelectorAll(".t-out"));
    var full = cmdEl.getAttribute("data-text") || cmdEl.textContent;

    if (reduceMotion) {
      cmdEl.textContent = full; // already final; leave outputs visible
      return;
    }

    // Prep: clear command, hide outputs
    cmdEl.textContent = "";
    lines.forEach(function (li) {
      li.style.opacity = "0";
      li.style.transform = "translateY(6px)";
      li.style.transition = "opacity 0.35s ease, transform 0.35s ease";
    });

    function typeCmd(i) {
      if (i > full.length) {
        revealLines(0);
        return;
      }
      cmdEl.textContent = full.slice(0, i);
      setTimeout(function () { typeCmd(i + 1); }, 48);
    }
    function revealLines(i) {
      if (i >= lines.length) return;
      lines[i].style.opacity = "1";
      lines[i].style.transform = "none";
      setTimeout(function () { revealLines(i + 1); }, 280);
    }

    setTimeout(function () { typeCmd(0); }, 650);
  })();

  /* ---- Animated stat counters ---- */
  (function counters() {
    var nums = Array.prototype.slice.call(document.querySelectorAll(".stat-num"));
    if (!nums.length) return;

    function setFinal(el) {
      el.textContent = (el.getAttribute("data-target") || "0") + (el.getAttribute("data-suffix") || "");
    }
    function countUp(el) {
      var target = parseInt(el.getAttribute("data-target"), 10) || 0;
      var suffix = el.getAttribute("data-suffix") || "";
      var dur = 1100, start = null;
      function step(ts) {
        if (start === null) start = ts;
        var p = Math.min(1, (ts - start) / dur);
        var eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
        el.textContent = Math.round(eased * target) + suffix;
        if (p < 1) requestAnimationFrame(step);
        else el.textContent = target + suffix;
      }
      requestAnimationFrame(step);
    }

    if (reduceMotion || !("IntersectionObserver" in window)) {
      nums.forEach(setFinal);
      return;
    }
    var statObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          countUp(entry.target);
          statObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    nums.forEach(function (el) { statObs.observe(el); });
  })();

  /* ---- Reflective-learning accordion ---- */
  (function accordion() {
    var heads = Array.prototype.slice.call(document.querySelectorAll(".report-head"));
    heads.forEach(function (btn) {
      var panel = document.getElementById(btn.getAttribute("aria-controls"));
      if (!panel) return;
      btn.addEventListener("click", function () {
        var expanded = btn.getAttribute("aria-expanded") === "true";
        btn.setAttribute("aria-expanded", String(!expanded));
        panel.classList.toggle("open", !expanded);
      });
    });
  })();

  /* ---- Stage highlight on scroll (project roadmap) ---- */
  (function stageHighlight() {
    var nodes = Array.prototype.slice.call(document.querySelectorAll(".proj-node"));
    var fields = Array.prototype.slice.call(document.querySelectorAll(".project .field"));
    if (!fields.length || reduceMotion || !("IntersectionObserver" in window)) return;

    function pulse(el) {
      if (!el) return;
      el.classList.remove("pulse");
      void el.offsetWidth; // restart animation if mid-flight
      el.classList.add("pulse");
    }
    function clearPulse(e) {
      if (e.target.classList.contains("pulse")) e.target.classList.remove("pulse");
    }

    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var idx = fields.indexOf(entry.target);
        if (idx < 0) return;
        var node = nodes[idx];
        pulse(node ? node.querySelector(".rm-node") : null);
        pulse(entry.target.querySelector(".field-label"));
      });
    }, { threshold: 0.6, rootMargin: "0px 0px -12% 0px" });

    fields.forEach(function (f) {
      obs.observe(f);
      var label = f.querySelector(".field-label");
      if (label) label.addEventListener("animationend", clearPulse);
    });
    nodes.forEach(function (n) {
      var icon = n.querySelector(".rm-node");
      if (icon) icon.addEventListener("animationend", clearPulse);
    });
  })();

  /* ---- Contact form (form endpoint + mailto fallback) ---- */
  var form = document.getElementById("contactForm");
  if (form) {
    var TO_EMAIL = "pashatcacenco@gmail.com";
    var FORM_ENDPOINT = "https://formspree.io/f/mwvdeqao";
    var fields = {
      name: { input: document.getElementById("cf-name"), err: document.getElementById("err-name") },
      email: { input: document.getElementById("cf-email"), err: document.getElementById("err-email") },
      message: { input: document.getElementById("cf-message"), err: document.getElementById("err-message") }
    };
    var status = document.getElementById("formStatus");

    function showError(field, show) {
      field.err.hidden = !show;
      field.input.setAttribute("aria-invalid", String(show));
    }
    function validEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }
    function validate() {
      var nameOk = fields.name.input.value.trim().length > 0;
      var emailOk = validEmail(fields.email.input.value.trim());
      var msgOk = fields.message.input.value.trim().length > 0;
      showError(fields.name, !nameOk);
      showError(fields.email, !emailOk);
      showError(fields.message, !msgOk);
      return nameOk && emailOk && msgOk;
    }

    Object.keys(fields).forEach(function (key) {
      fields[key].input.addEventListener("input", function () {
        if (!fields[key].err.hidden) showError(fields[key], false);
      });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!validate()) {
        status.textContent = "Please fix the highlighted fields.";
        status.classList.remove("ok");
        var firstInvalid = form.querySelector('[aria-invalid="true"]');
        if (firstInvalid) firstInvalid.focus();
        return;
      }
      var name = fields.name.input.value.trim();
      var email = fields.email.input.value.trim();
      var message = fields.message.input.value.trim();

      function showThanks() {
        var thanks = document.createElement("div");
        thanks.className = "contact-form contact-thanks reveal in";
        thanks.setAttribute("role", "status");
        thanks.innerHTML =
          '<div class="thanks-check" aria-hidden="true">\u2713</div>' +
          '<h3 class="thanks-title">Thank you for your message.</h3>' +
          '<p class="thanks-sub">I\u2019ll be in touch soon.</p>';
        form.parentNode.insertBefore(thanks, form);
        form.remove();
        thanks.focus && thanks.focus();
      }

      // No backend configured yet: hand off to the visitor's mail app so the
      // message reaches the inbox instead of being saved on their machine.
      if (!FORM_ENDPOINT) {
        var subject = encodeURIComponent("Portfolio enquiry from " + name);
        var body = encodeURIComponent(message + "\n\nFrom: " + name + "\n" + email);
        window.location.href = "mailto:" + TO_EMAIL + "?subject=" + subject + "&body=" + body;
        showThanks();
        return;
      }

      // Backend configured: POST the message so it is stored off-device.
      var submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.disabled = true;
      status.textContent = "Sending\u2026";
      status.classList.remove("ok");

      fetch(FORM_ENDPOINT, {
        method: "POST",
        headers: { "Accept": "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({ name: name, email: email, message: message })
      }).then(function (res) {
        if (!res.ok) throw new Error("Request failed");
        showThanks();
      }).catch(function () {
        if (submitBtn) submitBtn.disabled = false;
        status.textContent = "Couldn't send right now \u2014 please email me directly.";
      });
    });
  }
})();
