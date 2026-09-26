import { useEffect } from 'react';
import { useStore } from '../store/useStore';
import { CATALOG_BY_ID, symmetryPartner } from '../data/catalog';
import { FASTENER_BY_ID } from '../data/fasteners';
import { SENSOR_BY_ID } from '../data/sensors';

interface Item { label: string; run: () => void }

export function ContextMenu() {
  const menu = useStore((s) => s.contextMenu);
  const close = useStore((s) => s.closeContextMenu);
  const select = useStore((s) => s.select);
  const solo = useStore((s) => s.solo);
  const ghostOthers = useStore((s) => s.ghostOthers);
  const hideOthers = useStore((s) => s.hideOthers);
  const focusOn = useStore((s) => s.focusOn);
  const setActiveFastener = useStore((s) => s.setActiveFastener);
  const setActiveSensor = useStore((s) => s.setActiveSensor);

  useEffect(() => {
    if (!menu.kind) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    const onClick = () => close();
    window.addEventListener('keydown', onKey);
    window.addEventListener('pointerdown', onClick);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pointerdown', onClick);
    };
  }, [menu.kind, close]);

  if (!menu.kind) return null;

  const items: Item[] = [];
  const copy = (t: string) => () => navigator.clipboard?.writeText(t).catch(() => {});

  if (menu.kind === 'component' && menu.id) {
    const id = menu.id;
    const def = CATALOG_BY_ID[id];
    const partner = symmetryPartner(id);
    items.push(
      { label: `Select ${id}`, run: () => select(id) },
      { label: 'Isolate (double-click) / solo', run: () => solo(id) },
      { label: 'Ghost everything else', run: () => ghostOthers(id) },
      { label: 'Hide everything else', run: () => hideOthers(id) },
      { label: 'Focus camera', run: () => focusOn(id) },
    );
    if (partner) items.push({ label: `Select symmetry partner ${partner}`, run: () => select(partner) });
    items.push({ label: 'Copy component id', run: copy(id) });
    if (def) {
      const s = `SHIELD · ${def.name} — selectable component. ${def.description}`;
      void s;
    }
  } else if (menu.kind === 'fastener' && menu.id) {
    const f = FASTENER_BY_ID[menu.id];
    if (f) {
      items.push(
        { label: `Open joint card ${f.id}`, run: () => setActiveFastener(f) },
        { label: `Select partner ${f.componentA}`, run: () => select(f.componentA) },
        { label: 'Copy fastener id', run: copy(f.id) },
      );
    }
  } else if (menu.kind === 'sensor' && menu.id) {
    const s = SENSOR_BY_ID[menu.id];
    if (s) {
      items.push(
        { label: `Open sensor card ${s.id}`, run: () => setActiveSensor(s.id) },
        { label: 'Focus camera', run: () => focusOn(s.id) },
        { label: 'Copy sensor id', run: copy(s.id) },
      );
    }
  }

  return (
    <div
      style={{
        position: 'fixed', left: menu.x, top: menu.y, zIndex: 80, minWidth: 210,
        background: 'var(--panel2)', border: '1px solid var(--line2)', borderRadius: 6,
        boxShadow: '0 10px 32px rgba(0,0,0,0.55)', padding: 4,
      }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="tiny" style={{ padding: '4px 8px', color: 'var(--faint)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        {menu.kind} · {menu.id}
      </div>
      <hr className="rule" style={{ margin: '2px 0 4px' }} />
      {items.map((it, i) => (
        <button
          key={i}
          style={{
            display: 'block', width: '100%', textAlign: 'left', padding: '6px 8px', borderRadius: 4,
            border: 'none', background: 'transparent', color: 'var(--text)', cursor: 'pointer',
            fontSize: 12.5, fontFamily: 'inherit',
          }}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => { it.run(); close(); }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#182436')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}