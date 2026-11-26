/* Modelo Tático: revelar ao rolar, brilho que segue o dedo, barra de progresso e botão fixo no celular. */
(function () {
  var els = document.querySelectorAll('.reveal,.head');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) {
          var t = e.target; t.classList.add('in');
          t.querySelectorAll('.wipe').forEach(function (w, i) { w.style.transitionDelay = (i * 0.15) + 's'; w.classList.add('in'); });
          io.unobserve(t);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    els.forEach(function (el) {
      var sib = el.parentElement.querySelectorAll(':scope>.reveal');
      var i = Array.prototype.indexOf.call(sib, el); if (i > 0) el.style.setProperty('--d', (i * 0.11) + 's');
      io.observe(el);
    });
  } else {
    document.querySelectorAll('.reveal,.wipe').forEach(function (el) { el.classList.add('in'); });
  }
  if (document.body.classList.contains('embed')) document.querySelectorAll('.reveal,.wipe,.head').forEach(function (el) { el.classList.add('in'); });

  document.querySelectorAll('.card').forEach(function (c) {
    c.addEventListener('pointermove', function (ev) {
      var r = c.getBoundingClientRect();
      c.style.setProperty('--mx', (ev.clientX - r.left) + 'px'); c.style.setProperty('--my', (ev.clientY - r.top) + 'px');
    }, { passive: true });
  });

  var bar = document.querySelector('.progress'), s = document.querySelector('.sticky'),
    hb = document.querySelector('.hero .btn'), cta = document.querySelector('.cta'), tick = false;
  function upd() {
    var h = document.documentElement, max = h.scrollHeight - h.clientHeight;
    if (bar) bar.style.transform = 'scaleX(' + (max > 0 ? h.scrollTop / max : 0) + ')';
    if (s && hb && cta) {
      var a = hb.getBoundingClientRect(), b = cta.getBoundingClientRect(), vh = innerHeight;
      s.classList.toggle('show', a.bottom < 0 && !(b.top < vh && b.bottom > 0));
    }
    tick = false;
  }
  addEventListener('scroll', function () { if (!tick) { tick = true; requestAnimationFrame(upd); } }, { passive: true });
  upd();
})();
