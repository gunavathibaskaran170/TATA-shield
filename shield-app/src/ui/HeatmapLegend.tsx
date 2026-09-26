import { useStore } from '../store/useStore';

const MODES = [
  { value: 'off', label: 'Off' },
  { value: 'strain', label: 'Strain' },
  { value: 'stress', label: 'Stress' },
  { value: 'deformation', label: 'Deformation' },
  { value: 'anomaly', label: 'Anomaly' },
] as const;

export interface HeatControlProps {
  compact?: boolean;
}

export function HeatmapControls({ compact }: HeatControlProps) {
  const heatmapMode = useStore((s) => s.heatmapMode);
  const setHeatmapMode = useStore((s) => s.setHeatmapMode);
  return (
    <div className="row wrap" style={{ gap: 6 }}>
      <span className="tiny muted">Heatmap (model-estimated)</span>
      <div className="row" style={{ gap: 2, background: 'var(--bg2)', border: '1px solid var(--line2)', borderRadius: 5, padding: 2 }}>
        {MODES.map((m) => (
          <button
            key={m.value}
            className={heatmapMode === m.value ? 'btn active' : 'btn'}
            style={{ padding: '1px 7px', fontSize: 11, border: 'none', borderRadius: 3, background: heatmapMode === m.value ? '#123a40' : 'transparent' }}
            onClick={() => setHeatmapMode(m.value)}
          >
            {m.label}
          </button>
        ))}
      </div>
      {!compact && <HeatmapLegend />}
    </div>
  );
}

export function HeatmapLegend() {
  return (
    <div className="row" style={{ gap: 6 }}>
      <div
        style={{
          width: 110, height: 9, borderRadius: 3,
          background: 'linear-gradient(90deg, #4fe0a0, #f2b94e 50%, #ff6b5e)',
        }}
      />
      <span className="tiny faint">0</span>
      <span className="tiny faint">anomaly 1</span>
    </div>
  );
}