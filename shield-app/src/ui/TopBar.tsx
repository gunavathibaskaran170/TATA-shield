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
    digital_eng: '01 Design & CAE Validation',
    mfg_quality: '02 Manufacturing & Baseline',
    controlled_val: '03 Vehicle Testing & Validation',
    road_corr: '03 Vehicle Testing — Road Correlation',
    live_twin: '04 Live Structural Health',
    eng_analytics: '04 Structural Analytics & Diagnostics',
    passport: 'Vehicle Digital Passport',
    twin: '3D Vehicle Digital Twin',
    intelligence: 'Structural Intelligence',
    manufacturing: 'Manufacturing Thread',
    telemetry: 'Live Telemetry Stream',
    hardware: 'Hardware Live Diagnostic',
    fleet: 'Fleet Structural Health',
    forensics: 'Event Forensics Replay',
    diagnostics: 'AI Diagnostics',
    investigations: 'Engineering Investigations',
    reports: 'Event History & Records',
    settings: 'Settings & Data Sources',
  };

  return (
    <header
      style={{
        height: 50,
        flex: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '0 14px',
        background: 'var(--bg2)',
        borderBottom: '1px solid var(--line)',
        zIndex: 6,
        position: 'relative',
      }}
    >
      <div className="row" style={{ gap: 8, minWidth: 240 }}>
        <span style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.2px', color: '#E6EDF5' }}>
          {pageTitle[page] ?? 'SHIELD EV'}
        </span>
      </div>

      {/* CONTINUOUS 4-STAGE LIFECYCLE THREAD RIBBON */}
      <div
        className="desktop-only row"
        style={{
          flex: 1,
          justifyContent: 'center',
          gap: 6,
          background: 'rgba(0,0,0,0.35)',
          padding: '3px 10px',
          borderRadius: 6,
          border: '1px solid var(--line)',
          maxWidth: 620,
        }}
      >
        {LIFECYCLE_RIBBON.map((r, i) => {
          const currentStageIndex =
            page === 'mfg_quality' ? 1 : page === 'controlled_val' ? 2 : page === 'live_twin' ? 3 : 0;
          const isCompleted = i < currentStageIndex;
          const isCurrent = i === currentStageIndex;
          const iconSymbol = isCompleted ? '✓' : isCurrent ? '●' : '○';

          return (
            <div key={r.stage} className="row" style={{ gap: 4, alignItems: 'center' }}>
              <button
                onClick={() => navigate(r.targetPage)}
                style={{
                  padding: '3px 10px',
                  fontSize: 12,
                  fontFamily: 'var(--font-sans)',
                  fontWeight: 500,
                  borderRadius: 4,
                  border: isCurrent ? '1px solid #06b6d4' : '1px solid transparent',
                  background: isCurrent ? 'linear-gradient(135deg, #0891b2, #0e7490)' : 'transparent',
                  color: isCurrent ? '#fff' : isCompleted ? '#34d399' : 'var(--muted)',
                  cursor: 'pointer',
                  transition: 'all 0.12s ease',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                }}
                title={`Stage 0${i + 1}: ${r.stage}`}
              >
                <span style={{ fontSize: 10, color: isCurrent ? '#38bdf8' : isCompleted ? '#10b981' : 'var(--faint)' }}>
                  {iconSymbol}
                </span>
                <span>{r.label}</span>
                <span
                  style={{
                    fontSize: 8.5,
                    padding: '0.5px 3.5px',
                    borderRadius: 3,
                    background: isCurrent ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.06)',
                    color: isCurrent ? '#fff' : 'var(--faint)',
                    fontWeight: 500,
                  }}
                >
                  {r.badge}
                </span>
              </button>
              {i < LIFECYCLE_RIBBON.length - 1 && (
                <span style={{ fontSize: 10, color: 'var(--faint)', margin: '0 2px' }}>→</span>
              )}
            </div>
          );
        })}
      </div>

      <div className="spacer" />

      {/* Scenario Selector */}
      <label className="desktop-only row" style={{ gap: 6 }} title="Drives the mock telemetry generator">
        <span className="tiny muted">Scenario</span>
        <select
          value={scenario}
          onChange={(e) => setScenario(e.target.value)}
          style={{ width: 120, fontSize: 11, padding: '3px 6px' }}
        >
          <option value="cruise">Baseline cruise</option>
          <option value="urban">Urban / rough</option>
          <option value="pothole_replay">Pothole replay</option>
          <option value="rear_load">Rear load</option>
          <option value="thermal">Thermal soak</option>
        </select>
      </label>

      {/* Vehicle ID & Passport Button */}
      <div className="row" style={{ gap: 6 }}>
        <button
          className="btn tiny"
          onClick={() => navigate('passport')}
          title="Open Vehicle Digital Passport"
          style={{ padding: '3px 8px' }}
        >
          <span className="mono" style={{ color: 'var(--cyan)', fontWeight: 700 }}>{vehicleId}</span>
        </button>
      </div>

      {/* Health Status Chip */}
      <span
        className={
          'chip ' +
          (worst ? 'st-' + (worst === 'INSPECTION_REQUIRED' ? 'inspection' : worst === 'WATCH' ? 'watch' : 'normal') : 'st-normal')
        }
        style={{ fontSize: 11, padding: '3px 8px' }}
      >
        <span
          className={
            'dot ' +
            (worst ? 'dot-' + (worst === 'INSPECTION_REQUIRED' ? 'inspection' : worst === 'WATCH' ? 'watch' : 'normal') : 'dot-normal')
          }
        />
        {liveCount}/{SENSORS.length} sensors · {worst ?? 'NORMAL'}
      </span>

      <span className="mono small faint">{clock.toLocaleTimeString('en-IN', { hour12: false })}</span>
    </header>
  );
}