/* Baner zgód cookies: wybór zapisany na 12 miesięcy; przy "Tylko niezbędne" mapa Google zastąpiona adresem i linkiem do trasy */
(function () {
  'use strict';
  var KEY = 'ck-zgoda', ROK = 365 * 864e5, ck = document.getElementById('ck');
  function czytaj() {
    try { var z = JSON.parse(localStorage.getItem(KEY)); if (z && z.t && Date.now() - z.t < ROK) return z; } catch (e) {}
    return null;
  }
  function zapisz(z) { z.t = Date.now(); try { localStorage.setItem(KEY, JSON.stringify(z)); } catch (e) {} }
  function mapy(on) {
    Array.prototype.forEach.call(document.querySelectorAll('[data-gmapa]'), function (m) {
      var f = m.querySelector('iframe'), zs = m.querySelector('.mapa-zast');
      if (!f) return;
      if (!f.getAttribute('data-src')) f.setAttribute('data-src', f.getAttribute('src'));
      if (on) { if (f.getAttribute('src') !== f.getAttribute('data-src')) f.setAttribute('src', f.getAttribute('data-src')); f.hidden = false; if (zs) zs.hidden = true; }
      else { f.setAttribute('src', 'about:blank'); f.hidden = true; if (zs) zs.hidden = false; }
    });
  }
  function pokaz(ust) {
    if (!ck) return;
    var z = czytaj(), cb = ck.querySelector('[data-ck-kat="mapy"]'), u = ck.querySelector('.ck-ust'), b = ck.querySelector('.ck-ustaw');
    if (cb) cb.checked = z ? !!z.mapy : true;
    if (u) u.hidden = !ust;
    if (b) b.textContent = ust ? 'Zapisz wybór' : 'Ustawienia';
    ck.setAttribute('data-ust', ust ? '1' : '');
    ck.hidden = false;
    document.body.classList.add('ck-widac');
  }
  function ukryj() { ck.hidden = true; document.body.classList.remove('ck-widac'); }
  if (ck) ck.addEventListener('click', function (e) {
    var b = e.target.closest('[data-ck]'); if (!b) return;
    var k = b.getAttribute('data-ck'), z;
    if (k === 'ustawienia') {
      if (!ck.getAttribute('data-ust')) { pokaz(true); return; }
      var cb = ck.querySelector('[data-ck-kat="mapy"]'); z = { mapy: cb ? cb.checked : false };
    } else z = { mapy: k === 'wszystkie' };
    zapisz(z); mapy(z.mapy); ukryj();
  });
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-ck-otworz]'); if (b) { e.preventDefault(); pokaz(true); }
  });
  var z = czytaj();
  if (z) mapy(z.mapy); else pokaz(false);
})();
