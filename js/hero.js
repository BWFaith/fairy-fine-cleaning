/* Hero animation — sparkle dust that follows the cursor, headline reveal, rotating word, portrait tilt */
(function () {
  var reduce =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)")
      .matches;

  /* ---------- Headline word-by-word reveal ---------- */
  document
    .querySelectorAll("[data-split]")
    .forEach(function (el) {
      var words = el.textContent.trim().split(/\s+/);
      el.textContent = "";
      words.forEach(function (w, i) {
        var outer = document.createElement("span");
        outer.className = "split-word";
        var inner = document.createElement("span");
        inner.textContent = w;
        inner.style.transitionDelay = 0.15 + i * 0.09 + "s";
        outer.appendChild(inner);
        el.appendChild(outer);
        el.appendChild(document.createTextNode(" "));
      });
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          el.classList.add("is-split-in");
        });
      });
    });

  /* ---------- Rotating word ---------- */
  var rot = document.querySelector("[data-rotator]");
  if (rot) {
    var words = Array.prototype.slice.call(
      rot.querySelectorAll(".rotator__word"),
    );
    var i = 0;
    function measure() {
      var widest = 0;
      words.forEach(function (w) {
        widest = Math.max(widest, w.offsetWidth);
      });
      if (widest) rot.style.minWidth = widest + "px";
    }
    measure();
    if (document.fonts && document.fonts.ready)
      document.fonts.ready.then(measure);
    if (!reduce && words.length > 1) {
      setInterval(function () {
        var cur = words[i];
        i = (i + 1) % words.length;
        var next = words[i];
        cur.classList.remove("is-active");
        cur.classList.add("is-leaving");
        next.classList.add("is-active");
        setTimeout(function () {
          cur.classList.remove("is-leaving");
        }, 700);
      }, 2800);
    }
  }

  /* ---------- Portrait tilt (parallax) ---------- */
  var tilt = document.querySelector("[data-tilt]");
  if (
    tilt &&
    !reduce &&
    window.matchMedia("(pointer:fine)").matches
  ) {
    var hero = tilt.closest(".hero") || document;
    hero.addEventListener("pointermove", function (e) {
      var r = tilt.getBoundingClientRect();
      var x =
        (e.clientX - (r.left + r.width / 2)) /
        window.innerWidth;
      var y =
        (e.clientY - (r.top + r.height / 2)) /
        window.innerHeight;
      tilt.style.setProperty(
        "--rx",
        (-y * 7).toFixed(2) + "deg",
      );
      tilt.style.setProperty(
        "--ry",
        (x * 9).toFixed(2) + "deg",
      );
      tilt.style.setProperty(
        "--tx",
        (x * -14).toFixed(1) + "px",
      );
      tilt.style.setProperty(
        "--ty",
        (y * -10).toFixed(1) + "px",
      );
    });
    hero.addEventListener("pointerleave", function () {
      ["--rx", "--ry", "--tx", "--ty"].forEach(
        function (p) {
          tilt.style.removeProperty(p);
        },
      );
    });
  }

  /* ---------- Sparkle canvas ---------- */
  var canvas = document.querySelector("canvas.sparkles");
  if (!canvas) return;
  var ctx = canvas.getContext("2d");
  var host = canvas.parentElement;
  var W = 0,
    H = 0,
    dpr = Math.min(window.devicePixelRatio || 1, 2);
  var COLORS = [
    "236,215,163",
    "246,169,200",
    "255,255,255",
    "232,98,159",
  ];
  var stars = [];
  var dust = [];
  var mouse = { x: -999, y: -999, active: false };
  var running = true;

  function resize() {
    var r = host.getBoundingClientRect();
    W = r.width;
    H = r.height;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var count = Math.max(
      24,
      Math.min(90, Math.round((W * H) / 16000)),
    );
    stars = [];
    for (var n = 0; n < count; n++)
      stars.push(makeStar(true));
  }

  function makeStar(randomY) {
    return {
      x: Math.random() * W,
      y: randomY ? Math.random() * H : H + 10,
      s: 1.5 + Math.random() * 4.5,
      vy: -(0.08 + Math.random() * 0.28),
      vx: (Math.random() - 0.5) * 0.12,
      ph: Math.random() * Math.PI * 2,
      sp: 0.015 + Math.random() * 0.03,
      c: COLORS[(Math.random() * COLORS.length) | 0],
      ox: 0,
      oy: 0,
    };
  }

  function drawStar(x, y, size, alpha, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle =
      "rgba(" + color + "," + alpha.toFixed(3) + ")";
    ctx.beginPath();
    var inner = size * 0.22;
    for (var k = 0; k < 8; k++) {
      var ang = (Math.PI / 4) * k - Math.PI / 2;
      var rad = k % 2 === 0 ? size : inner;
      ctx.lineTo(Math.cos(ang) * rad, Math.sin(ang) * rad);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function frame() {
    if (!running) return;
    ctx.clearRect(0, 0, W, H);

    for (var n = 0; n < stars.length; n++) {
      var st = stars[n];
      st.ph += st.sp;
      st.y += st.vy;
      st.x += st.vx;

      /* gently pushed away from the cursor, then eases back */
      var dx = st.x + st.ox - mouse.x,
        dy = st.y + st.oy - mouse.y;
      var d2 = dx * dx + dy * dy;
      if (mouse.active && d2 < 14000) {
        var d = Math.sqrt(d2) || 1;
        var f = (1 - d / 118) * 2.2;
        st.ox += (dx / d) * f;
        st.oy += (dy / d) * f;
      }
      st.ox *= 0.94;
      st.oy *= 0.94;

      if (st.y < -12) {
        stars[n] = makeStar(false);
        continue;
      }
      var a = 0.25 + 0.65 * (0.5 + 0.5 * Math.sin(st.ph));
      drawStar(st.x + st.ox, st.y + st.oy, st.s, a, st.c);
    }

    for (var j = dust.length - 1; j >= 0; j--) {
      var p = dust[j];
      p.life -= 0.022;
      if (p.life <= 0) {
        dust.splice(j, 1);
        continue;
      }
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.012;
      drawStar(p.x, p.y, p.s * p.life, p.life * 0.9, p.c);
    }
    requestAnimationFrame(frame);
  }

  function spawnDust(x, y) {
    for (var k = 0; k < 2; k++) {
      dust.push({
        x: x + (Math.random() - 0.5) * 10,
        y: y + (Math.random() - 0.5) * 10,
        vx: (Math.random() - 0.5) * 0.9,
        vy: (Math.random() - 0.7) * 0.9,
        s: 2.5 + Math.random() * 4,
        life: 1,
        c: COLORS[(Math.random() * 2) | 0],
      });
    }
    if (dust.length > 140)
      dust.splice(0, dust.length - 140);
  }

  host.addEventListener("pointermove", function (e) {
    var r = host.getBoundingClientRect();
    mouse.x = e.clientX - r.left;
    mouse.y = e.clientY - r.top;
    mouse.active = true;
    if (!reduce) spawnDust(mouse.x, mouse.y);
  });
  host.addEventListener("pointerleave", function () {
    mouse.active = false;
    mouse.x = mouse.y = -999;
  });

  window.addEventListener("resize", resize);
  resize();

  if (reduce) {
    stars.forEach(function (st) {
      drawStar(st.x, st.y, st.s, 0.6, st.c);
    });
    return;
  }

  /* pause when hero is off-screen */
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (en) {
      var vis = en[0].isIntersecting;
      if (vis && !running) {
        running = true;
        requestAnimationFrame(frame);
      }
      if (!vis) running = false;
    }).observe(host);
  }
  requestAnimationFrame(frame);
})();
