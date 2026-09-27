/* ============================================================
   SHIELD — MODULE 04: ROAD CORRELATION & AUTOMOTIVE PROVING GROUND
   Proving ground correlation workspace featuring:
   - 10 Dedicated Proving Ground Sectors (Indian Road Profiles)
   - Real-World Event Capture Engine (e.g. EVENT R-1042)
   - Synchronized 30 s Replay Timeline
   - Multi-Channel Strip Charts (Strain, IMU Acceleration, Temp)
   - Structural Transient vs Persistent Residual Analysis
   ============================================================ */

import { useState } from 'react';
import { useStore } from '../store/useStore';
import { VehicleScene } from '../three/VehicleScene';
import { PROVING_GROUND_SECTORS, type RoadSectorDef } from '../data/engineering';
import { EVENTS, TIMELINE_DURATION } from '../data/scenarios';
import { SENSORS } from '../data/sensors';
import { Card, Stat, StatusChip, ProvTag } from '../ui/kit';
import type { RoadSectorId } from '../schema/types';

export function RoadCorrelation() {
  const activeRoadSector = useStore((s) => s.activeRoadSector);
  const setActiveRoadSector = useStore((s) => s.setActiveRoadSector);
  const tlTime = useStore((s) => s.tlTime);
  const setTlTime = useStore((s) => s.setTlTime);
  const playing = useStore((s) => s.playing);
  const setPlaying = useStore((s) => s.setPlaying);
  const sensorLive = useStore((s) => s.sensorLive);
  const navigate = useStore((s) => s.navigate);

  const [activeTab, setActiveTab] = useState<'sectors' | 'events' | 'channels'>('sectors');
  const sector = PROVING_GROUND_SECTORS[activeRoadSector];

  // Active event on the timeline
  let currentEvent = EVENTS[0];
  for (const e of EVENTS) {
    if (e.time <= tlTime) currentEvent = e;
  }

  // Active sensor responses
  const s01 = sensorLive['S01']?.packet.value ?? 452;
  const s05 = sensorLive['S05']?.packet.value ?? 205;
  const imu01 = sensorLive['IMU01']?.packet.value ?? 0.42;
  const temp01 = sensorLive['TEMP01']?.packet.value ?? 31.4;

  return (
    <div className="road-corr-layout" style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* 3D Scene */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <VehicleScene />
      </div>

      {/* Top Header Ribbon */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          padding: '10px 16px',
          background: 'linear-gradient(180deg, rgba(12,16,21,0.92) 0%, rgba(12,16,21,0.6) 75%, transparent 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
          pointerEvents: 'auto',
        }}
      >
        <div className="row" style={{ gap: 12 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 6,
              background: 'linear-gradient(135deg, #b45309, #78350f)',
              border: '1px solid #f59e0b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fde68a',
              fontWeight: 800,
              fontSize: 14,
            }}
          >
            04
          </div>
          <div>
            <div className="row" style={{ gap: 8 }}>
              <span style={{ fontWeight: 700, fontSize: 14, letterSpacing: '0.04em', color: '#f8fafc' }}>
                AUTOMOTIVE PROVING GROUND & ROAD CORRELATION
              </span>
              <span className="prov prov-sim">PG-01..PG-10 SECTORS</span>
              <span className="prov prov-sim">INDIAN ROAD PROFILES</span>
            </div>
            <div className="tiny faint" style={{ marginTop: 2 }}>
              Realistic Dynamic Road Excitation · Event Forensics Capture · Residual Multi-Channel Replay
            </div>
          </div>
        </div>

        {/* Sector Quick Select */}
        <div className="row wrap" style={{ gap: 6 }}>
          {(['PG-01', 'PG-02', 'PG-03', 'PG-04', 'PG-05', 'PG-06', 'PG-07', 'PG-08', 'PG-09', 'PG-10'] as RoadSectorId[]).map((id) => {
            const active = activeRoadSector === id;
            return (
              <button
                key={id}
                className={`btn tiny ${active ? 'active' : ''}`}
                onClick={() => setActiveRoadSector(id)}
                style={{
                  background: active ? '#d97706' : undefined,
                  borderColor: active ? '#f59e0b' : undefined,
                  color: active ? '#fff' : undefined,
                  fontSize: 11,
                  padding: '4px 6px',
                }}
              >
                {id}
              </button>
            );
          })}
        </div>
      </div>

      {/* Floating Left Panel — Sector Details & Event Capture */}
      <div
        style={{
          position: 'absolute',
          top: 64,
          left: 14,
          bottom: 74,
          width: 400,
          zIndex: 3,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          pointerEvents: 'auto',
        }}
      >
        <div
          className="panel"
          style={{
            padding: 12,
            background: 'rgba(12, 16, 21, 0.88)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(245, 158, 11, 0.25)',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            flex: 1,
            overflow: 'hidden',
          }}
        >
          {/* Sub Navigation */}
          <div className="row" style={{ background: 'var(--bg2)', padding: 3, borderRadius: 6, gap: 4 }}>
            <button
              style={{
                flex: 1,
                padding: '6px 4px',
                fontSize: 11,
                fontWeight: 600,
                borderRadius: 4,
                border: 'none',
                background: activeTab === 'sectors' ? '#d97706' : 'transparent',
                color: activeTab === 'sectors' ? '#fff' : 'var(--muted)',
                cursor: 'pointer',
              }}
              onClick={() => setActiveTab('sectors')}
            >
              Proving Sectors (10)
            </button>
            <button
              style={{
                flex: 1,
                padding: '6px 4px',
                fontSize: 11,
                fontWeight: 600,
                borderRadius: 4,
                border: 'none',
                background: activeTab === 'events' ? '#d97706' : 'transparent',
                color: activeTab === 'events' ? '#fff' : 'var(--muted)',
                cursor: 'pointer',
              }}
              onClick={() => setActiveTab('events')}
            >
              Event Capture
            </button>
            <button
              style={{
                flex: 1,
                padding: '6px 4px',
                fontSize: 11,
                fontWeight: 600,
                borderRadius: 4,
                border: 'none',
                background: activeTab === 'channels' ? '#d97706' : 'transparent',
                color: activeTab === 'channels' ? '#fff' : 'var(--muted)',
                cursor: 'pointer',
              }}
              onClick={() => setActiveTab('channels')}
            >
              Live Telemetry
            </button>
          </div>

          {/* TAB 1: SECTORS */}
          {activeTab === 'sectors' && (
            <div className="col" style={{ flex: 1, overflowY: 'auto', gap: 10 }}>
              <div className="panel" style={{ padding: 10, background: 'rgba(0,0,0,0.3)', border: '1px solid var(--line)' }}>
                <div className="spread">
                  <span style={{ fontWeight: 700, fontSize: 13, color: '#f59e0b' }}>{sector.name}</span>
                  <span className="prov prov-sim">{sector.surfaceType}</span>
                </div>
                <div className="tiny faint" style={{ marginTop: 4, lineHeight: 1.3 }}>{sector.profileDescription}</div>

                <div className="grid3" style={{ marginTop: 8, gap: 6 }}>
                  <Stat label="Speed Profile" value={`${sector.typicalSpeedKmh} km/h`} sub="Target pace" />
                  <Stat label="Dominant Freq" value={`${sector.dominantFrequencyHz} Hz`} sub="Track input" accent="var(--cyan)" />
                  <Stat label="Peak G Input" value={`${sector.peakAccelerationG} g`} sub="Vertical spike" accent="var(--amber)" />
                </div>

                <div style={{ marginTop: 8, padding: '6px 8px', background: 'rgba(245,158,11,0.08)', borderRadius: 4, border: '1px solid rgba(245,158,11,0.2)' }}>
                  <div className="tiny" style={{ fontWeight: 600, color: '#f59e0b' }}>Indian Operating Condition Correlation:</div>
                  <div className="tiny faint" style={{ marginTop: 2, lineHeight: 1.3 }}>{sector.indianRoadSpecifics}</div>
                </div>
              </div>

              {/* Sector List */}
              <div className="col" style={{ gap: 4 }}>
                {Object.values(PROVING_GROUND_SECTORS).map((s) => {
                  const active = activeRoadSector === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setActiveRoadSector(s.id)}
                      style={{
                        textAlign: 'left',
                        padding: '6px 8px',
                        borderRadius: 5,
                        cursor: 'pointer',
                        background: active ? 'linear-gradient(90deg, #78350f, #0f172a)' : 'rgba(255,255,255,0.02)',
                        border: active ? '1px solid #f59e0b' : '1px solid var(--line)',
                        color: active ? '#fde68a' : 'var(--text)',
                      }}
                    >
                      <div className="spread">
                        <span className="mono" style={{ fontSize: 12, fontWeight: 600 }}>{s.id} — {s.name.split('—')[1]}</span>
                        <span className="tiny mono faint">{s.typicalSpeedKmh} km/h</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: ROAD EVENT CAPTURE */}
          {activeTab === 'events' && (
            <div className="col" style={{ flex: 1, overflowY: 'auto', gap: 10 }}>
              <div className="spread">
                <span className="small" style={{ fontWeight: 700, color: '#f59e0b' }}>Automated Road Event Capture</span>
                <span className="prov prov-verified">EVENT DETECTOR</span>
              </div>
              <div className="tiny faint">Dynamic impulse exceedance log triggered on proving ground run</div>

              <div className="col" style={{ gap: 6 }}>
                {[
                  {
                    id: 'EVENT R-1042',
                    type: 'Severe Pothole Drop',
                    sector: 'PG-04',
                    speed: '34 km/h',
                    peakG: '+2.85g',
                    region: 'Rear-LH Rail & Mount_BRL',
                    strain: '742 με (Expected 205 με)',
                    state: 'WATCH',
                    residualShift: '+57 με persistent',
                  },
                  {
                    id: 'EVENT R-1039',
                    type: 'Speed Breaker Jounce',
                    sector: 'PG-03',
                    speed: '22 km/h',
                    peakG: '+1.85g',
                    region: 'Front Subframe Rails',
                    strain: '585 με (Expected 452 με)',
                    state: 'NORMAL',
                    residualShift: '0 με (Full Elastic Recovery)',
                  },
                ].map((ev, i) => (
                  <div key={i} className="panel" style={{ padding: 8, background: 'rgba(0,0,0,0.3)', border: '1px solid var(--line)' }}>
                    <div className="spread">
                      <span className="mono" style={{ fontWeight: 700, fontSize: 12, color: '#f59e0b' }}>{ev.id}</span>
                      <StatusChip state={ev.state as any} />
                    </div>
                    <div className="tiny" style={{ marginTop: 2, fontWeight: 600, color: 'var(--text)' }}>
                      {ev.type} · Sector {ev.sector} ({ev.speed})
                    </div>
                    <div className="tiny faint" style={{ marginTop: 1 }}>Affected: {ev.region}</div>

                    <div className="grid2" style={{ marginTop: 6, gap: 4 }}>
                      <div className="stat" style={{ padding: '3px 4px' }}>
                        <span className="tiny faint">Peak Acceleration</span>
                        <span className="mono tiny" style={{ fontWeight: 700, color: 'var(--amber)' }}>{ev.peakG}</span>
                      </div>
                      <div className="stat" style={{ padding: '3px 4px' }}>
                        <span className="tiny faint">Peak Strain</span>
                        <span className="mono tiny" style={{ fontWeight: 700 }}>{ev.strain}</span>
                      </div>
                    </div>

                    <div className="tiny faint" style={{ marginTop: 4 }}>
                      Residual Outcome: <span style={{ color: ev.state === 'WATCH' ? 'var(--amber)' : 'var(--green)' }}>{ev.residualShift}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: LIVE TELEMETRY CHANNELS */}
          {activeTab === 'channels' && (
            <div className="col" style={{ flex: 1, overflowY: 'auto', gap: 10 }}>
              <div className="tiny faint" style={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Active Vehicle Sensors Under Excitation
              </div>
              <div className="grid2" style={{ gap: 6 }}>
                <Stat label="Front Rail SG1 (S01)" value={`${s01.toFixed(0)} με`} sub="Baseline 452 με" accent="var(--cyan)" />
                <Stat label="Battery Mount RL (S05)" value={`${s05.toFixed(0)} με`} sub="Baseline 205 με" accent={s05 > 240 ? 'var(--amber)' : 'var(--green)'} />
                <Stat label="IMU Front Rail A1" value={`${imu01.toFixed(2)} m/s²`} sub="RMS Vibration" />
                <Stat label="Pack Tray Temp" value={`${temp01.toFixed(1)} °C`} sub="Ambient 31.4 °C" />
              </div>

              <div className="panel" style={{ padding: 8, background: 'rgba(0,0,0,0.25)' }}>
                <span className="tiny faint">Current Timeline Phase:</span>
                <div className="small" style={{ fontWeight: 700, color: '#f59e0b', marginTop: 2 }}>{currentEvent.label}</div>
                <div className="tiny faint" style={{ marginTop: 2 }}>{currentEvent.description}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Synchronized Replay Timeline Bar */}
      <div
        style={{
          position: 'absolute',
          bottom: 14,
          left: 14,
          right: 14,
          zIndex: 4,
          padding: '10px 16px',
          background: 'rgba(12, 16, 21, 0.92)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          pointerEvents: 'auto',
        }}
      >
        <button
          className={`btn ${playing ? 'active' : ''}`}
          onClick={() => setPlaying(!playing)}
          style={{ minWidth: 80, fontWeight: 700 }}
        >
          {playing ? '⏸ PAUSE' : '▶ PLAY'}
        </button>

        <div className="col" style={{ flex: 1, gap: 4 }}>
          <div className="spread">
            <span className="tiny mono faint">SYNCHRONIZED REPLAY TIMELINE (0.0s – 30.0s)</span>
            <span className="mono small" style={{ fontWeight: 700, color: '#f59e0b' }}>{tlTime.toFixed(1)} s</span>
          </div>
          <input
            type="range"
            min="0"
            max={TIMELINE_DURATION}
            step="0.1"
            value={tlTime}
            onChange={(e) => setTlTime(parseFloat(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>

        <button
          className="btn"
          onClick={() => navigate('live_twin')}
          style={{ background: '#d97706', color: '#fff', fontWeight: 600, border: 'none' }}
        >
          Proceed to 05 Live Digital Twin →
        </button>
      </div>
    </div>
  );
}
