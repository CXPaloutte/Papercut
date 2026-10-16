(function () {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const $$ = selector => Array.from(document.querySelectorAll(selector));
  const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
  let reduced = motionQuery.matches;
  let demoTimer = null;

  // One original vector pattern is reused in both scenes and all homepage illustrations.
  function flowerSVG(index) {
    const id = 'home-cut-' + index;
    let rim = '', holes = '';
    for (let i = 0; i < 16; i++) {
      const angle = i * 22.5;
      rim += '<ellipse cx="0" cy="-213" rx="35" ry="44" transform="rotate(' + angle + ')"/>';
      holes += '<g transform="rotate(' + angle + ')"><path d="M0-239C-15-223-14-206 0-190C14-206 15-223 0-239Z"/><circle cy="-176" r="5"/><path d="M-11-161Q0-181 11-161Q0-168-11-161Z"/></g>';
    }
    for (let i = 0; i < 8; i++) {
      holes += '<g transform="rotate(' + (i * 45) + ')"><path d="M0-65C-53-99-48-145 0-163C48-145 53-99 0-65ZM0-78C-23-109-26-134 0-150C26-134 23-109 0-78Z" fill-rule="evenodd"/><path d="M0-87C-13-108-15-121 0-140C15-121 13-108 0-87Z"/><path d="M-30-64C-70-70-82-107-61-139C-52-106-55-84-30-64Z"/><circle cx="-59" cy="-158" r="5"/><path d="M0-20C-28-29-30-49 0-57C30-49 28-29 0-20Z"/></g>';
    }
    return '<svg class="cut-art" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" aria-hidden="true"><defs><mask id="' + id + '" maskUnits="userSpaceOnUse" x="0" y="0" width="600" height="600"><g transform="translate(300 300)"><g fill="white"><circle r="219"/>' + rim + '</g><g fill="black">' + holes + '<circle r="9"/></g></g></mask></defs><path d="M0 0h600v600H0z" mask="url(#' + id + ')"/></svg>';
  }
  $$('[data-flower]').forEach((element, index) => { element.innerHTML = flowerSVG(index); });

  function setScene(mode) {
    $('#paper-scene').dataset.mode = mode;
    $('#paper-scene').setAttribute('aria-label', mode === 'window' ? '原创红色团花贴在八角窗格上' : '同一幅原创红色团花用于一路生花祝福海报');
    $$('[data-scene]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.scene === mode)));
    $('#scene-number').textContent = mode === 'window' ? '01 / 02' : '02 / 02';
    $('#scene-description').textContent = mode === 'window' ? '一窗花影，留住旧时光。' : '同一朵花，写下新的祝福。';
  }
  function stopDemo() {
    clearTimeout(demoTimer);
    demoTimer = null;
    $('#demo-toggle').textContent = '播放演示 ▷';
  }
  function playDemo() {
    if (demoTimer) { stopDemo(); return; }
    if (reduced) { setScene($('#paper-scene').dataset.mode === 'window' ? 'poster' : 'window'); return; }
    setScene('window');
    $('#demo-toggle').textContent = '跳过演示 ↗';
    demoTimer = setTimeout(() => {
      setScene('poster');
      demoTimer = setTimeout(stopDemo, 1400);
    }, 1900);
  }
  $$('[data-scene]').forEach(button => button.addEventListener('click', () => { stopDemo(); setScene(button.dataset.scene); }));
  $('#demo-toggle').addEventListener('click', () => {
    if (demoTimer) { stopDemo(); setScene('poster'); } else playDemo();
  });
  function applyMotion() {
    document.documentElement.classList.toggle('reduced-motion', reduced);
    $('#motion-toggle').setAttribute('aria-pressed', String(reduced));
    $('#motion-toggle').textContent = reduced ? '减少动画：已开启' : '减少动画';
    if (reduced) { stopDemo(); $('#paper-scene').style.setProperty('--dx', '0px'); $('#paper-scene').style.setProperty('--dy', '0px'); }
  }
  try { const saved = localStorage.getItem('papercut-home-motion'); if (saved !== null) reduced = saved === 'reduce' || motionQuery.matches; } catch {}
  applyMotion();
  $('#motion-toggle').addEventListener('click', () => {
    reduced = !reduced; applyMotion();
    try { localStorage.setItem('papercut-home-motion', reduced ? 'reduce' : 'full'); } catch {}
  });
  motionQuery.addEventListener('change', event => { reduced = event.matches; applyMotion(); });
  $('#paper-scene').addEventListener('pointermove', event => {
    if (reduced || event.pointerType !== 'mouse' || innerWidth < 900) return;
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty('--dx', ((event.clientX - rect.left) / rect.width - .5) * 6 + 'px');
    event.currentTarget.style.setProperty('--dy', ((event.clientY - rect.top) / rect.height - .5) * 6 + 'px');
  });
  $('#paper-scene').addEventListener('pointerleave', event => { event.currentTarget.style.setProperty('--dx', '0px'); event.currentTarget.style.setProperty('--dy', '0px'); });

  const modules = {
    roots: { label: '01 / 知其来处', title: '纸间寻根', description: '从具体作品认识山东剪纸：它来自哪里，曾出现在怎样的生活里，又有哪些值得仔细观察的细节。', points: ['看来源：作品、地域与作者或收藏信息。', '读生活：了解有资料支持的使用场景。', '找方法：观察对称、装饰、留纸与镂空。'] },
    renew: { label: '02 / 取意生新', title: '纹样新生', description: '让传统方法成为新的表达。这里将通过分步对照，呈现一幅剪纸从参考到再设计的过程。', points: ['看来源：区分传统参考与原创练习。', '找方法：认识构图、重复与局部装饰。', '做变化：简化、调整、组合，再试着创作。'] },
    life: { label: '04 / 入日常间', title: '一纸入生活', description: '一幅剪纸，可以是窗上的花，也可以是送给朋友的一句祝福。首页的场景切换，展示了同一图案的两种去处。', points: ['窗格透光：在光影里欣赏剪纸的镂空。', '祝福海报：让图案与标题、赠语相遇。', '留下心意：规划用创作卡记录来源与个人表达。'] }
  };
  function closeMenu() { $('#mobile-nav').hidden = true; $('.menu-button').setAttribute('aria-expanded', 'false'); $('.menu-button').setAttribute('aria-label', '展开导航'); }
  $$('[data-module]').forEach(button => button.addEventListener('click', () => {
    const data = modules[button.dataset.module];
    stopDemo(); closeMenu();
    $('#module-eyebrow').textContent = data.label;
    $('#module-title').textContent = data.title;
    $('#module-description').textContent = data.description;
    $('#module-points').replaceChildren(...data.points.map(text => { const li = document.createElement('li'); li.textContent = text; return li; }));
    $('#module-dialog').showModal();
  }));
  $('.dialog-close').addEventListener('click', () => $('#module-dialog').close());
  $('#back-home').addEventListener('click', () => $('#module-dialog').close());
  $('#module-dialog').addEventListener('click', event => {
    const rect = event.currentTarget.getBoundingClientRect();
    if (event.target === event.currentTarget && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) event.currentTarget.close();
  });
  $('.menu-button').addEventListener('click', () => {
    const expanded = $('.menu-button').getAttribute('aria-expanded') !== 'true';
    $('.menu-button').setAttribute('aria-expanded', String(expanded));
    $('.menu-button').setAttribute('aria-label', expanded ? '收起导航' : '展开导航');
    $('#mobile-nav').hidden = !expanded;
  });
  $$('#mobile-nav a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && !$('#mobile-nav').hidden) { closeMenu(); $('.menu-button').focus(); } });
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopDemo(); });
})();
