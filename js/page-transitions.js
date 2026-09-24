'use strict';
// Links reais continuam funcionando sem JS, com Ctrl/Cmd e em novas abas.
(() => {
  let navigating = false;
  let timer;
  const reset = () => {
    clearTimeout(timer);
    navigating = false;
    document.querySelector('.page-curtain')?.remove();
  };
  addEventListener('pageshow', reset); // Também limpa a volta pelo cache do navegador.
  document.addEventListener('click', event => {
    const link = event.target.closest('a[data-page-transition]');
    if (!link || event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || link.target === '_blank') return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    event.preventDefault();
    if (navigating) return;
    navigating = true;
    document.querySelector('dialog[open]')?.close();
    const returning = link.dataset.pageTransition === 'raizes';
    const curtain = document.createElement('div');
    curtain.className = 'page-curtain' + (returning ? ' returning' : '');
    curtain.setAttribute('aria-hidden', 'true');
    (returning ? ['A MESMA HISTÓRIA.', 'OUTROS OLHARES.', 'DE VOLTA ÀS RAÍZES.'] : ['OUTRAS VOZES.', 'OUTROS OLHARES.', 'A MESMA HISTÓRIA.']).forEach(text => {
      const p = document.createElement('p'); p.textContent = text; curtain.append(p);
    });
    const title = document.createElement('strong');
    title.textContent = returning ? 'RAÍZES / MEMÓRIA & IDENTIDADE' : 'PROJETO QUERINO';
    curtain.append(title);
    document.body.append(curtain);
    timer = setTimeout(() => {
      location.assign(link.href);
      // Recupera a página caso o navegador cancele a navegação.
      timer = setTimeout(reset, 2500);
    }, innerWidth < 600 ? 650 : 1050);
  });
})();
