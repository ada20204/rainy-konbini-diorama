/**
 * 便利店主体：外壳 / 玻璃橱窗 / 招牌雨棚 / 门口，
 * 以及透过大玻璃清晰可见的店内陈设（货架、冷柜、收银台、杂志架…）。
 */
import * as THREE from 'three';
import { toonMat, flatMat, box, cyl, rng } from '../core/toon.js';
import {
  signTexture,
  verticalSignTexture,
  openSignTexture,
  awningTexture,
  glassTexture,
  interiorFloorTexture,
  wallTexture,
  posterTexture,
  menuTexture,
  fridgeTexture,
} from '../core/textures.js';
import { L } from './layout.js';

const W = L.walkY; // 室内地面高度

export function buildStore(scene, reg) {
  const { layer } = L;
  const flickers = [];

  const wallMat = toonMat(0xe7e1d2, { map: wallTexture('#e7e1d2') });
  const wallDark = toonMat(0x39415a);
  const frameMat = toonMat(0x2b3242);
  const glassMat = flatMat(0xffffff, {
    map: glassTexture(),
    transparent: true,
    opacity: 0.85,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  glassMat.renderOrder = 2;

  /* ============================================================
   *  1. 建筑外壳
   * ============================================================ */
  const shell = new THREE.Group();
  shell.add(box(0.22, 3.2, 7.0, wallMat, { x: -7.89, y: W + 1.6, z: -4.7 })); // 左墙
  shell.add(box(6.4, 3.2, 0.22, wallMat, { x: -4.8, y: W + 1.6, z: -8.09 })); // 后墙
  shell.add(box(6.4, 0.35, 0.22, wallMat, { x: -4.8, y: W + 0.175, z: -1.31 })); // 正面墙裙
  shell.add(box(6.4, 0.65, 0.22, wallMat, { x: -4.8, y: W + 2.875, z: -1.31 })); // 正面招牌带
  shell.add(box(0.22, 0.35, 7.0, wallMat, { x: -1.71, y: W + 0.175, z: -4.7 })); // 右侧墙裙
  shell.add(box(0.22, 0.65, 7.0, wallMat, { x: -1.71, y: W + 2.875, z: -4.7 })); // 右侧招牌带
  // 屋顶 + 女儿墙
  shell.add(box(6.6, 0.16, 7.2, wallDark, { x: -4.8, y: W + 3.28, z: -4.7 }));
  shell.add(box(6.6, 0.26, 0.18, wallDark, { x: -4.8, y: W + 3.49, z: -1.19 }));
  shell.add(box(6.6, 0.26, 0.18, wallDark, { x: -4.8, y: W + 3.49, z: -8.21 }));
  shell.add(box(0.18, 0.26, 7.2, wallDark, { x: -8.01, y: W + 3.49, z: -4.7 }));
  shell.add(box(0.18, 0.26, 7.2, wallDark, { x: -1.59, y: W + 3.49, z: -4.7 }));
  scene.add(shell);
  reg(shell, layer.building);

  /* ============================================================
   *  2. 立面框架（柱子 / 门框）
   * ============================================================ */
  const frame = new THREE.Group();
  frame.add(box(0.3, 2.2, 0.22, frameMat, { x: -7.85, y: W + 1.45, z: -1.31 }));
  frame.add(box(0.3, 2.2, 0.22, frameMat, { x: -1.75, y: W + 1.45, z: -1.31 }));
  frame.add(box(0.12, 2.28, 0.22, frameMat, { x: -3.86, y: W + 1.22, z: -1.31 }));
  frame.add(box(0.12, 2.28, 0.22, frameMat, { x: -2.29, y: W + 1.22, z: -1.31 }));
  frame.add(box(1.69, 0.19, 0.22, frameMat, { x: -3.075, y: W + 2.455, z: -1.31 }));
  // 右立面
  frame.add(box(0.22, 2.2, 0.3, frameMat, { x: -1.71, y: W + 1.45, z: -8.05 }));
  frame.add(box(0.22, 2.2, 0.3, frameMat, { x: -1.71, y: W + 1.45, z: -1.35 }));
  frame.add(box(0.22, 2.2, 0.16, frameMat, { x: -1.71, y: W + 1.45, z: -4.7 }));
  // 玻璃竖梃
  for (const x of [-6.47, -5.14, -2.065]) {
    frame.add(box(0.07, 2.2, 0.1, frameMat, { x, y: W + 1.45, z: -1.22 }));
  }
  for (const z of [-6.34, -3.06]) {
    frame.add(box(0.1, 2.2, 0.07, frameMat, { x: -1.62, y: W + 1.45, z }));
  }
  scene.add(frame);
  reg(frame, layer.building);

  /* ============================================================
   *  3. 玻璃橱窗 + 自动门
   * ============================================================ */
  const glass = new THREE.Group();
  const win = (w, h, x, y, z, ry = 0) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), glassMat);
    m.position.set(x, y, z);
    m.rotation.y = ry;
    glass.add(m);
  };
  win(3.78, 2.2, -5.81, W + 1.45, -1.19); // 正面左大窗
  win(0.33, 2.2, -2.065, W + 1.45, -1.19); // 正面右窄窗
  win(3.12, 2.2, -1.59, W + 1.45, -6.34, Math.PI / 2); // 右立面窗 A
  win(3.12, 2.2, -1.59, W + 1.45, -3.06, Math.PI / 2); // 右立面窗 B
  // 自动门两扇
  for (const x of [-3.42, -2.72]) {
    glass.add(box(0.68, 2.28, 0.04, glassMat, { x, y: W + 1.22, z: -1.24 }));
    glass.add(box(0.68, 0.14, 0.06, frameMat, { x, y: W + 0.17, z: -1.24 }));
    glass.add(box(0.68, 0.1, 0.06, frameMat, { x, y: W + 2.28, z: -1.24 }));
    glass.add(box(0.05, 1.5, 0.06, frameMat, { x: x + 0.22, y: W + 1.25, z: -1.22 }));
  }
  // 门上感应条
  glass.add(box(0.55, 0.1, 0.16, frameMat, { x: -3.075, y: W + 2.5, z: -1.16 }));
  scene.add(glass);
  reg(glass, layer.building);

  /* ============================================================
   *  4. 招牌（横板 / 竖式 / 灯箱）
   * ============================================================ */
  const signs = new THREE.Group();
  const signMat = flatMat(0xffffff, { map: signTexture() });
  const signPlane = new THREE.Mesh(new THREE.PlaneGeometry(6.15, 0.62), signMat);
  signPlane.position.set(-4.8, W + 2.875, -1.185);
  signs.add(signPlane);
  // 招牌带上下细条
  signs.add(box(6.4, 0.05, 0.24, flatMat(0x0ea5a5), { x: -4.8, y: W + 3.16, z: -1.3 }));
  signs.add(box(6.4, 0.05, 0.24, flatMat(0xf59e0b), { x: -4.8, y: W + 2.6, z: -1.3 }));
  flickers.push({ mat: signMat, speed: 9.5, amount: 0.05 });

  // 竖式悬挂招牌
  const vSignMat = flatMat(0xffffff, { map: verticalSignTexture() });
  const vSign = new THREE.Group();
  vSign.add(box(0.52, 1.75, 0.14, frameMat, { x: -1.95, y: W + 1.98, z: -1.02 }));
  for (const dz of [-0.075, 0.075]) {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(0.46, 1.66), vSignMat);
    p.position.set(-1.95, W + 1.98, -1.02 + dz);
    p.rotation.y = dz > 0 ? 0 : Math.PI;
    vSign.add(p);
  }
  vSign.add(box(0.1, 0.08, 0.28, frameMat, { x: -1.95, y: W + 2.72, z: -1.14 }));
  vSign.add(box(0.1, 0.08, 0.28, frameMat, { x: -1.95, y: W + 1.22, z: -1.14 }));
  signs.add(vSign);
  flickers.push({ mat: vSignMat, speed: 13.2, amount: 0.07 });

  // 门口灯箱
  const openMat = flatMat(0xffffff, { map: openSignTexture() });
  const openSign = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 0.42), openMat);
  openSign.position.set(-2.35, W + 2.18, -1.16);
  signs.add(openSign);
  flickers.push({ mat: openMat, speed: 7.8, amount: 0.06 });

  // 招牌外部照明
  const signLight = new THREE.PointLight(0xffd9a2, 7, 8, 1.7);
  signLight.position.set(-4.8, W + 3.1, -0.35);
  signs.add(signLight);
  const vLight = new THREE.PointLight(0x7dd3fc, 4, 5, 1.8);
  vLight.position.set(-1.95, W + 1.98, -0.55);
  signs.add(vLight);
  scene.add(signs);
  reg(signs, layer.building);

  /* ============================================================
   *  5. 雨棚
   * ============================================================ */
  const awning = new THREE.Group();
  const awn = box(5.65, 0.07, 1.15, toonMat(0xffffff, { map: awningTexture() }), {
    x: -4.85,
    y: W + 2.28,
    z: -0.68,
  });
  awn.rotation.x = 0.31;
  awning.add(awn);
  const edge = box(5.7, 0.13, 0.1, frameMat, { x: -4.85, y: W + 2.1, z: -0.14 });
  edge.rotation.x = 0.31;
  awning.add(edge);
  for (const x of [-6.85, -2.85]) {
    const rod = cyl(0.028, 0.028, 1.12, frameMat, { x, y: W + 2.28, z: -0.68, seg: 8 });
    rod.rotation.x = Math.PI / 2 - 0.31;
    awning.add(rod);
  }
  scene.add(awning);
  reg(awning, layer.building);

  /* ============================================================
   *  6. 外部细节（空调 / 落水管 / 门垫 / 护柱 / 海报）
   * ============================================================ */
  const exterior = new THREE.Group();
  // 落水管
  exterior.add(cyl(0.055, 0.055, 3.34, wallDark, { x: -7.72, y: W + 1.67, z: -1.08, seg: 10 }));
  exterior.add(cyl(0.055, 0.055, 3.34, wallDark, { x: -1.86, y: W + 1.67, z: -7.9, seg: 10 }));
  // 右墙空调外机
  const ac = new THREE.Group();
  ac.add(box(0.85, 0.62, 0.55, toonMat(0xc9cfdd), { x: -1.32, y: W + 2.21, z: -6.2 }));
  ac.add(box(0.87, 0.1, 0.57, wallDark, { x: -1.32, y: W + 1.86, z: -6.2 }));
  const fan = cyl(0.19, 0.19, 0.06, wallDark, { x: -1.03, y: W + 2.21, z: -6.2, seg: 18 });
  fan.rotation.z = Math.PI / 2;
  ac.add(fan);
  ac.add(box(0.05, 0.12, 0.5, wallDark, { x: -1.66, y: W + 2.55, z: -6.2 }));
  exterior.add(ac);
  // 屋顶空调
  const rac = new THREE.Group();
  rac.add(box(1.15, 0.5, 0.85, toonMat(0xb9c1d2), { x: -6.5, y: W + 3.62, z: -6.6 }));
  rac.add(cyl(0.3, 0.3, 0.08, wallDark, { x: -6.5, y: W + 3.9, z: -6.6, seg: 20 }));
  rac.add(cyl(0.05, 0.05, 0.65, wallDark, { x: -7.35, y: W + 3.55, z: -7.15, seg: 8 }));
  exterior.add(rac);
  // 电表箱
  exterior.add(box(0.1, 0.55, 0.42, wallDark, { x: -1.55, y: W + 1.0, z: -2.72 }));
  exterior.add(box(0.1, 0.32, 0.3, wallDark, { x: -1.55, y: W + 0.55, z: -2.72 }));
  // 护柱
  for (const x of [-2.55, -3.62]) {
    exterior.add(cyl(0.085, 0.085, 0.52, toonMat(0x3a4256), { x, y: W + 0.26, z: -0.62, seg: 12 }));
    exterior.add(cyl(0.09, 0.09, 0.09, flatMat(0xe8eef8), { x, y: W + 0.44, z: -0.62, seg: 12 }));
  }
  // 门垫（外）
  exterior.add(box(1.55, 0.035, 0.9, toonMat(0xa4231f), { x: -3.075, y: W + 0.018, z: -0.72 }));
  exterior.add(box(1.2, 0.012, 0.2, flatMat(0x2f855a), { x: -3.075, y: W + 0.039, z: -0.72 }));
  // 外墙海报
  for (let i = 0; i < 2; i++) {
    const p = new THREE.Mesh(
      new THREE.PlaneGeometry(0.42, 0.6),
      flatMat(0xffffff, { map: posterTexture(i + 3) })
    );
    p.position.set(-7.68, W + 1.35 + i * 0.02, -1.18 - i * 0.68);
    exterior.add(p);
  }
  scene.add(exterior);
  reg(exterior, layer.building);

  /* ============================================================
   *  7. 店内：地面 / 天花 / 灯具
   * ============================================================ */
  const interior = new THREE.Group();
  interior.add(
    box(5.96, 0.04, 6.56, toonMat(0xffffff, { map: interiorFloorTexture() }), {
      x: -4.8,
      y: W + 0.03,
      z: -4.7,
    })
  );
  interior.add(box(5.96, 0.06, 6.56, toonMat(0xf2ede2), { x: -4.8, y: W + 2.75, z: -4.7 }));
  for (const x of [-6.55, -4.8, -3.05]) {
    for (const z of [-6.3, -3.1]) {
      const lamp = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.32), flatMat(0xfff3dc));
      lamp.rotation.x = Math.PI / 2;
      lamp.position.set(x, W + 2.71, z);
      interior.add(lamp);
    }
  }
  // 暖色店内照明（distance 收紧，避免透过玻璃把外部地面洗白）
  const warm1 = new THREE.PointLight(0xffd9a8, 26, 7, 1.55);
  warm1.position.set(-5.2, W + 2.35, -5.2);
  interior.add(warm1);
  const warm2 = new THREE.PointLight(0xffd9a8, 24, 7, 1.55);
  warm2.position.set(-3.3, W + 2.35, -3.2);
  interior.add(warm2);
  const cool1 = new THREE.PointLight(0xcfe8ff, 12, 6, 1.6);
  cool1.position.set(-4.8, W + 2.1, -7.0);
  interior.add(cool1);
  scene.add(interior);
  reg(interior, layer.interior);

  /* ============================================================
   *  8. 货架（双排端头架 + 商品）
   * ============================================================ */
  const productColors = [
    0xf87171, 0xfbbf24, 0x34d399, 0x60a5fa, 0xa78bfa, 0xf472b6, 0xfb923c, 0x22d3ee, 0xfacc15,
    0x4ade80, 0x818cf8, 0xe879f9,
  ];

  function makeGondola(gx, seed) {
    const grp = new THREE.Group();
    const r = rng(seed);
    const shelfMat = toonMat(0xe8e4da);
    const postMat = toonMat(0x9aa2b5);
    grp.add(box(1.18, 0.22, 5.3, toonMat(0x8b93a8), { x: gx, y: W + 0.15, z: -4.7 }));
    for (const z of [-7.3, -2.1]) {
      grp.add(box(1.18, 1.95, 0.12, shelfMat, { x: gx, y: W + 1.1, z }));
    }
    for (const y of [0.62, 1.14, 1.66]) {
      grp.add(box(1.28, 0.055, 5.16, shelfMat, { x: gx, y: W + y, z: -4.7 }));
      grp.add(box(1.3, 0.09, 5.18, postMat, { x: gx, y: W + y - 0.075, z: -4.7 }));
    }
    grp.add(box(1.28, 0.06, 5.16, shelfMat, { x: gx, y: W + 2.05, z: -4.7 }));

    // 商品（实例化）
    const levels = [0.82, 1.34, 1.86, 2.2];
    const perLevel = 14;
    const count = levels.length * 2 * perLevel;
    const inst = new THREE.InstancedMesh(
      new THREE.BoxGeometry(0.17, 0.23, 0.17),
      toonMat(0xffffff),
      count
    );
    inst.castShadow = true;
    const dummy = new THREE.Object3D();
    let idx = 0;
    for (const y of levels) {
      for (const sx of [-0.32, 0.32]) {
        for (let i = 0; i < perLevel; i++) {
          const z = -7.12 + i * 0.365 + (r() - 0.5) * 0.05;
          dummy.position.set(gx + sx, W + y, z);
          const s = 0.82 + r() * 0.38;
          dummy.scale.set(s, 0.8 + r() * 0.55, s);
          dummy.rotation.y = (r() - 0.5) * 0.35;
          dummy.updateMatrix();
          inst.setMatrixAt(idx, dummy.matrix);
          inst.setColorAt(
            idx,
            new THREE.Color(productColors[Math.floor(r() * productColors.length)])
          );
          idx++;
        }
      }
    }
    inst.instanceMatrix.needsUpdate = true;
    grp.add(inst);
    return grp;
  }

  const gondolaA = makeGondola(-6.45, 101);
  scene.add(gondolaA);
  reg(gondolaA, layer.interior);
  const gondolaB = makeGondola(-4.1, 202);
  scene.add(gondolaB);
  reg(gondolaB, layer.interior);

  /* ============================================================
   *  9. 后墙冷柜（玻璃冷柜 + 饮料）
   * ============================================================ */
  const fridgeWall = new THREE.Group();
  const bottleColors = [
    0x60a5fa, 0xf472b6, 0xfbbf24, 0x34d399, 0xa78bfa, 0xfb923c, 0x22d3ee, 0xf87171,
  ];
  const bottleGeo = new THREE.CylinderGeometry(0.055, 0.055, 0.24, 10);
  const bottles = new THREE.InstancedMesh(bottleGeo, toonMat(0xffffff), 3 * 3 * 9);
  bottles.castShadow = true;
  const bd = new THREE.Object3D();
  let bi = 0;
  for (let u = 0; u < 3; u++) {
    const cx = -6.85 + u * 1.9;
    fridgeWall.add(box(1.85, 2.35, 0.62, toonMat(0xd7dee9), { x: cx, y: W + 1.175, z: -7.64 }));
    // 冷柜内部发光 + 玻璃门
    const glow = new THREE.Mesh(
      new THREE.PlaneGeometry(1.6, 2.02),
      flatMat(0xdceeff, { map: fridgeTexture() })
    );
    glow.position.set(cx, W + 1.17, -7.315);
    fridgeWall.add(glow);
    const g2 = new THREE.Mesh(new THREE.PlaneGeometry(1.66, 2.08), glassMat.clone());
    g2.material.opacity = 0.22;
    g2.position.set(cx, W + 1.17, -7.28);
    fridgeWall.add(g2);
    // 门框
    fridgeWall.add(box(1.72, 0.09, 0.08, toonMat(0x8b93a8), { x: cx, y: W + 2.22, z: -7.27 }));
    fridgeWall.add(box(1.72, 0.09, 0.08, toonMat(0x8b93a8), { x: cx, y: W + 0.12, z: -7.27 }));
    fridgeWall.add(
      box(0.09, 2.18, 0.08, toonMat(0x8b93a8), { x: cx - 0.855, y: W + 1.17, z: -7.27 })
    );
    fridgeWall.add(
      box(0.09, 2.18, 0.08, toonMat(0x8b93a8), { x: cx + 0.855, y: W + 1.17, z: -7.27 })
    );
    // 瓶子
    for (let s = 0; s < 3; s++) {
      for (let i = 0; i < 9; i++) {
        bd.position.set(cx - 0.66 + i * 0.165, W + 0.52 + s * 0.6, -7.45);
        bd.rotation.set(0, 0, 0);
        bd.scale.setScalar(0.9 + (bi % 5) * 0.05);
        bd.updateMatrix();
        bottles.setMatrixAt(bi, bd.matrix);
        bottles.setColorAt(bi, new THREE.Color(bottleColors[(bi * 3 + s) % bottleColors.length]));
        bi++;
      }
    }
  }
  bottles.instanceMatrix.needsUpdate = true;
  fridgeWall.add(bottles);
  // 冷柜上方灯箱
  fridgeWall.add(box(1.85, 0.22, 0.12, flatMat(0x7dd3fc), { x: -4.85, y: W + 2.48, z: -7.3 }));
  scene.add(fridgeWall);
  reg(fridgeWall, layer.interior);

  /* ============================================================
   *  10. 收银台
   * ============================================================ */
  const counter = new THREE.Group();
  counter.add(box(1.05, 1.0, 3.1, toonMat(0xc7a98a), { x: -2.35, y: W + 0.5, z: -4.6 }));
  counter.add(box(1.16, 0.06, 3.2, toonMat(0x8d6f52), { x: -2.35, y: W + 1.03, z: -4.6 }));
  // 收银机
  counter.add(box(0.46, 0.13, 0.4, toonMat(0x3a4256), { x: -2.35, y: W + 1.13, z: -3.66 }));
  const regUnit = box(0.38, 0.3, 0.06, toonMat(0x3a4256), { x: -2.35, y: W + 1.36, z: -3.72 });
  regUnit.rotation.x = -0.32;
  counter.add(regUnit);
  const regScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.22), flatMat(0x67e8f9));
  regScreen.position.set(-2.35, W + 1.38, -3.685);
  regScreen.rotation.x = -0.32;
  counter.add(regScreen);
  // 咖啡机
  counter.add(box(0.42, 0.52, 0.36, toonMat(0x4b5563), { x: -2.35, y: W + 1.32, z: -5.35 }));
  counter.add(box(0.3, 0.14, 0.04, flatMat(0xfbbf24), { x: -2.35, y: W + 1.42, z: -5.16 }));
  // 热食柜（暖光）
  counter.add(box(0.85, 0.42, 0.52, toonMat(0xd6c3a5), { x: -2.35, y: W + 1.27, z: -4.55 }));
  const hotGlow = new THREE.Mesh(new THREE.PlaneGeometry(0.72, 0.3), flatMat(0xffc98a));
  hotGlow.position.set(-2.35, W + 1.28, -4.285);
  counter.add(hotGlow);
  // 悬挂菜单
  for (const z of [-3.6, -5.1]) {
    const menu = new THREE.Mesh(
      new THREE.PlaneGeometry(1.15, 0.52),
      flatMat(0xffffff, { map: menuTexture() })
    );
    menu.position.set(-2.72, W + 2.32, z);
    menu.rotation.y = -Math.PI / 2;
    counter.add(menu);
    counter.add(box(0.04, 0.35, 0.04, toonMat(0x3a4256), { x: -2.72, y: W + 2.56, z }));
  }
  scene.add(counter);
  reg(counter, layer.interior);

  /* ============================================================
   *  11. 杂志架（靠橱窗）
   * ============================================================ */
  const mags = new THREE.Group();
  for (let b = 0; b < 3; b++) {
    const y = W + 0.62 + b * 0.44;
    const board = box(1.5, 0.05, 0.46, toonMat(0xb9c1d2), { x: -6.9, y, z: -2.05 });
    board.rotation.x = -0.55;
    mags.add(board);
    for (let m = 0; m < 4; m++) {
      const cover = new THREE.Mesh(
        new THREE.PlaneGeometry(0.3, 0.4),
        flatMat(0xffffff, { map: posterTexture((b * 4 + m) % 5) })
      );
      cover.rotation.x = -Math.PI / 2 - 0.55;
      cover.position.set(-7.42 + m * 0.35, y + 0.12, -1.93 + b * 0.02);
      mags.add(cover);
    }
  }
  mags.add(box(1.55, 1.85, 0.1, toonMat(0x8b93a8), { x: -6.9, y: W + 1.1, z: -2.3 }));
  scene.add(mags);
  reg(mags, layer.interior);

  /* ============================================================
   *  12. 店内杂项（海报 / 购物篮 / 门垫）
   * ============================================================ */
  const decor = new THREE.Group();
  for (let i = 0; i < 2; i++) {
    const p = new THREE.Mesh(
      new THREE.PlaneGeometry(0.72, 1.0),
      flatMat(0xffffff, { map: posterTexture(i) })
    );
    p.position.set(-2.4 - i * 1.5, W + 1.62, -7.955);
    decor.add(p);
  }
  const sidePoster = new THREE.Mesh(
    new THREE.PlaneGeometry(0.72, 1.0),
    flatMat(0xffffff, { map: posterTexture(4) })
  );
  sidePoster.position.set(-7.955, W + 1.62, -3.6);
  sidePoster.rotation.y = Math.PI / 2;
  decor.add(sidePoster);
  // 购物篮
  for (let i = 0; i < 3; i++) {
    decor.add(
      box(0.52, 0.13, 0.38, toonMat(0xc2410c), {
        x: -4.35 + i * 0.02,
        y: W + 0.12 + i * 0.12,
        z: -1.72 - i * 0.015,
      })
    );
  }
  // 门内垫
  decor.add(box(1.3, 0.025, 0.75, toonMat(0x5b6472), { x: -3.075, y: W + 0.055, z: -1.85 }));
  // 吊挂提示牌
  for (const x of [-5.6, -4.0]) {
    const tag = new THREE.Mesh(
      new THREE.PlaneGeometry(0.62, 0.3),
      flatMat(0xffffff, { map: menuTexture() })
    );
    tag.position.set(x, W + 2.42, -2.6);
    tag.rotation.y = 0.12;
    decor.add(tag);
    decor.add(box(0.02, 0.3, 0.02, toonMat(0x3a4256), { x, y: W + 2.62, z: -2.6 }));
  }
  scene.add(decor);
  reg(decor, layer.interior);

  return { flickers };
}
