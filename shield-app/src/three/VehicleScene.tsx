/* ============================================================
   SHIELD — the 3D twin scene.
   Canvas + studio lighting (procedural environment map, zero
   network assets) + the full component assembly + instanced
   fasteners + sensor overlay + camera rig + clip gizmos +
   load-path arrows.
   ============================================================ */

import * as THREE from 'three';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Grid, Lightformer, OrbitControls } from '@react-three/drei';
import { useStore, type ViewPreset } from '../store/useStore';
import { BOUNDS } from './registry';
import { D } from '../schema/dims';

import { Exterior } from './systems/Exterior';
import { BIW } from './systems/BIW';
import {
  BatteryPack,
  ChassisFrame,
  CoolingModule,
  DriveUnit,
  HVBus,
  PowerElectronics,
  RearDriveUnit,
} from './systems/Skateboard';
import { Suspension, Steering } from './systems/SuspensionSteering';
import { BrakesWheels } from './systems/BrakesWheels';
import { Cabin } from './systems/Cabin';
import { Thermal, Electrical } from './systems/ThermalElectrical';
import { Fasteners } from './systems/Fasteners';
import { Sensors } from './systems/Sensors';
import { ShieldInstrumentBox } from './systems/ShieldBox';
import { EXPLODE, ExplodedOverlays } from './ExplodedView';
import { WorkbenchGizmos } from './WorkbenchGizmos';
import { ProductionSuv } from './systems/ProductionSuv';

/* ------------------------------------------------------------
   Camera presets (earth axes, +z forward) — demo camera moves.
   ------------------------------------------------------------ */
const PRESETS: Record<ViewPreset, { pos: [number, number, number]; tgt: [number, number, number] }> = {
  iso: { pos: [4.1, 2.6, 4.1], tgt: [0, 0.72, 0] },
  front: { pos: [0, 1.05, 4.6], tgt: [0, 1.05, 0] },
  rear: { pos: [0, 1.05, -4.6], tgt: [0, 1.05, 0] },
  left: { pos: [-4.6, 1.2, 0], tgt: [0, 0.9, 0] },
  right: { pos: [4.6, 1.2, 0], tgt: [0, 0.9, 0] },
  top: { pos: [0, 5.8, 0.02], tgt: [0, 0, 0] },
  bottom: { pos: [1.0, -3.4, 0.6], tgt: [0, 0.45, 0] },
};

const DEFAULT_GOAL = { pos: new THREE.Vector3(...PRESETS.iso.pos), tgt: new THREE.Vector3(...PRESETS.iso.tgt) };

interface Goal {
  pos: THREE.Vector3;
  tgt: THREE.Vector3;
}

/* Shared between CameraRig and FitRig.

   `flying` means a scripted camera move is in flight. While it is
   true the rig drives the camera; the moment it reaches the goal —
   or the user grabs the scene, or FitRig takes over — it is set
   false and OrbitControls owns the camera again. Without this
   hand-off the rig re-asserts its goal every frame and dragging
   the scene appears to do nothing, which is what made the 360°
   orbit feel disabled. */
const camState = { flying: false };

