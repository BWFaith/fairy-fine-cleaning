/* Book & Quote wizard — live price, validation, emails to customer + business owner */
(function () {
  var FFC = window.FFC;
  var cfg = FFC.config;
  var P = cfg.pricing;
  var $ = function (s, c) {
    return (c || document).querySelector(s);
  };
  var $$ = function (s, c) {
    return Array.prototype.slice.call(
      (c || document).querySelectorAll(s),
    );
  };

  var form = $("#quote-form");
  if (!form) return;

  var state = {
    service: "standard",
    property: "house",
    frequency: "once",
    beds: 3,
    baths: 2,
    sqftIndex: 2,
    addons: {},
  };

  /* ---------- Render option groups from config ---------- */
  function radioCards(containerId, name, data, noteKey) {
    var wrap = $(containerId);
    wrap.innerHTML = Object.keys(data)
      .map(function (k, i) {
        var d = data[k];
        var sub =
          noteKey && d[noteKey]
            ? "<small>" + d[noteKey] + "</small>"
            : d.discount
              ? "<small>Save " +
                Math.round(d.discount * 100) +
                "%</small>"
              : "";
        return (
          '<label class="opt"><input type="radio" name="' +
          name +
          '" value="' +
          k +
          '"' +
          (state[name] === k ? " checked" : "") +
          ">" +
          '<span class="opt__box"><b>' +
          d.label +
          "</b>" +
          sub +
          "</span></label>"
        );
      })
      .join("");
  }
  radioCards("#opt-service", "service", P.services, "note");
  radioCards("#opt-property", "property", P.property);
  radioCards("#opt-frequency", "frequency", P.frequency);

  $("#sqft").innerHTML = P.sqftTiers
    .map(function (t, i) {
      return (
        '<option value="' + i + '">' + t.label + "</option>"
      );
    })
    .join("");

  function fillSelect(sel, from, to, step, fmt) {
    var html = "";
    for (var v = from; v <= to + 0.001; v += step)
      html +=
        '<option value="' + v + '">' + fmt(v) + "</option>";
    sel.innerHTML = html;
  }
  fillSelect($("#beds"), 0, 8, 1, function (v) {
    return v === 0
      ? "Studio / none"
      : v + (v === 1 ? " bedroom" : " bedrooms");
  });
  fillSelect($("#baths"), 1, 6, 0.5, function (v) {
    return v + (v === 1 ? " bathroom" : " bathrooms");
  });

  $("#addons").innerHTML = Object.keys(P.addons)
    .map(function (k) {
      var a = P.addons[k];
      var qty = a.unit
        ? '<input class="qty" type="number" min="1" max="' +
          a.max +
          '" value="1" data-qty="' +
          k +
          '" aria-label="Quantity for ' +
          a.label +
          '" disabled>'
        : "";
      return (
        '<label class="addon"><input type="checkbox" data-addon="' +
        k +
        '"><span class="addon__name">' +
        a.label +
        (a.onRequest ? " <em>(on request)</em>" : "") +
        '</span><span class="addon__price">+' +
        FFC.money(a.price) +
        "</span>" +
        qty +
        "</label>"
      );
    })
    .join("");

  $("#times").innerHTML = cfg.timeWindows
    .map(function (t, i) {
      return (
        '<label class="opt opt--slim"><input type="radio" name="time" value="' +
        t +
        '"' +
        (i === 0 ? " checked" : "") +
        '><span class="opt__box"><b>' +
        t +
        "</b></span></label>"
      );
    })
    .join("");

  /* ---------- Prefill from URL (home estimator) ---------- */
  var q = new URLSearchParams(location.search);
  if (P.services[q.get("service")])
    state.service = q.get("service");
  if (q.get("beds") !== null && !isNaN(+q.get("beds")))
    state.beds = Math.max(0, Math.min(8, +q.get("beds")));
  if (q.get("baths") !== null && !isNaN(+q.get("baths")))
    state.baths = Math.max(1, Math.min(6, +q.get("baths")));
  $("#beds").value = state.beds;
  $("#baths").value = state.baths;
  $("#sqft").value = state.sqftIndex;
  var chk = $(
    "input[name=service][value=" + state.service + "]",
  );
  if (chk) chk.checked = true;

  /* ---------- Date: tomorrow onward ---------- */
  var dateEl = $("#date");
  var t = new Date();
  t.setDate(t.getDate() + 1);
  var iso = function (d) {
    return (
      d.getFullYear() +
      "-" +
      String(d.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(d.getDate()).padStart(2, "0")
    );
  };
  dateEl.min = iso(t);

  /* ---------- State sync + summary ---------- */
  function sync() {
    state.service = $("input[name=service]:checked").value;
    state.property = $(
      "input[name=property]:checked",
    ).value;
    state.frequency = $(
      "input[name=frequency]:checked",
    ).value;
    state.beds = +$("#beds").value;
    state.baths = +$("#baths").value;
    state.sqftIndex = +$("#sqft").value;

    /* recurring discounts only apply to Standard cleans */
    var freqLocked = state.service !== "standard";
    $$("input[name=frequency]").forEach(function (r) {
      r.disabled = freqLocked;
    });
    if (freqLocked) {
      $("input[name=frequency][value=once]").checked = true;
      state.frequency = "once";
    }
    $("#freq-note").hidden = !freqLocked;
    $("#beds-label").textContent =
      state.property === "office"
        ? "Private offices / rooms"
        : "Bedrooms";

    state.addons = {};
    $$("[data-addon]").forEach(function (c) {
      var k = c.getAttribute("data-addon");
      var qty = $('[data-qty="' + k + '"]');
      if (qty) qty.disabled = !c.checked;
      if (c.checked)
        state.addons[k] = qty
          ? Math.max(1, Math.min(+qty.max, +qty.value || 1))
          : 1;
    });
    render();
  }

  function render() {
    var r = FFC.calc(state);
    var rows = [
      ["Service", r.serviceLabel],
      ["Property", r.propertyLabel],
      [
        "Size",
        (state.beds === 0
          ? "Studio"
          : state.beds + " bed") +
          " · " +
          state.baths +
          " bath · " +
          r.sizeLabel,
      ],
      ["Frequency", r.frequencyLabel],
    ];
    var html = rows
      .map(function (x) {
        return (
          "<div><dt>" +
          x[0] +
          "</dt><dd>" +
          x[1] +
          "</dd></div>"
        );
      })
      .join("");
    html +=
      '<div class="sum-line"><dt>Cleaning</dt><dd>' +
      FFC.money(r.cleaning) +
      "</dd></div>";
    if (r.discount)
      html +=
        '<div class="sum-line sum-line--save"><dt>' +
        Math.round(r.discountRate * 100) +
        "% recurring discount</dt><dd>−" +
        FFC.money(r.discount) +
        "</dd></div>";
    r.addonLines.forEach(function (a) {
      html +=
        '<div class="sum-line"><dt>' +
        a.label.replace(/ \(.*\)/, "") +
        (a.qty > 1 ? " × " + a.qty : "") +
        "</dt><dd>" +
        FFC.money(a.amount) +
        "</dd></div>";
    });
    $("#sum-body").innerHTML = html;
    $("#sum-total").textContent = FFC.money(r.total);
    $("#sum-min").hidden = !r.minApplied;
    return r;
  }

  form.addEventListener("input", sync);
  form.addEventListener("change", sync);
  sync();

  /* ---------- Wizard navigation ---------- */
  var steps = $$(".qstep");
  var stepper = $$("#stepper li");
  var cur = 0;
  var backBtn = $("#btn-back"),
    nextBtn = $("#btn-next"),
    submitBtn = $("#btn-submit");

  function go(n) {
    cur = n;
    steps.forEach(function (s, i) {
      s.hidden = i !== n;
    });
    stepper.forEach(function (li, i) {
      li.classList.toggle("is-current", i === n);
      li.classList.toggle("is-done", i < n);
      if (i === n) li.setAttribute("aria-current", "step");
      else li.removeAttribute("aria-current");
    });
    backBtn.hidden = n === 0;
    nextBtn.hidden = n === steps.length - 1;
    submitBtn.hidden = n !== steps.length - 1;
    var top =
      $("#quote-top").getBoundingClientRect().top +
      window.scrollY -
      90;
    window.scrollTo({ top: top, behavior: "smooth" });
  }

  function fieldError(el, msg) {
    var wrap =
      el.closest(".field") || el.closest("fieldset");
    wrap.classList.toggle("is-invalid", !!msg);
    var e = wrap.querySelector(".err");
    if (e) e.textContent = msg || "";
  }

  function validate(n) {
    var ok = true;
    function need(id, test, msg) {
      var el = $(id);
      var bad = !test(el.value.trim());
      fieldError(el, bad ? msg : "");
      if (bad && ok) {
        el.focus();
      }
      if (bad) ok = false;
    }
    if (n === 2) {
      need(
        "#date",
        function (v) {
          return !!v && v >= dateEl.min;
        },
        "Choose a date from tomorrow onward.",
      );
    }
    if (n === 3) {
      need(
        "#fname",
        function (v) {
          return v.length > 1;
        },
        "Please enter your first name.",
      );
      need(
        "#lname",
        function (v) {
          return v.length > 1;
        },
        "Please enter your last name.",
      );
      need(
        "#email",
        function (v) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
        },
        "Enter a valid email so we can send your quote.",
      );
      need(
        "#phone",
        function (v) {
          return v.replace(/\D/g, "").length >= 10;
        },
        "Enter a phone number with area code.",
      );
      need(
        "#address",
        function (v) {
          return v.length > 4;
        },
        "Enter the street address to be cleaned.",
      );
      need(
        "#city",
        function (v) {
          return v.length > 1;
        },
        "Enter the city.",
      );
      need(
        "#zip",
        function (v) {
          return /^\d{5}(-\d{4})?$/.test(v);
        },
        "Enter a 5-digit ZIP code.",
      );
      var c = $("#consent");
      fieldError(
        c,
        c.checked ? "" : "Please confirm to continue.",
      );
      if (!c.checked) ok = false;
    }
    return ok;
  }

  nextBtn.addEventListener("click", function () {
    if (validate(cur)) go(cur + 1);
  });
  backBtn.addEventListener("click", function () {
    go(cur - 1);
  });
  $$("#stepper li").forEach(function (li, i) {
    li.addEventListener("click", function () {
      if (i < cur) go(i);
    });
  });
  go(0);
  window.scrollTo(0, 0);

  /* ---------- Build emails ---------- */
  function niceDate(v) {
    var d = new Date(v + "T12:00:00");
    return d.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }
  function quoteId() {
    var d = new Date();
    return (
      "FFC-" +
      String(d.getFullYear()).slice(2) +
      String(d.getMonth() + 1).padStart(2, "0") +
      String(d.getDate()).padStart(2, "0") +
      "-" +
      Math.random().toString(36).slice(2, 6).toUpperCase()
    );
  }

  function buildEmail(kind, data, r, id) {
    var e = FFC.esc;
    var td =
      'style="padding:9px 14px;border-bottom:1px solid #f3dfe8;color:#5b4651;font-size:14px"';
    var tdr =
      'style="padding:9px 14px;border-bottom:1px solid #f3dfe8;color:#2b1a24;font-size:14px;text-align:right"';
    var lines =
      "<tr><td " +
      td +
      ">" +
      e(r.serviceLabel) +
      " · " +
      e(r.propertyLabel) +
      "</td><td " +
      tdr +
      ">" +
      FFC.money(r.cleaning) +
      "</td></tr>";
    if (r.discount)
      lines +=
        "<tr><td " +
        td +
        ">" +
        Math.round(r.discountRate * 100) +
        "% recurring discount (" +
        e(r.frequencyLabel) +
        ")</td><td " +
        tdr +
        ">−" +
        FFC.money(r.discount) +
        "</td></tr>";
    r.addonLines.forEach(function (a) {
      lines +=
        "<tr><td " +
        td +
        ">" +
        e(a.label) +
        (a.qty > 1 ? " × " + a.qty : "") +
        "</td><td " +
        tdr +
        ">" +
        FFC.money(a.amount) +
        "</td></tr>";
    });
    var info = [
      ["Quote number", id],
      ["Preferred date", niceDate(data.date)],
      ["Arrival window", data.time],
      [
        "Home size",
        (state.beds === 0
          ? "Studio"
          : state.beds + " bedroom") +
          ", " +
          state.baths +
          " bath, " +
          r.sizeLabel,
      ],
      [
        "Address",
        data.address + ", " + data.city + " " + data.zip,
      ],
      ["Access", data.access],
      ["Pets", data.pets],
      ["Notes", data.notes || "—"],
    ];
    if (kind === "owner") {
      info.unshift(
        ["Customer", data.fname + " " + data.lname],
        ["Email", data.email],
        ["Phone", data.phone],
      );
    }
    var infoRows = info
      .map(function (x) {
        return (
          '<tr><td style="padding:7px 14px;color:#7a6571;font-size:13px;width:140px;vertical-align:top">' +
          x[0] +
          '</td><td style="padding:7px 14px;color:#2b1a24;font-size:14px">' +
          e(x[1]).replace(/\n/g, "<br>") +
          "</td></tr>"
        );
      })
      .join("");

    var intro =
      kind === "customer"
        ? "Hi " +
          e(data.fname) +
          ", thank you for choosing " +
          e(cfg.business.name) +
          "! Here is your estimate and booking request. Our team will review it and contact you to confirm your appointment. Nothing is final until we confirm with you."
        : "<b>New booking request</b> from " +
          e(data.fname + " " + data.lname) +
          ". Reply to this email or call " +
          e(data.phone) +
          " to confirm.";
    var closing =
      kind === "customer"
        ? '<p style="color:#5b4651;font-size:14px;line-height:1.6">Questions or changes? Call or text <b>' +
          e(cfg.business.phone) +
          "</b> or reply to this email.</p>"
        : "";

    return (
      '<div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:auto;border:1px solid #ecd7a3;border-radius:16px;overflow:hidden;background:#fff">' +
      '<div style="background:#120b10;padding:26px;text-align:center"><div style="color:#f6a9c8;font-size:26px;font-family:Georgia,serif">Fairy Fine Cleaning</div><div style="color:#ecd7a3;font-size:12px;letter-spacing:2px;margin-top:6px">MORE THAN CLEAN… IT’S A LITTLE MAGIC</div></div>' +
      '<div style="padding:26px"><p style="margin:0 0 18px;color:#2b1a24;font-size:15px;line-height:1.6">' +
      intro +
      "</p>" +
      '<table style="width:100%;border-collapse:collapse;border:1px solid #f3dfe8;border-radius:10px">' +
      lines +
      '<tr><td style="padding:14px;background:#fdeff5;color:#2b1a24;font-weight:bold">Estimated total</td><td style="padding:14px;background:#fdeff5;text-align:right;color:#c0407e;font-weight:bold;font-size:20px">' +
      FFC.money(r.total) +
      "</td></tr></table>" +
      '<p style="color:#7a6571;font-size:12px;margin:8px 0 20px">Estimate based on the details provided. Final price is confirmed by our team before your visit.</p>' +
      '<table style="width:100%;border-collapse:collapse;background:#faf6f3;border-radius:10px">' +
      infoRows +
      "</table>" +
      closing +
      "</div>" +
      '<div style="background:#120b10;padding:14px;text-align:center;color:#ecd7a3;font-size:12px">' +
      e(cfg.business.phone) +
      " · " +
      e(cfg.business.email) +
      " · " +
      e(cfg.business.location) +
      "</div></div>"
    );
  }

  /* ---------- Submit ---------- */
  form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    if (!validate(3)) return;
    var data = {
      fname: $("#fname").value.trim(),
      lname: $("#lname").value.trim(),
      email: $("#email").value.trim(),
      phone: $("#phone").value.trim(),
      address: $("#address").value.trim(),
      city: $("#city").value.trim(),
      zip: $("#zip").value.trim(),
      notes: $("#notes").value.trim(),
      date: $("#date").value,
      time: $("input[name=time]:checked").value,
      access: $("#access").value,
      pets: $("#pets").value,
    };
    var r = FFC.calc(state);
    var id = quoteId();
    submitBtn.disabled = true;
    submitBtn.textContent = "Sending your quote…";
    $("#submit-error").hidden = true;

    FFC.sendEmails({
      customerEmail: data.email,
      customerName: data.fname,
      replyTo: data.email,
      customerSubject:
        "Your Fairy Fine Cleaning quote " +
        id +
        " — " +
        FFC.money(r.total),
      ownerSubject:
        "New booking request " +
        id +
        " — " +
        data.fname +
        " " +
        data.lname +
        " (" +
        FFC.money(r.total) +
        ")",
      customerHtml: buildEmail("customer", data, r, id),
      ownerHtml: buildEmail("owner", data, r, id),
    })
      .then(function (res) {
        $("#quote-wizard").hidden = true;
        var ok = $("#quote-success");
        ok.hidden = false;
        $("#ok-id").textContent = id;
        $("#ok-total").textContent = FFC.money(r.total);
        $("#ok-email").textContent = data.email;
        $("#ok-date").textContent =
          niceDate(data.date) + " · " + data.time;
        $("#ok-demo").hidden = !res.demo;
        if (res.demo) {
          var body =
            "Quote " +
            id +
            "\nName: " +
            data.fname +
            " " +
            data.lname +
            "\nPhone: " +
            data.phone +
            "\nService: " +
            r.serviceLabel +
            "\nTotal: " +
            FFC.money(r.total) +
            "\nDate: " +
            niceDate(data.date) +
            " (" +
            data.time +
            ")\nAddress: " +
            data.address +
            ", " +
            data.city +
            " " +
            data.zip;
          $("#ok-mailto").href =
            "mailto:" +
            cfg.business.email +
            "?subject=" +
            encodeURIComponent("Booking request " + id) +
            "&body=" +
            encodeURIComponent(body);
        }
        window.scrollTo({
          top:
            ok.getBoundingClientRect().top +
            window.scrollY -
            120,
          behavior: "smooth",
        });
      })
      .catch(function () {
        var er = $("#submit-error");
        er.hidden = false;
        er.textContent =
          "We couldn’t send your quote just now. Please try again, or call or text " +
          cfg.business.phone +
          " to book.";
        submitBtn.disabled = false;
        submitBtn.textContent =
          "Send my quote & request booking";
      });
  });
})();
