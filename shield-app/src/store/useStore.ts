import { create } from 'zustand';
import type { FastenerDef, PageKey, RegionState, SensorLive } from '../schema/types';
import { CATALOG, CATALOG_BY_ID, relatedIds, descendantsOf } from '../data/catalog';
import { TIMELINE_DURATION, EVENTS, phaseAt } from '../data/scenarios';

export type ViewPreset = 'iso' | 'front' | 'rear' | 'left' | 'right' | 'top' | 'bottom';
export type BatteryViewMode = 'closed' | 'cover_transparent' | 'open' | 'exploded' | 'module_view' | 'mount_view';

export interface ClipPlaneCfg { axis: 'x' | 'y' | 'z'; offset: number }

export interface ContextMenu {
  kind: 'component' | 'fastener' | 'sensor' | null;
  id: string | null;
  x: number;
  y: number;
}

export interface SavedView {
  id: string;
  name: string;
  preset: ViewPreset;
  hidden: Record<string, boolean>;
  explode: number;
}

export interface FleetFilters {
  model: string; variant: string; modelYear: string; plant: string;
  batch: string; mileageBand: string; region: string; component: string; healthState: string;
}

interface Store {
  /* ---------------- navigation ---------------- */
  page: PageKey;
  navigate: (p: PageKey) => void;

  /* ---------------- vehicle identity ---------------- */
  vehicleId: string;

  /* ---------------- selection ---------------- */
  selected: string[];
  hovered: string | null;
  pinned: string | null;
  activeFastener: FastenerDef | null;
  activeSensorId: string | null;
  contextMenu: ContextMenu;
  select: (id: string, additive?: boolean) => void;
  toggle: (id: string) => void;
  setHovered: (id: string | null) => void;
  pin: (id: string | null) => void;
  setActiveFastener: (f: FastenerDef | null) => void;
  setActiveSensor: (id: string | null) => void;
  openContextMenu: (m: ContextMenu) => void;
  closeContextMenu: () => void;
  clearSelection: () => void;

  /* ---------------- visibility ---------------- */
  hidden: Record<string, boolean>;
  ghosted: Record<string, boolean>;
  opacity: Record<string, number>;
  layerOpacity: Record<number, number>;
  layerVisible: Record<number, boolean>;
  setHidden: (id: string, v: boolean) => void;
  toggleHidden: (id: string) => void;
  setGhosted: (id: string, v: boolean) => void;
  setOpacity: (id: string, v: number) => void;
  setLayerOpacity: (l: number, v: number) => void;
  setLayerVisible: (l: number, v: boolean) => void;
  solo: (id: string) => void;
  ghostOthers: (id: string) => void;
  hideOthers: (id: string) => void;
  showAll: () => void;

  /* ---------------- render modes ---------------- */
  xray: boolean;
  wireframe: boolean;
  dimOthers: boolean;
  setXray: (v: boolean) => void;
  toggleXray: () => void;
  setWireframe: (v: boolean) => void;
  setDimOthers: (v: boolean) => void;

  /* ---------------- explosion ---------------- */
  explode: number;
  explodeSelected: boolean;
  explodeSystem: string | null;
  setExplode: (v: number) => void;
  setExplodeSelected: (v: boolean) => void;
  setExplodeSystem: (sys: string | null) => void;
  explodedOffset: (id: string) => [number, number, number];

  /* ---------------- clipping ---------------- */
  clipEnabled: boolean;
  clipPlanes: ClipPlaneCfg[];
  clipBoxOn: boolean;
  clipBox: { x: number; y: number; z: number };
  setClipEnabled: (v: boolean) => void;
  setClipPlane: (i: number, cfg: ClipPlaneCfg) => void;
  addClipPlane: (axis: 'x' | 'y' | 'z') => void;
  removeClipPlane: (i: number) => void;
  setClipBox: (v: { x: number; y: number; z: number }, on?: boolean) => void;
  applyClipPreset: (p: 'longitudinal' | 'transverse' | 'underbody' | 'cabin' | 'none') => void;
  isClipped: (id: string, center: [number, number, number], radius: number) => boolean;

