/* Apartamenty w sercu Chełmna - skrypt strony (bez bibliotek, bez śledzenia) */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* nagłówek: cień po przewinięciu */
  var top = $('.top');
  function cien() { if (top) top.classList.toggle('cien', window.scrollY > 4); }
  cien(); window.addEventListener('scroll', cien, { passive: true });

  /* menu mobilne */
  var burger = $('#burger'), menu = $('#menu');
  function zamknijMenu() {
    if (!menu) return;
    menu.classList.remove('otw'); burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Otwórz menu'); document.documentElement.style.overflow = '';
  }
  if (burger && menu) {
    burger.addEventListener('click', function () {
      var o = !menu.classList.contains('otw');
      menu.classList.toggle('otw', o); burger.setAttribute('aria-expanded', String(o));
      burger.setAttribute('aria-label', o ? 'Zamknij menu' : 'Otwórz menu');
      document.documentElement.style.overflow = o ? 'hidden' : '';
    });
    $$('a', menu).forEach(function (a) { a.addEventListener('click', zamknijMenu); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && menu.classList.contains('otw')) { zamknijMenu(); burger.focus(); } });
    window.addEventListener('resize', function () { if (window.innerWidth > 900) zamknijMenu(); });
  }

  /* przycisk w nagłówku i pasek na telefonie - dopiero po minięciu głównego przycisku */
  var cta = $('[data-glowne-cta]'), topCta = $('.top-cta'), mob = $('#mob');
  if (mob) document.body.classList.add('ma-mob');
  function pokazPasek(w) {
    if (mob) mob.classList.toggle('widac', w);
    if (topCta) topCta.classList.toggle('ukryj', !w);
  }
  if (cta && 'IntersectionObserver' in window) {
    if (topCta) topCta.classList.add('ukryj');
    new IntersectionObserver(function (en) {
      var e = en[0]; pokazPasek(!e.isIntersecting && e.boundingClientRect.top < 0);
    }, { threshold: 0 }).observe(cta);
  } else if (mob) {
    var pr = function () { mob.classList.toggle('widac', window.scrollY > 420); };
    pr(); window.addEventListener('scroll', pr, { passive: true });
  }
  /* na stronie kontaktu pasek chowa się przy formularzu */
  var form = $('#zapytanie');
  if (form && mob && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (en) { mob.style.visibility = en[0].isIntersecting ? 'hidden' : ''; }, { threshold: 0.05 }).observe(form);
  }

  /* galeria w okienku */
  var lb = $('#lb');
  if (lb) {
    var lbImg = $('img', lb), lbCap = $('figcaption', lb), lbLicz = $('.lb-l', lb), grupa = [], idx = 0, ostatni = null;
    function pokaz(i) {
      idx = (i + grupa.length) % grupa.length;
      var b = grupa[idx];
      lbImg.src = b.getAttribute('data-duze'); lbImg.alt = b.getAttribute('data-opis') || '';
      lbCap.textContent = b.getAttribute('data-opis') || '';
      lbLicz.textContent = (idx + 1) + ' / ' + grupa.length;
      var nast = grupa[(idx + 1) % grupa.length]; if (nast) { var im = new Image(); im.src = nast.getAttribute('data-duze'); }
    }
    function otworz(b) {
      var g = b.getAttribute('data-grupa');
      grupa = $$('[data-grupa="' + g + '"]'); ostatni = b;
      pokaz(grupa.indexOf(b));
      lb.hidden = false; requestAnimationFrame(function () { lb.classList.add('otw'); });
      document.documentElement.style.overflow = 'hidden'; $('.lb-x', lb).focus();
    }
    function zamknij() {
      lb.classList.remove('otw'); document.documentElement.style.overflow = '';
      setTimeout(function () { lb.hidden = true; }, 230); if (ostatni) ostatni.focus();
    }
    $$('[data-grupa]').forEach(function (b) { b.addEventListener('click', function () { otworz(b); }); });
    $$('[data-otworz]').forEach(function (b) { b.addEventListener('click', function () { var f = $('[data-grupa="' + b.getAttribute('data-otworz') + '"]'); if (f) otworz(f); }); });
    $('.lb-x', lb).addEventListener('click', zamknij);
    $('.lb-p', lb).addEventListener('click', function () { pokaz(idx - 1); });
    $('.lb-n', lb).addEventListener('click', function () { pokaz(idx + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb || e.target.tagName === 'FIGURE') zamknij(); });
    document.addEventListener('keydown', function (e) {
      if (lb.hidden) return;
      if (e.key === 'Escape') zamknij();
      else if (e.key === 'ArrowLeft') pokaz(idx - 1);
      else if (e.key === 'ArrowRight') pokaz(idx + 1);
      else if (e.key === 'Tab') {
        var f = $$('button', lb), p = f[0], o = f[f.length - 1];
        if (e.shiftKey && document.activeElement === p) { e.preventDefault(); o.focus(); }
        else if (!e.shiftKey && document.activeElement === o) { e.preventDefault(); p.focus(); }
      }
    });
    var x0 = null;
    lb.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', function (e) {
      if (x0 === null) return; var dx = e.changedTouches[0].clientX - x0; x0 = null;
      if (Math.abs(dx) > 45) pokaz(idx + (dx < 0 ? 1 : -1));
    });
  }

  /* mapa: wczytuje się dopiero po kliknięciu (bez połączeń z zewnętrznymi serwerami wcześniej) */
  $$('[data-mapa]').forEach(function (m) {
    var b = $('button', m);
    if (b) b.addEventListener('click', function () {
      var f = document.createElement('iframe');
      f.src = m.getAttribute('data-mapa'); f.title = m.getAttribute('data-tytul') || 'Mapa'; f.loading = 'lazy';
      m.innerHTML = ''; m.appendChild(f);
    });
  });

  /* formularz zapytania */
  if (form) {
    var DANE = JSON.parse($('#dane-cen').textContent);
    var przyj = $('#przyjazd', form), wyj = $('#wyjazd', form), dor = $('#dorosli', form), dz = $('#dzieci', form), dzm = $('#dzieci-male', form);
    var szac = $('#szac'), blad = $('#blad'), potw = $('#potw');
    var dzis = new Date(); dzis.setMinutes(dzis.getMinutes() - dzis.getTimezoneOffset());
    var iso = function (d) { return d.toISOString().slice(0, 10); };
    przyj.min = iso(dzis); wyj.min = iso(dzis);

    /* apartament z adresu: /kontakt/?apartament=lawendowy */
    try {
      var q = new URLSearchParams(location.search).get('apartament');
      if (q) { var r = form.querySelector('input[name="apartament"][value="' + q + '"]'); if (r) r.checked = true; }
    } catch (e) {}

    function apt() { var r = form.querySelector('input[name="apartament"]:checked'); return r ? r.value : ''; }
    function noce() {
      if (!przyj.value || !wyj.value) return 0;
      var n = Math.round((new Date(wyj.value) - new Date(przyj.value)) / 864e5); return n > 0 ? n : 0;
    }
    function zl(n) { return n.toLocaleString('pl-PL') + ' zł'; }
    function odm(n, a, b, c) { return n === 1 ? a : (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) ? b : c; }
    function licz() {
      var a = apt(), n = noce(), osoby = (+dor.value || 0) + Math.max(0, (+dz.value || 0) - (+dzm.value || 0));
      blad.textContent = '';
      if (przyj.value) { var m = new Date(przyj.value); m.setDate(m.getDate() + 1); wyj.min = iso(m); }
      if (!a || a === 'dowolny' || !n || !osoby) { szac.innerHTML = ''; return; }
      var d = DANE[a], cena = d.ceny[String(Math.max(osoby, d.min))];
      if (osoby > d.max) {
        szac.innerHTML = 'Apartament ' + d.nazwa + ' mieści do ' + d.max + ' ' + odm(d.max, 'osoby', 'osób', 'osób') + '. Przy większej grupie zapytaj o dwa apartamenty albo wybierz Błękitny (do 5 osób).';
        return;
      }
      szac.innerHTML = 'Orientacyjnie: <b>' + n + ' ' + odm(n, 'doba', 'doby', 'dób') + ' × ' + zl(cena) + ' = ' + zl(n * cena) + '</b> za apartament (' + osoby + ' ' + odm(osoby, 'osoba', 'osoby', 'osób') + '). Ostateczną cenę i dostępność potwierdzimy w odpowiedzi.';
    }
    form.addEventListener('input', licz); form.addEventListener('change', licz); licz();

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      $$('.zle', form).forEach(function (x) { x.classList.remove('zle'); });
      var bl = [];
      function zle(el, t) { el.classList.add('zle'); bl.push(t); }
      if (!przyj.value) zle(przyj, 'podaj datę przyjazdu');
      if (!wyj.value) zle(wyj, 'podaj datę wyjazdu');
      if (przyj.value && wyj.value && noce() < 1) zle(wyj, 'wyjazd musi być po przyjeździe');
      if (!(+dor.value >= 1)) zle(dor, 'podaj liczbę dorosłych');
      var imie = $('#imie', form), tel = $('#tel', form), mail = $('#email', form), zg = $('#zgoda', form);
      if (!imie.value.trim()) zle(imie, 'podaj imię');
      if (!tel.value.trim() && !mail.value.trim()) { zle(tel, 'podaj telefon lub e-mail'); mail.classList.add('zle'); }
      if (mail.value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail.value.trim())) zle(mail, 'sprawdź adres e-mail');
      if (!zg.checked) bl.push('zaznacz zgodę na kontakt');
      if (bl.length) {
        blad.textContent = 'Uzupełnij, proszę: ' + bl.join(', ') + '.';
        var p = $('.zle', form); if (p) p.focus(); return;
      }
      var a = apt(), nazwa = a && DANE[a] ? 'Apartament ' + DANE[a].nazwa : 'apartament do wyboru';
      var fmt = function (v) { return new Date(v).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' }); };
      potw.hidden = false;
      potw.innerHTML = '<h3>Dziękujemy, zapytanie jest gotowe</h3><p>' + nazwa + ', ' + fmt(przyj.value) + ' - ' + fmt(wyj.value) + ' (' + noce() + ' ' + odm(noce(), 'doba', 'doby', 'dób') + '), ' + dor.value + ' ' + odm(+dor.value, 'osoba dorosła', 'osoby dorosłe', 'osób dorosłych') + (+dz.value ? ', dzieci: ' + dz.value : '') + '.</p><p>W wersji testowej formularz niczego nie wysyła. Po uruchomieniu strony zapytanie trafi na adres recepcji, a odpowiedź przyjdzie na podany telefon lub e-mail.</p>';
      potw.setAttribute('tabindex', '-1'); potw.focus();
    });
  }
})();
