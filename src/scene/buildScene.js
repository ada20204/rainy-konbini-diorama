/**
 * 场景总装：底座 → 店铺 → 街具 → 雨。
 * reg(obj, layer) 把部件登记给装配动画。
 */
import { buildBase } from './base.js';
import { buildStore } from './store.js';
import { buildProps } from './props.js';
import { createRain, createSplashes } from '../core/rain.js';
import { L } from './layout.js';

export function buildWorld(scene, reg) {
  buildBase(scene, reg);
  const store = buildStore(scene, reg);
  const props = buildProps(scene, reg);
  const flickers = [...store.flickers, ...props.flickers];

  const exclude = [
    { x0: L.store.x0, x1: L.store.x1, z0: L.store.z0, z1: L.store.z1 },
    { x0: L.neighbor.x0, x1: L.neighbor.x1, z0: L.neighbor.z0, z1: L.neighbor.z1 },
  ];
  const rain = createRain(scene, { exclude });
  const splashes = createSplashes(scene, { exclude });

  const world = {
    rainStart: 6.5, // 雨开始淡入的时间（main.js 会按装配总时长覆写）
    update(dt, t) {
      if (t > world.rainStart) rain.update(dt);
      splashes.update(dt, t > world.rainStart ? 1 : 0);
      for (const f of flickers) {
        const k =
          1 +
          f.amount * Math.sin(t * f.speed) * (0.55 + 0.45 * Math.sin(t * f.speed * 0.37 + 1.7));
        f.mat.color.setScalar(k);
      }
    },
  };
  return world;
}
