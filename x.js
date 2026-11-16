/* Лекало VS-37: надстройка. Меню, живая квитанция, 3D-карусель, волна на кнопках. */

/* меню: бургер на телефоне, подсветка текущего раздела */
(function () {
  var bar = document.querySelector('.bar'), burger = document.querySelector('.x-burger');
  if (bar && burger) {
    burger.addEventListener('click', function () { var o = bar.classList.toggle('is-open'); burger.setAttribute('aria-expanded', o ? 'true' : 'false'); });
    [].forEach.call(bar.querySelectorAll('.x-nav a'), function (a) { a.addEventListener('click', function () { bar.classList.remove('is-open'); burger.setAttribute('aria-expanded', 'false'); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { bar.classList.remove('is-open'); burger.setAttribute('aria-expanded', 'false'); } });
  }
  var links = [].slice.call(document.querySelectorAll('.x-nav a'));
  var map = links.map(function (a) { return { a: a, el: document.querySelector(a.getAttribute('href')) }; }).filter(function (m) { return m.el; });
  var tick = false;
  function frame() {
    tick = false;
    var y = window.scrollY, probe = y + innerHeight * 0.4, cur = null;
    map.forEach(function (m) { if (m.el.getBoundingClientRect().top + y <= probe) cur = m; });
    map.forEach(function (m) { m.a.classList.toggle('is-on', m === cur); });
  }
  addEventListener('scroll', function () { if (!tick) { tick = true; requestAnimationFrame(frame); } }, { passive: true });
  addEventListener('resize', frame); frame();

  /* волна на кнопках */
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.v-btn'); if (!b) return;
    var r = b.getBoundingClientRect(), s = Math.max(r.width, r.height), x = document.createElement('span');
    x.className = 'x-ripple'; x.style.cssText = 'width:' + s + 'px;height:' + s + 'px;left:' + (e.clientX - r.left - s / 2) + 'px;top:' + (e.clientY - r.top - s / 2) + 'px';
    b.appendChild(x); setTimeout(function () { x.remove(); }, 700);
  });
})();
/* «Стопка кадров»: верхний кадр можно смахнуть (тяга и бросок с инерцией), он улетает и уходит в низ стопки; сам листается раз в 4 секунды */
(function () {
  var root = document.querySelector('[data-x-deck]'); if (!root) return;
  var stack = root.querySelector('.deck__stack'), cards = [].slice.call(stack.querySelectorAll('.deck__card')), n = cards.length;
  var titleEl = root.querySelector('[data-deck-title]'), subEl = root.querySelector('[data-deck-sub]'), countEl = root.querySelector('.deck__count');
  var still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var order = cards.slice(), rots = [0, -3.2, 2.6, -2], busy = false, drag = null, visible = false, hover = false, timer = null, dirAuto = 1, idxNow = 0;
  stack.setAttribute('tabindex', '0'); stack.setAttribute('role', 'group'); stack.setAttribute('aria-label', 'Стопка кадров занятий, стрелки влево и вправо листают');
  function put(c, d) {
    var k = Math.min(d, 3);
    c.style.zIndex = String(n - d);
    c.style.opacity = d > 3 ? '0' : '1';
    c.style.filter = d === 0 ? 'none' : 'brightness(' + (1 - d * .06) + ')';
    c.style.transform = 'translate(' + (k * 0) + 'px,' + (k * 16) + 'px) scale(' + (1 - k * .055) + ') rotate(' + rots[k] + 'deg)';
    c.setAttribute('aria-hidden', d === 0 ? 'false' : 'true');
  }
  function layout() {
    order.forEach(function (c, d) { put(c, d); });
    var top = order[0], cap = top.querySelector('figcaption');
    if (titleEl && cap) titleEl.textContent = cap.textContent; if (subEl) subEl.textContent = top.getAttribute('data-sub') || '';
    idxNow = cards.indexOf(top); if (countEl) countEl.textContent = (idxNow + 1) + ' / ' + n;
  }
  function fling(dir, vx, vy, fromX, fromY) {
    if (busy) return; busy = true;
    var c = order[0], w = Math.min(innerWidth, 900);
    var tx = (fromX || 0) + dir * w * .7 + (vx || 0) * 260, ty = (fromY || 0) + (vy || 0) * 200 - 30, rot = dir * (26 + Math.min(Math.abs(vx || 0) * 14, 22));
    c.classList.add('is-held'); c.style.transition = 'none';
    var anim = c.animate([
      { transform: 'translate(' + (fromX || 0) + 'px,' + (fromY || 0) + 'px) rotate(' + ((fromX || 0) / 14) + 'deg)', opacity: 1 },
      { transform: 'translate(' + tx + 'px,' + ty + 'px) rotate(' + rot + 'deg)', opacity: 0 }
    ], { duration: still ? 200 : 620, easing: 'cubic-bezier(.12,.7,.25,1)', fill: 'forwards' });
    anim.onfinish = function () {
      anim.cancel(); order.push(order.shift());
      c.classList.remove('is-held'); c.style.transition = 'none'; put(c, n - 1);
      void c.offsetWidth; c.style.transition = '';
      layout(); busy = false;
    };
  }
  stack.addEventListener('pointerdown', function (e) {
    if (busy) return; var c = order[0]; c.classList.add('is-held'); c.style.transition = 'none';
    drag = { id: e.pointerId, x0: e.clientX, y0: e.clientY, x: 0, y: 0, t: performance.now(), vx: 0, vy: 0, px: e.clientX, py: e.clientY, moved: false };
    try { stack.setPointerCapture(e.pointerId); } catch (x) {} stop();
  });
  stack.addEventListener('pointermove', function (e) {
    if (!drag || e.pointerId !== drag.id) return;
    var now = performance.now(), dt = Math.max(now - drag.t, 1);
    drag.x = e.clientX - drag.x0; drag.y = (e.clientY - drag.y0) * .5;
    drag.vx = .8 * drag.vx + .2 * ((e.clientX - drag.px) / dt * 16); drag.vy = .8 * drag.vy + .2 * ((e.clientY - drag.py) / dt * 16);
    drag.px = e.clientX; drag.py = e.clientY; drag.t = now;
    if (Math.abs(drag.x) > 6) drag.moved = true;
    order[0].style.transform = 'translate(' + drag.x + 'px,' + drag.y + 'px) rotate(' + (drag.x / 14) + 'deg)';
    var p = Math.min(Math.abs(drag.x) / 160, 1);
    if (order[1]) order[1].style.transform = 'translate(0,' + (16 - 16 * p) + 'px) scale(' + (.945 + .055 * p) + ') rotate(' + (rots[1] * (1 - p)) + 'deg)';
  });
  function release(e) {
    if (!drag || (e && e.pointerId !== drag.id)) return;
    var d = drag; drag = null; var c = order[0];
    if (!d.moved) { c.classList.remove('is-held'); c.style.transition = ''; fling(1, 0, 0, 0, 0); restart(); return; }
    if (Math.abs(d.x) > 90 || Math.abs(d.vx) > 7) fling(Math.abs(d.x) > 90 ? (d.x > 0 ? 1 : -1) : (d.vx > 0 ? 1 : -1), d.vx / 16, d.vy / 16, d.x, d.y);
    else { c.classList.remove('is-held'); c.style.transition = ''; layout(); }
    restart();
  }
  stack.addEventListener('pointerup', release); stack.addEventListener('pointercancel', release);
  stack.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') { fling(1); stop(); restart(); e.preventDefault(); } if (e.key === 'ArrowLeft') { fling(-1); stop(); restart(); e.preventDefault(); } });
  var btn = root.querySelector('[data-deck-next]'); if (btn) btn.addEventListener('click', function () { fling(1); stop(); restart(); });
  stack.addEventListener('mouseenter', function () { hover = true; stop(); }); stack.addEventListener('mouseleave', function () { hover = false; restart(); });
  function stop() { if (timer) { clearInterval(timer); timer = null; } }
  function restart() { stop(); if (still || hover || !visible) return; timer = setInterval(function () { if (!drag && !busy) { fling(dirAuto); dirAuto = -dirAuto; } }, 4200); }
  if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; restart(); }, { threshold: .4 }).observe(stack); else visible = true;
  layout();
})();