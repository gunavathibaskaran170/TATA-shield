import React, { useState } from 'react';
import { ViewMode, ChassisHealthState } from '../../types/simulation';
import { buzzerAudio } from '../../services/BuzzerAudioEngine';

interface HeaderProps {
  viewMode: ViewMode;
  systemStatus: ChassisHealthState;
  dataSource: 'SIMULATION' | 'REAL_HARDWARE';
  onToggleViewMode: () => void;
  onOpenValidator: () => void;
  onOpenLoadCellConfig: () => void;
  onOpenRealHardware: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  viewMode,
  systemStatus,
  dataSource,
  onToggleViewMode,
  onOpenValidator,
  onOpenLoadCellConfig,
  onOpenRealHardware,
}) => {
  const [isMuted, setIsMuted] = useState(buzzerAudio.getIsMuted());

  const handleToggleMute = () => {
    const next = !isMuted;
    buzzerAudio.setMuted(next);
    setIsMuted(next);
  };

  return (
    <header className="flex items-center justify-between px-6 py-3 border-b border-slate-800 bg-[#0d121d] shrink-0 select-none">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-8 h-8 rounded bg-blue-600/20 border border-blue-500/40 text-blue-400 font-bold text-sm">
          🛡
        </div>
        <div className="flex flex-col">
          <span className="text-base font-bold tracking-tight text-white font-['Chakra_Petch']">
            SHIELD — EV Chassis Structural Health Monitoring
          </span>
          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
            <span>Prototype 3D Digital Twin & Hardware Simulator</span>
            <span aria-hidden="true">·</span>
            <span className={dataSource === 'SIMULATION' ? 'text-amber-400' : 'text-emerald-400 font-semibold'}>
              {dataSource === 'SIMULATION' ? 'SIMULATED DATA' : 'REAL HARDWARE STREAM'}
            </span>
          </div>
        </div>
      </div>

      {/* Zone 2: Navigation links */}
      <nav className="hidden lg:flex items-center gap-6 text-xs font-medium text-slate-400">
        <button
          onClick={onToggleViewMode}
          className={`transition-colors hover:text-white cursor-pointer ${
            viewMode === 'HARDWARE' ? 'text-blue-400 font-semibold border-b border-blue-500 pb-0.5' : ''
          }`}
        >
          Hardware Bench (3D)
        </button>
        <button
          onClick={onToggleViewMode}
          className={`transition-colors hover:text-white cursor-pointer ${
            viewMode === 'DIGITAL_TWIN' ? 'text-blue-400 font-semibold border-b border-blue-500 pb-0.5' : ''
          }`}
        >
          Chassis Digital Twin
        </button>
        <button
          onClick={onOpenLoadCellConfig}
          className="transition-colors hover:text-white cursor-pointer"
        >
          Load Cell Bridge Config
        </button>
        <button
          onClick={onOpenRealHardware}
          className="transition-colors hover:text-white cursor-pointer text-cyan-400"
        >
          Connect ESP32 (Web Serial)
        </button>
      </nav>

      {/* Zone 3: Primary Actions */}
      <div className="flex items-center gap-2.5">
        {/* Buzzer Sound Mute Toggle */}
        <button
          onClick={handleToggleMute}
          title={isMuted ? 'Unmute Active Buzzer Audio' : 'Mute Active Buzzer Audio'}
          className={`px-3 py-1.5 text-xs font-mono rounded border transition-colors whitespace-nowrap cursor-pointer ${
            isMuted
              ? 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white'
              : 'bg-blue-950/60 border-blue-500/50 text-blue-300 hover:bg-blue-900/60'
          }`}
        >
          {isMuted ? '🔇 Audio Muted' : '🔊 Buzzer Sound ON'}
        </button>

        {/* Component Lock & Validation Manager Button */}
        <button
          onClick={onOpenValidator}
          title="Open Component Lock & Validation Manager"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-cyan-300 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/60 rounded transition-colors whitespace-nowrap shadow-sm cursor-pointer"
        >
          <span>🔒 Lock &amp; Validation</span>
          <span className="px-1.5 py-0.2 text-[10px] font-mono bg-emerald-950 border border-emerald-500/70 text-emerald-300 rounded font-bold">
            VALIDATED ✓
          </span>
        </button>

        {/* View Switcher Button */}
        <button
          onClick={onToggleViewMode}
          className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded transition-colors whitespace-nowrap shadow-sm cursor-pointer"
        >
          {viewMode === 'HARDWARE' ? 'Switch to Digital Twin' : 'Switch to Hardware'}
        </button>
      </div>
    </header>
  );
};
