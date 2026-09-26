import * as THREE from 'three';
import { useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useStore } from '../store/useStore';
import { CATALOG_BY_ID, relatedIds } from '../data/catalog';
import { GHOST_COLOR, SEL_COLOR, heatColor } from './materials';
import { registerBounds } from './registry';
import type { Vec3 } from '../schema/dims';

/* Snapshot of the original material so fx can be applied/reverted. */
interface MatSnap {
  color: THREE.Color;
  emissive: THREE.Color;
  emissiveIntensity: number;
  opacity: number;
  transparent: boolean;
  depthWrite: boolean;
  roughness: number;
  wireframe: boolean;
}

const snapMap = new WeakMap<THREE.Material, MatSnap>();

const _c = new THREE.Color();
const _e = new THREE.Color();

const IS_EXTERIOR = new Set([
  'FrontBumper', 'Hood', 'FrontFender_L', 'FrontFender_R', 'Windshield',
  'Door_FL', 'Door_FR', 'RoofPanel', 'SideGlass_L', 'SideGlass_R',
  'Door_RL', 'Door_RR', 'QuarterPanel_L', 'QuarterPanel_R', 'RearGlass',
  'Tailgate', 'RearBumper', 'ArchCladding_FL', 'ArchCladding_FR',
  'ArchCladding_RL', 'ArchCladding_RR', 'RockerCladding_L', 'RockerCladding_R',
  'Headlamp_L', 'Headlamp_R', 'Taillamp_L', 'Taillamp_R', 'Mirrors',
  'DoorHandle_FL', 'DoorHandle_FR', 'DoorHandle_RL', 'DoorHandle_RR', 'ChargeFlap'
]);

/**
 * Sel — wraps any group of meshes and wires it into the SHIELD
 * interaction contract: selection, hover, double-click isolate,
 * long-press menu, opacity, ghost, X-ray, dim, wireframe, heat tint,
 * layer opacity, clipping and explosion.
 */
