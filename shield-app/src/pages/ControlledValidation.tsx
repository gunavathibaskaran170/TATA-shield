/* ============================================================
   SHIELD — MODULE 03: CONTROLLED VALIDATION RIGS & CAE CORRELATION
   Automotive structural testing facility featuring:
   - 5 Selectable Virtual/Physical Test Rigs (4-Post, Torsion, Bending, Modal, Battery Mount)
   - Real-Time Dynamic Actuator & Strip Chart Telemetry
   - Exaggerated Visual Deformation Scaling (Lab ×25 mode)
   - CAE vs Physical Correlation Matrix (Residuals & Confidence)
   - End-of-Line Commissioning Fingerprint (Baseline B Freeze)
   ============================================================ */

import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { VehicleScene } from '../three/VehicleScene';
import { TEST_RIGS, type TestRigDef } from '../data/engineering';
import { SENSORS } from '../data/sensors';
import { Card, Stat, ProvTag } from '../ui/kit';
import type { TestRigType } from '../schema/types';

export function ControlledValidation() {
  const activeTestRig = useStore((s) => s.activeTestRig);
  const setActiveTestRig = useStore((s) => s.setActiveTestRig);
  const visualDeformationScale = useStore((s) => s.visualDeformationScale);
  const setVisualDeformationScale = useStore((s) => s.setVisualDeformationScale);
  const sensorLive = useStore((s) => s.sensorLive);
  const navigate = useStore((s) => s.navigate);

  const [activeTab, setActiveTab] = useState<'rig' | 'correlation' | 'baseline_b'>('rig');
  const [testFrequencyHz, setTestFrequencyHz] = useState<number>(4.5);
  const [testAmplitudeMm, setTestAmplitudeMm] = useState<number>(18.0);
  const [testRunning, setTestRunning] = useState<boolean>(true);
  const [simTime, setSimTime] = useState<number>(0);

  useEffect(() => {
    if (!testRunning) return;
    const interval = setInterval(() => {
      setSimTime((t) => t + 0.05);
    }, 50);
    return () => clearInterval(interval);
  }, [testRunning]);

  const rig = TEST_RIGS[activeTestRig];

  // Dynamic simulated actuator values based on frequency & time
  const actFL = Math.sin(simTime * testFrequencyHz * 2 * Math.PI) * testAmplitudeMm;
  const actFR = Math.sin(simTime * testFrequencyHz * 2 * Math.PI + 0.4) * testAmplitudeMm;
  const actRL = Math.sin(simTime * testFrequencyHz * 2 * Math.PI + Math.PI * 0.8) * testAmplitudeMm;
  const actRR = Math.sin(simTime * testFrequencyHz * 2 * Math.PI + Math.PI * 0.8 + 0.4) * testAmplitudeMm;

  const currentTorqueNm = activeTestRig === 'torsion' ? 3000 : 0;
  const currentAngleDeg = activeTestRig === 'torsion' ? 0.141 : 0;
  const currentKnmPerDeg = activeTestRig === 'torsion' ? 21.2 : 0;

  return (
    <div className="controlled-val-layout" style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
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
              background: 'linear-gradient(135deg, #4338ca, #312e81)',
              border: '1px solid #6366f1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#a5b4fc',
              fontWeight: 800,
              fontSize: 14,
            }}
          >
            03
          </div>
          <div>
            <div className="row" style={{ gap: 8 }}>
              <span style={{ fontWeight: 700, fontSize: 14, letterSpacing: '0.04em', color: '#f8fafc' }}>
                CONTROLLED STRUCTURAL VALIDATION & TEST RIGS
              </span>
              <span className="prov prov-verified">LABORATORY RIG DATA</span>
              <span className="prov prov-sim">SYNCHRONIZED STRIP CHART</span>
            </div>
            <div className="tiny faint" style={{ marginTop: 2 }}>
              Multi-Axis Servo-Hydraulic Actuation · Dynamic Modal NVH · CAE Physical Correlation
            </div>
          </div>
        </div>

        {/* Test Rig Selectors */}
        <div className="row wrap" style={{ gap: 6 }}>
          {(['four_post', 'torsion', 'bending', 'modal', 'battery_mount'] as TestRigType[]).map((r) => {
            const active = activeTestRig === r;
            const label = r === 'four_post' ? '4-Post Rig' : r === 'torsion' ? 'Torsional Rig' : r === 'bending' ? 'Bending Rig' : r === 'modal' ? 'Modal NVH' : 'Battery Mount Rig';
            return (
              <button
                key={r}
                className={`btn ${active ? 'active' : ''}`}
                onClick={() => setActiveTestRig(r)}
                style={{
                  background: active ? '#4f46e5' : undefined,
                  borderColor: active ? '#6366f1' : undefined,
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

      {/* Floating Left Panel — Rig Controls & Correlation */}
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
            border: '1px solid rgba(99, 102, 241, 0.25)',
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
                background: activeTab === 'rig' ? '#4f46e5' : 'transparent',
                color: activeTab === 'rig' ? '#fff' : 'var(--muted)',
                cursor: 'pointer',
              }}
              onClick={() => setActiveTab('rig')}
            >
              Test Rig Control
            </button>
            <button
              style={{
                flex: 1,
                padding: '6px 4px',
                fontSize: 11,
                fontWeight: 600,
                borderRadius: 4,
                border: 'none',
                background: activeTab === 'correlation' ? '#4f46e5' : 'transparent',
                color: activeTab === 'correlation' ? '#fff' : 'var(--muted)',
                cursor: 'pointer',
              }}
              onClick={() => setActiveTab('correlation')}
            >
              CAE ↔ Physical
            </button>
            <button
              style={{
                flex: 1,
                padding: '6px 4px',
                fontSize: 11,
                fontWeight: 600,
                borderRadius: 4,
                border: 'none',
                background: activeTab === 'baseline_b' ? '#4f46e5' : 'transparent',
                color: activeTab === 'baseline_b' ? '#fff' : 'var(--muted)',
                cursor: 'pointer',
              }}
              onClick={() => setActiveTab('baseline_b')}
            >
              Baseline B Freeze
            </button>
          </div>

          {/* TAB 1: RIG CONTROLS & CHANNELS */}
          {activeTab === 'rig' && (
            <div className="col" style={{ flex: 1, overflowY: 'auto', gap: 10 }}>
              <div className="panel" style={{ padding: 10, background: 'rgba(0,0,0,0.3)', border: '1px solid var(--line)' }}>
                <div className="spread">
                  <span style={{ fontWeight: 700, fontSize: 13, color: '#a5b4fc' }}>{rig.name}</span>
                  <span className="prov prov-verified">{rig.caeCorrelationScorePct}% CAE Fit</span>
                </div>
                <div className="tiny faint" style={{ marginTop: 2 }}>Facility: {rig.facility}</div>
                <div className="tiny faint" style={{ marginTop: 4, lineHeight: 1.3 }}>{rig.description}</div>
              </div>

              {/* Dynamic Actuator Channels */}
              {activeTestRig === 'four_post' && (
                <div className="col" style={{ gap: 6 }}>
                  <div className="tiny faint" style={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    4-Corner Hydraulic Actuator Channels
                  </div>
                  <div className="grid2" style={{ gap: 6 }}>
                    <div className="stat" style={{ padding: '6px 8px' }}>
                      <span className="tiny faint">Actuator FL (Front-Left)</span>
                      <span className="mono" style={{ fontSize: 14, fontWeight: 700, color: actFL >= 0 ? '#38bdf8' : '#f59e0b' }}>
                        {actFL >= 0 ? `+${actFL.toFixed(1)}` : actFL.toFixed(1)} mm
                      </span>
                    </div>
                    <div className="stat" style={{ padding: '6px 8px' }}>
                      <span className="tiny faint">Actuator FR (Front-Right)</span>
                      <span className="mono" style={{ fontSize: 14, fontWeight: 700, color: actFR >= 0 ? '#38bdf8' : '#f59e0b' }}>
                        {actFR >= 0 ? `+${actFR.toFixed(1)}` : actFR.toFixed(1)} mm
                      </span>
                    </div>
                    <div className="stat" style={{ padding: '6px 8px' }}>
                      <span className="tiny faint">Actuator RL (Rear-Left)</span>
                      <span className="mono" style={{ fontSize: 14, fontWeight: 700, color: actRL >= 0 ? '#38bdf8' : '#f59e0b' }}>
                        {actRL >= 0 ? `+${actRL.toFixed(1)}` : actRL.toFixed(1)} mm
                      </span>
                    </div>
                    <div className="stat" style={{ padding: '6px 8px' }}>
                      <span className="tiny faint">Actuator RR (Rear-Right)</span>
                      <span className="mono" style={{ fontSize: 14, fontWeight: 700, color: actRR >= 0 ? '#38bdf8' : '#f59e0b' }}>
                        {actRR >= 0 ? `+${actRR.toFixed(1)}` : actRR.toFixed(1)} mm
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Torsion Specific Results */}
              {activeTestRig === 'torsion' && (
                <div className="col" style={{ gap: 6 }}>
                  <div className="tiny faint" style={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Torsional Rigidity Metrics
                  </div>
                  <div className="grid2" style={{ gap: 6 }}>
                    <Stat label="Applied Couple" value={`${currentTorqueNm} Nm`} sub="±1500 Nm spindles" accent="var(--cyan)" />
                    <Stat label="Torsional Angle θ" value={`${currentAngleDeg}°`} sub="laser gauge" />
                    <Stat label="Measured Rigidity" value={`${currentKnmPerDeg} kNm/°`} sub="K = T / θ" accent="var(--green)" />
                    <Stat label="CAE Prediction" value="21.5 kNm/°" sub="Residual -1.4%" />
                  </div>
                </div>
              )}

              {/* Test Input Parameters */}
              <div className="col" style={{ gap: 6 }}>
                <div className="spread">
                  <span className="tiny faint">Excitation Frequency: {testFrequencyHz.toFixed(1)} Hz</span>
                  <span className="tiny faint">Amplitude: ±{testAmplitudeMm.toFixed(0)} mm</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="20"
                  step="0.5"
                  value={testFrequencyHz}
                  onChange={(e) => setTestFrequencyHz(parseFloat(e.target.value))}
                />
                <div className="row" style={{ gap: 8, marginTop: 4 }}>
                  <button
                    className={`btn ${testRunning ? 'active' : ''}`}
                    onClick={() => setTestRunning(!testRunning)}
                    style={{ flex: 1 }}
                  >
                    {testRunning ? '⏸ Pause Test Rig' : '▶ Run Test Rig'}
                  </button>
                  <button
                    className={`btn ${visualDeformationScale > 1 ? 'active' : ''}`}
                    onClick={() => setVisualDeformationScale(visualDeformationScale > 1 ? 1 : 25)}
                    title="Exaggerate 3D mesh deformation by 25x"
                    style={{ flex: 1, borderColor: visualDeformationScale > 1 ? 'var(--amber)' : undefined }}
                  >
                    Visual Def ×{visualDeformationScale}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CAE ↔ PHYSICAL CORRELATION */}
          {activeTab === 'correlation' && (
            <div className="col" style={{ flex: 1, overflowY: 'auto', gap: 10 }}>
              <div className="spread">
                <span className="small" style={{ fontWeight: 700, color: '#a5b4fc' }}>CAE ↔ Physical Correlation</span>
                <span className="prov prov-verified">R² = 0.984</span>
              </div>
              <div className="tiny faint">Direct Comparison of Precomputed CAE vs Rig Sensor Signals</div>

              <div className="col" style={{ gap: 6 }}>
                {[
                  { channel: 'Front Rail Strain SG1 (S01)', cae: '448 με', measured: '452 με', residual: '+0.89%', match: 'PASS' },
                  { channel: 'Front Rail Strain SG2 (S02)', cae: '450 με', measured: '455 με', residual: '+1.11%', match: 'PASS' },
                  { channel: 'Battery Mount FL (S03)', cae: '215 με', measured: '218 με', residual: '+1.39%', match: 'PASS' },
                  { channel: 'Battery Mount FR (S04)', cae: '218 με', measured: '221 με', residual: '+1.37%', match: 'PASS' },
                  { channel: '1st Torsional Mode Freq', cae: '28.1 Hz', measured: '28.4 Hz', residual: '+1.06%', match: 'PASS' },
                  { channel: '1st Bending Mode Freq', cae: '35.8 Hz', measured: '36.2 Hz', residual: '+1.11%', match: 'PASS' },
                  { channel: 'Torsional Rigidity K', cae: '21.5 kNm/°', measured: '21.2 kNm/°', residual: '-1.39%', match: 'PASS' },
                ].map((item, i) => (
                  <div key={i} className="panel" style={{ padding: 6, background: 'rgba(0,0,0,0.25)', border: '1px solid var(--line)' }}>
                    <div className="spread">
                      <span className="tiny" style={{ fontWeight: 600 }}>{item.channel}</span>
                      <span className="chip tiny" style={{ color: 'var(--green)' }}>✓ {item.match}</span>
                    </div>
                    <div className="spread" style={{ marginTop: 3, fontSize: 11 }}>
                      <span className="mono faint">CAE: {item.cae}</span>
                      <span className="mono" style={{ color: '#38bdf8' }}>Measured: {item.measured}</span>
                      <span className="mono faint">Δ: {item.residual}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="panel" style={{ padding: 8, background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)' }}>
                <div className="tiny" style={{ fontWeight: 600, color: '#a5b4fc' }}>Validation Coverage: 98.4%</div>
                <div className="tiny faint" style={{ marginTop: 2 }}>
                  Physical validation evidence correlates with CAE nominal predictions within acceptable automotive engineering thresholds (&lt;3.0% residual).
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: BASELINE B FREEZE */}
          {activeTab === 'baseline_b' && (
            <div className="col" style={{ flex: 1, overflowY: 'auto', gap: 10 }}>
              <div className="spread">
                <span className="small" style={{ fontWeight: 700, color: '#a5b4fc' }}>Baseline B Commissioning Freeze</span>
                <span className="prov prov-verified">FROZEN</span>
              </div>
              <div className="tiny faint">Vehicle-Specific Healthy Structural Fingerprint</div>

              <div className="col" style={{ gap: 6 }}>
                <div className="panel" style={{ padding: 8, background: 'rgba(0,0,0,0.25)' }}>
                  <span className="tiny faint">Commissioning Summary:</span>
                  <div className="grid2" style={{ marginTop: 6, gap: 4 }}>
                    <Stat label="Baseline Timestamp" value="2026-05-15" sub="14:30:00 IST" />
                    <Stat label="Test Facility" value="Lab Rig 4" sub="Tata Pune NVH" />
                    <Stat label="Sensors Calibrated" value="11 / 11" sub="100% Verified" accent="var(--green)" />
                    <Stat label="Baseline Status" value="LOCKED" sub="Immutable Key" accent="var(--cyan)" />
                  </div>
                </div>

                <div className="panel" style={{ padding: 8, background: 'rgba(0,0,0,0.25)' }}>
                  <span className="tiny faint">Fingerprint Reference Channels:</span>
                  <div className="col" style={{ marginTop: 4, gap: 4 }}>
                    {SENSORS.slice(0, 6).map((s) => (
                      <div key={s.id} className="spread tiny mono">
                        <span className="faint">{s.id} ({s.name})</span>
                        <span style={{ color: 'var(--cyan)' }}>{s.baseline} {s.unit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

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
          <span className="tiny faint">Baseline B Status:</span>
          <span className="chip" style={{ color: 'var(--green)' }}>✓ BASELINE B (STRUCTURAL COMMISSIONING) FROZEN</span>
        </div>
        <button
          className="btn"
          onClick={() => navigate('road_corr')}
          style={{ background: '#4f46e5', color: '#fff', fontWeight: 600, border: 'none' }}
        >
          Proceed to 04 Road Correlation →
        </button>
      </div>
    </div>
  );
}
