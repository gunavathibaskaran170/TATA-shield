/* ============================================================
   SHIELD — Standardized EngineeringCard Component
   Enforces unified card background (#10151c), subtle border (#1d2631),
   10px radius, 16px-20px padding, and 14px/600 card title styling.
   ============================================================ */

import type { ReactNode, CSSProperties } from 'react';

interface EngineeringCardProps {
  title?: ReactNode;
  subtitle?: ReactNode;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  padding?: string | number;
}

export function EngineeringCard({
  title,
  subtitle,
  right,
  children,
  className = '',
  style,
  padding = '16px 20px',
}: EngineeringCardProps) {
  return (
    <section
      className={`engineering-card ${className}`}
      style={{
        background: '#10151c',
        border: '1px solid #1d2631',
        borderRadius: 10,
        padding: padding,
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        ...style,
      }}
    >
      {(title || right || subtitle) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            marginBottom: subtitle ? 4 : 12,
          }}
        >
          {title && (
            <h3
              style={{
                fontSize: 13,
                fontWeight: 500,
                lineHeight: 1.4,
                color: '#F8FAFC',
                fontFamily: 'var(--font-sans)',
                margin: 0,
              }}
            >
              {title}
            </h3>
          )}
          {right && <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>{right}</div>}
        </div>
      )}

      {subtitle && (
        <div
          style={{
            fontSize: 12,
            fontWeight: 400,
            color: '#94A3B8',
            fontFamily: 'var(--font-sans)',
            marginBottom: 12,
          }}
        >
          {subtitle}
        </div>
      )}

      <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
    </section>
  );
}