function CameraRig() {
  const controls = useThree((s) => s.controls) as unknown as {
    object?: THREE.PerspectiveCamera;
    target?: THREE.Vector3;
    update?: () => void;
    addEventListener?: (t: string, fn: () => void) => void;
  } | null;

  const viewPreset = useStore((s) => s.viewPreset);
  const focusRequest = useStore((s) => s.focusRequest);
  const resetToken = useStore((s) => s.resetToken);
  const explode = useStore((s) => s.explode);
  const batteryMode = useStore((s) => s.batteryMode);

  const [goal, setGoal] = useState<Goal>(DEFAULT_GOAL);
  const goalRef = useRef(goal);
  goalRef.current = goal;
  const firstEffect = useRef(true);

  const flyTo = (p: [number, number, number], t: [number, number, number]) => {
    setGoal({ pos: new THREE.Vector3(...p), tgt: new THREE.Vector3(...t) });
    camState.flying = true;
  };

  useEffect(() => {
    if (!controls || !controls.object || !viewPreset) return;
    const p = PRESETS[viewPreset];
    if (p) flyTo(p.pos, p.tgt);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewPreset, controls]);

  useEffect(() => {
    flyTo(DEFAULT_GOAL.pos.toArray() as [number, number, number], DEFAULT_GOAL.tgt.toArray() as [number, number, number]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetToken]);

  const zoomToken = useStore((s) => s.zoomToken);
  const zoomFactor = useStore((s) => s.zoomFactor);

  useEffect(() => {
    if (!controls || !controls.object || !controls.target || !zoomToken) return;
    const cam = controls.object;
    const tgt = controls.target;
    if (!cam || !tgt) return;
    const offset = cam.position.clone().sub(tgt);
    offset.multiplyScalar(zoomFactor);
    cam.position.copy(tgt.clone().add(offset));
    if (controls.update) controls.update();
    camState.flying = false;
  }, [zoomToken, zoomFactor, controls]);

  useEffect(() => {
    if (!focusRequest || !controls || !controls.object || !controls.target) return;
    const rec = BOUNDS.get(focusRequest.id);
    if (!rec || isNaN(rec.radius)) return;
    const cam = controls.object;
    if (!cam) return;
    const offset = cam.position.clone().sub(controls.target).normalize();
    if (offset.lengthSq() < 1e-6) offset.set(1, 0.6, 1).normalize();
    const dist = rec.radius * 3.4;
    if (isNaN(dist)) return;
    setGoal({
      tgt: rec.center.clone(),
      pos: rec.center.clone().add(offset.multiplyScalar(dist)),
    });
    camState.flying = true;
  }, [focusRequest, controls]);

  /* a change in explode / battery presentation re-frames the shot, but
     never on first mount (FitRig owns the opening frame) */
  useEffect(() => {
    if (firstEffect.current) {
      firstEffect.current = false;
      return;
    }
    if (!controls || !controls.object) return;
    const p = PRESETS.iso;
    flyTo(p.pos, p.tgt);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [explode, batteryMode, controls]);

  /* the moment the user grabs the scene, abandon any camera move so the
     orbit feels immediate and never fights the pointer */
  useEffect(() => {
    if (!controls || typeof controls.addEventListener !== 'function') return;
    controls.addEventListener('start', () => {
      camState.flying = false;
    });
  }, [controls]);

  useFrame(() => {
    const c = controls;
    if (!c || !c.object || !c.target || !camState.flying) return;
    const g = goalRef.current;
    if (!g || !g.pos || !g.tgt) return;
    const p = c.object.position;
    if (!p) return;
    if (p.distanceTo(g.pos) > 0.004) {
      p.lerp(g.pos, 0.085);
      c.target.lerp(g.tgt, 0.085);
      if (c.update) c.update();
    } else {
      p.copy(g.pos);
      c.target.copy(g.tgt);
      if (c.update) c.update();
      /* reached the goal — hand the camera back to OrbitControls */
      camState.flying = false;
    }
  });

  return null;
}

/* ------------------------------------------------------------
   Clip-plane gizmos — drag the translucent slab along its axis
   to position the section cut. Double-click removes the plane.
   ------------------------------------------------------------ */
const AXIS_COLOR = { x: '#ff6b5e', y: '#4fe0a0', z: '#4f8cff' } as const;

function PlaneGizmo({ axis, offset, index }: { axis: 'x' | 'y' | 'z'; offset: number; index: number }) {
  const setClipPlane = useStore((s) => s.setClipPlane);
  const removeClipPlane = useStore((s) => s.removeClipPlane);
  const camera = useThree((s) => s.camera);
  const drag = useRef<number | null>(null);

  const axisVec = useMemo(
    () => new THREE.Vector3(axis === 'x' ? 1 : 0, axis === 'y' ? 1 : 0, axis === 'z' ? 1 : 0),
    [axis],
  );
  const quat = useMemo(() => {
    const q = new THREE.Quaternion();
    q.setFromUnitVectors(new THREE.Vector3(0, 0, 1), axisVec.clone());
    return q;
  }, [axisVec]);

  const planeGeo = useMemo(() => new THREE.PlaneGeometry(3.6, 2.9), []);
  const frameGeo = useMemo(() => new THREE.EdgesGeometry(new THREE.PlaneGeometry(3.6, 2.9)), []);
  const leader = useMemo(
    () => new THREE.ArrowHelper(axisVec.clone(), new THREE.Vector3(), 3.4, AXIS_COLOR[axis], 0.22, 0.14),
    [axisVec, axis],
  );

  const materialRef = useRef<THREE.MeshBasicMaterial>(null);

  useFrame(({ clock }) => {
    const m = materialRef.current;
    if (m) m.opacity = 0.12 + 0.04 * Math.sin(clock.elapsedTime * 1.6 + index * 2);
  });

  const sweep = (e: { ray: THREE.Ray }) => {
    const cam = camera;
    if (!cam) return;
    const dir = cam.getWorldDirection(new THREE.Vector3());
    const side = new THREE.Vector3().crossVectors(axisVec, dir);
    let n = new THREE.Vector3().crossVectors(axisVec, side);
    if (n.lengthSq() < 1e-4) n = new THREE.Vector3().crossVectors(axisVec, new THREE.Vector3(0, 1, 0));
    n.normalize();
    const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(n, new THREE.Vector3().copy(axisVec).multiplyScalar(offset));
    const hit = new THREE.Vector3();
    if (e.ray && e.ray.intersectPlane(plane, hit)) {
      setClipPlane(index, { axis, offset: Math.max(-8, Math.min(8, hit.dot(axisVec))) });
    }
  };

  const pos = useMemo(() => ({ x: axis === 'x' ? offset : 0, y: axis === 'y' ? offset : 0, z: axis === 'z' ? offset : 0 }), [axis, offset]);

  return (
    <group position={[pos.x, pos.y, pos.z]}>
      <group quaternion={quat}>
        <mesh
          geometry={planeGeo}
          castShadow={false}
          onPointerDown={(e) => {
            e.stopPropagation();
            try {
              const el = e.nativeEvent?.currentTarget as HTMLElement | null;
              if (el && typeof el.setPointerCapture === 'function') el.setPointerCapture(e.pointerId);
            } catch {
              // ignore
            }
            drag.current = e.pointerId;
          }}
          onPointerMove={(e) => {
            e.stopPropagation();
            if (drag.current === e.pointerId) sweep(e);
          }}
          onPointerUp={(e) => {
            e.stopPropagation();
            if (drag.current === e.pointerId) drag.current = null;
          }}
          onDoubleClick={(e) => {
            e.stopPropagation();
            removeClipPlane(index);
          }}
        >
          <meshBasicMaterial
            ref={materialRef}
            color={AXIS_COLOR[axis]}
            transparent
            opacity={0.14}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
        {/* edge frame */}
        <lineSegments geometry={frameGeo}>
          <lineBasicMaterial color={AXIS_COLOR[axis]} transparent opacity={0.8} />
        </lineSegments>
      </group>
      {/* axis leader line */}
      <primitive object={leader} />
    </group>
  );
}

function ClipGizmos() {
  const enabled = useStore((s) => s.clipEnabled);
  const planes = useStore((s) => s.clipPlanes);
  const clipBoxOn = useStore((s) => s.clipBoxOn);
  const clipBox = useStore((s) => s.clipBox);

  if (!enabled && !clipBoxOn) return null;
  return (
    <group>
      {planes.map((pl, i) => (
        <PlaneGizmo key={i} axis={pl.axis} offset={pl.offset} index={i} />
      ))}
      {clipBoxOn && (
        <group>
          <mesh>
            <boxGeometry args={[clipBox.x * 2, clipBox.y * 2, clipBox.z * 2]} />
            <meshBasicMaterial color="#38d9cf" transparent opacity={0.05} depthWrite={false} />
          </mesh>
          <lineSegments>
            <edgesGeometry args={[new THREE.BoxGeometry(clipBox.x * 2, clipBox.y * 2, clipBox.z * 2)]} />
            <lineBasicMaterial color="#38d9cf" transparent opacity={0.55} />
          </lineSegments>
        </group>
      )}
    </group>
  );
}

/* ------------------------------------------------------------
   Load-path arrows — representative energy paths front→rear
   (decorative, DEMO routing).
   ------------------------------------------------------------ */
function LoadArrow({ from, dir, phase }: { from: [number, number, number]; dir: [number, number, number]; phase: number }) {
  const mat = useRef<THREE.MeshBasicMaterial>(null);
  const geom = useMemo(() => {
    const d = new THREE.Vector3(...dir).normalize();
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d);
    const len = 0.55;
    const mid = new THREE.Vector3(...from).addScaledVector(d, len * 0.5);
    const tip = new THREE.Vector3(...from).addScaledVector(d, len + 0.08);
    return {
      q,
      mid: mid.toArray() as [number, number, number],
      tip: tip.toArray() as [number, number, number],
      len,
    };
  }, [from, dir]);
  useFrame(({ clock }) => {
    const m = mat.current;
    if (m) m.opacity = 0.28 + 0.2 * (0.5 + 0.5 * Math.sin(clock.elapsedTime * 2.2 + phase));
  });
  return (
    <group>
      <mesh position={geom.mid} quaternion={geom.q}>
        <cylinderGeometry args={[0.015, 0.015, geom.len, 8]} />
        <meshBasicMaterial ref={mat} color="#38d9cf" transparent opacity={0.4} depthWrite={false} />
      </mesh>
      <mesh position={geom.tip} quaternion={geom.q}>
        <coneGeometry args={[0.05, 0.16, 10]} />
        <meshBasicMaterial color="#5fe0d6" transparent opacity={0.55} depthWrite={false} />
      </mesh>
    </group>
  );
}

function LoadPathArrows() {
  const r = D.railX;
  const ry = D.railY1 + 0.08;
  return (
    <group>
      <LoadArrow from={[0, 0.95, 2.02]} dir={[0, 0, -1]} phase={0} />
      <LoadArrow from={[-r, ry, 1.62]} dir={[0, 0, -1]} phase={0.7} />
      <LoadArrow from={[r, ry, 1.62]} dir={[0, 0, -1]} phase={1.4} />
      <LoadArrow from={[-r, ry, 0.7]} dir={[0, 0, -1]} phase={2.1} />
      <LoadArrow from={[r, ry, 0.7]} dir={[0, 0, -1]} phase={2.8} />
      <LoadArrow from={[0, 0.95, -2.1]} dir={[0, 0, -1]} phase={3.5} />
    </group>
  );
}

/* ------------------------------------------------------------
   Fit-to-view.

   Frames the whole assembly (not a stored guess) by measuring the
   scene bounds and solving the distance that makes the bounding
   sphere fill the viewport. This is what makes the vehicle sit
   large in frame instead of floating in a big empty field.
   ------------------------------------------------------------ */
function FitRig() {
  const fitToken = useStore((s) => s.fitToken);
  const cadView = useStore((s) => s.cadView);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const controls = useThree((s) => s.controls) as unknown as {
    object?: THREE.PerspectiveCamera;
    target?: THREE.Vector3;
    update?: () => void;
  } | null;

  const first = useRef(true);

  useEffect(() => {
    if (!controls || !controls.object || !controls.target || !scene || !camera) return;
    const root = scene.getObjectByName('shield-vehicle');
    if (!root) return;

    const box = new THREE.Box3().setFromObject(root);
    if (box.isEmpty()) return;
    const sphere = box.getBoundingSphere(new THREE.Sphere());
    if (isNaN(sphere.radius) || sphere.radius <= 0) return;

    /* keep the default isometric bearing so fitting never spins the car */
    const dir = new THREE.Vector3(1, 0.66, 1).normalize();
    const persp = camera as THREE.PerspectiveCamera;
    const fovAngle = persp.fov ?? 42;
    const vFov = (fovAngle * Math.PI) / 180;
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * (size.width / Math.max(1, size.height)));
    const fov = Math.min(vFov, hFov);
    /* margin leaves room for the title block, axis gizmo, callout
       labels and footer so nothing important lands off-frame */
    const margin = cadView ? 0.48 : 0.54;
    const sinHalfFov = Math.sin(fov / 2);
    if (isNaN(sinHalfFov) || sinHalfFov <= 0) return;
    const dist = (sphere.radius / sinHalfFov) * margin;

    if (isNaN(dist)) return;

    const target = sphere.center.clone();
    const pos = target.clone().add(dir.multiplyScalar(dist));
    controls.object.position.copy(pos);
    controls.target.copy(target);
    if (controls.update) controls.update();
    first.current = false;
    /* FitRig owns the camera now — do not let CameraRig drag it back */
    camState.flying = false;
  }, [fitToken, cadView, controls, scene, camera, size.width, size.height, first]);

  return null;
}

