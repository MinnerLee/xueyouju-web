import { courses, topics } from './courses.js';

const esc = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- 装饰图形（原创 SVG，未使用任何游戏素材） ---------- */

const graph = () => `<svg class="nh-graph" viewBox="0 0 520 300" role="img" aria-label="绝对值函数图像：在原点连续，左右两侧斜率不同">
  <defs>
    <pattern id="nhGrid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M40 0H0v40" fill="none" stroke="currentColor" stroke-opacity=".16"/>
    </pattern>
    <filter id="nhGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="4" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <rect width="520" height="300" fill="url(#nhGrid)"/>
  <g class="nh-graph-axis" stroke="currentColor" stroke-opacity=".55" stroke-width="1.4" fill="none">
    <path d="M36 250H486"/><path d="M478 245l8 5-8 5"/>
    <path d="M260 286V26"/><path d="M255 34l5-8 5 8"/>
  </g>
  <g stroke="var(--nh-cyan)" stroke-opacity=".28" stroke-width="1" stroke-dasharray="4 7">
    <path d="M70 70v180"/><path d="M450 70v180"/>
  </g>
  <path d="M70 70 260 250 450 70" fill="none" stroke="var(--nh-cyan)" stroke-width="3.4"
        stroke-linejoin="round" stroke-linecap="round" filter="url(#nhGlow)"/>
  <circle cx="260" cy="250" r="6" fill="var(--nh-pink)"/>
  <circle cx="260" cy="250" r="11" fill="none" stroke="var(--nh-pink)" stroke-opacity=".35"/>
  <g class="nh-graph-label">
    <text x="330" y="52" class="nh-gl-strong">f(x) = |x|</text>
    <text x="24" y="152">左导数 −1</text>
    <text x="404" y="196">右导数 +1</text>
    <text x="270" y="272">0</text>
    <text x="480" y="266">x</text>
    <text x="268" y="24">y</text>
  </g>
</svg>`;

const clockDial = () => {
  const ticks = Array.from({ length: 24 }, (_, i) => {
    const major = i % 6 === 0;
    return `<line x1="60" y1="${major ? 9 : 12}" x2="60" y2="16" transform="rotate(${i * 15} 60 60)" stroke-width="${major ? 1.6 : 1}"/>`;
  }).join('');
  return `<svg viewBox="0 0 120 120" aria-hidden="true">
    <circle cx="60" cy="60" r="54" fill="none" stroke="currentColor" stroke-opacity=".35" stroke-width="1"/>
    <circle cx="60" cy="60" r="47" fill="none" stroke="currentColor" stroke-opacity=".14" stroke-dasharray="2 5"/>
    <g class="nh-clock-ticks" stroke="currentColor" stroke-opacity=".6">${ticks}</g>
    <line class="nh-needle-min" x1="60" y1="60" x2="60" y2="24" stroke="var(--nh-pink)" stroke-width="2" stroke-linecap="round"/>
    <line class="nh-needle-sec" x1="60" y1="60" x2="60" y2="17" stroke="var(--nh-cyan)" stroke-width="1.2" stroke-linecap="round"/>
    <circle cx="60" cy="60" r="3.4" fill="var(--nh-cyan)"/>
  </svg>`;
};

/* ---------- 页面结构 ---------- */

const steps = [
  ['提出疑问', '从真正困惑的地方开始'],
  ['找到依据', '对照定义与适用条件'],
  ['尝试解释', '按需要，逐步展开提示'],
  ['小测复练', '用新的情境检验理解']
];

const principles = [
  ['解释可以回到出处', '每个示例都关联自编札记中的具体章节，可以查看完整依据。'],
  ['帮助的深度，由你决定', '从检查条件到关键步骤，三级提示逐层展开，也可以主动查看解析。'],
  ['学习记录，有据可查', '区分独立答对与借助提示完成，给出下一次复练的理由。']
];

const stats = [
  ['06', '', '自编知识点'],
  ['02', '', '门课程'],
  ['03', '', '级分层提示'],
  ['05', '<sup>min</sup>', '单题预计用时']
];

const firstTopic = courseId => topics.find(t => t.courseId === courseId)?.id ?? topics[0].id;

