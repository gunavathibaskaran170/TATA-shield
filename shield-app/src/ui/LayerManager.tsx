import { LAYERS } from '../data/layers';
import { useStore } from '../store/useStore';

export function LayerManager() {
  const layerVisible = useStore((s) => s.layerVisible);
  const layerOpacity = useStore((s) => s.layerOpacity);
  const setLayerVisible = useStore((s) => s.setLayerVisible);
  const setLayerOpacity = useStore((s) => s.setLayerOpacity);
  const showAll = useStore((s) => s.showAll);
  const toggleXray = useStore((s) => s.toggleXray);
  const xray = useStore((s) => s.xray);

  return (
    <div className="col" style={{ gap: 1 }}>
      <div className="spread" style={{ marginBottom: 4 }}>
        <span className="tiny faint mono">Layer stack · 0–21</span>
        <div className="row" style={{ gap: 4 }}>
          <button className="btn" style={{ fontSize: 10.5, padding: '1px 6px' }} onClick={showAll}>Show all</button>
          <button className={'btn' + (xray ? ' active' : '')} style={{ fontSize: 10.5, padding: '1px 6px' }} onClick={toggleXray}>X-ray</button>
        </div>
      </div>
      {LAYERS.map((l) => {
        const vis = layerVisible[l.index] ?? true;
        const op = layerOpacity[l.index] ?? 1;
        return (
          <div key={l.index} className="row" style={{ gap: 6, padding: '2px 0' }}>
            <span className="tag" style={{ width: 22, textAlign: 'center' }}>{l.index}</span>
            <input
              type="checkbox"
              checked={vis}
              onChange={(e) => setLayerVisible(l.index, e.target.checked)}
              style={{ accentColor: 'var(--cyan)', width: 13, height: 13, flex: 'none', cursor: 'pointer' }}
              title={l.hint}
            />
            <div className="grow" style={{ lineHeight: 1.2 }} title={l.hint}>
              <div className="small" style={{ color: vis ? 'var(--text)' : 'var(--faint)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {l.label}
              </div>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={op}
              onChange={(e) => setLayerOpacity(l.index, parseFloat(e.target.value))}
              style={{ width: 46, height: 12 }}
              disabled={!vis}
            />
          </div>
        );
      })}
    </div>
  );
}