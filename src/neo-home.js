import { courses, topics } from './courses.js';
import { playSfx } from './shell.js';

const esc = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- 装饰图形（原创 SVG，未使用任何游戏素材） ---------- */

const graph = () => `<svg class="nh-graph" viewBox="0 0 520 300" role="img" aria-label="绝对值函数图像：在原点连续，左右两侧斜率不同">
  <defs>
    <pattern id="nhGrid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M40 0H0v40" fill="none" stroke="currentColor" stroke-opacity=".14"/>
    </pattern>
  </defs>
  <rect width="520" height="300" fill="url(#nhGrid)"/>
  <g class="nh-graph-axis" stroke="currentColor" stroke-opacity=".5" stroke-width="1.4" fill="none">
    <path d="M36 250H486"/><path d="M478 245l8 5-8 5"/>
    <path d="M260 286V26"/><path d="M255 34l5-8 5 8"/>
  </g>
  <g class="nh-graph-guides" stroke="currentColor" stroke-opacity=".22" stroke-width="1" stroke-dasharray="4 7">
    <path d="M70 70v180"/><path d="M450 70v180"/>
  </g>
  <path class="nh-graph-fn" d="M70 70 260 250 450 70" fill="none" stroke-width="3.4"
        stroke-linejoin="round" stroke-linecap="round"/>
  <circle class="nh-graph-dot" cx="260" cy="250" r="6"/>
  <circle class="nh-graph-ring" cx="260" cy="250" r="11" fill="none" stroke-width="1.4"/>
  <g class="nh-graph-label">
    <text x="330" y="52" class="nh-gl-strong">f(x) = |x|</text>
    <text x="24" y="152">左导数 −1</text>
    <text x="404" y="196">右导数 +1</text>
    <text x="270" y="272">0</text>
    <text x="480" y="266">x</text>
    <text x="268" y="24">y</text>
  </g>
</svg>`;

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
  ['05', 'min', '单题预计用时']
];

const firstTopic = courseId => topics.find(t => t.courseId === courseId)?.id ?? topics[0].id;

