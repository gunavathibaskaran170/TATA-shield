import { useEffect } from 'react';
import { useStore } from '../store/useStore';
import { EVENTS, TIMELINE_DURATION, TIMELINE_PHASES } from '../data/scenarios';
import { StatusChip } from './kit';

export function Timeline() {
  const tlTime = useStore((s) => s.tlTime);
  const playing = useStore((s) => s.playing);
  const setTlTime = useStore((s) => s.setTlTime);
  const setPlaying = useStore((s) => s.setPlaying);
  const activeEvent = useStore((s) => s.activeEvent);
  const phase = useStore((s) => s.phase);

  const ev = activeEvent();
  const ph = phase();

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      const st = useStore.getState();
      if (st.tlTime >= TIMELINE_DURATION) { st.setPlaying(false); return; }
      st.setTlTime(st.tlTime + 0.1);
    }, 100);
    return () => clearInterval(id);
  }, [playing]);

  return (
    <div className="panel" style={{ padding: '8px 10px' }}>
      <div className="spread" style={{ marginBottom: 6 }}>
        <div className="row" style={{ gap: 6 }}>
          <button
            className={playing ? 'btn accent' : 'btn'}
            onClick={() => setPlaying(!playing)}
            title="Replay drive timeline (drives telemetry scenario)"
          >
            {playing ? '❚❚ Pause' : '▶ Replay'}
          </button>
          <button className="btn" onClick={() => setTlTime(0)}>⏮</button>
          <button className="btn" onClick={() => setTlTime(TIMELINE_DURATION)}>⏭</button>
          <span className="mono small" style={{ width: 52 }}>{tlTime.toFixed(1)}s / {TIMELINE_DURATION}s</span>
        </div>
        <div className="row" style={{ gap: 6 }}>
          <span className="tiny muted">Phase</span>
          <span className="tag" style={{ color: 'var(--cyan)' }}>{ph}</span>
          {ev && <StatusChip state={ev.severity} />}
        </div>
      </div>

      <div style={{ position: 'relative', height: 26, margin: '4px 0 2px' }}>
        {/* track */}
        <div className="row" style={{ position: 'absolute', left: 60, right: 8, top: 9, height: 4, background: 'var(--line2)', borderRadius: 2 }}>
          <div
            style={{
              height: '100%', borderRadius: 2, background: 'linear-gradient(90deg, var(--cyan), var(--blue))',
              width: `${(tlTime / TIMELINE_DURATION) * 100}%`,
            }}
          />
        </div>
        {/* phase markers */}
        {TIMELINE_PHASES.map((p) => (
          <div key={p.key} style={{ position: 'absolute', left: `calc(60px + (100% - 76px) * ${(p.at / TIMELINE_DURATION)})`, top: 3, transform: 'translateX(-50%)' }}>
            <div className="tiny faint" style={{ whiteSpace: 'nowrap' }}>{p.label}</div>
            <div style={{ width: 2, height: 14, background: 'var(--line2)', margin: '0 auto' }} />
          </div>
        ))}
        {/* event ticks */}
        {EVENTS.map((e) => (
          <button
            key={e.id}
            onClick={() => setTlTime(e.time)}
            title={e.label}
            style={{
              position: 'absolute',
              left: `calc(60px + (100% - 76px) * ${(e.time / TIMELINE_DURATION)})`,
              top: 6,
              transform: 'translateX(-50%)',
              width: 10, height: 10, borderRadius: '50%', border: '2px solid var(--bg)',
              background: e.severity === 'INSPECTION_REQUIRED' ? 'var(--red)' : e.severity === 'WATCH' ? 'var(--amber)' : 'var(--green)',
              cursor: 'pointer', padding: 0,
            }}
          />
        ))}
      </div>

      <input
        type="range"
        min={0}
        max={TIMELINE_DURATION}
        step={0.1}
        value={tlTime}
        onChange={(e) => setTlTime(parseFloat(e.target.value))}
        style={{ width: '100%', height: 14 }}
      />

      {ev && (
        <div className="row" style={{ marginTop: 6, gap: 8, flexWrap: 'wrap' }}>
          <span className="tag" style={{ color: 'var(--cyan)' }}>{ev.id}</span>
          <span className="small">{ev.label}</span>
          <span className="tiny muted grow" style={{ minWidth: 200 }}>{ev.description}</span>
          {ev.contributors.length > 0 && (
            <span className="tiny faint">contributors: {ev.contributors.join(', ')}</span>
          )}
        </div>
      )}
    </div>
  );
}