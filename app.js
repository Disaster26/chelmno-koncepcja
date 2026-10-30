(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- menu ---------- */
  var burger = $('#burger'), menu = $('#menu');
  burger.addEventListener('click', function () {
    var o = menu.classList.toggle('otwarte');
    burger.setAttribute('aria-expanded', o ? 'true' : 'false');
  });
  $$('#menu a').forEach(function (a) { a.addEventListener('click', function () { menu.classList.remove('otwarte'); burger.setAttribute('aria-expanded', 'false'); }); });

  /* ---------- pasek dolny: dopiero po przewinieciu za CTA, chowany przy rezerwacji ---------- */
  var mob = $('#mob'), poCta = false, wRez = false;
  function pasek() { mob.classList.toggle('widac', poCta && !wRez); }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (e) { poCta = !e[0].isIntersecting && e[0].boundingClientRect.top < 0; pasek(); }).observe($('#heroCta'));
    new IntersectionObserver(function (e) { wRez = e[0].isIntersecting; pasek(); }, { rootMargin: '0px 0px -30% 0px' }).observe($('#rezerwacja'));
  }

  /* ---------- dane z obecnego cennika ---------- */
  var APT = {
    lawendowy: { nazwa: 'Lawendowy', min: 1, max: 3, ceny: { 1: 140, 2: 165, 3: 200 }, lozeczko: false },
    cappuccino: { nazwa: 'Cappuccino', min: 2, max: 4, ceny: { 2: 180, 3: 200, 4: 220 }, lozeczko: true },
    blekitny: { nazwa: 'Błękitny', min: 2, max: 5, ceny: { 2: 180, 3: 200, 4: 220, 5: 240 }, lozeczko: true }
  };
  var PARKING = 6, LOZECZKO = 20;
  var MIES = ['styczeń', 'luty', 'marzec', 'kwiecień', 'maj', 'czerwiec', 'lipiec', 'sierpień', 'wrzesień', 'październik', 'listopad', 'grudzień'];
  var MIES_D = ['stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca', 'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia'];
  var DNI_T = ['nd', 'pn', 'wt', 'śr', 'cz', 'pt', 'sb'];

  function d0(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
  function dodaj(d, n) { return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n); }
  function klucz(d) { return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate(); }
  function roznica(a, b) { return Math.round((d0(b) - d0(a)) / 864e5); }
  function fmt(d) { return DNI_T[d.getDay()] + ', ' + d.getDate() + ' ' + MIES_D[d.getMonth()]; }
  function zl(n) { return n.toLocaleString('pl-PL') + ' zł'; }
  function noce(n) { return n === 1 ? 'noc' : (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) ? 'noce' : 'nocy'; }

  var dzis = d0(new Date());

  /* przykladowe zajete noce (demonstracja) - stale, pseudolosowe bloki dla kazdego apartamentu */
  function zajete(id) {
    var s = { lawendowy: 7, cappuccino: 19, blekitny: 31 }[id], set = {};
    function rnd() { s = (s * 9301 + 49297) % 233280; return s / 233280; }
    var d = dodaj(dzis, Math.floor(rnd() * 3));
    var koniec = dodaj(dzis, 400);
    while (d < koniec) {
      var dl = 1 + Math.floor(rnd() * 4);
      for (var i = 0; i < dl; i++) set[klucz(dodaj(d, i))] = 1;
      d = dodaj(d, dl + 2 + Math.floor(rnd() * 7));
    }
    return set;
  }
  var ZAJ = {}; Object.keys(APT).forEach(function (k) { ZAJ[k] = zajete(k); });

  /* ---------- stan ---------- */
  var zostalo = new Date(dzis.getFullYear(), dzis.getMonth() + 1, 0).getDate() - dzis.getDate();
  var st = { apt: 'lawendowy', od: null, do_: null, goscie: 2, male: 0, widok: new Date(dzis.getFullYear(), dzis.getMonth() + (zostalo < 10 ? 1 : 0), 1) };
  var kalMies = $('#kalMies'), podp = $('#kalPodp');
  var maxWidok = new Date(dzis.getFullYear(), dzis.getMonth() + 12, 1);

  function ileMies() { return window.matchMedia('(max-width:760px)').matches ? 1 : 2; }
  function wolneNoce(a, b) {
    for (var d = a; d < b; d = dodaj(d, 1)) if (ZAJ[st.apt][klucz(d)]) return false;
    return true;
  }

  function rysuj() {
    var n = ileMies(), html = '';
    for (var m = 0; m < n; m++) {
      var pm = new Date(st.widok.getFullYear(), st.widok.getMonth() + m, 1);
      html += '<div class="mies"><h4>' + MIES[pm.getMonth()] + ' ' + pm.getFullYear() + '</h4><div class="tyg"><span>pn</span><span>wt</span><span>śr</span><span>cz</span><span>pt</span><span>sb</span><span>nd</span></div><div class="dni">';
      var off = (pm.getDay() + 6) % 7;
      for (var i = 0; i < off; i++) html += '<span></span>';
      var ile = new Date(pm.getFullYear(), pm.getMonth() + 1, 0).getDate();
      for (var dd = 1; dd <= ile; dd++) {
        var d = new Date(pm.getFullYear(), pm.getMonth(), dd), k = klucz(d), cl = ['dzien'], dis = false, opis = fmt(d);
        var zaj = !!ZAJ[st.apt][k];
        if (d < dzis) { cl.push('przesz'); dis = true; }
        else if (zaj) {
          cl.push('zaj'); opis += ' - zajęte';
          // dzien zajety moze byc dniem wyjazdu, jesli noce przed nim sa wolne
          if (st.od && !st.do_ && d > st.od && wolneNoce(st.od, d)) cl.push('wyjazd-ok'); else dis = true;
        }
        if (+d === +dzis) cl.push('dzis');
        if (st.od && +d === +st.od) cl.push('start');
        if (st.do_ && +d === +st.do_) cl.push('koniec');
        if (st.od && st.do_ && d > st.od && d < st.do_) cl.push('zakres');
        html += '<button type="button" class="' + cl.join(' ') + '" data-k="' + k + '"' + (dis ? ' disabled' : '') + ' aria-label="' + opis + '">' + dd + '</button>';
      }
      html += '</div></div>';
    }
    kalMies.innerHTML = html;
    $('#kalPrev').disabled = st.widok <= new Date(dzis.getFullYear(), dzis.getMonth(), 1);
    $('#kalNext').disabled = new Date(st.widok.getFullYear(), st.widok.getMonth() + n, 1) > maxWidok;
    podp.textContent = !st.od ? 'Wybierz dzień przyjazdu' : !st.do_ ? 'Teraz wybierz dzień wyjazdu' : roznica(st.od, st.do_) + ' ' + noce(roznica(st.od, st.do_)) + ' · kliknij dzień, by zmienić';
    $('#dPrzyj').textContent = st.od ? fmt(st.od) : '-';
    $('#dWyj').textContent = st.do_ ? fmt(st.do_) : '-';
    licz();
  }

  kalMies.addEventListener('click', function (e) {
    var b = e.target.closest('.dzien'); if (!b || b.disabled) return;
    var k = +b.dataset.k, d = new Date(Math.floor(k / 10000), Math.floor(k / 100) % 100 - 1, k % 100);
    $('#blad').textContent = '';
    if (!st.od || st.do_ || d <= st.od) {
      if (ZAJ[st.apt][k]) return;
      st.od = d; st.do_ = null;
    } else if (wolneNoce(st.od, d)) {
      st.do_ = d;
    } else {
      if (ZAJ[st.apt][k]) return;
      st.od = d; st.do_ = null;
      $('#blad').textContent = 'W tym zakresie jest zajęty termin - wybierz inny dzień przyjazdu.';
    }
    rysuj();
  });
  $('#kalPrev').addEventListener('click', function () { st.widok = new Date(st.widok.getFullYear(), st.widok.getMonth() - 1, 1); rysuj(); });
  $('#kalNext').addEventListener('click', function () { st.widok = new Date(st.widok.getFullYear(), st.widok.getMonth() + 1, 1); rysuj(); });

  /* przesuwanie miesiecy palcem */
  var tx = null, ty = null;
  kalMies.addEventListener('touchstart', function (e) { tx = e.touches[0].clientX; ty = e.touches[0].clientY; }, { passive: true });
  kalMies.addEventListener('touchend', function (e) {
    if (tx === null) return;
    var dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty; tx = null;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) { var b = dx < 0 ? $('#kalNext') : $('#kalPrev'); if (!b.disabled) b.click(); }
  }, { passive: true });

  /* ---------- wybor apartamentu ---------- */
  function ustawApt(id) {
    st.apt = id;
    $$('#wyborApt button').forEach(function (b) { b.setAttribute('aria-checked', b.dataset.apt === id ? 'true' : 'false'); });
    var a = APT[id];
    st.goscie = Math.min(Math.max(st.goscie, a.min), a.max);
    if (st.od && (ZAJ[id][klucz(st.od)] || (st.do_ && !wolneNoce(st.od, st.do_)))) {
      st.od = st.do_ = null;
      $('#blad').textContent = 'Wybrane daty są zajęte w tym apartamencie - wybierz nowe.';
    } else $('#blad').textContent = '';
    $('#lozWiersz').classList.toggle('wyl', !a.lozeczko);
    if (!a.lozeczko) $('#lozeczko').checked = false;
    rysuj();
  }
  $$('#wyborApt button').forEach(function (b) { b.addEventListener('click', function () { ustawApt(b.dataset.apt); }); });
  $$('a[data-apt]').forEach(function (a) { a.addEventListener('click', function () { ustawApt(a.dataset.apt); }); });

  /* ---------- goscie ---------- */
  $$('.stepper button').forEach(function (b) {
    b.addEventListener('click', function () {
      var a = APT[st.apt], c = b.dataset.cel, k = +b.dataset.krok;
      if (c === 'goscie') st.goscie = Math.min(Math.max(st.goscie + k, a.min), a.max);
      else st.male = Math.min(Math.max(st.male + k, 0), 2);
      licz();
    });
  });
  $('#parking').addEventListener('change', licz);
  $('#lozeczko').addEventListener('change', licz);

  function licz() {
    var a = APT[st.apt];
    $('#goscie').textContent = st.goscie; $('#male').textContent = st.male;
    $('[data-cel=goscie][data-krok="-1"]').disabled = st.goscie <= a.min;
    $('[data-cel=goscie][data-krok="1"]').disabled = st.goscie >= a.max;
    $('[data-cel=male][data-krok="-1"]').disabled = st.male <= 0;
    $('[data-cel=male][data-krok="1"]').disabled = st.male >= 2;
    var s = $('#suma');
    if (!st.od || !st.do_) { s.innerHTML = '<p class="suma-pusta">' + (st.od ? 'Wybierz w kalendarzu dzień wyjazdu.' : 'Zaznacz w kalendarzu przyjazd i wyjazd, a policzymy cenę pobytu.') + '</p>'; return; }
    var n = roznica(st.od, st.do_), cena = a.ceny[st.goscie], noc = n * cena, h = '<dl>';
    h += '<dt>' + a.nazwa + ', ' + st.goscie + ' ' + (st.goscie === 1 ? 'osoba' : st.goscie < 5 ? 'osoby' : 'osób') + ': ' + n + ' ' + noce(n) + ' × ' + zl(cena) + '</dt><dd>' + zl(noc) + '</dd>';
    var razem = noc;
    if ($('#parking').checked) { h += '<dt>Parking: ' + n + ' × ' + zl(PARKING) + '</dt><dd>' + zl(n * PARKING) + '</dd>'; razem += n * PARKING; }
    if ($('#lozeczko').checked && a.lozeczko) { h += '<dt>Łóżeczko dziecięce</dt><dd>' + zl(LOZECZKO) + '</dd>'; razem += LOZECZKO; }
    if (st.male) h += '<dt>Dzieci do lat 4 (' + st.male + ')</dt><dd>bezpłatnie</dd>';
    h += '<dt class="razem">Razem za pobyt</dt><dd class="razem">' + zl(razem) + '</dd>';
    if (n >= 7) h += '<p class="uwaga">Przy dłuższych pobytach cenę można negocjować - napiszemy w odpowiedzi.</p>';
    s.innerHTML = h + '</dl>';
    st.razem = razem;
  }

  /* ---------- wyslanie prosby (wersja pokazowa: tylko komunikat) ---------- */
  $('#rezForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var bl = $('#blad'), imie = $('#fImie').value.trim(), tel = $('#fTel').value.trim();
    if (!st.od || !st.do_) { bl.textContent = 'Wybierz w kalendarzu daty przyjazdu i wyjazdu.'; $('#kal').scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
    if (!imie || tel.replace(/\D/g, '').length < 9) { bl.textContent = 'Podaj imię i nazwisko oraz numer telefonu, żebyśmy mogli potwierdzić rezerwację.'; (imie ? $('#fTel') : $('#fImie')).focus(); return; }
    bl.textContent = '';
    var a = APT[st.apt], n = roznica(st.od, st.do_), p = $('#potw');
    p.innerHTML = '<h4>Dziękujemy, ' + imie.split(' ')[0].replace(/[<>&"]/g, '') + '!</h4><p>Prośba o rezerwację apartamentu <b>' + a.nazwa + '</b> od ' + fmt(st.od) + ' do ' + fmt(st.do_) + ' (' + n + ' ' + noce(n) + ', ' + zl(st.razem) + ') trafi do recepcji. Termin zostanie wstępnie zablokowany, a potwierdzenie przyjdzie SMS-em lub e-mailem.</p><p>To wersja pokazowa - w tej chwili nic nie zostało wysłane.</p>';
    p.hidden = false;
    p.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });

  var bylo = ileMies();
  window.addEventListener('resize', function () { var t = ileMies(); if (t !== bylo) { bylo = t; rysuj(); } });
  ustawApt('lawendowy');

  /* ---------- galeria ---------- */
  var zdj = $$('#gal img'), lb = $('#lb'), lbImg = $('#lbImg'), ix = 0;
  function pokaz(i) { ix = (i + zdj.length) % zdj.length; lbImg.src = zdj[ix].src; lbImg.alt = zdj[ix].alt; }
  zdj.forEach(function (im, i) { im.parentNode.addEventListener('click', function () { pokaz(i); lb.hidden = false; document.body.style.overflow = 'hidden'; $('#lbX').focus(); }); });
  function zamknij() { lb.hidden = true; document.body.style.overflow = ''; }
  $('#lbX').addEventListener('click', zamknij);
  $('#lbP').addEventListener('click', function () { pokaz(ix - 1); });
  $('#lbN').addEventListener('click', function () { pokaz(ix + 1); });
  lb.addEventListener('click', function (e) { if (e.target === lb) zamknij(); });
  document.addEventListener('keydown', function (e) {
    if (lb.hidden) return;
    if (e.key === 'Escape') zamknij(); else if (e.key === 'ArrowLeft') pokaz(ix - 1); else if (e.key === 'ArrowRight') pokaz(ix + 1);
  });
  var lx = null;
  lb.addEventListener('touchstart', function (e) { lx = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', function (e) { if (lx === null) return; var dx = e.changedTouches[0].clientX - lx; lx = null; if (Math.abs(dx) > 50) pokaz(ix + (dx < 0 ? 1 : -1)); }, { passive: true });
})();
