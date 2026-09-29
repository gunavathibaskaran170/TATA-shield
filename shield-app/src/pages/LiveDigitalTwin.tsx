/* ============================================================
   SHIELD — STAGE 04: MONITOR & LIVE STRUCTURAL HEALTH WORKSTATION
   Strict 3-Column Professional Engineering Workspace Layout
   - Row 1: Single Top Global Navigation (handled by App Shell TopBar)
   - Row 2: Page Header & Toolbar with Hardware Live Status Badge
   - Row 3: Grid (300px Left Collapsible Panel | Flexible Viewport | 280px Right Result Panel)
   - Left Panel: Structural Health Summary, Monitored Regions, & Event History Table
   - Center: Vehicle Viewport with Subtly Highlighted Monitored Regions
   - Right Panel: Selected Region Telemetry, ML Anomaly Score & Diagnostic Actions
   - Contextual Modals: Event Detail / Replay Modal & Root Cause Investigation Modal
   - Row 4: Thin 42px Viewport Toolbar (Health | Strain | Vibration | Temperature)
   ============================================================ */

import { useState } from 'react';
import { useStore } from '../store/useStore';
import { VehicleScene } from '../three/VehicleScene';
import { SENSORS, SENSOR_BY_ID } from '../data/sensors';
import { EVENTS } from '../data/scenarios';
import type { TwinEvent } from '../schema/types';
import { PageHeader } from '../ui/PageHeader';

