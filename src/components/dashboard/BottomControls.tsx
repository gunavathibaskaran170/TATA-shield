import React from 'react';
import { ImpactScenario, ViewMode } from '../../types/simulation';

interface BottomControlsProps {
  isRunning: boolean;
  activeScenario: ImpactScenario;
  viewMode: ViewMode;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onSelectScenario: (scenario: ImpactScenario) => void;
  onToggleViewMode: (mode: ViewMode) => void;
  onCheckConnections: () => void;
}

export const BottomControls: React.FC<BottomControlsProps> = ({
  isRunning,
  activeScenario,
  viewMode,
  onStart,
  onPause,
  onReset,
  onSelectScenario,
  onToggleViewMode,
  onCheckConnections,
}) => {
  const scenarios: { id: ImpactScenario; label: string; desc: string; color: string }[] = [
    {
      id: 'NORMAL',
      label: 'NORMAL',
      desc: 'Nominal Highway Cruising (Green LED)',
      color: 'hover:border-emerald-500/80 data-[active=true]:bg-emerald-950 data-[active=true]:border-emerald-500 data-[active=true]:text-emerald-300',
    },
    {
      id: 'POTHOLE',
      label: 'POTHOLE',
      desc: 'Transient Vertical Shock (Yellow LED)',
      color: 'hover:border-amber-500/80 data-[active=true]:bg-amber-950 data-[active=true]:border-amber-500 data-[active=true]:text-amber-300',
    },
    {
      id: 'MINOR_IMPACT',
      label: 'MINOR IMPACT',
      desc: 'Curb / Bump Collision (Warn State)',
      color: 'hover:border-amber-500/80 data-[active=true]:bg-amber-950 data-[active=true]:border-amber-500 data-[active=true]:text-amber-300',
    },
    {
      id: 'MAJOR_IMPACT',
      label: 'MAJOR IMPACT',
      desc: 'High-G Crash Event (Red LED, Siren & Motor)',
      color: 'hover:border-rose-500/80 data-[active=true]:bg-rose-950 data-[active=true]:border-rose-500 data-[active=true]:text-rose-300',
    },
    {
      id: 'STRUCTURAL_DAMAGE',
      label: 'STRUCTURAL DAMAGE',
      desc: 'Permanent Plastic Chassis Deformation',
      color: 'hover:border-rose-500/80 data-[active=true]:bg-rose-950 data-[active=true]:border-rose-500 data-[active=true]:text-rose-300',
    },
  ];

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-3 border-t border-slate-800 bg-[#0d121d] shrink-0 select-none font-['Plus_Jakarta_Sans']">
      {/* Simulation Execution Controls: START, PAUSE, RESET */}
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider hidden sm:inline">
          Simulation:
        </span>
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-lg border border-slate-800">
          {isRunning ? (
            <button
              onClick={onPause}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-amber-300 bg-amber-950/70 hover:bg-amber-900/80 border border-amber-500/50 rounded transition-colors whitespace-nowrap cursor-pointer"
            >
              <span>⏸ Pause</span>
            </button>
          ) : (
            <button
              onClick={onStart}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-emerald-300 bg-emerald-950/70 hover:bg-emerald-900/80 border border-emerald-500/50 rounded transition-colors whitespace-nowrap cursor-pointer"
            >
              <span>▶ Start</span>
            </button>
          )}

          <button
            onClick={onReset}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors whitespace-nowrap cursor-pointer"
          >
            <span>↺ Reset</span>
          </button>
        </div>
      </div>

      {/* Impact Event Trigger Buttons */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-1">
        <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider mr-1 hidden md:inline">
          Impact Scenarios:
        </span>
        {scenarios.map((sc) => {
          const isActive = activeScenario === sc.id;
          return (
            <button
              key={sc.id}
              data-active={isActive}
              onClick={() => onSelectScenario(sc.id)}
              title={sc.desc}
              className={`px-3 py-1.5 text-xs font-mono font-semibold rounded-md border border-slate-800 bg-slate-900 text-slate-400 transition-all whitespace-nowrap cursor-pointer shadow-sm ${sc.color}`}
            >
              {sc.label}
            </button>
          );
        })}
      </div>

      {/* View Switcher & Validation Trigger */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-lg border border-slate-800">
          <button
            onClick={() => onToggleViewMode('HARDWARE')}
            className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors whitespace-nowrap cursor-pointer ${
              viewMode === 'HARDWARE'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Hardware View
          </button>
          <button
            onClick={() => onToggleViewMode('DIGITAL_TWIN')}
            className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors whitespace-nowrap cursor-pointer ${
              viewMode === 'DIGITAL_TWIN'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Digital Twin
          </button>
        </div>

        <button
          onClick={onCheckConnections}
          title="Open Component Lock & Validation Manager"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-cyan-300 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/50 rounded-lg transition-colors whitespace-nowrap shadow-sm cursor-pointer"
        >
          <span>🔒 Lock &amp; Validation</span>
          <span className="text-[10px] font-mono text-emerald-400 font-bold">LOCKED ✓</span>
        </button>
      </div>
    </div>
  );
};
