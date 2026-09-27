/* ============================================================
   SHIELD — TopBar Chrome with Continuous Lifecycle Ribbon
   Provides instant vehicle status, active scenario control,
   and the clickable 8-stage Digital Thread Ribbon.
   ============================================================ */

import { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { SENSORS } from '../data/sensors';
import type { PageKey } from '../schema/types';

const LIFECYCLE_RIBBON: { stage: string; label: string; targetPage: PageKey }[] = [
  { stage: 'DESIGN', label: '01 CAD Design', targetPage: 'digital_eng' },
  { stage: 'CAE', label: '02 CAE Load Cases', targetPage: 'digital_eng' },
  { stage: 'QUALITY', label: '03 Metrology', targetPage: 'mfg_quality' },
  { stage: 'COMMISSION', label: '04 EOL Fingerprint', targetPage: 'controlled_val' },
  { stage: 'VALIDATION', label: '05 Rig Test', targetPage: 'controlled_val' },
  { stage: 'ROAD', label: '06 Proving Ground', targetPage: 'road_corr' },
  { stage: 'FIELD', label: '07 Live Twin', targetPage: 'live_twin' },
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
    workbench: 'Manual Engineering Workbench & Load Lab',
    digital_eng: '01 Digital Engineering & CAE',
    mfg_quality: '02 Manufacturing Quality & Metrology',
    controlled_val: '03 Controlled Validation & Test Rigs',
    road_corr: '04 Road Correlation & Proving Ground',
    live_twin: '05 Live Structural Digital Twin',
    eng_analytics: '06 Engineering Analytics & Root-Cause',
    passport: '07 Vehicle Digital Passport',
    twin: '3D Vehicle Twin',
    intelligence: 'Structural Intelligence',
    manufacturing: 'Manufacturing Digital Thread',
    telemetry: 'Live Telemetry Stream',
    hardware: 'Hardware Live Diagnostic',
    fleet: 'Fleet Analytics',
    forensics: 'Event Forensics Replay',
    diagnostics: 'AI Diagnostics',
    investigations: 'Investigations',
    reports: 'Engineering Reports',
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
      <div className="row" style={{ gap: 8, minWidth: 260 }}>
        <span className="h3" style={{ margin: 0, fontSize: 14 }}>
          {pageTitle[page] ?? 'SHIELD'}
        </span>
      </div>

      {/* CONTINUOUS DIGITAL THREAD LIFECYCLE RIBBON */}
      <div
        className="desktop-only row"
        style={{
          flex: 1,
          justifyContent: 'center',
          gap: 2,
          background: 'rgba(0,0,0,0.35)',
          padding: '2px 6px',
          borderRadius: 6,
          border: '1px solid var(--line)',
          maxWidth: 780,
        }}
      >
        {LIFECYCLE_RIBBON.map((r, i) => {
          const isCurrent =
            (r.stage === 'DESIGN' && page === 'digital_eng') ||
            (r.stage === 'CAE' && page === 'digital_eng') ||
            (r.stage === 'QUALITY' && page === 'mfg_quality') ||
            (r.stage === 'COMMISSION' && page === 'controlled_val') ||
            (r.stage === 'VALIDATION' && page === 'controlled_val') ||
            (r.stage === 'ROAD' && page === 'road_corr') ||
            (r.stage === 'FIELD' && (page === 'live_twin' || page === 'twin' || page === 'eng_analytics'));

          return (
            <div key={r.stage} className="row" style={{ gap: 2 }}>
              <button
                onClick={() => navigate(r.targetPage)}
                style={{
                  padding: '3px 7px',
                  fontSize: 10,
                  fontFamily: 'var(--mono)',
                  fontWeight: isCurrent ? 700 : 500,
                  borderRadius: 4,
                  border: isCurrent ? '1px solid rgba(56,189,248,0.6)' : '1px solid transparent',
                  background: isCurrent ? 'linear-gradient(135deg, #0e7490, #155e75)' : 'transparent',
                  color: isCurrent ? '#fff' : 'var(--muted)',
                  cursor: 'pointer',
                  transition: 'all 0.12s ease',
                  whiteSpace: 'nowrap',
                }}
                title={`Jump to ${r.label}`}
              >
                {r.label}
              </button>
              {i < LIFECYCLE_RIBBON.length - 1 && (
                <span style={{ fontSize: 9, color: 'var(--faint)', margin: '0 1px' }}>→</span>
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