/**
 * 诊断脚本：等装配动画真正跑完（按 elapsed），报告部件状态并截图。
 * 用法：node scripts/probe.mjs [baseURL]
 */
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const exe = `${process.env.HOME}/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome`;
const base = process.argv[2] || 'http://localhost:4173/';
mkdirSync('shots', { recursive: true });

const browser = await chromium.launch({
  executablePath: exe,
  args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--no-sandbox', '--no-proxy-server'],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
const logs = [];
page.on('console', (m) => {
  if (m.type() === 'error' || m.type() === 'warning') logs.push(`${m.type()}: ${m.text()}`);
});
page.on('pageerror', (e) => logs.push(`pageerror: ${e.message}`));

await page.goto(base, { waitUntil: 'networkidle' });

// 先截一张装配中段（elapsed≈5s），再等动画真正完成（软件渲染慢，按 elapsed 判断）
await page.waitForFunction(
  () => window.__diorama && window.__diorama.elapsed > 5,
  null,
  { timeout: 180000, polling: 200 },
);
await page.screenshot({ path: 'shots/assembly-mid.png' });

await page.waitForFunction(
  () => window.__diorama && window.__diorama.elapsed > window.__diorama.total + 1,
  null,
  { timeout: 180000, polling: 500 },
);

const report = await page.evaluate(() => {
  const d = window.__diorama;
  const rows = [];
  for (const obj of d.scene.children) {
    rows.push({
      type: obj.type,
      name: obj.name || '(anon)',
      visible: obj.visible,
      scale: obj.scale.x.toFixed(2),
      pos: [obj.position.x.toFixed(1), obj.position.y.toFixed(1), obj.position.z.toFixed(1)].join(','),
      children: obj.children.length,
    });
  }
  return { elapsed: d.elapsed.toFixed(1), total: d.total.toFixed(1), count: d.scene.children.length, rows };
});

console.log(`elapsed=${report.elapsed} total=${report.total} scene.children=${report.count}`);
for (const r of report.rows) {
  console.log(
    `${r.visible ? 'VIS ' : 'HID '} scale=${r.scale} pos=(${r.pos}) ${r.type} ${r.name} kids=${r.children}`,
  );
}
console.log(logs.length ? `CONSOLE:\n${logs.join('\n')}` : 'CONSOLE: clean');

await page.screenshot({ path: 'shots/probe-final.png' });
await browser.close();
