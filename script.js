/* ICEBERG DRY CLEANING — интерактив
   Чистый vanilla JS, без зависимостей. Обработчики tel/WhatsApp — делегированные,
   чтобы позже повесить gtag-конверсии в одном месте. */
(function () {
  "use strict";

  var WA_PHONE = "77001119042";
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // служебный режим для скриншотов: ?shot
  var SHOT = /[?&]shot\b/.test(location.search);
  if (SHOT) {
    document.documentElement.classList.add("shotmode");
    reduceMotion = true;
    var bc = document.getElementById("bergCounter");
    if (bc) bc.textContent = "90";
  }

  /* ───────── WhatsApp-ссылки с готовым текстом + делегированный клик ───────── */
  document.addEventListener("click", function (e) {
    var a = e.target.closest ? e.target.closest("a") : null;
    if (!a) return;

    var wa = a.getAttribute("data-wa");
    if (wa) {
      e.preventDefault();
      var url = "https://wa.me/" + WA_PHONE + "?text=" + encodeURIComponent(wa);
      window.open(url, "_blank", "noopener");
      // сюда позже добавится gtag('event', 'whatsapp_click', ...)
      return;
    }
    if (a.href && a.href.indexOf("tel:") === 0) {
      // сюда позже добавится gtag('event', 'phone_click', ...)
    }
  });

  /* ───────── header: фон при скролле ───────── */
  var header = document.getElementById("header");
  var heroEl = document.querySelector(".hero");
  function onScrollHeader() {
    if (window.scrollY > 40) header.classList.add("is-solid");
    else header.classList.remove("is-solid");
  }
  window.addEventListener("scroll", onScrollHeader, { passive: true });
  onScrollHeader();

  /* ───────── мобильное меню ───────── */
  var burger = document.getElementById("burger");
  var nav = document.getElementById("nav");
  if (burger) {
    burger.addEventListener("click", function () {
      var open = document.body.classList.toggle("menu-open");
      burger.setAttribute("aria-expanded", open ? "true" : "false");
      if (open) header.classList.add("is-solid");
    });
    nav.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        document.body.classList.remove("menu-open");
        burger.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ───────── hero: запуск строк заголовка ───────── */
  window.addEventListener("load", function () {
    if (heroEl) heroEl.classList.add("is-ready");
  });
  // страховка, если load уже прошёл
  if (document.readyState === "complete" && heroEl) heroEl.classList.add("is-ready");

  /* ───────── reveal по скроллу ───────── */
  var revEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    var revIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add("is-in");
          revIO.unobserve(en.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    revEls.forEach(function (el) { revIO.observe(el); });
  } else {
    revEls.forEach(function (el) { el.classList.add("is-in"); });
  }

  /* ───────── канвас «иней» в hero ───────── */
  var frost = document.getElementById("frost");
  if (frost && !reduceMotion) {
    var ctx = frost.getContext("2d");
    var W, H, parts = [], running = false, raf;
    var DPR = Math.min(window.devicePixelRatio || 1, 2);

    function sizeFrost() {
      W = frost.clientWidth; H = frost.clientHeight;
      frost.width = W * DPR; frost.height = H * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }
    function makeParts() {
      parts = [];
      var n = Math.round(Math.min(70, W / 18));
      for (var i = 0; i < n; i++) {
        parts.push({
          x: Math.random() * W,
          y: Math.random() * H,
          r: 0.6 + Math.random() * 2.4,
          vx: -0.12 + Math.random() * 0.24,
          vy: 0.14 + Math.random() * 0.45,
          o: 0.15 + Math.random() * 0.5,
          ph: Math.random() * Math.PI * 2
        });
      }
    }
    function tick(t) {
      if (!running) return;
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        p.x += p.vx + Math.sin(t / 2400 + p.ph) * 0.18;
        p.y += p.vy;
        if (p.y > H + 6) { p.y = -6; p.x = Math.random() * W; }
        if (p.x > W + 6) p.x = -6;
        if (p.x < -6) p.x = W + 6;
        var tw = 0.75 + 0.25 * Math.sin(t / 900 + p.ph * 3);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(190,235,248," + (p.o * tw).toFixed(3) + ")";
        ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    }
    sizeFrost(); makeParts();
    window.addEventListener("resize", function () { sizeFrost(); makeParts(); }, { passive: true });
    var frostIO = new IntersectionObserver(function (en) {
      if (en[0].isIntersecting) {
        if (!running) { running = true; raf = requestAnimationFrame(tick); }
      } else {
        running = false; cancelAnimationFrame(raf);
      }
    });
    frostIO.observe(frost);
  }

  /* ───────── «эффект айсберга»: погружение по скроллу ───────── */
  var berg = document.querySelector(".berg");
  var bergSticky = document.querySelector(".berg__sticky");
  var bergCounter = document.getElementById("bergCounter");
  if (berg && bergSticky && !reduceMotion) {
    var bergTicking = false;
    function bergUpdate() {
      bergTicking = false;
      var rect = berg.getBoundingClientRect();
      var total = rect.height - window.innerHeight;
      if (total <= 0) return;
      var p = Math.min(1, Math.max(0, -rect.top / total));
      bergSticky.style.setProperty("--p", p.toFixed(4));
      if (bergCounter) {
        var val = Math.round(10 + 80 * Math.min(1, p * 1.25));
        bergCounter.textContent = val;
      }
    }
    window.addEventListener("scroll", function () {
      if (!bergTicking) { bergTicking = true; requestAnimationFrame(bergUpdate); }
    }, { passive: true });
    bergUpdate();
  } else if (bergCounter) {
    bergCounter.textContent = "90";
  }

  /* ───────── слайдер «до/после» ───────── */
  var ba = document.getElementById("baSlider");
  if (ba) {
    var pos = 50, dragging = false;
    function setPos(v) {
      pos = Math.min(100, Math.max(0, v));
      ba.style.setProperty("--pos", pos + "%");
      ba.setAttribute("aria-valuenow", Math.round(pos));
    }
    function posFromEvent(e) {
      var rect = ba.getBoundingClientRect();
      var x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
      setPos((x / rect.width) * 100);
    }
    ba.addEventListener("pointerdown", function (e) {
      dragging = true;
      ba.setPointerCapture && ba.setPointerCapture(e.pointerId);
      posFromEvent(e);
    });
    ba.addEventListener("pointermove", function (e) { if (dragging) posFromEvent(e); });
    ["pointerup", "pointercancel"].forEach(function (ev) {
      ba.addEventListener(ev, function () { dragging = false; });
    });
    ba.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") { setPos(pos - 4); e.preventDefault(); }
      if (e.key === "ArrowRight") { setPos(pos + 4); e.preventDefault(); }
    });
    // лёгкая «приманка»: покачивание, пока не тронули
    if (!reduceMotion) {
      var teased = false, t0 = null;
      var teaseIO = new IntersectionObserver(function (en) {
        if (en[0].isIntersecting && !teased) {
          teased = true;
          var start = null;
          function tease(ts) {
            if (dragging) return;
            if (!start) start = ts;
            var el = ts - start;
            if (el > 1600) { setPos(50); return; }
            setPos(50 + Math.sin(el / 1600 * Math.PI * 2) * 7);
            requestAnimationFrame(tease);
          }
          requestAnimationFrame(tease);
          teaseIO.disconnect();
        }
      }, { threshold: 0.5 });
      teaseIO.observe(ba);
    }
  }

  /* ───────── галерея пар «до/после» ───────── */
  var thumbs = document.getElementById("baThumbs");
  if (thumbs && ba) {
    var beforeImg = document.getElementById("baBeforeImg");
    var afterImg = document.getElementById("baAfterImg");
    thumbs.addEventListener("click", function (e) {
      var btn = e.target.closest ? e.target.closest(".ba__thumb") : null;
      if (!btn) return;
      var pair = btn.getAttribute("data-pair");
      if (!pair) return;
      thumbs.querySelectorAll(".ba__thumb").forEach(function (b) {
        b.classList.toggle("is-active", b === btn);
      });
      beforeImg.src = "assets/before-" + pair + ".webp";
      afterImg.src = "assets/after-" + pair + ".webp";
      ba.style.setProperty("--pos", "50%");
      ba.setAttribute("aria-valuenow", "50");
    });
  }

  /* ───────── счётчики статистики ───────── */
  var nums = document.querySelectorAll(".stat__num");
  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
  function fmt(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " "); }
  if (nums.length) {
    var cntIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        var target = parseInt(el.getAttribute("data-count"), 10) || 0;
        cntIO.unobserve(el);
        if (reduceMotion) { el.textContent = fmt(target); return; }
        var start = null, dur = 1400;
        function step(ts) {
          if (!start) start = ts;
          var p = Math.min(1, (ts - start) / dur);
          el.textContent = fmt(Math.round(target * easeOutCubic(p)));
          if (p < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      });
    }, { threshold: 0.6 });
    nums.forEach(function (el) { cntIO.observe(el); });
  }

  /* ───────── магнитные кнопки (десктоп, точный указатель) ───────── */
  if (window.matchMedia("(pointer: fine)").matches && !reduceMotion) {
    document.querySelectorAll(".magnetic").forEach(function (el) {
      var strength = 22;
      el.addEventListener("mousemove", function (e) {
        var r = el.getBoundingClientRect();
        var dx = (e.clientX - r.left - r.width / 2) / (r.width / 2);
        var dy = (e.clientY - r.top - r.height / 2) / (r.height / 2);
        el.style.transform = "translate(" + (dx * strength * 0.4) + "px," + (dy * strength * 0.3) + "px)";
      });
      el.addEventListener("mouseleave", function () {
        el.style.transform = "";
      });
    });
  }

  /* ───────── форма → WhatsApp ───────── */
  var form = document.getElementById("leadForm");
  var thanks = document.getElementById("thanks");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = form.elements.name.value.trim();
      var phone = form.elements.phone.value.trim();
      var msg = form.elements.msg.value.trim();

      var ok = true;
      [form.elements.name, form.elements.phone].forEach(function (inp) {
        if (!inp.value.trim()) { inp.classList.add("is-error"); ok = false; }
        else inp.classList.remove("is-error");
      });
      if (!ok) return;

      var text = "Здравствуйте! Заявка с сайта Iceberg Dry Cleaning:\n" +
        "Имя: " + name + "\n" +
        "Телефон: " + phone +
        (msg ? "\nЧто почистить: " + msg : "");
      window.open("https://wa.me/" + WA_PHONE + "?text=" + encodeURIComponent(text), "_blank", "noopener");
      // сюда позже добавится gtag('event', 'lead_form_submit', ...)
      if (thanks) thanks.hidden = false;
      form.reset();
      setTimeout(function () { if (thanks) thanks.hidden = true; }, 9000);
    });
    form.querySelectorAll("input").forEach(function (inp) {
      inp.addEventListener("input", function () { inp.classList.remove("is-error"); });
    });
  }
})();
