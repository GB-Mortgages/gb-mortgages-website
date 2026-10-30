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
    var $ = function (id) { return document.getElementById(id); };
    var pr = $('c-price'), dp = $('c-dep'), r = $('c-rate'), t = $('c-term'), ioIn = $('c-io'), ex = $('c-extra');
    var names = { '52': 'weekly', '26': 'fortnightly', '12': 'monthly' };
    var fill = function (el) { var p = (el.value - el.min) / (el.max - el.min) * 100; el.style.background = 'linear-gradient(to right,#F2B705 ' + p + '%,#3F3F3F ' + p + '%)'; };
    var set = function (id, v) { $(id).textContent = v; };
    var pmt = function (P, i, N) { if (P <= 0 || N <= 0) return 0; return i === 0 ? P / N : P * i / (1 - Math.pow(1 + i, -N)); };
    var short = function (v) { return v >= 1e6 ? '$' + (v / 1e6).toFixed(v % 1e6 ? 1 : 0) + 'm' : v >= 1e3 ? '$' + Math.round(v / 1e3) + 'k' : '$' + Math.round(v); };
    var span = function (periods, n) {
      var months = Math.round(periods * 12 / n), y = Math.floor(months / 12), m = months % 12, out = [];
      if (y) out.push(y + (y === 1 ? ' year' : ' years'));
      if (m) out.push(m + (m === 1 ? ' month' : ' months'));
      return out.join(' ') || 'less than a month';
    };

    // Runs the loan payment by payment and records the balance at the end of each year
    var simulate = function (P, i, n, N, ioN, piPay, extra) {
      var bal = P, totInt = 0, years = [P], paidAt = N;
      for (var k = 0; k < N; k++) {
        var it = bal * i, pay = (k < ioN ? it : piPay) + extra;
        if (pay >= bal + it) { pay = bal + it; }
        totInt += it; bal = bal + it - pay;
        if (bal < 0.005) { bal = 0; if (paidAt === N) paidAt = k + 1; }
        if ((k + 1) % n === 0) years.push(bal);
        if (bal === 0 && (k + 1) % n === 0 && k + 1 >= paidAt) { while (years.length <= N / n) years.push(0); break; }
      }
      return { years: years, interest: totInt, paidAt: paidAt };
    };

    // Draws the balance graph as a simple SVG
    var chart = $('c-chart'), last = null;
    var draw = function (d) {
      last = d;
      var W = Math.max(chart.clientWidth || 1000, 280), small = W < 640, H = small ? 230 : 300, L = small ? 46 : 64, R = small ? 10 : 16, T = 12, B = 30, w = W - L - R, h = H - T - B, yrs = d.yrs, fs = small ? 11 : 13;
      var max = Math.max(d.P, 1), x = function (yr) { return L + yr / yrs * w; }, y = function (v) { return T + h - v / max * h; };
      var line = function (arr) { return arr.map(function (v, k) { return (k ? 'L' : 'M') + x(k).toFixed(1) + ' ' + y(v).toFixed(1); }).join(' '); };
      var grid = '', k;
      for (k = 0; k <= 4; k++) { var gv = max * k / 4, gy = y(gv).toFixed(1); grid += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + gy + '" y2="' + gy + '" stroke="#D3CCBD" stroke-width="1"/><text x="' + (L - 10) + '" y="' + (+gy + 4) + '" text-anchor="end" font-size="' + fs + '" fill="#4F5B53">' + short(gv) + '</text>'; }
      var step = small ? (yrs > 20 ? 10 : yrs > 10 ? 5 : 2) : (yrs > 20 ? 5 : yrs > 10 ? 2 : 1);
      for (k = 0; k <= yrs; k += step) grid += '<text x="' + x(k).toFixed(1) + '" y="' + (H - 10) + '" text-anchor="middle" font-size="' + fs + '" fill="#4F5B53">' + (k === 0 ? 'Now' : 'Yr ' + k) + '</text>';
      var base = d.base.years, withX = d.extra.years;
      var area = line(withX) + ' L' + x(withX.length - 1).toFixed(1) + ' ' + y(0) + ' L' + x(0) + ' ' + y(0) + ' Z';
      var payYr = d.extra.paidAt / d.n, marker = d.extraAmt > 0 && d.extra.paidAt < d.N ? '<circle cx="' + x(payYr).toFixed(1) + '" cy="' + y(0).toFixed(1) + '" r="' + (small ? 6 : 8) + '" fill="#F2B705" stroke="#064530" stroke-width="3"/>' : '';
      chart.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" aria-hidden="true" style="display:block;overflow:visible">' + grid +
        '<path d="' + area + '" fill="#064530" fill-opacity="0.08"/>' +
        '<path d="' + line(base) + '" fill="none" stroke="#9FB3A3" stroke-width="3" stroke-dasharray="7 6"/>' +
        '<path d="' + line(withX) + '" fill="none" stroke="#064530" stroke-width="3.5" stroke-linejoin="round"/>' + marker +
        '<line id="c-hover" x1="0" x2="0" y1="' + T + '" y2="' + (T + h) + '" stroke="#064530" stroke-width="1" opacity="0"/>' +
        '<rect x="' + L + '" y="' + T + '" width="' + w + '" height="' + h + '" fill="transparent" id="c-hit"/></svg>' +
        '<div id="c-tip" class="pointer-events-none absolute top-0 hidden rounded-md bg-[#064530] px-3 py-2 text-xs leading-relaxed text-[#F4F1EA] shadow-lg"></div>';
      chart.setAttribute('aria-label', 'Loan balance over ' + yrs + ' years. ' + (d.extraAmt > 0 ? 'With extra repayments the loan is paid off in ' + span(d.extra.paidAt, d.n) + '.' : ''));
      var hit = $('c-hit'), tip = $('c-tip'), hover = $('c-hover');
      var show = function (evt) {
        var box = chart.getBoundingClientRect(), cx = (evt.touches ? evt.touches[0].clientX : evt.clientX) - box.left;
        var vx = cx / box.width * W, yr = Math.max(0, Math.min(yrs, Math.round((vx - L) / w * yrs)));
        hover.setAttribute('x1', x(yr)); hover.setAttribute('x2', x(yr)); hover.setAttribute('opacity', '0.5');
        tip.innerHTML = '<strong>' + (yr === 0 ? 'Today' : 'End of year ' + yr) + '</strong><br>Without extra: ' + nz.format(Math.round(base[yr] || 0)) + '<br>With extra: ' + nz.format(Math.round(withX[yr] || 0));
        tip.classList.remove('hidden');
        var px = x(yr) / W * box.width, tw = tip.offsetWidth;
        tip.style.left = Math.min(Math.max(px - tw / 2, 0), box.width - tw) + 'px';
      };
      var hide = function () { tip.classList.add('hidden'); hover.setAttribute('opacity', '0'); };
      hit.addEventListener('mousemove', show); hit.addEventListener('touchstart', show, { passive: true }); hit.addEventListener('touchmove', show, { passive: true });
      hit.addEventListener('mouseleave', hide); hit.addEventListener('touchend', hide);
    };

    var calc = function () {
      if (+dp.value > +pr.value) dp.value = pr.value;
      var price = +pr.value, dep = +dp.value, P = Math.max(price - dep, 0), ann = +r.value / 100, yrs = +t.value, extra = +ex.value;
      var n = +f.querySelector('input[name="c-freq"]:checked').value;
      var io = f.querySelector('input[name="c-type"]:checked').value === 'io';
      var i = ann / n, N = yrs * n;
      $('c-io-wrap').hidden = !io; $('c-after-row').hidden = !io;
      var ioYrs = io ? Math.min(+ioIn.value, Math.max(yrs - 1, 0)) : 0, ioN = ioYrs * n;
      var piPay = pmt(P, i, N - ioN), first = io ? P * i : piPay;
      var base = simulate(P, i, n, N, ioN, piPay, 0), withX = simulate(P, i, n, N, ioN, piPay, extra);
      if (io) {
        set('c-io-out', ioYrs + (ioYrs === 1 ? ' year' : ' years'));
        set('c-after-label', 'Then, from year ' + (ioYrs + 1) + ' (principal and interest)');
        set('c-after', nz.format(Math.round(piPay)) + ' ' + names[n]);
        set('c-label', 'Estimated ' + names[n] + ' repayment, interest only');
        fill(ioIn);
      } else {
        set('c-label', 'Estimated ' + names[n] + ' repayment');
      }
      set('c-price-out', nz.format(price));
      set('c-dep-out', nz.format(dep));
      set('c-rate-out', (+r.value).toFixed(2) + '%');
      set('c-term-out', yrs + (yrs === 1 ? ' year' : ' years'));
      set('c-extra-out', extra ? '+' + nz.format(extra) + ' ' + names[n] : 'None');
      set('c-pay', nz.format(Math.round(first)));
      set('c-loan', nz.format(P));
      set('c-lvr', (price ? P / price * 100 : 0).toFixed(1) + '%');
      set('c-interest', nz.format(Math.round(base.interest)));
      var showSave = extra > 0 && P > 0;
      $('c-saved-row').hidden = !showSave; $('c-time-row').hidden = !showSave;
      if (showSave) { set('c-saved', nz.format(Math.round(base.interest - withX.interest))); set('c-time', span(N - withX.paidAt, n)); }
      [pr, dp, r, t, ex].forEach(fill);
      draw({ P: P, yrs: yrs, n: n, N: N, base: base, extra: withX, extraAmt: extra });
    };
    f.addEventListener('input', calc); f.addEventListener('change', calc); calc();
    window.addEventListener('resize', function () { if (last) draw(last); });
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

  // Google Analytics events (only run when analytics is switched on)
  var track = function (name, params) { if (window.gtag) window.gtag('event', name, params || {}); };
  document.querySelectorAll('a[href^="tel:"]').forEach(function (a) { a.addEventListener('click', function () { track('contact_click', { method: 'phone' }); }); });
  document.querySelectorAll('a[href^="mailto:"]').forEach(function (a) { a.addEventListener('click', function () { track('contact_click', { method: 'email' }); }); });
  var calcForm = document.getElementById('calc'), calcUsed = false;
  if (calcForm) calcForm.addEventListener('input', function () { if (!calcUsed) { calcUsed = true; track('calculator_use'); } });
})();
