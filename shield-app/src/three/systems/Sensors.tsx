/* ============================================================
   SHIELD — instrumentation overlay.
   S01–S06, IMU01–03, TEMP01–02 rendered as pulsing sensor nodes
   with a state-coloured status ring fed by the live analytics
   stream. Click → sensor card; hover/active → mini readout.
   Labels are DOM Html chips (no network font) shown only on
   hover/active to keep the scene light. Simulation values are
   SIMULATED / MODEL_ESTIMATED — no claim of real hardware.
   ============================================================ */

import * as THREE from 'three';
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { SENSORS } from '../../data/sensors';
import { useStore } from '../../store/useStore';
import { Sel } from '../Sel';
import { M, COL } from '../materials';
import { D } from '../../schema/dims';
import type { SensorDef, SensorStatus } from '../../schema/types';

const STATE_COLOR: Record<SensorStatus, string> = {
  NORMAL: COL.green,
  WATCH: COL.amber,
  INSPECTION_REQUIRED: COL.red,
  OFFLINE: '#5a6575',
};
const STATE_LABEL: Record<SensorStatus, string> = {
  NORMAL: 'NORMAL',
  WATCH: 'WATCH',
  INSPECTION_REQUIRED: 'INSPECTION REQUIRED',
  OFFLINE: 'OFFLINE',
};

const _ax = new THREE.Vector3(0, 1, 0);

function SensorNode({ s, index }: { s: SensorDef; index: number }) {
  const live = useStore((st) => st.sensorLive[s.id]);
  const activeId = useStore((st) => st.activeSensorId);
  const hovered = useStore((st) => st.hovered);
  const select = useStore((st) => st.select);
  const toggle = useStore((st) => st.toggle);
  const setActiveSensor = useStore((st) => st.setActiveSensor);
  const setHovered = useStore((st) => st.setHovered);

  const ring = useRef<THREE.Mesh>(null);
  const led = useRef<THREE.Mesh>(null);

  const status: SensorStatus = live?.analytics.state ?? s.status;
  const anomaly = live?.analytics.anomalyScore ?? 0;
  const active = activeId === s.id;
  const isHovered = hovered === s.id;

  /* orient the status ring perpendicular to the sensing axis */
  const ringQuat = useMemo(() => {
    const ax = _ax.clone().fromArray(s.axis);
    if (ax.lengthSq() < 1e-6) ax.set(0, 1, 0);
    return new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), ax.normalize());
  }, [s]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const pulse = 0.5 + 0.5 * Math.sin(t * (2.4 + index * 0.37) + index * 1.7);
    const ringM = ring.current?.material as THREE.MeshStandardMaterial | undefined;
    if (ring.current && ringM) {
      ringM.emissiveIntensity =
        (active || isHovered ? 0.9 : 0.22) + (status !== 'NORMAL' ? pulse : 0);
      const lift = 1 + (anomaly * 0.3 + 0.05) * pulse;
      ring.current.scale.setScalar(lift);
    }
    const ledM = led.current?.material as THREE.MeshStandardMaterial | undefined;
    if (ledM) {
      ledM.emissiveIntensity =
        active || isHovered || status !== 'NORMAL' ? 1.7 : 0.7 + 0.55 * pulse;
    }
  });

  const value = live ? live.packet.value : s.baseline;
  const resPct = live?.analytics.residualPercent;

  return (
    <Sel cid={s.id}>
      <group
        position={s.position}
        onClick={(e) => {
          e.stopPropagation();
          if (e.shiftKey) toggle(s.id);
          else select(s.id);
          setActiveSensor(s.id);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(s.id);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          if (useStore.getState().hovered === s.id) setHovered(null);
          document.body.style.cursor = 'auto';
        }}
      >
        {/* body */}
        <mesh castShadow>
          <boxGeometry args={[0.034, 0.026, 0.022]} />
          <meshStandardMaterial {...M.sensor} />
        </mesh>
        {/* status ring (perpendicular to sensing axis) */}
        <mesh ref={ring} quaternion={ringQuat}>
          <torusGeometry args={[0.024, 0.0042, 8, 22]} />
          <meshStandardMaterial
            color={STATE_COLOR[status]}
            emissive={STATE_COLOR[status]}
            emissiveIntensity={0.25}
            metalness={0.3}
            roughness={0.4}
          />
        </mesh>
        {/* status LED */}
        <mesh ref={led} position={[0, 0.02, 0]}>
          <sphereGeometry args={[0.0065, 10, 8]} />
          <meshStandardMaterial color="#e8f7ff" emissive="#9be8ff" emissiveIntensity={1} />
        </mesh>

        {/* mini readout — only on hover / active */}
        {(isHovered || active) && (
          <Html
            center
            position={[0, 0.075, 0]}
            zIndexRange={[30, 0]}
            style={{ pointerEvents: 'none' }}
          >
            <div
              style={{
                whiteSpace: 'nowrap',
                background: 'rgba(14,18,24,0.92)',
                border: '1px solid ' + STATE_COLOR[status],
                color: '#dfe8f2',
                borderRadius: 4,
                padding: '3px 7px',
                fontSize: 10,
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
                lineHeight: 1.35,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span
                  style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: STATE_COLOR[status], display: 'inline-block',
                  }}
                />
                <b>{s.id}</b> · {s.signal}
              </div>
              <div>
                {value.toFixed(s.signal === 'temperature' ? 1 : 0)} {s.unit}{' '}
                <span style={{ color: '#8fa2b5' }}>
                  · {STATE_LABEL[status]}
                  {typeof resPct === 'number'
                    ? ` · Δ${resPct > 0 ? '+' : ''}${resPct.toFixed(1)}%`
                    : ''}
                </span>
              </div>
              <div style={{ color: '#8fa2b5' }}>
                {s.provenance} · baseline {s.baseline.toFixed(1)}
              </div>
            </div>
          </Html>
        )}
      </group>
    </Sel>
  );
}

