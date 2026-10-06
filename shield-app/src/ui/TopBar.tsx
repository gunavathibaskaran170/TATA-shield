/* ============================================================
   SHIELD — TopBar Chrome with Continuous Lifecycle Ribbon
   Provides instant vehicle status, active scenario control,
   and the clickable 8-stage Digital Thread Ribbon.
   ============================================================ */

import { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { SENSORS } from '../data/sensors';
import type { PageKey } from '../schema/types';

const LIFECYCLE_RIBBON: { stage: string; label: string; badge: string; targetPage: PageKey }[] = [
  { stage: 'DESIGN', label: '01 DESIGN', badge: 'CAE', targetPage: 'digital_eng' },
  { stage: 'BUILD', label: '02 BUILD', badge: 'MFG', targetPage: 'mfg_quality' },
  { stage: 'VALIDATE', label: '03 VALIDATE', badge: 'TEST', targetPage: 'controlled_val' },
  { stage: 'MONITOR', label: '04 MONITOR', badge: 'LIVE', targetPage: 'live_twin' },
];

export function TopBar() {
  const page = useStore((s) => s.page);
  const navigate = useStore((s) => s.navigate);
  const vehicleId = useStore((s) => s.vehicleId);
  const scenario = useStore((s) => s.scenario);
  const setScenario = useStore((s) => s.setScenario);
  const sensorLive = useStore((s) => s.sensorLive);
  const [clock, setClock] = useState(() => new Date());

  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const liveCount = Object.keys(sensorLive).length;
  const worst = (['INSPECTION_REQUIRED', 'WATCH', 'NORMAL'] as const).find((st) =>
    Object.values(sensorLive).some((l) => l.analytics.state === st),
  );

  const pageTitle: Record<string, string> = {
    command: 'Command Center',
    workbench: 'Manual Engineering Workbench',
    digital_eng: '01 Design & CAE',
    mfg_quality: '02 Build & Baseline',
    controlled_val: '03 Validate',
    live_twin: '04 Monitor',
    passport: 'Vehicle Digital Passport',
    hardware: 'Hardware Live Diagnostic',
  };

  return (
    <header
      style={{
        height: 52,
        flex: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        padding: '0 16px',
        background: '#0C121B',
        borderBottom: '1px solid #1F2B38',
        zIndex: 10,
        position: 'relative',
      }}
    >
      {/* LEFT: Page Context */}
      <div className="row" style={{ gap: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: '-0.01em', color: '#F2F5F8' }}>
          {pageTitle[page] ?? '01 Design & CAE Validation'}
        </span>
      </div>

      {/* RIGHT: Utility Controls */}
      <div className="row" style={{ gap: 12 }}>
        {/* Scenario Selector */}
        <label className="desktop-only row" style={{ gap: 6 }} title="Drives mock telemetry generator">
          <span style={{ fontSize: 11.5, color: '#A8B4C2' }}>Scenario</span>
          <select
            value={scenario}
            onChange={(e) => setScenario(e.target.value)}
            style={{
              height: 32,
              fontSize: 12,
              padding: '0 8px',
              borderRadius: 6,
              background: '#131D28',
              border: '1px solid #1F2B38',
              color: '#F2F5F8',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            <option value="cruise">Baseline cruise</option>
            <option value="urban">Urban / rough</option>
            <option value="pothole_replay">Pothole replay</option>
            <option value="rear_load">Rear load</option>
            <option value="thermal">Thermal soak</option>
          </select>
        </label>

        {/* Hardware Live Link Badge */}
        <button
          onClick={() => navigate('hardware')}
          title="Open Hardware Live Gateway & Diagnostics"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            height: 32,
            padding: '0 10px',
            background: 'rgba(32, 201, 151, 0.1)',
            border: '1px solid rgba(32, 201, 151, 0.3)',
            borderRadius: 6,
            color: '#20C997',
            fontWeight: 600,
            fontSize: 11.5,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#20C997' }} />
          <span>HW: COM5 LIVE</span>
        </button>

        {/* Vehicle ID & Passport Button */}
        <button
          onClick={() => navigate('passport')}
          title="Open Vehicle Digital Passport"
          style={{
            height: 32,
            padding: '0 10px',
            background: '#131D28',
            border: '1px solid #1F2B38',
            borderRadius: 6,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          <span className="mono" style={{ color: '#16A8E0', fontWeight: 600, fontSize: 12 }}>
            {vehicleId}
          </span>
        </button>

        {/* Health Status Chip */}
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            height: 32,
            padding: '0 10px',
            borderRadius: 6,
            fontSize: 11.5,
            fontWeight: 500,
            background: worst === 'INSPECTION_REQUIRED' ? 'rgba(239, 91, 91, 0.12)' : worst === 'WATCH' ? 'rgba(242, 184, 75, 0.12)' : 'rgba(32, 201, 151, 0.1)',
            border: `1px solid ${worst === 'INSPECTION_REQUIRED' ? 'rgba(239, 91, 91, 0.3)' : worst === 'WATCH' ? 'rgba(242, 184, 75, 0.3)' : 'rgba(32, 201, 151, 0.3)'}`,
            color: worst === 'INSPECTION_REQUIRED' ? '#EF5B5B' : worst === 'WATCH' ? '#F2B84B' : '#20C997',
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: worst === 'INSPECTION_REQUIRED' ? '#EF5B5B' : worst === 'WATCH' ? '#F2B84B' : '#20C997',
            }}
          />
          {liveCount}/{SENSORS.length} sensors · {worst ?? 'NORMAL'}
        </span>

        {/* Clock */}
        <span className="mono" style={{ fontSize: 11.5, color: '#6F8093', marginLeft: 4 }}>
          {clock.toLocaleTimeString('en-IN', { hour12: false })}
        </span>
      </div>
    </header>
  );
}