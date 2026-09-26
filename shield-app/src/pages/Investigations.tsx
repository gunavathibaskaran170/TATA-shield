import { useMemo, useState } from 'react';
import { useStore } from '../store/useStore';
import { INVESTIGATIONS, INVESTIGATION_STATES, EVENTS } from '../data/scenarios';
import { Card, StatusChip, ProvTag, fmtTs } from '../ui/kit';
import type { Investigation, InvestigationNote } from '../schema/types';

const STATE_STYLE: Record<string, { dot: string; label: string; color: string }> = {
  DETECTED: { dot: 'dot-watch', label: 'Detected', color: 'var(--amber)' },
  TRIAGED: { dot: 'dot-watch', label: 'Triaged', color: 'var(--amber)' },
  INSPECTION: { dot: 'dot-inspection', label: 'Inspection', color: 'var(--red)' },
  ROOT_CAUSE: { dot: 'dot-watch', label: 'Root cause', color: 'var(--amber)' },
  ACTION: { dot: 'dot-normal', label: 'Action', color: 'var(--green)' },
  CLOSED: { dot: 'dot-normal', label: 'Closed', color: 'var(--green)' },
};

export function Investigations() {
  const activeId = useStore((s) => s.activeInvestigation);
  const setActiveInvestigation = useStore((s) => s.setActiveInvestigation);
  const navigate = useStore((s) => s.navigate);

  const [items, setItems] = useState<Investigation[]>(() =>
    INVESTIGATIONS.map((i) => ({ ...i, notes: [...i.notes] })),
  );
  const [noteText, setNoteText] = useState('');

  const active = items.find((i) => i.id === activeId) ?? null;

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const i of items) c[i.state] = (c[i.state] ?? 0) + 1;
    return c;
  }, [items]);

  const advance = () => {
    if (!active) return;
    const next = INVESTIGATION_STATES[INVESTIGATION_STATES.indexOf(active.state) + 1];
    if (!next) return;
    setItems((prev) => prev.map((i) =>
      i.id === active.id
        ? { ...i, state: next, updatedAt: new Date().toISOString() }
        : i,
    ));
  };

  const addNote = () => {
    if (!active || !noteText.trim()) return;
    const note: InvestigationNote = {
      at: new Date().toISOString(),
      author: 'SHIELD demo user',
      text: noteText.trim(),
    };
    setItems((prev) => prev.map((i) =>
      i.id === active.id ? { ...i, notes: [...i.notes, note], updatedAt: note.at } : i,
    ));
    setNoteText('');
  };

  const stepIdx = active ? INVESTIGATION_STATES.indexOf(active.state) : -1;

  return (
    <div className="col stack splash-fade" style={{ padding: 14, maxWidth: 1500 }}>
      <div className="spread wrap">
        <div>
          <h2 className="h3" style={{ margin: 0 }}>Investigations</h2>
          <div className="tiny muted">
            Triage and track structural findings. Records here are DEMO — opened from EV-02/EV-04 sensor evidence and the fleet correlation.
          </div>
        </div>
        <div className="row wrap">
          {INVESTIGATION_STATES.map((st) => (
            <span key={st} className="chip" title={`${counts[st] ?? 0} investigation(s)`}>
              <span className={'dot ' + STATE_STYLE[st].dot} />
              {STATE_STYLE[st].label} · {counts[st] ?? 0}
            </span>
          ))}
        </div>
      </div>

      <div className="grid2" style={{ alignItems: 'start' }}>
        {/* ---- list ---- */}
        <Card title="Case list">
          <div className="col" style={{ gap: 6 }}>
            {items.map((i) => (
              <button
                key={i.id}
                className="panel"
                style={{
                  padding: '9px 11px', textAlign: 'left', cursor: 'pointer', color: 'var(--text)', fontFamily: 'inherit', width: '100%',
                  borderLeft: `3px solid ${STATE_STYLE[i.state].color}`,
                  ...(i.id === activeId ? { background: '#101f28', borderColor: 'var(--line2)' } : {}),
                }}
                onClick={() => setActiveInvestigation(i.id)}
              >
                <div className="spread">
                  <span className="mono small" style={{ color: 'var(--cyan)' }}>{i.id}</span>
                  <StatusChip state={i.state === 'CLOSED' ? 'NORMAL' : i.state === 'INSPECTION' || i.state === 'ROOT_CAUSE' ? 'INSPECTION_REQUIRED' : 'WATCH'} />
                </div>
                <div className="small" style={{ marginTop: 3 }}>{i.title}</div>
                <div className="tiny faint" style={{ marginTop: 3 }}>
                  {fmtTs(i.openedAt)} · {i.owner} · {i.vehicleIds.length} vehicle(s) · {i.notes.length} note(s)
                </div>
              </button>
            ))}
          </div>
        </Card>

        {/* ---- detail ---- */}
        <Card title={active ? active.id : 'Case detail'}>
          {active ? (
            <div className="col" style={{ gap: 10 }}>
              <div className="spread">
                <div className="h4" style={{ margin: 0 }}>{active.title}</div>
                <ProvTag p="DEMO" />
              </div>

              <div className="grid2">
                <Field k="State" v={<span className="row" style={{ gap: 6 }}><span className={'dot ' + STATE_STYLE[active.state].dot} /> {STATE_STYLE[active.state].label}</span>} />
                <Field k="Owner" v={active.owner} />
                <Field k="Opened" v={fmtTs(active.openedAt)} />
                <Field k="Updated" v={fmtTs(active.updatedAt)} />
              </div>

              <div className="tiny muted" style={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>State progress</div>
              <div className="row" style={{ gap: 3, flexWrap: 'wrap' }}>
                {INVESTIGATION_STATES.map((st, idx) => {
                  const done = idx < stepIdx;
                  const cur = idx === stepIdx;
                  return (
                    <span
                      key={st}
                      className="tag"
                      style={{
                        color: cur ? STATE_STYLE[st].color : done ? 'var(--green)' : 'var(--faint)',
                        borderColor: cur || done ? STATE_STYLE[st].color : 'var(--line2)',
                        background: cur ? '#101f28' : undefined,
                      }}
                    >
                      {done ? '✓ ' : ''}{STATE_STYLE[st].label}
                    </span>
                  );
                })}
              </div>

              <div>
                <div className="tiny muted" style={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>Hypothesis</div>
                <div className="small" style={{ marginTop: 4, lineHeight: 1.55 }}>{active.hypothesis}</div>
              </div>

              <div className="grid2">
                <Field k="Vehicles" v={active.vehicleIds.join(', ')} mono />
                <Field k="Linked event" v={active.linkedEventId ? `${active.linkedEventId} — ${EVENTS.find((e) => e.id === active.linkedEventId)?.label ?? ''}` : '—'} />
              </div>

              <div>
                <div className="tiny muted" style={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>Evidence trail</div>
                <div className="col" style={{ gap: 6, marginTop: 6 }}>
                  {active.notes.map((n, idx) => (
                    <div key={idx} className="panel" style={{ padding: '7px 9px', background: 'var(--bg2)' }}>
                      <div className="spread">
                        <span className="tiny muted">{n.author}</span>
                        <span className="tiny faint mono">{fmtTs(n.at)}</span>
                      </div>
                      <div className="small" style={{ marginTop: 3 }}>{n.text}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="row wrap" style={{ gap: 8 }}>
                <button className="btn" disabled={stepIdx >= INVESTIGATION_STATES.length - 1} onClick={advance}>
                  Advance state →
                </button>
                <button className="btn" onClick={() => navigate('forensics')}>Open linked forensics</button>
                <button className="btn" onClick={() => navigate('twin')}>Inspect in twin</button>
              </div>

              <div className="col" style={{ gap: 6 }}>
                <div className="row" style={{ gap: 6 }}>
                  <input
                    type="text"
                    placeholder="Add a note to this case (local, not persisted)…"
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') addNote(); }}
                  />
                  <button className="btn" onClick={addNote} disabled={!noteText.trim()}>Add</button>
                </div>
                <div className="tiny faint">
                  State changes and notes stay in this browser session — they are demo interactions, not a database write.
                </div>
              </div>
            </div>
          ) : (
            <div className="panel" style={{ padding: 24, textAlign: 'center', color: 'var(--muted)' }}>
              <div style={{ fontSize: 26 }}>⚖</div>
              <div className="small" style={{ marginTop: 6 }}>Select a case from the list</div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function Field({ k, v, mono }: { k: string; v: React.ReactNode; mono?: boolean }) {
  return (
    <div className="panel" style={{ padding: '6px 9px' }}>
      <div className="tiny muted" style={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>{k}</div>
      <div className={'small' + (mono ? ' mono' : '')} style={{ marginTop: 2, overflowWrap: 'anywhere' }}>{v}</div>
    </div>
  );
}