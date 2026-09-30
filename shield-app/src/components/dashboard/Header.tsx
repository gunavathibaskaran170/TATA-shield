import React, { useState } from 'react';
import { ViewMode, ChassisHealthState, NavigationPage } from '../../types/simulation';
import { buzzerAudio } from '../../services/BuzzerAudioEngine';
import { ThemeSwitch } from '../common/ThemeSwitch';
import { useTheme } from '../../context/ThemeContext';
import {
  Shield,
  Activity,
  Sliders,
  Box,
  Settings,
  BarChart3,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Lock,
  Check,
  ChevronLeft,
  ChevronRight,
  Cpu,
  Scale,
} from 'lucide-react';

interface HeaderProps {
  viewMode: ViewMode;
  systemStatus: ChassisHealthState;
  dataSource: 'SIMULATION' | 'REAL_HARDWARE';
  currentPage?: NavigationPage;
  onSelectPage?: (page: NavigationPage) => void;
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
  isControlSlideBarOpen?: boolean;
  onToggleControlSlideBar?: () => void;
  isFullScreen?: boolean;
  onToggleFullScreen?: () => void;
  onOpenValidator: () => void;
  onOpenLoadCellConfig: () => void;
  onOpenRealHardware: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  systemStatus,
  dataSource,
  currentPage = 'BENCH_3D',
  onSelectPage = () => {},
  isSidebarOpen,
  onToggleSidebar,
  isControlSlideBarOpen,
  onToggleControlSlideBar,
  isFullScreen = false,
  onToggleFullScreen,
  onOpenValidator,
  onOpenLoadCellConfig,
  onOpenRealHardware,
}) => {
  const { isDark } = useTheme();
  const [isMuted, setIsMuted] = useState(buzzerAudio.getIsMuted());

  const handleToggleMute = () => {
    const next = !isMuted;
    buzzerAudio.setMuted(next);
    setIsMuted(next);
  };

  const statusColor =
    systemStatus === 'CRITICAL'
      ? 'bg-rose-950/80 text-rose-300 border-rose-500/70'
      : systemStatus === 'WARNING'
      ? 'bg-amber-950/80 text-amber-300 border-amber-500/70'
      : 'bg-emerald-950/80 text-emerald-300 border-emerald-500/70';

  return (
    <header
      className={`flex items-center justify-between px-4 py-2 border-b shrink-0 select-none font-['Plus_Jakarta_Sans',var(--font-sans)] transition-colors duration-200 ${
        isDark ? 'border-[#1d2631] bg-[#0d1219]' : 'border-slate-200 bg-white shadow-xs'
      }`}
      style={{ minHeight: '46px' }}
    >
      {/* Left: Stage 01 CAE Identification & Live Stream Badge */}
      <div className="flex items-center gap-2.5">
        <div
          className={`flex items-center justify-center w-7 h-7 rounded-md border font-bold text-xs ${
            isDark
              ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-400 shadow-sm shadow-cyan-950/40'
              : 'bg-cyan-50 border-cyan-200 text-cyan-600'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
        </div>

        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold font-mono tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            HARDWARE TWIN
          </span>
          <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold rounded bg-cyan-400/15 text-cyan-300 border border-cyan-400/35 uppercase">
            STAGE 01 · CAE BENCH
          </span>
          <span
            className={`px-2 py-0.5 text-[10px] font-mono rounded border flex items-center gap-1.5 ${
              dataSource === 'REAL_HARDWARE'
                ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/60 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                : 'bg-cyan-950/80 text-cyan-300 border-cyan-500/50'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${dataSource === 'REAL_HARDWARE' ? 'bg-emerald-400 animate-pulse' : 'bg-cyan-400'}`} />
            {dataSource === 'REAL_HARDWARE' ? 'COM5 LIVE' : 'SIMULATOR'}
          </span>

          <span className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded border ${statusColor}`}>
            {systemStatus}
          </span>
        </div>
      </div>

      {/* Center: Navigation View Tabs */}
      <nav className={`flex items-center gap-1 p-1 rounded-md border text-xs font-medium shrink-0 ${
        isDark ? 'bg-[#10151c] border-[#1d2631]' : 'bg-slate-100 border-slate-200'
      }`}>
        {/* Tab 1: 3D Hardware Bench */}
        <button
          onClick={() => onSelectPage('BENCH_3D')}
          className={`h-7 flex items-center gap-1.5 px-3 rounded-md text-[11px] font-mono font-bold transition-all cursor-pointer whitespace-nowrap ${
            currentPage === 'BENCH_3D'
              ? isDark
                ? 'bg-cyan-500/20 border border-cyan-400/70 text-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.25)]'
                : 'bg-cyan-50 border border-cyan-500 text-cyan-700 font-bold'
              : isDark
              ? 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
          }`}
        >
          <Box className="w-3.5 h-3.5 text-cyan-400" />
          <span>3D CAE Bench</span>
        </button>

        {/* Tab 2: Live Hardware Stream */}
        <button
          onClick={() => onSelectPage('LIVE_DATA')}
          className={`h-7 flex items-center gap-1.5 px-3 rounded-md text-[11px] font-mono font-bold transition-all cursor-pointer whitespace-nowrap ${
            currentPage === 'LIVE_DATA'
              ? isDark
                ? 'bg-cyan-500/20 border border-cyan-400/70 text-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.25)]'
                : 'bg-cyan-50 border border-cyan-500 text-cyan-700 font-bold'
              : isDark
              ? 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
          }`}
        >
          <Activity className="w-3.5 h-3.5 text-cyan-400" />
          <span>Live Stream</span>
        </button>

        {/* Tab 3: Hardware Control & Calibration */}
        <button
          onClick={() => onSelectPage('HARDWARE_CONTROL')}
          className={`h-7 flex items-center gap-1.5 px-3 rounded-md text-[11px] font-mono font-bold transition-all cursor-pointer whitespace-nowrap ${
            currentPage === 'HARDWARE_CONTROL'
              ? isDark
                ? 'bg-cyan-500/20 border border-cyan-400/70 text-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.25)]'
                : 'bg-cyan-50 border border-cyan-500 text-cyan-700 font-bold'
              : isDark
              ? 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
          }`}
        >
          <Sliders className="w-3.5 h-3.5 text-cyan-400" />
          <span>Control Bench</span>
        </button>
      </nav>

      {/* Right: Quick Action Controls */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Bench Controls Left Drawer Toggle (Only for 3D Bench) */}
        {currentPage === 'BENCH_3D' && onToggleControlSlideBar && (
          <button
            onClick={onToggleControlSlideBar}
            title={isControlSlideBarOpen ? 'Hide Bench Controls Slide Bar' : 'Open Bench Controls Slide Bar'}
            className={`h-7 flex items-center gap-1.5 px-2.5 text-[10px] font-mono font-semibold rounded-md border transition-all whitespace-nowrap cursor-pointer ${
              isControlSlideBarOpen
                ? isDark
                  ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                  : 'bg-slate-100 border-slate-300 text-slate-700'
                : 'bg-cyan-500/20 border-cyan-500 text-cyan-300 font-bold'
            }`}
          >
            <Settings className="w-3 h-3" />
            <span>{isControlSlideBarOpen ? 'Hide Controls' : 'Controls'}</span>
            {isControlSlideBarOpen ? <ChevronLeft className="w-2.5 h-2.5" /> : <ChevronRight className="w-2.5 h-2.5" />}
          </button>
        )}

        {/* Telemetry Right Drawer Toggle (Only for 3D Bench) */}
        {currentPage === 'BENCH_3D' && onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            title={isSidebarOpen ? 'Slide Telemetry Sidebar Away' : 'Open Telemetry Sidebar'}
            className={`h-7 flex items-center gap-1.5 px-2.5 text-[10px] font-mono font-semibold rounded-md border transition-all whitespace-nowrap cursor-pointer ${
              isSidebarOpen
                ? isDark
                  ? 'bg-slate-800/90 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700'
                  : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
                : isDark
                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold hover:bg-cyan-500/30 shadow-[0_0_8px_rgba(34,211,238,0.25)]'
                : 'bg-cyan-500 border-cyan-600 text-white font-bold hover:bg-cyan-600'
            }`}
          >
            <BarChart3 className="w-3 h-3" />
            <span>{isSidebarOpen ? 'Hide Dashboard' : 'Show Dashboard'}</span>
            {isSidebarOpen ? <ChevronRight className="w-2.5 h-2.5" /> : <ChevronLeft className="w-2.5 h-2.5" />}
          </button>
        )}

        {/* Load Cell Matrix Config Modal Button */}
        <button
          onClick={onOpenLoadCellConfig}
          className={`h-7 px-2.5 rounded-md border text-[10px] font-mono transition-colors cursor-pointer hidden xl:inline-flex items-center gap-1 whitespace-nowrap ${
            isDark
              ? 'border-[#1d2631] bg-[#10151c] text-slate-400 hover:text-white hover:border-slate-700'
              : 'border-slate-300 bg-slate-100 text-slate-600 hover:text-slate-900'
          }`}
          title="Configure Wheatstone Combiner Lead Colors & Calibration"
        >
          <Scale className="w-3 h-3 text-slate-400" />
          <span>Load Cells</span>
        </button>

        {/* Connect Real Hardware / ESP32 Serial Modal */}
        <button
          onClick={onOpenRealHardware}
          className={`h-7 px-2.5 rounded-md border text-[10px] font-mono font-bold transition-colors cursor-pointer hidden lg:inline-flex items-center gap-1.5 whitespace-nowrap ${
            isDark
              ? 'border-cyan-500/50 text-cyan-300 bg-cyan-950/60 hover:bg-cyan-900/80 hover:text-white'
              : 'border-cyan-400 text-cyan-700 bg-cyan-50 hover:bg-cyan-100'
          }`}
          title="Connect ESP32-C3 over Web Serial or WebSocket Bridge"
        >
          <Cpu className="w-3 h-3 text-cyan-400" />
          <span>ESP32 Gateway</span>
        </button>

        {/* Component Lock & Validation Manager Button */}
        <button
          onClick={onOpenValidator}
          title="Inspect Component Axis Locks & Electrical Continuity Trace"
          className={`h-7 flex items-center gap-1.5 px-2.5 text-[10px] font-mono font-bold rounded-md border transition-colors whitespace-nowrap cursor-pointer ${
            isDark
              ? 'text-cyan-300 bg-cyan-950/80 hover:bg-cyan-900 border-cyan-500/60'
              : 'text-cyan-800 bg-cyan-50 hover:bg-cyan-100 border-cyan-300'
          }`}
        >
          <Lock className="w-3 h-3" />
          <span>Lock</span>
          <span className="inline-flex items-center gap-0.5 text-[9px] text-emerald-400">
            <Check className="w-2.5 h-2.5" /> VALIDATED
          </span>
        </button>

        {/* Buzzer Sound Mute Toggle */}
        <button
          onClick={handleToggleMute}
          title={isMuted ? 'Unmute Active Buzzer Audio' : 'Mute Active Buzzer Audio'}
          className={`h-7 px-2 text-[10px] font-mono rounded-md border transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1 ${
            isDark
              ? isMuted
                ? 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
                : 'bg-blue-950/60 border-blue-500/50 text-blue-300'
              : isMuted
              ? 'bg-slate-100 border-slate-300 text-slate-500'
              : 'bg-blue-50 border-blue-300 text-blue-700'
          }`}
        >
          {isMuted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
          <span>{isMuted ? 'Muted' : 'Audio'}</span>
        </button>

        {/* Full Screen Mode Toggle */}
        {onToggleFullScreen && (
          <button
            onClick={onToggleFullScreen}
            title={isFullScreen ? 'Exit Full Screen 3D Mode' : 'Enter Full Screen 3D Mode'}
            className={`h-7 px-2 text-[10px] font-mono rounded-md border transition-all whitespace-nowrap cursor-pointer flex items-center gap-1 ${
              isFullScreen
                ? 'bg-cyan-500 text-slate-950 border-cyan-300 font-bold'
                : isDark
                ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                : 'bg-slate-100 border-slate-300 text-slate-700 hover:text-slate-900'
            }`}
          >
            {isFullScreen ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
            <span>{isFullScreen ? 'Windowed' : 'Fullscreen'}</span>
          </button>
        )}

        {/* Theme Toggle Switch */}
        <div className={`pl-1.5 border-l shrink-0 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
          <ThemeSwitch />
        </div>
      </div>
    </header>
  );
};
