/* ============================================================
   SHIELD — instanced fastener / joint layer.
   Every fastener is individually addressable: click an instance
   to open its joint card (ID, joint A/B, torque → "—" because
   torqueSpecNm is null until a verified BOM is supplied).
   One InstancedMesh per fastener group keeps draw calls minimal.
   ============================================================ */

import * as THREE from 'three';
import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { FASTENER_GROUPS, type FastenerGroup } from '../../data/fasteners';
import { useStore } from '../../store/useStore';
import { Sel } from '../Sel';
import { SEL_COLOR } from '../materials';
import type { FastenerDef, FastenerFamily } from '../../schema/types';

/* ------------------------------------------------------------
   Palette per family (DEMO finish, unverified coating).
   ------------------------------------------------------------ */
const FAMILY_COLOR: Record<FastenerFamily, string> = {
  hex_flange_bolt: '#b7c0cc',
  flange_bolt: '#b7c0cc',
  socket_head_bolt: '#aeb8c6',
  stud: '#b7c0cc',
  nut: '#b0b9c6',
  washer: '#c8d0da',
  rivet: '#9aa7b8',
  self_piercing_rivet: '#8d99a8',
  spring_clip: '#9aa7b8',
  spot_weld: '#7d8896',
  seam_weld_point: '#7d8896',
  adhesive_point: '#3b4a5c',
};
const FLAGGED_COLOR = '#e2a03c';
const ACTIVE_COLOR = '#ffb02e';

/* ------------------------------------------------------------
   Geometry per family — built once, shared by all instances.
   Parts are stacked along +y (the local insertion axis); the
   instance quaternion later rotates +y onto the joint axis.
   ------------------------------------------------------------ */
const GEO_CACHE: Partial<Record<FastenerFamily, THREE.BufferGeometry>> = {};

function geoFor(family: FastenerFamily): THREE.BufferGeometry {
  const cached = GEO_CACHE[family];
  if (cached) return cached;

  const parts: THREE.BufferGeometry[] = [];
  const shift = (g: THREE.BufferGeometry, y: number) => {
    g.translate(0, y, 0);
    return g;
  };

  switch (family) {
    case 'hex_flange_bolt':
    case 'flange_bolt':
    case 'socket_head_bolt': {
      const socket = family === 'socket_head_bolt';
      const headR = socket ? 0.011 : 0.01;
      const headH = socket ? 0.012 : 0.008;
      parts.push(shift(new THREE.CylinderGeometry(0.014, 0.014, 0.003, 6), 0));              // flange
      parts.push(shift(new THREE.CylinderGeometry(headR, headR, headH, 6), 0.003));          // head (hex)
      parts.push(shift(new THREE.CylinderGeometry(0.005, 0.005, 0.05, 8), 0.003 + headH));   // shank
      break;
    }
    case 'rivet': {
      parts.push(shift(new THREE.CylinderGeometry(0.008, 0.008, 0.004, 8), 0));            // head
      parts.push(shift(new THREE.CylinderGeometry(0.004, 0.003, 0.013, 8), 0.004));        // body
      break;
    }
    case 'self_piercing_rivet': {
      parts.push(shift(new THREE.CylinderGeometry(0.01, 0.01, 0.0025, 10), 0));            // wide head
      parts.push(shift(new THREE.CylinderGeometry(0.0035, 0.0035, 0.009, 8), 0.0025));     // stem
      break;
    }
    case 'spot_weld':
      parts.push(shift(new THREE.CylinderGeometry(0.007, 0.007, 0.0035, 10), 0));
      break;
    case 'seam_weld_point': {
      parts.push(shift(new THREE.BoxGeometry(0.02, 0.004, 0.006), 0));
      break;
    }
    case 'adhesive_point':
      parts.push(shift(new THREE.BoxGeometry(0.02, 0.005, 0.02), 0));
      break;
    case 'spring_clip': {
      parts.push(shift(new THREE.CylinderGeometry(0.003, 0.003, 0.006, 8), 0));
      parts.push(shift(new THREE.TorusGeometry(0.0085, 0.0026, 6, 12), 0.007));
      break;
    }
    default:
      parts.push(shift(new THREE.CylinderGeometry(0.006, 0.006, 0.02, 8), 0));
  }

  const geo = mergeGeometries(parts) ?? new THREE.BufferGeometry();
  geo.computeVertexNormals();
  GEO_CACHE[family] = geo;
  return geo;
}

