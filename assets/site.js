/* Flex Digital: site behaviour. No dependencies. */
(function () {
  'use strict';
  var d = document, root = d.documentElement;
  var $ = function (s, c) { return (c || d).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); };
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- mobile menu ---------- */
  var burger = $('[data-burger]'), mnav = $('#mnav');
  function setMenu(open) {
    if (!burger || !mnav) return;
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    mnav.hidden = !open;
  }
  if (burger && mnav) {
    burger.addEventListener('click', function () { setMenu(burger.getAttribute('aria-expanded') !== 'true'); });
    mnav.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
    d.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !mnav.hidden) { setMenu(false); burger.focus(); }
    });
    window.addEventListener('resize', function () { if (window.innerWidth > 980) setMenu(false); });
  }

  /* ---------- scroll effects (fallback when the browser has no scroll-driven animations) ---------- */
  var native = window.CSS && CSS.supports && CSS.supports('animation-timeline: view()');
  if (!native) {
    root.classList.add('no-st');
    var bar = $('.progress'), nav = $('.nav'), ticking = false;
    var paint = function () {
      var h = root.scrollHeight - window.innerHeight;
      if (bar) bar.style.transform = 'scaleX(' + (h > 0 ? Math.min(1, window.scrollY / h) : 0) + ')';
      if (nav) nav.classList.toggle('scrolled', window.scrollY > 24);
      ticking = false;
    };
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(paint); } }, { passive: true });
    paint();
    var targets = $$('.rv, .rv-line');
    if ('IntersectionObserver' in window && !reduce) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
      targets.forEach(function (t) { io.observe(t); });
    } else {
      targets.forEach(function (t) { t.classList.add('in'); });
    }
  }

  /* ---------- tabs (service solutions) ---------- */
  $$('[data-tabs]').forEach(function (box) {
    var tabs = $$('[role="tab"]', box);
    var panels = tabs.map(function (t) { return d.getElementById(t.getAttribute('aria-controls')); });
    function select(i, focus, scroll) {
      tabs.forEach(function (t, k) {
        var on = k === i;
        t.classList.toggle('on', on);
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
        panels[k].classList.toggle('on', on);
      });
      if (focus) tabs[i].focus();
      if (scroll && window.innerWidth < 960 && panels[i].getBoundingClientRect().top > window.innerHeight * 0.6) {
        panels[i].scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      }
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(i, false, true); });
      t.addEventListener('keydown', function (e) {
        var n = tabs.length, k = -1;
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') k = (i + 1) % n;
        else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') k = (i - 1 + n) % n;
        else if (e.key === 'Home') k = 0;
        else if (e.key === 'End') k = n - 1;
        if (k > -1) { e.preventDefault(); select(k, true, false); }
      });
    });
    var h = location.hash && location.hash.slice(1);
    var hi = panels.findIndex(function (p) { return p && p.id === h; });
    if (hi > 0) select(hi, false, false);
  });

  /* ---------- biographies ---------- */
  $$('[data-bio]').forEach(function (btn) {
    var box = d.getElementById(btn.getAttribute('aria-controls'));
    var label = btn.firstChild;
    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') !== 'true';
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.classList.toggle('open', open);
      box.classList.toggle('open', open);
      label.nodeValue = (open ? 'Show less' : 'Read full biography') + ' ';
    });
  });

  /* ---------- contact form ---------- */
  var form = $('#enquiry');
  if (form) {
    var endpoint = form.getAttribute('data-endpoint') || '';
    var mailTo = form.getAttribute('data-mailto') || '';
    var sendBtn = $('[data-send]', form), sendLabel = $('[data-send-label]', form), spin = $('.spin', form);
    var okSent = $('#ok-sent'), okMail = $('#ok-mail'), sendErr = $('#send-err');
    var busy = false, timer;
    var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    var show = function (el, on) { if (el) el.hidden = !on; };
    var setErr = function (name, msg) {
      var wrap = $('[data-field="' + name + '"]', form), p = $('#e-' + name, form), inp = wrap && $('input,textarea', wrap);
      if (wrap) wrap.classList.toggle('err', !!msg);
      if (inp) inp.setAttribute('aria-invalid', msg ? 'true' : 'false');
      if (p) { if (msg) p.textContent = msg; p.hidden = !msg; }
    };
    var val = function (n) { var el = form.elements[n]; return el && typeof el.value === 'string' ? el.value.trim() : ''; };

    var validate = function () {
      var first = null, bad = function (name, msg, el) { setErr(name, msg); if (!first) first = el || form.elements[name]; };
      ['fullName', 'email', 'org', 'message'].forEach(function (n) { setErr(n, ''); });
      if (!val('fullName')) bad('fullName', 'Tell us your name so we know who to reply to.');
      var em = val('email');
      if (!em) bad('email', 'Add the work email we should reply to.');
      else if (!EMAIL_RE.test(em)) bad('email', 'That email looks incomplete. Check it and try again.');
      if (!val('org')) bad('org', 'Add the name of your organisation.');
      var area = $('input[name="area"]:checked', form), fs = $('.fs', form), ea = $('#e-area');
      fs.classList.toggle('err', !area); ea.hidden = !!area;
      if (!area && !first) first = $('input[name="area"]', form);
      if (!val('message')) bad('message', 'Add a few lines about what you would like to achieve.');
      if (first) first.focus();
      return !first;
    };

    form.addEventListener('input', function (e) {
      var wrap = e.target.closest && e.target.closest('[data-field]');
      if (wrap && wrap.classList.contains('err') && e.target.value.trim()) setErr(wrap.getAttribute('data-field'), '');
      if (e.target.name === 'area') { $('.fs', form).classList.remove('err'); $('#e-area').hidden = true; }
    });

    var busyUI = function (on) {
      busy = on; sendBtn.disabled = on; show(spin, on);
      sendLabel.textContent = on ? 'Sending…' : 'Send Enquiry';
    };
    var done = function (el) {
      show(form, false); show(el, true); el.focus();
      if (el.scrollIntoView) el.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' });
    };

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (busy) return;
      show(sendErr, false);
      if (!validate()) return;
      if (val('company_website')) { done(okSent); return; } /* honeypot: pretend success to bots */

      var data = {
        fullName: val('fullName'), email: val('email'), organisation: val('org'),
        jobTitle: val('jobTitle'), areaOfInterest: ($('input[name="area"]:checked', form) || {}).value || '',
        message: val('message'), page: location.href
      };

      if (endpoint) {
        busyUI(true);
        var ctl = window.AbortController ? new AbortController() : null;
        timer = setTimeout(function () { if (ctl) ctl.abort(); }, 15000);
        fetch(endpoint, {
          method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(data), signal: ctl ? ctl.signal : undefined
        }).then(function (r) {
          clearTimeout(timer); busyUI(false);
          if (r.ok) done(okSent); else throw new Error('status ' + r.status);
        }).catch(function () {
          clearTimeout(timer); busyUI(false); show(sendErr, true);
        });
      } else if (mailTo) {
        var body = 'Name: ' + data.fullName + '\nOrganisation: ' + data.organisation +
          (data.jobTitle ? '\nJob title: ' + data.jobTitle : '') + '\nEmail: ' + data.email +
          '\nArea of interest: ' + data.areaOfInterest + '\n\n' + data.message;
        location.href = 'mailto:' + mailTo + '?subject=' + encodeURIComponent('Enquiry from ' + data.fullName + ', ' + data.organisation) + '&body=' + encodeURIComponent(body);
        done(okMail);
      }
    });

    $$('[data-reset]').forEach(function (b) {
      b.addEventListener('click', function () {
        show(okSent, false); show(okMail, false); show(form, true);
        if (b.closest('#ok-sent')) form.reset();
        var f = form.elements.fullName; if (f) f.focus();
      });
    });
  }
})();
