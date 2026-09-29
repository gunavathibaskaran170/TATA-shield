/* ============================================================
   SHIELD — Standardized Reusable StatusBadge Component
   Allowed states: NORMAL | WATCH | INSPECTION REQUIRED | OFFLINE | UNKNOWN
   ============================================================ */

export type StatusType = 'NORMAL' | 'WATCH' | 'INSPECTION REQUIRED' | 'INSPECTION_REQUIRED' | 'OFFLINE' | 'UNKNOWN';

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  size?: 'small' | 'medium';
}

export function StatusBadge({ status, label, size = 'medium' }: StatusBadgeProps) {
  const normStatus = status === 'INSPECTION_REQUIRED' ? 'INSPECTION REQUIRED' : status;

  const styleMap: Record<string, { bg: string; color: string; border: string; dot: string }> = {
    'NORMAL': {
      bg: 'rgba(52, 211, 153, 0.12)',
      color: '#34D399',
      border: 'rgba(52, 211, 153, 0.3)',
      dot: '#34D399',
    },
    'WATCH': {
      bg: 'rgba(251, 191, 36, 0.12)',
      color: '#FBBF24',
      border: 'rgba(251, 191, 36, 0.3)',
      dot: '#FBBF24',
    },
    'INSPECTION REQUIRED': {
      bg: 'rgba(248, 113, 113, 0.12)',
      color: '#F87171',
      border: 'rgba(248, 113, 113, 0.3)',
      dot: '#F87171',
    },
    'OFFLINE': {
      bg: 'rgba(100, 116, 139, 0.12)',
      color: '#94A3B8',
      border: 'rgba(100, 116, 139, 0.3)',
      dot: '#64748B',
    },
    'UNKNOWN': {
      bg: 'rgba(148, 163, 184, 0.12)',
      color: '#CBD5E1',
      border: 'rgba(148, 163, 184, 0.3)',
      dot: '#94A3B8',
    },
  };

  const meta = styleMap[normStatus] || styleMap['UNKNOWN'];
  const displayText = label || normStatus;

  const isSmall = size === 'small';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: isSmall ? '1px 5px' : '2px 8px',
        borderRadius: 12,
        background: meta.bg,
        color: meta.color,
        border: `1px solid ${meta.border}`,
        fontSize: 10,
        fontWeight: 500,
        fontFamily: 'var(--font-sans)',
        whiteSpace: 'nowrap',
        userSelect: 'none',
      }}
    >
      <span
        style={{
          width: isSmall ? 5 : 6,
          height: isSmall ? 5 : 6,
          borderRadius: '50%',
          background: meta.dot,
          flexShrink: 0,
        }}
      />
      {displayText}
    </span>
  );
}
