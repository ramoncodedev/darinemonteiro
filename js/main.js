/* =========================================================
   Darine Monteiro — interações
   ========================================================= */
(function () {
  'use strict';

  var STEP = 0.13; // segundos entre cada elemento da entrada

  /* ---- distribui o atraso da animação de entrada ---- */
  function prepareReveals() {
    var items = document.querySelectorAll('.reveal');
    Array.prototype.forEach.call(items, function (el, i) {
      var order = parseFloat(el.dataset.delay);
      if (isNaN(order)) { order = i; }
      el.style.setProperty('--d', (order * STEP).toFixed(2) + 's');
    });
  }

  /* ---- dispara a entrada quando a arte já está carregada ---- */
  function start() {
    requestAnimationFrame(function () {
      document.body.classList.add('is-ready');
    });
  }

  function waitForHero() {
    var img = document.querySelector('.hero__img');
    if (!img || img.complete) { return start(); }

    var done = false;
    var go = function () {
      if (done) { return; }
      done = true;
      start();
    };

    img.addEventListener('load', go);
    img.addEventListener('error', go);
    setTimeout(go, 1600); // rede lenta não segura o conteúdo
  }

  /* ---- mantém o título em exatamente 3 linhas ----
     mede a linha mais larga e ajusta o corpo da fonte para caber
     na coluna, sem nunca ultrapassar o teto definido no CSS.      */
  function fitTitle() {
    var title = document.querySelector('.hero__title');
    var host = document.querySelector('.hero__content');
    if (!title || !host) { return; }

    var lines = title.querySelectorAll('.line');
    if (!lines.length) { return; }

    // volta ao valor do CSS para que a medição seja sempre absoluta
    title.style.removeProperty('font-size');

    var base = parseFloat(window.getComputedStyle(title).fontSize);
    var available = host.clientWidth;
    if (!base || !available) { return; }

    var widest = 0;
    Array.prototype.forEach.call(lines, function (line) {
      widest = Math.max(widest, line.getBoundingClientRect().width);
    });
    if (!widest) { return; }

    var rem = parseFloat(window.getComputedStyle(document.documentElement).fontSize) || 16;
    var max = (window.innerWidth <= 900 ? 2.7 : 3.4) * rem;
    var min = 1.15 * rem;

    // 0.99 de folga para arredondamentos de subpixel
    var size = base * (available / widest) * 0.99;
    size = Math.min(Math.max(size, min), max);

    title.style.fontSize = size.toFixed(2) + 'px';
  }

  function watchTitle() {
    var run = function () { fitTitle(); };
    var pending;

    run();

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(run).catch(function () {});
    }

    window.addEventListener('resize', function () {
      window.cancelAnimationFrame(pending);
      pending = window.requestAnimationFrame(run);
    }, { passive: true });
  }

  /* ---- entrada por rolagem, escalonada dentro de cada grupo ---- */
  function revealOnScroll() {
    var items = document.querySelectorAll('.rise');
    if (!items.length) { return; }

    // sem suporte a IntersectionObserver, o conteúdo aparece direto
    if (!('IntersectionObserver' in window)) {
      Array.prototype.forEach.call(items, function (el) {
        el.classList.add('is-visible');
      });
      return;
    }

    // o atraso acompanha a posição do elemento dentro do próprio bloco
    Array.prototype.forEach.call(items, function (el) {
      var siblings = el.parentNode.querySelectorAll(':scope > .rise');
      var index = Array.prototype.indexOf.call(siblings, el);
      el.style.setProperty('--d', (Math.max(index, 0) * STEP).toFixed(2) + 's');
    });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) { return; }
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.15 });

    Array.prototype.forEach.call(items, function (el) { io.observe(el); });
  }

  /* ---- imagens ainda não entregues ----
     esconde a imagem que falhar, deixando à mostra o painel
     que ocupa o lugar dela. Ao salvar o arquivo, ela aparece
     sozinha, sem nenhuma alteração no código.                */
  function imageFallback() {
    var imgs = document.querySelectorAll('img[data-fallback]');

    Array.prototype.forEach.call(imgs, function (img) {
      var hide = function () { img.hidden = true; };

      // já falhou antes deste script rodar
      if (img.complete && !img.naturalWidth) { return hide(); }

      img.addEventListener('error', hide);
      img.addEventListener('load', function () {
        if (!img.naturalWidth) { hide(); }
      });
    });
  }

  /* ---- rolagem suave para as âncoras internas ---- */
  function smoothAnchors() {
    document.addEventListener('click', function (e) {
      var link = e.target.closest('a[href^="#"]');
      if (!link) { return; }

      var id = link.getAttribute('href');
      if (id === '#') { return; }

      var target = document.querySelector(id);
      if (!target) { return; }

      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  /* ---- corrige o 100svh em navegadores antigos ---- */
  function fixViewportUnit() {
    var set = function () {
      document.documentElement.style.setProperty('--vh', window.innerHeight * 0.01 + 'px');
    };
    set();
    window.addEventListener('resize', set, { passive: true });
    window.addEventListener('orientationchange', set);
  }

  prepareReveals();
  fixViewportUnit();
  watchTitle();
  revealOnScroll();
  imageFallback();
  smoothAnchors();
  waitForHero();
})();
