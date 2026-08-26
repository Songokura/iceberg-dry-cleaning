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

      var kk = document.documentElement.lang === "kk";
      var text = kk
        ? "Сәлеметсіз бе! Iceberg Dry Cleaning сайтынан өтінім:\n" +
          "Аты-жөні: " + name + "\n" +
          "Телефон: " + phone +
          (msg ? "\nНені тазалау керек: " + msg : "")
        : "Здравствуйте! Заявка с сайта Iceberg Dry Cleaning:\n" +
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

/* ═══════════ i18n: RU / KZ ═══════════
   Русский лежит в самой разметке; словарь содержит только казахский.
   Оригиналы снимаются при загрузке, возврат на RU — восстановлением. */
(function () {
  "use strict";

  var IG = "https://www.instagram.com/dry_cleaning_iceberg";
  var A = '<a href="' + IG + '" target="_blank" rel="noopener">@dry_cleaning_iceberg</a>';
  var MQ = "<span>Дивандар ❄ Креслолар ❄ Матрастар ❄ Кілемдер ❄ Сәби арбалары ❄ Автокреслолар ❄ Төсектер ❄ Орындықтар ❄ Ковролин ❄ Бумен дезинфекциялау ❄ </span>";

  var KK = {
    /* шапка */
    nav_serv: "Қызметтер", nav_ba: "Дейін / кейін", nav_proc: "Процесс",
    nav_price: "Бағалар", nav_faq: "Сұрақтар", nav_cont: "Байланыс",
    call: "Қоңырау шалу", burger_al: "Мәзірді ашу", nav_al: "Негізгі мәзір",
    lang_al: "Сайт тілі",

    /* первый экран */
    hero_kick: '<span class="pulse-dot" aria-hidden="true"></span>Астана · үйге барып тазалаймыз',
    hero_h1: '<span class="hero__line">Жұмсақ жиһазды</span>' +
             '<span class="hero__line"><i>терең</i> тазалау —</span>' +
             '<span class="hero__line hero__line--accent">үйіңізде</span>',
    hero_sub: "Дивандар, матрастар, кілемдер және сәби арбалары. Америкалық эко-химия, Германия мен Италия " +
              "экстракторлары — кірді қаптаманың бетіне жағып тастамай, толтырғыштың тереңінен шығарамыз.",
    wa_calc: "WhatsApp арқылы есептеу",
    hero_badges_al: "Негізгі фактілер",
    hero_badges: "<li><b>5 жыл</b><span>Астана нарығында</span></li>" +
                 "<li><b>11 200</b><span>Instagram жазылушысы</span></li>" +
                 "<li><b>2 сертификат</b><span>кәсіби шебердің</span></li>" +
                 "<li><b>8:00 – 22:00</b><span>күн сайын, демалыссыз</span></li>",
    marquee: MQ + MQ,

    /* эффект айсберга */
    berg_al: "Айсберг әсері: кірдің 90 пайызы көрінбейді",
    berg_label: "Айсберг әсері",
    berg_h2: "Көзге көрінетін тазалық —<br>тек шыңы ғана",
    berg_text: "— қаптаманың <b>астында</b> жасырылған кір: шаң, аллергендер мен иіс толтырғыштың " +
               "тереңіне сіңеді. Үстіңгі тазалау оларды алмайды — экстракторлы тазалау түбегейлі шайып шығарады.",
    berg_btn: "Терең тазалау керек",

    /* услуги */
    serv_label: "Нені тазалаймыз",
    serv_h2: "Үйіңіздегі<br>барлық жұмсақ зат",
    serv_note: "Люкс маталарды қоса алғанда, матаның барлық түрімен жұмыс істейміз. " +
               "Қалаған қызметті бассаңыз — дайын хабарламасы бар WhatsApp ашылады.",
    c_divany_t: "Дивандар",     c_divany_p: "<b>5 000 – 17 500 ₸</b> · 2–6 орындық дивандар",
    c_kresla_t: "Креслолар",    c_kresla_p: "<b>3 000 – 5 000 ₸</b>",
    c_stulya_t: "Орындықтар",   c_stulya_p: "<b>800 ₸</b>-ден бастап",
    c_matrasy_t: "Матрастар",   c_matrasy_p: "<b>7 000 – 10 000 ₸</b>",
    c_krovati_t: "Төсектер",    c_krovati_p: "қаптама мен төсек басы · фото бойынша есептеу",
    c_kolyaski_t: "Сәби арбалары", c_kolyaski_p: "<b>12 000 – 20 000 ₸</b>",
    c_avtokresla_t: "Автокреслолар", c_avtokresla_p: "фото бойынша есептеу",
    c_kovry_t: "Кілемдер",      c_kovry_p: "<b>1 000 ₸/м²</b>-ден бастап",
    c_kovrolin_t: "Ковролин",   c_kovrolin_p: "<b>1 000 ₸/м²</b>",
    c_dezinfekciya_t: "Бумен дезинфекциялау",
    c_dezinfekciya_p: "20 000 ₸-ден жоғары тапсырысқа — <b>сыйлық</b>",
    serv_min: "Ең төмен тапсырыс — <b>10 000 ₸</b>",

    /* до / после */
    ba_label: "Айырмашылық көрініп тұр",
    ba_h2: 'Дейін <span class="thin">/</span> кейін',
    ba_note: "Шеберлеріміздің нақты жұмыстары — сток суреттерсіз және ретушьсіз. Әр тапсырысты осылай түсіреміз.",
    w1: "Диван, мата қаптама",
    w2: "Кресло, ашық түсті қаптама",
    w3: "Орындықтар, жиынтық",
    w4: "Матрас",
    w5: "Кресло, велюр",
    w6: "Бұрыштық диван",
    w7: "Диван, отыратын бөлігі",
    w8: "Матрас, дақтар",
    ba_disc: "Жұмыстар тағы да көп — " + A + " парақшасындағы «До и после» бөлімінде.",

    /* процесс */
    proc_chip_b: "Германия · Италия",
    proc_chip_s: "кәсіби экстракторлар мен шаңсорғыштар",
    proc_label: "Тазалау қалай өтеді",
    proc_h2: "Терең тазалыққа<br>бес қадам",
    st1_t: "Матаны тексеру",
    st1_p: "Қаптама мен кірдің түрін анықтаймыз — соған қарай құрамын таңдаймыз. Люкс маталарды қоса алғанда, барлық матамен жұмыс істейміз.",
    st2_t: "Құрғақ тазалау",
    st2_p: "Кәсіби шаңсорғыш жиһаздың бетіндегі және қатпарлардағы шаң мен құрғақ қоқысты жинайды.",
    st3_t: "АҚШ эко-химиясы",
    st3_p: "Америкалық эко-құрамды жағамыз — ол кірді тек бетінде емес, талшықтың тереңінде ыдыратады.",
    st4_t: "Экстракция",
    st4_p: "Экстрактор ерітіндіні кірмен бірге толтырғыштан шайып шығарады — айсбергтің дәл сол «су астындағы бөлігі».",
    st5_t: "Аяқтау",
    st5_p: "Қалған ылғалды кетіреміз, нәтижені сізбен бірге тексереміз. Сұраныс бойынша — бумен дезинфекциялау.",

    /* цены */
    pr_label: "Прайс",
    pr_h2: "Әділ баға,<br>«тосынсыйсыз»",
    pr_note: "Нақты бағаны шебер шықпай тұрып, WhatsApp арқылы фото бойынша айтамыз.",
    pr_btn: "Есептеуге фото жіберу",
    ph_div: "Дивандар",
    p_d2: "2 орындық",
    p_d3: "3 орындық",
    p_d4: "4 орындық",
    p_d5: "5 орындық",
    p_d6: "6 орындық",
    ph_kres: "Креслолар мен орындықтар",
    p_kr: "Кресло",
    p_ok: "Кеңсе креслосы",
    p_st: "Орындық",
    p_ss: "Арқалығы бар орындық",
    p_pf: "Пуфик",
    ph_matr: "Матрастар",
    p_m1: "Бір орындық",
    p_m15: "Бір жарым орындық",
    p_m2: "Екі орындық",
    ph_oth: "Кілемдер және басқасы",
    p_kol: "Сәби арбасы",
    p_kov: "Кілемдер",
    p_kvl: "Ковролин",
    p_oth: "Төсектер · автокреслолар",
    p_min: "Ең төмен тапсырыс",
    /* цифры одинаковы в обеих версиях — дублируем, чтобы сверка ключей оставалась строгой */
    v_d2: "5 000 – 7 500 ₸",
    v_d3: "7 500 – 10 000 ₸",
    v_d4: "10 000 – 12 500 ₸",
    v_d5: "12 500 – 15 000 ₸",
    v_d6: "15 000 – 17 500 ₸",
    v_kol: "12 000 – 20 000 ₸",
    v_kr: "3 000 – 5 000 ₸",
    v_kvl: "1 000 ₸/м²",
    v_m1: "7 000 ₸",
    v_m15: "8 000 ₸",
    v_m2: "10 000 ₸",
    v_ok: "1 500 ₸",
    v_pf: "2 500 ₸",
    v_ss: "1 500 ₸",
    v_st: "800 ₸",
    v_min: "10 000 ₸",
    v_kov: "1 000 ₸/м²-ден бастап", v_oth: "фото бойынша есептеу",

    /* акция */
    promo_label: "Сыйлық",
    promo_h2: "20 000 ₸-ден жоғары тапсырыс берсеңіз —<br>жиһазды <em>бумен дезинфекциялау</em> сыйлыққа",
    promo_p: "Бу көзге көрінбейтінді кетіреді. Шеберге «Айсберг» промокодын айтсаңыз болды — " +
             "немесе ештеңе айтпасаңыз да, сыйлық сіздікі.",
    promo_btn: "Сыйлықты алу",

    /* доверие */
    tr_label: "Неге Iceberg",
    tr_h2: "Есік ашылатын<br>шеберлер",
    tr_s1: "жыл Астана нарығында",
    tr_s2: "Instagram жазылушысы — күн сайын нақты жұмыстар",
    tr_s3: "сертификат: клининг мектебі (Алматы) және Тарас Дударь орталығы (Ресей)",
    tr_s4: "қызмет түрі — орындықтан ковролинге дейін",
    tr_cap_b: "Эко-химия — АҚШ",
    tr_cap_s: "құрамдар матаның әр түріне қарай таңдалады",
    cert_label: "Сертификаттар",
    cert_h3: "Құжатпен расталған оқу",
    cert_c0: "Шеберге сертификат тапсыру",
    cert_c1: "Клининг мектебі · Алматы · 2021",
    cert_c2: "Тарас Дударь орталығы · Ресей",

    /* отзывы */
    rev_label: "Пікірлер",
    rev_h2: "Бізге сенеді —<br>және оны көрсетеді",
    rev_note: "Біз «ойдан шығарылған» пікірлерді жарияламаймыз. Клиенттердің нақты бейнепікірлері " +
              "мен жұмыс нәтижелері — Instagram парақшамызда.",
    v1_badge: "бейнепікір", v1_t: "«Диван жаңадай»", v1_s: "Instagram парақшасынан көру · «Видеоотзывы» бөлімі",
    v2_badge: "процесс",    v2_t: "Тікелей экстракция", v2_s: "Instagram парақшасынан көру · «До и после» бөлімі",
    v3_badge: "нәтиже",     v3_t: "Iceberg тазалағаннан кейінгі үй", v3_s: "Instagram парақшасынан көру · жұмыстар лентасы",
    rev_cta: "@dry_cleaning_iceberg · 11 200 жазылушы",

    /* FAQ */
    faq_label: "Сұрақтар",
    faq_h2: "Тапсырыс алдында<br>сұрайды",
    q1: "Дәл менің жиһазым қанша тұрады?",
    a1: "Негізгі бағалар — жоғарыдағы прайста: 3 орындық диван 7 500 – 10 000 ₸, кресло 3 000 – 5 000 ₸, матрас 7 000 ₸-ден. " +
        "Нақты соманы шебер шықпай тұрып, WhatsApp арқылы фото бойынша айтамыз. Ең төмен тапсырыс — 10 000 ₸.",
    q2: "Шынымен үйге барасыздар ма?",
    a2: "Иә, үйіңізде тазалаймыз — жиһазды ешқайда алып кетпейміз. Астана бойынша жұмыс істейміз, базамыз — Манатау көшесі, 17.",
    q3: "Химия балалар мен жануарларға қауіпсіз бе?",
    a3: "Америкалық эко-химияны қолданамыз, құрам матаның түріне қарай таңдалады. Сондықтан да бізге " +
        "сәби арбалары мен матрастарды тазалауды сеніп тапсырады.",
    q4: "Қымбат әрі күтімі қиын матамен жұмыс істейсіздер ме?",
    a4: "Иә, люкс маталарды қоса алғанда, барлық түрін тазалаймыз. Шебер Алматыдағы клининг мектебінде және " +
        "Ресейдегі Тарас Дударь орталығында оқыған — тазалау алдында әрқашан матаны тексереміз.",
    q5: "Дезинфекцияны сыйлыққа қалай алуға болады?",
    a5: "Тапсырыс сомасы 20 000 ₸-ден асса болғаны — жиһазды бумен дезинфекциялауды тегін жасаймыз.",
    q7: "Шеберді сағат нешеде шақыруға болады?",
    a7: "Күн сайын 8:00-ден 22:00-ге дейін жұмыс істейміз, демалыс күні жоқ. Ыңғайлы уақытты WhatsApp арқылы келісеміз — әдетте сол күні немесе келесі күні барамыз.",
    q6: "Жұмыстарыңызды қайдан көруге болады?",
    a6: "Instagram парақшасында " + A + ": «До и после», «Отзывы», «Видеоотзывы», «Сертификаты» бөлімдері.",

    /* контакты */
    ct_label: "Байланыс",
    ct_h2: "Жиһазыңызды<br>талқылайық па?",
    ct_note: "Фото жіберіңіз — бағасын есептеп, шығатын уақытты таңдаймыз.",
    ct_l1: "Өтінімдер мен қоңыраулар", ct_l2: "WhatsApp / Telegram",
    ct_l3: "Instagram", ct_l4: "Мекенжай", ct_l5: "Жұмыс уақыты",
    ct_addr: "Астана, Манатау көшесі, 17 · қала бойынша шығамыз",
    ct_hours: "Күн сайын, 8:00 – 22:00 · демалыссыз",
    f_title: "Бір басумен өтінім",
    f_name: "Атыңыз",           f_name_ph: "Сізге қалай жүгінейік?",
    f_phone: "Телефон",         f_phone_ph: "+7 ___ ___ __ __",
    f_msg: "Нені тазалау керек?", f_msg_ph: "Мысалы: 3 орындық диван және екі кресло",
    f_send: "WhatsApp арқылы жіберу",
    f_note: "Түймені бассаңыз, дайын хабарламасы бар WhatsApp ашылады — қайта теруге тура келмейді.",
    f_thx_b: "Рақмет! ❄",
    f_thx_p: "Хабарлама дайындалды — оны WhatsApp ішінде қарап шығып, «Жіберу» түймесін басыңыз. Тез жауап береміз.",

    /* футер */
    foot_addr: "Астана, Манатау көшесі, 17 · күн сайын 8:00 – 22:00<br>Жұмсақ жиһазды үйге барып тазалау"
  };

  var META = {
    ru: {
      t: "Iceberg Dry Cleaning — химчистка мягкой мебели с выездом в Астане",
      d: "Выездная химчистка диванов, матрасов, ковров и колясок в Астане. Американская эко-химия, " +
         "оборудование из Германии и Италии, 5 лет опыта. Посадочное место — 3 500 ₸. Расчёт по фото в WhatsApp."
    },
    kk: {
      t: "Iceberg Dry Cleaning — Астанада жұмсақ жиһазды үйге барып химиялық тазалау",
      d: "Астанада диван, матрас, кілем және сәби арбасын үйге барып химиялық тазалау. Америкалық эко-химия, " +
         "Германия мен Италия жабдығы, 5 жыл тәжірибе. 3 орындық диван — 7 500–10 000 ₸. WhatsApp арқылы фото бойынша есептеу."
    }
  };

  var box = document.querySelector(".lang");
  if (!box) return;

  var html = [], ph = [], al = [], wa = [];
  document.querySelectorAll("[data-i18n]").forEach(function (el) {
    html.push({ el: el, k: el.getAttribute("data-i18n"), ru: el.innerHTML });
  });
  document.querySelectorAll("[data-i18n-ph]").forEach(function (el) {
    ph.push({ el: el, k: el.getAttribute("data-i18n-ph"), ru: el.getAttribute("placeholder") || "" });
  });
  document.querySelectorAll("[data-i18n-al]").forEach(function (el) {
    al.push({ el: el, k: el.getAttribute("data-i18n-al"), ru: el.getAttribute("aria-label") || "" });
  });
  document.querySelectorAll("[data-wa-kk]").forEach(function (el) {
    wa.push({ el: el, kk: el.getAttribute("data-wa-kk"), ru: el.getAttribute("data-wa") || "" });
  });

  var desc = document.querySelector('meta[name="description"]');

  function apply(lang) {
    var kk = lang === "kk";
    html.forEach(function (o) { var v = kk ? KK[o.k] : o.ru; if (v != null) o.el.innerHTML = v; });
    ph.forEach(function (o) { var v = kk ? KK[o.k] : o.ru; if (v != null) o.el.setAttribute("placeholder", v); });
    al.forEach(function (o) { var v = kk ? KK[o.k] : o.ru; if (v != null) o.el.setAttribute("aria-label", v); });
    wa.forEach(function (o) { o.el.setAttribute("data-wa", kk ? o.kk : o.ru); });

    document.documentElement.lang = kk ? "kk" : "ru";
    document.title = META[kk ? "kk" : "ru"].t;
    if (desc) desc.setAttribute("content", META[kk ? "kk" : "ru"].d);

    box.querySelectorAll("button").forEach(function (b) {
      var on = b.getAttribute("data-lang") === (kk ? "kk" : "ru");
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", on ? "true" : "false");
    });
    try { localStorage.setItem("iceberg-lang", kk ? "kk" : "ru"); } catch (e) {}
  }

  box.addEventListener("click", function (e) {
    var b = e.target.closest ? e.target.closest("button[data-lang]") : null;
    if (b) apply(b.getAttribute("data-lang"));
  });

  var saved = null;
  try { saved = localStorage.getItem("iceberg-lang"); } catch (e) {}
  if (saved === "kk") apply("kk");
})();
