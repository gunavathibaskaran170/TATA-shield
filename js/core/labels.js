/* SHIELD — Canvas sprite labels (always face camera) */

import * as THREE from 'three';

export function makeLabel(text, opts = {}) {
  const size = opts.size || 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = Math.max(64, Math.floor(size * 0.42));
  const ctx = canvas.getContext('2d');

  const scale = size / 256;
  ctx.font = `600 ${Math.round(44 * scale)}px "Segoe UI", system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const padX = 30;
  const w = ctx.measureText(text).width + padX * 2;
  // re-scale canvas to fit text
  canvas.width = Math.ceil(w);
  canvas.height = Math.ceil(84 * scale);
  const ctx2 = canvas.getContext('2d');
  ctx2.font = `600 ${Math.round(44 * scale)}px "Segoe UI", system-ui, sans-serif`;
  ctx2.textAlign = 'center';
  ctx2.textBaseline = 'middle';

  if (opts.bg) {
    ctx2.fillStyle = opts.bg;
    ctx2.fillRect(0, 0, canvas.width, canvas.height);
  }

  ctx2.fillStyle = opts.color || '#d9e4f4';
  ctx2.shadowColor = 'rgba(0,0,0,0.85)';
  ctx2.shadowBlur = 8;
  ctx2.fillText(text, canvas.width / 2, canvas.height / 2 + 2);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.SpriteMaterial({
    map: tex, transparent: true, depthTest: false, sizeAttenuation: true,
    polygonOffset: true, polygonOffsetFactor: -1,
  });
  const sprite = new THREE.Sprite(mat);
  // world scale matches the canvas aspect ratio, sized by spriteScale
  const baseH = opts.spriteScale || 0.05;
  const aspect = canvas.width / canvas.height;
  sprite.scale.set(baseH * aspect, baseH, 1);
  sprite.userData.labelScale = baseH * aspect;
  return sprite;
}

export function setLabelOpacity(sprite, opacity) {
  if (sprite && sprite.material) sprite.material.opacity = opacity;
}