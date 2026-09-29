import { useStore } from '../store/useStore';
import { Timeline } from '../ui/Timeline';
import { EVENTS, TIMELINE_PHASES, phaseAt } from '../data/scenarios';
import { SENSOR_BY_ID } from '../data/sensors';
import { Card, StatusChip, ProvTag, pct } from '../ui/kit';
import { PageHeader } from '../ui/PageHeader';

export function EventForensics() {
  const tlTime = useStore((s) => s.tlTime);
  const sensorLive = useStore((s) => s.sensorLive);
  const navigate = useStore((s) => s.navigate);

  const ph = phaseAt(tlTime);

  return (
    <div className="col" style={{ width: '100%', minHeight: '100%', fontFamily: 'var(--font-sans)' }}>
      <PageHeader
        title="Event Forensics Replay"
        description="High-resolution synchronous event timeline capture, phase playback, and structural response correlation."
      >
        <span className="chip"><span className="dot dot-watch" /> phase: <b style={{ color: 'var(--cyan)' }}>{ph}</b> · t = {tlTime.toFixed(1)}s</span>
      </PageHeader>
      <div className="col stack splash-fade" style={{ padding: 24 }}>

      <Timeline />

      <div className="grid2">
        {/* ---- active event reading ---- */}
        <Card title="Live response in current window">
          <div className="col" style={{ gap: 8 }}>
            {EVENTS.filter((e) => e.time <= tlTime).slice(-1).map((e) => (
              <div key={e.id}>
                <div className="spread">
                  <span className="mono small" style={{ color: 'var(--cyan)' }}>{e.id} · {e.label}</span>
                  <StatusChip state={e.severity} />
                </div>
                <div className="tiny muted" style={{ marginTop: 3 }}>{e.description}</div>
                {e.contributors.length > 0 && (
                  <div className="tiny faint" style={{ marginTop: 4 }}>contributors: {e.contributors.join(' — ')}</div>
                )}
              </div>
            ))}
            <hr className="rule" />
            <div className="tiny muted" style={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>Sensor deltas this window</div>
            {(() => {
              const ev = [...EVENTS].reverse().find((e) => e.time <= tlTime);
              if (!ev) return <div className="tiny faint">No event has started yet — baseline window.</div>;
              return (
                <div className="col" style={{ gap: 3 }}>
                  {ev.sensors.map((sid) => {
                    const delta = ev.delta[sid];
                    const live = sensorLive[sid];
                    return (
                      <div key={sid} className="row" style={{ gap: 8 }}>
                        <span className="mono small" style={{ color: 'var(--cyan)', width: 60 }}>{sid}</span>
                        <div className="spacer" />
                        <span className="tiny faint">delta {delta !== undefined ? `×${delta.toFixed(2)}` : '—'}</span>
                        {live ? (
                          <>
                            <span className="mono tiny">{live.packet.value.toFixed(live.sensor.signal === 'temperature' ? 1 : 0)} {live.sensor.unit}</span>
                            <StatusChip state={live.analytics.state} />
                          </>
                        ) : <span className="tiny faint">no data</span>}
                      </div>
                    );
                  })}
                </div>
              );
            })()}
            <div className="panel" style={{ padding: 8, background: 'var(--bg2)' }}>
              <div className="tiny faint">
                The mock generator applies the event delta to the baseline fingerprint for the phase window — readings here are SIMULATED, not replayed recordings.
              </div>
            </div>
          </div>
        </Card>

        {/* ---- event list ---- */}
        <Card title="Timeline events">
          <div className="col" style={{ gap: 6 }}>
            {EVENTS.map((e) => {
              const phase = TIMELINE_PHASES.find((p) => p.key === e.phase);
              const active = tlTime >= e.time;
              return (
                <div key={e.id} className="panel" style={{
                  padding: '8px 10px',
                  opacity: active ? 1 : 0.72,
                  borderLeft: `3px solid ${e.severity === 'INSPECTION_REQUIRED' ? 'var(--red)' : e.severity === 'WATCH' ? 'var(--amber)' : 'var(--green)'}`,
                }}>
                  <div className="spread">
                    <span className="mono small" style={{ color: 'var(--cyan)' }}>{e.id}</span>
                    <span className="row" style={{ gap: 6 }}>
                      <StatusChip state={e.severity} />
                      <span className="tag">t={e.time}s</span>
                    </span>
                  </div>
                  <div className="small" style={{ marginTop: 3 }}>{e.label}</div>
                  <div className="tiny faint" style={{ marginTop: 2 }}>
                    {phase?.label} · sensors: {e.sensors.join(', ')}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <Card title="Strain residual response per event (recommended reading)">
        <div style={{ overflow: 'auto' }}>
          <table className="tbl">
            <thead>
              <tr><th>Event</th><th>sensors</th><th>residual vs baseline (live)</th><th>pattern</th></tr>
            </thead>
            <tbody>
              {EVENTS.map((e) => (
                <tr key={e.id}>
                  <td>
                    <div className="small">{e.label}</div>
                    <div className="tiny faint mono">{e.id} · {e.phase}</div>
                  </td>
                  <td>
                    <div className="row" style={{ gap: 4, flexWrap: 'wrap' }}>
                      {e.sensors.map((sid) => {
                        const live = sensorLive[sid];
                        return (
                          <span key={sid} className="tag" title={SENSOR_BY_ID[sid]?.name}>
                            {sid}
                            {live ? ` ${pct(live.analytics.residualPercent, 0)}` : ''}
                          </span>
                        );
                      })}
                    </div>
                  </td>
                  <td className="small">
                    {e.delta && Object.keys(e.delta).length
                      ? Object.entries(e.delta).map(([sid, d]) => `${sid} ×${d.toFixed(2)}`).join(' · ')
                      : 'reference window'}
                  </td>
                  <td className="tiny faint">
                    {e.severity === 'INSPECTION_REQUIRED'
                      ? 'Persistent deviation → schedule inspection'
                      : e.severity === 'WATCH'
                        ? 'Transient deviation, monitor persistence'
                        : 'At baseline'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="row wrap" style={{ marginTop: 10 }}>
          <button className="btn" onClick={() => navigate('intelligence')}>Region states for these events</button>
          <button className="btn" onClick={() => navigate('diagnostics')}>AI diagnostics</button>
          <ProvTag p="SIMULATED" />
        </div>
      </Card>
    </div>
    </div>
  );
}