import { Component } from 'react';

class SafeEnvironment extends Component<{ children: ReactNode }> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(err: Error) {
    console.warn('Environment map disabled due to WebGL context limitation:', err);
  }
  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

const createRenderer = (canvas: HTMLCanvasElement | OffscreenCanvas) => {
  const configs: THREE.WebGLRendererParameters[] = [
    { canvas, antialias: true, alpha: false, powerPreference: 'default', failIfMajorPerformanceCaveat: false },
    { canvas, antialias: false, alpha: false, powerPreference: 'low-power', failIfMajorPerformanceCaveat: false },
    { canvas, antialias: false, alpha: true, failIfMajorPerformanceCaveat: false },
  ];

  for (const cfg of configs) {
    try {
      const renderer = new THREE.WebGLRenderer(cfg);
      if (renderer) return renderer;
    } catch {
      // try next fallback
    }
  }
  return new THREE.WebGLRenderer({ canvas });
};

/* ------------------------------------------------------------
   The scene
   ------------------------------------------------------------ */
export function VehicleScene() {
  const viewMode = useStore((s) => s.viewMode);
  const cadView = useStore((s) => s.cadView);
  const explode = useStore((s) => s.explode);
  const autoRotate = useStore((s) => s.autoRotate);
  const wireframeOpacity = useStore((s) => s.wireframeOpacity);
  const setWireframeOpacity = useStore((s) => s.setWireframeOpacity);

  const isSkeletal = viewMode === 'skeletal';
  const glRenderer = useMemo(() => createRenderer, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [5.5, 3.8, 5.5], fov: 42, near: 0.05, far: 140 }}
        gl={glRenderer}
        onPointerMissed={() => useStore.getState().clearSelection()}
      >
        <color attach="background" args={[isSkeletal ? (cadView ? '#f0f3f6' : '#ffffff') : '#e4e8ef']} />
        <fog attach="fog" args={[isSkeletal ? (cadView ? '#f0f3f6' : '#ffffff') : '#e4e8ef', 22, 65]} />

        <ambientLight intensity={isSkeletal ? (cadView ? 0.7 : 0.8) : 0.9} />
        <hemisphereLight args={['#ffffff', isSkeletal ? '#b9c0c5' : '#7f8c9d', 1.1]} />
        <directionalLight
          position={[5, 8, 4]}
          intensity={isSkeletal ? (cadView ? 1.5 : 1.3) : 1.8}
          castShadow
          shadow-mapSize={[1024, 1024]}
          shadow-camera-left={-7}
          shadow-camera-right={7}
          shadow-camera-top={7}
          shadow-camera-bottom={-7}
        />
        <directionalLight position={[-5, 3, -4]} intensity={isSkeletal ? 0.6 : 0.8} color="#8fb8e8" />
        <directionalLight position={[0, 1.5, 5]} intensity={isSkeletal ? 0.35 : 0.5} color="#ffe3c4" />
        {/* soft contact shadow catcher under the assembly */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.62, 0]} receiveShadow>
          <planeGeometry args={[40, 40]} />
          <shadowMaterial opacity={isSkeletal ? 0.18 : 0.25} />
        </mesh>

        {/* procedural studio environment — no network assets */}
        <SafeEnvironment>
          <Environment resolution={128}>
            <Lightformer intensity={1.5} position={[0, 6, 0]} scale={[9, 9, 1]} />
            <Lightformer intensity={1.0} color="#d6e4ff" position={[-6, 1.5, -1]} rotation-y={Math.PI / 2} scale={[7, 2.5, 1]} />
            <Lightformer intensity={1.0} color="#ffe2c6" position={[6, 1.5, 1]} rotation-y={-Math.PI / 2} scale={[7, 2.5, 1]} />
            <Lightformer intensity={0.6} color="#9fb4c8" position={[0, 2.5, -7]} scale={[12, 4, 1]} />
          </Environment>
        </SafeEnvironment>

        {!isSkeletal && (
          <Grid
            position={[0, 0.002, 0]}
            cellSize={0.5}
            cellThickness={0.6}
            cellColor="#b0bcc9"
            sectionSize={2.5}
            sectionThickness={1.2}
            sectionColor="#8898aa"
            fadeDistance={28}
            fadeStrength={2.2}
            infiniteGrid
          />
        )}

        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.08}
          autoRotate={autoRotate}
          autoRotateSpeed={1.5}
          minDistance={0.7}
          maxDistance={26}
          target={[0, 0.72, 0]}
        />

        <group name="shield-vehicle" scale={[1.35, 1.35, 1.35]}>
          {isSkeletal ? <VehicleAssembly cad={cadView} /> : <ProductionSuv />}
        </group>

        {isSkeletal && (cadView && explode > 0.05 ? <ExplodedOverlays /> : <LoadPathArrows />)}
        {isSkeletal && <ClipGizmos />}
        <WorkbenchGizmos />
        <CameraRig />
        <FitRig />
      </Canvas>

      {/* Floating Viewport HUD Control Pill for Wireframe Shell Opacity Adjustment */}
      <div
        style={{
          position: 'absolute',
          bottom: 16,
          right: 16,
          zIndex: 10,
          background: 'rgba(12, 16, 22, 0.88)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(6, 182, 212, 0.4)',
          borderRadius: 8,
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
          pointerEvents: 'auto',
        }}
      >
        <span style={{ color: '#00e5ff', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          🔷 Shell Net Opacity
        </span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={wireframeOpacity}
          onChange={(e) => setWireframeOpacity(parseFloat(e.target.value))}
          style={{ width: 110, height: 14, accentColor: '#00e5ff', cursor: 'pointer' }}
        />
        <span className="mono" style={{ color: '#67e8f9', fontSize: 11, fontWeight: 700, width: 36, textAlign: 'right' }}>
          {Math.round(wireframeOpacity * 100)}%
        </span>
        <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.15)', margin: '0 2px' }} />
        {[0, 0.25, 0.5, 0.75, 1].map((val) => (
          <button
            key={val}
            onClick={() => setWireframeOpacity(val)}
            style={{
              padding: '2px 5px',
              fontSize: 10,
              fontWeight: 700,
              borderRadius: 3,
              background: Math.abs(wireframeOpacity - val) < 0.05 ? '#0891b2' : 'rgba(255,255,255,0.06)',
              border: '1px solid ' + (Math.abs(wireframeOpacity - val) < 0.05 ? '#06b6d4' : 'rgba(255,255,255,0.12)'),
              color: Math.abs(wireframeOpacity - val) < 0.05 ? '#fff' : '#94a3b8',
              cursor: 'pointer',
            }}
          >
            {Math.round(val * 100)}%
          </button>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------
   The assembly. In CAD cutaway mode each sub-assembly is offset
   along the explode vector from the supplied definition, so the
   body shell floats clear above a fully fanned-out chassis while
   component selection still works exactly as it does normally.
   ------------------------------------------------------------ */
function VehicleAssembly({ cad = false }: { cad?: boolean }) {
  const explode = useStore((s) => s.explode);
  const expK = cad ? explode : 0;

  return (
    <>
      <Offset y={expK * EXPLODE.bodyY}>
        <Exterior />
        <Cabin />
      </Offset>

      {cad && <BIW />}

      <Offset y={expK * EXPLODE.batteryY}>
        <BatteryPack />
      </Offset>

      <Offset z={expK * EXPLODE.frontDriveZ}>
        <DriveUnit />
      </Offset>

      <Offset z={expK * EXPLODE.rearDriveZ}>
        <RearDriveUnit />
      </Offset>

      <Offset z={expK * EXPLODE.coolingZ}>
        <CoolingModule />
      </Offset>

      <ChassisFrame />
      <Suspension />
      <Steering />
      {cad && <PowerElectronics />}
      {cad && <HVBus />}
      {cad && <Thermal />}
      {cad && <Electrical />}
      {cad && <Fasteners />}

      <Offset x={expK * EXPLODE.wheelX}>
        <BrakesWheels side={-1} />
      </Offset>
      <Offset x={expK * -EXPLODE.wheelX}>
        <BrakesWheels side={1} />
      </Offset>

      {cad && (
        <Offset y={expK * EXPLODE.sensorY}>
          <Sensors />
        </Offset>
      )}

      {cad && (
        <Offset x={expK * EXPLODE.boxX}>
          <ShieldInstrumentBox />
        </Offset>
      )}

      {/* 3D Physics Workbench Force Vectors, Load Paths & Hotspots */}
      <WorkbenchGizmos />
    </>
  );
}

/** Offsets its children only when a non-zero vector is supplied. */
function Offset(props: {
  x?: number;
  y?: number;
  z?: number;
  children: React.ReactNode;
}) {
  const { x = 0, y = 0, z = 0, children } = props;
  if (x === 0 && y === 0 && z === 0) return <>{children}</>;
  return <group position={[x, y, z]}>{children}</group>;
}