/* Fairy Fine Cleaning — main site behaviour */
(function () {
  var FFC = (window.FFC = window.FFC || {});
  var $ = function (s, c) {
    return (c || document).querySelector(s);
  };
  var $$ = function (s, c) {
    return Array.prototype.slice.call(
      (c || document).querySelectorAll(s),
    );
  };
  var reduceMotion =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)")
      .matches;
  FFC.reduceMotion = reduceMotion;

  /* ---------- Header: solid background after scrolling ---------- */
  var header = $(".site-header");
  function onScroll() {
    if (header)
      header.classList.toggle(
        "is-solid",
        window.scrollY > 40,
      );
  }
  onScroll();
  window.addEventListener("scroll", onScroll, {
    passive: true,
  });

  /* ---------- Mobile menu ---------- */
  var toggle = $(".nav-toggle");
  var nav = $("#site-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute(
        "aria-expanded",
        open ? "true" : "false",
      );
      document.body.classList.toggle("menu-open", open);
    });
    $$("a", nav).forEach(function (a) {
      a.addEventListener("click", function () {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
        document.body.classList.remove("menu-open");
      });
    });
    document.addEventListener("keydown", function (e) {
      if (
        e.key === "Escape" &&
        nav.classList.contains("is-open")
      )
        toggle.click();
    });
  }

  /* ---------- Reveal on scroll ---------- */
  var reveals = $$("[data-reveal]");
  if ("IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            en.target.classList.add("is-in");
            io.unobserve(en.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -6% 0px" },
    );
    reveals.forEach(function (el) {
      io.observe(el);
    });
  } else {
    reveals.forEach(function (el) {
      el.classList.add("is-in");
    });
  }

  /* ---------- Accordions (FAQ) ---------- */
  $$(".acc__btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var item = btn.closest(".acc__item");
      var open = item.classList.toggle("is-open");
      btn.setAttribute(
        "aria-expanded",
        open ? "true" : "false",
      );
      var panel = item.querySelector(".acc__panel");
      panel.style.maxHeight = open
        ? panel.scrollHeight + "px"
        : "0px";
    });
  });

  /* ---------- Tabs (services checklist) ---------- */
  $$("[data-tabs]").forEach(function (wrap) {
    var tabs = $$("[role=tab]", wrap);
    var panels = $$("[role=tabpanel]", wrap);
    function select(i) {
      tabs.forEach(function (t, n) {
        t.setAttribute(
          "aria-selected",
          n === i ? "true" : "false",
        );
        t.tabIndex = n === i ? 0 : -1;
      });
      panels.forEach(function (p, n) {
        p.hidden = n !== i;
      });
    }
    tabs.forEach(function (t, i) {
      t.addEventListener("click", function () {
        select(i);
      });
      t.addEventListener("keydown", function (e) {
        if (
          e.key === "ArrowRight" ||
          e.key === "ArrowLeft"
        ) {
          var n =
            (i +
              (e.key === "ArrowRight" ? 1 : -1) +
              tabs.length) %
            tabs.length;
          select(n);
          tabs[n].focus();
        }
      });
    });
    select(0);
  });

  /* ---------- Prices pulled from config ---------- */
  $$("[data-from]").forEach(function (el) {
    if (FFC.fromPrice)
      el.textContent = FFC.money(
        FFC.fromPrice(el.getAttribute("data-from")),
      );
  });
  $$("[data-addon-list]").forEach(function (ul) {
    var a = FFC.config.pricing.addons;
    ul.innerHTML = Object.keys(a)
      .map(function (k) {
        var x = a[k];
        return (
          "<li><span>" +
          x.label +
          "</span><b>" +
          FFC.money(x.price) +
          "</b></li>"
        );
      })
      .join("");
  });
  $$("[data-discount-list]").forEach(function (ul) {
    var f = FFC.config.pricing.frequency;
    ul.innerHTML = Object.keys(f)
      .map(function (k) {
        var x = f[k];
        return (
          "<li><span>" +
          x.label +
          "</span><b>" +
          (x.discount
            ? Math.round(x.discount * 100) + "% off"
            : "Standard rate") +
          "</b></li>"
        );
      })
      .join("");
  });

  /* ---------- Home page quick estimator ---------- */
  var est = $("#estimator");
  if (est && FFC.calc) {
    var out = $("#est-price");
    var link = $("#est-link");
    function runEst() {
      var s = {
        service: $("#est-service").value,
        property: "house",
        frequency: "once",
        beds: +$("#est-beds").value,
        baths: +$("#est-baths").value,
        sqftIndex: 1,
        addons: {},
      };
      var r = FFC.calc(s);
      out.textContent = FFC.money(r.total);
      link.href =
        "book-quote.html?service=" +
        s.service +
        "&beds=" +
        s.beds +
        "&baths=" +
        s.baths;
    }
    $$("select", est).forEach(function (el) {
      el.addEventListener("change", runEst);
    });
    runEst();
  }

  /* ---------- Email delivery (EmailJS REST API) ----------
     Sends the customer's copy and the owner's copy as two emails. */
  FFC.emailConfigured = function () {
    var e = FFC.config.emailjs;
    return (
      e.serviceId.indexOf("YOUR_") !== 0 &&
      e.templateId.indexOf("YOUR_") !== 0 &&
      e.publicKey.indexOf("YOUR_") !== 0
    );
  };

  function sendOne(params) {
    var e = FFC.config.emailjs;
    return fetch(
      "https://api.emailjs.com/api/v1.0/email/send",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_id: e.serviceId,
          template_id: e.templateId,
          user_id: e.publicKey,
          template_params: params,
        }),
      },
    ).then(function (res) {
      if (!res.ok)
        return res.text().then(function (t) {
          throw new Error(t || "Email service error");
        });
    });
  }

  /* opts: { customerEmail, customerName, customerSubject, ownerSubject, customerHtml, ownerHtml, replyTo } */
  FFC.sendEmails = function (opts) {
    if (!FFC.emailConfigured()) {
      return new Promise(function (resolve) {
        setTimeout(function () {
          resolve({ demo: true });
        }, 900);
      });
    }
    var biz = FFC.config.business;
    var owner = FFC.config.emailjs.ownerEmail;
    var toCustomer = sendOne({
      to_email: opts.customerEmail,
      to_name: opts.customerName,
      from_name: biz.name,
      reply_to: owner,
      subject: opts.customerSubject,
      message_html: opts.customerHtml,
    });
    var toOwner = sendOne({
      to_email: owner,
      to_name: biz.name,
      from_name: opts.customerName,
      reply_to: opts.replyTo || opts.customerEmail,
      subject: opts.ownerSubject,
      message_html: opts.ownerHtml,
    });
    return Promise.all([toCustomer, toOwner]).then(
      function () {
        return { demo: false };
      },
    );
  };

  FFC.esc = function (s) {
    return String(s == null ? "" : s).replace(
      /[&<>"']/g,
      function (c) {
        return {
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        }[c];
      },
    );
  };

  /* ---------- Contact form ---------- */
  var cform = $("#contact-form");
  if (cform) {
    var status = $("#contact-status");
    cform.addEventListener("submit", function (ev) {
      ev.preventDefault();
      if (!cform.checkValidity()) {
        cform.reportValidity();
        return;
      }
      var d = {};
      new FormData(cform).forEach(function (v, k) {
        d[k] = v;
      });
      var btn = $("button[type=submit]", cform);
      btn.disabled = true;
      btn.textContent = "Sending…";
      status.className = "form-status";
      status.textContent = "";

      var rows = [
        ["Name", d.name],
        ["Email", d.email],
        ["Phone", d.phone || "—"],
        ["Interested in", d.topic],
        ["Message", d.message],
      ];
      var table = rows
        .map(function (r) {
          return (
            '<tr><td style="padding:8px 12px;color:#7a6571;width:130px;vertical-align:top">' +
            r[0] +
            '</td><td style="padding:8px 12px;color:#2b1a24">' +
            FFC.esc(r[1]).replace(/\n/g, "<br>") +
            "</td></tr>"
          );
        })
        .join("");
      var wrap = function (title, intro) {
        return (
          '<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;border:1px solid #ecd7a3;border-radius:14px;overflow:hidden">' +
          '<div style="background:#120b10;padding:22px;text-align:center;color:#f6a9c8;font-size:22px;letter-spacing:1px">Fairy Fine Cleaning</div>' +
          '<div style="padding:22px"><h2 style="margin:0 0 8px;color:#2b1a24">' +
          title +
          '</h2><p style="color:#5b4651;line-height:1.6">' +
          intro +
          "</p>" +
          '<table style="width:100%;border-collapse:collapse;background:#fdeff5;border-radius:10px">' +
          table +
          "</table></div></div>"
        );
      };
      var biz = FFC.config.business;
      FFC.sendEmails({
        customerEmail: d.email,
        customerName: d.name,
        replyTo: d.email,
        customerSubject:
          "We received your message — " + biz.name,
        ownerSubject: "New website message from " + d.name,
        customerHtml: wrap(
          "Thank you, " +
            FFC.esc(d.name.split(" ")[0]) +
            "!",
          "We received your message and will reply shortly. For anything urgent, call or text " +
            biz.phone +
            ". Here is a copy of what you sent:",
        ),
        ownerHtml: wrap(
          "New contact message",
          "A visitor sent this through the website contact form. Reply directly to this email to answer them.",
        ),
      })
        .then(function (r) {
          cform.reset();
          status.className = "form-status is-ok";
          status.textContent = r.demo
            ? "Demo mode: your message looks great, but email sending is not connected yet (see README)."
            : "Thank you! Your message was sent and a copy is on its way to your inbox.";
        })
        .catch(function () {
          status.className = "form-status is-err";
          status.textContent =
            "We couldn’t send that just now. Please call or text " +
            biz.phone +
            " or email " +
            biz.email +
            ".";
        })
        .then(function () {
          btn.disabled = false;
          btn.textContent = "Send message";
        });
    });
  }

  /* ---------- Footer year ---------- */
  $$("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
})();