export function renderNeoHome() {
  return `
  <section class="nh-hero" aria-labelledby="nh-hero-title">
    <div class="nh-hero-decor" aria-hidden="true">
      <span class="nh-ghost">据</span>
      <span class="nh-wordmark">EVIDENCE</span>
    </div>

    <div class="nh-wrap nh-hero-grid">
      <div class="nh-hero-copy">
        <p class="nh-kicker" data-stagger style="--i:0"><span class="nh-kicker-mark" aria-hidden="true"></span>开源助学项目 · V0.2 · <b>DEEPSEEK</b></p>
        <div class="nh-title-slab" data-stagger style="--i:1">
          <span class="nh-title-en" aria-hidden="true">EVIDENCE FIRST</span>
          <h1 class="nh-title" id="nh-hero-title">
            <span class="nh-title-line">每一步理解，</span>
            <span class="nh-title-line nh-title-accent">都有<span class="nh-mark">依据。</span></span>
          </h1>
        </div>
        <p class="nh-lead" data-stagger style="--i:2">从一个“为什么”开始。找到<em>课程依据</em>，沿着提示独立思考，再用一道新题检验理解。</p>
        <div class="nh-cta" data-stagger style="--i:3">
          <a class="button primary" href="#chat"><span>打开 AI 学习助手</span><i aria-hidden="true">↗</i></a>
          <a class="button secondary" href="#about"><span>了解项目</span><i aria-hidden="true">→</i></a>
        </div>
        <ul class="nh-meta" data-stagger style="--i:4">
          <li>AI 由后台接入</li><li>记录保存在本机</li><li>MIT 开源</li>
        </ul>
      </div>

      <div class="nh-board-wrap" data-stagger style="--i:2">
        <div class="nh-board">
          <span class="nh-corner tl" aria-hidden="true"></span><span class="nh-corner tr" aria-hidden="true"></span>
          <span class="nh-corner bl" aria-hidden="true"></span><span class="nh-corner br" aria-hidden="true"></span>
          <div class="nh-board-head"><span class="nh-board-title">一个值得想清楚的问题</span><span class="nh-tag">01 / 数学分析</span></div>
          <h2 class="nh-board-q">连续，就一定可导吗？</h2>
          ${graph()}
          <div class="nh-board-foot"><span class="nh-chip-evi">有依据地思考</span><span>定义 → 反例 → 验证</span></div>
        </div>
        <div class="nh-note">
          <span aria-hidden="true">↳</span>
          <div><strong>先看条件，再下结论。</strong><small>换个角度，理解就近了一步。</small></div>
        </div>
      </div>
    </div>

    <div class="nh-wrap nh-hero-foot" aria-hidden="true"><span>SCROLL TO SELECT</span><i></i><span>COMMAND / 01</span></div>
  </section>

  <section class="nh-process" aria-label="学习路径的四个步骤">
    <div class="nh-wrap">
      <div class="nh-process-inner" data-reveal>
        ${steps.map(([title, note], i) => `<div class="nh-step">
          <span class="nh-step-no">0${i + 1}</span>
          <div><strong>${title}</strong><small>${note}</small></div>
          <i class="nh-step-arrow" aria-hidden="true">→</i>
        </div>`).join('')}
      </div>
    </div>
  </section>

  <section class="nh-courses" aria-labelledby="nh-courses-title">
    <div class="nh-wrap">
      <header class="nh-menu-head" data-reveal>
        <div>
          <span class="nh-eyebrow">SELECT COURSE / COMMAND</span>
          <h2 class="nh-h2" id="nh-courses-title">选一门课，<br>从一个问题开始。</h2>
        </div>
        <p class="nh-sec-note">两门课程，一套学习方法。<br>当前开放 <b>6</b> 个自编知识点。</p>
      </header>

      <div class="nh-menu-body">
        <div class="nh-menu-col" data-reveal>
          <div class="nh-menu-list" id="nh-menu" role="listbox" aria-label="课程菜单" tabindex="0">
            ${courses.map((c, i) => {
              const count = topics.filter(t => t.courseId === c.id).length;
              const first = firstTopic(c.id);
              return `<a class="nh-menu-item${i === 0 ? ' is-active' : ''}" role="option" aria-selected="${i === 0}" tabindex="0"
                href="#learn/${first}" data-index="${i}"
                data-en="${esc(c.en)}" data-sym="${esc(c.symbol)}" data-title="${esc(c.title)}"
                data-sub="${esc(c.subtitle)}" data-chapters="${esc(c.chapters)}" data-count="${count}">
                <span class="nh-mi-no" aria-hidden="true">0${i + 1}</span>
                <span class="nh-mi-text">
                  <span class="nh-mi-en">${esc(c.en)}</span>
                  <span class="nh-mi-label">${esc(c.title)}</span>
                </span>
                <span class="nh-mi-count" aria-hidden="true"><b>${count}</b> 个知识点</span>
              </a>`;
            }).join('')}
          </div>
          <p class="nh-menu-hint"><kbd>↑</kbd><kbd>↓</kbd> 选择 · <kbd>Enter</kbd> 进入</p>
        </div>

        <aside class="nh-menu-preview" data-reveal aria-live="polite">
          <span class="nh-pv-ghost" aria-hidden="true" data-pv="ghost">MATH</span>
          <div class="nh-pv-top">
            <span class="nh-pv-sym" data-pv="sym">∂</span>
            <span class="nh-pv-count"><b data-pv="count">3</b><small>KNOWLEDGE</small></span>
          </div>
          <span class="nh-pv-en" data-pv="en">ENGINEERING MATHEMATICS</span>
          <h3 class="nh-pv-title" data-pv="title">工科数学分析</h3>
          <p class="nh-pv-sub" data-pv="sub">从条件出发，把每一步推理说清楚。</p>
          <dl class="nh-pv-meta">
            <div><dt>CHAPTERS</dt><dd data-pv="chapters">极限与连续 / 导数 / 中值定理</dd></div>
            <div><dt>STATUS</dt><dd>可体验 · 自编题库</dd></div>
          </dl>
          <span class="nh-pv-cta" aria-hidden="true">进入课程 <i>→</i></span>
        </aside>
      </div>
    </div>
  </section>

  <section class="nh-philosophy" aria-labelledby="nh-phi-title">
    <div class="nh-wrap">
      <div class="nh-phi-shell" data-reveal>
        <div class="nh-phi-copy">
          <span class="nh-eyebrow">LEARN WITH EVIDENCE</span>
          <h2 class="nh-h2" id="nh-phi-title">把“看懂了”，<br>变成“我能解释”。</h2>
          <p>学习不止于看到答案。留下你的思路，让每一次提示和作答都有迹可循。</p>
          <a class="nh-link" href="#learn/continuity">体验完整学习流程 <i aria-hidden="true">→</i></a>
          <span class="nh-stamp" aria-hidden="true">VERIFIED<br>EVIDENCE</span>
        </div>
        <ol class="nh-phi-list">
          ${principles.map(([title, note], i) => `<li style="--d:${i}">
            <span class="nh-phi-no" aria-hidden="true">0${i + 1}</span>
            <div><h3>${title}</h3><p>${note}</p></div>
          </li>`).join('')}
        </ol>
      </div>
    </div>
  </section>

  <section class="nh-proof" aria-label="项目数据">
    <div class="nh-wrap">
      <div class="nh-proof-grid" data-reveal>
        ${stats.map(([num, sup, label], i) => `<div class="nh-stat" style="--d:${i}">
          <b class="nh-num">${num}${sup ? `<sup>${sup}</sup>` : ''}</b>
          <span>${label}</span>
        </div>`).join('')}
      </div>
    </div>
  </section>

  <section class="nh-open" aria-labelledby="nh-open-title">
    <div class="nh-wrap">
      <div class="nh-open-inner" data-reveal>
        <div class="nh-marquee" aria-hidden="true">
          <span>OPEN SOURCE</span><i>✦</i>
          <span>MIT LICENSE</span><i>✦</i>
          <span>DEEPSEEK POWERED</span><i>✦</i>
          <span>EVIDENCE FIRST</span>
        </div>
        <h2 id="nh-open-title">一个持续生长的开源学习项目。</h2>
        <p>已接入 DeepSeek 引导式对话，持续完善课程资料与可核验的反馈。代码与自编示例按 MIT 许可开放。</p>
        <a class="button primary" href="https://github.com/MinnerLee/xueyouju-web" target="_blank" rel="noopener noreferrer"><span>查看源代码</span><i aria-hidden="true">↗</i></a>
      </div>
    </div>
  </section>`;
}