  /* ---------------- battery view mode ---------------- */
  batteryMode: BatteryViewMode;
  setBatteryMode: (m: BatteryViewMode) => void;
  applyBatteryMode: (m: BatteryViewMode) => void;

  /* ---------------- camera & mode ---------------- */
  viewMode: 'skeletal' | 'complete';
  autoRotate: boolean;
  viewPreset: ViewPreset | null;
  focusRequest: { id: string; t: number } | null;
  resetToken: number;
  fitToken: number;
  zoomToken: number;
  zoomFactor: number;
  cadView: boolean;
  setViewMode: (mode: 'skeletal' | 'complete') => void;
  setAutoRotate: (v: boolean) => void;
  setViewPreset: (p: ViewPreset) => void;
  focusOn: (id: string) => void;
  requestResetCamera: () => void;
  requestFitCamera: () => void;
  requestZoomIn: () => void;
  requestZoomOut: () => void;
  setCadView: (v: boolean) => void;

  /* ---------------- live data ---------------- */
  sensorLive: Record<string, SensorLive>;
  regionStates: Record<string, RegionState>;
  heatValues: Record<string, number>;
  heatmapMode: 'off' | 'strain' | 'stress' | 'deformation' | 'anomaly';
  scenario: string;
  setSensorLive: (live: Record<string, SensorLive>) => void;
  setRegionStates: (rs: Record<string, RegionState>) => void;
  setHeatValues: (h: Record<string, number>) => void;
  setHeatmapMode: (m: Store['heatmapMode']) => void;
  setScenario: (s: string) => void;

  /* ---------------- timeline ---------------- */
  tlTime: number;
  playing: boolean;
  setTlTime: (t: number) => void;
  setPlaying: (p: boolean) => void;
  phase: () => string;
  activeEvent: () => (typeof EVENTS)[number] | null;

  /* ---------------- fleet ---------------- */
  fleetFilters: FleetFilters;
  setFleetFilter: (k: keyof FleetFilters, v: string) => void;
  resetFleetFilters: () => void;

  /* ---------------- investigations ---------------- */
  activeInvestigation: string | null;
  setActiveInvestigation: (id: string | null) => void;

  /* ---------------- saved views ---------------- */
  savedViews: SavedView[];
  saveView: (name: string) => void;
  applyView: (v: SavedView) => void;

  /* ---------------- component search ---------------- */
  search: string;
  setSearch: (s: string) => void;
}

const DEFAULT_OPACITY = 1;
const DEFAULT_LAYER_OPACITY: Record<number, number> = {};
for (let i = 0; i <= 21; i++) DEFAULT_LAYER_OPACITY[i] = 1;

