import * as THREE from 'three';
import { useMemo, type ReactNode } from 'react';

/* Small geometry/build helpers used by all systems.

   Struts, rods and springs are deliberately slim: the reference
   CAD render reads as a structural skeleton, so these members
   should read as members rather than as chunky blocks. */

export function Strut(props: {
  a: [number, number, number];
  b: [number, number, number];
  w?: number;
  d?: number;
  children: ReactNode;
}) {
  const { a, b, w = 0.035, d = 0.026, children } = props;
  const { pos, quat, len } = useMemo(() => {
    const A = new THREE.Vector3(...a);
    const B = new THREE.Vector3(...b);
    const dir = B.clone().sub(A);
    const mid = A.clone().add(B).multiplyScalar(0.5);
    const q = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      dir.clone().normalize(),
    );
    return { pos: mid.toArray() as [number, number, number], quat: q, len: dir.length() };
  }, [a, b]);
  return (
    <group position={pos} quaternion={quat}>
      <mesh>
        <boxGeometry args={[w, len, d]} />
        {children}
      </mesh>
    </group>
  );
}

export function Vec(p: [number, number, number]) {
  return new THREE.Vector3(...p);
}

export function useTubeGeo(pts: [number, number, number][], closed = false, radius = 0.009) {
  return useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)));
    return { curve, geo: new THREE.TubeGeometry(curve, 56, radius, 6, closed) };
  }, [closed, radius]);
}

export function clearGeometries() {
  // geometry cleanup hook — not used now (scene lives for app lifetime)
}

/* Helix spring mesh between two points (approx). */
export function Spring(props: {
  a: [number, number, number];
  b: [number, number, number];
  r?: number;
  coils?: number;
  tube?: number;
  children: ReactNode;
}) {
  const { a, b, r = 0.05, coils = 5, tube = 0.008, children } = props;
  const { geo, pos, quat } = useMemo(() => {
    const A = new THREE.Vector3(...a);
    const B = new THREE.Vector3(...b);
    const dir = B.clone().sub(A);
    const height = dir.length();
    const pts: THREE.Vector3[] = [];
    const turns = coils * 2 * Math.PI;
    const steps = 100;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const ang = t * turns;
      pts.push(new THREE.Vector3(Math.cos(ang) * r, t * height - height / 2, Math.sin(ang) * r));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    const g = new THREE.TubeGeometry(curve, 48, tube, 6, false);
    const mid = A.clone().add(B).multiplyScalar(0.5);
    const q = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      dir.clone().normalize(),
    );
    return { geo: g, pos: mid.toArray() as [number, number, number], quat: q };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [a, b, r, coils, tube]);
  return (
    <group position={pos} quaternion={quat}>
      <mesh geometry={geo} castShadow>
        {children}
      </mesh>
    </group>
  );
}

export function Box(props: {
  args: [number, number, number];
  position?: [number, number, number];
  rotation?: [number, number, number];
  children: ReactNode;
}) {
  const { args, position = [0, 0, 0], rotation = [0, 0, 0], children } = props;
  return (
    <group position={position} rotation={rotation}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={args} />
        {children}
      </mesh>
    </group>
  );
}

export function Cyl(props: {
  args?: (number | boolean)[];
  position?: [number, number, number];
  rotation?: [number, number, number];
  children: ReactNode;
}) {
  const { args = [0.05, 0.05, 0.2], position = [0, 0, 0], rotation = [0, 0, 0], children } = props;
  return (
    <group position={position} rotation={rotation}>
      <mesh castShadow>
        <cylinderGeometry args={args as [number?, number?, number?, number?, number?, boolean?, number?]} />
        {children}
      </mesh>
    </group>
  );
}

/* Cylinder (tube/shaft) between two points, radius r. */
export function Rod(props: {
  a: [number, number, number];
  b: [number, number, number];
  r: number;
  children: ReactNode;
}) {
  const { a, b, r, children } = props;
  const { pos, quat, len } = useMemo(() => {
    const A = new THREE.Vector3(...a);
    const B = new THREE.Vector3(...b);
    const dir = B.clone().sub(A);
    const mid = A.clone().add(B).multiplyScalar(0.5);
    const q = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      dir.clone().normalize(),
    );
    return { pos: mid.toArray() as [number, number, number], quat: q, len: dir.length() };
  }, [a, b]);
  return (
    <group position={pos} quaternion={quat}>
      <mesh castShadow>
        <cylinderGeometry args={[r, r, len, 10]} />
        {children}
      </mesh>
    </group>
  );
}