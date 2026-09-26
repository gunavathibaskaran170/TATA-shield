/* ============================================================
   SHIELD — app shell: routed workspaces + shared chrome.
   State-based routing via the zustand store (page key).
   ============================================================ */

import type { ComponentType } from 'react';
import { useStore } from './store/useStore';
import type { PageKey } from './schema/types';
import { SideNav } from './ui/SideNav';
import { TopBar } from './ui/TopBar';
import { ContextMenu } from './ui/ContextMenu';
import { CommandCenter } from './pages/CommandCenter';
import { VehicleTwin } from './pages/VehicleTwin';
import { StructuralIntelligence } from './pages/StructuralIntelligence';
import { ManufacturingThread } from './pages/ManufacturingThread';
import { LiveTelemetry } from './pages/LiveTelemetry';
import { FleetAnalytics } from './pages/FleetAnalytics';
import { EventForensics } from './pages/EventForensics';
import { AIDiagnostics } from './pages/AIDiagnostics';
import { Investigations } from './pages/Investigations';
import { StructuralPassport } from './pages/StructuralPassport';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';

import { ErrorBoundary } from './ui/ErrorBoundary';

const PAGES: Record<PageKey, ComponentType> = {
  command: CommandCenter,
  twin: VehicleTwin,
  intelligence: StructuralIntelligence,
  manufacturing: ManufacturingThread,
  telemetry: LiveTelemetry,
  fleet: FleetAnalytics,
  forensics: EventForensics,
  diagnostics: AIDiagnostics,
  investigations: Investigations,
  passport: StructuralPassport,
  reports: Reports,
  settings: Settings,
};

const MOBILE_NAV: { key: PageKey; label: string }[] = [
  { key: 'command', label: 'Home' },
  { key: 'twin', label: 'Twin' },
  { key: 'telemetry', label: 'Sensors' },
  { key: 'fleet', label: 'Fleet' },
  { key: 'forensics', label: 'Events' },
  { key: 'investigations', label: 'Cases' },
  { key: 'settings', label: 'Settings' },
];

export function App() {
  const page = useStore((s) => s.page);
  const navigate = useStore((s) => s.navigate);
  const Page = PAGES[page];

  return (
    <div className="app">
      <TopBar />

      <div className="app-body">
        <SideNav />
        <main className="content">
          <ErrorBoundary fallbackTitle="Workspace Render Error">
            <Page />
          </ErrorBoundary>
        </main>
      </div>

      {/* mobile quick-nav */}
      <nav
        className="mobile-only"
        style={{
          display: 'flex', gap: 6, overflowX: 'auto', padding: '8px 10px',
          background: 'var(--bg2)', borderTop: '1px solid var(--line)', flex: 'none',
        }}
      >
        {MOBILE_NAV.map((n) => (
          <button
            key={n.key}
            className={page === n.key ? 'btn active' : 'btn'}
            onClick={() => navigate(n.key)}
            style={{ flex: 'none' }}
          >
            {n.label}
          </button>
        ))}
      </nav>

      <ContextMenu />
    </div>
  );
}