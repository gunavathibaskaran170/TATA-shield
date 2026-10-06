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
    default: { bg: 'rgba(22, 168, 224, 0.12)', color: '#16A8E0', border: 'rgba(22, 168, 224, 0.3)' },
    success: { bg: 'rgba(32, 201, 151, 0.12)', color: '#20C997', border: 'rgba(32, 201, 151, 0.3)' },
    warning: { bg: 'rgba(242, 184, 75, 0.12)', color: '#F2B84B', border: 'rgba(242, 184, 75, 0.3)' },
    critical: { bg: 'rgba(239, 91, 91, 0.12)', color: '#EF5B5B', border: 'rgba(239, 91, 91, 0.3)' },
  }[badgeType];

  return (
    <header
      style={{
        padding: '12px 20px',
        background: '#101821',
        borderBottom: '1px solid #1F2B38',
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
              fontSize: 24,
              fontWeight: 600,
              lineHeight: 1.2,
              letterSpacing: '-0.01em',
              color: '#F2F5F8',
              fontFamily: 'var(--font-sans)',
              margin: 0,
            }}
          >
            {title}
          </h1>

          {badge && (
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 600,
                letterSpacing: '0.04em',
                padding: '2px 7px',
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
              color: '#A8B4C2',
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

