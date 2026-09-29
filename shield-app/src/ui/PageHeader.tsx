/* ============================================================
   SHIELD — Standardized Global PageHeader Component
   Main Page Heading: 22px / weight 600 / line-height 1.2
   Page Subtitle: 13px / weight 400
   ============================================================ */

import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  badge?: string;
  badgeType?: 'default' | 'success' | 'warning' | 'critical';
  actions?: ReactNode; // Right-hand contextual controls
  children?: ReactNode; // Right-hand contextual controls
}

export function PageHeader({ title, description, badge, badgeType = 'default', actions, children }: PageHeaderProps) {
  const rightControls = actions || children;
  const badgeColors = {
    default: { bg: 'rgba(34, 211, 238, 0.12)', color: '#22D3EE', border: 'rgba(34, 211, 238, 0.3)' },
    success: { bg: 'rgba(52, 211, 153, 0.12)', color: '#34D399', border: 'rgba(52, 211, 153, 0.3)' },
    warning: { bg: 'rgba(251, 191, 36, 0.12)', color: '#FBBF24', border: 'rgba(251, 191, 36, 0.3)' },
    critical: { bg: 'rgba(248, 113, 113, 0.12)', color: '#F87171', border: 'rgba(248, 113, 113, 0.3)' },
  }[badgeType];

  return (
    <header
      style={{
        padding: '14px 20px 12px 20px',
        background: '#0d1219',
        borderBottom: '1px solid #1d2631',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        flex: 'none',
        width: '100%',
        boxSizing: 'border-box',
        zIndex: 10,
      }}
    >
      {/* LEFT: Title & Description */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 600,
              lineHeight: 1.2,
              letterSpacing: '-0.01em',
              color: '#F8FAFC',
              fontFamily: 'var(--font-sans)',
              margin: 0,
            }}
          >
            {title}
          </h1>

          {badge && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 500,
                letterSpacing: '0.04em',
                padding: '2px 6px',
                borderRadius: 4,
                background: badgeColors.bg,
                color: badgeColors.color,
                border: `1px solid ${badgeColors.border}`,
                fontFamily: 'var(--font-mono)',
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
              }}
            >
              {badge}
            </span>
          )}
        </div>

        {description && (
          <p
            style={{
              fontSize: 13,
              fontWeight: 400,
              lineHeight: 1.4,
              color: '#94A3B8',
              fontFamily: 'var(--font-sans)',
              margin: 0,
            }}
          >
            {description}
          </p>
        )}
      </div>

      {/* RIGHT: Contextual Controls Slot */}
      {rightControls && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            flexShrink: 0,
            fontFamily: 'var(--font-sans)',
          }}
        >
          {rightControls}
        </div>
      )}
    </header>
  );
}

