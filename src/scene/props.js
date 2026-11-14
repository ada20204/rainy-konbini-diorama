/**
 * 日式街角道具：自动贩卖机、自行车、雨伞架、垃圾桶、
 * 电线杆与电线、路灯、路牌、护栏、消防栓、公告栏、
 * 小巷（邻楼 / 管道 / 堆放箱）、行道树。
 */
import * as THREE from 'three';
import { toonMat, flatMat, box, cyl, addOutline, rng } from '../core/toon.js';
import {
  vendingTexture,
  posterTexture,
  crossingSignTexture,
  noParkingSignTexture,
  wallTexture,
  glowTexture,
} from '../core/textures.js';
import { L } from './layout.js';

const W = L.walkY;

/** 连接两点的圆管 */
function tubeBetween(a, b, r, mat, seg = 8) {
  const dir = new THREE.Vector3().subVectors(b, a);
  const len = dir.length();
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, seg), mat);
  mesh.position.copy(a).add(b).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

/** 悬垂电线（二次贝塞尔 + 管） */
function wire(p1, p2, sag, r = 0.02) {
  const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
  mid.y -= sag;
  const curve = new THREE.QuadraticBezierCurve3(p1.clone(), mid, p2.clone());
  const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 22, r, 5), toonMat(0x161b2c));
  mesh.castShadow = false;
  return mesh;
}

