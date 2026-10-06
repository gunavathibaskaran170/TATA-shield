import { useStore } from '../store/useStore';
import type { PageKey } from '../schema/types';

interface NavItem {
  key: PageKey;
  label: string;
  icon: string;
  badge?: string;
  completed?: boolean;
  warning?: boolean;
  critical?: boolean;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

export function SideNav() {
  const page = useStore((s) => s.page);
  const navigate = useStore((s) => s.navigate);
  const sensorLive = useStore((s) => s.sensorLive);

  const hasCritical = Object.values(sensorLive).some((s) => s.analytics.state === 'INSPECTION_REQUIRED');
  const hasWatch = Object.values(sensorLive).some((s) => s.analytics.state === 'WATCH');

  const GROUPS: NavGroup[] = [
    {
      title: 'ENGINEERING LIFECYCLE',
      items: [
        { key: 'digital_eng', label: '01 Design & CAE', icon: '△', badge: 'CAE', completed: page !== 'digital_eng' },
        { key: 'mfg_quality', label: '02 Build & Manufacturing', icon: '⚙', badge: 'MFG', completed: page === 'controlled_val' || page === 'live_twin' },
        { key: 'controlled_val', label: '03 Validation', icon: '◈', badge: 'TEST', completed: page === 'live_twin' },
        { key: 'live_twin', label: '04 Field Monitoring', icon: '◌', badge: 'LIVE', warning: hasWatch && !hasCritical, critical: hasCritical },
      ],
    },
    {
      title: 'OPERATIONS',
      items: [
        { key: 'command', label: 'Command Center', icon: '◆' },
        { key: 'twin', label: 'Vehicle Twin', icon: '🚙' },
        { key: 'telemetry', label: 'Live Telemetry', icon: '📈' },
        { key: 'fleet', label: 'Fleet Analytics', icon: '📊' },
      ],
    },
    {
      title: 'ENGINEERING TOOLS',
      items: [
        { key: 'workbench', label: 'Engineering Workbench', icon: '🛠', badge: 'LAB' },
        { key: 'hardware', label: 'Hardware', icon: '⚡', badge: 'ESP32' },
        { key: 'forensics', label: 'Event Forensics', icon: '⟲' },
        { key: 'diagnostics', label: 'AI Diagnostics', icon: '🤖' },
      ],
    },
    {
      title: 'TRACEABILITY',
      items: [
        { key: 'passport', label: 'Vehicle Digital Passport', icon: '▣', badge: 'ISO' },
        { key: 'reports', label: 'Test Records', icon: '📋' },
        { key: 'investigations', label: 'Investigations', icon: '⚖' },
      ],
    },
  ];

  return (
    <aside
      className="desktop-only"
      style={{
        width: 240,
        background: 'var(--bg2)',
        borderRight: '1px solid var(--line)',
        display: 'flex',
        flexDirection: 'column',
        flex: 'none',
      }}
    >
      {/* BRANDING HEADER */}
      <div style={{ padding: '12px 14px 10px', borderBottom: '1px solid var(--line)' }}>
        <div className="row" style={{ gap: 10 }}>
          <div
            style={{
              width: 32, height: 32, borderRadius: 6, flex: 'none',
              background: 'linear-gradient(135deg, #0284c7, #0f172a)',
              border: '1px solid #0369a1', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#38bdf8', fontSize: 16, fontWeight: 700, fontFamily: 'var(--mono)',
            }}
          >
            S
          </div>
          <div>
            <div style={{ fontWeight: 600, letterSpacing: '-0.02em', fontSize: 15, color: 'var(--text-heading)' }}>SHIELD EV</div>
            <div className="secondary-text" style={{ marginTop: 1, fontSize: 11, color: 'var(--text-muted)' }}>Automotive Structural Intelligence</div>
          </div>
        </div>
      </div>

      {/* NAVIGATION TREE */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '10px 8px' }}>
        {GROUPS.map((g) => (
          <div key={g.title} style={{ marginBottom: 12 }}>
            <div
              style={{
                padding: '4px 8px 4px',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                fontWeight: 600,
                fontSize: 10,
              }}
            >
              {g.title}
            </div>
            {g.items.map((n) => {
              const active = page === n.key;
              return (
                <button
                  key={n.key}
                  onClick={() => navigate(n.key)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    width: '100%',
                    textAlign: 'left',
                    padding: '6px 8px',
                    margin: '1px 0',
                    borderRadius: 6,
                    cursor: 'pointer',
                    background: active
                      ? 'rgba(56,189,248,0.12)'
                      : 'transparent',
                    border: active ? '1px solid rgba(56,189,248,0.4)' : '1px solid transparent',
                    color: active ? '#38bdf8' : 'var(--text-primary)',
                    fontSize: 12,
                    fontFamily: 'inherit',
                    fontWeight: active ? 600 : 400,
                    transition: 'all 0.12s ease',
                  }}
                >
                  <span style={{ width: 16, textAlign: 'center', fontSize: 12, color: active ? '#38bdf8' : 'var(--text-muted)' }}>
                    {n.icon}
                  </span>

                  <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {n.label}
                  </span>

                  {/* Status Indicators */}
                  {n.completed && !active && <span style={{ fontSize: 10, color: '#34d399' }}>✓</span>}
                  {n.warning && <span style={{ fontSize: 10, color: '#fbbf24' }}>●</span>}
                  {n.critical && <span style={{ fontSize: 10, color: '#f87171' }} className="animate-ping">●</span>}

                  {/* Code Badge */}
                  {n.badge && (
                    <span
                      style={{
                        fontSize: 9,
                        fontFamily: 'var(--mono)',
                        padding: '1px 4px',
                        borderRadius: 3,
                        background: active ? 'rgba(56,189,248,0.25)' : 'rgba(255,255,255,0.06)',
                        color: active ? '#38bdf8' : 'var(--text-muted)',
                        fontWeight: 600,
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

      {/* FOOTER */}
      <div style={{ padding: '10px 14px', borderTop: '1px solid var(--line)', fontSize: 11, color: 'var(--text-muted)' }}>
        Connected Engineering Thread<br />
        <span className="prov prov-verified">DESIGN → BUILD → VALIDATE → MONITOR</span>
      </div>
    </aside>
  );
}