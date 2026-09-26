/* ============================================================
   SHIELD — world bounds registry.
   Sel registers each component's bounding sphere here (world
   space) so the camera rig can focus on any id without walking
   the scene graph on every request.
   ============================================================ */

import * as THREE from 'three';

export interface BoundsRecord {
  center: THREE.Vector3;
  radius: number;
}

export const BOUNDS = new Map<string, BoundsRecord>();

export function registerBounds(id: string, center: THREE.Vector3, radius: number) {
  let rec = BOUNDS.get(id);
  if (!rec) {
    rec = { center: new THREE.Vector3(), radius };
    BOUNDS.set(id, rec);
  }
  rec.center.copy(center);
  rec.radius = radius;
}