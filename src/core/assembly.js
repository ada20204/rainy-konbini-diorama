/**
 * 模型组装入场动画：
 * 每个部件从地面往上分层出现，scale 弹出 + 从上方落位 + 轻微旋转归位。
 */
import * as THREE from 'three';
import { rng } from './toon.js';

const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
const easeOutBack = (t) => {
  const c1 = 1.28;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

export class AssemblyController {
  constructor() {
    this.pieces = [];
    this.rand = rng(424242);
    this.total = 0;
    this.started = false;
    this.elapsed = 0;
  }

  /** 登记一个可动部件（必须是 scene 的直接子节点） */
  add(obj, layer = 0) {
    const rand = this.rand;
    this.pieces.push({
      obj,
      layer,
      y: obj.position.y,
      pos: obj.position.clone(),
      quat: obj.quaternion.clone(),
      scale: obj.scale.clone(),
      offset: new THREE.Vector3((rand() - 0.5) * 1.2, 1.15 + rand() * 1.1, (rand() - 0.5) * 1.2),
      tilt: new THREE.Euler((rand() - 0.5) * 0.45, (rand() - 0.5) * 0.7, (rand() - 0.5) * 0.45),
      dur: 0.62 + rand() * 0.22,
      delay: 0,
    });
    return obj;
  }

  /** 排序并计算时间轴：layer 优先，层内按高度从低到高 */
  finalize({ layerGap = 0.95, stagger = 0.032 } = {}) {
    const groups = new Map();
    for (const p of this.pieces) {
      if (!groups.has(p.layer)) groups.set(p.layer, []);
      groups.get(p.layer).push(p);
    }
    const layers = [...groups.keys()].sort((a, b) => a - b);
    let t = 0.25;
    layers.forEach((layer, li) => {
      const list = groups.get(layer).sort((a, b) => a.y - b.y);
      const base = t;
      list.forEach((p, i) => {
        p.delay = base + i * stagger;
      });
      t = base + Math.max(0.6, list.length * stagger) + layerGap * 0.72;
      if (li < layers.length - 1) t += layerGap * 0.28;
    });
    this.total = t + 1.2;
    this.started = true;
    return this.total;
  }

  update(elapsed) {
    if (!this.started) return;
    this.elapsed = elapsed;
    for (const p of this.pieces) {
      const raw = (elapsed - p.delay) / p.dur;
      const t = Math.min(1, Math.max(0, raw));
      if (t <= 0) {
        p.obj.visible = false;
        continue;
      }
      p.obj.visible = true;
      const ep = easeOutCubic(t);
      const es = easeOutBack(Math.min(1, t * 1.02));

      p.obj.position.set(
        p.pos.x + p.offset.x * (1 - ep),
        p.pos.y + p.offset.y * (1 - ep),
        p.pos.z + p.offset.z * (1 - ep),
      );
      p.obj.scale.set(
        p.scale.x * Math.max(0.001, es),
        p.scale.y * Math.max(0.001, es),
        p.scale.z * Math.max(0.001, es),
      );
      const qTilt = new THREE.Quaternion().setFromEuler(
        new THREE.Euler(
          p.tilt.x * (1 - ep),
          p.tilt.y * (1 - ep),
          p.tilt.z * (1 - ep),
        ),
      );
      p.obj.quaternion.copy(p.quat).multiply(qTilt);
    }
  }
}