export function renderNeoHome() {
  return `
  <section class="nh-hero" aria-labelledby="nh-hero-title">
    <div class="nh-hero-bg" aria-hidden="true">
      <i class="nh-slab nh-slab-pink" data-parallax="0.1"></i>
      <i class="nh-slab nh-slab-cyan" data-parallax="0.18"></i>
      <i class="nh-slab nh-slab-ink" data-parallax="0.26"></i>
      <span class="nh-ghost" data-parallax="0.08">据</span>
      <span class="nh-wordmark" data-parallax="0.16">EVIDENCE</span>
      <span class="nh-wordmark-cn" data-parallax="0.24">依据</span>
    </div>

    <div class="nh-wrap nh-hero-grid">
      <div class="nh-hero-copy">
        <div class="nh-kicker" data-stagger style="--i:0"><span class="nh-ping" aria-hidden="true"></span>开源助学项目 · V0.2 · <b>DEEPSEEK</b></div>
        <div class="nh-title-slab" data-tilt data-stagger style="--i:1">
          <h1 class="nh-title" id="nh-hero-title">
            <span class="nh-title-line">每一步理解，</span>
            <span class="nh-title-line nh-title-accent" data-text="都有依据。">都有<span class="nh-mark">依据。</span></span>
          </h1>
        </div>
        <p class="nh-lead" data-stagger style="--i:2">从一个“为什么”开始。找到<em>课程依据</em>，沿着提示独立思考，<br class="nh-br">再用一道新题检验理解。</p>
        <div class="nh-cta" data-stagger style="--i:3">
          <a class="nh-btn nh-btn-primary" href="#chat"><span>打开 AI 学习助手</span><i aria-hidden="true">↗</i></a>
          <a class="nh-btn nh-btn-ghost" href="#about"><span>了解项目</span><i aria-hidden="true">→</i></a>
        </div>
        <ul class="nh-meta" data-stagger style="--i:4">
          <li>AI 由后台接入</li><li>记录保存在本机</li><li>MIT 开源</li>
        </ul>
      </div>

      <div class="nh-board-wrap">
        <div class="nh-clock" aria-hidden="true">
          ${clockDial()}
          <div class="nh-clock-read"><b class="nh-clock-time">00:00</b><i class="nh-clock-label">DAYLIGHT</i></div>
        </div>
        <span class="nh-tape" aria-hidden="true">STUDY / EVIDENCE</span>
        <div class="nh-board" data-tilt data-stagger style="--i:2">
          <span class="nh-corner tl" aria-hidden="true"></span><span class="nh-corner tr" aria-hidden="true"></span>
          <span class="nh-corner bl" aria-hidden="true"></span><span class="nh-corner br" aria-hidden="true"></span>
          <div class="nh-board-head"><span class="nh-board-title">一个值得想清楚的问题</span><span class="nh-tag">01 / 数学分析</span></div>
          <h2 class="nh-board-q">连续，就一定可导吗？</h2>
          ${graph()}
          <div class="nh-board-foot"><span class="nh-chip-evi">有依据地思考</span><span>定义 → 反例 → 验证</span></div>
        </div>
        <div class="nh-note" data-tilt>
          <span aria-hidden="true">↳</span>
          <div><strong>先看条件，再下结论。</strong><small>换个角度，理解就近了一步。</small></div>
        </div>
      </div>
    </div>

    <div class="nh-scroll" aria-hidden="true"><span>SCROLL</span><i></i></div>
  </section>

  <section class="nh-process" aria-label="学习路径的四个步骤">
    <div class="nh-wrap nh-process-inner">
      ${steps.map(([title, note], i) => `<div class="nh-step" data-reveal style="--d:${i}">
        <span class="nh-step-no">0${i + 1}</span>
        <div><strong>${title}</strong><small>${note}</small></div>
        <i class="nh-step-arrow" aria-hidden="true">→</i>
      </div>`).join('')}
    </div>
  </section>

  <section class="nh-courses" aria-labelledby="nh-courses-title">
    <div class="nh-wrap">
      <header class="nh-sec-head" data-reveal>
        <div>
          <span class="nh-eyebrow">EXPLORE THE COURSES</span>
          <h2 class="nh-h2" id="nh-courses-title">选一门课，<br>从一个问题开始。</h2>
        </div>
        <p class="nh-sec-note">两门课程，一套学习方法。<br>当前开放 <b>6</b> 个自编知识点。</p>
      </header>
      <div class="nh-course-grid">
        ${courses.map((c, i) => `<a class="nh-course" href="#learn/${firstTopic(c.id)}" data-tone="${esc(c.color)}" data-tilt data-reveal style="--d:${i}">
          <span class="nh-course-no" aria-hidden="true">0${i + 1}</span>
          <div class="nh-course-top">
            <span class="nh-course-sym" aria-hidden="true">${esc(c.symbol)}</span>
            <span class="nh-course-tag">3 个知识点 · 可体验</span>
          </div>
          <span class="nh-eyebrow">${esc(c.en)}</span>
          <h3>${esc(c.title)}</h3>
          <p>${esc(c.subtitle)}</p>
          <div class="nh-course-foot"><span>${esc(c.chapters)}</span><span class="nh-arrow" aria-hidden="true">↗</span></div>
        </a>`).join('')}
      </div>
    </div>
  </section>

  <section class="nh-philosophy" aria-labelledby="nh-phi-title">
    <div class="nh-wrap nh-phi-grid">
      <div class="nh-phi-copy" data-reveal>
        <span class="nh-eyebrow">LEARN WITH EVIDENCE</span>
        <h2 class="nh-h2" id="nh-phi-title">把“看懂了”，<br>变成“我能解释”。</h2>
        <p>学习不止于看到答案。留下你的思路，让每一次提示和作答都有迹可循。</p>
        <a class="nh-link" href="#learn/continuity">体验完整学习流程 <i aria-hidden="true">→</i></a>
        <span class="nh-stamp" aria-hidden="true">VERIFIED<br>EVIDENCE</span>
      </div>
      <ol class="nh-phi-list">
        ${principles.map(([title, note], i) => `<li data-reveal style="--d:${i}">
          <span class="nh-phi-no">0${i + 1}</span>
          <div><h3>${title}</h3><p>${note}</p></div>
        </li>`).join('')}
      </ol>
    </div>
  </section>

  <section class="nh-proof" aria-label="项目数据">
    <div class="nh-wrap nh-proof-grid">
      ${stats.map(([num, sup, label], i) => `<div class="nh-stat" data-reveal style="--d:${i}">
        <b class="nh-num" data-to="${Number(num)}" data-pad="2" aria-label="${Number(num)}">0</b>
        <span>${label}</span>
      </div>`).join('')}
    </div>
  </section>

  <section class="nh-open" aria-labelledby="nh-open-title">
    <div class="nh-wrap">
      <div class="nh-open-inner" data-reveal>
        <div class="nh-marquee" aria-hidden="true"><span>OPEN SOURCE ✦ MIT LICENSE ✦ DEEPSEEK POWERED ✦ EVIDENCE FIRST ✦</span><span>OPEN SOURCE ✦ MIT LICENSE ✦ DEEPSEEK POWERED ✦ EVIDENCE FIRST ✦</span></div>
        <h2 id="nh-open-title">一个持续生长的开源学习项目。</h2>
        <p>已接入 DeepSeek 引导式对话，持续完善课程资料与可核验的反馈。代码与自编示例按 MIT 许可开放。</p>
        <a class="nh-btn nh-btn-light" href="https://github.com/MinnerLee/xueyouju-web" target="_blank" rel="noopener noreferrer"><span>查看源代码</span><i aria-hidden="true">↗</i></a>
      </div>
    </div>
  </section>

  <div class="nh-hud" aria-hidden="true">
    <strong>View / Explore</strong>
    <span>Command</span>
    <em>Ⓐ 打开　Ⓑ 返回</em>
  </div>`;
}

