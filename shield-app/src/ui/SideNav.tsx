import { useStore } from '../store/useStore';
import type { PageKey } from '../schema/types';

interface NavItem {
  key: PageKey;
  label: string;
  icon: string;
  badge?: string;
  stageNum?: number;
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

  // Determine stage status indicators based on live telemetry & state
  const hasCritical = Object.values(sensorLive).some((s) => s.analytics.state === 'INSPECTION_REQUIRED');
  const hasWatch = Object.values(sensorLive).some((s) => s.analytics.state === 'WATCH');

  const GROUPS: NavGroup[] = [
    {
      title: 'ENGINEERING LIFECYCLE',
      items: [
        {
          key: 'digital_eng',
          label: '01 Design & CAE',
          icon: '△',
          badge: 'CAE',
          stageNum: 1,
          completed: page !== 'digital_eng',
        },
        {
          key: 'mfg_quality',
          label: '02 Build & Baseline',
          icon: '⚙',
          badge: 'MFG',
          stageNum: 2,
          completed: page === 'controlled_val' || page === 'live_twin',
        },
        {
          key: 'controlled_val',
          label: '03 Validate',
          icon: '◈',
          badge: 'TEST',
          stageNum: 3,
          completed: page === 'live_twin',
        },
        {
          key: 'live_twin',
          label: '04 Monitor',
          icon: '◌',
          badge: 'LIVE',
          stageNum: 4,
          warning: hasWatch && !hasCritical,
          critical: hasCritical,
        },
      ],
    },
    {
      title: 'OVERVIEW & WORKSHOP',
      items: [
        { key: 'command', label: 'Command Center', icon: '◆' },
        { key: 'workbench', label: 'Manual Engineering Workbench', icon: '🛠', badge: 'LAB' },
        { key: 'hardware', label: 'Hardware Live Diagnostics', icon: '⚡', badge: 'ESP32' },
      ],
    },
    {
      title: 'TRACEABILITY',
      items: [
        { key: 'passport', label: 'Vehicle Digital Passport', icon: '▣', badge: 'ISO' },
      ],
    },
  ];

  return (
    <aside
      className="desktop-only"
      style={{
        width: 228,
        background: 'var(--bg2)',
        borderRight: '1px solid var(--line)',
        display: 'flex',
        flexDirection: 'column',
        flex: 'none',
      }}
    >
      {/* SHIELD BRANDING HEADER */}
      <div style={{ padding: '10px 12px 8px', borderBottom: '1px solid var(--line)' }}>
        <div className="row" style={{ gap: 8 }}>
          <div
            style={{
              width: 28, height: 28, borderRadius: 5, flex: 'none',
              background: 'linear-gradient(135deg, #0f4c4c, #0b2430)',
              border: '1px solid #1d5c5c', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--cyan)', fontSize: 14, fontWeight: 600, fontFamily: 'var(--mono)',
            }}
          >
            S
          </div>
          <div>
            <div style={{ fontWeight: 600, letterSpacing: '-0.2px', fontSize: 14, color: '#E6EDF5' }}>SHIELD EV</div>
            <div className="secondary-text" style={{ marginTop: 1, fontSize: 10, fontWeight: 400, color: '#71849A' }}>Automotive Structural Intelligence</div>
          </div>
        </div>
      </div>

      {/* NAVIGATION TREE */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '6px 6px' }}>
        {GROUPS.map((g) => (
          <div key={g.title} style={{ marginBottom: 8 }}>
            <div
              style={{
                padding: '3px 6px',
                color: '#52677D',
                textTransform: 'uppercase',
                letterSpacing: '0.4px',
                fontWeight: 500,
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
                    padding: '4px 6px',
                    margin: '1px 0',
                    borderRadius: 5,
                    cursor: 'pointer',
                    background: active
                      ? 'linear-gradient(90deg, rgba(6,182,212,0.18), rgba(15,23,42,0.6))'
                      : 'transparent',
                    border: active ? '1px solid #06b6d4' : '1px solid transparent',
                    color: active ? '#38bdf8' : 'var(--muted)',
                    fontSize: 13,
                    fontFamily: 'inherit',
                    fontWeight: 500,
                    transition: 'all 0.12s ease',
                  }}
                >
                  <span style={{ width: 14, textAlign: 'center', fontSize: 12, color: active ? '#38bdf8' : 'var(--faint)' }}>
                    {n.icon}
                  </span>

                  <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {n.label}
                  </span>

                  {/* Status Indicator Dots */}
                  {n.completed && !active && <span style={{ fontSize: 9, color: '#10b981' }}>✓</span>}
                  {n.warning && <span style={{ fontSize: 9, color: '#f59e0b' }}>●</span>}
                  {n.critical && <span style={{ fontSize: 9, color: '#ef4444' }} className="animate-ping">●</span>}

                  {/* Stage Code Badge */}
                  {n.badge && (
                    <span
                      style={{
                        fontSize: 8.5,
                        fontFamily: 'var(--mono)',
                        padding: '1px 4px',
                        borderRadius: 3,
                        background: active ? 'rgba(56,189,248,0.25)' : 'rgba(255,255,255,0.06)',
                        color: active ? '#38bdf8' : 'var(--faint)',
                        border: active ? '1px solid rgba(56,189,248,0.5)' : '1px solid transparent',
                        fontWeight: 500,
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
      <div style={{ padding: '10px 14px', borderTop: '1px solid var(--line)', fontSize: 10, color: 'var(--faint)' }}>
        SHIELD Connected Engineering Thread<br />
        <span className="prov prov-verified">DESIGN → BUILD → VALIDATE → MONITOR</span>
      </div>
    </aside>
  );
}