const _pos = new THREE.Vector3();
const _ax = new THREE.Vector3();
const _col = new THREE.Color();
const _colHover = new THREE.Color(SEL_COLOR);
const _colActive = new THREE.Color(ACTIVE_COLOR);

/* ------------------------------------------------------------
   One group → one InstancedMesh. Per-instance matrices are
   rebuilt when the explosion slider moves (joints ease apart
   along their own insertion axis on top of the Sel group offset).
   ------------------------------------------------------------ */
function InstancedGroup({ group }: { group: FastenerGroup }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const activeFastener = useStore((s) => s.activeFastener);
  const explode = useStore((s) => s.explode);
  const setActiveFastener = useStore((s) => s.setActiveFastener);
  const select = useStore((s) => s.select);
  const toggle = useStore((s) => s.toggle);

  /* base pose (no explode) — computed once per group */
  const base = useMemo(() => {
    const mats: THREE.Matrix4[] = [];
    const idm = new THREE.Matrix4();
    const up = new THREE.Vector3(0, 1, 0);
    for (const f of group.items) {
      _pos.fromArray(f.position);
      _ax.fromArray(f.axis);
      if (_ax.lengthSq() < 1e-6) _ax.set(0, 1, 0);
      _ax.normalize();
      const q = new THREE.Quaternion().setFromUnitVectors(up, _ax.clone());
      mats.push(idm.compose(_pos, q, new THREE.Vector3(1, 1, 1)).clone());
    }
    return mats;
  }, [group]);

  const geometry = useMemo(() => geoFor(group.family), [group.family]);

  /* instance matrices = base pose + per-axis loosen offset */
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const k = explode * 0.08; // joints ease out of their bores
    for (let i = 0; i < group.items.length; i++) {
      _ax.fromArray(group.items[i].axis).normalize();
      const m = base[i].clone();
      const e = m.elements;
      m.setPosition(e[12] + _ax.x * k, e[13] + _ax.y * k, e[14] + _ax.z * k);
      mesh.setMatrixAt(i, m);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, [explode, base, group]);

  /* per-instance coloring: base / flagged / hover / active */
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    for (let i = 0; i < group.items.length; i++) {
      const f: FastenerDef = group.items[i];
      let c: THREE.Color;
      if (activeFastener && activeFastener.id === f.id) c = _colActive;
      else if (hoverIdx === i) c = _colHover;
      else if (f.status === 'flagged') {
        c = _col.copy(new THREE.Color(FLAGGED_COLOR));
      } else {
        c = _col.copy(new THREE.Color(FAMILY_COLOR[f.family] ?? '#b7c0cc'));
      }
      mesh.setColorAt(i, c);
    }
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [hoverIdx, activeFastener, group]);

  return (
    <instancedMesh
      ref={ref}
      args={[geometry, undefined, group.items.length]}
      castShadow
      receiveShadow
      frustumCulled={false}
      onClick={(e) => {
        const iid = e.instanceId;
        if (iid === undefined || iid === null) return;
        e.stopPropagation();
        const f = group.items[iid];
        // add the joint to the component selection (single-select) without
        // clearing the fastener card — mirror the Sel click contract.
        if (e.shiftKey) toggle(f.componentA);
        else select(f.componentA);
        setActiveFastener(f);
      }}
      onPointerOver={(e) => {
        const iid = e.instanceId;
        if (iid !== undefined && iid !== null) setHoverIdx(iid);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHoverIdx(null);
        document.body.style.cursor = 'auto';
      }}
      onContextMenu={(e) => {
        e.stopPropagation();
        const iid = e.instanceId;
        if (iid === undefined || iid === null) return;
        setActiveFastener(group.items[iid]);
      }}
    >
      <meshStandardMaterial color="#ffffff" metalness={0.85} roughness={0.42} />
    </instancedMesh>
  );
}

export function Fasteners() {
  return (
    <group>
      {FASTENER_GROUPS.map((g) => (
        <Sel key={g.id} cid={g.id}>
          <InstancedGroup group={g} />
        </Sel>
      ))}
    </group>
  );
}