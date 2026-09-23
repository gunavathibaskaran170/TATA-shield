/* ============================================================
   SHIELD — 3D core — renderer / environment / camera / loop
   Shared by all pages so every view has identical lighting,
   tone and camera behaviour.
   ============================================================ */

import * as THREE from 'three';
import { OrbitControls } from '../../vendor/OrbitControls.js';

/* --- Procedural environment map (metallic CAD reflections) --- */
function makeEnvironment(renderer) {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext('2d');

  const grad = ctx.createLinearGradient(0, 0, 0, size);
  grad.addColorStop(0.0, '#2b3547');
  grad.addColorStop(0.45, '#0e1622');
  grad.addColorStop(0.55, '#090e16');
  grad.addColorStop(1.0, '#04060b');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  // soft "studio strip" highlights
  ctx.fillStyle = 'rgba(160, 210, 255, 0.28)';
  ctx.fillRect(0, size * 0.20, size, size * 0.10);
  ctx.fillStyle = 'rgba(56, 217, 207, 0.12)';
  ctx.fillRect(0, size * 0.62, size, size * 0.06);

  const tex = new THREE.CanvasTexture(canvas);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromEquirectangular(tex).texture;
  tex.dispose();
  pmrem.dispose();
  return env;
}

export function createView(container, opts = {}) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x070b12);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  container.appendChild(renderer.domElement);

  scene.environment = makeEnvironment(renderer);

  // lights
  const hemi = new THREE.HemisphereLight(0xbfd4ff, 0x0a0e14, 0.75);
  scene.add(hemi);

  const key = new THREE.DirectionalLight(0xffffff, 2.3);
  key.position.set(0.7, 1.1, 0.55);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.near = 0.1;
  key.shadow.camera.far = 4;
  key.shadow.camera.left = -0.6;
  key.shadow.camera.right = 0.6;
  key.shadow.camera.top = 0.6;
  key.shadow.camera.bottom = -0.6;
  key.shadow.bias = -0.0004;
  scene.add(key);

  const rim = new THREE.DirectionalLight(0x38d9cf, 0.6);
  rim.position.set(-0.6, 0.15, -0.8);
  scene.add(rim);

  const fill = new THREE.DirectionalLight(0x9fb8ff, 0.5);
  fill.position.set(-0.5, 0.3, 0.7);
  scene.add(fill);

  // camera — default three-quarter isometric automotive view
  const camera = new THREE.PerspectiveCamera(36, container.clientWidth / container.clientHeight, 0.02, 20);
  const camHome = opts.camHome || {
    pos: new THREE.Vector3(0.70, 0.52, 0.68),
    target: new THREE.Vector3(0.0, 0.02, 0.0),
  };
  camera.position.copy(camHome.pos);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.copy(camHome.target);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 0.28;
  controls.maxDistance = 2.8;
  controls.maxPolarAngle = Math.PI * 0.55;
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

  /* ------------------------------------------------------------------
     Smooth camera motion (used by EXPLODED INSTRUMENTATION etc.)
  ------------------------------------------------------------------ */
  const camTween = { active: false, fromPos: new THREE.Vector3(), toPos: new THREE.Vector3(),
                     fromTarget: new THREE.Vector3(), toTarget: new THREE.Vector3(), t: 0, dur: 0.8, cb: null };
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
    const e = 1 - Math.pow(1 - camTween.t, 3); // easeOutCubic
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