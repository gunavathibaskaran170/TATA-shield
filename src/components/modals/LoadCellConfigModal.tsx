import React, { useState } from 'react';
import { LoadCellWiringConfig } from '../../types/simulation';

interface LoadCellConfigModalProps {
  currentConfig: LoadCellWiringConfig;
  onSaveConfig: (config: LoadCellWiringConfig) => void;
  onClose: () => void;
}

export const LoadCellConfigModal: React.FC<LoadCellConfigModalProps> = ({
  currentConfig,
  onSaveConfig,
  onClose,
}) => {
  const [config, setConfig] = useState<LoadCellWiringConfig>(currentConfig);

  const colorOptions = [
    { label: 'Red (Excitation + / Standard)', value: 'Red (#ef4444)' },
    { label: 'Black (Excitation - / Ground)', value: 'Black (#1e293b)' },
    { label: 'White (Signal - / Inverting)', value: 'White (#f8fafc)' },
    { label: 'Green (Signal + / Non-inverting)', value: 'Green (#22c55e)' },
    { label: 'Yellow (Shield / Ground)', value: 'Yellow (#eab308)' },
    { label: 'Twisted Black (Dual-gauge)', value: 'Twisted Black (#334155)' },
    { label: 'Twisted White (Dual-gauge)', value: 'Twisted White (#e2e8f0)' },
  ];

  const presets = [
    {
      name: '4x 50kg Half-Bridge Quad Array (Reference Hardware)',
      desc: '4x Load cells in Wheatstone bridge: Red to E+/E-, Black & White pairs to A+/A-',
      config: {
        ePlusColor: 'Red (#ef4444)',
        eMinusColor: 'Black (#1e293b)',
        aPlusColor: 'Twisted Black (#334155)',
        aMinusColor: 'Twisted White (#e2e8f0)',
      },
    },
    {
      name: 'Standard 4-Wire Full Bridge (Color Code A)',
      desc: 'Red → E+, Black → E-, Green → A+, White → A-',
      config: {
        ePlusColor: 'Red (#ef4444)',
        eMinusColor: 'Black (#1e293b)',
        aPlusColor: 'Green (#22c55e)',
        aMinusColor: 'White (#f8fafc)',
      },
    },
    {
      name: 'Industrial Load Cell (Color Code B)',
      desc: 'Red → E+, White → E-, Green → A+, Black → A-',
      config: {
        ePlusColor: 'Red (#ef4444)',
        eMinusColor: 'White (#f8fafc)',
        aPlusColor: 'Green (#22c55e)',
        aMinusColor: 'Black (#1e293b)',
      },
    },
  ];

  const handleApply = () => {
    onSaveConfig(config);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150 select-none">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/60">
          <div>
            <h2 className="text-base font-bold text-white font-['Chakra_Petch']">
              HX711 Bridge Terminal Pin Mapping
            </h2>
            <p className="text-xs text-slate-400">
              Configure strain-gauge wire color assignments for E+, E-, A+, and A-
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs font-['Plus_Jakarta_Sans']">
          <div className="p-3 bg-amber-950/40 border border-amber-500/40 rounded-lg text-amber-200 leading-relaxed">
            <span className="font-bold">⚠️ Manufacturer Variance Notice:</span> Strain-gauge and load-cell wire colors are not universally standardized across vendors. Use this panel to match your exact physical transducer manufacturer pinout.
          </div>

          {/* Quick Presets */}
          <div>
            <h4 className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">
              Transducer Wiring Presets
            </h4>
            <div className="space-y-1.5">
              {presets.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => setConfig(preset.config)}
                  className="w-full p-2 bg-slate-950/80 hover:bg-slate-800/80 border border-slate-800 rounded-lg text-left transition-colors cursor-pointer"
                >
                  <span className="font-bold text-white block text-xs">{preset.name}</span>
                  <span className="text-[11px] text-slate-400">{preset.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Pin Assignment Form */}
          <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-lg space-y-3 font-mono">
            <h4 className="text-[11px] uppercase tracking-wider text-cyan-400 font-bold">
              HX711 Wheatstone Bridge Terminals
            </h4>

            {/* E+ */}
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-white block">E+ (Excitation Positive +3.3V)</span>
                <span className="text-[10px] text-slate-500">Bridge supply voltage</span>
              </div>
              <select
                value={config.ePlusColor}
                onChange={(e) => setConfig({ ...config, ePlusColor: e.target.value })}
                className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs cursor-pointer"
              >
                {colorOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* E- */}
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-white block">E- (Excitation Negative / GND)</span>
                <span className="text-[10px] text-slate-500">Bridge return ground</span>
              </div>
              <select
                value={config.eMinusColor}
                onChange={(e) => setConfig({ ...config, eMinusColor: e.target.value })}
                className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs cursor-pointer"
              >
                {colorOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* A+ */}
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-white block">A+ (Channel A Differential Signal +)</span>
                <span className="text-[10px] text-slate-500">High-gain PGA non-inverting input</span>
              </div>
              <select
                value={config.aPlusColor}
                onChange={(e) => setConfig({ ...config, aPlusColor: e.target.value })}
                className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs cursor-pointer"
              >
                {colorOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* A- */}
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-white block">A- (Channel A Differential Signal -)</span>
                <span className="text-[10px] text-slate-500">High-gain PGA inverting input</span>
              </div>
              <select
                value={config.aMinusColor}
                onChange={(e) => setConfig({ ...config, aMinusColor: e.target.value })}
                className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs cursor-pointer"
              >
                {colorOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-slate-400 hover:text-white rounded transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors cursor-pointer"
          >
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
};
