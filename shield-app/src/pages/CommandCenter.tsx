/* ============================================================
   SHIELD — COMMAND CENTER (SUPPORT MODULE)
   Central Overview & Home Page for ONE selected vehicle.
   Answers: "What is the current structural condition of this vehicle?"
   ============================================================ */

import { useStore } from '../store/useStore';
import { SENSORS } from '../data/sensors';
import { EVENTS } from '../data/scenarios';
import { PageHeader } from '../ui/PageHeader';
import { StatusBadge } from '../ui/StatusBadge';

export function CommandCenter() {
  const navigate = useStore((s) => s.navigate);
  const vehicleId = useStore((s) => s.vehicleId);
  const scenario = useStore((s) => s.scenario);
  const sensorLive = useStore((s) => s.sensorLive);
  const page = useStore((s) => s.page);

  const sensorStates = Object.values(sensorLive).map((l) => l.analytics.state);
  const watchCount = sensorStates.filter((st) => st === 'WATCH').length;
  const inspectCount = sensorStates.filter((st) => st === 'INSPECTION_REQUIRED').length;
  const overallCondition = inspectCount ? 'INSPECTION_REQUIRED' : watchCount ? 'WATCH' : 'NORMAL';

  const liveSensorsCount = Object.keys(sensorLive).length;
  const totalSensors = SENSORS.length;
  const latestEvent = EVENTS[EVENTS.length - 2] ?? EVENTS[0];

  return (
    <div
      className="command-center-layout"
      style={{
        width: '100%',
        height: '100%',
        overflowY: 'auto',
        background: '#0B0F17',
        color: '#F8FAFC',
        fontFamily: 'var(--font-sans)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <PageHeader
        title="Command Center"
        description='"What is the current structural condition of this vehicle?"'
        badge={vehicleId}
        badgeType="default"
      >
        <StatusBadge status={overallCondition} />
      </PageHeader>

      <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* OVERALL STRUCTURAL CONDITION CARD */}
      <div
        style={{
          background: overallCondition === 'NORMAL' ? 'linear-gradient(135deg, rgba(52,211,153,0.12), #0B0F17)' : overallCondition === 'WATCH' ? 'linear-gradient(135deg, rgba(251,191,36,0.12), #0B0F17)' : 'linear-gradient(135deg, rgba(248,113,113,0.12), #0B0F17)',
          border: `1px solid ${overallCondition === 'NORMAL' ? '#34D399' : overallCondition === 'WATCH' ? '#FBBF24' : '#F87171'}`,
          borderRadius: 8,
          padding: 16,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <div style={{ fontSize: 9, color: '#52677D', textTransform: 'uppercase', letterSpacing: '0.4px', fontWeight: 600 }}>
            OVERALL STRUCTURAL CONDITION
          </div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 600,
              color: overallCondition === 'NORMAL' ? '#34D399' : overallCondition === 'WATCH' ? '#FBBF24' : '#F87171',
              marginTop: 3,
            }}
          >
            ● {overallCondition}
          </div>
          <div style={{ fontSize: 10, color: '#71849A', marginTop: 3, fontFamily: 'var(--font-sans)', lineHeight: 1.4 }}>
            {overallCondition === 'NORMAL'
              ? 'All structural regions operating within normal stress & strain baseline envelopes.'
              : overallCondition === 'WATCH'
              ? 'Transient structural deviation detected. Continuous monitoring active.'
              : 'Action threshold exceeded. Inspection or engineering review required.'}
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 9, color: '#52677D', fontWeight: 600, letterSpacing: '0.4px', textTransform: 'uppercase' }}>ACTIVE SCENARIO</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#22D3EE', textTransform: 'capitalize', marginTop: 2 }}>
            {scenario.replace('_', ' ')}
          </div>
        </div>
      </div>

      {/* 4 SUMMARY STAT CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        <div style={{ background: '#111A24', border: '1px solid #1E293B', padding: 14, borderRadius: 8 }}>
          <div style={{ fontSize: 10, color: '#94A3B8' }}>CONNECTED SENSORS</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#38BDF8', marginTop: 4 }}>
            {liveSensorsCount} / {totalSensors}
          </div>
          <div style={{ fontSize: 10, color: '#16A36A', marginTop: 2 }}>Sampling @ 500 Hz</div>
        </div>

        <div style={{ background: '#111A24', border: '1px solid #1E293B', padding: 14, borderRadius: 8 }}>
          <div style={{ fontSize: 10, color: '#94A3B8' }}>CURRENT LIFECYCLE STAGE</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#F8FAFC', marginTop: 6 }}>
            01 DESIGN & CAE
          </div>
          <div style={{ fontSize: 10, color: '#38BDF8', marginTop: 2 }}>Stage 1 Active</div>
        </div>

        <div style={{ background: '#111A24', border: '1px solid #1E293B', padding: 14, borderRadius: 8 }}>
          <div style={{ fontSize: 10, color: '#94A3B8' }}>LATEST STRUCTURAL EVENT</div>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#FCD34D', marginTop: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {latestEvent.label}
          </div>
          <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 2 }}>t = {latestEvent.time}s ({latestEvent.severity})</div>
        </div>

        <div style={{ background: '#111A24', border: '1px solid #1E293B', padding: 14, borderRadius: 8 }}>
          <div style={{ fontSize: 10, color: '#94A3B8' }}>CURRENT BASELINE STATUS</div>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#16A36A', marginTop: 6 }}>
            VERIFIED ISO BASELINE
          </div>
          <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 2 }}>Commissioning Fingerprint B</div>
        </div>
      </div>

      {/* QUICK NAVIGATION SECTION */}
      <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: '#94A3B8', letterSpacing: '0.05em' }}>
          PRIMARY WORKFLOW QUICK NAVIGATION
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
          <button
            onClick={() => navigate('digital_eng')}
            style={{
              background: '#111A24',
              border: '1px solid #00A6D6',
              borderRadius: 8,
              padding: 14,
              textAlign: 'left',
              cursor: 'pointer',
              color: '#F8FAFC',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
          >
            <span style={{ fontSize: 10, color: '#00A6D6', fontWeight: 800 }}>STAGE 01</span>
            <span style={{ fontSize: 13, fontWeight: 800 }}>OPEN DESIGN</span>
            <span style={{ fontSize: 10, color: '#94A3B8', fontFamily: 'var(--sans)' }}>CAE & Structural CAD</span>
          </button>

          <button
            onClick={() => navigate('mfg_quality')}
            style={{
              background: '#111A24',
              border: '1px solid #00A6D6',
              borderRadius: 8,
              padding: 14,
              textAlign: 'left',
              cursor: 'pointer',
              color: '#F8FAFC',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
          >
            <span style={{ fontSize: 10, color: '#00A6D6', fontWeight: 800 }}>STAGE 02</span>
            <span style={{ fontSize: 13, fontWeight: 800 }}>OPEN BUILD</span>
            <span style={{ fontSize: 10, color: '#94A3B8', fontFamily: 'var(--sans)' }}>Manufacturing Quality</span>
          </button>

          <button
            onClick={() => navigate('controlled_val')}
            style={{
              background: '#111A24',
              border: '1px solid #00A6D6',
              borderRadius: 8,
              padding: 14,
              textAlign: 'left',
              cursor: 'pointer',
              color: '#F8FAFC',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
          >
            <span style={{ fontSize: 10, color: '#00A6D6', fontWeight: 800 }}>STAGE 03</span>
            <span style={{ fontSize: 13, fontWeight: 800 }}>OPEN VALIDATION</span>
            <span style={{ fontSize: 10, color: '#94A3B8', fontFamily: 'var(--sans)' }}>Test Rig & Correlation</span>
          </button>

          <button
            onClick={() => navigate('live_twin')}
            style={{
              background: '#111A24',
              border: '1px solid #00A6D6',
              borderRadius: 8,
              padding: 14,
              textAlign: 'left',
              cursor: 'pointer',
              color: '#F8FAFC',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
          >
            <span style={{ fontSize: 10, color: '#00A6D6', fontWeight: 800 }}>STAGE 04</span>
            <span style={{ fontSize: 13, fontWeight: 800 }}>OPEN LIVE MONITOR</span>
            <span style={{ fontSize: 10, color: '#94A3B8', fontFamily: 'var(--sans)' }}>Digital Twin Field Telemetry</span>
          </button>

          <button
            onClick={() => navigate('workbench')}
            style={{
              background: '#111A24',
              border: '1px solid #F4A62A',
              borderRadius: 8,
              padding: 14,
              textAlign: 'left',
              cursor: 'pointer',
              color: '#F8FAFC',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
          >
            <span style={{ fontSize: 10, color: '#F4A62A', fontWeight: 800 }}>SUPPORT LAB</span>
            <span style={{ fontSize: 13, fontWeight: 800 }}>OPEN MANUAL TEST LAB</span>
            <span style={{ fontSize: 10, color: '#94A3B8', fontFamily: 'var(--sans)' }}>Interactive Load Workbench</span>
          </button>
        </div>
      </div>
    </div>
    </div>
  );
}