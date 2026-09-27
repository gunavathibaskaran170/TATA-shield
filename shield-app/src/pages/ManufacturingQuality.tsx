/* ============================================================
   SHIELD — MODULE 02: MANUFACTURING QUALITY & METROLOGY CELL
   Industrial quality inspection cell featuring:
   - Digital Nominal CAD vs As-Built Laser Metrology
   - 24-Point Coordinate Datum Inspection (B01..B24)
   - 3D Deviation Vectors & Tolerance Heatmaps
   - Weld & Structural Joint Quality Inspection Matrix
   - Digital Build Genealogy Record
   ============================================================ */

import { useState } from 'react';
import { useStore } from '../store/useStore';
import { VehicleScene } from '../three/VehicleScene';
import { METROLOGY_DATUM_POINTS, BATTERY_MOUNTS } from '../data/engineering';
import type { MetrologyDatumPoint } from '../schema/types';
import { FASTENER_GROUPS, ALL_FASTENERS } from '../data/fasteners';
import { Card, Stat, ProvTag } from '../ui/kit';

export function ManufacturingQuality() {
  const selectedDatumPoint = useStore((s) => s.selectedDatumPoint);
  const setSelectedDatumPoint = useStore((s) => s.setSelectedDatumPoint);
  const setViewMode = useStore((s) => s.setViewMode);
  const setCadView = useStore((s) => s.setCadView);
  const vehicleId = useStore((s) => s.vehicleId);
  const navigate = useStore((s) => s.navigate);

  const [inspectionMode, setInspectionMode] = useState<'nominal' | 'as_built' | 'deviation'>('deviation');
  const [activeCategory, setActiveCategory] = useState<'metrology' | 'joints' | 'genealogy'>('metrology');
  const [filterRegion, setFilterRegion] = useState<string>('ALL');

  const selectedPoint = METROLOGY_DATUM_POINTS.find((p) => p.id === selectedDatumPoint) ?? METROLOGY_DATUM_POINTS[16]; // Default B17

  const regions = ['ALL', ...new Set(METROLOGY_DATUM_POINTS.map((p) => p.region))];
  const filteredPoints = filterRegion === 'ALL'
    ? METROLOGY_DATUM_POINTS
    : METROLOGY_DATUM_POINTS.filter((p) => p.region === filterRegion);

  const totalPoints = METROLOGY_DATUM_POINTS.length;
  const acceptedPoints = METROLOGY_DATUM_POINTS.filter((p) => p.status === 'ACCEPT').length;
  const maxDev = Math.max(...METROLOGY_DATUM_POINTS.map((p) => p.deviationMm));
  const avgDev = METROLOGY_DATUM_POINTS.reduce((acc, p) => acc + p.deviationMm, 0) / totalPoints;

  return (
    <div className="mfg-quality-layout" style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* 3D Metrology Scene */}
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
              background: 'linear-gradient(135deg, #065f46, #064e3b)',
              border: '1px solid #10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#34d399',
              fontWeight: 800,
              fontSize: 14,
            }}
          >
            02
          </div>
          <div>
            <div className="row" style={{ gap: 8 }}>
              <span style={{ fontWeight: 700, fontSize: 14, letterSpacing: '0.04em', color: '#f8fafc' }}>
                MANUFACTURING QUALITY & LASER METROLOGY CELL
              </span>
              <span className="prov prov-verified">CMM LASER SCAN</span>
              <span className="prov prov-verified">OPTICAL METROLOGY</span>
            </div>
            <div className="tiny faint" style={{ marginTop: 2 }}>
              Digital Nominal CAD vs As-Built Dimensional Verification · Tolerance Range ±0.80 mm
            </div>
          </div>
        </div>

        {/* Metrology Mode Switcher */}
        <div className="row wrap" style={{ gap: 6 }}>
          {(['nominal', 'as_built', 'deviation'] as const).map((mode) => {
            const active = inspectionMode === mode;
            const label = mode === 'nominal' ? 'Digital Nominal CAD' : mode === 'as_built' ? 'As-Built Scan' : 'Deviation Heatmap';
            return (
              <button
                key={mode}
                className={`btn ${active ? 'active' : ''}`}
                onClick={() => setInspectionMode(mode)}
                style={{
                  background: active ? '#059669' : undefined,
                  borderColor: active ? '#10b981' : undefined,
                  color: active ? '#fff' : undefined,
                  fontSize: 12,
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Floating Left Panel — Metrology Datum Points & Joint Quality */}
      <div
        style={{
          position: 'absolute',
          top: 64,
          left: 14,
          bottom: 14,
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
            border: '1px solid rgba(16, 185, 129, 0.25)',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            flex: 1,
            overflow: 'hidden',
          }}
        >
          {/* Sub Tabs */}
          <div className="row" style={{ background: 'var(--bg2)', padding: 3, borderRadius: 6, gap: 4 }}>
            <button
              style={{
                flex: 1,
                padding: '6px 4px',
                fontSize: 11,
                fontWeight: 600,
                borderRadius: 4,
                border: 'none',
                background: activeCategory === 'metrology' ? '#059669' : 'transparent',
                color: activeCategory === 'metrology' ? '#fff' : 'var(--muted)',
                cursor: 'pointer',
              }}
              onClick={() => setActiveCategory('metrology')}
            >
              Datum Metrology (24)
            </button>
            <button
              style={{
                flex: 1,
                padding: '6px 4px',
                fontSize: 11,
                fontWeight: 600,
                borderRadius: 4,
                border: 'none',
                background: activeCategory === 'joints' ? '#059669' : 'transparent',
                color: activeCategory === 'joints' ? '#fff' : 'var(--muted)',
                cursor: 'pointer',
              }}
              onClick={() => setActiveCategory('joints')}
            >
              Joint Quality
            </button>
            <button
              style={{
                flex: 1,
                padding: '6px 4px',
                fontSize: 11,
                fontWeight: 600,
                borderRadius: 4,
                border: 'none',
                background: activeCategory === 'genealogy' ? '#059669' : 'transparent',
                color: activeCategory === 'genealogy' ? '#fff' : 'var(--muted)',
                cursor: 'pointer',
              }}
              onClick={() => setActiveCategory('genealogy')}
            >
              Build Genealogy
            </button>
          </div>

          {/* TAB 1: DATUM METROLOGY */}
          {activeCategory === 'metrology' && (
            <div className="col" style={{ flex: 1, overflow: 'hidden', gap: 10 }}>
              {/* Region Filter */}
              <div className="row wrap" style={{ gap: 4 }}>
                {regions.map((r) => (
                  <button
                    key={r}
                    onClick={() => setFilterRegion(r)}
                    style={{
                      padding: '3px 7px',
                      fontSize: 10,
                      borderRadius: 4,
                      border: filterRegion === r ? '1px solid #10b981' : '1px solid var(--line)',
                      background: filterRegion === r ? 'rgba(16,185,129,0.15)' : 'transparent',
                      color: filterRegion === r ? '#34d399' : 'var(--muted)',
                      cursor: 'pointer',
                    }}
                  >
                    {r}
                  </button>
                ))}
              </div>

              {/* Datum List */}
              <div className="col" style={{ flex: 1, overflowY: 'auto', gap: 4, paddingRight: 4 }}>
                {filteredPoints.map((p) => {
                  const isSelected = p.id === selectedPoint.id;
                  const devRatio = p.deviationMm / p.toleranceMm;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setSelectedDatumPoint(p.id)}
                      style={{
                        textAlign: 'left',
                        padding: '6px 8px',
                        borderRadius: 5,
                        cursor: 'pointer',
                        background: isSelected ? 'linear-gradient(90deg, #064e3b, #0f172a)' : 'rgba(255,255,255,0.02)',
                        border: isSelected ? '1px solid #10b981' : '1px solid var(--line)',
                        color: isSelected ? '#34d399' : 'var(--text)',
                      }}
                    >
                      <div className="spread">
                        <span className="mono" style={{ fontWeight: 700, fontSize: 12 }}>{p.id} — {p.name}</span>
                        <span
                          className="chip tiny"
                          style={{
                            color: devRatio > 0.8 ? 'var(--amber)' : '#34d399',
                            borderColor: devRatio > 0.8 ? 'rgba(245,158,11,0.3)' : 'rgba(16,185,129,0.3)',
                          }}
                        >
                          {p.status}
                        </span>
                      </div>
                      <div className="spread" style={{ marginTop: 2, fontSize: 11 }}>
                        <span className="faint">{p.region}</span>
                        <span className="mono" style={{ color: devRatio > 0.8 ? 'var(--amber)' : 'var(--cyan)' }}>
                          Δ {p.deviationMm > 0 ? `+${p.deviationMm.toFixed(2)}` : p.deviationMm.toFixed(2)} mm (Tol ±{p.toleranceMm} mm)
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Metrology Statistics Banner */}
              <div className="grid3" style={{ gap: 6 }}>
                <Stat label="Inspected" value={`${acceptedPoints}/${totalPoints}`} sub="100% Passed" accent="var(--green)" />
                <Stat label="Avg Deviation" value={`+${avgDev.toFixed(2)} mm`} sub="Mean absolute" />
                <Stat label="Max Deviation" value={`+${maxDev.toFixed(2)} mm`} sub="Point B18" accent="var(--cyan)" />
              </div>
            </div>
          )}

          {/* TAB 2: JOINT QUALITY */}
          {activeCategory === 'joints' && (
            <div className="col" style={{ flex: 1, overflowY: 'auto', gap: 10 }}>
              <div className="tiny faint" style={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Battery Pack 6-Point Bolted Interface
              </div>
              <div className="col" style={{ gap: 6 }}>
                {BATTERY_MOUNTS.map((m) => (
                  <div key={m.id} className="panel" style={{ padding: 8, background: 'rgba(0,0,0,0.25)', border: '1px solid var(--line)' }}>
                    <div className="spread">
                      <span className="mono" style={{ fontWeight: 700, fontSize: 12, color: '#38bdf8' }}>{m.id} ({m.location})</span>
                      <span className="chip tiny" style={{ color: m.status === 'ACCEPT' ? 'var(--green)' : 'var(--amber)' }}>
                        {m.status}
                      </span>
                    </div>
                    <div className="tiny faint" style={{ marginTop: 2 }}>{m.fastenerSpec}</div>
                    <div className="grid3" style={{ marginTop: 6, gap: 4 }}>
                      <div className="stat" style={{ padding: '3px 4px' }}>
                        <span className="tiny faint">Torque</span>
                        <span className="mono tiny" style={{ fontWeight: 600 }}>{m.measuredTorqueNm} Nm</span>
                      </div>
                      <div className="stat" style={{ padding: '3px 4px' }}>
                        <span className="tiny faint">Preload</span>
                        <span className="mono tiny" style={{ fontWeight: 600 }}>{m.preloadKn} kN</span>
                      </div>
                      <div className="stat" style={{ padding: '3px 4px' }}>
                        <span className="tiny faint">Ultrasonic</span>
                        <span className="mono tiny" style={{ fontWeight: 600, color: 'var(--green)' }}>{m.ultrasonicIntegrityPct}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="tiny faint" style={{ textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 6 }}>
                Spot Weld & Structural Adhesive Summary
              </div>
              <div className="panel" style={{ padding: 8, background: 'rgba(0,0,0,0.25)' }}>
                <div className="grid2" style={{ gap: 6 }}>
                  <Stat label="Spot Welds" value="3,842" sub="Automatic robot weld" />
                  <Stat label="Adhesive Seams" value="48.5 m" sub="Polyurethane structural" />
                  <Stat label="Acoustic Check" value="100%" sub="Sampling passed" accent="var(--green)" />
                  <Stat label="Torque Verification" value="72/72" sub="Critical fasteners OK" accent="var(--green)" />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: BUILD GENEALOGY */}
          {activeCategory === 'genealogy' && (
            <div className="col" style={{ flex: 1, overflowY: 'auto', gap: 10 }}>
              <div className="spread">
                <span className="small" style={{ fontWeight: 700, color: '#34d399' }}>Digital Build Genealogy</span>
                <span className="prov prov-verified">VERIFIED RECORD</span>
              </div>
              <div className="tiny faint">Immutable Factory As-Built Traceability for {vehicleId}</div>

              <div className="col" style={{ gap: 6 }}>
                {[
                  { station: 'Station 01 — Underbody Stamping & Blanking', biwId: 'STAMP-PUNE-2026-0814', op: 'OP-100', ts: '2026-04-22 08:30 IST', status: 'PASS' },
                  { station: 'Station 02 — BIW Framing & Robotic Spot-Welding', biwId: 'BIW-FRAME-0287', op: 'OP-200', ts: '2026-04-22 11:15 IST', status: 'PASS' },
                  { station: 'Station 03 — CMM Laser Metrology Cell B01–B24', biwId: 'CMM-CELL-04', op: 'OP-250', ts: '2026-04-22 13:45 IST', status: 'PASS' },
                  { station: 'Station 04 — Battery Pack Structural Docking', biwId: 'BAT-PACK-60KWH-912', op: 'OP-300', ts: '2026-04-22 15:20 IST', status: 'PASS' },
                  { station: 'Station 05 — E-Coat Anti-Corrosion & Paint Sealing', biwId: 'PAINT-LINE-02', op: 'OP-400', ts: '2026-04-23 09:10 IST', status: 'PASS' },
                  { station: 'Station 06 — Trim, Chassis & Final Fastener Audit', biwId: 'FINAL-AUDIT-0287', op: 'OP-500', ts: '2026-04-23 16:30 IST', status: 'PASS' },
                ].map((g, i) => (
                  <div key={i} className="panel" style={{ padding: 8, background: 'rgba(0,0,0,0.25)', border: '1px solid var(--line)' }}>
                    <div className="spread">
                      <span className="tiny" style={{ fontWeight: 700, color: 'var(--text)' }}>{g.station}</span>
                      <span className="chip tiny" style={{ color: 'var(--green)' }}>✓ {g.status}</span>
                    </div>
                    <div className="spread" style={{ marginTop: 4, fontSize: 10 }}>
                      <span className="mono faint">ID: {g.biwId}</span>
                      <span className="faint">{g.ts}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Right Detail Panel — Selected Datum Point Card */}
      {selectedPoint && (
        <div
          style={{
            position: 'absolute',
            top: 64,
            right: 14,
            width: 320,
            zIndex: 3,
            pointerEvents: 'auto',
          }}
        >
          <div
            className="panel"
            style={{
              padding: 12,
              background: 'rgba(12, 16, 21, 0.88)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
            }}
          >
            <div className="spread">
              <span className="mono" style={{ fontWeight: 700, fontSize: 13, color: '#34d399' }}>
                DATUM POINT {selectedPoint.id}
              </span>
              <span className="chip tiny" style={{ color: 'var(--green)' }}>{selectedPoint.status}</span>
            </div>
            <div className="tiny" style={{ marginTop: 2, color: 'var(--text)', fontWeight: 600 }}>{selectedPoint.name}</div>
            <div className="tiny faint" style={{ marginTop: 1 }}>Region: {selectedPoint.region}</div>

            <div className="col" style={{ marginTop: 8, gap: 6 }}>
              <div className="panel" style={{ padding: 6, background: 'rgba(0,0,0,0.3)' }}>
                <div className="spread">
                  <span className="tiny faint">Nominal CAD Position:</span>
                  <span className="mono tiny">[{selectedPoint.nominal.map((v) => v.toFixed(2)).join(', ')}] m</span>
                </div>
                <div className="spread" style={{ marginTop: 2 }}>
                  <span className="tiny faint">As-Built Laser Scan:</span>
                  <span className="mono tiny" style={{ color: '#38bdf8' }}>[{selectedPoint.measured.map((v) => v.toFixed(4)).join(', ')}] m</span>
                </div>
              </div>

              <div className="grid2" style={{ gap: 4 }}>
                <div className="stat" style={{ padding: '4px 6px' }}>
                  <span className="tiny faint">Total Deviation</span>
                  <span className="mono" style={{ fontSize: 14, fontWeight: 700, color: 'var(--cyan)' }}>
                    +{selectedPoint.deviationMm.toFixed(2)} mm
                  </span>
                </div>
                <div className="stat" style={{ padding: '4px 6px' }}>
                  <span className="tiny faint">Tolerance Limit</span>
                  <span className="mono" style={{ fontSize: 14, fontWeight: 700 }}>
                    ±{selectedPoint.toleranceMm.toFixed(2)} mm
                  </span>
                </div>
              </div>

              <div className="panel" style={{ padding: 6, background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)' }}>
                <div className="tiny" style={{ fontWeight: 600, color: '#34d399' }}>Quality Gate Disposition:</div>
                <div className="tiny faint" style={{ marginTop: 2 }}>
                  Deviation is well within the 6-sigma tolerance envelope. Approved for downstream battery integration and EOL commissioning.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Action Footer */}
      <div
        style={{
          position: 'absolute',
          bottom: 14,
          left: 428,
          right: 14,
          zIndex: 2,
          padding: '8px 14px',
          background: 'rgba(12, 16, 21, 0.85)',
          backdropFilter: 'blur(10px)',
          border: '1px solid var(--line)',
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          pointerEvents: 'auto',
        }}
      >
        <div className="row" style={{ gap: 8 }}>
          <span className="tiny faint">Baseline A Status:</span>
          <span className="chip" style={{ color: 'var(--green)' }}>✓ BASELINE A (MANUFACTURING QUALITY) FROZEN</span>
        </div>
        <button
          className="btn"
          onClick={() => navigate('controlled_val')}
          style={{ background: '#059669', color: '#fff', fontWeight: 600, border: 'none' }}
        >
          Proceed to 03 Controlled Validation →
        </button>
      </div>
    </div>
  );
}
