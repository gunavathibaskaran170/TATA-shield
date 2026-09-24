/* ============================================================
   SHIELD — Poster multi-view stage
   One shared offscreen WebGL renderer paints many small static
   panels (layers / top / front / side / rear / zones) into
   individual 2-D canvases. Keeps the whole app down to two live
   WebGL contexts (hero view + this stage).
   ============================================================ */

import * as THREE from 'three';
import { makeEnvironment } from './scene.js';

export function createPosterStage(bg = 0x0a1017) {
  const renderer = new THREE.WebGLRenderer({
    antialias: true, preserveDrawingBuffer: true, alpha: false,
  });
  renderer.setPixelRatio(1);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const env = makeEnvironment(renderer);
  const views = new Map();

  /* add(name, { canvas, scene, camera, prepare?, fit?, after? })
       prepare()  — scene state toggles before the draw
       fit(cam,w,h) — camera frustum sizing
       after(w,h) — position DOM overlays from projections      */
  function add(name, opts) {
    const { canvas, scene, camera } = opts;
    if (!scene.background) scene.background = new THREE.Color(bg);
    scene.environment = env;
    views.set(name, {
      canvas, scene, camera,
      prepare: opts.prepare || null,
      fit: opts.fit || null,
      after: opts.after || null,
    });
  }

  function draw(name) {
    const v = views.get(name);
    if (!v) return;
    const rect = v.canvas.getBoundingClientRect();
    const w = Math.max(8, Math.round(rect.width));
    const h = Math.max(8, Math.round(rect.height));
    if (v.canvas.width !== w) v.canvas.width = w;
    if (v.canvas.height !== h) v.canvas.height = h;
    if (v.prepare) v.prepare();
    if (v.fit) v.fit(v.camera, w, h);
    else if (v.camera.isPerspectiveCamera) {
      v.camera.aspect = w / h;
      v.camera.updateProjectionMatrix();
    }
    renderer.setSize(w, h, false);
    renderer.render(v.scene, v.camera);
    const ctx = v.canvas.getContext('2d');
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(renderer.domElement, 0, 0, w, h);
    if (v.after) v.after(w, h);
  }

  function renderAll() {
    for (const name of views.keys()) draw(name);
  }

  return { add, draw, renderAll, renderer };
}

/* Project a world point into panel pixel coordinates */
export function projectToPx(camera, world, w, h) {
  const v = world.clone().project(camera);
  return {
    x: (v.x * 0.5 + 0.5) * w,
    y: (-v.y * 0.5 + 0.5) * h,
    visible: v.z < 1,
  };
}

/* Orthographic fit: guarantee minHalfH vertically and minHalfW
   horizontally while keeping the aspect ratio. */
export function fitOrtho(cam, w, h, minHalfH, minHalfW = 0) {
  const aspect = w / h;
  let halfH = minHalfH;
  if (minHalfW && halfH * aspect < minHalfW) halfH = minHalfW / aspect;
  cam.top = halfH;
  cam.bottom = -halfH;
  cam.left = -halfH * aspect;
  cam.right = halfH * aspect;
  cam.updateProjectionMatrix();
}
