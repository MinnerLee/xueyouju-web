/* ==========================================================================
   NEO BACKGROUND · 「影时间」动态背景（Canvas 实时绘制，无视频/图片素材）
   组成：主题渐变底 + 斜向缓慢光带 + 上浮粒子 + 月/日晕 + 指针视差
   ========================================================================== */

const PALETTES = {
  light: {
    base: ['#0a74e0', '#015fcc', '#013f8e'],
    beam: 'rgba(255, 255, 255, 0.1)',
    beamSoft: 'rgba(160, 245, 255, 0.07)',
    glowDay: 'rgba(255, 255, 255, 0.55)',
    orb: 'rgba(255, 255, 255, 0.85)',
    orbHalo: 'rgba(180, 245, 255, 0.20)',
    dust: 'rgba(225, 248, 255, 0.65)',
    accent: 'rgba(253, 119, 217, 0.55)'
  },
  dark: {
    base: ['#073579', '#031f64', '#010a26'],
    beam: 'rgba(150, 235, 255, 0.085)',
    beamSoft: 'rgba(90, 200, 255, 0.06)',
    glowDay: 'rgba(120, 220, 255, 0.30)',
    orb: 'rgba(210, 245, 255, 0.7)',
    orbHalo: 'rgba(46, 230, 255, 0.16)',
    dust: 'rgba(140, 225, 255, 0.55)',
    accent: 'rgba(255, 79, 176, 0.6)'
  }
};

function makeGlowSprite(color) {
  const size = 32;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, color);
  grad.addColorStop(0.45, color.replace(/[\d.]+\)$/, '0.28)'));
  grad.addColorStop(1, color.replace(/[\d.]+\)$/, '0)'));
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  return c;
}

