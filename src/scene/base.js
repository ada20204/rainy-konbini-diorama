/**
 * 正方形底座 + 街角路网：人行道、马路、路缘石、排水沟、
 * 斑马线、停车位、井盖、积水、灯光倒影。
 */
import * as THREE from 'three';
import { toonMat, flatMat, box, cyl, rng } from '../core/toon.js';
import {
  asphaltTexture,
  sidewalkTexture,
  wallTexture,
  manholeTexture,
  wetTexture,
  glowTexture,
} from '../core/textures.js';
import { L } from './layout.js';

export function buildBase(scene, reg) {
  const { layer } = L;
  const rand = rng(555);

  /* ---------- 底座 ---------- */
  const pedestal = new THREE.Group();
  const ped = box(23.2, 1.3, 23.2, toonMat(0x252c42), { outline: 0.05, y: -0.71 });
  const trim = box(23.75, 0.16, 23.75, toonMat(0x171d30), { outline: 0.04, y: -1.31 });
  pedestal.add(ped, trim);
  scene.add(pedestal);
  reg(pedestal, layer.base);

  const groundSlab = new THREE.Group();
  groundSlab.add(box(22, 0.1, 22, toonMat(0x1d2334, { map: wallTexture('#1d2334') }), { y: -0.11 }));
  scene.add(groundSlab);
  reg(groundSlab, layer.base);

  /* ---------- 人行道 ---------- */
  const sidewalkMat = toonMat(0x9aa4bd, { map: sidewalkTexture() });
  const sidewalk = new THREE.Group();
  sidewalk.add(box(14.8, 0.2, 14.8, sidewalkMat, { x: -3.6, y: 0.04, z: -3.6 })); // 主区
  sidewalk.add(box(22, 0.2, 1.2, sidewalkMat, { x: 0, y: 0.04, z: 10.4 })); // 对侧（前）
  sidewalk.add(box(1.2, 0.2, 20.8, sidewalkMat, { x: 10.4, y: 0.04, z: -0.6 })); // 对侧（右）
  scene.add(sidewalk);
  reg(sidewalk, layer.ground);

  /* ---------- 路缘石 ---------- */
  const curbMat = toonMat(0xb8bfd2);
  const curbs = new THREE.Group();
  curbs.add(box(0.26, 0.23, 14.8, curbMat, { x: 3.8, y: 0.045, z: -3.6 }));
  curbs.add(box(14.8, 0.23, 0.26, curbMat, { x: -3.6, y: 0.045, z: 3.8 }));
  curbs.add(box(0.26, 0.23, 20.8, curbMat, { x: 9.8, y: 0.045, z: -0.6 }));
  curbs.add(box(22, 0.23, 0.26, curbMat, { x: 0, y: 0.045, z: 9.8 }));
  scene.add(curbs);
  reg(curbs, layer.ground);

  /* ---------- 马路 ---------- */
  const roadMat = toonMat(0xffffff, { map: asphaltTexture() });
  const frontRoad = new THREE.Group();
  frontRoad.add(box(22, 0.12, 6, roadMat, { x: 0, y: -0.04, z: 6.8 }));
  scene.add(frontRoad);
  reg(frontRoad, layer.ground);

  const sideRoad = new THREE.Group();
  sideRoad.add(box(6, 0.12, 14.8, roadMat, { x: 6.8, y: -0.04, z: -3.6 }));
  scene.add(sideRoad);
  reg(sideRoad, layer.ground);

  /* ---------- 排水沟 + 格栅 ---------- */
  const gutters = new THREE.Group();
  const gutterMat = toonMat(0x2a3145);
  const grateMat = toonMat(0x161b2a);
  gutters.add(box(0.38, 0.012, 14.8, gutterMat, { x: 4.05, y: 0.022, z: -3.6 }));
  gutters.add(box(14.8, 0.012, 0.38, gutterMat, { x: -3.6, y: 0.022, z: 4.05 }));
  gutters.add(box(0.38, 0.012, 6, gutterMat, { x: 4.05, y: 0.022, z: 6.8 }));
  gutters.add(box(6, 0.012, 0.38, gutterMat, { x: 6.8, y: 0.022, z: 4.05 }));
  gutters.add(box(0.38, 0.012, 20.8, gutterMat, { x: 9.55, y: 0.022, z: -0.6 }));
  gutters.add(box(22, 0.012, 0.38, gutterMat, { x: 0, y: 0.022, z: 9.55 }));
  // 格栅
  for (const [x, z, w, d] of [
    [4.05, 1.4, 0.32, 1.1], [4.05, -4.6, 0.32, 1.1], [-1.4, 4.05, 1.1, 0.32],
    [6.8, 4.05, 1.1, 0.32], [9.55, 5.6, 0.32, 1.1], [9.55, -2.4, 0.32, 1.1],
  ]) {
    gutters.add(box(w, 0.02, d, grateMat, { x, y: 0.028, z }));
  }
  scene.add(gutters);
  reg(gutters, layer.marks);

  /* ---------- 斑马线（反光） ---------- */
  const stripeMat = flatMat(0xe8edf7);
  const studMat = flatMat(0x9ff0ff);

  const crossA = new THREE.Group(); // 横穿右街（斑马线沿 x 铺开）
  for (let i = 0; i < 4; i++) {
    const z = 0.7 + i * 0.75;
    crossA.add(box(6, 0.015, 0.5, stripeMat, { x: 6.8, y: 0.032, z }));
    for (const sx of [3.95, 9.65]) {
      crossA.add(box(0.09, 0.028, 0.09, studMat, { x: sx, y: 0.038, z }));
    }
  }
  scene.add(crossA);
  reg(crossA, layer.marks);

  const crossB = new THREE.Group(); // 横穿前街
  for (let i = 0; i < 4; i++) {
    const x = 0.7 + i * 0.75;
    crossB.add(box(0.5, 0.015, 6, stripeMat, { x, y: 0.032, z: 6.8 }));
    for (const sz of [3.95, 9.65]) {
      crossB.add(box(0.09, 0.028, 0.09, studMat, { x, y: 0.038, z: sz }));
    }
  }
  crossB.add(box(0.3, 0.015, 5.6, stripeMat, { x: -0.15, y: 0.032, z: 6.8 })); // 停止线
  scene.add(crossB);
  reg(crossB, layer.marks);

  /* ---------- 中央虚线 + 停车位 ---------- */
  const marks = new THREE.Group();
  const dashMat = flatMat(0xd9a441);
  for (let x = -9.4; x < 3.4; x += 2.4) {
    marks.add(box(1.35, 0.012, 0.13, dashMat, { x, y: 0.03, z: 6.8 }));
  }
  for (let z = -9.4; z < 3.4; z += 2.4) {
    marks.add(box(0.13, 0.012, 1.35, dashMat, { x: 6.8, y: 0.03, z }));
  }
  // 停车位（右街左侧）
  const parkMat = flatMat(0xd7dce6);
  marks.add(box(0.12, 0.012, 4, parkMat, { x: 4.35, y: 0.03, z: -5.6 }));
  marks.add(box(0.12, 0.012, 4, parkMat, { x: 9.25, y: 0.03, z: -5.6 }));
  marks.add(box(4.9, 0.012, 0.12, parkMat, { x: 6.8, y: 0.03, z: -7.6 }));
  marks.add(box(4.9, 0.012, 0.12, parkMat, { x: 6.8, y: 0.03, z: -3.6 }));
  scene.add(marks);
  reg(marks, layer.marks);

  /* ---------- 井盖 ---------- */
  const manhole = new THREE.Group();
  const mh = cyl(0.52, 0.52, 0.024, toonMat(0xffffff, { map: manholeTexture() }), {
    x: 6.2, y: 0.034, z: 7.6, seg: 28,
  });
  manhole.add(mh);
  scene.add(manhole);
  reg(manhole, layer.marks);

  /* ---------- 积水 ---------- */
  const wetMap = wetTexture();
  const puddleMat = flatMat(0xffffff, {
    map: wetMap,
    transparent: true,
    opacity: 0.88,
    depthWrite: false,
  });
  const puddles = new THREE.Group();
  const puddleDefs = [
    [6.9, 7.7, 1.7, 1.1, 0.034],
    [1.2, 5.3, 1.15, 0.8, 0.034],
    [6.2, -1.3, 1.35, 0.85, 0.034],
    [8.3, 2.9, 0.95, 0.7, 0.034],
    [-2.7, 2.15, 1.25, 0.85, 0.152],
    [-5.6, 0.9, 0.9, 0.6, 0.152],
  ];
  for (const [x, z, rx, rz, y] of puddleDefs) {
    const p = new THREE.Mesh(new THREE.CircleGeometry(1, 26), puddleMat);
    p.rotation.x = -Math.PI / 2;
    p.rotation.z = rand() * Math.PI;
    p.scale.set(rx, rz, 1);
    p.position.set(x, y, z);
    p.renderOrder = 3;
    puddles.add(p);
  }
  scene.add(puddles);
  reg(puddles, layer.marks);

  /* ---------- 霓虹 / 灯光在湿地上的倒影（加法贴花） ---------- */
  const glows = new THREE.Group();
  function glowDecal(color, x, y, z, sx, sz, opacity) {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      flatMat(0xffffff, {
        map: glowTexture(color),
        transparent: true,
        opacity,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    m.rotation.x = -Math.PI / 2;
    m.position.set(x, y, z);
    m.scale.set(sx, sz, 1);
    m.renderOrder = 4;
    glows.add(m);
  }
  glowDecal('#ffc98a', -4.8, 0.154, 0.15, 8.2, 3.4, 0.34); // 店铺橱窗暖光溢出
  glowDecal('#ffd9a0', 4.8, 0.034, -1.1, 5.2, 5.2, 0.3); // 路灯
  glowDecal('#7dd3fc', -0.15, 0.154, -4.55, 2.4, 2.4, 0.26); // 贩卖机
  glowDecal('#5eead4', -1.7, 0.154, -0.35, 2.6, 2.0, 0.2); // 竖招牌
  glowDecal('#f472b6', 7.6, 0.034, 7.4, 3.6, 3.0, 0.16); // 霓虹倒影点缀
  glowDecal('#60a5fa', 2.2, 0.034, 6.2, 3.0, 2.6, 0.14);
  scene.add(glows);
  reg(glows, layer.marks);

  return { roadMat, sidewalkMat };
}