/* ---------- 全站动效壳层（只初始化一次） ---------- */

let shellReady = false;

export function initNeoShell() {
  if (shellReady) return;
  shellReady = true;

  const layer = document.createElement('div');
  layer.className = 'nh-fx nh-fx-scan';
  layer.setAttribute('aria-hidden', 'true');
  const grain = document.createElement('div');
  grain.className = 'nh-fx nh-fx-grain';
  grain.setAttribute('aria-hidden', 'true');
  const vignette = document.createElement('div');
  vignette.className = 'nh-fx nh-fx-vignette';
  vignette.setAttribute('aria-hidden', 'true');
  const spot = document.createElement('div');
  spot.className = 'nh-spot';
  spot.setAttribute('aria-hidden', 'true');
  const wipe = document.createElement('div');
  wipe.className = 'nh-wipe';
  wipe.setAttribute('aria-hidden', 'true');
  wipe.innerHTML = '<span></span><span></span><span></span>';
  document.body.classList.add('neo');
  document.body.append(spot, layer, grain, vignette, wipe);

  /* 鼠标跟随光斑 */
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches && !reduced()) {
    let targetX = 0, targetY = 0, currentX = 0, currentY = 0, raf = 0;
    const move = event => {
      targetX = event.clientX;
      targetY = event.clientY;
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const tick = () => {
      currentX += (targetX - currentX) * 0.14;
      currentY += (targetY - currentY) * 0.14;
      spot.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
      raf = Math.abs(targetX - currentX) + Math.abs(targetY - currentY) > 0.4 ? requestAnimationFrame(tick) : 0;
    };
    window.addEventListener('pointermove', move, { passive: true });
  }

  /* 斜切擦除转场：先把整屏盖实，再换页，最后揭开 —— 避免中途露出新页面 */
  const isReduced = reduced();
  let wiping = false;
  let wipeTimer = 0;

  const coverAndGo = hash => {
    if (wiping) return;
    if (isReduced) { if (hash) location.hash = hash; return; }
    wiping = true;
    window.clearTimeout(wipeTimer);
    document.body.classList.remove('nh-enter');
    wipe.classList.remove('is-revealing', 'is-covering');
    void wipe.offsetWidth;
    wipe.classList.add('is-covering');
    // 覆盖动画：300ms + 80ms 级联，盖满后再切页
    wipeTimer = window.setTimeout(() => {
      if (hash) location.hash = hash;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          document.body.classList.add('nh-enter');
          wipe.classList.add('is-revealing');
          wipeTimer = window.setTimeout(() => {
            wipe.classList.remove('is-covering', 'is-revealing');
            document.body.classList.remove('nh-enter');
            wiping = false;
          }, 400);
        });
      });
    }, 300);
  };

  const playWipe = hash => {
    if (!hash || hash === location.hash.slice(1)) return;
    document.body.classList.add('nh-instant');
    coverAndGo(hash);
  };

  document.addEventListener('click', event => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest('a[href^="#"]');
    if (!link) return;
    const href = link.getAttribute('href');
    if (!href || href === '#main' || href === '#') return;
    const next = href.slice(1);
    if (next === location.hash.slice(1)) return;
    event.preventDefault();
    playWipe(next);
  }, true);

  // 前进/后退、直接改 hash：页面已经换了，补一个「揭开」动作把切换盖住
  window.addEventListener('hashchange', () => {
    if (wiping || isReduced) return;
    window.clearTimeout(wipeTimer);
    wipe.classList.remove('is-covering');
    void wipe.offsetWidth;
    wipe.classList.add('is-revealing');
    document.body.classList.add('nh-enter');
    wipeTimer = window.setTimeout(() => {
      wipe.classList.remove('is-revealing');
      document.body.classList.remove('nh-enter');
    }, 460);
  });

  // 首次进入：播放一次揭幕
  if (!isReduced) {
    wipe.classList.add('is-revealing');
    document.body.classList.add('nh-enter');
    wipeTimer = window.setTimeout(() => {
      wipe.classList.remove('is-revealing');
      document.body.classList.remove('nh-enter');
    }, 520);
  }

}