export function Sel(props: { cid: string; children: ReactNode; passive?: boolean }) {
  const { cid, children, passive } = props;
  const group = useRef<THREE.Group>(null);

  const def = CATALOG_BY_ID[cid];
  const layer = def?.layer ?? 0;

  /* ------- narrow store subscriptions (only re-render when THIS changes) */
  const hidden = useStore((s) => !!s.hidden[cid]);
  const layerVisible = useStore((s) => s.layerVisible[layer] ?? true);
  const ghosted = useStore((s) => !!s.ghosted[cid]);
  const opacity = useStore((s) => s.opacity[cid] ?? 1) as number;
  const layerOpacity = useStore((s) => s.layerOpacity[layer] ?? 1) as number;
  const xray = useStore((s) => s.xray);
  const wireframe = useStore((s) => s.wireframe);
  const dimOthers = useStore((s) => s.dimOthers);
  const selectedArr = useStore((s) => s.selected);
  const hovered = useStore((s) => s.hovered);
  const heatmapMode = useStore((s) => s.heatmapMode);
  const heat = useStore((s) => (s.heatValues[cid] ?? 0) as number);
  const clipEnabled = useStore((s) => s.clipEnabled || s.clipBoxOn);
  const isClippedFn = useStore((s) => s.isClipped);
  const explode = useStore((s) => s.explode);
  const explodeSelected = useStore((s) => s.explodeSelected);
  const explodeSystem = useStore((s) => s.explodeSystem);
  const selectedSet = useStore((s) => s.selected.map((x) => x));

  const select = useStore((s) => s.select);
  const toggle = useStore((s) => s.toggle);
  const setHovered = useStore((s) => s.setHovered);
  const solo = useStore((s) => s.solo);
  const openContextMenu = useStore((s) => s.openContextMenu);

  const viewMode = useStore((s) => s.viewMode);
  const selected = selectedArr.includes(cid);
  const isHovered = hovered === cid;
  const hasSelection = selectedArr.length > 0;

  /* dimension / clip stats cache */
  const [stats, setStats] = useState<{ center: Vec3; radius: number } | null>(null);
  useLayoutEffect(() => {
    if (!group.current) return;
    const b = new THREE.Box3().setFromObject(group.current);
    if (b.isEmpty()) return;
    const r = b.getBoundingSphere(new THREE.Sphere()).radius;
    group.current.updateMatrixWorld(true);
    const bw = new THREE.Box3().setFromObject(group.current);
    const cw = bw.getCenter(new THREE.Vector3());
    const validRadius = isNaN(r) || r <= 0 ? 0.1 : Math.max(0.02, r);
    if (isNaN(cw.x) || isNaN(cw.y) || isNaN(cw.z)) return;
    setStats({ center: [cw.x, cw.y, cw.z], radius: validRadius });
    registerBounds(cid, cw, validRadius);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [explode > 0.001 ? Math.round(explode * 10) : 0, cid]);

  const clipped = clipEnabled && stats ? isClippedFn(cid, stats.center, stats.radius) : false;

  /* ------- explosion translation */
  const offset = useMemo(() => {
    if (explode <= 0.001 || !def) return [0, 0, 0] as Vec3;
    let boost = 0;
    if (explodeSelected && selectedSet.length && (selectedSet.includes(cid) || relatedIds(cid).some((r) => selectedSet.includes(r) && r !== cid))) {
      boost = 0.6;
    }
    if (explodeSystem && def.system === explodeSystem) boost = Math.max(boost, 0.45);
    const k = (0.32 * def.explodeGroup + boost) * explode;
    const dd = def.explodeDir;
    return [dd[0] * k, dd[1] * k, dd[2] * k] as Vec3;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [explode, explodeSelected, explodeSystem, selectedSet, cid]);

  /* ------- apply material fx */
  useLayoutEffect(() => {
    const g = group.current;
    if (!g) return;
    const related = relatedIds(cid);
    const isRelated = selectedArr.some((s) => related.includes(s));
    const dim = dimOthers && hasSelection && !selected && !isRelated && !isHovered;
    const heatOn = heatmapMode !== 'off';

    g.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      const mat = mesh.material;
      if (Array.isArray(mat) || mat instanceof THREE.MeshBasicMaterial) return;
      const m = mat as THREE.MeshStandardMaterial;
      let snap = snapMap.get(m);
      if (!snap) {
        snap = {
          color: m.color.clone(), emissive: m.emissive.clone(), emissiveIntensity: m.emissiveIntensity,
          opacity: m.opacity, transparent: m.transparent, depthWrite: m.depthWrite,
          roughness: m.roughness, wireframe: m.wireframe,
        };
        snapMap.set(m, snap);
      }
      // opacity — the component's authored base opacity (e.g. the
      // ghosted body skin and glass) is a multiplier, so setting
      // the opacity slider to 100% does not accidentally turn a
      // semi-transparent material opaque.
      let t = snap.opacity * opacity * layerOpacity;
      if (ghosted) t = Math.min(t, 0.16);
      if (xray) t = Math.min(t, selected || isHovered ? 1 : 0.13);
      if (dim) t *= 0.45;
      m.transparent = t < 0.999;
      m.opacity = Math.min(1, Math.max(0.02, t));
      m.depthWrite = !m.transparent && t >= 0.999;
      m.wireframe = wireframe;

      // color / emissive
      _c.copy(snap.color);
      if (ghosted) _c.lerp(GHOST_COLOR, 0.72);
      if (dim) _c.multiplyScalar(0.8);
      m.color.copy(_c);

      _e.copy(snap.emissive);
      let ei = snap.emissiveIntensity;
      if (heatOn && heat > 0.04) {
        _e.copy(heatColor(heat));
        ei = Math.max(ei, 0.45 + heat * 0.55);
      }
      if (selected) { _e.copy(SEL_COLOR); ei = 0.8; }
      else if (isHovered) { _e.copy(SEL_COLOR); ei = 0.42; }
      m.emissive.copy(_e);
      m.emissiveIntensity = ei;
    });
  }, [cid, opacity, layerOpacity, ghosted, xray, selected, isHovered, wireframe, dimOthers, hasSelection, selectedArr, heat, heatmapMode]);

  /* ------- pointer events (long-press for touch context menu) */
  const press = useRef<{ t: number; x: number; y: number } | null>(null);
  const longPressed = useRef(false);

  const visible = !hidden && layerVisible && !clipped;
  if (!visible) return null;

  return (
    <group
      ref={group}
      name={cid}
      position={offset}
      onClick={(e) => {
        e.stopPropagation();
        if (e.shiftKey) toggle(cid);
        else select(cid, e.shiftKey);
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        solo(cid);
      }}
      onPointerOver={(e) => {
        if (passive) return;
        e.stopPropagation();
        setHovered(cid);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        if (passive) return;
        if (useStore.getState().hovered === cid) setHovered(null);
        document.body.style.cursor = 'auto';
      }}
      onPointerDown={(e) => {
        longPressed.current = false;
        press.current = { t: Date.now(), x: e.nativeEvent.clientX, y: e.nativeEvent.clientY };
      }}
      onPointerUp={(e) => {
        const p = press.current;
        if (p && Date.now() - p.t > 520) {
          const dx = e.nativeEvent.clientX - p.x;
          const dy = e.nativeEvent.clientY - p.y;
          if (Math.abs(dx) < 14 && Math.abs(dy) < 14) {
            longPressed.current = true;
            openContextMenu({ kind: 'component', id: cid, x: e.nativeEvent.clientX, y: e.nativeEvent.clientY });
          }
        }
      }}
      onContextMenu={(e) => {
        e.nativeEvent.preventDefault();
        openContextMenu({ kind: 'component', id: cid, x: e.nativeEvent.clientX, y: e.nativeEvent.clientY });
      }}
    >
      {children}
    </group>
  );
}