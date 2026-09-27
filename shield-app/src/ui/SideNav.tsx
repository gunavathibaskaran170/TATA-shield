import { useStore } from '../store/useStore';
import type { PageKey } from '../schema/types';

const NAV: { key: PageKey; label: string; icon: string; group: string; badge?: string }[] = [
  { key: 'command', label: 'Command Center', icon: '◈', group: 'Overview' },
  { key: 'workbench', label: 'Engineering Workbench', icon: '🛠', group: 'Overview', badge: 'LAB' },
  { key: 'digital_eng', label: '01 Digital Engineering', icon: '📐', group: 'Engineering Lifecycle', badge: 'CAE' },
  { key: 'mfg_quality', label: '02 Manufacturing Quality', icon: '⚙', group: 'Engineering Lifecycle', badge: 'CMM' },
  { key: 'controlled_val', label: '03 Controlled Validation', icon: '🔬', group: 'Engineering Lifecycle', badge: 'RIG' },
  { key: 'road_corr', label: '04 Road Correlation', icon: '🛣', group: 'Engineering Lifecycle', badge: 'PG' },
  { key: 'live_twin', label: '05 Live Digital Twin', icon: '⛶', group: 'Engineering Lifecycle', badge: 'LIVE' },
  { key: 'eng_analytics', label: '06 Engineering Analytics', icon: '📊', group: 'Engineering Lifecycle', badge: 'TRACE' },
  { key: 'passport', label: '07 Digital Passport', icon: '▣', group: 'Engineering Lifecycle', badge: 'ISO' },
  { key: 'hardware', label: 'Hardware Live Diagnostic', icon: '⚡', group: 'Deep Diagnostics' },
  { key: 'forensics', label: 'Event Forensics', icon: '⟲', group: 'Deep Diagnostics' },
  { key: 'fleet', label: 'Fleet Analytics', icon: '▤', group: 'Deep Diagnostics' },
  { key: 'investigations', label: 'Investigations', icon: '⚖', group: 'Deep Diagnostics' },
  { key: 'reports', label: 'Reports & Export', icon: '▤', group: 'Govern' },
  { key: 'settings', label: 'Settings & Data Sources', icon: '⚙', group: 'Govern' },
];

export function SideNav() {
  const page = useStore((s) => s.page);
  const navigate = useStore((s) => s.navigate);
  const groups = [...new Set(NAV.map((n) => n.group))];

  return (
    <aside
      className="desktop-only"
      style={{
        width: 208,
        background: 'var(--bg2)',
        borderRight: '1px solid var(--line)',
        display: 'flex',
        flexDirection: 'column',
        flex: 'none',
      }}
    >
      <div style={{ padding: '12px 14px 10px', borderBottom: '1px solid var(--line)' }}>
        <div className="row" style={{ gap: 8 }}>
          <div
            style={{
              width: 30, height: 30, borderRadius: 6, flex: 'none',
              background: 'linear-gradient(135deg, #0f4c4c, #0b2430)',
              border: '1px solid #1d5c5c', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--cyan)', fontSize: 16, fontWeight: 700, fontFamily: 'var(--mono)',
            }}
          >
            S
          </div>
          <div>
            <div style={{ fontWeight: 700, letterSpacing: '0.04em', fontSize: 13 }}>SHIELD</div>
            <div className="tiny faint" style={{ marginTop: 1 }}>Vehicle Structural Intelligence</div>
          </div>
        </div>
      </div>

      <nav style={{ flex: 1, overflow: 'auto', padding: '8px 6px' }}>
        {groups.map((g) => (
          <div key={g} style={{ marginBottom: 6 }}>
            <div className="tiny" style={{ padding: '6px 8px 3px', color: 'var(--faint)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              {g}
            </div>
            {NAV.filter((n) => n.group === g).map((n) => {
              const active = page === n.key;
              return (
                <button
                  key={n.key}
                  onClick={() => navigate(n.key)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 9, width: '100%', textAlign: 'left',
                    padding: '6px 8px', margin: '1px 0', borderRadius: 5, cursor: 'pointer',
                    background: active ? 'linear-gradient(90deg, #12333a, #0f1c26)' : 'transparent',
                    border: active ? '1px solid #1c5858' : '1px solid transparent',
                    color: active ? 'var(--cyan)' : 'var(--muted)',
                    fontSize: 12.5, fontFamily: 'inherit',
                  }}
                >
                  <span style={{ width: 16, textAlign: 'center', fontSize: 13, opacity: active ? 1 : 0.65 }}>{n.icon}</span>
                  <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{n.label}</span>
                  {n.badge && (
                    <span
                      style={{
                        fontSize: 9,
                        fontFamily: 'var(--mono)',
                        padding: '1px 4px',
                        borderRadius: 3,
                        background: active ? 'rgba(56,189,248,0.2)' : 'rgba(255,255,255,0.05)',
                        color: active ? '#38bdf8' : 'var(--faint)',
                        border: active ? '1px solid rgba(56,189,248,0.4)' : '1px solid transparent',
                      }}
                    >
                      {n.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      <div style={{ padding: '10px 14px', borderTop: '1px solid var(--line)', fontSize: 10, color: 'var(--faint)' }}>
        SHIELD Structural CAD Twin<br />
        <span className="prov prov-verified">VERIFIED CAD ARCHITECTURE</span>
      </div>
    </aside>
  );
}