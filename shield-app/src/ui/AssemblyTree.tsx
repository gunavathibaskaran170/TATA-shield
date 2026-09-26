import { useMemo, useState } from 'react';
import { CATALOG, CATALOG_BY_ID, childrenOf, SYSTEM_GROUPS, BIW_GROUPS, SK_GROUPS } from '../data/catalog';
import { useStore } from '../store/useStore';
import type { ComponentDef } from '../schema/types';

const GF_ICON: Record<string, string> = {
  panel: '▭', strut: '╱', rail: '▮', beam: '▬', box: '▢', cylinder: '◯',
  pack: '▣', wheel: '◉', seat: '◓', glass: '◌', harness: '∿', sensor: '◈',
  fastener: '✚', electronics: '▣', thermal: '≈', wheel2: '◉',
};

interface RowProps {
  def: ComponentDef;
  depth: number;
  expanded: Set<string>;
  toggle: (id: string) => void;
}

function ComponentRow({ def, depth, expanded, toggle }: RowProps) {
  const selected = useStore((s) => s.selected.includes(def.id));
  const hovered = useStore((s) => s.hovered);
  const hidden = useStore((s) => !!s.hidden[def.id]);
  const ghosted = useStore((s) => !!s.ghosted[def.id]);
  const regionState = useStore((s) => s.regionStates[def.id]);
  const select = useStore((s) => s.select);
  const toggleHidden = useStore((s) => s.toggleHidden);
  const setGhosted = useStore((s) => s.setGhosted);
  const focusOn = useStore((s) => s.focusOn);

  const kids = childrenOf(def.id);
  const hasKids = kids.length > 0;
  const isOpen = expanded.has(def.id);
  const state = regionState?.state ?? def.healthState;

  return (
    <div>
      <div
        className="row"
        style={{
          gap: 4,
          padding: '2px 6px 2px 4px',
          cursor: 'pointer',
          borderRadius: 4,
          background: selected ? '#12333a' : hovered === def.id ? '#15202c' : 'transparent',
          marginLeft: depth * 12,
        }}
        onClick={() => select(def.id)}
        onDoubleClick={() => { focusOn(def.id); }}
        title={`${def.id} — ${def.description}`}
      >
        <button
          className="icon-btn"
          style={{ width: 18, height: 18, fontSize: 10, color: '#3a4a5c', cursor: 'pointer' }}
          onClick={(e) => { e.stopPropagation(); toggle(def.id); }}
        >
          {hasKids ? (isOpen ? '−' : '+') : '·'}
        </button>
        <span style={{ width: 15, textAlign: 'center', opacity: 0.7 }}>{GF_ICON[def.gf] ?? '□'}</span>
        <span className="grow" style={{ fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: hidden ? 'var(--faint)' : ghosted ? '#8fa0b3' : 'var(--text)' }}>
          {def.name}
          {def.side && def.side !== 'CENTER' ? ` (${def.side})` : ''}
        </span>
        <span className="tiny" title={state}>
          <span className={'dot dot-' + (state === 'INSPECTION_REQUIRED' ? 'inspection' : state === 'WATCH' ? 'watch' : 'normal')} />
        </span>
        <button className="icon-btn" style={{ width: 20, height: 20, fontSize: 11, cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); toggleHidden(def.id); }} title="Show / hide">
          {hidden ? '○' : '◉'}
        </button>
        <button className="icon-btn" style={{ width: 20, height: 20, fontSize: 11, cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); setGhosted(def.id, !ghosted); }} title="Ghost">
          {ghosted ? '◐' : '◑'}
        </button>
      </div>
      {isOpen && kids.map((k) => (
        <ComponentRow key={k.id} def={k} depth={depth + 1} expanded={expanded} toggle={toggle} />
      ))}
    </div>
  );
}

function GroupNode({ label, id, icon, depth, expanded, toggle }: {
  label: string; id: string; icon: string; depth: number; expanded: Set<string>; toggle: (id: string) => void;
}) {
  const selected = useStore((s) => s.selected.includes(id));
  const kids = childrenOf(id);
  const isOpen = expanded.has(id);
  return (
    <div>
      <div
        className="row"
        style={{ gap: 4, padding: '2px 6px', cursor: 'pointer', borderRadius: 4, background: selected ? '#12333a' : undefined, marginLeft: depth * 12 }}
        onClick={() => toggle(id)}
      >
        <button className="icon-btn" style={{ width: 18, height: 18, fontSize: 10, color: '#3a4a5c', cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); toggle(id); }}>
          {isOpen ? '−' : '+'}
        </button>
        <span>{icon}</span>
        <span className="grow small" style={{ color: 'var(--muted)', fontWeight: 600 }}>{label}</span>
        <span className="tiny faint">{kids.length}</span>
      </div>
      {isOpen && kids.map((k) => (
        <ComponentRow key={k.id} def={k} depth={depth + 1} expanded={expanded} toggle={toggle} />
      ))}
    </div>
  );
}

export function AssemblyTree({ filter = '' }: { filter?: string }) {
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set([
    ...SYSTEM_GROUPS.map((g) => g.id),
    ...BIW_GROUPS.map((g) => g.id),
    ...SK_GROUPS.map((g) => g.id),
    'GRP_BIW_FRONT', 'GRP_BATTERY', 'GRP_DRIVE',
  ]));
  const toggle = (id: string) => setExpanded((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const toggleExpandAll = () => setExpanded((prev) => (prev.size < 8 ? new Set([
    ...SYSTEM_GROUPS.map((g) => g.id), ...BIW_GROUPS.map((g) => g.id), ...SK_GROUPS.map((g) => g.id),
  ]) : new Set()));

  const tree = useMemo(() => {
    if (!filter.trim()) {
      return (
        <div>
          {SYSTEM_GROUPS.map((g) => {
            const extra: { id: string; name: string }[] =
              g.id === 'SYS_BIW' ? BIW_GROUPS : g.id === 'SYS_SKATEBOARD' ? SK_GROUPS : [];
            const direct = childrenOf(g.id);
            return (
              <div key={g.id}>
                <GroupNode label={g.name} id={g.id} icon="▤" depth={0} expanded={expanded} toggle={toggle} />
                {expanded.has(g.id) && extra.map((e) => (
                  <GroupNode key={e.id} label={e.name} id={e.id} icon="▦" depth={1} expanded={expanded} toggle={toggle} />
                ))}
              </div>
            );
          })}
        </div>
      );
    }
    const q = filter.trim().toLowerCase();
    const hits = CATALOG.filter((c) => c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q)).slice(0, 80);
    return (
      <div>
        {hits.map((c) => <ComponentRow key={c.id} def={c} depth={0} expanded={expanded} toggle={toggle} />)}
      </div>
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, expanded]);

  return (
    <div>
      <div className="spread" style={{ marginBottom: 6 }}>
        <span className="tiny faint mono">{CATALOG.length} components</span>
        <button className="btn" style={{ fontSize: 10.5, padding: '1px 6px' }} onClick={toggleExpandAll}>Expand / collapse all</button>
      </div>
      <div style={{ overflow: 'auto', maxHeight: 'calc(100vh - 250px)' }}>
        {tree}
      </div>
    </div>
  );
}