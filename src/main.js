/**
 * 雨夜日式便利店街角 · 微缩三维景观
 * 第三视角自由拖拽 / 旋转 / 缩放，进入页面自动播放模型组装动画。
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { setupLights } from './core/lights.js';
import { AssemblyController } from './core/assembly.js';
import { buildWorld } from './scene/buildScene.js';

const app = document.getElementById('app');

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ antialias: true });
} catch (err) {
  const d = document.createElement('div');
  d.style.cssText =
    'position:fixed;left:12px;right:12px;bottom:12px;padding:10px 14px;background:#7f1d1d;' +
    'color:#fff;font:13px/1.6 ui-monospace,monospace;border-radius:8px;z-index:99';
  d.textContent = '无法创建 WebGL 渲染器：请在浏览器设置中开启硬件加速（WebGL2）。';
  document.body.appendChild(d);
  throw err;
}
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
app.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0f1e);
scene.fog = new THREE.Fog(0x0a0f1e, 27, 62);

const camera = new THREE.PerspectiveCamera(34, window.innerWidth / window.innerHeight, 0.1, 120);
camera.position.set(15, 11.5, 17);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 1.2, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.075;
controls.minDistance = 9;
controls.maxDistance = 34;
controls.maxPolarAngle = Math.PI * 0.47;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.45;
controls.addEventListener('start', () => {
  controls.autoRotate = false;
});

setupLights(scene);

// 搭建场景并登记装配部件
const assembly = new AssemblyController();
const world = buildWorld(scene, (obj, layer) => assembly.add(obj, layer));
const total = assembly.finalize({ layerGap: 0.85, stagger: 0.03 });
world.rainStart = total * 0.58;

let elapsed = 0;
let lastNow = performance.now();

function animate() {
  requestAnimationFrame(animate);
  const now = performance.now();
  const dt = Math.min((now - lastNow) / 1000, 0.05);
  lastNow = now;
  elapsed += dt;
  assembly.update(elapsed);
  world.update(dt, elapsed);
  controls.update();
  renderer.render(scene, camera);
}
animate();

// 调试 / 测试句柄（无 UI）
window.__diorama = {
  scene,
  camera,
  controls,
  renderer,
  assembly,
  THREE,
  get elapsed() {
    return elapsed;
  },
  total,
};

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
