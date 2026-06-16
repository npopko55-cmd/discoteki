/* =============================================================
   Шагательная Табата 2.0 — клиентский JS
   Без зависимостей. Запускается на DOMContentLoaded.
   ============================================================= */

(() => {
  'use strict';

  /* ---------- 0. Конфиг (правится для каждого запуска) ---------- */
  const CONFIG = {
    // Дата окончания таймера на центральном тарифе (UTC)
    countdownDeadline: '2026-06-30T23:59:59+03:00'
  };

  /* ---------- 1. Год в футере ---------- */
  const year = document.getElementById('footerYear');
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- 1b. Hero-видео: гарантированный авто-старт (muted loop, как гифка) ---------- */
  (() => {
    const v = document.querySelector('.hero__image-wrap video, video.hero__image');
    if (!v) return;
    v.muted = true; // браузеры пускают автоплей только для muted
    const tryPlay = () => { const pr = v.play(); if (pr && pr.catch) pr.catch(() => {}); };
    tryPlay();
    // Если автоплей заблокирован — стартуем при первом действии пользователя
    const evts = ['touchstart', 'scroll', 'click', 'keydown'];
    const kick = () => { tryPlay(); evts.forEach((e) => window.removeEventListener(e, kick)); };
    evts.forEach((e) => window.addEventListener(e, kick, { passive: true }));
    // Когда вкладка снова становится видимой — продолжаем
    document.addEventListener('visibilitychange', () => { if (!document.hidden) tryPlay(); });
  })();

  /* ---------- 2. Sticky header (тень при скролле) ---------- */
  const header = document.getElementById('header');
  const onScrollHeader = () => {
    if (!header) return;
    header.classList.toggle('is-scrolled', window.scrollY > 8);
  };
  window.addEventListener('scroll', onScrollHeader, { passive: true });
  onScrollHeader();

  /* ---------- 3. Burger / overlay-nav ---------- */
  const burger = document.getElementById('burgerBtn');
  const overlayNav = document.getElementById('overlayNav');
  const overlayBackdrop = document.getElementById('overlayBackdrop');
  const closeNavBtn = document.getElementById('closeNavBtn');

  const setNavState = (open) => {
    if (!overlayNav) return;
    overlayNav.classList.toggle('is-open', open);
    overlayNav.setAttribute('aria-hidden', String(!open));
    overlayBackdrop?.classList.toggle('is-open', open);
    burger?.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
  };

  burger?.addEventListener('click', () => setNavState(true));
  closeNavBtn?.addEventListener('click', () => setNavState(false));
  overlayBackdrop?.addEventListener('click', () => setNavState(false));

  // Закрывать при клике по ссылке внутри
  overlayNav?.querySelectorAll('a').forEach((a) => {
    a.addEventListener('click', () => setNavState(false));
  });

  /* ---------- 4. Универсальные попапы (по ID) с focus-trap ---------- */
  let lastFocusedBeforePopup = null;
  const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

  const trapFocus = (popup, e) => {
    const focusables = popup.querySelectorAll(FOCUSABLE);
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault(); last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first.focus();
    }
  };

  const openPopupById = (id) => {
    const popup = document.getElementById(id);
    if (!popup) return;
    lastFocusedBeforePopup = document.activeElement;
    popup.classList.add('is-open');
    popup.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    // Lazy-load iframe видео (Kinescope) при открытии
    popup.querySelectorAll('iframe[data-src]').forEach((iframe) => {
      if (iframe.src !== iframe.dataset.src) iframe.src = iframe.dataset.src;
    });
    // фокус на крестик закрытия
    const closeBtn = popup.querySelector('.popup__close');
    if (closeBtn) setTimeout(() => closeBtn.focus(), 50);
  };
  const closeAllPopups = () => {
    const wasOpen = document.querySelectorAll('.popup.is-open').length > 0;
    document.querySelectorAll('.popup.is-open').forEach((p) => {
      p.classList.remove('is-open');
      p.setAttribute('aria-hidden', 'true');
      // Останавливаем видео — сбрасываем iframe.src
      p.querySelectorAll('iframe[data-src]').forEach((iframe) => {
        iframe.src = 'about:blank';
      });
    });
    document.body.style.overflow = '';
    // вернуть фокус на то что было до открытия
    if (wasOpen && lastFocusedBeforePopup) {
      lastFocusedBeforePopup.focus();
      lastFocusedBeforePopup = null;
    }
  };

  // Любой элемент с data-popup="popup-id" открывает соответствующий попап.
  document.querySelectorAll('[data-popup]').forEach((trigger) => {
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      const id = trigger.getAttribute('data-popup') || 'popup-installment';
      openPopupById(id);
    });
  });
  document.querySelectorAll('.popup [data-close]').forEach((el) => {
    el.addEventListener('click', closeAllPopups);
  });
  // Клик по затемнённому фону попапа = закрытие
  document.querySelectorAll('.popup').forEach((popup) => {
    popup.addEventListener('click', (e) => {
      if (e.target === popup) closeAllPopups();
    });
  });

  /* ---------- Countdown — дни до старта 22 июня 2026 ---------- */
  const daysEl = document.getElementById('daysToStart');
  if (daysEl) {
    const target = new Date('2026-06-22T00:00:00+03:00').getTime();
    const ms = target - Date.now();
    const days = Math.max(0, Math.ceil(ms / 86400000));
    daysEl.textContent = days;
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeAllPopups();
      setNavState(false);
      return;
    }
    if (e.key === 'Tab') {
      const openPopup = document.querySelector('.popup.is-open .popup__box');
      if (openPopup) trapFocus(openPopup, e);
    }
  });

  /* ---------- 5. Reviews slider (стрелки) ---------- */
  const track = document.getElementById('reviewsTrack');
  const prevBtn = document.getElementById('reviewsPrev');
  const nextBtn = document.getElementById('reviewsNext');
  const scrollByCard = (dir) => {
    if (!track) return;
    const card = track.querySelector('.review-card');
    const step = (card?.offsetWidth || 300) + 16;
    track.scrollBy({ left: step * dir, behavior: 'smooth' });
  };
  prevBtn?.addEventListener('click', () => scrollByCard(-1));
  nextBtn?.addEventListener('click', () => scrollByCard(1));

  /* Countdown удалён по запросу — таймер на тарифе больше не используется. */

  /* ---------- 7. Back to top ---------- */
  const btt = document.getElementById('backToTop');
  const onScrollBTT = () => {
    btt?.classList.toggle('is-visible', window.scrollY > 600);
  };
  window.addEventListener('scroll', onScrollBTT, { passive: true });
  btt?.addEventListener('click', () =>
    window.scrollTo({ top: 0, behavior: 'smooth' })
  );

  /* ---------- 7b. Sticky mobile CTA ---------- */
  const stickyCTA = document.getElementById('stickyCTA');
  const ratesSection = document.getElementById('rates');
  const isMobile = () => window.matchMedia('(max-width: 768px)').matches;
  const onScrollSticky = () => {
    if (!stickyCTA) return;
    if (!isMobile()) {
      stickyCTA.classList.remove('is-visible');
      return;
    }
    // Показываем после прокрутки за первый экран
    const showAfter = window.innerHeight * 0.6;
    // Скрываем, когда юзер находится прямо на блоке прайса
    let nearRates = false;
    if (ratesSection) {
      const r = ratesSection.getBoundingClientRect();
      nearRates = r.top < window.innerHeight * 0.6 && r.bottom > 0;
    }
    stickyCTA.classList.toggle('is-visible', window.scrollY > showAfter && !nearRates);
  };
  window.addEventListener('scroll', onScrollSticky, { passive: true });
  window.addEventListener('resize', onScrollSticky);
  onScrollSticky();

  /* ---------- 8. Smooth anchor scroll (с учётом sticky header) ---------- */
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    const href = link.getAttribute('href');
    if (!href || href === '#' || href.startsWith('#popup')) return;
    link.addEventListener('click', (e) => {
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      const offset = (header?.offsetHeight || 0) + 8;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });

  /* ---------- 9. UTM-проброс: ссылки + ФОРМЫ GetCourse ---------- */
  /* Метки нужно донести до оплаты в GetCourse. Виджет GetCourse рендерит
     не <a>, а ФОРМУ, которая сабмитом уходит на новую страницу
     my.walk-walk.ru — поэтому раньше метки терялись (проброс был только
     для ссылок). Покрываем 4 канала:
       1) <a> на walk-walk.ru — добавляем UTM в href
       2) <form> — добавляем UTM в action И скрытыми полями (GetCourse читает их в заказ)
       3) MutationObserver — догоняем элементы, которые виджет вставляет позже
       4) click / submit (capture) — финальная страховка перед навигацией
     Метки также кладём в sessionStorage и восстанавливаем при переходах
     внутри сайта без меток в URL. */
  (function () {
    var keys = ['utm_source','utm_medium','utm_campaign','utm_content','utm_term','utm_referrer','gclid','yclid','fbclid','erid','from'];
    var p = new URLSearchParams(window.location.search);

    // Если в URL меток нет — пробуем восстановить из sessionStorage
    var hasAny = keys.some(function (k) { return p.has(k); });
    if (!hasAny) {
      try {
        var saved = sessionStorage.getItem('walkwalk_utm');
        if (saved) {
          var sp = new URLSearchParams(saved);
          keys.forEach(function (k) { if (sp.has(k) && !p.has(k)) p.set(k, sp.get(k)); });
        }
      } catch (e) {}
    }

    var present = keys.filter(function (k) { return p.has(k) && p.get(k) !== ''; });
    if (!present.length) return;

    var qs = present.map(function (k) { return k + '=' + encodeURIComponent(p.get(k)); }).join('&');
    try { sessionStorage.setItem('walkwalk_utm', qs); } catch (e) {}

    function isWW(url) { return /walk-walk\.ru/i.test(url || ''); }

    function applyToLink(a) {
      if (!a || a.tagName !== 'A') return;
      var href = a.getAttribute('href');
      if (!href || !isWW(href) || /[?&]utm_/.test(href)) return;
      a.setAttribute('href', href + (href.indexOf('?') === -1 ? '?' : '&') + qs);
    }

    function applyToForm(f) {
      if (!f || f.tagName !== 'FORM') return;
      // 1) UTM в action, если форма уходит на walk-walk.ru
      var action = f.getAttribute('action') || '';
      if (isWW(action) && !/[?&]utm_/.test(action)) {
        f.setAttribute('action', action + (action.indexOf('?') === -1 ? '?' : '&') + qs);
      }
      // 2) Скрытые поля — GetCourse подхватывает их в заказ
      present.forEach(function (k) {
        if (f.querySelector('input[name="' + k + '"]')) return;
        var inp = document.createElement('input');
        inp.type = 'hidden'; inp.name = k; inp.value = p.get(k);
        f.appendChild(inp);
      });
    }

    function applyIn(root) {
      var scope = (root && root.querySelectorAll) ? root : document;
      scope.querySelectorAll('a[href]').forEach(applyToLink);
      scope.querySelectorAll('form').forEach(applyToForm);
    }

    // 1. Всё, что есть на момент загрузки
    applyIn(document);

    // 2. MutationObserver — догоняем элементы виджета GetCourse
    if (window.MutationObserver) {
      var mo = new MutationObserver(function (muts) {
        muts.forEach(function (m) {
          m.addedNodes && m.addedNodes.forEach(function (node) {
            if (node.nodeType !== 1) return;
            if (node.tagName === 'A') applyToLink(node);
            if (node.tagName === 'FORM') applyToForm(node);
            if (node.querySelectorAll) applyIn(node);
          });
        });
      });
      mo.observe(document.body, { childList: true, subtree: true });
    }

    // 3. click / submit (capture) — финальная страховка перед навигацией
    document.addEventListener('click', function (e) {
      var a = e.target && e.target.closest && e.target.closest('a[href]');
      if (a) applyToLink(a);
    }, true);
    document.addEventListener('submit', function (e) {
      if (e.target && e.target.tagName === 'FORM') applyToForm(e.target);
    }, true);
  })();

  /* ---------- 10. Яндекс.Метрика — JS-цели через data-metrika-goal ---------- */
  /* Счётчик walk-walk.ru (захардкожен) */
  var METRIKA_ID = 94057307;
  function reachMetrikaGoal(goal) {
    if (!goal) return;
    try {
      if (typeof window.ym === 'function') {
        window.ym(METRIKA_ID, 'reachGoal', goal);
      }
    } catch (e) { /* silent */ }
  }
  document.addEventListener('click', function (e) {
    var t = e.target && e.target.closest && e.target.closest('[data-metrika-goal]');
    if (!t) return;
    reachMetrikaGoal(t.dataset.metrikaGoal);
  });
})();
