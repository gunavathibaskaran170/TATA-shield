/* ============================================================
   SHIELD — MODULE 06: ENGINEERING ANALYTICS & ROOT-CAUSE TRACE
   Evidence-focused structural analytics dashboard featuring:
   - Vehicle State & Digital Thread Synchronization
   - Structural Condition Map & Region States
   - Multi-Sensor Response Trend (Expected vs Measured vs Residual)
   - "WHAT CHANGED?" Diagnostic Evidence Inquiry
   - Complete 5-Stage ROOT-CAUSE TRACE Back to Design Release
   ============================================================ */

import { useState } from 'react';
import { useStore } from '../store/useStore';
import { SENSORS } from '../data/sensors';
import { EVENTS } from '../data/scenarios';
import { SAMPLE_ROOT_CAUSE_TRACE, type RootCauseTraceNode } from '../data/engineering';
import { Card, Stat, StatusChip, ProvTag } from '../ui/kit';

export function EngineeringAnalytics() {
  const sensorLive = useStore((s) => s.sensorLive);
  const regionStates = useStore((s) => s.regionStates);
  const vehicleId = useStore((s) => s.vehicleId);
  const navigate = useStore((s) => s.navigate);

  const [activeTab, setActiveTab] = useState<'root_cause' | 'what_changed' | 'trends' | 'evolution'>('root_cause');
  const [selectedTraceNode, setSelectedTraceNode] = useState<number>(0);

  const activeNode = SAMPLE_ROOT_CAUSE_TRACE[selectedTraceNode];

  return (
    <div className="col stack splash-fade" style={{ padding: 14, maxWidth: 1500 }}>
      {/* Top Header */}
      <div className="spread wrap">
        <div className="row" style={{ gap: 12 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 6,
              background: 'linear-gradient(135deg, #7c3aed, #5b21b6)',
              border: '1px solid #8b5cf6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 8px',
              color: '#c4b5fd',
              fontWeight: 800,
              fontSize: 14,
            }}
          >
            06
          </div>
          <div>
            <div className="row" style={{ gap: 8 }}>
              <h2 className="h3" style={{ margin: 0, fontSize: 16 }}>
                ENGINEERING ANALYTICS & ROOT-CAUSE TRACE
              </h2>
              <span className="prov prov-verified">EVIDENCE-BASED</span>
              <span className="prov prov-verified">CONTINUOUS THREAD</span>
            </div>
            <div className="tiny faint" style={{ marginTop: 2 }}>
              Trace Structural Anomalies Backwards through Operational History to Manufacturing & Design Release
            </div>
          </div>
        </div>

        <div className="row wrap" style={{ gap: 6 }}>
          {(['root_cause', 'what_changed', 'trends', 'evolution'] as const).map((tab) => {
            const active = activeTab === tab;
            const label = tab === 'root_cause' ? 'Root-Cause Trace' : tab === 'what_changed' ? 'What Changed?' : tab === 'trends' ? 'Response Trends' : 'Baseline Evolution';
            return (
              <button
                key={tab}
                className={`btn ${active ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
                style={{
                  background: active ? '#7c3aed' : undefined,
                  borderColor: active ? '#8b5cf6' : undefined,
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

      {/* Top KPI Banner */}
      <div className="grid4">
        <Stat label="Vehicle Identifier" value={<span className="mono">{vehicleId}</span>} sub="Batch 2026-B1" />
        <Stat label="Structural State" value="WATCH" sub="Rear Chassis Mount (S05)" accent="var(--amber)" />
        <Stat label="Twin Sync Confidence" value="98.7%" sub="11/11 Sensors Ingesting" accent="var(--green)" />
        <Stat label="Latest Dynamic Event" value="EVENT R-1042" sub="PG-04 Pothole Strike" accent="var(--cyan)" />
      </div>

      {/* TAB 1: HERO FEATURE — ROOT-CAUSE TRACE */}
      {activeTab === 'root_cause' && (
        <div className="col stack" style={{ gap: 12 }}>
          <Card
            title={
              <div className="spread">
                <span className="row" style={{ gap: 8 }}>
                  <span>HERO FEATURE — 5-Stage Root-Cause Lifecycle Trace</span>
                  <ProvTag p="VERIFIED" />
                </span>
                <span className="tiny faint">Click any stage to examine historical evidence</span>
              </div>
            }
          >
            {/* Horizontal Continuous Thread Pipeline */}
            <div
              style={{
                display: 'flex',
                gap: 8,
                padding: '12px 6px',
                overflowX: 'auto',
                borderBottom: '1px solid var(--line)',
              }}
            >
              {SAMPLE_ROOT_CAUSE_TRACE.map((node, i) => {
                const isSelected = selectedTraceNode === i;
                return (
                  <button
                    key={node.stage}
                    onClick={() => setSelectedTraceNode(i)}
                    style={{
                      flex: 1,
                      minWidth: 200,
                      textAlign: 'left',
                      padding: 10,
                      borderRadius: 6,
                      cursor: 'pointer',
                      background: isSelected ? 'linear-gradient(135deg, #4c1d95, #1e1b4b)' : 'var(--bg2)',
                      border: isSelected ? '1px solid #a78bfa' : '1px solid var(--line)',
                      color: isSelected ? '#ddd6fe' : 'var(--text)',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div className="spread">
                      <span className="tiny faint" style={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        {node.stageLabel.split('—')[0]}
                      </span>
                      <StatusChip state={node.state as any} />
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 12, marginTop: 4, color: isSelected ? '#fff' : 'var(--cyan)' }}>
                      {node.title}
                    </div>
                    <div className="tiny faint mono" style={{ marginTop: 2 }}>{node.timestamp}</div>
                  </button>
                );
              })}
            </div>

            {/* Selected Node Evidence Card */}
            <div className="panel" style={{ padding: 14, marginTop: 12, background: 'rgba(0,0,0,0.3)', border: '1px solid var(--line)' }}>
              <div className="spread wrap">
                <div>
                  <div className="small mono" style={{ color: '#a78bfa', fontWeight: 700 }}>
                    {activeNode.stageLabel} · RECORD ID: {activeNode.recordId}
                  </div>
                  <h3 style={{ margin: '4px 0 0 0', fontSize: 16 }}>{activeNode.title}</h3>
                </div>
                <div className="row" style={{ gap: 8 }}>
                  <span className="tiny faint">Timestamp: {activeNode.timestamp}</span>
                  <span className="prov prov-verified">{activeNode.verifiedSource}</span>
                </div>
              </div>

              <div className="grid2" style={{ marginTop: 12, gap: 10 }}>
                <div className="panel" style={{ padding: 10, background: 'rgba(255,255,255,0.02)' }}>
                  <span className="tiny faint" style={{ fontWeight: 600, textTransform: 'uppercase' }}>Physical & Engineering Evidence</span>
                  <div className="small" style={{ marginTop: 4, lineHeight: 1.4, color: 'var(--text)' }}>
                    {activeNode.evidence}
                  </div>
                </div>

                <div className="panel" style={{ padding: 10, background: 'rgba(255,255,255,0.02)' }}>
                  <span className="tiny faint" style={{ fontWeight: 600, textTransform: 'uppercase' }}>Key Quantitative Metrics</span>
                  <div className="mono small" style={{ marginTop: 4, fontWeight: 700, color: '#38bdf8' }}>
                    {activeNode.metric}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 2: WHAT CHANGED? DIAGNOSTIC INQUIRY */}
      {activeTab === 'what_changed' && (
        <Card title="Structural Diagnostic Inquiry: WHAT CHANGED?">
          <div className="grid2" style={{ gap: 10 }}>
            {[
              { q: 'WHAT CHANGED?', a: 'Rear-Left structural battery mounting bracket (Mount_BRL) and rail station SG2 show a persistent +57 με positive strain offset.', state: 'WATCH' },
              { q: 'WHEN DID IT OCCUR?', a: 'Triggered during Proving Ground Run #14 at T+08.2s during sharp 85 mm pothole impact on Sector PG-04.', state: 'VERIFIED' },
              { q: 'UNDER WHAT CONDITION?', a: '34 km/h vertical impact with +2.85g wheel acceleration at 31.4 °C ambient.', state: 'NORMAL' },
              { q: 'WAS IT PRESENT DURING MANUFACTURING?', a: 'NO. Factory CMM laser metrology datum B17 showed nominal offset of +0.42 mm (within ±0.80 mm tolerance). Nutrunner torque was verified at 94.2 Nm.', state: 'NORMAL' },
              { q: 'WAS IT PRESENT DURING EOL COMMISSIONING?', a: 'NO. Baseline B fingerprint recorded nominal reference strain of 205 με at 1.0g static load.', state: 'NORMAL' },
              { q: 'IS THE CHANGE TRANSIENT OR PERSISTENT?', a: 'PERSISTENT. Strain remains elevated across 8 subsequent driving cycles. Exponential moving average indicates permanent localized joint plastic settling.', state: 'WATCH' },
              { q: 'WHICH RELATED SENSORS AGREE?', a: 'S05 (Mount_BRL) and S06 (Mount_BRR) both exhibit correlated symmetric load redistribution. IMU03 confirms high-frequency rear impact.', state: 'VERIFIED' },
              { q: 'WHAT IS THE ACTIONABLE DISPOSITION?', a: 'Scheduled physical inspection of Mount_BRL fastener torque retention and shear isolator bushing at next 5,000 km depot service.', state: 'WATCH' },
            ].map((item, i) => (
              <div key={i} className="panel" style={{ padding: 10, background: 'rgba(0,0,0,0.25)', border: '1px solid var(--line)' }}>
                <div className="spread">
                  <span className="small" style={{ fontWeight: 700, color: '#a78bfa' }}>{item.q}</span>
                  <StatusChip state={item.state as any} />
                </div>
                <div className="tiny faint" style={{ marginTop: 4, lineHeight: 1.35 }}>{item.a}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* TAB 3: MULTI-CHANNEL RESPONSE TRENDS */}
      {activeTab === 'trends' && (
        <Card title="Multi-Channel Response Trends (Expected vs Measured vs Residual)">
          <div className="col" style={{ gap: 8 }}>
            {SENSORS.slice(0, 6).map((s) => {
              const live = sensorLive[s.id];
              const measured = live ? live.packet.value : s.baseline;
              const expected = s.baseline;
              const residual = live ? live.analytics.residual : 0;
              const state = live ? live.analytics.state : 'NORMAL';

              return (
                <div key={s.id} className="panel" style={{ padding: 8, background: 'rgba(0,0,0,0.25)' }}>
                  <div className="spread">
                    <span className="mono small" style={{ fontWeight: 700 }}>{s.id} — {s.name}</span>
                    <StatusChip state={state} />
                  </div>
                  <div className="grid3" style={{ marginTop: 4, fontSize: 11 }}>
                    <span className="mono faint">Expected Baseline: {expected} {s.unit}</span>
                    <span className="mono" style={{ color: '#38bdf8' }}>Measured Live: {measured.toFixed(1)} {s.unit}</span>
                    <span className="mono" style={{ color: state !== 'NORMAL' ? 'var(--amber)' : 'var(--green)' }}>
                      Residual: {residual >= 0 ? `+${residual.toFixed(1)}` : residual.toFixed(1)} {s.unit} ({((residual / expected) * 100).toFixed(1)}%)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* TAB 4: BASELINE EVOLUTION */}
      {activeTab === 'evolution' && (
        <Card title="Lifecycle Baseline Evolution (Design → Factory → Commissioning → Field)">
          <div className="col" style={{ gap: 8 }}>
            {[
              { stage: 'Stage 1 — CAD / CAE Prediction', val: '215 με', desc: 'Precomputed finite element simulation under 1.0g nominal payload' },
              { stage: 'Stage 2 — Factory As-Built Metrology', val: 'Datum B17 (+0.42 mm)', desc: 'Pre-assembly dimensional verification and bolt torque audit' },
              { stage: 'Stage 3 — EOL Structural Commissioning', val: '205 με (Frozen Baseline B)', desc: 'Controlled 4-post excitation fingerprint for this physical chassis' },
              { stage: 'Stage 4 — Proving Ground Dynamic Input', val: '742 με Peak Impact', desc: 'Pothole impact event on Sector PG-04 at 34 km/h' },
              { stage: 'Stage 5 — Current Field Telemetry', val: '262 με (+27.8% Residual)', desc: 'Persistent residual offset under normal cruising conditions' },
            ].map((stage, i) => (
              <div key={i} className="panel" style={{ padding: 10, background: 'rgba(0,0,0,0.25)' }}>
                <div className="spread">
                  <span className="small" style={{ fontWeight: 700, color: '#38bdf8' }}>{stage.stage}</span>
                  <span className="mono small" style={{ fontWeight: 700, color: 'var(--cyan)' }}>{stage.val}</span>
                </div>
                <div className="tiny faint" style={{ marginTop: 2 }}>{stage.desc}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Bottom Navigation */}
      <div className="spread" style={{ marginTop: 8 }}>
        <button className="btn" onClick={() => navigate('live_twin')}>← Back to Live Twin</button>
        <button className="btn" onClick={() => navigate('passport')} style={{ background: '#7c3aed', color: '#fff', fontWeight: 600, border: 'none' }}>
          Proceed to 07 Vehicle Digital Passport →
        </button>
      </div>
    </div>
  );
}
