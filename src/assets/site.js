(function () {
  // Header background after scrolling
  var header = document.getElementById('siteHeader');
  function onScroll() { header.classList.toggle('scrolled', window.scrollY > 24); }
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  // Mobile menu
  var menuBtn = document.getElementById('menuBtn'), menu = document.getElementById('mobileMenu');
  if (menuBtn && menu) {
    menuBtn.addEventListener('click', function () { var open = menu.hidden; menu.hidden = !open; menuBtn.setAttribute('aria-expanded', String(open)); header.classList.add('scrolled'); });
    menu.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { menu.hidden = true; menuBtn.setAttribute('aria-expanded', 'false'); }); });
  }

  // The whole picture tabs
  var tabs = document.querySelectorAll('.tab-btn'), circles = document.querySelectorAll('circle[data-c]'), out = document.getElementById('tabCopy');
  if (tabs.length && out) {
    var pick = function (i) {
      tabs.forEach(function (t, k) { t.setAttribute('aria-selected', k === i ? 'true' : 'false'); });
      circles.forEach(function (c, k) { c.setAttribute('fill', k === i ? 'rgba(76,107,85,0.16)' : 'rgba(6,69,48,0.03)'); c.setAttribute('stroke', k === i ? '#4C6B55' : '#064530'); });
      out.textContent = tabs[i].getAttribute('data-copy');
    };
    tabs.forEach(function (t, k) { t.addEventListener('click', function () { pick(k); }); });
    circles.forEach(function (c, k) { c.style.cursor = 'pointer'; c.addEventListener('click', function () { pick(k); }); });
  }

  // Mortgage calculator
  var f = document.getElementById('calc');
  if (f) {
    var nz = new Intl.NumberFormat('en-NZ', { style: 'currency', currency: 'NZD', maximumFractionDigits: 0 });
    var pr = document.getElementById('c-price'), dp = document.getElementById('c-dep'), r = document.getElementById('c-rate'), t = document.getElementById('c-term');
    var names = { '52': 'weekly', '26': 'fortnightly', '12': 'monthly' };
    var fill = function (el) { var p = (el.value - el.min) / (el.max - el.min) * 100; el.style.background = 'linear-gradient(to right,#F2B705 ' + p + '%,#3F3F3F ' + p + '%)'; };
    var set = function (id, v) { document.getElementById(id).textContent = v; };
    var calc = function () {
      if (+dp.value > +pr.value) dp.value = pr.value;
      var price = +pr.value, dep = +dp.value, P = Math.max(price - dep, 0), ann = +r.value / 100, yrs = +t.value;
      var n = +f.querySelector('input[name="c-freq"]:checked').value;
      var io = f.querySelector('input[name="c-type"]:checked').value === 'io';
      var i = ann / n, N = yrs * n, pay;
      if (P === 0) pay = 0; else if (io) pay = P * i; else pay = i === 0 ? P / N : P * i / (1 - Math.pow(1 + i, -N));
      var interest = io ? pay * N : pay * N - P;
      set('c-price-out', nz.format(price));
      set('c-dep-out', nz.format(dep));
      set('c-rate-out', (+r.value).toFixed(2) + '%');
      set('c-term-out', yrs + (yrs === 1 ? ' year' : ' years'));
      set('c-label', 'Estimated ' + names[n] + ' repayment');
      set('c-pay', nz.format(Math.round(pay)));
      set('c-loan', nz.format(P));
      set('c-lvr', (price ? P / price * 100 : 0).toFixed(1) + '%');
      set('c-interest', nz.format(Math.round(interest)));
      [pr, dp, r, t].forEach(fill);
    };
    f.addEventListener('input', calc); f.addEventListener('change', calc); calc();
  }

  // Disclosure page: highlight the section you are reading
  var arts = document.querySelectorAll('.d-art'), navLinks = document.querySelectorAll('#discNav a');
  if (arts.length && navLinks.length) {
    var spy = function () {
      var cur = arts[0].id;
      arts.forEach(function (a) { if (a.getBoundingClientRect().top < 160) cur = a.id; });
      navLinks.forEach(function (b) { b.classList.toggle('active', b.dataset.go === cur); });
    };
    window.addEventListener('scroll', spy, { passive: true }); spy();
  }

  // Enquiry form: sent to Netlify Forms. Netlify then emails Philippa and
  // runs netlify/functions/submission-created.js, which adds the lead to Trail.
  var form = document.getElementById('enquiry'), note = document.getElementById('formNote');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { note.textContent = form.dataset.error; note.style.color = '#064530'; return; }
      var btn = form.querySelector('button[type="submit"]'); btn.disabled = true;
      fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(new FormData(form)).toString()
      }).then(function (res) {
        if (!res.ok) throw new Error('Form error ' + res.status);
        window.location.href = '/thanks/';
      }).catch(function () {
        note.textContent = form.dataset.fail; note.style.color = '#064530'; note.style.fontWeight = '600';
        btn.disabled = false;
      });
    });
  }
})();