export const useStore = create<Store>((set, get) => ({
  page: 'command',
  navigate: (p) => set({ page: p }),

  vehicleId: 'EV-DEMO-0287',

  /* ---------------- selection ---------------- */
  selected: [],
  hovered: null,
  pinned: null,
  activeFastener: null,
  activeSensorId: null,
  contextMenu: { kind: null, id: null, x: 0, y: 0 },
  select: (id, additive) => {
    const { selected } = get();
    if (additive) {
      set({ selected: selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id], pinned: null });
    } else {
      set({ selected: [id], activeFastener: null, activeSensorId: null, pinned: id });
    }
  },
  toggle: (id) => {
    const s = get().selected;
    set({ selected: s.includes(id) ? s.filter((x) => x !== id) : [...s, id] });
  },
  setHovered: (id) => set({ hovered: id }),
  pin: (id) => set({ pinned: id }),
  setActiveFastener: (f) => set({ activeFastener: f }),
  setActiveSensor: (id) => set({ activeSensorId: id }),
  openContextMenu: (m) => set({ contextMenu: m }),
  closeContextMenu: () => set({ contextMenu: { kind: null, id: null, x: 0, y: 0 } }),
  clearSelection: () => set({ selected: [], activeFastener: null, activeSensorId: null }),

  /* ---------------- visibility ---------------- */
  hidden: {},
  ghosted: {},
  opacity: {},
  layerOpacity: DEFAULT_LAYER_OPACITY,
  layerVisible: {},
  setHidden: (id, v) => set((s) => ({ hidden: { ...s.hidden, [id]: v } })),
  toggleHidden: (id) => set((s) => ({ hidden: { ...s.hidden, [id]: !s.hidden[id] } })),
  setGhosted: (id, v) => set((s) => ({ ghosted: { ...s.ghosted, [id]: v } })),
  setOpacity: (id, v) => set((s) => ({ opacity: { ...s.opacity, [id]: v } })),
  setLayerOpacity: (l, v) => set((s) => ({ layerOpacity: { ...s.layerOpacity, [l]: v } })),
  setLayerVisible: (l, v) => set((s) => ({ layerVisible: { ...s.layerVisible, [l]: v } })),
  solo: (id) => {
    const rel = relatedIds(id);
    const keep = new Set([...rel, ...rel.flatMap((r) => descendantsOf(r))]);
    const hidden: Record<string, boolean> = {};
    for (const c of CATALOG) if (!keep.has(c.id)) hidden[c.id] = true;
    set({ hidden, ghosted: {}, xray: false });
  },
  ghostOthers: (id) => {
    const rel = relatedIds(id);
    const keep = new Set([...rel, ...rel.flatMap((r) => descendantsOf(r))]);
    const ghosted: Record<string, boolean> = {};
    for (const c of CATALOG) if (!keep.has(c.id)) ghosted[c.id] = true;
    set({ ghosted, xray: false });
  },
  hideOthers: (id) => {
    const rel = relatedIds(id);
    const keep = new Set([...rel, ...rel.flatMap((r) => descendantsOf(r))]);
    const hidden: Record<string, boolean> = {};
    for (const c of CATALOG) if (!keep.has(c.id)) hidden[c.id] = true;
    set({ hidden, ghosted: {} });
  },
  showAll: () => set({ hidden: {}, ghosted: {}, opacity: {}, layerVisible: {}, xray: false, clipEnabled: false, explode: 0 }),

  /* ---------------- render modes ---------------- */
  xray: false,
  wireframe: false,
  dimOthers: true,
  setXray: (v) => set({ xray: v, ghosted: v ? {} : get().ghosted }),
  toggleXray: () => set((s) => ({ xray: !s.xray, ghosted: s.xray ? s.ghosted : {} })),
  setWireframe: (v) => set({ wireframe: v }),
  setDimOthers: (v) => set({ dimOthers: v }),

  /* ---------------- explosion ---------------- */
  explode: 0,
  explodeSelected: false,
  explodeSystem: null,
  setExplode: (v) => set({ explode: v }),
  setExplodeSelected: (v) => set({ explodeSelected: v }),
  setExplodeSystem: (sys) => set({ explodeSystem: sys }),
  explodedOffset: (id) => {
    const { explode, explodeSelected, explodeSystem, selected } = get();
    if (explode <= 0.001) return [0, 0, 0];
    const def = CATALOG_BY_ID[id];
    if (!def) return [0, 0, 0];
    let boost = 0;
    if (explodeSelected && selected.length && (selected.includes(id) || relatedIds(id).some((r) => selected.includes(r) && r !== id))) {
      boost = 0.6;
    }
    if (explodeSystem && def.system === explodeSystem) boost = Math.max(boost, 0.45);
    const k = (0.32 * def.explodeGroup + boost) * explode;
    const dd = def.explodeDir;
    return [dd[0] * k, dd[1] * k, dd[2] * k];
  },

  /* ---------------- clipping ---------------- */
  clipEnabled: false,
  clipPlanes: [],
  clipBoxOn: false,
  clipBox: { x: 0, y: 0, z: 0 },
  setClipEnabled: (v) => set({ clipEnabled: v }),
  setClipPlane: (i, cfg) => set((s) => {
    const planes = [...s.clipPlanes]; planes[i] = cfg; return { clipPlanes: planes };
  }),
  addClipPlane: (axis) => set((s) => ({ clipPlanes: [...s.clipPlanes, { axis, offset: 0 }] })),
  removeClipPlane: (i) => set((s) => ({ clipPlanes: s.clipPlanes.filter((_, j) => j !== i) })),
  setClipBox: (v, on = true) => set({ clipBox: v, clipBoxOn: on }),
  applyClipPreset: (p) => {
    if (p === 'none') return set({ clipEnabled: false, clipPlanes: [], clipBoxOn: false });
    const presets: Record<string, { planes: ClipPlaneCfg[]; box?: { x: number; y: number; z: number }; boxOn?: boolean }> = {
      longitudinal: { planes: [{ axis: 'x', offset: 0 }] },
      transverse: { planes: [{ axis: 'z', offset: 0 }] },
      underbody: { planes: [{ axis: 'y', offset: 0.5 }] },
      cabin: { planes: [{ axis: 'y', offset: 1.0 }] },
    };
    const cfg = presets[p];
    set({ clipEnabled: true, clipPlanes: cfg.planes, clipBoxOn: !!cfg.boxOn });
  },
  isClipped: (id, center, radius) => {
    const { clipEnabled, clipPlanes, clipBoxOn, clipBox } = get();
    if (!clipEnabled && !clipBoxOn) return false;
    let outside = false;
    for (const pl of clipPlanes) {
      const v = pl.axis === 'x' ? center[0] : pl.axis === 'y' ? center[1] : center[2];
      if (v < pl.offset) outside = true;
    }
    if (clipBoxOn && !outside) {
      const bx = Math.abs(center[0]) <= clipBox.x + radius * 0.5;
      const by = Math.abs(center[1]) <= clipBox.y + radius * 0.5;
      const bz = Math.abs(center[2]) <= clipBox.z + radius * 0.5;
      if (bx && by && bz) outside = true;
    }
    return outside;
  },

  /* ---------------- battery view mode ---------------- */
  batteryMode: 'closed',
  setBatteryMode: (m) => set({ batteryMode: m }),
  applyBatteryMode: (m) => {
    // Pack parts whose presentation changes per view mode.
    const tray = 'BatteryPack_Tray';
    const cover = 'BatteryPack_Cover';
    const enclosure = ['BatteryPack_SideL', 'BatteryPack_SideR', 'BatteryPack_XF', 'BatteryPack_XR', 'CoolingPlate', 'PackVent', 'CoolantInlet', 'CoolantOutlet'];
    const internals = ['Module_01', 'Module_02', 'Module_03', 'Module_04', 'Module_05', 'Module_06', 'Module_07', 'Module_08', 'BatteryModuleRail_L', 'BatteryModuleRail_R', 'BMS', 'HVJunctionBox', 'ServiceDisconnect'];
    const mounts = ['Mount_BFL', 'Mount_BFR', 'Mount_BRL', 'Mount_BRR', 'Mount_ML', 'Mount_MR'];

    const hide: Record<string, boolean> = {};
    const op: Record<string, number> = {};
    const reset = (ids: string[]) => { for (const id of ids) { hide[id] = false; op[id] = 1; } };
    const applyOpacity = (ids: string[], v: number) => { for (const id of ids) op[id] = v; };
    const applyHide = (ids: string[], v: boolean) => { for (const id of ids) hide[id] = v; };

    reset([tray, cover, ...enclosure, ...internals, ...mounts]);
    switch (m) {
      case 'cover_transparent':
        applyOpacity([tray], 0.85);
        applyOpacity([cover], 0.22);
        break;
      case 'open':
        applyHide([cover], true);
        applyOpacity([tray], 0.55);
        break;
      case 'exploded':
        applyHide([cover], true);
        applyOpacity([tray], 0.5);
        break;
      case 'module_view':
        applyHide([cover, tray, ...enclosure, ...mounts], true);
        applyOpacity([...internals], 0.92);
        break;
      case 'mount_view':
        applyHide([cover, ...enclosure, ...internals], true);
        applyOpacity([tray], 0.25);
        applyOpacity(mounts, 1);
        break;
      default: // closed
        break;
    }
    set({ batteryMode: m, hidden: { ...get().hidden, ...hide }, opacity: { ...get().opacity, ...op } });
  },

  /* ---------------- camera & mode ---------------- */
  viewMode: 'skeletal',
  autoRotate: false,
  setViewMode: (mode) => {
    const isComplete = mode === 'complete';
    set({
      viewMode: mode,
      cadView: !isComplete,
      explode: 0,
      viewPreset: 'iso',
      selected: [],
      activeFastener: null,
      activeSensorId: null,
    });
  },
  setAutoRotate: (v) => set({ autoRotate: v }),
  viewPreset: null,
  fitToken: 0,
  zoomToken: 0,
  zoomFactor: 1,
  cadView: true,
  setCadView: (v) => set({ cadView: v }),
  requestFitCamera: () => set((s) => ({ fitToken: s.fitToken + 1, viewPreset: null })),
  requestZoomIn: () => set((s) => ({ zoomToken: s.zoomToken + 1, zoomFactor: 0.8 })),
  requestZoomOut: () => set((s) => ({ zoomToken: s.zoomToken + 1, zoomFactor: 1.25 })),
  focusRequest: null,
  resetToken: 0,
  setViewPreset: (p) => set({ viewPreset: p }),
  focusOn: (id) => set({ focusRequest: { id, t: Date.now() } }),
  requestResetCamera: () => set((s) => ({ resetToken: s.resetToken + 1 })),

  /* ---------------- live data ---------------- */
  sensorLive: {},
  regionStates: {},
  heatValues: {},
  heatmapMode: 'anomaly',
  scenario: 'cruise',
  setSensorLive: (live) => set({ sensorLive: live }),
  setRegionStates: (rs) => set({ regionStates: rs }),
  setHeatValues: (h) => set({ heatValues: h }),
  setHeatmapMode: (m) => set({ heatmapMode: m }),
  setScenario: (s) => set({ scenario: s }),

  /* ---------------- timeline ---------------- */
  tlTime: 30,
  playing: false,
  setTlTime: (t) => set({ tlTime: Math.min(TIMELINE_DURATION, Math.max(0, t)) }),
  setPlaying: (p) => set({ playing: p }),
  phase: () => phaseAt(get().tlTime),
  activeEvent: () => {
    const t = get().tlTime;
    let found: (typeof EVENTS)[number] | null = null;
    for (const e of EVENTS) if (e.time <= t) found = e;
    return found;
  },

  /* ---------------- fleet ---------------- */
  fleetFilters: { model: '', variant: '', modelYear: '', plant: '', batch: '', mileageBand: '', region: '', component: '', healthState: '' },
  setFleetFilter: (k, v) => set((s) => ({ fleetFilters: { ...s.fleetFilters, [k]: v } })),
  resetFleetFilters: () => set({ fleetFilters: { model: '', variant: '', modelYear: '', plant: '', batch: '', mileageBand: '', region: '', component: '', healthState: '' } }),

  /* ---------------- investigations ---------------- */
  activeInvestigation: null,
  setActiveInvestigation: (id) => set({ activeInvestigation: id }),

  /* ---------------- saved views ---------------- */
  savedViews: [],
  saveView: (name) => set((s) => ({
    savedViews: [...s.savedViews, { id: 'v' + Date.now(), name, preset: s.viewPreset ?? 'iso', hidden: { ...s.hidden }, explode: s.explode }],
  })),
  applyView: (v) => set({ hidden: { ...v.hidden }, explode: v.explode, viewPreset: v.preset }),

  /* ---------------- component search ---------------- */
  search: '',
  setSearch: (s) => set({ search: s }),
}));

/* Convenience selectors used across the UI */
export function useSelectedId(): string | null {
  const selected = useStore((s) => s.selected);
  return selected.length ? selected[selected.length - 1] : null;
}

export function systemOf(id: string): string {
  return CATALOG_BY_ID[id]?.system ?? id;
}