/* ============================================================
   Physical instrumentation hardware.

   These are the real, dimensioned housings from the supplied
   parametric assembly, as opposed to the abstract pulsing sensor
   nodes above. IMU housings 30 x 22 x 12 mm, strain-gauge
   enclosures 40 x 26 x 16 mm with an 18 x 10 x 3 mm mounting tab.
   ============================================================ */
function InstrumentHousings() {
  const railTop = D.railY1;
  return (
    <group>
      {([
        { cid: 'IMU_Housing_A1', z: D.imuAZ },
        { cid: 'IMU_Housing_A2', z: D.imuBZ },
      ] as const).map((m) => (
        <Sel key={m.cid} cid={m.cid}>
          <mesh position={[-D.railX - D.imuW / 2, railTop + D.imuH / 2, m.z]} castShadow>
            <boxGeometry args={[D.imuW, D.imuH, D.imuL]} />
            <meshStandardMaterial {...M.blackPlastic} />
          </mesh>
        </Sel>
      ))}

      {([
        { cid: 'SG_Housing_SG1', z: D.sg1Z },
        { cid: 'SG_Housing_SG2', z: D.sg2Z },
      ] as const).map((m) => (
        <Sel key={m.cid} cid={m.cid}>
          <group position={[D.railX + D.sgW / 2, railTop + D.sgH / 2, m.z]}>
            <mesh castShadow>
              <boxGeometry args={[D.sgW, D.sgH, D.sgL]} />
              <meshStandardMaterial {...M.aluminum} />
            </mesh>
            {/* surface mounting tab */}
            <mesh position={[D.sgW / 2 + D.sgTabW / 2, -D.sgH / 2 - D.sgTabH / 2 + 0.002, 0]}>
              <boxGeometry args={[D.sgTabW, D.sgTabH, D.sgTabL]} />
              <meshStandardMaterial {...M.steel} />
            </mesh>
          </group>
        </Sel>
      ))}
    </group>
  );
}

export function Sensors() {
  return (
    <group>
      <InstrumentHousings />
      {SENSORS.map((s, i) => (
        <SensorNode key={s.id} s={s} index={i} />
      ))}
    </group>
  );
}