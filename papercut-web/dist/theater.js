
    const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
    let reducedMotion = motionPreference.matches;
    // ==================== POLYCHROME MASTER PALETTES & STATE ====================
    const palettes = [
  {
    "name": "朱砂浸染",
    "c1": "#A83A2F",
    "c2": "#BB6653",
    "c3": "#C4A574",
    "c4": "#85352D",
    "c5": "#D49B80"
  },
  {
    "name": "胭脂薄染",
    "c1": "#A14E58",
    "c2": "#B8777A",
    "c3": "#C6AB8F",
    "c4": "#7F414C",
    "c5": "#D7ABA5"
  },
  {
    "name": "赭石暖纸",
    "c1": "#9B5539",
    "c2": "#B4815D",
    "c3": "#C9AC7D",
    "c4": "#76442F",
    "c5": "#D4AE8E"
  },
  {
    "name": "茶褐旧笺",
    "c1": "#795D45",
    "c2": "#9E8366",
    "c3": "#BCA579",
    "c4": "#634B3E",
    "c5": "#C6B096"
  }
];

    const state = {
      paletteIdx: 0,
      lanternNight: false,
      soundOn: false,
      symPetals: 8, // Always 100% Full Window Bloom!
      motifIdx: 0,
      layerSpread: 1.15,

      motifs: [
        {
          title: '百鸟朝凤 · 五色满窗团花',
          outerStyle: 'swallow',
          midStyle: 'lotus',
          mainStyle: 'phoenix',
          innerStyle: 'peony'
        },
        {
          title: '千里江山 · 青绿云水团花',
          outerStyle: 'wave',
          midStyle: 'willow',
          mainStyle: 'lotus',
          innerStyle: 'sunburst'
        },
        {
          title: '鱼跃龙门 · 连年有余团花',
          outerStyle: 'lotus',
          midStyle: 'swallow',
          mainStyle: 'fish',
          innerStyle: 'peony'
        }
      ],

      portals: [
        {
          id: 'p-workshop',
          number: '壹',
          windowType: 'moon',
          windowLabel: '满月圆窗',
          status: '核心已上线模块',
          title: '剪纸工坊',
          subtitle: '指尖落刀 · 对称造物与纸间连接观察',
          poeticDesc: '步入满月轩窗，在四瓣、六瓣、八瓣满窗折纸间自由裁云镂月，观察剪口与留白，也留意纸面之间的连接。',
          route: '/workshop',
          motif: 'mandala'
        },
        {
          id: 'p-inspiration',
          number: '贰',
          windowType: 'begonia',
          windowLabel: '海棠花窗',
          status: '核心已上线模块',
          title: '纹样灵感',
          subtitle: '寻脉千载 · 在花叶之间，寻找下一剪的灵感',
          poeticDesc: '透过曲瓣海棠花窗，欣赏原创几何练习纹样，观察对称、重复和疏密变化，再为自己的创作添一笔新意。',
          route: '/inspiration',
          motif: 'flora'
        },
        {
          id: 'p-works',
          number: '叁',
          windowType: 'fan',
          windowLabel: '折扇轩窗',
          status: '核心已上线模块',
          title: '我的作品',
          subtitle: '藏珍于匣 · 实景贴窗光影预览与矢量珍藏',
          poeticDesc: '展开折扇轩窗，将亲手裁就的窗花映于古宅木棂或现代晴窗之上，支持草稿回溯与 SVG/PNG 无损导出。',
          route: '/works',
          motif: 'phoenix'
        },
        {
          id: 'p-future-1',
          number: '肆',
          windowType: 'octagon',
          windowLabel: '八角景窗',
          status: '预留拓展模块 · 可直接挂载',
          title: '九州流派长卷',
          subtitle: '山河寻踪 · 南北非遗剪纸地域风格数字地图',
          poeticDesc: '自山东高密金石刚劲之风，至河北蔚县五彩点染之妙，以交互视差地图串联中华剪纸千年流变。',
          route: '/heritage-map',
          motif: 'mountain'
        },
        {
          id: 'p-future-2',
          number: '伍',
          windowType: 'leaf',
          windowLabel: '蕉叶轩窗',
          status: '预留拓展模块 · 可直接挂载',
          title: '灵犀文创造物',
          subtitle: '器以载道 · 窗花光影投射与东方生活美学衍生',
          poeticDesc: '将镂空纹样实时映射至灯彩、团扇、丝巾与节气礼盒之上，让非遗剪纸走出纸面、步入日常起居。',
          route: '/cultural-craft',
          motif: 'lantern'
        }
      ]
    };

    // ==================== PENTATONIC CHIME AUDIO ====================
    let audioCtx = null;
    const chimeNotes = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5];
    function playChime(noteIndex = 0) {
      if (!state.soundOn) return;
      try {
        if (!audioCtx) {
          const AC = window.AudioContext || window.webkitAudioContext;
          if (AC) audioCtx = new AC();
        }
        if (!audioCtx) return;
        if (audioCtx.state === 'suspended') audioCtx.resume();

        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        const freq = chimeNotes[noteIndex % chimeNotes.length];

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.002, now + 0.5);

        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.5);

        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.52);
      } catch (e) {}
    }

    let toastTimer = null;
    function showToast(msg) {
      const box = document.getElementById('theaterToast');
      const txt = document.getElementById('theaterToastText');
      if (!box || !txt) return;
      txt.textContent = msg;
      box.classList.remove('hidden');
      if (toastTimer) clearTimeout(toastTimer);
      toastTimer = setTimeout(() => box.classList.add('hidden'), 2600);
    }

    function buildPolychromePortalSvg(motif, pal) { return renderPortalArtwork(motif, pal); }

    function renderStaggeredPortals() {
      const container = document.getElementById('portalsStaggeredContainer');
      const pal = palettes[state.paletteIdx];
      const shapes = {moon:'portal-moon',begonia:'portal-begonia',fan:'portal-fan',octagon:'portal-octagon',leaf:'portal-leaf'};
      const escape = text => String(text).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
      container.innerHTML = state.portals.map((p, i) => `<article class="portal-entry-row refined-portal ${i%2?'portal-reverse':''}" data-portal-id="${escape(p.id)}" role="button" tabindex="0" aria-label="查看${escape(p.title)}">
        <div class="portal-art-column"><div class="window-portal-3d"><div class="portal-frame ${shapes[p.windowType]||'portal-moon'}"><div class="portal-scene ${shapes[p.windowType]||'portal-moon'}">${buildPolychromePortalSvg(p.motif,pal)}</div></div><span class="portal-seal">${escape(p.number)}</span><span class="portal-caption">${escape(p.windowLabel)} · 原创纸雕</span></div></div>
        <div class="portal-copy"><p class="portal-kicker"><span>${String(i+1).padStart(2,'0')}</span> / ${i<3?'纸间体验':'未来篇章'}</p><h3>${escape(p.title)}</h3><p class="portal-subtitle">${escape(p.subtitle)}</p><p class="portal-description">${escape(p.poeticDesc)}</p><span class="portal-entry-link">${i<3?'推窗，寻一份灵感':'看看这扇窗的故事'}<span aria-hidden="true">↗</span></span></div>
      </article>`).join('');
    }

    // ==================== FULL-SCREEN 2.5D FLOATING PAPER BUTTERFLIES, PETALS & GOLD DUST ENGINE ====================
    const particles = [];
    function initBreezeParticles(canvas) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      particles.length = 0;
      const count = window.innerWidth < 640 ? 6 : 12;
      for (let i = 0; i < count; i++) {
        particles.push(createParticle(canvas.width, canvas.height, false));
      }
    }

    function createParticle(w, h, burstFromCenter = false) {
      const pal = palettes[state.paletteIdx];
      const colors = [pal.c1, pal.c2, pal.c3, pal.c5];
      const depth = Math.random(); // 0 = far small, 1 = near large 2.5D bokeh
      const kind = ['swallow','butterfly','koi','snowflake','cloud','lantern','ginkgo','gold_dust'][Math.floor(Math.random()*8)];
      return {
        x: burstFromCenter ? w / 2 + (Math.random() - 0.5) * 80 : Math.random() * w,
        y: burstFromCenter ? h / 2 + (Math.random() - 0.5) * 80 : Math.random() * h,
        vx: burstFromCenter ? (Math.random() - 0.5) * 6 : (Math.random() - 0.3) * (0.6 + depth * 0.9),
        vy: burstFromCenter ? (Math.random() - 0.5) * 6 : -0.4 - Math.random() * 0.8,
        size: 3 + depth * 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        rot: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.04,
        flapPhase: Math.random() * Math.PI * 2,
        kind,
        alpha: 0.12 + depth * 0.18
      };
    }

    function burstPaperButterflies() {
      if (reducedMotion) return;
      const canvas = document.getElementById('breezeParticleCanvas');
      if (!canvas) return;
      for (let i = 0; i < 7; i++) {
        particles.push(createParticle(canvas.width, canvas.height, true));
      }
      if (particles.length > 55) {
        particles.splice(0, particles.length - 55);
      }
    }

    function updateAndDrawParticles(canvas) {
      const ctx = canvas.getContext('2d');
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const drift = Math.sin(p.flapPhase * .2);
        p.x += p.kind === 'cloud' || p.kind === 'koi' ? .5 + p.vx + drift * .12 : p.vx;
        p.y += p.kind === 'ginkgo' ? Math.abs(p.vy) * .6 : p.kind === 'cloud' || p.kind === 'koi' ? drift * .16 : p.vy;
        p.rot += p.kind === 'snowflake' || p.kind === 'ginkgo' ? p.vRot : p.vRot * .1;
        p.flapPhase += 0.12;

        // Dampen burst velocity smoothly
        p.vx *= 0.992;
        if (Math.abs(p.vx) < 0.35) p.vx += (Math.random() - 0.48) * 0.05;
        if (p.vy > -0.35) p.vy -= 0.02;

        // Wrap around screen edges
        if (p.y < -30) { p.y = h + 25; p.x = Math.random() * w; }
        if (p.y > h + 30) { p.y = -25; p.x = Math.random() * w; }
        if (p.x < -30) p.x = w + 25;
        if (p.x > w + 30) p.x = -25;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;

        drawPaperSpirit(ctx, p);
        ctx.restore();
      }
    }

    // ==================== APPLY PALETTE THEME ====================
    function applyPalette(idx) {
      state.paletteIdx = idx;
      const pal = palettes[idx];
      const root = document.documentElement;
      root.style.setProperty('--c1', pal.c1);
      root.style.setProperty('--c2', pal.c2);
      root.style.setProperty('--c3', pal.c3);
      root.style.setProperty('--c4', pal.c4);
      root.style.setProperty('--c5', pal.c5);
      document.querySelectorAll('.palette-btn').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.palette) === idx)));

      document.querySelectorAll('.poly-fill-c1').forEach((el) => el.setAttribute('fill', pal.c1));
      document.querySelectorAll('.poly-fill-c2').forEach((el) => el.setAttribute('fill', pal.c2));
      document.querySelectorAll('.poly-fill-c3').forEach((el) => el.setAttribute('fill', pal.c3));
      document.querySelectorAll('.poly-fill-c4').forEach((el) => el.setAttribute('fill', pal.c4));
      document.querySelectorAll('.poly-fill-c5').forEach((el) => el.setAttribute('fill', pal.c5));

      document.querySelectorAll('.poly-stroke-c1').forEach((el) => el.setAttribute('stroke', pal.c1));
      document.querySelectorAll('.poly-stroke-c2').forEach((el) => el.setAttribute('stroke', pal.c2));
      document.querySelectorAll('.poly-stroke-c3').forEach((el) => el.setAttribute('stroke', pal.c3));

      document.getElementById('paletteStatusBanner').textContent =
        `当前纸色 · ${pal.name}`;

      document.dispatchEvent(new Event('paperpalettechange'));
      renderStaggeredPortals();
      burstPaperButterflies();
    }

    // ==================== INITIALIZATION & EVENT BINDINGS ====================
    window.addEventListener('DOMContentLoaded', () => {
      function applyMotionPreference() {
        document.body.classList.toggle('reduced-motion', reducedMotion);
        const button = document.getElementById('motionToggleBtn');
        button.setAttribute('aria-pressed', String(reducedMotion));
        button.textContent = reducedMotion ? '减少动画：已开启' : '减少动画';
        if (reducedMotion) {
          document.documentElement.style.setProperty('--tilt-x', '0deg');
          document.documentElement.style.setProperty('--tilt-y', '0deg');
        }
      }
      document.getElementById('motionToggleBtn').addEventListener('click', () => { reducedMotion = !reducedMotion; applyMotionPreference(); });
      motionPreference.addEventListener('change', event => { reducedMotion = event.matches; applyMotionPreference(); });
      applyMotionPreference();
      document.querySelectorAll('.sym-pill').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.mandalaSym) === state.symPetals)));
      const breezeCanvas = document.getElementById('breezeParticleCanvas');
      initBreezeParticles(breezeCanvas);
      window.addEventListener('resize', () => initBreezeParticles(breezeCanvas));

      applyPalette(0);

      let lastParticleTime = 0;
      function masterLoop(time) {
        if (!reducedMotion && !document.hidden && time - lastParticleTime > 32) {
          updateAndDrawParticles(breezeCanvas);
          lastParticleTime = time;
        }
        requestAnimationFrame(masterLoop);
      }
      requestAnimationFrame(masterLoop);

      // 1. 2.5D Mouse Parallax & Dynamic Directional Shadows
      window.addEventListener('mousemove', (e) => {
        if (reducedMotion || window.innerWidth < 768) return;
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const px = (e.clientX / vw) * 100;
        const py = (e.clientY / vh) * 100;
        const nx = (e.clientX / vw) - 0.5;
        const ny = (e.clientY / vh) - 0.5;

        const root = document.documentElement;
        root.style.setProperty('--light-x', `${px.toFixed(1)}%`);
        root.style.setProperty('--light-y', `${py.toFixed(1)}%`);
        root.style.setProperty('--tilt-x', `${(-ny * 12).toFixed(2)}deg`);
        root.style.setProperty('--tilt-y', `${(nx * 12).toFixed(2)}deg`);
        root.style.setProperty('--shadow-x', `${(-nx * 28).toFixed(1)}px`);
        root.style.setProperty('--shadow-y', `${(12 - ny * 24).toFixed(1)}px`);
      });

      // 2. Scroll-Driven Curtain Parting
      window.addEventListener('scroll', () => {
        if (reducedMotion) return;
        const ratio = Math.min(1, Math.max(0, window.scrollY / 580));
        const leftC = document.getElementById('curtainLeft');
        const rightC = document.getElementById('curtainRight');
        if (leftC && rightC) {
          leftC.style.transform = `translateX(${-ratio * 44}%)`;
          rightC.style.transform = `translateX(${ratio * 44}%)`;
        }
      });

      // 6. Paper palette Master Palettes Switcher
      document.querySelectorAll('.palette-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          const idx = Number(btn.getAttribute('data-palette'));
          document.querySelectorAll('.palette-btn').forEach((b) => {
            if (b === btn) {
              b.classList.add('ring-2', 'ring-offset-1', 'ring-red-700');
              b.classList.remove('opacity-80');
            } else {
              b.classList.remove('ring-2', 'ring-offset-1', 'ring-red-700');
              b.classList.add('opacity-80');
            }
          });
          playChime(idx);
          applyPalette(idx);
          showToast(`🎨 点彩焕新：已切换至「${palettes[idx].name}」`);
        });
      });

      // 7. Lantern Night Mode Toggle
      document.getElementById('lanternToggleBtn').addEventListener('click', () => {
        state.lanternNight = !state.lanternNight;
        document.body.classList.toggle('lantern-night', state.lanternNight);
        document.getElementById('lanternToggleBtn').setAttribute('aria-pressed', String(state.lanternNight));
        document.dispatchEvent(new Event('paperpalettechange'));
        document.getElementById('lanternIcon').textContent = state.lanternNight ? '☀️' : '🕯️';
        document.getElementById('lanternText').textContent = state.lanternNight ? '宣纸白昼' : '琉璃夜窗';
        playChime(3);
        burstPaperButterflies();
        showToast(state.lanternNight ? '已切换至暖灯夜窗' : '已切换至宣纸白昼');
      });

      // 8. Sound Toggle
      document.getElementById('chimeToggleBtn').addEventListener('click', () => {
        state.soundOn = !state.soundOn;
        document.getElementById('chimeToggleBtn').setAttribute('aria-pressed', String(state.soundOn));
        document.getElementById('chimeToggleBtn').setAttribute('aria-label', state.soundOn ? '关闭音效' : '开启音效');
        document.getElementById('chimeIcon').textContent = state.soundOn ? '🔊' : '🔇';
        showToast(state.soundOn ? '已开启五声宫调空灵音效' : '已静音');
      });

      // 9. Jump to Portals
      document.getElementById('jumpPortalsBtn').addEventListener('click', () => {
        document.getElementById('stage-portals').scrollIntoView({ behavior: reducedMotion ? 'instant' : 'smooth' });
      });

      // 10. Portal Entry Modal
      const portalModal = document.getElementById('portalPreviewModal');
      let modalTrigger = null;
      function closeModal(modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
        if (modalTrigger && modalTrigger.isConnected) modalTrigger.focus({preventScroll:true});
      }
      function openModal(modal) {
        modalTrigger = document.activeElement;
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        modal.querySelector('button,input')?.focus({preventScroll:true});
      }
      document.getElementById('portalsStaggeredContainer').addEventListener('keydown', event => {
        const row = event.target.closest('.portal-entry-row');
        if (row && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); row.click(); }
      });
      document.getElementById('portalsStaggeredContainer').addEventListener('click', (e) => {
        const row = e.target.closest('.portal-entry-row');
        if (!row) return;
        const pid = row.getAttribute('data-portal-id');
        const portal = state.portals.find((item) => item.id === pid);
        if (!portal) return;

        playChime(5);
        document.getElementById('modalWindowShapeBadge').textContent = portal.windowLabel;
        document.getElementById('modalStatusBadge').textContent = portal.status;
        document.getElementById('modalTitle').textContent = portal.title;
        document.getElementById('modalSubtitle').textContent = portal.subtitle;
        document.getElementById('modalDesc').textContent = portal.poeticDesc;
        document.getElementById('modalRoutePath').textContent = portal.route;
        const localRoutes = {'p-workshop':'workshop.html','p-inspiration':'workshop.html?view=patterns','p-works':'workshop.html?view=collection'};
        const entry = document.getElementById('modalOnlineLink');
        entry.hidden = !localRoutes[pid];
        if (localRoutes[pid]) { entry.href = localRoutes[pid]; entry.removeAttribute('target'); }
        openModal(portalModal);
      });

      document.getElementById('closePortalModalBtn').addEventListener('click', () => closeModal(portalModal));
      document.getElementById('modalCloseSecondaryBtn').addEventListener('click', () => closeModal(portalModal));

      // 11. Add Future Module Window Modal
      const addModModal = document.getElementById('addModuleModal');
      document.getElementById('openAddModuleModalBtn').addEventListener('click', () => openModal(addModModal));
      document.getElementById('closeAddModuleBtn').addEventListener('click', () => closeModal(addModModal));
      document.getElementById('cancelAddModuleBtn').addEventListener('click', () => closeModal(addModModal));
      [portalModal, addModModal].forEach(modal => modal.addEventListener('click', event => { if (event.target === modal) closeModal(modal); }));
      document.addEventListener('keydown', event => {
        const modal = [portalModal, addModModal].find(element => !element.classList.contains('hidden'));
        if (!modal) return;
        if (event.key === 'Escape') { closeModal(modal); return; }
        if (event.key !== 'Tab') return;
        const elements = Array.from(modal.querySelectorAll('button,a[href],input,select')).filter(element => !element.hidden && element.getClientRects().length);
        const first = elements[0], last = elements[elements.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      });

      const cnNumbers = ['壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖', '拾'];
      const shapeLabels = {
        begonia: '海棠花窗',
        octagon: '八角景窗',
        moon: '满月圆窗',
        leaf: '蕉叶轩窗'
      };

      document.getElementById('confirmAddModuleBtn').addEventListener('click', () => {
        const title = (document.getElementById('newModTitle').value || '').trim() || '新拓剪纸轩馆';
        const sub = (document.getElementById('newModSub').value || '').trim() || '非遗数字化创新延展空间';
        const shape = document.getElementById('newModShape').value || 'begonia';
        const route = (document.getElementById('newModRoute').value || '').trim() || '/new-module';

        state.portals.push({
          id: 'p-' + Date.now(),
          number: cnNumbers[state.portals.length] || '新',
          windowType: shape,
          windowLabel: shapeLabels[shape] || '古典花窗',
          status: '新建花窗 · 本次浏览预览',
          title,
          subtitle: sub,
          poeticDesc: '这是为新灵感添加的首页花窗预览，刷新后不会保留。完整内容可在后续制作。',
          route,
          motif: 'mandala'
        });

        renderStaggeredPortals();
        closeModal(addModModal);
        playChime(2);
        burstPaperButterflies();
        showToast(`✨ 已在长卷末尾开辟「${shapeLabels[shape]} · ${title}」五彩花窗入口！`);
      });
    });
  
