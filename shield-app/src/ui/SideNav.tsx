import { useStore } from '../store/useStore';
import type { PageKey } from '../schema/types';

const NAV: { key: PageKey; label: string; icon: string; group: string }[] = [
  { key: 'command', label: 'Command Center', icon: '◈', group: 'Operate' },
  { key: 'twin', label: 'Vehicle Twin', icon: '⛶', group: 'Operate' },
  { key: 'intelligence', label: 'Structural Intelligence', icon: '⌗', group: 'Analyze' },
  { key: 'telemetry', label: 'Live Telemetry', icon: '∿', group: 'Analyze' },
  { key: 'fleet', label: 'Fleet Analytics', icon: '▤', group: 'Analyze' },
  { key: 'forensics', label: 'Event Forensics', icon: '⟲', group: 'Investigate' },
  { key: 'diagnostics', label: 'AI Diagnostics', icon: '◉', group: 'Investigate' },
  { key: 'investigations', label: 'Investigations', icon: '⚖', group: 'Investigate' },
  { key: 'manufacturing', label: 'Manufacturing Thread', icon: '⛭', group: 'Quality' },
  { key: 'passport', label: 'Structural Passport', icon: '▣', group: 'Quality' },
  { key: 'reports', label: 'Reports', icon: '▤', group: 'Govern' },
  { key: 'settings', label: 'Settings / Data Sources', icon: '⚙', group: 'Govern' },
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
                  <span style={{ flex: 1 }}>{n.label}</span>
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