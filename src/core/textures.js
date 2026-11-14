/**
 * Canvas 程序化贴图：招牌、海报、路面、贩卖机、玻璃高光等。
 * 全部离线生成，不依赖外部资源。
 */
import * as THREE from 'three';

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

function finish(c, { srgb = true, repeat = null } = {}) {
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  tex.anisotropy = 4;
  if (repeat) {
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeat[0], repeat[1]);
  }
  return tex;
}

/** 细微噪点，让大面积色块不显得死板 */
function noise(ctx, w, h, amount = 0.05, seed = 7) {
  let a = seed;
  const rnd = () => {
    a = (a * 16807) % 2147483647;
    return a / 2147483647;
  };
  const n = Math.floor((w * h) / 260);
  for (let i = 0; i < n; i++) {
    const v = rnd();
    ctx.fillStyle = v > 0.5 ? `rgba(255,255,255,${amount})` : `rgba(0,0,0,${amount})`;
    ctx.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 2, 1 + rnd() * 2);
  }
}

function fakeTextLines(ctx, x, y, w, lines, color = 'rgba(255,255,255,0.75)', lh = 12) {
  let a = 12345;
  const rnd = () => {
    a = (a * 16807) % 2147483647;
    return a / 2147483647;
  };
  ctx.fillStyle = color;
  for (let i = 0; i < lines; i++) {
    const lw = w * (0.45 + rnd() * 0.55);
    ctx.fillRect(x, y + i * lh, lw, 3);
  }
}

/* ---------------- 便利店招牌系列 ---------------- */

/** 主招牌横板：青 + 橙条纹（虚构品牌 KOMOREBI 24） */
export function signTexture() {
  const c = makeCanvas(1024, 256);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#f6f1e4';
  ctx.fillRect(0, 0, 1024, 256);
  ctx.fillStyle = '#0ea5a5';
  ctx.fillRect(0, 0, 1024, 46);
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(0, 216, 1024, 40);
  ctx.fillStyle = '#1c2436';
  ctx.font = 'bold 104px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('KOMOREBI 24', 512, 118);
  ctx.font = '36px sans-serif';
  ctx.fillStyle = '#414b63';
  ctx.fillText('コモレビマート　·　24 HOUR CONVENIENCE', 512, 184);
  noise(ctx, 1024, 256, 0.03, 11);
  return finish(c);
}

/** 竖式悬挂招牌 */
export function verticalSignTexture() {
  const c = makeCanvas(256, 768);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#0d9488';
  ctx.fillRect(0, 0, 256, 768);
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(14, 14, 228, 740);
  ctx.fillStyle = '#0d9488';
  const chars = ['コ', 'モ', 'レ', 'ビ'];
  ctx.font = 'bold 78px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  chars.forEach((ch, i) => ctx.fillText(ch, 128, 120 + i * 116));
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(40, 588, 176, 84);
  ctx.fillStyle = '#1c2436';
  ctx.font = 'bold 58px sans-serif';
  ctx.fillText('24h', 128, 632);
  ctx.fillStyle = '#414b63';
  ctx.font = '30px sans-serif';
  ctx.fillText('OPEN', 128, 712);
  return finish(c);
}

/** 门口小灯箱「OPEN 24H」 */
export function openSignTexture() {
  const c = makeCanvas(256, 128);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#101828';
  ctx.fillRect(0, 0, 256, 128);
  ctx.fillStyle = '#22d3ee';
  ctx.font = 'bold 62px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('OPEN 24H', 128, 66);
  return finish(c);
}

/** 雨棚条纹 */
export function awningTexture() {
  const c = makeCanvas(512, 128);
  const ctx = c.getContext('2d');
  const stripeW = 64;
  for (let i = 0; i < 8; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#eef6f4' : '#0fa3a3';
    ctx.fillRect(i * stripeW, 0, stripeW, 128);
  }
  noise(ctx, 512, 128, 0.04, 21);
  return finish(c);
}

