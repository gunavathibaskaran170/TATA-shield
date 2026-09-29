/* ============================================================
   SHIELD — Standardized Button System Component
   Categories: PRIMARY | SECONDARY | GHOST | DANGER
   Height: 36px, font-size: 13px, font-weight: 600
   ============================================================ */

import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface EngineeringButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  icon?: ReactNode;
  children: ReactNode;
}

export function EngineeringButton({
  variant = 'secondary',
  icon,
  children,
  style,
  className = '',
  disabled,
  ...props
}: EngineeringButtonProps) {
  const variantStyles: Record<ButtonVariant, { bg: string; border: string; color: string; hoverBg: string }> = {
    primary: {
      bg: 'linear-gradient(135deg, #0891b2, #0e7490)',
      border: '#06b6d4',
      color: '#FFFFFF',
      hoverBg: '#0891b2',
    },
    secondary: {
      bg: '#141b24',
      border: '#273342',
      color: '#E6EDF5',
      hoverBg: '#1e293b',
    },
    ghost: {
      bg: 'transparent',
      border: 'transparent',
      color: '#94A3B8',
      hoverBg: 'rgba(255, 255, 255, 0.06)',
    },
    danger: {
      bg: 'rgba(248, 113, 113, 0.12)',
      border: 'rgba(248, 113, 113, 0.3)',
      color: '#F87171',
      hoverBg: 'rgba(248, 113, 113, 0.25)',
    },
  };

  const current = variantStyles[variant];

  return (
    <button
      disabled={disabled}
      className={`eng-btn ${className}`}
      style={{
        height: 32,
        padding: '0 12px',
        borderRadius: 6,
        fontSize: 11,
        fontWeight: 500,
        fontFamily: 'var(--font-sans)',
        background: current.bg,
        border: `1px solid ${current.border}`,
        color: current.color,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        whiteSpace: 'nowrap',
        transition: 'all 0.15s ease',
        boxSizing: 'border-box',
        ...style,
      }}
      {...props}
    >
      {icon && <span style={{ display: 'inline-flex', fontSize: 12 }}>{icon}</span>}
      {children}
    </button>
  );
}