/* ---------- 首页交互 ---------- */

export function mountNeoHome(main) {
  const root = main.querySelector('.nh-hero');
  if (!root) return () => {};

  const timers = new Set();
  const later = (fn, ms) => { const id = window.setTimeout(fn, ms); timers.add(id); return id; };

  // 1. 入场：首次加载错峰弹出；路由切换时直接就位（避免退场瞬间露出空白）
  if (document.body.classList.contains('nh-instant')) {
    document.body.classList.remove('nh-ready');
  } else {
    requestAnimationFrame(() => document.body.classList.add('nh-ready'));
  }

  // 2. 滚动显现
  const revealItems = [...main.querySelectorAll('[data-reveal]')];
  let revealObserver = null;
  if (revealItems.length) {
    if (reduced() || !('IntersectionObserver' in window)) {
      revealItems.forEach(el => el.classList.add('nh-in'));
    } else {
      revealObserver = new IntersectionObserver(entries => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add('nh-in');
          revealObserver.unobserve(entry.target);
        }
      }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });
      revealItems.forEach(el => revealObserver.observe(el));
    }
  }

  // 3. 数字滚动
  const counterObserver = ('IntersectionObserver' in window && !reduced())
    ? new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        counterObserver.unobserve(entry.target);
        runCounter(entry.target);
      }
    }, { threshold: 0.5 })
    : null;
  const runCounter = el => {
    const to = Number(el.dataset.to) || 0;
    const pad = Number(el.dataset.pad) || 0;
    const start = performance.now();
    const duration = 950;
    const frame = now => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      const value = Math.round(to * eased);
      el.textContent = String(value).padStart(pad, '0');
      if (p < 1) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  };
  main.querySelectorAll('.nh-num').forEach(el => {
    if (counterObserver) counterObserver.observe(el);
    else el.textContent = String(Number(el.dataset.to) || 0).padStart(Number(el.dataset.pad) || 0, '0');
  });

  // 4. 倾斜交互
  const tiltTargets = [...main.querySelectorAll('[data-tilt]')];
  const tiltHandlers = [];
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches && !reduced()) {
    for (const el of tiltTargets) {
      const move = event => {
        const rect = el.getBoundingClientRect();
        const px = (event.clientX - rect.left) / rect.width - 0.5;
        const py = (event.clientY - rect.top) / rect.height - 0.5;
        el.style.setProperty('--nh-ty', `${px * 7}deg`);
        el.style.setProperty('--nh-tx', `${-py * 7}deg`);
        el.style.setProperty('--nh-lift', '-2px');
      };
      const leave = () => {
        el.style.setProperty('--nh-ty', '0deg');
        el.style.setProperty('--nh-tx', '0deg');
        el.style.setProperty('--nh-lift', '0px');
      };
      el.addEventListener('pointermove', move);
      el.addEventListener('pointerleave', leave);
      tiltHandlers.push([el, move, leave]);
    }
  }

  // 5. 视差 + 指针跟随（用 translate 属性，避免覆盖 CSS 的旋转）
  const parallax = [...main.querySelectorAll('[data-parallax]')];
  let rafId = 0;
  let pointerX = 0;
  let pointerY = 0;
  const applyParallax = () => {
    rafId = 0;
    const y = window.scrollY;
    for (const el of parallax) {
      const factor = Number(el.dataset.parallax) || 0;
      el.style.setProperty('--nh-py', `${(y * factor + pointerY * factor * 40).toFixed(2)}px`);
      el.style.setProperty('--nh-px', `${(pointerX * factor * 60).toFixed(2)}px`);
    }
  };
  const onScroll = () => { if (!rafId) rafId = requestAnimationFrame(applyParallax); };
  const onPointer = event => {
    pointerX = (event.clientX / window.innerWidth - 0.5) * 2;
    pointerY = (event.clientY / window.innerHeight - 0.5) * 2;
    if (!rafId) rafId = requestAnimationFrame(applyParallax);
  };
  if (parallax.length && !reduced()) {
    window.addEventListener('scroll', onScroll, { passive: true });
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) window.addEventListener('pointermove', onPointer, { passive: true });
  }

  // 6. 影时间时钟
  const timeEl = main.querySelector('.nh-clock-time');
  const labelEl = main.querySelector('.nh-clock-label');
  const minNeedle = main.querySelector('.nh-needle-min');
  const secNeedle = main.querySelector('.nh-needle-sec');
  const tickClock = () => {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    if (timeEl) timeEl.textContent = `${hh}:${mm}`;
    const dark = document.documentElement.dataset.theme === 'dark';
    if (labelEl) labelEl.textContent = dark ? 'DARK HOUR' : 'DAYLIGHT';
    if (minNeedle) minNeedle.setAttribute('transform', `rotate(${(now.getMinutes() + now.getSeconds() / 60) * 6} 60 60)`);
    if (secNeedle) secNeedle.setAttribute('transform', `rotate(${now.getSeconds() * 6} 60 60)`);
  };
  tickClock();
  const clockId = window.setInterval(tickClock, 1000);

  // 7. 首屏波浪：hero 高度跟随视口（移动端浏览器地址栏）
  const setHeroHeight = () => root.style.setProperty('--nh-vh', `${window.innerHeight * 0.01}px`);
  setHeroHeight();
  window.addEventListener('resize', setHeroHeight);

  return () => {
    document.body.classList.remove('nh-ready');
    revealObserver?.disconnect();
    counterObserver?.disconnect();
    window.clearInterval(clockId);
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('pointermove', onPointer);
    window.removeEventListener('resize', setHeroHeight);
    for (const [el, move, leave] of tiltHandlers) {
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerleave', leave);
    }
    for (const id of timers) window.clearTimeout(id);
    if (rafId) cancelAnimationFrame(rafId);
  };
}