export function mountNeoBackground() {
  if (document.querySelector('.nh-bg')) return () => {};
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canvas = document.createElement('canvas');
  canvas.className = 'nh-bg';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.prepend(canvas);
  const ctx = canvas.getContext('2d');

  let width = 0;
  let height = 0;
  let dpr = 1;
  let palette = PALETTES.light;
  let baseGradient = null;
  let moonGradient = null;
  let beams = [];
  let particles = [];
  let shards = [];

  const spriteCyan = makeGlowSprite('rgba(170, 240, 255, 0.9)');
  const spritePink = makeGlowSprite('rgba(255, 120, 210, 0.85)');

  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };

  const buildScene = () => {
    const theme = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
    palette = PALETTES[theme];

    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    baseGradient = ctx.createRadialGradient(
      width * 0.72, height * 0.16, 0,
      width * 0.5, height * 0.5, Math.max(width, height) * 0.95
    );
    baseGradient.addColorStop(0, palette.base[0]);
    baseGradient.addColorStop(0.55, palette.base[1]);
    baseGradient.addColorStop(1, palette.base[2]);

    moonGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, Math.max(width, height) * 0.5);
    moonGradient.addColorStop(0, palette.orbHalo);
    moonGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

    // 斜向光带
    beams = [];
    const count = 5;
    for (let i = 0; i < count; i++) {
      const w = Math.max(160, width * (0.18 + Math.random() * 0.22));
      const startX = -width * 0.4 + (i + Math.random() * 0.6) * (width * 1.25 / count);
      const grad = ctx.createLinearGradient(-w / 2, 0, w / 2, 0);
      grad.addColorStop(0, 'rgba(255,255,255,0)');
      grad.addColorStop(0.45, i % 2 ? palette.beamSoft : palette.beam);
      grad.addColorStop(0.62, i % 2 ? palette.beam : palette.beamSoft);
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      beams.push({
        x: startX,
        width: w,
        angle: (-32 + Math.random() * 6) * Math.PI / 180,
        speed: 3 + Math.random() * 6,
        alpha: 0.55 + Math.random() * 0.45,
        gradient: grad
      });
    }

    // 漂浮碎片
    shards = Array.from({ length: width < 700 ? 4 : 7 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: 18 + Math.random() * 46,
      rot: Math.random() * Math.PI,
      spin: (Math.random() - 0.5) * 0.25,
      vy: 2 + Math.random() * 5,
      drift: (Math.random() - 0.5) * 6,
      alpha: 0.05 + Math.random() * 0.07
    }));

    // 上浮粒子
    const target = width < 700 ? 40 : 96;
    particles = Array.from({ length: target }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: 0.6 + Math.random() * 2.2,
      vy: 3 + Math.random() * 12,
      sway: 0.4 + Math.random() * 1.6,
      phase: Math.random() * Math.PI * 2,
      wobble: 0.4 + Math.random() * 0.9,
      alpha: 0.18 + Math.random() * 0.5,
      pink: Math.random() < 0.12
    }));
  };

  const draw = (time, dt) => {
    if (!width) return;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = baseGradient;
    ctx.fillRect(0, 0, width, height);

    const safeDt = Math.min(dt, 0.05);

    // 指针视差平滑
    pointer.x += (pointer.tx - pointer.x) * 0.04;
    pointer.y += (pointer.ty - pointer.y) * 0.04;

    // 光带
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const beam of beams) {
      beam.x += beam.speed * safeDt;
      if (beam.x - beam.width > width + 80) beam.x = -beam.width - 80;
      ctx.save();
      ctx.translate(beam.x + pointer.x * 12, height * 0.5 + pointer.y * 8);
      ctx.rotate(beam.angle);
      ctx.globalAlpha = beam.alpha;
      ctx.fillStyle = beam.gradient;
      ctx.fillRect(-beam.width / 2, -height, beam.width, height * 2.4);
      ctx.restore();
    }
    ctx.restore();

    // 月 / 日晕
    ctx.save();
    ctx.translate(width * 0.78 + pointer.x * 18, height * 0.14 + pointer.y * 14);
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = moonGradient;
    ctx.beginPath();
    ctx.arc(0, 0, Math.max(width, height) * 0.42, 0, Math.PI * 2);
    ctx.fill();
    const pulse = 1 + Math.sin(time * 0.0006) * 0.04;
    ctx.fillStyle = palette.orb;
    ctx.globalAlpha = 0.22;
    ctx.beginPath();
    ctx.arc(0, 0, 34 * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.55;
    ctx.beginPath();
    ctx.arc(0, 0, 13 * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 碎片
    ctx.save();
    for (const s of shards) {
      s.y -= s.vy * safeDt;
      s.x += s.drift * safeDt;
      s.rot += s.spin * safeDt;
      if (s.y < -80) { s.y = height + 60; s.x = Math.random() * width; }
      if (s.x < -80) s.x = width + 60;
      if (s.x > width + 80) s.x = -60;
      ctx.save();
      ctx.translate(s.x + pointer.x * 10, s.y + pointer.y * 8);
      ctx.rotate(s.rot);
      ctx.globalAlpha = s.alpha;
      ctx.strokeStyle = palette.dust;
      ctx.lineWidth = 1.4;
      ctx.strokeRect(-s.size / 2, -s.size / 2, s.size, s.size * 0.62);
      ctx.restore();
    }
    ctx.restore();

    // 粒子
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const p of particles) {
      p.y -= p.vy * safeDt;
      p.phase += p.wobble * safeDt * 2;
      p.x += Math.sin(p.phase) * p.sway * safeDt * 6;
      if (p.y < -12) {
        p.y = height + 12;
        p.x = Math.random() * width;
      }
      if (p.x < -12) p.x = width + 12;
      if (p.x > width + 12) p.x = -12;
      const sprite = p.pink ? spritePink : spriteCyan;
      const size = p.r * 9;
      ctx.globalAlpha = p.alpha * (0.7 + 0.3 * Math.sin(time * 0.001 + p.phase));
      ctx.drawImage(sprite, p.x + pointer.x * 6 - size / 2, p.y + pointer.y * 4 - size / 2, size, size);
    }
    ctx.restore();

    // 底部渐隐，压住画面下缘
    const fade = ctx.createLinearGradient(0, height * 0.72, 0, height);
    fade.addColorStop(0, 'rgba(0,0,0,0)');
    fade.addColorStop(1, 'rgba(0, 12, 40, 0.35)');
    ctx.fillStyle = fade;
    ctx.fillRect(0, height * 0.72, width, height * 0.28);
  };

  let raf = 0;
  let last = 0;
  const loop = now => {
    const dt = last ? (now - last) / 1000 : 0.016;
    last = now;
    draw(now, dt);
    raf = requestAnimationFrame(loop);
  };

  const start = () => {
    if (raf) return;
    last = 0;
    raf = requestAnimationFrame(loop);
  };
  const stop = () => {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  };

  buildScene();
  if (reduced) {
    draw(0, 0);
  } else {
    start();
  }

  const onResize = () => { buildScene(); if (reduced) draw(0, 0); };
  const onPointer = event => {
    pointer.tx = (event.clientX / window.innerWidth - 0.5) * 2;
    pointer.ty = (event.clientY / window.innerHeight - 0.5) * 2;
  };
  const onVisibility = () => { if (document.hidden) stop(); else if (!reduced) start(); };
  const themeObserver = new MutationObserver(() => { buildScene(); if (reduced) draw(0, 0); });

  window.addEventListener('resize', onResize);
  window.addEventListener('pointermove', onPointer, { passive: true });
  document.addEventListener('visibilitychange', onVisibility);
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  return () => {
    stop();
    themeObserver.disconnect();
    window.removeEventListener('resize', onResize);
    window.removeEventListener('pointermove', onPointer);
    document.removeEventListener('visibilitychange', onVisibility);
    canvas.remove();
  };
}