/* ---------- 首页交互 ---------- */

export function mountNeoHome(main) {
  const root = main.querySelector('.nh-hero');
  if (!root) return () => {};

  // 1. 入场：首次加载错峰淡入；路由切换时直接就位
  if (document.body.classList.contains('nh-instant')) {
    document.body.classList.remove('nh-ready');
  } else {
    requestAnimationFrame(() => document.body.classList.add('nh-ready'));
  }

  // 2. 滚动显现：每块只进场一次
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

  // 3. 游戏式课程菜单：hover / 键盘切换选中项，右侧预览联动
  const menu = main.querySelector('#nh-menu');
  const menuItems = menu ? [...menu.querySelectorAll('.nh-menu-item')] : [];
  const preview = main.querySelector('.nh-menu-preview');
  const menuHandlers = [];
  if (menu && menuItems.length) {
    const pv = key => preview?.querySelector('[data-pv="' + key + '"]');
    const ghostMap = { math: 'MATH', c: 'C / CODE' };
    const setActive = (index, withSound) => {
      menuItems.forEach((item, i) => {
        const active = i === index;
        item.classList.toggle('is-active', active);
        item.setAttribute('aria-selected', String(active));
      });
      const item = menuItems[index];
      if (!item || !preview) return;
      const fields = {
        sym: item.dataset.sym,
        en: item.dataset.en,
        title: item.dataset.title,
        sub: item.dataset.sub,
        chapters: item.dataset.chapters,
        count: item.dataset.count,
        ghost: ghostMap[item.href.includes('math') || item.dataset.en.includes('ENGINEERING') ? 'math' : 'c']
      };
      for (const [key, value] of Object.entries(fields)) {
        const el = pv(key);
        if (el && value != null) el.textContent = value;
      }
      if (withSound) playSfx('select');
    };

    menuItems.forEach((item, i) => {
      const enter = () => setActive(i, false);
      const focus = () => setActive(i, false);
      item.addEventListener('pointerenter', enter);
      item.addEventListener('focus', focus);
      menuHandlers.push([item, 'pointerenter', enter], [item, 'focus', focus]);
    });

    const onKey = event => {
      const current = menuItems.findIndex(item => item.classList.contains('is-active'));
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        const next = (current + (event.key === 'ArrowDown' ? 1 : -1) + menuItems.length) % menuItems.length;
        setActive(next, true);
        menuItems[next].focus({ preventScroll: true });
      } else if (event.key === 'Enter' && document.activeElement === menu) {
        event.preventDefault();
        menuItems[current]?.click();
      }
    };
    menu.addEventListener('keydown', onKey);
    menuHandlers.push([menu, 'keydown', onKey]);
    setActive(0, false);
  }

  return () => {
    document.body.classList.remove('nh-ready');
    revealObserver?.disconnect();
    for (const [el, type, fn] of menuHandlers) el.removeEventListener(type, fn);
  };
}
