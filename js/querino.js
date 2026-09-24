'use strict';
(() => {
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const track = $('#q-track');
  const cards = $$('.q-episode');
  const section = $('.q-episodes');
  const previous = $('.q-prev');
  const next = $('.q-next');
  const count = $('.q-count strong');
  const progress = $('.q-carousel-progress span');
  const status = $('.q-carousel-status');
  let active = -1;
  let scrollFrame = 0;
  let announceTimer;
  let pageFrame = 0;
  let pageHeight = 1;
  let waveVisible = false;
  const wave = $('.q-sound-art');

  function updateWave() {
    wave.classList.toggle('in-view', waveVisible && !document.hidden && !motion.matches);
  }

  function updateActive() {
    scrollFrame = 0;
    const bounds = track.getBoundingClientRect();
    const center = bounds.left + bounds.width / 2;
    let nearest = 0;
    let distance = Infinity;
    cards.forEach((card, index) => {
      const rect = card.getBoundingClientRect();
      const delta = Math.abs(rect.left + rect.width / 2 - center);
      if (delta < distance) { nearest = index; distance = delta; }
    });
    if (active === nearest) return;
    active = nearest;
    cards.forEach((card, index) => {
      card.classList.toggle('is-active', index === active);
      if (index === active) card.setAttribute('aria-current', 'true');
      else card.removeAttribute('aria-current');
    });
    previous.disabled = active === 0;
    next.disabled = active === cards.length - 1;
    count.textContent = String(active + 1).padStart(2, '0');
    progress.style.transform = `scaleX(${(active + 1) / cards.length})`;
    section.dataset.activeTheme = cards[active].dataset.theme;
    clearTimeout(announceTimer);
    announceTimer = setTimeout(() => {
      status.textContent = `Episódio ${active + 1} de ${cards.length}: ${cards[active].querySelector('h3').textContent}.`;
    }, 220);
  }

  function scheduleActive() {
    if (!scrollFrame) scrollFrame = requestAnimationFrame(updateActive);
  }

  function goTo(index, instant = false) {
    index = Math.max(0, Math.min(cards.length - 1, index));
    const card = cards[index];
    track.scrollTo({
      left: card.offsetLeft + card.offsetWidth / 2 - track.clientWidth / 2,
      behavior: instant || motion.matches ? 'instant' : 'smooth'
    });
  }

  cards.forEach((card, index) => {
    card.setAttribute('role', 'group');
    card.setAttribute('aria-roledescription', 'slide');
    card.setAttribute('aria-label', `${index + 1} de ${cards.length}`);
  });
  $('.q-carousel-controls').hidden = false;
  previous.addEventListener('click', () => goTo(active - 1));
  next.addEventListener('click', () => goTo(active + 1));
  track.addEventListener('scroll', scheduleActive, { passive: true });
  track.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    if (event.repeat) return;
    const index = event.key === 'Home' ? 0 : event.key === 'End' ? cards.length - 1 : active + (event.key === 'ArrowRight' ? 1 : -1);
    // Leva o foco junto quando a navegação começa em um link de episódio.
    if (event.target.closest('.q-episode')) cards[Math.max(0, Math.min(cards.length - 1, index))].querySelector('a').focus({ preventScroll: true });
    goTo(index);
  });
  track.addEventListener('focusin', event => {
    const card = event.target.closest('.q-episode');
    // O navegador primeiro revela o elemento focado. Centralizamos depois dessa
    // rolagem nativa para que as duas operações não disputem a posição.
    if (card) requestAnimationFrame(() => goTo(cards.indexOf(card), true));
  });

  function revealMotion() {
    document.documentElement.classList.toggle('q-enhanced', !motion.matches && 'IntersectionObserver' in window);
    updateWave();
  }
  if ('IntersectionObserver' in window) {
    const reveal = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      reveal.unobserve(entry.target);
    }), { threshold: .08, rootMargin: '0px 0px -20px 0px' });
    $$('.q-reveal').forEach(element => reveal.observe(element));
    new IntersectionObserver(entries => {
      waveVisible = entries[0].isIntersecting;
      updateWave();
    }).observe(wave);
    new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) $('.q-context').classList.add('is-present');
    }, { threshold: .25 }).observe(innerWidth < 760 ? $('.q-context-block') : $('.q-history-line'));
    new IntersectionObserver(entries => {
      section.classList.toggle('has-passed', entries[0].isIntersecting);
    }, { threshold: .3 }).observe($('.q-after-episodes'));
  }
  revealMotion();
  motion.addEventListener('change', revealMotion);
  document.addEventListener('visibilitychange', updateWave);

  function updatePageProgress() {
    pageFrame = 0;
    $('.q-reading-progress span').style.transform = `scaleX(${Math.min(1, Math.max(0, scrollY / pageHeight))})`;
  }
  function schedulePageProgress() {
    if (!pageFrame) pageFrame = requestAnimationFrame(updatePageProgress);
  }
  function measurePage() {
    pageHeight = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    schedulePageProgress();
  }
  let resizeTimer;
  addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { goTo(Math.max(0, active), true); measurePage(); }, 120);
  }, { passive: true });
  addEventListener('scroll', schedulePageProgress, { passive: true });
  if ('ResizeObserver' in window) new ResizeObserver(measurePage).observe(document.body);
  addEventListener('load', measurePage, { once: true });
  document.fonts?.ready.then(() => { measurePage(); scheduleActive(); });

  // As âncoras de episódios também selecionam o cartão, sem prender a rolagem vertical.
  function followEpisodeHash() {
    const card = cards.find(item => `#${item.id}` === location.hash);
    if (card) goTo(cards.indexOf(card), true);
  }
  addEventListener('hashchange', followEpisodeHash);
  followEpisodeHash();
  updateActive();
  measurePage();
})();