/* ---------------- 路面 / 建材 ---------------- */

export function asphaltTexture() {
  const c = makeCanvas(512, 512);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#242a3a';
  ctx.fillRect(0, 0, 512, 512);
  noise(ctx, 512, 512, 0.07, 3);
  // 潮湿水痕
  for (let i = 0; i < 14; i++) {
    const g = ctx.createRadialGradient(
      (i * 137) % 512,
      (i * 211) % 512,
      4,
      (i * 137) % 512,
      (i * 211) % 512,
      60 + (i % 4) * 26
    );
    g.addColorStop(0, 'rgba(10,14,28,0.35)');
    g.addColorStop(1, 'rgba(10,14,28,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 512, 512);
  }
  return finish(c, { repeat: [5, 5] });
}

export function sidewalkTexture() {
  const c = makeCanvas(512, 512);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#4a5266';
  ctx.fillRect(0, 0, 512, 512);
  ctx.strokeStyle = '#3a4256';
  ctx.lineWidth = 5;
  for (let i = 0; i <= 4; i++) {
    ctx.beginPath();
    ctx.moveTo((i * 512) / 4, 0);
    ctx.lineTo((i * 512) / 4, 512);
    ctx.moveTo(0, (i * 512) / 4);
    ctx.lineTo(512, (i * 512) / 4);
    ctx.stroke();
  }
  noise(ctx, 512, 512, 0.05, 9);
  return finish(c, { repeat: [5, 5] });
}

export function interiorFloorTexture() {
  const c = makeCanvas(512, 512);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#d9cdb4';
  ctx.fillRect(0, 0, 512, 512);
  ctx.strokeStyle = '#b9a887';
  ctx.lineWidth = 4;
  for (let i = 0; i <= 4; i++) {
    ctx.beginPath();
    ctx.moveTo((i * 512) / 4, 0);
    ctx.lineTo((i * 512) / 4, 512);
    ctx.moveTo(0, (i * 512) / 4);
    ctx.lineTo(512, (i * 512) / 4);
    ctx.stroke();
  }
  noise(ctx, 512, 512, 0.03, 5);
  return finish(c, { repeat: [3, 3] });
}

export function wallTexture(base = '#2e3448') {
  const c = makeCanvas(256, 256);
  const ctx = c.getContext('2d');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 256, 256);
  noise(ctx, 256, 256, 0.05, 17);
  return finish(c, { repeat: [2, 2] });
}

