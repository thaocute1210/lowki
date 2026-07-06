/* LOWKI TRANSPORT — corporate motion system v2 */
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Preloader ---------- */
  var loader = document.getElementById("loader");
  function killLoader() {
    if (loader) loader.classList.add("done");
    document.body.classList.add("loaded");
  }
  if (loader) {
    window.addEventListener("load", function () { setTimeout(killLoader, reduce ? 0 : 500); });
    setTimeout(killLoader, 2800);
  }

  /* ---------- Smooth scroll: Lenis (bundled, MIT) ---------- */
  var lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new Lenis({
      duration: 0.95,            /* fast, corporate feel */
      easing: function (t) { return 1 - Math.pow(1 - t, 3); },
      smoothWheel: true,
      syncTouch: false,          /* native touch scrolling on mobile */
      wheelMultiplier: 1.15
    });
    function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
    /* anchor links scroll via lenis */
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener("click", function (e) {
        var id = a.getAttribute("href");
        if (id.length > 1 && document.querySelector(id)) {
          e.preventDefault();
          lenis.scrollTo(id, { offset: -90 });
        }
      });
    });
  }

  /* ---------- Header + scroll progress ---------- */
  var header = document.querySelector("header.site");
  var bar = document.getElementById("scrollbar");
  var lastY = 0;
  function onScroll() {
    var y = window.scrollY;
    if (header) {
      header.classList.toggle("scrolled", y > 40);
      if (y > 320 && y > lastY && !document.body.classList.contains("nav-open")) header.classList.add("hidden");
      else header.classList.remove("hidden");
    }
    if (bar) {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = (max > 0 ? (y / max) * 100 : 0) + "%";
    }
    lastY = y;
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile nav ---------- */
  var toggle = document.getElementById("navToggle");
  var nav = document.querySelector("nav.main");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      document.body.classList.toggle("nav-open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    nav.querySelectorAll(".drop > button").forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (window.innerWidth <= 860) btn.parentElement.classList.toggle("open");
      });
    });
  }

  /* ---------- Word splitting for .words elements ---------- */
  document.querySelectorAll(".words").forEach(function (el) {
    var idx = 0;
    function wrapWords(node, host) {
      Array.prototype.slice.call(node.childNodes).forEach(function (child) {
        if (child.nodeType === 3) { /* text node */
          child.textContent.split(/\s+/).forEach(function (w) {
            if (!w) return;
            var outer = document.createElement("span"); outer.className = "w";
            var inner = document.createElement("i"); inner.textContent = w;
            inner.style.transitionDelay = (0.055 * idx++) + "s";
            outer.appendChild(inner);
            host.appendChild(outer); host.appendChild(document.createTextNode(" "));
          });
        } else if (child.nodeType === 1) { /* element (e.g. .hl) — keep it, split inside */
          var clone = child.cloneNode(false);
          host.appendChild(clone);
          wrapWords(child, clone);
          host.appendChild(document.createTextNode(" "));
        }
      });
    }
    var frag = document.createDocumentFragment();
    wrapWords(el, frag);
    el.textContent = "";
    el.appendChild(frag);
  });

  /* ---------- Scroll reveal ---------- */
  var revealEls = document.querySelectorAll(".reveal, .bars-parent, .words");
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in-view"); io.unobserve(e.target); }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in-view"); });
  }

  /* ---------- Counters ---------- */
  function animateCount(el) {
    var t = parseFloat(el.getAttribute("data-count")), dur = 1800, start = null;
    if (reduce) { el.textContent = t.toLocaleString(); return; }
    (function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1), eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(t * eased).toLocaleString();
      if (p < 1) requestAnimationFrame(step);
    })(performance.now());
  }
  var counters = document.querySelectorAll("[data-count]");
  if ("IntersectionObserver" in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { animateCount(e.target); cio.unobserve(e.target); } });
    }, { threshold: 0.4 });
    counters.forEach(function (el) { cio.observe(el); });
  } else counters.forEach(animateCount);

  /* ---------- Pinned scroll scenes ---------- */
  document.querySelectorAll(".pin-wrap").forEach(function (wrap) {
    var vids = wrap.querySelectorAll(".pin-media video");
    var panels = wrap.querySelectorAll(".pin-panel");
    var dots = wrap.querySelectorAll(".pin-index button");
    var steps = panels.length;
    wrap.style.height = (steps + 1) * 100 + "svh";
    var active = -1;
    function setStep(i) {
      if (i === active) return;
      active = i;
      vids.forEach(function (v, k) {
        v.classList.toggle("active", k === i);
        if (k === i && v.paused) { var pr = v.play(); if (pr) pr.catch(function(){}); }
      });
      panels.forEach(function (p, k) { p.classList.toggle("active", k === i); });
      dots.forEach(function (d, k) { d.classList.toggle("active", k === i); });
    }
    function update() {
      var rect = wrap.getBoundingClientRect();
      var total = wrap.offsetHeight - window.innerHeight;
      var progress = Math.min(Math.max(-rect.top / total, 0), 0.999);
      setStep(Math.floor(progress * steps));
    }
    dots.forEach(function (d, k) {
      d.addEventListener("click", function () {
        var total = wrap.offsetHeight - window.innerHeight;
        var y = wrap.offsetTop + (k + 0.5) / steps * total;
        if (lenis) lenis.scrollTo(y); else window.scrollTo({ top: y, behavior: reduce ? "auto" : "smooth" });
      });
    });
    window.addEventListener("scroll", update, { passive: true });
    update();
  });

  /* ---------- Parallax ---------- */
  var pEls = document.querySelectorAll("[data-parallax]");
  if (pEls.length && !reduce) {
    function parallax() {
      var vh = window.innerHeight;
      pEls.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) return;
        var f = parseFloat(el.getAttribute("data-parallax")) || 0.08;
        var offset = (r.top + r.height / 2 - vh / 2) * f;
        el.style.transform = "translateY(" + offset.toFixed(1) + "px)";
      });
      requestAnimationFrame(parallax);
    }
    requestAnimationFrame(parallax);
  }

  /* ---------- Lazy-play videos only in view ---------- */
  var bgVids = document.querySelectorAll("video[data-bg]");
  if ("IntersectionObserver" in window) {
    var vio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var v = e.target;
        if (e.isIntersecting) { var pr = v.play(); if (pr) pr.catch(function(){}); }
        else v.pause();
      });
    }, { threshold: 0.1 });
    bgVids.forEach(function (v) { vio.observe(v); });
  }
  /* Autoplay fallback: some browsers block until first interaction */
  function kickVideos() {
    document.querySelectorAll("video[autoplay], .pin-media video.active").forEach(function (v) {
      if (v.paused) { var pr = v.play(); if (pr) pr.catch(function () {}); }
    });
    window.removeEventListener("scroll", kickVideos);
    window.removeEventListener("pointerdown", kickVideos);
  }
  window.addEventListener("scroll", kickVideos, { passive: true, once: true });
  window.addEventListener("pointerdown", kickVideos, { once: true });

  /* ---------- FAQ accordion ---------- */
  document.querySelectorAll(".faq-item button").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var item = btn.closest(".faq-item");
      var body = item.querySelector(".faq-body");
      var open = item.classList.toggle("open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      body.style.maxHeight = open ? body.scrollHeight + "px" : "0px";
    });
  });

  /* ---------- Forms (front-end demo handling) ---------- */
  document.querySelectorAll("form[data-demo]").forEach(function (form) {
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      var ok = form.querySelector(".form-success");
      if (ok) { ok.style.display = "block"; ok.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" }); }
      form.querySelectorAll("input, select, textarea, button[type=submit]").forEach(function (el) { el.disabled = true; });
    });
  });

  /* ---------- Active nav ---------- */
  var path = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll("nav.main > a").forEach(function (a) {
    if (a.getAttribute("href") === path) a.classList.add("active");
  });


  /* ---------- Scrollspy (legal / long-doc sidebar) ---------- */
  var spyLinks = document.querySelectorAll(".doc-toc a[href^='#']");
  if (spyLinks.length) {
    var spyMap = [];
    spyLinks.forEach(function (a) {
      var sec = document.querySelector(a.getAttribute("href"));
      if (sec) spyMap.push([sec, a]);
    });
    function spy() {
      var activeLink = spyMap[0] && spyMap[0][1];
      spyMap.forEach(function (pair) {
        if (pair[0].getBoundingClientRect().top <= 160) activeLink = pair[1];
      });
      spyLinks.forEach(function (a) { a.classList.toggle("active", a === activeLink); });
    }
    window.addEventListener("scroll", spy, { passive: true });
    spy();
  }

  document.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
