/* ============================================================
   SHIELD — Interactive CAD Schematic Viewport Fallback.
   Rendered automatically when WebGL hardware acceleration is
   disabled or WebGL context creation is restricted by the browser.
   Provides a interactive vector CAD digital twin of the vehicle.
   ============================================================ */

import { useState } from 'react';
import { useStore } from '../store/useStore';
import { CATALOG } from '../data/catalog';
import { SENSORS } from '../data/sensors';

export function InteractiveCadFallback() {
  const selected = useStore((s) => s.selected);
  const hovered = useStore((s) => s.hovered);
  const select = useStore((s) => s.select);
  const setHovered = useStore((s) => s.setHovered);
  const viewMode = useStore((s) => s.viewMode);
  const viewPreset = useStore((s) => s.viewPreset) ?? 'iso';
  const explode = useStore((s) => s.explode);
  const batteryMode = useStore((s) => s.batteryMode);
  const heatmapMode = useStore((s) => s.heatmapMode);

  const [pan, setPan] = useState({ x: 0, y: 0 });

  // Key architectural components to display in the interactive CAD schematic
  const components = [
    { id: 'FrontLongitudinal_L', name: 'Front Left Rail', path: 'M 180 180 L 320 180 L 340 210 L 200 210 Z', color: '#3f9c52' },
    { id: 'FrontLongitudinal_R', name: 'Front Right Rail', path: 'M 180 320 L 320 320 L 340 350 L 200 350 Z', color: '#3f9c52' },
    { id: 'CrashBeam', name: 'Front Crash Beam', path: 'M 160 160 L 180 160 L 180 360 L 160 360 Z', color: '#ff6b5e' },
    { id: 'CrushCan_L', name: 'Crush Can Left', path: 'M 180 190 L 210 190 L 210 210 L 180 210 Z', color: '#f2b94e' },
    { id: 'CrushCan_R', name: 'Crush Can Right', path: 'M 180 310 L 210 310 L 210 330 L 180 330 Z', color: '#f2b94e' },
    { id: 'BatteryPack_Tray', name: '100 kWh Battery Pack Tray', path: 'M 340 160 L 620 160 L 620 360 L 340 360 Z', color: '#31404f' },
    { id: 'Module_01', name: 'Battery Module 01', path: 'M 360 180 L 480 180 L 480 250 L 360 250 Z', color: '#3d5f7a' },
    { id: 'Module_02', name: 'Battery Module 02', path: 'M 490 180 L 600 180 L 600 250 L 490 250 Z', color: '#3d5f7a' },
    { id: 'Module_03', name: 'Battery Module 03', path: 'M 360 270 L 480 270 L 480 340 L 360 340 Z', color: '#3d5f7a' },
    { id: 'Module_04', name: 'Battery Module 04', path: 'M 490 270 L 600 270 L 600 340 L 490 340 Z', color: '#3d5f7a' },
    { id: 'DriveUnit', name: 'Front Drive Unit (EDU)', path: 'M 250 220 L 320 220 L 320 300 L 250 300 Z', color: '#4f8cff' },
    { id: 'RearDriveUnit', name: 'Rear Drive Unit (EDU)', path: 'M 640 220 L 710 220 L 710 300 L 640 300 Z', color: '#4f8cff' },
    { id: 'RearLongitudinal_L', name: 'Rear Left Rail', path: 'M 620 180 L 760 180 L 740 210 L 620 210 Z', color: '#3f9c52' },
    { id: 'RearLongitudinal_R', name: 'Rear Right Rail', path: 'M 620 320 L 760 320 L 740 350 L 620 350 Z', color: '#3f9c52' },
    { id: 'RearCrashBeam', name: 'Rear Crash Beam', path: 'M 760 160 L 780 160 L 780 360 L 760 360 Z', color: '#ff6b5e' },
    { id: 'Wheel_FL', name: 'Wheel Front Left', path: 'M 220 110 L 290 110 L 290 150 L 220 150 Z', color: '#17191d' },
    { id: 'Wheel_FR', name: 'Wheel Front Right', path: 'M 220 370 L 290 370 L 290 410 L 220 410 Z', color: '#17191d' },
    { id: 'Wheel_RL', name: 'Wheel Rear Left', path: 'M 650 110 L 720 110 L 720 150 L 650 150 Z', color: '#17191d' },
    { id: 'Wheel_RR', name: 'Wheel Rear Right', path: 'M 650 370 L 720 370 L 720 410 L 650 410 Z', color: '#17191d' },
  ];

  const expOffsetY = explode * 40;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: '#0d131a',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        userSelect: 'none',
      }}
    >
      {/* Top Banner Notice */}
      <div
        style={{
          background: 'rgba(242, 185, 78, 0.12)',
          borderBottom: '1px solid rgba(242, 185, 78, 0.3)',
          padding: '6px 14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 11,
          color: 'var(--amber)',
        }}
      >
        <span>
          ⚙ <b>Interactive CAD Schematic View Mode</b> · WebGL hardware acceleration limited on this browser session. Showing interactive vector twin.
        </span>
        <span className="mono tiny muted">SCALE 1:15 • VERIFIED CAD</span>
      </div>

      {/* SVG Viewport */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 950 520"
          preserveAspectRatio="xMidYMid meet"
          style={{ cursor: 'grab' }}
        >
          <defs>
            <pattern id="cadGrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
            </pattern>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Background Grid */}
          <rect width="100%" height="100%" fill="url(#cadGrid)" />

          {/* Vehicle Body Outline (Glass / Monocoque shell) */}
          {viewMode === 'complete' && (
            <path
              d="M 140 260 C 140 140, 300 120, 420 120 L 620 120 C 740 120, 800 160, 800 260 C 800 360, 740 400, 620 400 L 420 400 C 300 400, 140 380, 140 260 Z"
              fill="none"
              stroke="var(--cyan)"
              strokeWidth="2"
              strokeDasharray="6 4"
              opacity={0.6}
            />
          )}

          {/* Component Layers */}
          <g transform={`translate(${pan.x}, ${pan.y})`}>
            {components.map((c) => {
              const isSel = selected.includes(c.id);
              const isHov = hovered === c.id;
              const isBatteryPart = c.id.startsWith('Battery') || c.id.startsWith('Module');
              const offsetY = isBatteryPart && batteryMode === 'open' ? -expOffsetY : 0;

              return (
                <g
                  key={c.id}
                  transform={`translate(0, ${offsetY})`}
                  onClick={(e) => {
                    e.stopPropagation();
                    select(c.id);
                  }}
                  onPointerOver={(e) => {
                    e.stopPropagation();
                    setHovered(c.id);
                  }}
                  onPointerOut={() => setHovered(null)}
                  style={{ cursor: 'pointer' }}
                >
                  <path
                    d={c.path}
                    fill={isSel ? '#38d9cf' : isHov ? '#5fe0d6' : c.color}
                    fillOpacity={isSel ? 0.85 : isHov ? 0.75 : 0.45}
                    stroke={isSel ? '#ffffff' : isHov ? '#38d9cf' : c.color}
                    strokeWidth={isSel || isHov ? 2.5 : 1.2}
                    filter={isSel || isHov ? 'url(#glow)' : undefined}
                  />
                  <text
                    x={pathCenterX(c.path)}
                    y={pathCenterY(c.path)}
                    fill="#ffffff"
                    fontSize="9"
                    fontFamily="monospace"
                    fontWeight="bold"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    pointerEvents="none"
                    opacity={isSel || isHov ? 1 : 0.7}
                  >
                    {c.id.replace(/_/g, ' ')}
                  </text>
                </g>
              );
            })}

            {/* Live Sensor Overlays */}
            {SENSORS.map((s) => {
              const cx = (s.position[2] + 2.5) * 120 + 200;
              const cy = (s.position[0] + 1.2) * 100 + 150;
              const isHov = hovered === s.id;
              const isSel = selected.includes(s.id);
              return (
                <g
                  key={s.id}
                  transform={`translate(${cx}, ${cy})`}
                  onClick={(e) => {
                    e.stopPropagation();
                    select(s.id);
                  }}
                  onPointerOver={() => setHovered(s.id)}
                  onPointerOut={() => setHovered(null)}
                  style={{ cursor: 'pointer' }}
                >
                  <circle r={isSel || isHov ? 10 : 7} fill="rgba(15,23,32,0.9)" stroke="#38d9cf" strokeWidth="2" />
                  <circle r="3" fill={s.status === 'NORMAL' ? '#4fe0a0' : '#ff6b5e'} />
                  {(isHov || isSel) && (
                    <text y="-14" fill="#38d9cf" fontSize="10" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                      {s.id} · {s.signal}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        </svg>

        {/* Floating HUD info */}
        <div
          style={{
            position: 'absolute',
            bottom: 12,
            left: 14,
            background: 'rgba(15, 23, 32, 0.9)',
            border: '1px solid var(--line2)',
            padding: '6px 12px',
            borderRadius: 6,
            fontSize: 11,
            color: 'var(--text)',
            fontFamily: 'monospace',
          }}
        >
          <div>◎ Interactive CAD Digital Twin</div>
          <div className="tiny faint" style={{ marginTop: 2 }}>
            Click any rail, battery module, e-motor or sensor to inspect telemetry.
          </div>
        </div>
      </div>
    </div>
  );
}

function pathCenterX(path: string): number {
  const matches = path.match(/([0-9.]+)\s+([0-9.]+)/g);
  if (!matches) return 400;
  const xs = matches.map((m) => parseFloat(m.split(/\s+/)[0]));
  return (Math.min(...xs) + Math.max(...xs)) / 2;
}

function pathCenterY(path: string): number {
  const matches = path.match(/([0-9.]+)\s+([0-9.]+)/g);
  if (!matches) return 260;
  const ys = matches.map((m) => parseFloat(m.split(/\s+/)[1]));
  return (Math.min(...ys) + Math.max(...ys)) / 2;
}
