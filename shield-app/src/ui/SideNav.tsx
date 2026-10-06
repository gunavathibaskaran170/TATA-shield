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
        { key: 'mfg_quality', label: '02 Build & Baseline', icon: '⚙', badge: 'MFG', completed: page === 'controlled_val' || page === 'live_twin' },
        { key: 'controlled_val', label: '03 Validate', icon: '◇', badge: 'TEST', completed: page === 'live_twin' },
        { key: 'live_twin', label: '04 Monitor', icon: '○', badge: 'LIVE', warning: hasWatch && !hasCritical, critical: hasCritical },
      ],
    },
    {
      title: 'OVERVIEW & WORKSHOP',
      items: [
        { key: 'command', label: 'Command Center', icon: '◆' },
        { key: 'workbench', label: 'Manual Engineering Workbench', icon: '⚒' },
        { key: 'hardware', label: 'Hardware Live Diagnostic', icon: '⚡' },
      ],
    },
    {
      title: 'TRACEABILITY',
      items: [
        { key: 'passport', label: 'Vehicle Digital Passport', icon: '▣' },
      ],
    },
  ];

  return (
    <aside
      className="desktop-only"
      style={{
        width: 225,
        background: '#0C121B',
        borderRight: '1px solid #1E2936',
        display: 'flex',
        flexDirection: 'column',
        flex: 'none',
        height: '100%',
        userSelect: 'none',
      }}
    >
      {/* BRANDING HEADER */}
      <div style={{ padding: '14px 16px 12px', borderBottom: '1px solid #1E2936' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 6,
              flex: 'none',
              background: 'linear-gradient(135deg, #16A8E0, #0C121B)',
              border: '1px solid #16A8E0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              fontSize: 15,
              fontWeight: 700,
              fontFamily: 'var(--font-sans)',
            }}
          >
            S
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 16, color: '#F2F5F8', letterSpacing: '-0.01em', lineHeight: 1.1 }}>
              SHIELD EV
            </div>
            <div style={{ marginTop: 2, fontSize: 11, color: '#6F8093', fontWeight: 400 }}>
              Automotive Structural Intelligence
            </div>
          </div>
        </div>
      </div>

      {/* NAVIGATION TREE */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '12px 10px' }}>
        {GROUPS.map((g) => (
          <div key={g.title} style={{ marginBottom: 16 }}>
            <div
              style={{
                padding: '0 8px 6px',
                color: '#6F8093',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                fontWeight: 600,
                fontSize: 11,
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
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    width: '100%',
                    height: 38,
                    textAlign: 'left',
                    padding: '0 10px 0 12px',
                    margin: '2px 0',
                    borderRadius: 6,
                    cursor: 'pointer',
                    background: active ? 'rgba(22, 168, 224, 0.12)' : 'transparent',
                    border: 'none',
                    color: active ? '#F2F5F8' : '#A8B4C2',
                    fontSize: 13,
                    fontFamily: 'var(--font-sans)',
                    fontWeight: active ? 600 : 400,
                    transition: 'all 0.12s ease',
                  }}
                >
                  {/* Small cyan left indicator for active state */}
                  {active && (
                    <span
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: 8,
                        bottom: 8,
                        width: 3,
                        borderRadius: '0 2px 2px 0',
                        background: '#16A8E0',
                      }}
                    />
                  )}

                  <span style={{ width: 16, textAlign: 'center', fontSize: 13, color: active ? '#16A8E0' : '#6F8093' }}>
                    {n.icon}
                  </span>

                  <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {n.label}
                  </span>

                  {/* Status Indicators */}
                  {n.completed && !active && <span style={{ fontSize: 10, color: '#20C997' }}>✓</span>}
                  {n.warning && <span style={{ fontSize: 10, color: '#F2B84B' }}>●</span>}
                  {n.critical && <span style={{ fontSize: 10, color: '#EF5B5B' }}>●</span>}

                  {/* Code Badge */}
                  {n.badge && (
                    <span
                      style={{
                        fontSize: 9.5,
                        fontFamily: 'var(--font-mono)',
                        padding: '1px 5px',
                        borderRadius: 3,
                        background: active ? 'rgba(22, 168, 224, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                        color: active ? '#16A8E0' : '#6F8093',
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
    </aside>
  );
}