export function manholeTexture() {
  const c = makeCanvas(256, 256);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#39404f';
  ctx.fillRect(0, 0, 256, 256);
  ctx.strokeStyle = '#252b38';
  ctx.lineWidth = 8;
  for (let r = 24; r <= 112; r += 22) {
    ctx.beginPath();
    ctx.arc(128, 128, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.fillStyle = '#252b38';
  for (let i = 0; i < 12; i++) {
    const ang = (i / 12) * Math.PI * 2;
    ctx.fillRect(120 + Math.cos(ang) * 72, 120 + Math.sin(ang) * 72, 16, 16);
  }
  return finish(c);
}

/* ---------------- 贩卖机 / 冷柜 ---------------- */

export function vendingTexture() {
  const c = makeCanvas(512, 1024);
  const ctx = c.getContext('2d');
  // 机身
  ctx.fillStyle = '#222a3c';
  ctx.fillRect(0, 0, 512, 1024);
  // 顶部品牌带
  ctx.fillStyle = '#e11d48';
  ctx.fillRect(0, 0, 512, 120);
  ctx.fillStyle = '#fff7ed';
  ctx.font = 'bold 64px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('つめた〜い', 256, 62);
  // 饮料陈列（5 x 4 亮格）
  const colors = [
    '#60a5fa',
    '#f472b6',
    '#fbbf24',
    '#34d399',
    '#a78bfa',
    '#fb923c',
    '#22d3ee',
    '#f87171',
  ];
  for (let r = 0; r < 4; r++) {
    for (let col = 0; col < 5; col++) {
      const x = 30 + col * 94;
      const y = 160 + r * 170;
      // 发光货道
      const g = ctx.createLinearGradient(x, y, x, y + 130);
      g.addColorStop(0, '#e8f2ff');
      g.addColorStop(1, '#b8cbe8');
      ctx.fillStyle = g;
      ctx.fillRect(x, y, 82, 130);
      // 瓶身
      ctx.fillStyle = colors[(r * 5 + col) % colors.length];
      ctx.fillRect(x + 18, y + 22, 46, 78);
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.fillRect(x + 24, y + 30, 12, 56);
      // 价签
      ctx.fillStyle = '#fff';
      ctx.fillRect(x + 10, y + 108, 62, 16);
      ctx.fillStyle = '#dc2626';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText('¥' + (110 + ((r * 5 + col) % 5) * 20), x + 41, y + 117);
    }
  }
  // 下部取货口 / 支付区
  ctx.fillStyle = '#141a28';
  ctx.fillRect(24, 852, 464, 64);
  ctx.fillStyle = '#334155';
  ctx.fillRect(24, 936, 464, 64);
  ctx.fillStyle = '#22d3ee';
  ctx.fillRect(360, 948, 100, 40);
  return finish(c);
}

export function fridgeTexture() {
  const c = makeCanvas(512, 512);
  const ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0, '#eaf4ff');
  g.addColorStop(1, '#c7dcf5');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 512, 512);
  const colors = [
    '#60a5fa',
    '#f472b6',
    '#fbbf24',
    '#34d399',
    '#a78bfa',
    '#fb923c',
    '#22d3ee',
    '#f87171',
  ];
  for (let shelf = 0; shelf < 3; shelf++) {
    const y = 40 + shelf * 160;
    for (let i = 0; i < 8; i++) {
      const x = 26 + i * 60;
      ctx.fillStyle = colors[(shelf * 8 + i) % colors.length];
      ctx.fillRect(x, y + 26, 34, 92);
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.fillRect(x + 6, y + 34, 8, 66);
    }
    ctx.fillStyle = 'rgba(120,150,190,0.5)';
    ctx.fillRect(0, y + 128, 512, 10);
  }
  return finish(c);
}

/* ---------------- 玻璃 / 积水 / 光晕 ---------------- */

/** 玻璃：淡蓝底色 + 斜向高光条纹（带 alpha） */
export function glassTexture() {
  const c = makeCanvas(512, 512);
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, 512, 512);
  ctx.fillStyle = 'rgba(168,206,255,0.17)';
  ctx.fillRect(0, 0, 512, 512);
  ctx.save();
  ctx.translate(256, 256);
  ctx.rotate(-Math.PI / 5);
  for (let i = -4; i <= 4; i++) {
    const x = i * 110;
    const g = ctx.createLinearGradient(x - 26, -420, x + 26, 420);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(0.5, `rgba(255,255,255,${i % 2 === 0 ? 0.16 : 0.07})`);
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - 26, -420, 52, 840);
  }
  ctx.restore();
  return finish(c);
}

