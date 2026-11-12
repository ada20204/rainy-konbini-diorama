/**
 * 夜景灯光：冷色月光 + 环境补光。
 * 店内暖光 / 路灯 / 招牌光在各自模块里局部添加。
 */
import * as THREE from 'three';

export function setupLights(scene) {
  const hemi = new THREE.HemisphereLight(0x3d4f7c, 0x0b1022, 0.95);
  scene.add(hemi);

  // 主月光（冷调，唯一投影光源）
  const moon = new THREE.DirectionalLight(0x9db8ee, 1.5);
  moon.position.set(-9, 15, 11);
  moon.castShadow = true;
  moon.shadow.mapSize.set(2048, 2048);
  const d = 15;
  moon.shadow.camera.left = -d;
  moon.shadow.camera.right = d;
  moon.shadow.camera.top = d;
  moon.shadow.camera.bottom = -d;
  moon.shadow.camera.near = 1;
  moon.shadow.camera.far = 45;
  moon.shadow.bias = -0.0004;
  moon.shadow.normalBias = 0.025;
  scene.add(moon);
  scene.add(moon.target);

  // 反向补光，避免背光面全黑
  const fill = new THREE.DirectionalLight(0x5c79c8, 0.4);
  fill.position.set(12, 7, -12);
  scene.add(fill);

  return { hemi, moon, fill };
}
