/**
 * 三渲二（cel-shading）基础工具：
 * - 阶梯渐变贴图 + MeshToonMaterial 工厂
 * - 反向壳描边（inverted hull outline）
 * - 确定性随机数
 */
import * as THREE from 'three';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

/**
 * toon 阶梯渐变（8 级，前 4 级为 0）。
 * 关键：gradientMap 按未钳制的 NdotL 采样，背光（NdotL<0）必须映射为 0，
 * 否则室内点光会"漏"到屋顶/地面等背光面，形成圆形亮暗斑。
 */
export const gradientMap = (() => {
  const steps = 8;
  const data = new Uint8Array([0, 0, 0, 0, 90, 168, 217, 255]);
  const tex = new THREE.DataTexture(data, steps, 1, THREE.RedFormat);
  tex.minFilter = THREE.NearestFilter;
  tex.magFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;
  return tex;
})();

/** toon 材质 */
export function toonMat(color, opts = {}) {
  return new THREE.MeshToonMaterial({ color, gradientMap, ...opts });
}

/** 不受光照的平涂材质（招牌/发光面/贴花） */
export function flatMat(color, opts = {}) {
  return new THREE.MeshBasicMaterial({ color, ...opts });
}

export const OUTLINE_COLOR = 0x11142a;

const smoothCache = new Map();

/** 合并顶点并求平滑法线，用于描边壳扩张（硬边物体的角部不会裂缝） */
function smoothGeometry(geo) {
  let g = smoothCache.get(geo.uuid);
  if (!g) {
    try {
      g = mergeVertices(geo.clone(), 1e-4);
    } catch {
      g = geo.clone();
    }
    g.computeVertexNormals();
    smoothCache.set(geo.uuid, g);
  }
  return g;
}

/**
 * 反向壳描边：沿平滑法线外扩 thickness，BackSide 渲染。
 * mesh 需使用「几何居中 + position 定位」的方式搭建。
 */
export function addOutline(mesh, thickness = 0.03, color = OUTLINE_COLOR) {
  const base = smoothGeometry(mesh.geometry);
  const nor = base.attributes.normal;
  const expanded = base.clone();
  const p = expanded.attributes.position;
  for (let i = 0; i < p.count; i++) {
    p.setXYZ(
      i,
      p.getX(i) + nor.getX(i) * thickness,
      p.getY(i) + nor.getY(i) * thickness,
      p.getZ(i) + nor.getZ(i) * thickness
    );
  }
  p.needsUpdate = true;
  const outline = new THREE.Mesh(
    expanded,
    new THREE.MeshBasicMaterial({ color, side: THREE.BackSide })
  );
  outline.castShadow = false;
  outline.receiveShadow = false;
  mesh.add(outline);
  return outline;
}

/** 给一组 mesh 批量描边 */
export function outlineAll(meshes, thickness = 0.03) {
  for (const m of meshes) addOutline(m, thickness);
  return meshes;
}

/** mulberry32 确定性随机 */
export function rng(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 便捷盒体：几何居中、按尺寸创建，可选描边 */
export function box(w, h, d, material, { outline = 0, x = 0, y = 0, z = 0 } = {}) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  if (outline > 0) addOutline(mesh, outline);
  return mesh;
}

/** 便捷圆柱体 */
export function cyl(rt, rb, h, material, { outline = 0, seg = 16, x = 0, y = 0, z = 0 } = {}) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  if (outline > 0) addOutline(mesh, outline);
  return mesh;
}
