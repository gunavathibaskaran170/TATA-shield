/* ============================================================
   SHIELD — Logical signal paths + digital mapping lines
   Clean engineering connections (no cable clutter). Animated
   dashed lines with travelling data pulses.
   ============================================================ */

import * as THREE from 'three';

const LINE_MAT = (color, dash = 0.012, gap = 0.008) => new THREE.LineDashedMaterial({
  color, dashSize: dash, gapSize: gap, transparent: true, opacity: 0.75,
});

function curveFromTo(from, to) {
  const mid = new THREE.Vector3().addVectors(from, to).multiplyScalar(0.5);
  const lift = 0.04;
  const liftDir = new THREE.Vector3(0, 1, 0);
  const p1 = from.clone().lerp(mid, 0.35).addScaledVector(liftDir, lift);
  const p2 = from.clone().lerp(mid, 0.65).addScaledVector(liftDir, lift);
  const curve = new THREE.CatmullRomCurve3([from, p1, p2, to]);
  curve.valid = [from, p1, p2, to].every(v => v && Number.isFinite(v.x) && Number.isFinite(v.y) && Number.isFinite(v.z));
  if (curve.valid) {
    try { curve.valid = Number.isFinite(curve.getLength()) && curve.getLength() > 1e-6; } catch (e) { curve.valid = false; }
  }
  return curve;
}

function makePulseGroup(curve, color, count = 2, scale = 0.008) {
  const g = new THREE.Group();
  const dots = [];
  for (let i = 0; i < count; i++) {
    const mat = new THREE.SpriteMaterial({
      color, transparent: true, opacity: 0.95,
      depthTest: false,
    });
    const s = new THREE.Sprite(mat);
    s.scale.setScalar(scale);
    s.userData.phase = i / count;
    g.add(s);
    dots.push(s);
  }
  g.visible = false;
  return { group: g, dots, curve };
}

export class PathSystem {
  constructor(scene) {
    this.scene = scene;
    this.signalGroup = new THREE.Group();
    this.mapGroup = new THREE.Group();
    this.signalPulses = [];
    this.mapPulses = [];
    scene.add(this.signalGroup);
    scene.add(this.mapGroup);
  }

  addSignalLine(id, from, to, color = 0x4f8cff) {
    const curve = curveFromTo(from, to);
    if (!curve.valid) return { line: null, pulse: null };
    const pts = curve.getPoints(24);
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), LINE_MAT(color));
    line.computeLineDistances();
    const pulse = makePulseGroup(curve, 0xaee9ff, 2);
    this.signalGroup.add(line);
    this.signalGroup.add(pulse.group);
    this.signalPulses.push(pulse);
    return { line, pulse };
  }

  addMapLine(id, from, to, color = 0x38d9cf) {
    const curve = curveFromTo(from, to);
    if (!curve.valid) return { line: null, pulse: null };
    const pts = curve.getPoints(24);
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), LINE_MAT(color, 0.01, 0.007));
    line.computeLineDistances();
    const pulse = makePulseGroup(curve, 0x8ffcf4, 3, 0.007);
    this.mapGroup.add(line);
    this.mapGroup.add(pulse.group);
    this.mapPulses.push(pulse);
    return { line, pulse };
  }

  showSignal(on) { this.signalGroup.visible = on; }
  showMap(on) { this.mapGroup.visible = on; }

  /* QA: snapshot pulse dot positions for a given line kind */
  pulseSnapshot(kind = 'map', index = 0) {
    const arr = kind === 'signal' ? this.signalPulses : this.mapPulses;
    const p = arr[index];
    if (!p || !p.curve.valid) return { kind, index, dots: [] };
    return {
      kind, index,
      dots: p.dots.map(d => [+d.position.x.toFixed(4), +d.position.y.toFixed(4), +d.position.z.toFixed(4)]),
    };
  }

  setOpacity(group, opacity) {
    group.children.forEach(obj => {
      if (obj.isLine && obj.material) obj.material.opacity = opacity;
    });
  }

  /* animate pulses along curves */
  tick(t) {
    const step = (pulse, speed) => {
      if (!pulse.curve.valid) return;
      pulse.group.visible = pulse.group.parent.visible && pulse.group.visible !== undefined;
      pulse.dots.forEach(d => {
        const u = ((t * speed) + d.userData.phase) % 1;
        const p = pulse.curve.getPointAt(u);
        d.position.copy(p);
      });
    };
    const sigOn = this.signalGroup.visible;
    this.signalPulses.forEach(p => p.group.visible = sigOn);
    this.mapPulses.forEach(p => p.group.visible = this.mapGroup.visible);
    this.signalPulses.forEach(p => step(p, 0.35));
    this.mapPulses.forEach(p => step(p, 0.5));
  }
}