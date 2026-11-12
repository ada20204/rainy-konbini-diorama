/**
 * 雨：线段雨丝 + 地面溅落涟漪 + 积水波纹。
 * 雨丝不落入建筑范围（exclude 矩形）。
 */
import * as THREE from 'three';
import { rng } from './toon.js';

export function createRain(scene, {
  count = 1700,
  area = 13.5,
  top = 13,
  exclude = [],
  color = 0x93b7ee,
} = {}) {
  const rand = rng(20261112);
  const positions = new Float32Array(count * 6);
  const drops = [];

  const insideExclude = (x, z) =>
    exclude.some((r) => x > r.x0 - 0.3 && x < r.x1 + 0.3 && z > r.z0 - 0.3 && z < r.z1 + 0.3);

  function place(i, initial) {
    let x = 0;
    let z = 0;
    for (let t = 0; t < 24; t++) {
      x = (rand() * 2 - 1) * area;
      z = (rand() * 2 - 1) * area;
      if (!insideExclude(x, z)) break;
    }
    const y = initial ? 0.4 + rand() * top : top * (0.9 + rand() * 0.35);
    const speed = 10.5 + rand() * 4.5;
    const vx = 1.35 + rand() * 0.6;
    const vz = 0.45 + rand() * 0.35;
    const len = 0.2 + rand() * 0.26;
    drops[i] = { x, y, z, vx, vy: -speed, vz, len };
  }

  for (let i = 0; i < count; i++) place(i, true);

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const mat = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity: 0,
    fog: true,
    depthWrite: false,
  });
  const lines = new THREE.LineSegments(geo, mat);
  lines.frustumCulled = false;
  lines.renderOrder = 5;
  scene.add(lines);

  let fade = 0; // 0→1 淡入

  function update(dt) {
    fade = Math.min(1, fade + dt * 0.45);
    mat.opacity = 0.28 * fade;
    for (let i = 0; i < count; i++) {
      const d = drops[i];
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      d.z += d.vz * dt;
      if (d.y < 0.12 || (insideExclude(d.x, d.z) && d.y < 3.9)) {
        place(i, false);
      }
      const j = i * 6;
      positions[j] = d.x;
      positions[j + 1] = d.y;
      positions[j + 2] = d.z;
      positions[j + 3] = d.x - d.vx * 0.028 * d.len * 10;
      positions[j + 4] = d.y - d.vy * 0.028 * d.len * 10;
      positions[j + 5] = d.z - d.vz * 0.028 * d.len * 10;
    }
    geo.attributes.position.needsUpdate = true;
  }

  return { update, fadeIn: () => { fade = 0; } };
}

/** 地面溅落的小涟漪（对象池） */
export function createSplashes(scene, { count = 42, area = 12.5, exclude = [] } = {}) {
  const rand = rng(98765);
  const geo = new THREE.RingGeometry(0.05, 0.085, 18);
  geo.rotateX(-Math.PI / 2);
  const items = [];

  const insideExclude = (x, z) =>
    exclude.some((r) => x > r.x0 && x < r.x1 && z > r.z0 && z < r.z1);

  for (let i = 0; i < count; i++) {
    const mat = new THREE.MeshBasicMaterial({
      color: 0xa8c4f0,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.renderOrder = 4;
    scene.add(mesh);
    items.push({ mesh, mat, life: rand() * 1.4, dur: 0.75 + rand() * 0.7, grow: 1.6 + rand() * 1.4 });
  }

  function respawn(it) {
    let x = 0;
    let z = 0;
    for (let t = 0; t < 20; t++) {
      x = (rand() * 2 - 1) * area;
      z = (rand() * 2 - 1) * area;
      if (!insideExclude(x, z)) break;
    }
    const onWalk = (x < 3.8 && z < 3.8) || z > 9.8 || x > 9.8;
    it.mesh.position.set(x, onWalk ? 0.155 : 0.032, z);
    it.life = 0;
    it.dur = 0.7 + rand() * 0.7;
    it.grow = 1.5 + rand() * 1.6;
    const s = 0.7 + rand() * 0.7;
    it.mesh.scale.setScalar(s);
  }

  function update(dt, fade = 1) {
    for (const it of items) {
      it.life += dt;
      if (it.life > it.dur) respawn(it);
      const p = it.life / it.dur;
      it.mesh.scale.setScalar(0.35 + p * it.grow);
      it.mat.opacity = (1 - p) * 0.5 * fade;
    }
  }

  return { update };
}
