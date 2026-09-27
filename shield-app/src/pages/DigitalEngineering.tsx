/* ============================================================
   SHIELD — MODULE 01: DIGITAL ENGINEERING & CAE WORKSPACE
   Full automotive engineering workspace featuring:
   - Full-screen interactive BIW / Chassis / Load-path structure
   - Design Revision System (REV-A / REV-B / REV-C comparison)
   - Virtual CAE Load Cases & Validation Maps
   - Animated Load Path Transfer
   - Contextual Component Engineering Cards
   - Engineering Release Gate (APPROVED FOR BUILD)
   ============================================================ */

import { useState } from 'react';
import { useStore } from '../store/useStore';
import { VehicleScene } from '../three/VehicleScene';
import { DESIGN_REVISIONS, CAE_LOAD_CASES, type RevisionDef, type CaeLoadCaseDef } from '../data/engineering';
import { CATALOG_BY_ID } from '../data/catalog';
import { Card, Stat, StatusChip, ProvTag } from '../ui/kit';
import type { CaeLoadCase, DesignRevision } from '../schema/types';

export function DigitalEngineering() {
  const currentRevision = useStore((s) => s.currentRevision);
  const setCurrentRevision = useStore((s) => s.setCurrentRevision);
  const activeCaeLoadCase = useStore((s) => s.activeCaeLoadCase);
  const setActiveCaeLoadCase = useStore((s) => s.setActiveCaeLoadCase);
  const selected = useStore((s) => s.selected);
  const select = useStore((s) => s.select);
  const clearSelection = useStore((s) => s.clearSelection);
  const viewMode = useStore((s) => s.viewMode);
  const setViewMode = useStore((s) => s.setViewMode);
  const cadView = useStore((s) => s.cadView);
  const setCadView = useStore((s) => s.setCadView);
  const explode = useStore((s) => s.explode);
  const setExplode = useStore((s) => s.setExplode);
  const xray = useStore((s) => s.xray);
  const setXray = useStore((s) => s.setXray);
  const wireframe = useStore((s) => s.wireframe);
  const setWireframe = useStore((s) => s.setWireframe);
  const navigate = useStore((s) => s.navigate);

  const [activeTab, setActiveTab] = useState<'cae' | 'revisions' | 'release' | 'component'>('cae');
  const [caeMetric, setCaeMetric] = useState<'stress' | 'strain' | 'displacement' | 'loadpath'>('stress');
  const [showDatums, setShowDatums] = useState<boolean>(true);

  const activeRev = DESIGN_REVISIONS[currentRevision];
  const activeCae = CAE_LOAD_CASES[activeCaeLoadCase];
  const selectedCompId = selected.length ? selected[selected.length - 1] : null;
  const selectedComp = selectedCompId ? CATALOG_BY_ID[selectedCompId] : null;

  return (
    <div className="digital-eng-layout" style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* 3D Engineering Viewport */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <VehicleScene />
      </div>

      {/* Top Engineering Ribbon */}
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
              background: 'linear-gradient(135deg, #164e63, #083344)',
              border: '1px solid #06b6d4',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#38bdf8',
              fontWeight: 800,
              fontSize: 14,
            }}
          >
            01
          </div>
          <div>
            <div className="row" style={{ gap: 8 }}>
              <span style={{ fontWeight: 700, fontSize: 14, letterSpacing: '0.04em', color: '#f8fafc' }}>
                DIGITAL ENGINEERING & CAE VALIDATION
              </span>
              <span className="prov prov-verified">CAD MASTER MESH</span>
              <span className="prov prov-sim">CAE ROM 0.1</span>
            </div>
            <div className="tiny faint" style={{ marginTop: 2 }}>
              Parametric EV Unibody Frame · Datum Plane System · Finite Element Reduced-Order Models
            </div>
          </div>
        </div>

        {/* Viewport & Inspection Toggles */}
        <div className="row wrap" style={{ gap: 6 }}>
          <button
            className={`btn ${viewMode === 'skeletal' ? 'active' : ''}`}
            onClick={() => { setViewMode('skeletal'); setCadView(true); }}
            title="Skeletal BIW & Chassis Frame"
          >
            BIW / Chassis
          </button>
          <button
            className={`btn ${viewMode === 'transparent' ? 'active' : ''}`}
            onClick={() => { setViewMode('transparent'); setCadView(false); }}
            title="Translucent Body Shell"
          >
            Ghost Shell
          </button>
          <button
            className={`btn ${viewMode === 'complete' ? 'active' : ''}`}
            onClick={() => { setViewMode('complete'); setCadView(false); }}
            title="Complete Production Vehicle"
          >
            Production Body
          </button>
          <div style={{ width: 1, height: 18, background: 'var(--line)', margin: '0 4px' }} />
          <button
            className={`btn ${xray ? 'active' : ''}`}
            onClick={() => setXray(!xray)}
            title="Toggle X-Ray Transparency"
          >
            X-Ray
          </button>
          <button
            className={`btn ${wireframe ? 'active' : ''}`}
            onClick={() => setWireframe(!wireframe)}
            title="Toggle Finite Element Wireframe"
          >
            FEA Wireframe
          </button>
          <button
            className={`btn ${showDatums ? 'active' : ''}`}
            onClick={() => setShowDatums(!showDatums)}
            title="Toggle Datum Reference Planes"
          >
            Datums {showDatums ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* Floating Left Panel — CAE Load Cases & Revisions */}
      <div
        style={{
          position: 'absolute',
          top: 64,
          left: 14,
          bottom: 14,
          width: 380,
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
            border: '1px solid rgba(56, 189, 248, 0.25)',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            flex: 1,
            overflow: 'hidden',
          }}
        >
          {/* Module Navigation Tabs */}
          <div className="row" style={{ background: 'var(--bg2)', padding: 3, borderRadius: 6, gap: 4 }}>
            <button
              style={{
                flex: 1,
                padding: '6px 4px',
                fontSize: 11,
                fontWeight: 600,
                borderRadius: 4,
                border: 'none',
                background: activeTab === 'cae' ? '#0e7490' : 'transparent',
                color: activeTab === 'cae' ? '#fff' : 'var(--muted)',
                cursor: 'pointer',
              }}
              onClick={() => setActiveTab('cae')}
            >
              CAE Cases
            </button>
            <button
              style={{
                flex: 1,
                padding: '6px 4px',
                fontSize: 11,
                fontWeight: 600,
                borderRadius: 4,
                border: 'none',
                background: activeTab === 'revisions' ? '#0e7490' : 'transparent',
                color: activeTab === 'revisions' ? '#fff' : 'var(--muted)',
                cursor: 'pointer',
              }}
              onClick={() => setActiveTab('revisions')}
            >
              CAD Revisions
            </button>
            <button
              style={{
                flex: 1,
                padding: '6px 4px',
                fontSize: 11,
                fontWeight: 600,
                borderRadius: 4,
                border: 'none',
                background: activeTab === 'release' ? '#0e7490' : 'transparent',
                color: activeTab === 'release' ? '#fff' : 'var(--muted)',
                cursor: 'pointer',
              }}
              onClick={() => setActiveTab('release')}
            >
              Release Gate
            </button>
          </div>

          {/* TAB 1: CAE LOAD CASES */}
          {activeTab === 'cae' && (
            <div className="col" style={{ flex: 1, overflow: 'auto', gap: 10 }}>
              <div>
                <div className="tiny faint" style={{ textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                  Select Virtual Load Case
                </div>
                <div className="col" style={{ gap: 4, maxHeight: 190, overflowY: 'auto' }}>
                  {Object.values(CAE_LOAD_CASES).map((c) => {
                    const active = activeCaeLoadCase === c.id;
                    return (
                      <button
                        key={c.id}
                        onClick={() => setActiveCaeLoadCase(c.id)}
                        style={{
                          textAlign: 'left',
                          padding: '7px 10px',
                          borderRadius: 5,
                          cursor: 'pointer',
                          background: active ? 'linear-gradient(90deg, #164e63, #0f172a)' : 'rgba(255,255,255,0.03)',
                          border: active ? '1px solid #06b6d4' : '1px solid var(--line)',
                          color: active ? '#38bdf8' : 'var(--text)',
                        }}
                      >
                        <div className="spread">
                          <span style={{ fontSize: 12, fontWeight: 600 }}>{c.name}</span>
                          <span className="tiny mono" style={{ color: active ? '#67e8f9' : 'var(--faint)' }}>{c.category}</span>
                        </div>
                        <div className="tiny faint" style={{ marginTop: 2 }}>{c.criticalRegion}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Active CAE Summary */}
              {activeCae && (
                <div className="panel" style={{ padding: 10, background: 'rgba(0,0,0,0.3)', border: '1px solid var(--line)' }}>
                  <div className="spread">
                    <span className="small" style={{ fontWeight: 700, color: '#38bdf8' }}>CAE Evidence Summary</span>
                    <ProvTag p={activeCae.provenance} />
                  </div>
                  <div className="tiny faint" style={{ marginTop: 4 }}>{activeCae.loadInput}</div>

                  <div className="grid2" style={{ marginTop: 8, gap: 6 }}>
                    <div className="stat" style={{ padding: '4px 6px' }}>
                      <span className="tiny faint">Peak Von Mises</span>
                      <span className="mono" style={{ fontSize: 14, fontWeight: 700, color: activeCae.peakStressMpa > 400 ? 'var(--amber)' : 'var(--cyan)' }}>
                        {activeCae.peakStressMpa} MPa
                      </span>
                    </div>
                    <div className="stat" style={{ padding: '4px 6px' }}>
                      <span className="tiny faint">Safety Factor</span>
                      <span className="mono" style={{ fontSize: 14, fontWeight: 700, color: activeCae.safetyFactor > 1.35 ? 'var(--green)' : 'var(--amber)' }}>
                        {activeCae.safetyFactor.toFixed(2)}x
                      </span>
                    </div>
                    <div className="stat" style={{ padding: '4px 6px' }}>
                      <span className="tiny faint">Max Deflection</span>
                      <span className="mono" style={{ fontSize: 14, fontWeight: 700 }}>
                        {activeCae.maxDeflectionMm.toFixed(2)} mm
                      </span>
                    </div>
                    <div className="stat" style={{ padding: '4px 6px' }}>
                      <span className="tiny faint">Yield Limit</span>
                      <span className="mono" style={{ fontSize: 14, fontWeight: 700 }}>
                        {activeCae.yieldLimitMpa} MPa
                      </span>
                    </div>
                  </div>

                  <div style={{ marginTop: 8, padding: '6px 8px', background: 'rgba(56,189,248,0.06)', borderRadius: 4, border: '1px solid rgba(56,189,248,0.2)' }}>
                    <div className="tiny" style={{ fontWeight: 600, color: '#38bdf8' }}>Primary Load Path:</div>
                    <div className="tiny faint" style={{ marginTop: 2, lineHeight: 1.3 }}>{activeCae.loadPathDescription}</div>
                  </div>
                </div>
              )}

              {/* CAE Visualization Metric Selector */}
              <div>
                <div className="tiny faint" style={{ textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                  Contour Visualization Mode
                </div>
                <div className="grid2" style={{ gap: 4 }}>
                  {(['stress', 'strain', 'displacement', 'loadpath'] as const).map((m) => (
                    <button
                      key={m}
                      className={`btn ${caeMetric === m ? 'active' : ''}`}
                      onClick={() => setCaeMetric(m)}
                      style={{ textTransform: 'capitalize', fontSize: 11 }}
                    >
                      {m === 'loadpath' ? 'Load Path Flow' : m}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DESIGN REVISIONS */}
          {activeTab === 'revisions' && (
            <div className="col" style={{ flex: 1, overflow: 'auto', gap: 10 }}>
              <div className="tiny faint" style={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Vehicle Architecture Revision
              </div>
              <div className="row" style={{ gap: 6 }}>
                {(['REV-A', 'REV-B', 'REV-C'] as DesignRevision[]).map((rev) => {
                  const r = DESIGN_REVISIONS[rev];
                  const active = currentRevision === rev;
                  return (
                    <button
                      key={rev}
                      onClick={() => setCurrentRevision(rev)}
                      style={{
                        flex: 1,
                        padding: '8px 6px',
                        borderRadius: 5,
                        cursor: 'pointer',
                        background: active ? 'linear-gradient(135deg, #164e63, #0f172a)' : 'var(--bg2)',
                        border: active ? '1px solid #06b6d4' : '1px solid var(--line)',
                        color: active ? '#38bdf8' : 'var(--text)',
                        textAlign: 'center',
                      }}
                    >
                      <div style={{ fontWeight: 700, fontSize: 13 }}>{rev}</div>
                      <div className="tiny faint" style={{ marginTop: 2 }}>{r.biwMassKg} kg</div>
                    </button>
                  );
                })}
              </div>

              <div className="panel" style={{ padding: 10, background: 'rgba(0,0,0,0.3)', border: '1px solid var(--line)' }}>
                <div className="spread">
                  <span style={{ fontWeight: 700, fontSize: 13, color: '#38bdf8' }}>{activeRev.label}</span>
                  <span className="prov prov-verified">{activeRev.releaseStatus}</span>
                </div>

                <div className="grid2" style={{ marginTop: 8, gap: 6 }}>
                  <Stat label="BIW Mass" value={`${activeRev.biwMassKg} kg`} sub="bare unibody" />
                  <Stat label="Torsional Rigidity" value={`${activeRev.torsionalRigidityKnmPerDeg} kNm/°`} sub="global stiffness" accent="var(--cyan)" />
                  <Stat label="1st Torsion Freq" value={`${activeRev.firstTorsionFreqHz} Hz`} sub="modal target >28 Hz" accent={activeRev.firstTorsionFreqHz >= 28 ? 'var(--green)' : 'var(--amber)'} />
                  <Stat label="1st Bending Freq" value={`${activeRev.firstBendingFreqHz} Hz`} sub="modal target >35 Hz" accent="var(--green)" />
                  <Stat label="Boron Steel" value={`${activeRev.boronSteelFractionPct}%`} sub="1500 MPa hot-formed" />
                  <Stat label="Die-Castings" value={`${activeRev.aluminumCastingsFractionPct}%`} sub="AlSi10Mn nodes" />
                </div>

                <div style={{ marginTop: 8 }}>
                  <div className="tiny" style={{ fontWeight: 600, color: 'var(--muted)' }}>Engineering Iteration Highlights:</div>
                  <ul style={{ margin: '4px 0 0 16px', padding: 0, fontSize: 11, color: 'var(--faint)' }}>
                    {activeRev.changes.map((c, i) => (
                      <li key={i} style={{ marginBottom: 2 }}>{c}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Revision Delta Comparison */}
              <div className="panel" style={{ padding: 10, background: 'rgba(0,0,0,0.2)', border: '1px solid var(--line)' }}>
                <div className="small" style={{ fontWeight: 600, color: 'var(--muted)' }}>REV-A vs REV-B Optimization Delta</div>
                <div className="row wrap" style={{ marginTop: 6, gap: 6 }}>
                  <span className="chip" style={{ color: 'var(--green)' }}>▼ -15.6 kg BIW Mass (-4.4%)</span>
                  <span className="chip" style={{ color: 'var(--cyan)' }}>▲ +2.8 kNm/° Rigidity (+15.2%)</span>
                  <span className="chip" style={{ color: 'var(--green)' }}>▼ -13.4% Peak Stress</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ENGINEERING RELEASE GATE */}
          {activeTab === 'release' && (
            <div className="col" style={{ flex: 1, overflow: 'auto', gap: 10 }}>
              <div className="spread">
                <span className="small" style={{ fontWeight: 700, color: '#38bdf8' }}>Engineering Release Gate</span>
                <span className="prov prov-verified">ISO/TS 16949</span>
              </div>
              <div className="tiny faint">Formal Sign-Off Gate for Physical Prototype Tooling & Assembly</div>

              <div className="col" style={{ gap: 6 }}>
                {[
                  { check: 'CAD Master Geometry Complete & Frozen', status: 'VERIFIED', owner: 'Body Systems Lead' },
                  { check: 'Chassis Hardpoints & Kinematics Validated', status: 'VERIFIED', owner: 'Chassis Lead' },
                  { check: '12/12 Primary CAE Load Cases Met Safety Factors', status: 'VERIFIED', owner: 'CAE / Structural Lead' },
                  { check: 'Battery Pack 6-Point Structural Interface Verified', status: 'VERIFIED', owner: 'HV Integration Lead' },
                  { check: 'Manufacturing Stamping & Spot-Weld Feasibility', status: 'VERIFIED', owner: 'Manufacturing Engineer' },
                  { check: 'Crash Load Path Energy Absorption Requirements Met', status: 'VERIFIED', owner: 'Passive Safety Lead' },
                  { check: 'Zero Open Critical Engineering Exceptions', status: 'VERIFIED', owner: 'Chief Technical Architect' },
                ].map((item, i) => (
                  <div key={i} className="panel" style={{ padding: '6px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                    <div>
                      <div className="tiny" style={{ fontWeight: 600 }}>{item.check}</div>
                      <div className="tiny faint" style={{ marginTop: 1 }}>Sign-off: {item.owner}</div>
                    </div>
                    <span className="chip" style={{ color: 'var(--green)', borderColor: 'rgba(34,197,94,0.3)', background: 'rgba(34,197,94,0.1)' }}>
                      ✓ {item.status}
                    </span>
                  </div>
                ))}
              </div>

              <div
                style={{
                  marginTop: 4,
                  padding: 12,
                  borderRadius: 6,
                  background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(6,182,212,0.15))',
                  border: '1px solid #10b981',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: '0.08em', color: '#10b981' }}>
                  APPROVED FOR BUILD
                </div>
                <div className="tiny faint" style={{ marginTop: 2 }}>
                  Release Signature: CHIEF-ENG-EV2026-0287 · Ready for Tooling & Manufacturing Cell
                </div>
                <button
                  className="btn"
                  onClick={() => navigate('mfg_quality')}
                  style={{ marginTop: 8, width: '100%', background: '#059669', color: '#fff', fontWeight: 600, border: 'none' }}
                >
                  Proceed to Manufacturing Quality Cell →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Right Panel — Contextual Component Engineering Card */}
      {selectedComp && (
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
              border: '1px solid rgba(56, 189, 248, 0.3)',
            }}
          >
            <div className="spread">
              <div style={{ fontWeight: 700, fontSize: 13, color: '#38bdf8' }}>{selectedComp.name}</div>
              <button className="btn tiny" onClick={() => clearSelection()} title="Close">✕</button>
            </div>
            <div className="tiny faint mono" style={{ marginTop: 2 }}>ID: {selectedComp.id} · Layer {selectedComp.layer}</div>

            <div className="col" style={{ marginTop: 8, gap: 6 }}>
              <div className="panel" style={{ padding: 6, background: 'rgba(0,0,0,0.25)' }}>
                <span className="tiny faint">Functional Role:</span>
                <div className="tiny" style={{ marginTop: 1, color: 'var(--text)' }}>
                  Primary crash load path member, front suspension load transfer, and frontal torsional stiffness contribution.
                </div>
              </div>

              <div className="grid2" style={{ gap: 4 }}>
                <div className="stat" style={{ padding: '4px 6px' }}>
                  <span className="tiny faint">Material Class</span>
                  <span className="mono tiny" style={{ fontWeight: 600 }}>{selectedComp.material || 'Ultra High Strength Steel'}</span>
                </div>
                <div className="stat" style={{ padding: '4px 6px' }}>
                  <span className="tiny faint">Manufacturing</span>
                  <span className="mono tiny" style={{ fontWeight: 600 }}>{selectedComp.manufacturingProcess || 'Hot Stamped / E-Coat'}</span>
                </div>
              </div>

              <div className="panel" style={{ padding: 6, background: 'rgba(0,0,0,0.25)' }}>
                <span className="tiny faint">CAE Load Case Linkage:</span>
                <div className="row wrap" style={{ marginTop: 4, gap: 4 }}>
                  <span className="chip tiny">Bending 1.5g</span>
                  <span className="chip tiny">Front Impact 50kph</span>
                  <span className="chip tiny">Torsion 3000Nm</span>
                </div>
              </div>

              <div className="spread">
                <span className="tiny faint">Commissioning State:</span>
                <StatusChip state={selectedComp.healthState} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Explode & Datum Controls */}
      <div
        style={{
          position: 'absolute',
          bottom: 14,
          left: 408,
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
        <div className="row" style={{ gap: 8, flex: 1, maxWidth: 450 }}>
          <span className="tiny muted" style={{ width: 110, flex: 'none' }}>CAD Explode: {(explode * 100).toFixed(0)}%</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={explode}
            onChange={(e) => setExplode(parseFloat(e.target.value))}
            style={{ flex: 1 }}
          />
        </div>

        <div className="row" style={{ gap: 12 }}>
          <span className="tiny faint">Datum Planes: XY (Ground 0.0), YZ (Centerline), ZX (Front Axle)</span>
          <span className="prov prov-verified">REVISION {currentRevision} ACTIVE</span>
        </div>
      </div>
    </div>
  );
}