/** 积水面：深蓝底 + 克制的霓虹倒影条 */
export function wetTexture() {
  const c = makeCanvas(512, 512);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#141c30';
  ctx.fillRect(0, 0, 512, 512);
  const streaks = [
    ['#8fb8e8', 0.34],
    ['#f0c98a', 0.3],
    ['#93d8e8', 0.28],
    ['#e8a8c8', 0.18],
  ];
  for (let i = 0; i < 7; i++) {
    const [color, alpha] = streaks[i % streaks.length];
    const x = 60 + ((i * 121) % 400);
    const g = ctx.createRadialGradient(x, 256, 4, x, 256, 110);
    g.addColorStop(0, color + '99');
    g.addColorStop(1, color + '00');
    ctx.globalAlpha = alpha;
    ctx.fillStyle = g;
    ctx.fillRect(x - 110, 30, 220, 452);
    ctx.globalAlpha = 1;
  }
  // 水面细波纹
  ctx.strokeStyle = 'rgba(200,220,255,0.07)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 10; i++) {
    ctx.beginPath();
    ctx.ellipse(256, 256, 42 + i * 20, 11 + i * 5, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  return finish(c);
}

/** 径向光晕（加法混合贴花） */
export function glowTexture(color = '#ffd9a0') {
  const c = makeCanvas(256, 256);
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(128, 128, 4, 128, 128, 128);
  g.addColorStop(0, color);
  g.addColorStop(0.35, color + '66');
  g.addColorStop(1, color + '00');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  return finish(c);
}

/* ---------------- 海报 / 菜单 / 路牌 ---------------- */

export function posterTexture(seed = 1) {
  const c = makeCanvas(256, 384);
  const ctx = c.getContext('2d');
  const palettes = [
    ['#f43f5e', '#fda4af', '#fff1f2'],
    ['#0ea5e9', '#7dd3fc', '#f0f9ff'],
    ['#f59e0b', '#fcd34d', '#fffbeb'],
    ['#10b981', '#6ee7b7', '#ecfdf5'],
    ['#8b5cf6', '#c4b5fd', '#f5f3ff'],
  ];
  const [main, soft, bg] = palettes[seed % palettes.length];
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 256, 384);
  ctx.fillStyle = main;
  ctx.fillRect(0, 0, 256, 130);
  ctx.fillStyle = soft;
  ctx.beginPath();
  ctx.arc(190, 96, 52, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = bg;
  ctx.font = 'bold 30px sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(['NEW', 'SALE', 'イベント', '限定', 'ギフト'][seed % 5], 18, 22);
  fakeTextLines(ctx, 18, 160, 200, 6, 'rgba(30,41,59,0.55)', 18);
  ctx.fillStyle = main;
  ctx.fillRect(18, 300, 120, 44);
  ctx.fillStyle = bg;
  ctx.font = 'bold 22px sans-serif';
  ctx.textBaseline = 'middle';
  ctx.fillText('チェック', 30, 323);
  noise(ctx, 256, 384, 0.03, seed * 31 + 7);
  return finish(c);
}

export function menuTexture() {
  const c = makeCanvas(512, 256);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#1f2937';
  ctx.fillRect(0, 0, 512, 256);
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(0, 0, 512, 56);
  ctx.fillStyle = '#1f2937';
  ctx.font = 'bold 30px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('お惣菜・ホットスナック', 256, 28);
  const items = ['#f8fafc', '#e2e8f0', '#f1f5f9'];
  for (let i = 0; i < 6; i++) {
    const y = 76 + i * 28;
    ctx.fillStyle = items[i % 3];
    ctx.fillRect(24, y, 300, 16);
    ctx.fillStyle = '#22d3ee';
    ctx.fillRect(360, y, 120, 16);
  }
  return finish(c);
}

export function crossingSignTexture() {
  const c = makeCanvas(256, 256);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  ctx.moveTo(128, 8);
  ctx.lineTo(248, 128);
  ctx.lineTo(128, 248);
  ctx.lineTo(8, 128);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#1f2937';
  ctx.lineWidth = 12;
  ctx.stroke();
  // 行人
  ctx.fillStyle = '#1f2937';
  ctx.beginPath();
  ctx.arc(128, 84, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(116, 106, 24, 62);
  ctx.fillRect(96, 118, 24, 12);
  ctx.fillRect(136, 118, 24, 12);
  ctx.fillRect(112, 168, 12, 44);
  ctx.fillRect(132, 168, 12, 44);
  return finish(c);
}

export function noParkingSignTexture() {
  const c = makeCanvas(256, 256);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#1d4ed8';
  ctx.beginPath();
  ctx.arc(128, 128, 118, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 22;
  ctx.beginPath();
  ctx.arc(128, 128, 102, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(48, 208);
  ctx.lineTo(208, 48);
  ctx.stroke();
  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 92px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('P', 128, 136);
  return finish(c);
}
