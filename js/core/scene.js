/* ============================================================
   SHIELD — 3D core — renderer / environment / camera / loop
   Shared by all pages: identical lighting, tone, camera feel.
   v2 — premium studio lighting for metallic CAD reflections.
   ============================================================ */

import * as THREE from 'three';
import { OrbitControls } from '../../vendor/OrbitControls.js';

/* --- Procedural environment map: CAD studio reflections --- */
export function makeEnvironment(renderer) {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext('2d');

  const grad = ctx.createLinearGradient(0, 0, 0, size);
  grad.addColorStop(0.0, '#3a475e');
  grad.addColorStop(0.32, '#1a2434');
  grad.addColorStop(0.48, '#101826');
  grad.addColorStop(0.62, '#070c14');
  grad.addColorStop(1.0, '#04060b');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  // long soft studio strips (great for metallic rails)
  const strip = (y, h, c) => {
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(0.5, c);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, y, size, h);
  };
  strip(size * 0.12, size * 0.16, 'rgba(180,220,255,0.5)');
  strip(size * 0.30, size * 0.07, 'rgba(130,180,255,0.22)');
  strip(size * 0.58, size * 0.12, 'rgba(56,217,207,0.26)');
  strip(size * 0.80, size * 0.06, 'rgba(79,224,160,0.14)');
  // horizon glow
  const hg = ctx.createLinearGradient(0, size * 0.9, 0, size);
  hg.addColorStop(0, 'rgba(79,140,255,0)');
  hg.addColorStop(1, 'rgba(79,140,255,0.18)');
  ctx.fillStyle = hg;
  ctx.fillRect(0, size * 0.9, size, size * 0.1);

  const tex = new THREE.CanvasTexture(canvas);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromEquirectangular(tex).texture;
  tex.dispose();
  pmrem.dispose();
  return env;
}

/* --- shared study lighting: key / warm fill / cyan rim / top accent --- */
export function studyLights(scene, opts = {}) {
  const shadowSize = opts.shadow || 2048;
  const hemi = new THREE.HemisphereLight(0xbfd4ff, 0x0a0e14, 0.55);
  scene.add(hemi);

  const key = new THREE.DirectionalLight(0xffffff, 2.0);
  key.position.set(0.75, 1.25, 0.6);
  key.castShadow = true;
  key.shadow.mapSize.set(shadowSize, shadowSize);
  key.shadow.camera.near = 0.1;
  key.shadow.camera.far = 5;
  key.shadow.camera.left = -0.7;
  key.shadow.camera.right = 0.7;
  key.shadow.camera.top = 0.7;
  key.shadow.camera.bottom = -0.7;
  key.shadow.bias = -0.00035;
  scene.add(key);

  const warm = new THREE.DirectionalLight(0xffd9a8, 0.55);
  warm.position.set(-0.7, 0.35, 0.9);
  scene.add(warm);

  const cyanRim = new THREE.DirectionalLight(0x38d9cf, 0.85);
  cyanRim.position.set(-0.65, 0.22, -0.85);
  scene.add(cyanRim);

  const blueFill = new THREE.DirectionalLight(0x7fb0ff, 0.45);
  blueFill.position.set(0.4, 0.18, -0.8);
  scene.add(blueFill);

  const top = new THREE.DirectionalLight(0xcfe4ff, 0.5);
  top.position.set(0, 1.4, 0);
  scene.add(top);

  const under = new THREE.PointLight(0x38d9cf, 0.5, 1.2, 2);
  under.position.set(0, -0.01, 0);
  scene.add(under);
}

export function createView(container, opts = {}) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x06090f);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);

  scene.environment = makeEnvironment(renderer);
  studyLights(scene);

  // camera — three-quarter automotive engineering view

  // camera — three-quarter automotive engineering view
  const camera = new THREE.PerspectiveCamera(38, container.clientWidth / container.clientHeight, 0.02, 20);
  const camHome = opts.camHome || {
    pos: new THREE.Vector3(0.62, 0.46, 0.6),
    target: new THREE.Vector3(0.0, 0.02, 0.0),
  };
  camera.position.copy(camHome.pos);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.copy(camHome.target);
  controls.enableDamping = true;
  controls.dampingFactor = 0.09;
  controls.minDistance = 0.26;
  controls.maxDistance = 2.6;
  controls.maxPolarAngle = Math.PI * 0.52;
  controls.update();

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  const clock = new THREE.Clock();
  const onFrame = opts.onFrame || null;

  renderer.setAnimationLoop(() => {
    const dt = clock.getDelta();
    const t = clock.elapsedTime;
    controls.update();
    if (onFrame) onFrame(t, dt);
    renderer.render(scene, camera);
  });

  function resize() {
    const w = container.clientWidth;
    const h = container.clientHeight;
    if (w === 0 || h === 0) return;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }
  const ro = new ResizeObserver(resize);
  ro.observe(container);

  function setPointer(ev) {
    const r = container.getBoundingClientRect();
    pointer.x = ((ev.clientX - r.left) / r.width) * 2 - 1;
    pointer.y = -((ev.clientY - r.top) / r.height) * 2 + 1;
  }

  /* smooth camera motion (EXPLODED VIEW, ANOMALY FOCUS, etc.) */
  const camTween = {
    active: false, fromPos: new THREE.Vector3(), toPos: new THREE.Vector3(),
    fromTarget: new THREE.Vector3(), toTarget: new THREE.Vector3(), t: 0, dur: 0.8, cb: null,
  };
  function flyTo(pos, target, dur = 0.8, cb = null) {
    camTween.active = true;
    camTween.fromPos.copy(camera.position);
    camTween.fromTarget.copy(controls.target);
    camTween.toPos.copy(pos);
    camTween.toTarget.copy(target);
    camTween.t = 0; camTween.dur = dur; camTween.cb = cb;
  }

  function updateTween(dt) {
    if (!camTween.active) return;
    camTween.t = Math.min(1, camTween.t + dt / camTween.dur);
    const e = 1 - Math.pow(1 - camTween.t, 3);
    camera.position.lerpVectors(camTween.fromPos, camTween.toPos, e);
    controls.target.lerpVectors(camTween.fromTarget, camTween.toTarget, e);
    controls.update();
    if (camTween.t >= 1) {
      camTween.active = false;
      if (camTween.cb) camTween.cb();
    }
  }

  return {
    scene, renderer, camera, controls, raycaster, pointer, setPointer,
    flyTo, updateTween, resize,
    defaults: {
      homePos: camHome.pos.clone(),
      homeTarget: camHome.target.clone(),
    },
  };
}