/* Before / After sliders, gallery filter, lightbox */
(function () {
  var $$ = function (s, c) {
    return Array.prototype.slice.call(
      (c || document).querySelectorAll(s),
    );
  };
  var reduce =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)")
      .matches;

  /* ---------- Before / After sliders ---------- */
  $$("[data-ba]").forEach(function (fig) {
    var frame = fig.querySelector(".ba__frame");
    var range = fig.querySelector(".ba__range");
    function set(v) {
      frame.style.setProperty("--pos", v + "%");
    }
    set(range.value);
    range.addEventListener("input", function () {
      set(range.value);
      frame.classList.add("is-touched");
    });

    /* one gentle demo sweep the first time it scrolls into view */
    if (!reduce && "IntersectionObserver" in window) {
      var io = new IntersectionObserver(
        function (en) {
          if (!en[0].isIntersecting) return;
          io.disconnect();
          if (frame.classList.contains("is-touched"))
            return;
          var start = null;
          function step(ts) {
            if (frame.classList.contains("is-touched"))
              return;
            if (!start) start = ts;
            var t = Math.min((ts - start) / 1600, 1);
            var v =
              50 +
              Math.sin(t * Math.PI * 2) *
                22 *
                (1 - t * 0.2);
            range.value = v;
            set(v);
            if (t < 1) requestAnimationFrame(step);
            else {
              range.value = 50;
              set(50);
            }
          }
          requestAnimationFrame(step);
        },
        { threshold: 0.6 },
      );
      io.observe(fig);
    }
  });

  /* ---------- Filters ---------- */
  var filters = $$(".filter");
  var items = $$("[data-cat]");
  filters.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var cat = btn.getAttribute("data-filter");
      filters.forEach(function (b) {
        b.setAttribute(
          "aria-pressed",
          b === btn ? "true" : "false",
        );
      });
      items.forEach(function (it) {
        var show =
          cat === "all" ||
          it.getAttribute("data-cat") === cat;
        it.hidden = !show;
      });
    });
  });

  /* ---------- Lightbox ---------- */
  var lb = document.getElementById("lightbox");
  if (!lb) return;
  var lbImg = lb.querySelector("img");
  var lbCap = lb.querySelector("figcaption");
  var triggers = $$("[data-lightbox]");
  var idx = 0;
  function show(i) {
    idx = (i + triggers.length) % triggers.length;
    var t = triggers[idx];
    lbImg.src = t.getAttribute("href");
    lbImg.alt = t.getAttribute("data-alt") || "";
    lbCap.textContent = t.getAttribute("data-alt") || "";
  }
  function open(i) {
    show(i);
    lb.hidden = false;
    document.body.classList.add("menu-open");
    lb.querySelector(".lightbox__close").focus();
  }
  function close() {
    lb.hidden = true;
    document.body.classList.remove("menu-open");
  }
  triggers.forEach(function (t, i) {
    t.addEventListener("click", function (e) {
      e.preventDefault();
      open(i);
    });
  });
  lb.querySelector(".lightbox__close").addEventListener(
    "click",
    close,
  );
  lb.querySelector(".lightbox__prev").addEventListener(
    "click",
    function () {
      show(idx - 1);
    },
  );
  lb.querySelector(".lightbox__next").addEventListener(
    "click",
    function () {
      show(idx + 1);
    },
  );
  lb.addEventListener("click", function (e) {
    if (e.target === lb) close();
  });
  document.addEventListener("keydown", function (e) {
    if (lb.hidden) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowRight") show(idx + 1);
    if (e.key === "ArrowLeft") show(idx - 1);
  });
})();
