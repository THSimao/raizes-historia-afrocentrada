'use strict';
// O conteúdo e os links permanecem acessíveis mesmo sem JavaScript.
(() => {
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const coarsePointer = matchMedia('(pointer: coarse)');
  const chapters = $$('.chapter');
  const steps = $$('[data-step]');
  const menu = $('#mobile-menu');
  const header = $('.site-header');
  const state = { active: '', presenting: false, ticking: false, positions: [], chapterPositions: [], timelineTop: 0, timelineHeight: 0, toastTimer: null };
  const behavior = () => reducedMotion.matches ? 'instant' : 'smooth';

  function showToast(message) {
    const toast = $('.toast');
    toast.textContent = message;
    toast.classList.add('visible');
    clearTimeout(state.toastTimer);
    state.toastTimer = setTimeout(() => toast.classList.remove('visible'), 4500);
  }

  function initLoader() {
    const loader = $('.loader');
    if (reducedMotion.matches || location.hash === '#projeto-querino') return;
    document.body.classList.add('hero-pending');
    loader.hidden = false;
    const start = performance.now();
    const duration = coarsePointer.matches || innerWidth < 768 ? 1200 : 1450;
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      $('.loader-count').textContent = '100%';
      $('.loader-line span').style.transform = 'scaleX(1)';
      loader.classList.add('complete');
      setTimeout(() => {
        loader.classList.add('done');
        document.body.classList.replace('hero-pending', 'hero-ready');
        setTimeout(() => { loader.hidden = true; }, 500);
      }, 160);
    };
    const tick = (now) => {
      if (finished) return;
      const progress = Math.min(1, (now - start) / duration);
      const percent = Math.round(progress * 100);
      $('.loader-count').textContent = `${percent}%`;
      $('.loader-line span').style.transform = `scaleX(${progress})`;
      if (progress < 1) requestAnimationFrame(tick); else finish();
    };
    requestAnimationFrame(tick);
    // Limite de segurança, inclusive se a aba ficar em segundo plano.
    setTimeout(finish, 2200);
  }

  function closeMenu() {
    if (menu.open) menu.close();
    document.body.classList.remove('menu-open');
    const toggle = $('.menu-toggle');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Abrir menu');
  }

  function initMobileMenu() {
    const toggle = $('.menu-toggle');
    toggle.addEventListener('click', () => {
      if (menu.open) { closeMenu(); return; }
      menu.showModal();
      document.body.classList.add('menu-open');
      toggle.setAttribute('aria-expanded', 'true');
      toggle.setAttribute('aria-label', 'Fechar menu');
      $('.menu-close').focus({ preventScroll: true });
    });
    $('.menu-close').addEventListener('click', closeMenu);
    menu.addEventListener('close', closeMenu);
    menu.addEventListener('cancel', () => { document.body.classList.remove('menu-open'); });
    menu.addEventListener('keydown', event => {
      if (event.key !== 'Tab') return;
      const focusable = $$('button, a[href]', menu);
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
  }

  function goTo(target, updateHash = true) {
    closeMenu();
    if (updateHash && target.id) history.replaceState(null, '', `#${target.id}`);
    target.scrollIntoView({ behavior: behavior(), block: 'start' });
    target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
    target.addEventListener('blur', () => target.removeAttribute('tabindex'), { once: true });
  }

  function initNavigation() {
    $$('a[href^="#"]').forEach(link => {
      link.addEventListener('click', event => {
        const id = link.getAttribute('href').slice(1);
        const target = document.getElementById(id);
        if (!target) return;
        event.preventDefault();
        goTo(target);
      });
    });
  }

  function initScrollAnimations() {
    if (!('IntersectionObserver' in window) || reducedMotion.matches) return;
    document.documentElement.classList.add('js-motion');
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -25px 0px' });
    $$('.reveal, .draw-line').forEach(el => observer.observe(el));
  }

  function measureLayout() {
    const y = scrollY;
    state.positions = steps.map(el => ({ el, top: el.getBoundingClientRect().top + y, height: el.offsetHeight }));
    state.chapterPositions = chapters.map(el => ({ el, top: el.getBoundingClientRect().top + y }));
    const timeline = $('.timeline');
    state.timelineTop = timeline.getBoundingClientRect().top + y;
    state.timelineHeight = timeline.offsetHeight;
    requestUpdate();
  }

  function initStoryNavigation() {
    measureLayout();
  }

  function updateStory(y) {
    let active = chapters[0];
    const readingPoint = y + Math.min(innerHeight * .3, 240);
    for (const item of state.chapterPositions) {
      if (item.top <= readingPoint) active = item.el;
    }
    if (state.active === active.id) return;
    state.active = active.id;
    $('.story-label').textContent = active.dataset.label;
    $('.story-subtitle').textContent = active.dataset.subtitle;
    $('.story-nav a').href = `#${active.id}`;
    $('.mobile-chapter span').textContent = active.dataset.label;
    $$('.desktop-nav a, .mobile-menu nav a').forEach(link => {
      if (link.hash === `#${active.id}`) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }

  function updateScroll() {
    state.ticking = false;
    const y = Math.max(0, scrollY);
    const total = document.documentElement.scrollHeight - innerHeight;
    $('.reading-progress span').style.transform = `scaleX(${total > 0 ? Math.min(1, y / total) : 0})`;
    header.classList.toggle('scrolled', y > 30);
    $('.mobile-chapter').classList.toggle('visible', y > 160);
    updateStory(y);
    const timelineProgress = Math.max(0, Math.min(1, (y + innerHeight * .75 - state.timelineTop) / Math.max(1, state.timelineHeight)));
    $('.timeline').style.setProperty('--timeline-progress', timelineProgress);
    const heroImage = $('.hero-art img');
    if (heroImage && !reducedMotion.matches && y < innerHeight * 1.5) {
      const amount = coarsePointer.matches || innerWidth < 900 ? .018 : .065;
      heroImage.style.transform = `translateY(${Math.min(y, innerHeight) * amount}px) scale(1.07)`;
    }
  }

  function requestUpdate() {
    if (state.ticking) return;
    state.ticking = true;
    requestAnimationFrame(updateScroll);
  }

  function initProgressBar() {
    addEventListener('scroll', requestUpdate, { passive: true });
    requestUpdate();
  }

  function initParallax() {
    // A camada do hero compartilha o único ciclo de rolagem acima.
    coarsePointer.addEventListener('change', requestUpdate);
    reducedMotion.addEventListener('change', () => {
      if (reducedMotion.matches) {
        document.documentElement.classList.remove('js-motion');
        $('.loader').hidden = true;
        document.body.classList.remove('hero-pending');
      }
      requestUpdate();
    });
  }

  function navigateStep(direction) {
    const y = scrollY;
    const offset = 125;
    let index = 0;
    state.positions.forEach((item, i) => { if (item.top <= y + offset + 35) index = i; });
    const current = state.positions[index];
    // Se o capítulo for alto, percorra seu conteúdo antes de mudar de momento.
    if (direction > 0 && current.top + current.height > y + innerHeight + 70) {
      scrollBy({ top: innerHeight * .75, behavior: behavior() });
    } else if (direction < 0 && y > current.top + 140) {
      scrollTo({ top: Math.max(current.top - offset, y - innerHeight * .75), behavior: behavior() });
    } else {
      const target = state.positions[Math.max(0, Math.min(steps.length - 1, index + direction))];
      goTo(target.el, false);
    }
  }

  function initKeyboardNavigation() {
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') { if (menu.open) closeMenu(); else if (state.presenting) exitPresentation(); return; }
      if (menu.open || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || /INPUT|TEXTAREA|SELECT|BUTTON|SUMMARY|A/.test(event.target.tagName) || event.target.isContentEditable) return;
      const keys = ['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End'];
      if (!keys.includes(event.key)) return;
      event.preventDefault();
      if (event.repeat) return;
      if (event.key === 'Home') goTo(steps[0], false);
      else if (event.key === 'End') goTo(steps[steps.length - 1], false);
      else navigateStep(['ArrowDown', 'PageDown'].includes(event.key) ? 1 : -1);
    });
  }

  function setPresentation(value) {
    state.presenting = value;
    document.body.classList.toggle('presentation-mode', value);
    $('.presentation-controls').hidden = !value;
    $('.present-label').textContent = value ? 'SAIR' : 'APRESENTAR';
    $('.present-button').setAttribute('aria-pressed', String(value));
    $('.present-button').setAttribute('aria-label', value ? 'Sair da apresentação' : 'Apresentar em tela cheia');
    measureLayout();
  }

  async function exitPresentation() {
    setPresentation(false);
    if (document.fullscreenElement && document.exitFullscreen) {
      try { await document.exitFullscreen(); } catch { /* O navegador pode ter saído pelo Esc. */ }
    }
  }

  function initPresentationMode() {
    $('.present-button').setAttribute('aria-label', 'Apresentar em tela cheia');
    $('.present-button').setAttribute('aria-pressed', 'false');
    $('.present-button').addEventListener('click', async () => {
      if (state.presenting) { await exitPresentation(); return; }
      setPresentation(true);
      if (document.documentElement.requestFullscreen && document.fullscreenEnabled) {
        try { await document.documentElement.requestFullscreen(); }
        catch { showToast('Apresentação ativada. A tela cheia não está disponível neste navegador.'); }
      } else showToast('Apresentação ativada. Use as setas ou role para continuar.');
      // Libera o teclado após o clique, mantendo foco visível na região principal.
      const main = $('main'); main.setAttribute('tabindex', '-1'); main.focus({ preventScroll: true });
    });
    $('.exit-presentation').addEventListener('click', exitPresentation);
    $$('.presentation-controls [data-direction]').forEach(button => button.addEventListener('click', () => navigateStep(Number(button.dataset.direction))));
    document.addEventListener('fullscreenchange', () => {
      if (!document.fullscreenElement && state.presenting) setPresentation(false);
      measureLayout();
    });
  }

  function initCounters() {
    // Uma sequência finita: não mantém um loop ativo depois do encerramento.
    const words = $$('.closing-words span');
    if (reducedMotion.matches || !('IntersectionObserver' in window)) {
      words.forEach((word, i) => word.classList.toggle('active', i === words.length - 1)); return;
    }
    const observer = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      observer.disconnect();
      words.forEach((word, i) => setTimeout(() => {
        words.forEach(other => other.classList.remove('active'));
        word.classList.add('active');
      }, i * 1450));
    }, { threshold: .5 });
    observer.observe($('.closing-words'));
  }

  function initResponsiveBehavior() {
    let timer;
    const resized = () => { clearTimeout(timer); timer = setTimeout(() => { if (innerWidth >= 1100) closeMenu(); measureLayout(); }, 150); };
    addEventListener('resize', resized, { passive: true });
    addEventListener('orientationchange', resized, { passive: true });
    addEventListener('load', measureLayout, { once: true });
    if (document.fonts) document.fonts.ready.then(measureLayout);
    if ('ResizeObserver' in window) new ResizeObserver(resized).observe($('main'));
  }

  initLoader();
  initNavigation();
  initMobileMenu();
  initScrollAnimations();
  initStoryNavigation();
  initProgressBar();
  initParallax();
  initKeyboardNavigation();
  initPresentationMode();
  initCounters();
  initResponsiveBehavior();
})();