export function buildProps(scene, reg) {
  const { layer } = L;
  const rand = rng(31415);
  const flickers = [];

  /* ---------- 自动贩卖机 ×2 ---------- */
  function vending(z, tint = 0xffffff) {
    const grp = new THREE.Group();
    const body = box(1.05, 1.95, 0.78, toonMat(0xd7dce6), { y: 0.975 });
    grp.add(body);
    grp.add(box(1.08, 0.12, 0.81, toonMat(0x8b93a8), { y: 1.99 }));
    const panel = new THREE.Mesh(
      new THREE.PlaneGeometry(0.95, 1.78),
      flatMat(tint, { map: vendingTexture() })
    );
    panel.position.set(0, 1.02, 0.395);
    grp.add(panel);
    flickers.push({ mat: panel.material, speed: 11.3, amount: 0.05 });
    grp.add(box(0.52, 0.17, 0.05, toonMat(0x222a3c), { y: 0.32, z: 0.42 }));
    const glow = new THREE.Mesh(
      new THREE.PlaneGeometry(1.1, 0.7),
      flatMat(0xffffff, {
        map: glowTexture('#7dd3fc'),
        transparent: true,
        opacity: 0.4,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    glow.position.set(0, 1.72, 0.43);
    grp.add(glow);
    grp.position.set(-1.21, W, z);
    grp.rotation.y = Math.PI / 2;
    return grp;
  }
  const vend1 = vending(-5.2);
  scene.add(vend1);
  reg(vend1, layer.prop);
  const vend2 = vending(-3.95, 0xf6f1e4);
  scene.add(vend2);
  reg(vend2, layer.prop);

  const vendLight = new THREE.PointLight(0x9fd8ff, 6, 5, 1.7);
  vendLight.position.set(-0.55, 1.35, -4.55);
  scene.add(vendLight);

  /* ---------- 自行车 ---------- */
  const bike = new THREE.Group();
  {
    const frameMat = toonMat(0x2f7d8a);
    const darkMat = toonMat(0x20263a);
    const wheelGeo = new THREE.TorusGeometry(0.335, 0.028, 8, 22);
    for (const x of [-0.52, 0.52]) {
      const wheel = new THREE.Mesh(wheelGeo, darkMat);
      wheel.position.set(x, 0.335, 0);
      wheel.castShadow = true;
      addOutline(wheel, 0.022);
      bike.add(wheel);
      bike.add(cyl(0.05, 0.05, 0.09, darkMat, { x, y: 0.335, seg: 10 }));
    }
    const A = new THREE.Vector3(-0.52, 0.335, 0);
    const C = new THREE.Vector3(0.08, 0.36, 0);
    const S = new THREE.Vector3(0.02, 0.82, 0);
    const H = new THREE.Vector3(0.5, 0.85, 0);
    const F = new THREE.Vector3(0.52, 0.335, 0);
    const B = new THREE.Vector3(0.5, 0.96, 0);
    bike.add(
      tubeBetween(A, C, 0.026, frameMat),
      tubeBetween(C, S, 0.026, frameMat),
      tubeBetween(S, H, 0.026, frameMat),
      tubeBetween(A, S, 0.022, frameMat),
      tubeBetween(C, H, 0.026, frameMat),
      tubeBetween(H, F, 0.022, frameMat),
      tubeBetween(H, B, 0.022, frameMat)
    );
    bike.add(box(0.24, 0.05, 0.11, darkMat, { x: 0.0, y: 0.88 }));
    const bar = cyl(0.022, 0.022, 0.42, darkMat, { x: 0.5, y: 0.96, seg: 8 });
    bar.rotation.x = Math.PI / 2;
    bike.add(bar);
    bike.add(box(0.3, 0.2, 0.32, toonMat(0xb9a48a), { x: 0.68, y: 0.86 }));
    bike.add(box(0.1, 0.03, 0.16, darkMat, { x: 0.08, y: 0.3, z: 0.12 }));
    bike.add(box(0.1, 0.03, 0.16, darkMat, { x: 0.08, y: 0.3, z: -0.12 }));
    bike.add(
      tubeBetween(
        new THREE.Vector3(0.02, 0.3, 0.05),
        new THREE.Vector3(0.14, 0.02, 0.2),
        0.018,
        darkMat
      )
    );
  }
  bike.position.set(-6.35, W, -0.72);
  bike.rotation.y = 0.16;
  bike.rotation.z = -0.055;
  scene.add(bike);
  reg(bike, layer.prop);

  /* ---------- 雨伞架 + 雨伞 ---------- */
  const umbrella = new THREE.Group();
  umbrella.add(cyl(0.17, 0.19, 0.5, toonMat(0x6b7284), { y: 0.25, seg: 14 }));
  umbrella.add(cyl(0.185, 0.185, 0.045, toonMat(0x3f4658), { y: 0.51, seg: 14 }));
  const umbColors = [0xef4444, 0x3b82f6, 0xf59e0b, 0x10b981, 0x8b5cf6];
  for (let i = 0; i < 5; i++) {
    const ang = (i / 5) * Math.PI * 2 + 0.4;
    const lean = 0.12 + rand() * 0.12;
    const u = cyl(0.022, 0.022, 0.92, toonMat(umbColors[i]), {
      x: Math.cos(ang) * 0.1,
      y: 0.62,
      z: Math.sin(ang) * 0.1,
      seg: 8,
    });
    u.rotation.set(Math.cos(ang) * lean, 0, -Math.sin(ang) * lean);
    umbrella.add(u);
    const tip = cyl(0.012, 0.03, 0.1, toonMat(umbColors[i]), {
      x: Math.cos(ang) * 0.2,
      y: 1.1,
      z: Math.sin(ang) * 0.2,
      seg: 8,
    });
    tip.rotation.copy(u.rotation);
    umbrella.add(tip);
  }
  umbrella.position.set(-2.12, W, -0.82);
  scene.add(umbrella);
  reg(umbrella, layer.prop);

  /* ---------- 垃圾桶 ---------- */
  const bin = new THREE.Group();
  bin.add(box(0.72, 0.88, 0.56, toonMat(0x39415a), { y: 0.44 }));
  bin.add(box(0.76, 0.1, 0.6, toonMat(0x0f766e), { y: 0.93 }));
  for (const sx of [-0.19, 0.19]) {
    bin.add(box(0.24, 0.3, 0.04, toonMat(0x1f2937), { x: sx, y: 0.55, z: 0.29 }));
    bin.add(box(0.2, 0.06, 0.045, flatMat(0x93c5fd), { x: sx, y: 0.74, z: 0.292 }));
  }
  bin.position.set(-1.15, W, -6.75);
  bin.rotation.y = Math.PI / 2;
  scene.add(bin);
  reg(bin, layer.prop);

  /* ---------- 电线杆 ---------- */
  function pole(x, z, h, rotY) {
    const grp = new THREE.Group();
    const wood = toonMat(0x6b6252);
    grp.add(cyl(0.145, 0.17, h, wood, { y: h / 2, seg: 12 }));
    for (const [y, w] of [
      [h - 0.75, 1.5],
      [h - 1.25, 1.18],
    ]) {
      grp.add(box(w, 0.11, 0.11, wood, { y }));
      for (const sx of [-w / 2 + 0.12, 0, w / 2 - 0.12]) {
        grp.add(cyl(0.055, 0.065, 0.15, toonMat(0xd7dee9), { x: sx, y: y + 0.13, seg: 8 }));
      }
    }
    grp.add(cyl(0.27, 0.27, 0.72, toonMat(0x7c8497), { x: 0.3, y: h - 2.25, z: 0.02, seg: 14 }));
    grp.add(box(0.3, 0.42, 0.035, toonMat(0xfbbf24), { y: 2.35, z: 0.155 }));
    grp.add(box(0.24, 0.32, 0.03, toonMat(0xe8eef8), { y: 1.65, z: 0.152 }));
    grp.position.set(x, W, z);
    grp.rotation.y = rotY;
    return grp;
  }
  const poleA = pole(2.85, 2.85, 7.2, 0.25);
  scene.add(poleA);
  reg(poleA, layer.wire);
  const poleB = pole(-10.05, 2.85, 6.85, -0.2);
  scene.add(poleB);
  reg(poleB, layer.wire);

  /* ---------- 电线 ---------- */
  const wires = new THREE.Group();
  const pA = new THREE.Vector3(2.85, W + 6.35, 2.85);
  const pB = new THREE.Vector3(-10.05, W + 6.0, 2.85);
  wires.add(
    wire(
      pA.clone().add(new THREE.Vector3(0, 0, -0.14)),
      pB.clone().add(new THREE.Vector3(0, 0, -0.14)),
      0.62
    )
  );
  wires.add(wire(pA, pB, 0.85));
  wires.add(
    wire(
      pA.clone().add(new THREE.Vector3(0, 0, 0.14)),
      pB.clone().add(new THREE.Vector3(0, 0, 0.14)),
      1.08
    )
  );
  // 到店铺的引入线（沿右侧垂落，避开正面招牌）
  wires.add(
    wire(
      pA.clone().add(new THREE.Vector3(0, -0.5, 0)),
      new THREE.Vector3(-1.75, W + 3.45, -2.6),
      0.85,
      0.017
    )
  );
  wires.add(
    wire(
      pA.clone().add(new THREE.Vector3(0, -0.72, 0)),
      new THREE.Vector3(-1.75, W + 3.45, -3.4),
      1.0,
      0.017
    )
  );
  // 延伸出画面的线（暗示街区延续）
  wires.add(
    wire(
      pA.clone().add(new THREE.Vector3(0, -0.15, 0)),
      new THREE.Vector3(2.5, W + 6.05, 11.7),
      0.5
    )
  );
  wires.add(
    wire(
      pB.clone().add(new THREE.Vector3(0, -0.15, 0)),
      new THREE.Vector3(-11.7, W + 5.85, 2.5),
      0.5
    )
  );
  scene.add(wires);
  reg(wires, layer.wire);

  /* ---------- 路灯 ---------- */
  const lamp = new THREE.Group();
  {
    const metal = toonMat(0x4b5568);
    lamp.add(cyl(0.105, 0.13, 5.3, metal, { y: 2.65, seg: 12 }));
    const armCurve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(0, 5.15, 0),
      new THREE.Vector3(0.72, 5.66, 0),
      new THREE.Vector3(1.52, 5.66, 0)
    );
    lamp.add(new THREE.Mesh(new THREE.TubeGeometry(armCurve, 16, 0.058, 7), metal));
    lamp.add(box(0.8, 0.17, 0.38, metal, { x: 1.74, y: 5.6, z: 0 }));
    const bulb = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.3), flatMat(0xffe3b3));
    bulb.rotation.x = Math.PI / 2;
    bulb.position.set(1.74, 5.505, 0);
    lamp.add(bulb);
    lamp.add(box(0.5, 0.09, 0.12, metal, { y: 1.1, z: 0.14 }));
    const spot = new THREE.SpotLight(0xffd9a2, 130, 16, 0.62, 0.55, 1.45);
    spot.position.set(1.74, 5.45, 0);
    spot.target.position.set(1.74, 0, 0.5);
    lamp.add(spot, spot.target);
    const lampGlow = new THREE.PointLight(0xffc98a, 7, 9, 1.7);
    lampGlow.position.set(1.74, 5.1, 0);
    lamp.add(lampGlow);
    const halo = new THREE.Mesh(
      new THREE.PlaneGeometry(1.5, 1.5),
      flatMat(0xffffff, {
        map: glowTexture('#ffd9a0'),
        transparent: true,
        opacity: 0.5,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    halo.position.set(1.74, 5.52, 0);
    lamp.add(halo);
  }
  lamp.position.set(3.25, W, -1.1);
  scene.add(lamp);
  reg(lamp, layer.prop);

  /* ---------- 路牌 ---------- */
  const signs = new THREE.Group();
  signs.add(cyl(0.05, 0.05, 2.55, toonMat(0x8b93a8), { y: 1.275, seg: 10 }));
  const crossSign = new THREE.Mesh(
    new THREE.PlaneGeometry(0.62, 0.62),
    flatMat(0xffffff, { map: crossingSignTexture() })
  );
  crossSign.position.set(0, 2.42, 0.035);
  signs.add(crossSign);
  const noPark = new THREE.Mesh(
    new THREE.PlaneGeometry(0.44, 0.58),
    flatMat(0xffffff, { map: noParkingSignTexture() })
  );
  noPark.position.set(0, 1.78, 0.032);
  signs.add(noPark);
  signs.add(box(0.48, 0.64, 0.035, toonMat(0xd7dee9), { y: 2.42, z: 0.008 }));
  signs.position.set(2.25, W, 3.5);
  signs.rotation.y = 0.55;
  scene.add(signs);
  reg(signs, layer.prop);

  /* ---------- 街角护栏 ---------- */
  function guardrail(x0, z0, x1, z1) {
    const grp = new THREE.Group();
    const metal = toonMat(0xe8eef8);
    const dx = x1 - x0;
    const dz = z1 - z0;
    const len = Math.hypot(dx, dz);
    const n = Math.max(2, Math.round(len / 1.5) + 1);
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      const x = x0 + dx * t;
      const z = z0 + dz * t;
      grp.add(box(0.1, 0.62, 0.1, metal, { x, y: 0.45, z }));
      grp.add(
        box(0.115, 0.07, 0.115, flatMat(0xef4444), { x, y: 0.56, z: z + (dz === 0 ? -0.065 : 0) })
      );
    }
    for (const y of [0.56, 0.37]) {
      const rail = box(
        Math.abs(dx) > Math.abs(dz) ? len : 0.055,
        0.075,
        Math.abs(dz) > Math.abs(dx) ? len : 0.055,
        metal,
        {
          x: (x0 + x1) / 2,
          y,
          z: (z0 + z1) / 2,
        }
      );
      grp.add(rail);
    }
    return grp;
  }
  const rails = new THREE.Group();
  rails.add(guardrail(-2.2, 9.6, 8.6, 9.6));
  rails.add(guardrail(9.6, -2.2, 9.6, 8.6));
  rails.add(guardrail(4.35, 3.98, 6.6, 3.98));
  scene.add(rails);
  reg(rails, layer.prop);

  /* ---------- 消防栓 ---------- */
  const hydrant = new THREE.Group();
  hydrant.add(cyl(0.13, 0.15, 0.42, toonMat(0xdc2626), { y: 0.21, seg: 12 }));
  hydrant.add(cyl(0.115, 0.115, 0.1, toonMat(0xb91c1c), { y: 0.46, seg: 12 }));
  hydrant.add(cyl(0.055, 0.055, 0.12, toonMat(0xdc2626), { y: 0.56, seg: 10 }));
  for (const sx of [-0.14, 0.14]) {
    const cap = cyl(0.06, 0.06, 0.08, toonMat(0xb91c1c), { x: sx, y: 0.3, seg: 10 });
    cap.rotation.z = Math.PI / 2;
    hydrant.add(cap);
  }
  hydrant.position.set(-0.62, W, 1.9);
  scene.add(hydrant);
  reg(hydrant, layer.prop);

  /* ---------- 公告栏 / 海报栏 ---------- */
  const board = new THREE.Group();
  for (const sx of [-0.82, 0.82]) {
    board.add(cyl(0.05, 0.05, 1.72, toonMat(0x4b5568), { x: sx, y: 0.86, seg: 10 }));
  }
  board.add(box(1.78, 1.18, 0.08, toonMat(0x8b93a8), { y: 1.12 }));
  for (let i = 0; i < 3; i++) {
    const p = new THREE.Mesh(
      new THREE.PlaneGeometry(0.5, 0.72),
      flatMat(0xffffff, { map: posterTexture(i + 1) })
    );
    p.position.set(-0.56 + i * 0.56, 1.1, 0.05);
    board.add(p);
  }
  board.add(box(1.94, 0.08, 0.26, toonMat(0x39415a), { y: 1.78 }));
  board.position.set(-7.25, W, 0.42);
  board.rotation.y = 0.12;
  scene.add(board);
  reg(board, layer.prop);

  /* ---------- 小巷堆放箱 ---------- */
  const crates = new THREE.Group();
  const wood = toonMat(0x9c7b5a);
  crates.add(box(0.52, 0.38, 0.42, wood, { x: -8.35, y: 0.33, z: -1.55 }));
  crates.add(box(0.5, 0.36, 0.4, toonMat(0x8a6b4d), { x: -8.32, y: 0.7, z: -1.62 }));
  const lean = box(0.46, 0.34, 0.06, toonMat(0xa98463), { x: -8.05, y: 0.31, z: -1.35 });
  lean.rotation.set(-0.25, 0.5, 0.12);
  crates.add(lean);
  scene.add(crates);
  reg(crates, layer.prop);

  /* ---------- 左侧邻楼（小巷一侧） ---------- */
  const neighbor = new THREE.Group();
  {
    const nWall = toonMat(0xffffff, { map: wallTexture('#323a52') });
    const body = box(2.1, 4.6, 6.8, nWall, { y: 2.3 });
    addOutline(body, 0.05);
    neighbor.add(body);
    neighbor.add(box(2.35, 0.2, 7.05, toonMat(0x252c42), { y: 4.68 }));
    neighbor.add(box(2.15, 0.12, 6.85, toonMat(0x2b3242), { y: 4.82 }));
    // 面向小巷的暗窗
    for (const [y, z] of [
      [1.5, -7.3],
      [1.5, -6.1],
      [2.9, -7.3],
      [2.9, -6.1],
      [2.9, -3.6],
      [1.5, -2.6],
    ]) {
      neighbor.add(box(0.06, 0.85, 0.62, toonMat(0x1f2937), { x: 1.06, y, z }));
      const win = new THREE.Mesh(new THREE.PlaneGeometry(0.56, 0.78), flatMat(0x33455f));
      win.position.set(1.095, y, z);
      win.rotation.y = Math.PI / 2;
      neighbor.add(win);
    }
    // 面向前方的窗
    for (const x of [-0.55, 0.45]) {
      const win = new THREE.Mesh(new THREE.PlaneGeometry(0.58, 0.8), flatMat(0x2c3c5c));
      win.position.set(x, 2.85, 3.415);
      neighbor.add(win);
    }
    // 空调 / 管道 / 巷灯
    neighbor.add(box(0.62, 0.5, 0.44, toonMat(0xb9c1d2), { x: 1.28, y: 3.15, z: -4.3 }));
    const nfan = cyl(0.16, 0.16, 0.05, toonMat(0x4b5568), { x: 1.62, y: 3.15, z: -4.3, seg: 14 });
    nfan.rotation.z = Math.PI / 2;
    neighbor.add(nfan);
    neighbor.add(cyl(0.05, 0.05, 4.4, toonMat(0x565f76), { x: 1.05, y: 2.2, z: -8.05, seg: 8 }));
    neighbor.add(cyl(0.05, 0.05, 4.4, toonMat(0x565f76), { x: 1.05, y: 2.2, z: -1.95, seg: 8 }));
    neighbor.add(box(0.18, 0.12, 0.18, flatMat(0xffc98a), { x: 1.1, y: 2.62, z: -1.6 }));
    const alleyLight = new THREE.PointLight(0xffc07a, 5, 5.5, 1.7);
    alleyLight.position.set(1.35, 2.5, -1.6);
    neighbor.add(alleyLight);
    // 霓虹灯条（粉色，营造夜景霓虹层次）
    const neonMat = flatMat(0xff6eb4);
    neighbor.add(box(0.08, 1.65, 0.16, neonMat, { x: 1.08, y: 3.4, z: -2.85 }));
    neighbor.add(box(0.08, 0.16, 1.05, neonMat, { x: 1.08, y: 4.16, z: -3.3 }));
    const neonLight = new THREE.PointLight(0xff6eb4, 6, 6, 1.8);
    neonLight.position.set(1.5, 3.4, -2.9);
    neighbor.add(neonLight);
    flickers.push({ mat: neonMat, speed: 15.7, amount: 0.12 });
    const neonGlow = new THREE.Mesh(
      new THREE.PlaneGeometry(1.6, 2.2),
      flatMat(0xffffff, {
        map: glowTexture('#ff6eb4'),
        transparent: true,
        opacity: 0.35,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    neonGlow.position.set(1.12, 3.4, -2.9);
    neonGlow.rotation.y = Math.PI / 2;
    neighbor.add(neonGlow);
    const ag = new THREE.Mesh(
      new THREE.PlaneGeometry(1.1, 1.1),
      flatMat(0xffffff, {
        map: glowTexture('#ffc98a'),
        transparent: true,
        opacity: 0.4,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    ag.position.set(1.12, 2.5, -1.6);
    ag.rotation.y = Math.PI / 2;
    neighbor.add(ag);
  }
  neighbor.position.set(-9.95, W - 0.14, -5.2);
  scene.add(neighbor);
  reg(neighbor, layer.building);

  /* ---------- 行道树（背景轮廓） ---------- */
  function tree(x, z, s = 1) {
    const grp = new THREE.Group();
    grp.add(cyl(0.13 * s, 0.17 * s, 1.35 * s, toonMat(0x4a3f35), { y: 0.68 * s, seg: 10 }));
    const leaf = toonMat(0x2e5d46);
    const b1 = new THREE.Mesh(new THREE.SphereGeometry(0.82 * s, 12, 10), leaf);
    b1.position.y = 1.72 * s;
    const b2 = new THREE.Mesh(new THREE.SphereGeometry(0.62 * s, 12, 10), leaf);
    b2.position.set(0.35 * s, 2.25 * s, -0.18 * s);
    const b3 = new THREE.Mesh(new THREE.SphereGeometry(0.55 * s, 12, 10), leaf);
    b3.position.set(-0.34 * s, 2.1 * s, 0.22 * s);
    for (const b of [b1, b2, b3]) {
      b.castShadow = true;
      addOutline(b, 0.04);
      grp.add(b);
    }
    grp.position.set(x, W, z);
    return grp;
  }
  const tree1 = tree(-9.35, -10.15, 1.05);
  scene.add(tree1);
  reg(tree1, layer.prop);
  const tree2 = tree(1.85, -10.3, 0.92);
  scene.add(tree2);
  reg(tree2, layer.prop);

  return { flickers };
}
