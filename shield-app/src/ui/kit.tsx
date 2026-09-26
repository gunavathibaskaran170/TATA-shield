/* ============================================================
   SHIELD — shared UI kit: chips, cards, controls.
   ============================================================ */

import type { ReactNode } from 'react';
import type { HealthState, Provenance, SensorStatus } from '../schema/types';

export type AnyState = HealthState | SensorStatus;

export const STATE_META: Record<AnyState, { cls: string; dot: string; label: string }> = {
  NORMAL: { cls: 'st-normal', dot: 'dot-normal', label: 'NORMAL' },
  WATCH: { cls: 'st-watch', dot: 'dot-watch', label: 'WATCH' },
  INSPECTION_REQUIRED: { cls: 'st-inspection', dot: 'dot-inspection', label: 'INSPECTION REQUIRED' },
  OFFLINE: { cls: 'st-offline', dot: 'dot-offline', label: 'OFFLINE' },
};

export function StatusChip({ state }: { state: AnyState }) {
  const m = STATE_META[state] ?? STATE_META.OFFLINE;
  return (
    <span className={'chip ' + m.cls}>
      <span className={'dot ' + m.dot} />
      {m.label}
    </span>
  );
}

export const PROV_CLS: Record<Provenance, string> = {
  VERIFIED: 'prov-verified',
  MEASURED: 'prov-measured',
  DERIVED: 'prov-derived',
  MODEL_ESTIMATED: 'prov-derived',
  SIMULATED: 'prov-simulated',
  DEMO: 'prov-demo',
};

export function ProvTag({ p }: { p: Provenance | undefined }) {
  const cls = p ? PROV_CLS[p] : 'prov-demo';
  return <span className={'prov ' + cls}>{p ?? 'DEMO'}</span>;
}

export function Card({
  title, right, children, className = '', pad = true,
}: {
  title?: ReactNode; right?: ReactNode; children: ReactNode; className?: string; pad?: boolean;
}) {
  return (
    <section className={'card ' + className} style={pad ? undefined : { padding: 0 }}>
      {(title || right) && (
        <div className="spread" style={{ marginBottom: 8 }}>
          {title ? <div className="card-title" style={{ marginBottom: 0 }}>{title}</div> : <span />}
          {right}
        </div>
      )}
      {children}
    </section>
  );
}

export function Seg<T extends string>({
  options, value, onChange, size = 'small',
}: {
  options: { value: T; label: ReactNode; title?: string }[];
  value: T;
  onChange: (v: T) => void;
  size?: 'small' | 'default';
}) {
  return (
    <div className="row" style={{ gap: 2, background: 'var(--bg2)', border: '1px solid var(--line2)', borderRadius: 5, padding: 2 }}>
      {options.map((o) => (
        <button
          key={o.value}
          title={o.title}
          className={value === o.value ? 'btn active' : 'btn'}
          style={{
            padding: size === 'small' ? '2px 7px' : '4px 10px',
            fontSize: size === 'small' ? 11 : 12,
            boxShadow: 'none', border: 'none', borderRadius: 3, background: value === o.value ? '#123a40' : 'transparent',
          }}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Toggle({ label, checked, onChange }: { label: ReactNode; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="row" style={{ cursor: 'pointer', gap: 8, userSelect: 'none' }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ accentColor: 'var(--cyan)', width: 14, height: 14 }}
      />
      <span>{label}</span>
    </label>
  );
}

export function SliderRow({ label, value, min, max, step = 0.01, onChange, fmt }: {
  label: ReactNode; value: number; min: number; max: number; step?: number; onChange: (v: number) => void; fmt?: (v: number) => string;
}) {
  return (
    <div className="col" style={{ gap: 4 }}>
      <div className="spread">
        <span className="small muted">{label}</span>
        <span className="mono small">{fmt ? fmt(value) : value.toFixed(2)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(parseFloat(e.target.value))} />
    </div>
  );
}

export function Stat({ label, value, sub, accent }: { label: string; value: ReactNode; sub?: ReactNode; accent?: string }) {
  return (
    <div className="panel" style={{ padding: '8px 10px' }}>
      <div className="tiny muted" style={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
      <div className="h3" style={{ margin: '2px 0 0', color: accent ?? 'var(--text)' }}>{value}</div>
      {sub && <div className="tiny faint">{sub}</div>}
    </div>
  );
}

export function EmptyState({ title, sub }: { title: string; sub?: ReactNode }) {
  return (
    <div className="panel" style={{ padding: 26, textAlign: 'center', color: 'var(--muted)' }}>
      <div style={{ fontSize: 26 }}>◌</div>
      <div className="small" style={{ marginTop: 6 }}>{title}</div>
      {sub && <div className="tiny faint" style={{ marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

export function fmtNum(n: number, digits = 0): string {
  if (!Number.isFinite(n)) return '—';
  return n.toLocaleString('en-IN', { maximumFractionDigits: digits });
}

export function pct(n: number, digits = 0): string {
  return `${n > 0 ? '+' : ''}${n.toFixed(digits)}%`;
}

/** ISO timestamp → compact local string. */
export function fmtTs(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}