export function LiveDigitalTwin() {
  const sensorLive = useStore((s) => s.sensorLive);
  const viewMode = useStore((s) => s.viewMode);
  const setViewMode = useStore((s) => s.setViewMode);
  const requestResetCamera = useStore((s) => s.requestResetCamera);
  const wireframeOpacity = useStore((s) => s.wireframeOpacity);
  const setWireframeOpacity = useStore((s) => s.setWireframeOpacity);
  const navigate = useStore((s) => s.navigate);

  // Layout & Panel Collapse State
  const [leftCollapsed, setLeftCollapsed] = useState<boolean>(false);
  const [rightCollapsed, setRightCollapsed] = useState<boolean>(false);
  const [selectedRegionId, setSelectedRegionId] = useState<string>('Front Structure');
  const [overlayMode, setOverlayMode] = useState<'health' | 'strain' | 'vibration' | 'temperature'>('health');

  // Contextual Modals for Event Detail & Root Cause Investigation
  const [viewEvent, setViewEvent] = useState<TwinEvent | null>(null);
  const [investigateEvent, setInvestigateEvent] = useState<TwinEvent | null>(null);
  const [replayPhase, setReplayPhase] = useState<'before' | 'during' | 'after'>('during');
  const [engineerNotes, setEngineerNotes] = useState<string[]>([]);
  const [newNoteText, setNewNoteText] = useState<string>('');

  const REGIONS = [
    { id: 'Front Structure', name: 'Front Crash Rails & Subframe', sensorId: 'S01', state: 'NORMAL' },
    { id: 'Battery Interface', name: '6-Point Battery Enclosure Deck', sensorId: 'S02', state: 'NORMAL' },
    { id: 'Floor / Crossmembers', name: 'Central Floor Pan & Rockers', sensorId: 'S03', state: 'NORMAL' },
    { id: 'Rear Structure', name: 'Rear Suspension Hardpoints', sensorId: 'S04', state: 'NORMAL' },
  ];

  const activeRegion = REGIONS.find((r) => r.id === selectedRegionId) ?? REGIONS[0];
  const activeSensor = SENSOR_BY_ID[activeRegion.sensorId] ?? SENSORS[0];
  const liveData = sensorLive[activeSensor.id] ?? {
    packet: { value: 455.9, unit: 'µε' },
    analytics: { residual: 3.9, state: 'NORMAL', anomalyScore: 0.02, confidence: 0.994 },
  };

  const sensorStates = Object.values(sensorLive).map((l) => l.analytics.state);
  const watchCount = sensorStates.filter((st) => st === 'WATCH').length;
  const inspectCount = sensorStates.filter((st) => st === 'INSPECTION_REQUIRED').length;
  const overallState = inspectCount ? 'INSPECTION_REQUIRED' : watchCount ? 'WATCH' : 'NORMAL';

  const addEngineerNote = () => {
    if (!newNoteText.trim()) return;
    setEngineerNotes((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${newNoteText.trim()}`]);
    setNewNoteText('');
  };

  return (
    <div
      className="live-twin-layout"
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        background: '#E8EDF3',
        color: '#101820',
        fontFamily: 'var(--sans)',
      }}
    >
      {/* ============================================================
          ROW 2 — PAGE HEADER / TOOLBAR (SOLID LIGHT BG, DARK NAVY HEADING)
          ============================================================ */}
      <PageHeader
        title="04 Monitor & Live Health"
        description='"Has the structure changed from its validated baseline?"'
        badge="FIELD TELEMETRY"
        badgeType="default"
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: '#141b24',
            border: '1px solid #273342',
            borderRadius: 6,
            padding: '4px 10px',
            fontSize: 12,
            fontFamily: 'var(--font-mono)',
            fontWeight: 500,
          }}
        >
          <span style={{ color: '#34D399', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34D399' }} /> ESP32 Connected
          </span>
          <span style={{ color: '#64748B' }}>|</span>
          <span style={{ color: '#34D399', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34D399' }} /> MQTT Connected
          </span>
          <span style={{ color: '#64748B' }}>|</span>
          <span style={{ color: '#38BDF8' }}>11 / 11 Sensors Online</span>
          <span style={{ color: '#64748B' }}>|</span>
          <span style={{ color: '#94A3B8' }}>500 Hz</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 500, color: '#94A3B8' }}>VIEW:</span>
          <select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value as any)}
            style={{
              fontSize: 13,
              fontWeight: 600,
              padding: '6px 10px',
              borderRadius: 6,
              background: '#141b24',
              border: '1px solid #273342',
              color: '#F8FAFC',
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
            }}
          >
            <option value="chassis">Complete Vehicle / Chassis</option>
            <option value="transparent">Transparent Overlay</option>
            <option value="skeletal">Skeletal Structure</option>
          </select>
        </div>

        <button
          onClick={() => requestResetCamera()}
          style={{
            fontSize: 13,
            fontWeight: 600,
            padding: '6px 12px',
            borderRadius: 6,
            background: '#141b24',
            border: '1px solid #273342',
            color: '#F8FAFC',
            cursor: 'pointer',
            fontFamily: 'var(--font-sans)',
          }}
        >
          ⟳ Reset View
        </button>
      </PageHeader>

      {/* ============================================================
          ROW 3 — MAIN WORKSPACE GRID (300px LEFT | FLEX VIEWPORT | 280px RIGHT)
          ============================================================ */}
      <div
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: `${leftCollapsed ? '48px' : '320px'} minmax(0, 1fr) ${rightCollapsed ? '0px' : '280px'}`,
          overflow: 'hidden',
          position: 'relative',
          transition: 'grid-template-columns 0.2s ease',
        }}
      >
        {/* ------------------------------------------------------------
            LEFT CONTROL PANEL (320px / 48px COLLAPSED)
            ------------------------------------------------------------ */}
        <div
          style={{
            background: '#111A24',
            borderRight: '1px solid #1E293B',
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
            zIndex: 5,
            color: '#E2E8F0',
            fontFamily: 'var(--mono)',
            padding: leftCollapsed ? 8 : 12,
            gap: 12,
          }}
        >
          {/* HEADER & COLLAPSE BUTTON */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: leftCollapsed ? 'center' : 'space-between', borderBottom: '1px solid #1E293B', paddingBottom: leftCollapsed ? 4 : 8 }}>
            {!leftCollapsed && <span style={{ fontWeight: 800, fontSize: 12, color: '#00A6D6', letterSpacing: '0.05em' }}>STRUCTURAL HEALTH & EVENTS</span>}
            <button
              onClick={() => setLeftCollapsed(!leftCollapsed)}
              style={{ background: 'transparent', border: 'none', color: '#38BDF8', fontSize: 14, cursor: 'pointer' }}
              title={leftCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              ☰
            </button>
          </div>

          {!leftCollapsed && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              
              {/* VEHICLE HEALTH SUMMARY */}
              <div style={{ background: '#070B11', padding: 10, borderRadius: 8, border: '1px solid #1E293B', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 10, color: '#94A3B8' }}>FIELD STATUS:</span>
                  <span style={{ fontSize: 11, fontWeight: 800, color: overallState === 'NORMAL' ? '#16A36A' : overallState === 'WATCH' ? '#F4A62A' : '#D83B3B' }}>
                    ● {overallState}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: '#F8FAFC', fontWeight: 700 }}>
                  11 / 11 Telemetry Sensors Online (500 Hz)
                </div>
              </div>

              {/* MONITORED REGIONS SELECTOR */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 10, color: '#94A3B8', fontWeight: 700 }}>STRUCTURAL REGIONS:</span>
                {REGIONS.map((r) => {
                  const isSelected = r.id === selectedRegionId;
                  return (
                    <button
                      key={r.id}
                      onClick={() => setSelectedRegionId(r.id)}
                      style={{
                        padding: 8,
                        borderRadius: 6,
                        border: isSelected ? '1px solid #00A6D6' : '1px solid #1E293B',
                        background: isSelected ? 'rgba(0,166,214,0.15)' : '#070B11',
                        textAlign: 'left',
                        cursor: 'pointer',
                        color: '#F8FAFC',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 11 }}>
                        <span style={{ color: isSelected ? '#38BDF8' : '#F8FAFC' }}>{r.id}</span>
                        <span style={{ fontSize: 9.5, color: '#16A36A' }}>● {r.state}</span>
                      </div>
                      <div style={{ fontSize: 10, color: '#94A3B8' }}>{r.name}</div>
                    </button>
                  );
                })}
              </div>

              {/* EVENT HISTORY TABLE */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 10, color: '#94A3B8', fontWeight: 700 }}>EVENT HISTORY & RECORDS</span>
                  <span style={{ fontSize: 9.5, color: '#38BDF8', fontWeight: 700 }}>{EVENTS.length} EVENTS</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {EVENTS.map((ev) => (
                    <div
                      key={ev.id}
                      style={{
                        background: '#070B11',
                        border: '1px solid #1E293B',
                        borderLeft: `3px solid ${ev.severity === 'INSPECTION_REQUIRED' ? '#D83B3B' : ev.severity === 'WATCH' ? '#F4A62A' : '#16A36A'}`,
                        borderRadius: 6,
                        padding: '8px 10px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 4,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 10, color: '#38BDF8', fontWeight: 700 }}>{ev.id} · t={ev.time}s</span>
                        <span
                          style={{
                            fontSize: 9,
                            padding: '1px 5px',
                            borderRadius: 3,
                            fontWeight: 800,
                            background: ev.severity === 'INSPECTION_REQUIRED' ? 'rgba(216,59,59,0.2)' : ev.severity === 'WATCH' ? 'rgba(244,166,42,0.2)' : 'rgba(22,163,106,0.2)',
                            color: ev.severity === 'INSPECTION_REQUIRED' ? '#FF8888' : ev.severity === 'WATCH' ? '#FCD34D' : '#34D399',
                          }}
                        >
                          {ev.severity}
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: '#F8FAFC', fontWeight: 700 }}>{ev.label}</div>
                      <div style={{ fontSize: 9.5, color: '#94A3B8' }}>{ev.description}</div>

                      <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                        <button
                          onClick={() => setViewEvent(ev)}
                          style={{
                            flex: 1,
                            padding: '4px 6px',
                            fontSize: 10,
                            fontWeight: 700,
                            borderRadius: 4,
                            background: '#0F172A',
                            border: '1px solid #334155',
                            color: '#38BDF8',
                            cursor: 'pointer',
                          }}
                        >
                          👁 VIEW EVENT
                        </button>
                        {(ev.severity === 'WATCH' || ev.severity === 'INSPECTION_REQUIRED') && (
                          <button
                            onClick={() => setInvestigateEvent(ev)}
                            style={{
                              flex: 1,
                              padding: '4px 6px',
                              fontSize: 10,
                              fontWeight: 700,
                              borderRadius: 4,
                              background: 'rgba(244,166,42,0.15)',
                              border: '1px solid #F4A62A',
                              color: '#FCD34D',
                              cursor: 'pointer',
                            }}
                          >
                            ⚖ INVESTIGATE
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}
        </div>

        {/* ------------------------------------------------------------
            CENTER COLUMN: 3D VIEWPORT CANVAS (FLEXIBLE)
            ------------------------------------------------------------ */}
        <div style={{ position: 'relative', flex: 1, width: '100%', height: '100%', background: '#E8EDF3', overflow: 'hidden' }}>
          
          {/* 3D Scene bounded strictly inside viewport */}
          <VehicleScene />

          {/* ROW 4 THIN BOTTOM VIEWPORT TOOLBAR (MAX 42px) */}
          <div
            style={{
              position: 'absolute',
              bottom: 10,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 10,
              height: 38,
              padding: '0 12px',
              background: 'rgba(17,26,36,0.92)',
              backdropFilter: 'blur(8px)',
              borderRadius: 8,
              border: '1px solid rgba(0,166,214,0.4)',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              color: '#FFFFFF',
              fontSize: 11,
              fontFamily: 'var(--mono)',
            }}
          >
            <span style={{ color: '#94A3B8', fontWeight: 700 }}>OVERLAY:</span>
            <div style={{ display: 'flex', gap: 4 }}>
              {(['health', 'strain', 'vibration', 'temperature'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setOverlayMode(mode)}
                  style={{
                    padding: '3px 8px',
                    borderRadius: 4,
                    fontSize: 10,
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: overlayMode === mode ? '#00A6D6' : 'rgba(255,255,255,0.08)',
                    color: '#FFFFFF',
                    border: overlayMode === mode ? '1px solid #38BDF8' : '1px solid transparent',
                    textTransform: 'uppercase',
                  }}
                >
                  {mode}
                </button>
              ))}
            </div>

            <span style={{ color: '#94A3B8', fontWeight: 700, marginLeft: 6 }}>OPACITY:</span>
            <input
              type="range"
              min="0.0"
              max="1.0"
              step="0.05"
              value={wireframeOpacity}
              onChange={(e) => setWireframeOpacity(parseFloat(e.target.value))}
              style={{ width: 70, accentColor: '#00A6D6', cursor: 'pointer' }}
            />
            <span style={{ fontWeight: 700, minWidth: 28, color: '#38BDF8' }}>{Math.round(wireframeOpacity * 100)}%</span>
          </div>

        </div>

        {/* ------------------------------------------------------------
            RIGHT RESULT PANEL (280px / 0px CLOSED)
            ------------------------------------------------------------ */}
        {!rightCollapsed && (
          <div
            style={{
              width: 280,
              background: '#111A24',
              borderLeft: '1px solid #1E293B',
              display: 'flex',
              flexDirection: 'column',
              padding: 12,
              gap: 10,
              color: '#E2E8F0',
              fontFamily: 'var(--mono)',
              overflowY: 'auto',
              zIndex: 5,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1E293B', paddingBottom: 8 }}>
              <span style={{ fontWeight: 800, fontSize: 12, color: '#38BDF8' }}>SELECTED REGION</span>
              <button
                onClick={() => setRightCollapsed(true)}
                style={{ background: 'transparent', border: 'none', color: '#94A3B8', fontSize: 14, cursor: 'pointer' }}
                title="Close Right Panel"
              >
                ×
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 11 }}>
              <div style={{ background: '#070B11', padding: 8, borderRadius: 6, border: '1px solid #1E293B' }}>
                <div style={{ color: '#94A3B8', fontSize: 10 }}>REGION NAME</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#F8FAFC', marginTop: 2 }}>{activeRegion.id}</div>
                <div style={{ fontSize: 10, color: '#38BDF8', marginTop: 1 }}>{activeRegion.name}</div>
              </div>

              <div style={{ background: '#070B11', padding: 8, borderRadius: 6, border: '1px solid #1E293B' }}>
                <div style={{ color: '#94A3B8', fontSize: 10 }}>CURRENT STRAIN</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#F8FAFC', marginTop: 2 }}>
                  {liveData.packet.value} {liveData.packet.unit}
                </div>
                <div style={{ fontSize: 9.5, color: '#34D399', marginTop: 1 }}>Baseline: 452 µε | Diff: +{liveData.analytics.residual} µε</div>
              </div>

              <div style={{ background: '#070B11', padding: 8, borderRadius: 6, border: '1px solid #1E293B' }}>
                <div style={{ color: '#94A3B8', fontSize: 10 }}>ENVIRONMENT & VIBRATION</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#F8FAFC', marginTop: 2 }}>Vibration RMS: 0.04 g</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#F8FAFC', marginTop: 1 }}>Temperature: 28.5 °C</div>
              </div>

              <div style={{ background: '#070B11', padding: 8, borderRadius: 6, border: '1px solid #1E293B' }}>
                <div style={{ color: '#94A3B8', fontSize: 10 }}>ML ANOMALY & CONFIDENCE</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#16A36A', marginTop: 2 }}>
                  Score: {liveData.analytics.anomalyScore} (Conf: {Math.round(liveData.analytics.confidence * 100)}%)
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
                <button
                  onClick={() => setViewEvent(EVENTS[1])}
                  style={{ width: '100%', padding: 8, borderRadius: 6, background: '#00A6D6', color: '#FFF', fontWeight: 800, border: 'none', cursor: 'pointer', fontSize: 11 }}
                >
                  📈 REPLAY RECENT EVENT
                </button>
                <button
                  onClick={() => setInvestigateEvent(EVENTS[3])}
                  style={{ width: '100%', padding: 8, borderRadius: 6, background: '#059669', color: '#FFF', fontWeight: 800, border: 'none', cursor: 'pointer', fontSize: 11 }}
                >
                  ⚖ RUN ROOT CAUSE DIAGNOSTIC
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ============================================================
          CONTEXTUAL MODAL 1: EVENT FORENSICS REPLAY DETAIL
          ============================================================ */}
      {viewEvent && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          <div
            style={{
              width: 580,
              maxHeight: '90vh',
              overflowY: 'auto',
              background: '#111A24',
              border: '1px solid #00A6D6',
              borderRadius: 10,
              padding: 16,
              color: '#F8FAFC',
              fontFamily: 'var(--mono)',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1E293B', paddingBottom: 8 }}>
              <div>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#38BDF8' }}>EVENT FORENSICS REPLAY — {viewEvent.id}</span>
                <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>{viewEvent.label}</div>
              </div>
              <button
                onClick={() => setViewEvent(null)}
                style={{ background: 'transparent', border: 'none', color: '#94A3B8', fontSize: 18, cursor: 'pointer' }}
              >
                ×
              </button>
            </div>

            {/* REPLAY PHASE TIMELINE */}
            <div style={{ background: '#070B11', padding: 10, borderRadius: 8, border: '1px solid #1E293B', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ fontSize: 10, color: '#94A3B8', fontWeight: 700 }}>REPLAY TIMELINE PHASE:</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {(['before', 'during', 'after'] as const).map((ph) => (
                  <button
                    key={ph}
                    onClick={() => setReplayPhase(ph)}
                    style={{
                      flex: 1,
                      padding: 6,
                      borderRadius: 4,
                      fontSize: 10,
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                      background: replayPhase === ph ? '#00A6D6' : '#0F172A',
                      color: '#FFFFFF',
                      border: replayPhase === ph ? '1px solid #38BDF8' : '1px solid #334155',
                    }}
                  >
                    {ph === 'before' ? 'BEFORE (Baseline)' : ph === 'during' ? 'DURING IMPACT' : 'AFTER (Residual)'}
                  </button>
                ))}
              </div>
            </div>

            {/* TELEMETRY & METRICS */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 11 }}>
              <div style={{ background: '#070B11', padding: 8, borderRadius: 6, border: '1px solid #1E293B' }}>
                <span style={{ color: '#94A3B8', fontSize: 10 }}>TIMESTAMP & PHASE:</span>
                <div style={{ fontWeight: 700, marginTop: 2 }}>t = {viewEvent.time}s ({viewEvent.phase})</div>
              </div>
              <div style={{ background: '#070B11', padding: 8, borderRadius: 6, border: '1px solid #1E293B' }}>
                <span style={{ color: '#94A3B8', fontSize: 10 }}>SEVERITY & STATE:</span>
                <div style={{ fontWeight: 800, color: viewEvent.severity === 'INSPECTION_REQUIRED' ? '#FF8888' : '#FCD34D', marginTop: 2 }}>
                  ● {viewEvent.severity}
                </div>
              </div>
            </div>

            <div style={{ background: '#070B11', padding: 10, borderRadius: 6, border: '1px solid #1E293B', fontSize: 11 }}>
              <span style={{ color: '#94A3B8', fontSize: 10 }}>AFFECTED SENSORS & DELTA MULTIPLIERS:</span>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                {viewEvent.sensors.map((s) => (
                  <span key={s} style={{ background: 'rgba(56,189,248,0.15)', border: '1px solid #00A6D6', color: '#38BDF8', padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>
                    {s} {viewEvent.delta[s] ? `×${viewEvent.delta[s]}` : ''}
                  </span>
                ))}
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
              <button
                onClick={() => {
                  setViewEvent(null);
                  setInvestigateEvent(viewEvent);
                }}
                style={{ flex: 1, padding: 8, borderRadius: 6, background: '#F4A62A', color: '#101820', fontWeight: 800, border: 'none', cursor: 'pointer', fontSize: 11 }}
              >
                ⚖ INVESTIGATE ROOT CAUSE
              </button>
              <button
                onClick={() => {
                  setViewEvent(null);
                  navigate('controlled_val');
                }}
                style={{ flex: 1, padding: 8, borderRadius: 6, background: '#00A6D6', color: '#FFF', fontWeight: 800, border: 'none', cursor: 'pointer', fontSize: 11 }}
              >
                🛠 RETEST CONDITION IN LAB
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          CONTEXTUAL MODAL 2: ROOT CAUSE INVESTIGATION PANEL
          ============================================================ */}
      {investigateEvent && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          <div
            style={{
              width: 640,
              maxHeight: '90vh',
              overflowY: 'auto',
              background: '#111A24',
              border: '1px solid #F4A62A',
              borderRadius: 10,
              padding: 16,
              color: '#F8FAFC',
              fontFamily: 'var(--mono)',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1E293B', paddingBottom: 8 }}>
              <div>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#FCD34D' }}>ROOT CAUSE INVESTIGATION — {investigateEvent.id}</span>
                <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>{investigateEvent.label}</div>
              </div>
              <button
                onClick={() => setInvestigateEvent(null)}
                style={{ background: 'transparent', border: 'none', color: '#94A3B8', fontSize: 18, cursor: 'pointer' }}
              >
                ×
              </button>
            </div>

            {/* CONNECTED LIFECYCLE CORRELATION TREE */}
            <div style={{ background: '#070B11', padding: 10, borderRadius: 8, border: '1px solid #1E293B', fontSize: 10.5, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ color: '#94A3B8', fontWeight: 800, fontSize: 10 }}>CONNECTED ENGINEERING THREAD CORRELATION:</span>
              <div style={{ color: '#38BDF8', fontWeight: 700 }}>
                DESIGN BASELINE → MFG BASELINE → VALIDATION TEST → FIELD TELEMETRY → ML CAUSE
              </div>
              <div style={{ color: '#E2E8F0', marginTop: 4 }}>
                Impact energy exceeded 15 kN design load on Front Rail LH. Fastener preload decreased by 3.2% during test cycle. Current field strain residual: <strong>+28%</strong>.
              </div>
            </div>

            {/* CAUSE & CONFIDENCE GRID */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 11 }}>
              <div style={{ background: '#070B11', padding: 8, borderRadius: 6, border: '1px solid #1E293B' }}>
                <span style={{ color: '#94A3B8', fontSize: 10 }}>POSSIBLE CAUSE:</span>
                <div style={{ fontWeight: 700, color: '#FCD34D', marginTop: 2 }}>Micro-yielding at hardpoint joint</div>
              </div>
              <div style={{ background: '#070B11', padding: 8, borderRadius: 6, border: '1px solid #1E293B' }}>
                <span style={{ color: '#94A3B8', fontSize: 10 }}>ML CONFIDENCE SCORE:</span>
                <div style={{ fontWeight: 800, color: '#16A36A', marginTop: 2 }}>94.2% Confidence</div>
              </div>
            </div>

            {/* ENGINEER NOTES TRAIL */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 10, color: '#94A3B8', fontWeight: 700 }}>ENGINEER NOTES:</span>
              {engineerNotes.length > 0 && (
                <div style={{ background: '#070B11', padding: 8, borderRadius: 6, border: '1px solid #1E293B', display: 'flex', flexDirection: 'column', gap: 4, fontSize: 10 }}>
                  {engineerNotes.map((n, idx) => (
                    <div key={idx} style={{ color: '#38BDF8' }}>• {n}</div>
                  ))}
                </div>
              )}
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  type="text"
                  placeholder="Add engineer review note..."
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  style={{ flex: 1, background: '#0F172A', border: '1px solid #334155', color: '#F8FAFC', padding: '6px 8px', borderRadius: 4, fontSize: 11 }}
                  onKeyDown={(e) => { if (e.key === 'Enter') addEngineerNote(); }}
                />
                <button
                  onClick={addEngineerNote}
                  style={{ padding: '6px 12px', background: '#00A6D6', color: '#FFF', fontWeight: 800, border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 11 }}
                >
                  ADD
                </button>
              </div>
            </div>

            {/* ENGINEER DECISION BUTTONS */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
              <button
                onClick={() => setInvestigateEvent(null)}
                style={{ flex: 1, padding: 8, borderRadius: 6, background: '#059669', color: '#FFF', fontWeight: 800, border: 'none', cursor: 'pointer', fontSize: 11 }}
              >
                ✓ ACCEPT FINDING
              </button>
              <button
                onClick={() => {
                  setInvestigateEvent(null);
                  navigate('controlled_val');
                }}
                style={{ flex: 1, padding: 8, borderRadius: 6, background: '#D97706', color: '#FFF', fontWeight: 800, border: 'none', cursor: 'pointer', fontSize: 11 }}
              >
                ⟳ RETEST IN LAB
              </button>
              <button
                onClick={() => setInvestigateEvent(null)}
                style={{ flex: 1, padding: 8, borderRadius: 6, background: '#DC2626', color: '#FFF', fontWeight: 800, border: 'none', cursor: 'pointer', fontSize: 11 }}
              >
                ⚠️ MARK FOR INSPECTION
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
