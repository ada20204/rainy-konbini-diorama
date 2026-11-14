import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';

function normalizeBasePath(raw = '/konbini/') {
  let base = String(raw).trim() || '/';
  if (!base.startsWith('/')) base = `/${base}`;
  if (!base.endsWith('/')) base = `${base}/`;
  return base;
}

const BASE_PATH = normalizeBasePath(process.env.VITE_BASE_PATH ?? '/konbini/');
const OUT_DIR = process.env.VERIFY_OUT_DIR || path.resolve(import.meta.dirname, '../.verify-e2e');
const PREVIEW_PORT = process.env.VERIFY_PORT || '4178';
const PREVIEW_URL = process.env.PREVIEW_URL || `http://127.0.0.1:${PREVIEW_PORT}${BASE_PATH}`;
const WD_PORT = Number(process.env.VERIFY_WD_PORT || 4448);
const WD_BASE = `http://127.0.0.1:${WD_PORT}`;
const FIREFOX_BIN = process.env.FIREFOX_BIN || '/snap/firefox/current/usr/lib/firefox/firefox';
const GECKODRIVER_BIN = process.env.GECKODRIVER_BIN || '/snap/bin/geckodriver';

async function wd(method, endpoint, body) {
  const res = await fetch(`${WD_BASE}${endpoint}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(
      `WebDriver ${method} ${endpoint} failed (${res.status}): ${JSON.stringify(json)}`
    );
  }
  return json.value;
}

async function waitForUrl(url, label) {
  for (let i = 0; i < 40; i++) {
    try {
      const r = await fetch(url);
      if (r.ok) return;
    } catch {
      // retry until preview/geckodriver listens
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`${label} did not become ready at ${url}`);
}

async function exec(sessionId, script, args = []) {
  return wd('POST', `/session/${sessionId}/execute/sync`, { script, args });
}

async function snap(sessionId, filename) {
  const b64 = await wd('GET', `/session/${sessionId}/screenshot`);
  const outPath = path.join(OUT_DIR, filename);
  await fs.writeFile(outPath, Buffer.from(b64, 'base64'));
  console.log('Saved:', outPath);
}

async function waitForElapsed(sessionId, targetFn, timeoutMs, label) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const state = await exec(
      sessionId,
      `
      const d = window.__diorama;
      if (!d) return null;
      return { elapsed: d.elapsed, total: d.total };
    `
    );
    if (state && targetFn(state)) {
      return state;
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error(`Timed out waiting for ${label}`);
}

async function setView(sessionId, pos, target) {
  await exec(
    sessionId,
    `
    const { camera, controls } = window.__diorama;
    const prevDamping = controls.enableDamping;
    controls.enableDamping = false;
    controls.autoRotate = false;
    camera.position.set(arguments[0][0], arguments[0][1], arguments[0][2]);
    controls.target.set(arguments[1][0], arguments[1][1], arguments[1][2]);
    controls.update();
    controls.enableDamping = prevDamping;
  `,
    [pos, target]
  );
  await new Promise((r) => setTimeout(r, 300));
}

async function run() {
  await fs.mkdir(OUT_DIR, { recursive: true });

  const previewProc = spawn(
    process.execPath,
    [
      path.resolve(import.meta.dirname, '../node_modules/vite/bin/vite.js'),
      'preview',
      '--port',
      String(PREVIEW_PORT),
      '--host',
      '127.0.0.1',
      '--strictPort',
    ],
    {
      cwd: path.resolve(import.meta.dirname, '..'),
      stdio: 'ignore',
    }
  );

  const driverProc = spawn(GECKODRIVER_BIN, ['--port', String(WD_PORT)], {
    stdio: 'ignore',
  });

  let sessionId = null;
  try {
    await waitForUrl(PREVIEW_URL, 'vite preview');
    await waitForUrl(`${WD_BASE}/status`, 'geckodriver');

    const session = await wd('POST', '/session', {
      capabilities: {
        alwaysMatch: {
          browserName: 'firefox',
          'moz:firefoxOptions': {
            binary: FIREFOX_BIN,
            args: ['-headless', '--width=1440', '--height=960'],
            prefs: {
              'webgl.force-enabled': true,
              'layers.acceleration.force-enabled': true,
              'gfx.webrender.all': true,
            },
          },
        },
      },
    });
    sessionId = session.sessionId;
    await wd('POST', `/session/${sessionId}/window/rect`, { width: 1440, height: 960 });
    await wd('POST', `/session/${sessionId}/url`, { url: PREVIEW_URL });

    await exec(
      sessionId,
      `
      window.__VERIFY_ERRORS__ = [];
      window.addEventListener('error', (e) => window.__VERIFY_ERRORS__.push(e.message || String(e)));
      window.addEventListener('unhandledrejection', (e) => window.__VERIFY_ERRORS__.push(String(e.reason)));
    `
    );

    const midState = await waitForElapsed(
      sessionId,
      (s) => s.elapsed >= s.total * 0.42,
      30000,
      'mid-assembly state'
    );
    await snap(sessionId, 'preview-assembly-mid.png');

    const settledState = await waitForElapsed(
      sessionId,
      (s) => s.elapsed >= s.total + 1.0,
      45000,
      'settled state'
    );

    const sceneStats = await exec(
      sessionId,
      `
      const { scene, renderer, total, elapsed } = window.__diorama;
      let meshCount = 0;
      let lightCount = 0;
      scene.traverse((o) => {
        if (o.isMesh) meshCount++;
        if (o.isLight) lightCount++;
      });
      return {
        total: Number(total.toFixed(3)),
        settledElapsed: Number(elapsed.toFixed(3)),
        rootChildren: scene.children.length,
        meshCount,
        lightCount,
        calls: renderer.info.render.calls,
        triangles: renderer.info.render.triangles,
      };
    `
    );
    if (!sceneStats || sceneStats.calls <= 0 || sceneStats.meshCount <= 0) {
      throw new Error(`Scene failed to render: ${JSON.stringify(sceneStats)}`);
    }

    // 1. Default isometric diorama hero angle
    await setView(sessionId, [15, 11.5, 17], [0, 1.2, 0]);
    await snap(sessionId, 'preview-hero.png');

    // 2. Close-up storefront & wet sidewalk angle
    await setView(sessionId, [7.2, 4.4, 9.6], [-0.4, 1.8, -0.4]);
    await snap(sessionId, 'preview-storefront.png');

    // 3. Opposite street & utility poles angle
    await setView(sessionId, [-13.5, 9.0, 14.5], [0, 1.5, 0]);
    await snap(sessionId, 'preview-alley.png');

    // 4. Verify orbit drag + scroll zoom + autoRotate stop
    await setView(sessionId, [15, 11.5, 17], [0, 1.2, 0]);
    await exec(sessionId, `window.__diorama.controls.autoRotate = true;`);
    const beforeCam = await exec(
      sessionId,
      `const p = window.__diorama.camera.position; return [p.x, p.y, p.z];`
    );

    await wd('POST', `/session/${sessionId}/actions`, {
      actions: [
        {
          type: 'pointer',
          id: 'mouse',
          parameters: { pointerType: 'mouse' },
          actions: [
            { type: 'pointerMove', duration: 0, x: 720, y: 480 },
            { type: 'pointerDown', button: 0 },
            { type: 'pointerMove', duration: 250, x: 540, y: 410 },
            { type: 'pointerUp', button: 0 },
          ],
        },
      ],
    });
    await new Promise((r) => setTimeout(r, 400));

    const afterDrag = await exec(
      sessionId,
      `
      const { camera, controls } = window.__diorama;
      const p = camera.position;
      return { pos: [p.x, p.y, p.z], autoRotate: controls.autoRotate };
    `
    );
    const dragDelta = Math.hypot(
      afterDrag.pos[0] - beforeCam[0],
      afterDrag.pos[1] - beforeCam[1],
      afterDrag.pos[2] - beforeCam[2]
    );
    if (dragDelta < 0.1) {
      throw new Error(`Orbit drag check failed: delta=${dragDelta}`);
    }
    if (afterDrag.autoRotate !== false) {
      throw new Error('Expected autoRotate to pause after user drag');
    }

    const beforeZoomDist = Math.hypot(afterDrag.pos[0], afterDrag.pos[1] - 1.2, afterDrag.pos[2]);
    await wd('POST', `/session/${sessionId}/actions`, {
      actions: [
        {
          type: 'wheel',
          id: 'wheel',
          actions: [{ type: 'scroll', x: 720, y: 480, deltaX: 0, deltaY: -360 }],
        },
      ],
    });
    await new Promise((r) => setTimeout(r, 450));
    const afterZoomPos = await exec(
      sessionId,
      `const p = window.__diorama.camera.position; return [p.x, p.y, p.z];`
    );
    const afterZoomDist = Math.hypot(afterZoomPos[0], afterZoomPos[1] - 1.2, afterZoomPos[2]);
    const zoomDistanceDelta = Number(Math.abs(beforeZoomDist - afterZoomDist).toFixed(3));
    if (zoomDistanceDelta < 0.2) {
      throw new Error(`Wheel zoom check failed: distanceDelta=${zoomDistanceDelta}`);
    }

    // 5. Mobile portrait viewport responsive check (390x844)
    await wd('POST', `/session/${sessionId}/window/rect`, { width: 390, height: 844 });
    await setView(sessionId, [16.5, 12.2, 18.5], [0, 1.2, 0]);
    await snap(sessionId, 'preview-mobile.png');

    const mobileMetrics = await exec(
      sessionId,
      `
      const canvas = window.__diorama.renderer.domElement;
      const rect = canvas.getBoundingClientRect();
      return {
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,
        canvasWidth: Math.round(rect.width),
        canvasHeight: Math.round(rect.height),
        overflowX: document.documentElement.scrollWidth > window.innerWidth,
        errors: window.__VERIFY_ERRORS__ || [],
      };
    `
    );

    const report = {
      midElapsed: Number(midState.elapsed.toFixed(3)),
      settledCheck: Number(settledState.elapsed.toFixed(3)),
      sceneStats,
      dragDelta: Number(dragDelta.toFixed(3)),
      zoomDistanceDelta,
      autoRotateStoppedOnDrag: afterDrag.autoRotate === false,
      mobileMetrics,
    };
    console.log('E2E_REPORT:', JSON.stringify(report, null, 2));

    if (mobileMetrics.errors.length > 0) {
      throw new Error(`Runtime errors detected: ${JSON.stringify(mobileMetrics.errors)}`);
    }
    if (mobileMetrics.overflowX) {
      throw new Error('Mobile viewport overflows horizontally');
    }
    if (mobileMetrics.canvasWidth !== mobileMetrics.innerWidth) {
      throw new Error(
        `Canvas resize mismatch on mobile: ${mobileMetrics.canvasWidth} != ${mobileMetrics.innerWidth}`
      );
    }
  } finally {
    if (sessionId) {
      try {
        await wd('DELETE', `/session/${sessionId}`);
      } catch {
        // ignore cleanup error
      }
    }
    driverProc.kill('SIGTERM');
    previewProc.kill('SIGTERM');
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
