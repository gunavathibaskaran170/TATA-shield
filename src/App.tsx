import React, { useState, useEffect, useRef } from 'react';
import {
  SensorTelemetry,
  ViewMode,
  ImpactScenario,
  HardwareComponentMeta,
  WireConnection,
  LoadCellWiringConfig,
  ComponentLockState,
  WireRoutingMode,
} from './types/simulation';
import {
  SimulatedSensorDataProvider,
  RealESP32SensorDataProvider,
  SensorDataProvider,
} from './services/SensorDataProvider';
import { HARDWARE_COMPONENTS, INITIAL_WIRES } from './data/hardwareLayout';
import { Scene3D } from './components/3d/Scene3D';
import { Header } from './components/dashboard/Header';
import { TelemetryDashboard } from './components/dashboard/TelemetryDashboard';
import { BottomControls } from './components/dashboard/BottomControls';
import { ComponentInspectorModal } from './components/modals/ComponentInspectorModal';
import { ComponentLockValidationPanel } from './components/modals/ComponentLockValidationPanel';
import { ConnectionValidationModal } from './components/modals/ConnectionValidationModal';
import { LoadCellConfigModal } from './components/modals/LoadCellConfigModal';
import { RealHardwareModal } from './components/modals/RealHardwareModal';

export default function App() {
  // Data providers
  const simProviderRef = useRef<SimulatedSensorDataProvider | null>(null);
  const realProviderRef = useRef<RealESP32SensorDataProvider | null>(null);
  const [activeProvider, setActiveProvider] = useState<'SIMULATION' | 'REAL_HARDWARE'>('SIMULATION');

  // Application state
  const [telemetry, setTelemetry] = useState<SensorTelemetry>({
    timestamp: Date.now(),
    strainMicroStrain: 14,
    loadKg: 25.0,
    loadCell1Raw: 842100,
    loadCell2Raw: 841950,
    strainDeformationMm: 0.08,
    accel: { x: 0.01, y: 0.02, z: 1.0 },
    gyro: { x: 0.0, y: 0.0, z: 0.0 },
    roll: 0.0,
    pitch: 0.0,
    yaw: 0.0,
    temperatureC: 24.8,
    vibrationMotorActive: false,
    vibrationDutyCycle: 0,
    buzzerActive: false,
    buzzerFrequency: 0,
    ledGreen: true,
    ledYellow: false,
    ledRed: false,
    systemStatus: 'NORMAL',
    activeScenario: 'NORMAL',
    scenarioProgress: 0,
    dataSource: 'SIMULATION',
  });

  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [activeScenario, setActiveScenario] = useState<ImpactScenario>('NORMAL');
  const [viewMode, setViewMode] = useState<ViewMode>('HARDWARE');

  // Interactive selection
  const [wires, setWires] = useState<WireConnection[]>(INITIAL_WIRES);
  const [components] = useState<HardwareComponentMeta[]>(HARDWARE_COMPONENTS);
  const [selectedComponent, setSelectedComponent] = useState<HardwareComponentMeta | null>(null);
  const [selectedWire, setSelectedWire] = useState<WireConnection | null>(null);

  // Component Lock & Axis Rigidity Control
  const [lockedComponents, setLockedComponents] = useState<ComponentLockState>({
    'breadboard': true,
    'esp32-c3': true,
    'hx711': true,
    'load-cell-1': true,
    'load-cell-2': true,
    'load-cell-3': true,
    'load-cell-4': true,
    'load-cell-combiner': true,
    'mpu6050': true,
    'ds18b20': true,
    'l298n': true,
    'coin-motor': true,
    'buzzer': true,
    'traffic-leds': true,
  });

  // Wire routing geometry mode: Tight optimal Bézier vs lab sag slack
  const [routingMode, setRoutingMode] = useState<WireRoutingMode>('ALIGNED_ORTHOGONAL');
  const [isTracingConnections, setIsTracingConnections] = useState<boolean>(false);

  // Lock toggles
  const handleToggleLock = (id: string) => {
    setLockedComponents((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleLockAll = () => {
    setLockedComponents({
      'breadboard': true,
      'esp32-c3': true,
      'hx711': true,
      'load-cell-1': true,
      'load-cell-2': true,
      'load-cell-3': true,
      'load-cell-4': true,
      'load-cell-combiner': true,
      'mpu6050': true,
      'ds18b20': true,
      'l298n': true,
      'coin-motor': true,
      'buzzer': true,
      'traffic-leds': true,
    });
  };

  const handleUnlockAll = () => {
    setLockedComponents({
      'breadboard': false,
      'esp32-c3': false,
      'hx711': false,
      'load-cell-1': false,
      'load-cell-2': false,
      'load-cell-3': false,
      'load-cell-4': false,
      'load-cell-combiner': false,
      'mpu6050': false,
      'ds18b20': false,
      'l298n': false,
      'coin-motor': false,
      'buzzer': false,
      'traffic-leds': false,
    });
  };

  const handleRunLiveTrace = () => {
    setIsTracingConnections(true);
    setTimeout(() => {
      setIsTracingConnections(false);
    }, 1800);
  };

  // Modals
  const [activeModal, setActiveModal] = useState<'INSPECTOR' | 'VALIDATOR' | 'LOAD_CELL_CONFIG' | 'REAL_HARDWARE' | null>(null);

  // Load cell configurable mapping
  const [loadCellConfig, setLoadCellConfig] = useState<LoadCellWiringConfig>({
    ePlusColor: 'Red (#ef4444)',
    eMinusColor: 'Black (#1e293b)',
    aPlusColor: 'Twisted Black (#334155)',
    aMinusColor: 'Twisted White (#e2e8f0)',
  });

  // Initialize providers
  useEffect(() => {
    const sim = new SimulatedSensorDataProvider();
    const real = new RealESP32SensorDataProvider();
    simProviderRef.current = sim;
    realProviderRef.current = real;

    const unsubscribe = sim.subscribe((data) => {
      if (activeProvider === 'SIMULATION') {
        setTelemetry(data);
      }
    });

    return () => {
      unsubscribe();
      sim.pause();
    };
  }, []);

  // Update active provider subscription when toggled
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    if (activeProvider === 'REAL_HARDWARE' && realProviderRef.current) {
      unsubscribe = realProviderRef.current.subscribe((data) => {
        setTelemetry(data);
      });
    } else if (activeProvider === 'SIMULATION' && simProviderRef.current) {
      unsubscribe = simProviderRef.current.subscribe((data) => {
        setTelemetry(data);
      });
    }
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [activeProvider]);

  // Simulation Controls Handlers
  const handleStart = () => {
    setIsRunning(true);
    if (activeProvider === 'SIMULATION' && simProviderRef.current) {
      simProviderRef.current.start();
    }
  };

  const handlePause = () => {
    setIsRunning(false);
    if (activeProvider === 'SIMULATION' && simProviderRef.current) {
      simProviderRef.current.pause();
    }
  };

  const handleReset = () => {
    setActiveScenario('NORMAL');
    setIsRunning(true);
    if (activeProvider === 'SIMULATION' && simProviderRef.current) {
      simProviderRef.current.reset();
      simProviderRef.current.start();
    }
  };

  const handleSelectScenario = (scenario: ImpactScenario) => {
    setActiveScenario(scenario);
    if (activeProvider === 'SIMULATION' && simProviderRef.current) {
      simProviderRef.current.setScenario(scenario);
    }
  };

  const handleToggleViewMode = () => {
    setViewMode((prev) => (prev === 'HARDWARE' ? 'DIGITAL_TWIN' : 'HARDWARE'));
  };

  const handleOpenInspector = (comp: HardwareComponentMeta | null) => {
    setSelectedComponent(comp);
    if (comp) {
      setActiveModal('INSPECTOR');
    }
  };

  return (
    <div className="flex flex-col w-screen h-screen bg-[#0a0e17] text-slate-100 overflow-hidden select-none font-['Plus_Jakarta_Sans']">
      {/* Top Header Bar */}
      <Header
        viewMode={viewMode}
        systemStatus={telemetry.systemStatus}
        dataSource={telemetry.dataSource}
        onToggleViewMode={handleToggleViewMode}
        onOpenValidator={() => setActiveModal('VALIDATOR')}
        onOpenLoadCellConfig={() => setActiveModal('LOAD_CELL_CONFIG')}
        onOpenRealHardware={() => setActiveModal('REAL_HARDWARE')}
      />

      {/* Main Center Area: 3D Viewport + Right Telemetry Sidebar */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left/Center: 3D Scene Viewport */}
        <div className="flex-1 h-full relative">
          <Scene3D
            telemetry={telemetry}
            viewMode={viewMode}
            wires={wires}
            components={components}
            selectedComponent={selectedComponent}
            selectedWire={selectedWire}
            onSelectComponent={(comp) => {
              setSelectedComponent(comp);
            }}
            onSelectWire={(w) => setSelectedWire(w)}
            lockedComponents={lockedComponents}
            routingMode={routingMode}
            onToggleRoutingMode={(mode) => setRoutingMode(mode)}
            onAlignWiring={() => setRoutingMode('ALIGNED_ORTHOGONAL')}
            onOpenLockManager={() => setActiveModal('VALIDATOR')}
            isTracingConnections={isTracingConnections}
          />

          {/* Floating Selected Component Action Card */}
          {selectedComponent && (
            <div className="absolute bottom-6 right-6 z-20 max-w-xs p-4 bg-slate-900/95 backdrop-blur-md rounded-xl border border-cyan-500/60 shadow-2xl animate-in fade-in slide-in-from-bottom-2 select-none">
              <div className="flex items-center justify-between gap-3 mb-2 pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 text-[10px] font-mono bg-blue-900/80 border border-blue-500/40 text-blue-300 rounded">
                    {selectedComponent.category}
                  </span>
                  <h4 className="text-sm font-bold text-white font-['Chakra_Petch'] truncate max-w-[170px]">
                    {selectedComponent.name}
                  </h4>
                </div>
                <button
                  onClick={() => setSelectedComponent(null)}
                  className="text-slate-400 hover:text-white text-xs px-1.5 py-0.5 rounded hover:bg-slate-800 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-2 text-xs text-slate-300">
                <p className="text-[11px] text-slate-400 line-clamp-2">
                  {selectedComponent.description}
                </p>

                <div className="flex items-center justify-between p-2 bg-slate-950/80 rounded border border-slate-800 text-[11px] font-mono">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-slate-400">Live Status:</span>
                  </div>
                  <span className="text-cyan-300 font-semibold">{telemetry.systemStatus}</span>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => setActiveModal('INSPECTOR')}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-semibold text-cyan-300 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/50 rounded-lg transition-colors cursor-pointer shadow-sm"
                  >
                    <span>📋 Inspect Pinout</span>
                  </button>

                  <button
                    onClick={() => handleToggleLock(selectedComponent.id)}
                    title={
                      lockedComponents[selectedComponent.id]
                        ? 'Unlock Axis to Drag & Reposition'
                        : 'Lock Axis in Place'
                    }
                    className={`px-3 py-1.5 text-xs font-mono font-bold rounded-lg border transition-colors cursor-pointer flex items-center gap-1 ${
                      lockedComponents[selectedComponent.id]
                        ? 'bg-emerald-950/80 border-emerald-500/80 text-emerald-300'
                        : 'bg-amber-950/80 border-amber-500/80 text-amber-300'
                    }`}
                  >
                    <span>{lockedComponents[selectedComponent.id] ? '🔒 LOCKED ✓' : '🔓 UNLOCKED'}</span>
                  </button>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono bg-slate-950/60 p-2 rounded border border-slate-800/80">
                  <span>🖐</span>
                  <span>
                    {lockedComponents[selectedComponent.id]
                      ? 'Mechanically anchored on axis. Unlock to reposition.'
                      : 'Drag freely across workbench — wires stretch and follow!'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Floating Live Engineering Telemetry Dashboard */}
        <TelemetryDashboard
          telemetry={telemetry}
          components={components}
          onInspectComponent={handleOpenInspector}
        />
      </div>

      {/* Bottom Controls Bar */}
      <BottomControls
        isRunning={isRunning}
        activeScenario={activeScenario}
        viewMode={viewMode}
        onStart={handleStart}
        onPause={handlePause}
        onReset={handleReset}
        onSelectScenario={handleSelectScenario}
        onToggleViewMode={(mode) => setViewMode(mode)}
        onCheckConnections={() => setActiveModal('VALIDATOR')}
      />

      {/* Modals */}
      {activeModal === 'INSPECTOR' && selectedComponent && (
        <ComponentInspectorModal
          component={selectedComponent}
          telemetry={telemetry}
          onClose={() => {
            setActiveModal(null);
            setSelectedComponent(null);
          }}
        />
      )}

      {activeModal === 'VALIDATOR' && (
        <ComponentLockValidationPanel
          components={components}
          wires={wires}
          lockedComponents={lockedComponents}
          onToggleLock={handleToggleLock}
          onLockAll={handleLockAll}
          onUnlockAll={handleUnlockAll}
          routingMode={routingMode}
          onToggleRoutingMode={(mode) => setRoutingMode(mode)}
          onRunLiveTrace={handleRunLiveTrace}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'LOAD_CELL_CONFIG' && (
        <LoadCellConfigModal
          currentConfig={loadCellConfig}
          onSaveConfig={(cfg) => setLoadCellConfig(cfg)}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'REAL_HARDWARE' && realProviderRef.current && (
        <RealHardwareModal
          realProvider={realProviderRef.current}
          onConnected={() => setActiveProvider('REAL_HARDWARE')}
          onDisconnected={() => setActiveProvider('SIMULATION')}
          onClose={() => setActiveModal(null)}
        />
      )}
    </div>
  );
}
