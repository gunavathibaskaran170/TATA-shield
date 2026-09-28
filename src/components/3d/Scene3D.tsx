import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  SensorTelemetry,
  ViewMode,
  WireConnection,
  HardwareComponentMeta,
  ComponentLockState,
  WireRoutingMode,
} from '../../types/simulation';
import {
  createESDMat,
  createBreadboard,
  createESP32C3,
  createHX711Module,
  createSingleLoadCellWithPad,
  createWheatstoneCombinerBoard,
  createFourLoadCells,
  createMPU6050,
  createDS18B20,
  createL298N,
  createCoinMotor,
  createBuzzer,
  createTrafficLEDModule,
  createThroughHoleResistor,
  createEVChassis,
  createRealisticJumperWire,
  computeWirePath,
} from './modelGenerators';
import { buzzerAudio } from '../../services/BuzzerAudioEngine';

interface Scene3DProps {
  telemetry: SensorTelemetry;
  viewMode: ViewMode;
  wires: WireConnection[];
  components: HardwareComponentMeta[];
  selectedComponent: HardwareComponentMeta | null;
  selectedWire: WireConnection | null;
  onSelectComponent: (comp: HardwareComponentMeta | null) => void;
  onSelectWire: (wire: WireConnection | null) => void;
  lockedComponents?: ComponentLockState;
  routingMode?: WireRoutingMode;
  onToggleRoutingMode?: (mode: WireRoutingMode) => void;
  onAlignWiring?: () => void;
  onOpenLockManager?: () => void;
  isTracingConnections?: boolean;
}

interface ComponentEntity {
  id: string;
  name: string;
  group: THREE.Group;
  baseY: number;
  initialPos: THREE.Vector3;
  pinOffsets: Record<string, THREE.Vector3>;
}

export const Scene3D: React.FC<Scene3DProps> = ({
  telemetry,
  viewMode,
  wires,
  components,
  selectedComponent,
  selectedWire,
  onSelectComponent,
  onSelectWire,
  lockedComponents = {},
  routingMode = 'ALIGNED_ORTHOGONAL',
  onToggleRoutingMode,
  onAlignWiring,
  onOpenLockManager,
  isTracingConnections = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeCamPreset, setActiveCamPreset] = useState<'PERSPECTIVE' | 'TOP' | 'MACRO' | 'LOAD_CELLS'>('PERSPECTIVE');
  const [interactionMode, setInteractionMode] = useState<'ORBIT' | 'MOVE'>('ORBIT');
  const [draggingCompName, setDraggingCompName] = useState<string | null>(null);
  const [lockedToast, setLockedToast] = useState<{ componentName: string; visible: boolean } | null>(null);

  // References
  const threeRefs = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    controls: OrbitControls;
    animFrameId: number;
    clickableObjects: { mesh: THREE.Object3D; data: any; type: 'COMPONENT' | 'WIRE' }[];
    componentsMap: Map<string, ComponentEntity>;
    lockIndicatorsMap: Map<string, THREE.Group[]>;
    // LED Module References
    trafficLEDs?: {
      greenMesh: THREE.Mesh;
      yellowMesh: THREE.Mesh;
      redMesh: THREE.Mesh;
      greenLight: THREE.PointLight;
      yellowLight: THREE.PointLight;
      redLight: THREE.PointLight;
    };
    coinRotorMesh?: THREE.Mesh;
    coinGroup?: THREE.Group;
    buzzerRipple?: THREE.Mesh;
    wireMeshesMap: Map<string, { mesh: THREE.Mesh; wire: WireConnection }>;
    chassisMesh?: THREE.Group;
    digitalTwinGroup?: THREE.Group;
    hardwareGroup?: THREE.Group;
    dtStressMesh1?: THREE.Mesh;
    dtStressMesh2?: THREE.Mesh;
    dtImpactWave?: THREE.Mesh;
    groundHighlightMesh?: THREE.Mesh;
    // Dragging state
    isDraggingComponent: boolean;
    draggedComponent: ComponentEntity | null;
    dragPlane: THREE.Plane;
    dragOffset: THREE.Vector3;
    pointerStart: { x: number; y: number };
  } | null>(null);

  // Auto-dismiss locked toast
  useEffect(() => {
    if (lockedToast?.visible) {
      const timer = setTimeout(() => {
        setLockedToast((prev) => (prev ? { ...prev, visible: false } : null));
      }, 2600);
      return () => clearTimeout(timer);
    }
  }, [lockedToast]);

  // Helper to resolve pin world coordinate based on current component position and wire identity
  const getPinWorldPosition = (componentName: string, pinName: string, wireId?: string): THREE.Vector3 => {
    if (!threeRefs.current) return new THREE.Vector3(0, 0.01, 0);
    const { componentsMap } = threeRefs.current;

    // Check specific breadboard tie-point alignment when targeting Breadboard power rails
    if (componentName.includes('Breadboard')) {
      const bb = componentsMap.get('breadboard');
      if (bb) {
        // Top power bus lines: Red (+) at z = -0.024, Blue (-) at z = -0.020
        // Neatly distribute tie-point sockets along X according to connected device to avoid clustering
        let pinX = -0.032;
        const isVCC = pinName.includes('+') || pinName.includes('3.3V') || pinName.includes('VCC');
        const pinZ = isVCC ? -0.024 : -0.020;

        if (wireId) {
          if (wireId.includes('hx711')) pinX = -0.055;
          else if (wireId.includes('mpu6050')) pinX = -0.038;
          else if (wireId.includes('esp32')) pinX = -0.012;
          else if (wireId.includes('ds18b20')) pinX = 0.008;
          else if (wireId.includes('l298n-gnd')) pinX = 0.028;
          else if (wireId.includes('l298n-in4')) pinX = 0.038;
          else if (wireId.includes('buzzer')) pinX = 0.058;
        }

        return bb.group.position.clone().add(new THREE.Vector3(pinX, 0.0095, pinZ));
      }
    }

    let compId = '';
    if (componentName.includes('ESP32')) compId = 'esp32-c3';
    else if (componentName.includes('HX711')) compId = 'hx711';
    else if (componentName.includes('Load Cell 1') || componentName === 'LC1') compId = 'load-cell-1';
    else if (componentName.includes('Load Cell 2') || componentName === 'LC2') compId = 'load-cell-2';
    else if (componentName.includes('Load Cell 3') || componentName === 'LC3') compId = 'load-cell-3';
    else if (componentName.includes('Load Cell 4') || componentName === 'LC4') compId = 'load-cell-4';
    else if (componentName.includes('Combiner') || componentName.includes('Wheatstone')) compId = 'load-cell-combiner';
    else if (componentName.includes('Load Cell')) compId = 'load-cell-1';
    else if (componentName.includes('MPU6050')) compId = 'mpu6050';
    else if (componentName.includes('DS18B20')) compId = 'ds18b20';
    else if (componentName.includes('L298N')) compId = 'l298n';
    else if (componentName.includes('Coin Motor') || componentName.includes('Motor')) compId = 'coin-motor';
    else if (componentName.includes('Buzzer')) compId = 'buzzer';
    else if (componentName.includes('Traffic LED') || componentName.includes('LED Module')) compId = 'traffic-leds';
    else if (componentName.includes('Breadboard')) compId = 'breadboard';

    const entity = componentsMap.get(compId);
    if (entity) {
      const offset = entity.pinOffsets[pinName] || new THREE.Vector3(0, 0.005, 0);
      return entity.group.position.clone().add(offset);
    }

    return new THREE.Vector3(0, 0.01, 0);
  };

  // Recalculate a wire's 3D spline and update geometry with aligned Manhattan or tight routing
  const updateWire = (
    wire: WireConnection,
    mesh: THREE.Mesh,
    mode: WireRoutingMode = routingMode || 'ALIGNED_ORTHOGONAL'
  ) => {
    const startPos = getPinWorldPosition(wire.sourceComponent, wire.sourcePin, wire.id);
    const endPos = getPinWorldPosition(wire.targetComponent, wire.targetPin, wire.id);

    const path = computeWirePath(startPos, endPos, mode, wire);
    mesh.geometry.dispose();

    const isLoadCellLead = wire.id.includes('wire-lc');
    const wireRadius = isLoadCellLead ? 0.0009 : 0.0014;
    mesh.geometry = new THREE.TubeGeometry(path, 48, wireRadius, 8, false);

    // Update connector boots/terminations
    const liftOffset = isLoadCellLead ? 0.002 : 0.014;
    if (mesh.children.length >= 2) {
      mesh.children[0].position.copy(startPos.clone().add(new THREE.Vector3(0, liftOffset * 0.5, 0)));
      mesh.children[1].position.copy(endPos.clone().add(new THREE.Vector3(0, liftOffset * 0.5, 0)));
    } else if (mesh.children.length === 1 && isLoadCellLead) {
      mesh.children[0].position.copy(endPos.clone().add(new THREE.Vector3(0, 0.0009, 0)));
    }
  };

  // Update all wires attached to a specific component or all wires
  const updateAttachedWires = (mode: WireRoutingMode = routingMode || 'ALIGNED_ORTHOGONAL') => {
    if (!threeRefs.current) return;
    const { wireMeshesMap } = threeRefs.current;
    wireMeshesMap.forEach(({ mesh, wire }) => {
      updateWire(wire, mesh, mode);
    });
  };

  // Reset all components to initial reference positions and align all wiring
  const handleResetPositions = () => {
    if (!threeRefs.current) return;
    const { componentsMap } = threeRefs.current;
    componentsMap.forEach((entity) => {
      entity.group.position.copy(entity.initialPos);
    });
    updateAttachedWires(routingMode || 'ALIGNED_ORTHOGONAL');
  };

  // Initialize Three.js Scene
  useEffect(() => {
    if (!containerRef.current) return;
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0e17);
    scene.fog = new THREE.FogExp2(0x0a0e17, 0.8);

    // PerspectiveCamera with precise required parameters
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.01, 50);
    camera.position.set(0, 0.45, 0.65);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;

    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(renderer.domElement);

    // OrbitControls with exact specified parameters
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableZoom = true;
    controls.zoomSpeed = 1.2;
    controls.minDistance = 0.15;
    controls.maxDistance = 4.0;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(0, 0.02, 0);

    // Laboratory lighting setup
    const ambientLight = new THREE.AmbientLight(0xdbeafe, 0.85);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.6);
    keyLight.position.set(0.3, 0.8, 0.4);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.bias = -0.0001;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x38bdf8, 0.6);
    fillLight.position.set(-0.4, 0.5, -0.3);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xa855f7, 0.45);
    rimLight.position.set(0, 0.3, -0.5);
    scene.add(rimLight);

    // ESD Mat and Workbench Base
    const esdMat = createESDMat();
    scene.add(esdMat);

    // Ground position halo indicator when dragging
    const haloGeo = new THREE.RingGeometry(0.015, 0.035, 32);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0,
    });
    const groundHighlightMesh = new THREE.Mesh(haloGeo, haloMat);
    groundHighlightMesh.rotation.x = -Math.PI / 2;
    groundHighlightMesh.position.set(0, 0.0025, 0);
    scene.add(groundHighlightMesh);

    // Hardware and Digital Twin Groups
    const hardwareGroup = new THREE.Group();
    scene.add(hardwareGroup);

    const digitalTwinGroup = new THREE.Group();
    digitalTwinGroup.visible = false;
    scene.add(digitalTwinGroup);

    const clickableObjects: { mesh: THREE.Object3D; data: any; type: 'COMPONENT' | 'WIRE' }[] = [];
    const wireMeshesMap = new Map<string, { mesh: THREE.Mesh; wire: WireConnection }>();
    const componentsMap = new Map<string, ComponentEntity>();
    const lockIndicatorsMap = new Map<string, THREE.Group[]>();

    // ==========================================
    // 1. POPULATE HARDWARE COMPONENTS (BENCHTOP TWIN)
    // ==========================================

    // 1. Solderless Breadboard (Centered on ESD mat)
    const breadboard = createBreadboard();
    const bbInitialPos = new THREE.Vector3(0.015, 0.002, 0.015);
    breadboard.position.copy(bbInitialPos);
    hardwareGroup.add(breadboard);

    componentsMap.set('breadboard', {
      id: 'breadboard',
      name: 'Breadboard',
      group: breadboard,
      baseY: 0.002,
      initialPos: bbInitialPos.clone(),
      pinOffsets: {
        '+ 3.3V': new THREE.Vector3(-0.032, 0.0095, -0.024),
        '- GND': new THREE.Vector3(-0.032, 0.0095, -0.020),
      },
    });

    // 2. ESP32-C3 Microcontroller (Mounted on breadboard center with USB-C power)
    const esp32 = createESP32C3();
    const esp32InitialPos = new THREE.Vector3(0.015, 0.011, 0.015);
    esp32.position.copy(esp32InitialPos);
    hardwareGroup.add(esp32);
    componentsMap.set('esp32-c3', {
      id: 'esp32-c3',
      name: 'ESP32-C3 DevKit',
      group: esp32,
      baseY: 0.011,
      initialPos: esp32InitialPos.clone(),
      pinOffsets: {
        '3.3V': new THREE.Vector3(-0.0118, 0.001, -0.005),
        'GND': new THREE.Vector3(-0.0118, 0.001, -0.010),
        '5V/VIN': new THREE.Vector3(-0.0118, 0.001, -0.015),
        'GPIO 0': new THREE.Vector3(0.0118, 0.001, 0.010),
        'GPIO 1': new THREE.Vector3(0.0118, 0.001, 0.005),
        'GPIO 3': new THREE.Vector3(-0.0118, 0.001, 0.008),
        'GPIO 4': new THREE.Vector3(-0.0118, 0.001, 0.013),
        'GPIO 5': new THREE.Vector3(-0.0118, 0.001, 0.017),
        'GPIO 6': new THREE.Vector3(0.0118, 0.001, -0.015),
        'GPIO 7': new THREE.Vector3(0.0118, 0.001, -0.010),
        'GPIO 8': new THREE.Vector3(0.0118, 0.001, -0.005),
        'GPIO 9': new THREE.Vector3(0.0118, 0.001, 0.0),
        'GPIO 10': new THREE.Vector3(0.0118, 0.001, 0.014),
      },
    });
    clickableObjects.push({
      mesh: esp32,
      data: components.find((c) => c.id === 'esp32-c3'),
      type: 'COMPONENT',
    });

    // 3. HX711 ADC Module (Placed left of breadboard)
    const hx711 = createHX711Module();
    const hxInitialPos = new THREE.Vector3(-0.075, 0.002, -0.010);
    hx711.position.copy(hxInitialPos);
    hardwareGroup.add(hx711);
    componentsMap.set('hx711', {
      id: 'hx711',
      name: 'HX711 ADC Module',
      group: hx711,
      baseY: 0.002,
      initialPos: hxInitialPos.clone(),
      pinOffsets: {
        'VCC': new THREE.Vector3(0.0095, 0.0025, -0.006),
        'DT': new THREE.Vector3(0.0095, 0.0025, -0.002),
        'SCK': new THREE.Vector3(0.0095, 0.0025, 0.002),
        'GND': new THREE.Vector3(0.0095, 0.0025, 0.006),
        'E+': new THREE.Vector3(-0.0095, 0.0025, -0.006),
        'E-': new THREE.Vector3(-0.0095, 0.0025, -0.002),
        'A+': new THREE.Vector3(-0.0095, 0.0025, 0.002),
        'A-': new THREE.Vector3(-0.0095, 0.0025, 0.006),
      },
    });
    clickableObjects.push({
      mesh: hx711,
      data: components.find((c) => c.id === 'hx711'),
      type: 'COMPONENT',
    });

    // 4. INDIVIDUAL 4x 50kg HALF-BRIDGE LOAD CELLS + WHEATSTONE COMBINER BOARD
    // Each load cell is its own entity: independently movable, drag-enabled, and axis-lockable

    // 4a. Load Cell 1 (Front-Left)
    const lc1 = createSingleLoadCellWithPad('LC1 (Front-Left 50kg)');
    const lc1InitialPos = new THREE.Vector3(-0.205, 0.001, -0.055);
    lc1.position.copy(lc1InitialPos);
    hardwareGroup.add(lc1);
    componentsMap.set('load-cell-1', {
      id: 'load-cell-1',
      name: 'Load Cell 1 (Front-Left 50kg)',
      group: lc1,
      baseY: 0.001,
      initialPos: lc1InitialPos.clone(),
      pinOffsets: {
        'Red (Lead +)': new THREE.Vector3(0.024, 0.0039, -0.0012),
        'Black (Lead -)': new THREE.Vector3(0.024, 0.0039, 0.0),
        'White (Center Tap)': new THREE.Vector3(0.024, 0.0039, 0.0012),
      },
    });
    clickableObjects.push({
      mesh: lc1,
      data: components.find((c) => c.id === 'load-cell-1'),
      type: 'COMPONENT',
    });

    // 4b. Load Cell 2 (Front-Right) - Rotated 180° so leads face inward to combiner
    const lc2 = createSingleLoadCellWithPad('LC2 (Front-Right 50kg)');
    const lc2InitialPos = new THREE.Vector3(-0.125, 0.001, -0.055);
    lc2.position.copy(lc2InitialPos);
    lc2.rotation.y = Math.PI;
    hardwareGroup.add(lc2);
    componentsMap.set('load-cell-2', {
      id: 'load-cell-2',
      name: 'Load Cell 2 (Front-Right 50kg)',
      group: lc2,
      baseY: 0.001,
      initialPos: lc2InitialPos.clone(),
      pinOffsets: {
        'Red (Lead +)': new THREE.Vector3(-0.024, 0.0039, 0.0012),
        'Black (Lead -)': new THREE.Vector3(-0.024, 0.0039, 0.0),
        'White (Center Tap)': new THREE.Vector3(-0.024, 0.0039, -0.0012),
      },
    });
    clickableObjects.push({
      mesh: lc2,
      data: components.find((c) => c.id === 'load-cell-2'),
      type: 'COMPONENT',
    });

    // 4c. Load Cell 3 (Rear-Left)
    const lc3 = createSingleLoadCellWithPad('LC3 (Rear-Left 50kg)');
    const lc3InitialPos = new THREE.Vector3(-0.205, 0.001, 0.035);
    lc3.position.copy(lc3InitialPos);
    hardwareGroup.add(lc3);
    componentsMap.set('load-cell-3', {
      id: 'load-cell-3',
      name: 'Load Cell 3 (Rear-Left 50kg)',
      group: lc3,
      baseY: 0.001,
      initialPos: lc3InitialPos.clone(),
      pinOffsets: {
        'Red (Lead +)': new THREE.Vector3(0.024, 0.0039, -0.0012),
        'Black (Lead -)': new THREE.Vector3(0.024, 0.0039, 0.0),
        'White (Center Tap)': new THREE.Vector3(0.024, 0.0039, 0.0012),
      },
    });
    clickableObjects.push({
      mesh: lc3,
      data: components.find((c) => c.id === 'load-cell-3'),
      type: 'COMPONENT',
    });

    // 4d. Load Cell 4 (Rear-Right) - Rotated 180° so leads face inward to combiner
    const lc4 = createSingleLoadCellWithPad('LC4 (Rear-Right 50kg)');
    const lc4InitialPos = new THREE.Vector3(-0.125, 0.001, 0.035);
    lc4.position.copy(lc4InitialPos);
    lc4.rotation.y = Math.PI;
    hardwareGroup.add(lc4);
    componentsMap.set('load-cell-4', {
      id: 'load-cell-4',
      name: 'Load Cell 4 (Rear-Right 50kg)',
      group: lc4,
      baseY: 0.001,
      initialPos: lc4InitialPos.clone(),
      pinOffsets: {
        'Red (Lead +)': new THREE.Vector3(-0.024, 0.0039, 0.0012),
        'Black (Lead -)': new THREE.Vector3(-0.024, 0.0039, 0.0),
        'White (Center Tap)': new THREE.Vector3(-0.024, 0.0039, -0.0012),
      },
    });
    clickableObjects.push({
      mesh: lc4,
      data: components.find((c) => c.id === 'load-cell-4'),
      type: 'COMPONENT',
    });

    // 4e. Wheatstone Bridge Combiner Board
    const combinerBoard = createWheatstoneCombinerBoard();
    const combInitialPos = new THREE.Vector3(-0.165, 0.002, -0.010);
    combinerBoard.position.copy(combInitialPos);
    hardwareGroup.add(combinerBoard);
    componentsMap.set('load-cell-combiner', {
      id: 'load-cell-combiner',
      name: 'Wheatstone Bridge Combiner Board',
      group: combinerBoard,
      baseY: 0.002,
      initialPos: combInitialPos.clone(),
      pinOffsets: {
        'LC1 Red': new THREE.Vector3(-0.013, 0.0022, -0.008),
        'LC1 Black': new THREE.Vector3(-0.013, 0.0022, -0.005),
        'LC1 White': new THREE.Vector3(-0.013, 0.0022, -0.002),
        'LC2 Red': new THREE.Vector3(0.005, 0.0022, -0.008),
        'LC2 Black': new THREE.Vector3(0.005, 0.0022, -0.005),
        'LC2 White': new THREE.Vector3(0.005, 0.0022, -0.002),
        'LC3 Red': new THREE.Vector3(-0.013, 0.0022, 0.002),
        'LC3 Black': new THREE.Vector3(-0.013, 0.0022, 0.005),
        'LC3 White': new THREE.Vector3(-0.013, 0.0022, 0.008),
        'LC4 Red': new THREE.Vector3(0.005, 0.0022, 0.002),
        'LC4 Black': new THREE.Vector3(0.005, 0.0022, 0.005),
        'LC4 White': new THREE.Vector3(0.005, 0.0022, 0.008),
        'Bridge E+': new THREE.Vector3(0.013, 0.0022, -0.006),
        'Bridge E-': new THREE.Vector3(0.013, 0.0022, -0.002),
        'Bridge A+': new THREE.Vector3(0.013, 0.0022, 0.002),
        'Bridge A-': new THREE.Vector3(0.013, 0.0022, 0.006),
      },
    });
    clickableObjects.push({
      mesh: combinerBoard,
      data: components.find((c) => c.id === 'load-cell-combiner'),
      type: 'COMPONENT',
    });

    // 5. MPU6050 6-DoF IMU (Seated on breadboard lower-left bank)
    const mpu6050 = createMPU6050();
    const mpuInitialPos = new THREE.Vector3(-0.040, 0.011, 0.025);
    mpu6050.position.copy(mpuInitialPos);
    hardwareGroup.add(mpu6050);
    componentsMap.set('mpu6050', {
      id: 'mpu6050',
      name: 'MPU6050 IMU',
      group: mpu6050,
      baseY: 0.011,
      initialPos: mpuInitialPos.clone(),
      pinOffsets: {
        'VCC': new THREE.Vector3(-0.0085, 0.0025, -0.0085),
        'GND': new THREE.Vector3(-0.0061, 0.0025, -0.0085),
        'SCL': new THREE.Vector3(-0.0037, 0.0025, -0.0085),
        'SDA': new THREE.Vector3(-0.0013, 0.0025, -0.0085),
      },
    });
    clickableObjects.push({
      mesh: mpu6050,
      data: components.find((c) => c.id === 'mpu6050'),
      type: 'COMPONENT',
    });

    // 6. DS18B20 Waterproof Temp Probe (Resting on ESD mat in front)
    const ds18b20 = createDS18B20();
    const dsInitialPos = new THREE.Vector3(-0.025, 0.003, 0.090);
    ds18b20.position.copy(dsInitialPos);
    hardwareGroup.add(ds18b20);
    componentsMap.set('ds18b20', {
      id: 'ds18b20',
      name: 'DS18B20 Temp Probe',
      group: ds18b20,
      baseY: 0.003,
      initialPos: dsInitialPos.clone(),
      pinOffsets: {
        'VCC (Red)': new THREE.Vector3(0.035, 0.002, -0.001),
        'GND (Black)': new THREE.Vector3(0.037, 0.002, 0.0),
        'DATA (Yellow)': new THREE.Vector3(0.039, 0.002, 0.001),
      },
    });
    clickableObjects.push({
      mesh: ds18b20,
      data: components.find((c) => c.id === 'ds18b20'),
      type: 'COMPONENT',
    });

    // DS18B20 4.7kΩ Pull-up Resistor (between 3.3V and GPIO 5 on breadboard)
    const pullUpResistor = createThroughHoleResistor([0xeab308, 0x8b5cf6, 0xef4444, 0xf59e0b]);
    pullUpResistor.position.set(-0.010, 0.014, 0.032);
    hardwareGroup.add(pullUpResistor);

    // 7. L298N Motor Driver Module (Upper area of workbench mat)
    const l298n = createL298N();
    const l298InitialPos = new THREE.Vector3(0.015, 0.002, -0.085);
    l298n.position.copy(l298InitialPos);
    hardwareGroup.add(l298n);
    componentsMap.set('l298n', {
      id: 'l298n',
      name: 'L298N Motor Driver',
      group: l298n,
      baseY: 0.002,
      initialPos: l298InitialPos.clone(),
      pinOffsets: {
        '12V/VCC': new THREE.Vector3(-0.006, 0.0065, 0.016),
        'GND': new THREE.Vector3(-0.001, 0.0065, 0.016),
        'IN3': new THREE.Vector3(0.002, 0.0035, 0.009),
        'IN4': new THREE.Vector3(0.0064, 0.0035, 0.009),
        'OUT3': new THREE.Vector3(0.017, 0.0065, -0.002),
        'OUT4': new THREE.Vector3(0.017, 0.0065, 0.004),
      },
    });
    clickableObjects.push({
      mesh: l298n,
      data: components.find((c) => c.id === 'l298n'),
      type: 'COMPONENT',
    });

    // 8. Coin Vibration Motor (Resting on ESD mat with foam tape)
    const { group: coinMotor, rotorMesh: coinRotor } = createCoinMotor();
    const coinInitialPos = new THREE.Vector3(0.080, 0.002, -0.080);
    coinMotor.position.copy(coinInitialPos);
    hardwareGroup.add(coinMotor);
    componentsMap.set('coin-motor', {
      id: 'coin-motor',
      name: 'Coin Vibration Motor',
      group: coinMotor,
      baseY: 0.002,
      initialPos: coinInitialPos.clone(),
      pinOffsets: {
        'Lead (+) Red': new THREE.Vector3(-0.006, 0.0015, -0.002),
        'Lead (-) Blue/Black': new THREE.Vector3(-0.006, 0.0015, 0.002),
      },
    });
    clickableObjects.push({
      mesh: coinMotor,
      data: components.find((c) => c.id === 'coin-motor'),
      type: 'COMPONENT',
    });

    // 9. Active Piezo Buzzer (Seated in breadboard right bank tie-points)
    const { group: buzzer, rippleMesh: buzzerRip } = createBuzzer();
    const buzzerInitialPos = new THREE.Vector3(0.070, 0.011, 0.024);
    buzzer.position.copy(buzzerInitialPos);
    hardwareGroup.add(buzzer);
    componentsMap.set('buzzer', {
      id: 'buzzer',
      name: 'Active Buzzer',
      group: buzzer,
      baseY: 0.011,
      initialPos: buzzerInitialPos.clone(),
      pinOffsets: {
        'Positive (+) Long Pin': new THREE.Vector3(-0.004, 0.0015, 0.0),
        'Negative (-) Short Pin': new THREE.Vector3(0.0, 0.0015, 0.004),
      },
    });
    clickableObjects.push({
      mesh: buzzer,
      data: components.find((c) => c.id === 'buzzer'),
      type: 'COMPONENT',
    });

    // 10. INDUSTRIAL 3-LED TRAFFIC LIGHT BREAKOUT PCB MODULE
    const ledModuleObj = createTrafficLEDModule();
    const ledModulePos = new THREE.Vector3(0.145, 0.002, 0.010);
    ledModuleObj.group.position.copy(ledModulePos);
    hardwareGroup.add(ledModuleObj.group);

    componentsMap.set('traffic-leds', {
      id: 'traffic-leds',
      name: 'Industrial Traffic LED Breakout Module',
      group: ledModuleObj.group,
      baseY: 0.002,
      initialPos: ledModulePos.clone(),
      pinOffsets: {
        'Pin 1: GND': new THREE.Vector3(-0.0038, 0.0025, 0.0075),
        'Pin 2: RED': new THREE.Vector3(-0.00126, 0.0025, 0.0075),
        'Pin 3: YEL': new THREE.Vector3(0.00126, 0.0025, 0.0075),
        'Pin 4: GRN': new THREE.Vector3(0.0038, 0.0025, 0.0075),
      },
    });
    clickableObjects.push({
      mesh: ledModuleObj.group,
      data: components.find((c) => c.id === 'traffic-leds'),
      type: 'COMPONENT',
    });

    // ==========================================
    // 2. 3D REALISTIC JUMPER WIRES WITH DUPONT BOOTS & LOW-PROFILE LEADS
    // ==========================================
    wires.forEach((wire) => {
      const start = getPinWorldPosition(wire.sourceComponent, wire.sourcePin, wire.id);
      const end = getPinWorldPosition(wire.targetComponent, wire.targetPin, wire.id);

      const colorHex = parseInt(wire.color.replace('#', '0x'), 16);
      const { mesh } = createRealisticJumperWire(start, end, colorHex, 0.03, 0.0014, routingMode, wire);
      mesh.name = wire.name;
      mesh.userData = { wireId: wire.id, wire };
      hardwareGroup.add(mesh);

      wireMeshesMap.set(wire.id, { mesh, wire });
      clickableObjects.push({
        mesh,
        data: wire,
        type: 'WIRE',
      });
    });

    // ==========================================
    // 3. DIGITAL TWIN SCENE
    // ==========================================
    const dtChassis = createEVChassis();
    dtChassis.position.set(0, 0, 0);
    dtChassis.scale.set(1.4, 1.4, 1.4);
    digitalTwinGroup.add(dtChassis);

    const stressGeo = new THREE.CylinderGeometry(0.024, 0.024, 0.006, 24);
    const stressMat1 = new THREE.MeshStandardMaterial({
      color: 0x22c55e,
      emissive: 0x22c55e,
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: 0.85,
    });
    const dtStressMesh1 = new THREE.Mesh(stressGeo, stressMat1);
    dtStressMesh1.position.set(-0.196, 0.024, -0.14);
    digitalTwinGroup.add(dtStressMesh1);

    const stressMat2 = new THREE.MeshStandardMaterial({
      color: 0x22c55e,
      emissive: 0x22c55e,
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: 0.85,
    });
    const dtStressMesh2 = new THREE.Mesh(stressGeo, stressMat2);
    dtStressMesh2.position.set(0.196, 0.024, -0.14);
    digitalTwinGroup.add(dtStressMesh2);

    const waveGeo = new THREE.RingGeometry(0.01, 0.08, 32);
    const waveMat = new THREE.MeshBasicMaterial({
      color: 0xef4444,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0,
    });
    const dtImpactWave = new THREE.Mesh(waveGeo, waveMat);
    dtImpactWave.rotation.x = -Math.PI / 2;
    dtImpactWave.position.set(0, 0.03, -0.25);
    digitalTwinGroup.add(dtImpactWave);

    threeRefs.current = {
      scene,
      camera,
      renderer,
      controls,
      animFrameId: 0,
      clickableObjects,
      componentsMap,
      lockIndicatorsMap,
      trafficLEDs: {
        greenMesh: ledModuleObj.greenMesh,
        yellowMesh: ledModuleObj.yellowMesh,
        redMesh: ledModuleObj.redMesh,
        greenLight: ledModuleObj.greenLight,
        yellowLight: ledModuleObj.yellowLight,
        redLight: ledModuleObj.redLight,
      },
      coinRotorMesh: coinRotor,
      coinGroup: coinMotor,
      buzzerRipple: buzzerRip,
      wireMeshesMap,
      digitalTwinGroup,
      hardwareGroup,
      dtStressMesh1,
      dtStressMesh2,
      dtImpactWave,
      groundHighlightMesh,
      isDraggingComponent: false,
      draggedComponent: null,
      dragPlane: new THREE.Plane(new THREE.Vector3(0, 1, 0), 0),
      dragOffset: new THREE.Vector3(),
      pointerStart: { x: 0, y: 0 },
    };

    // Render Loop
    const animate = () => {
      if (threeRefs.current) {
        const { controls, renderer, scene, camera } = threeRefs.current;
        controls.update();

        // Sound sync for active buzzer
        if (telemetry.buzzerActive) {
          buzzerAudio.play(telemetry.buzzerFrequency || 2800);
        } else {
          buzzerAudio.stop();
        }

        renderer.render(scene, camera);
        threeRefs.current.animFrameId = requestAnimationFrame(animate);
      }
    };
    threeRefs.current.animFrameId = requestAnimationFrame(animate);

    // Handle Resize
    const handleResize = () => {
      if (!containerRef.current || !threeRefs.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      threeRefs.current.camera.aspect = w / h;
      threeRefs.current.camera.updateProjectionMatrix();
      threeRefs.current.renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (threeRefs.current) {
        cancelAnimationFrame(threeRefs.current.animFrameId);
        threeRefs.current.controls.dispose();
        threeRefs.current.renderer.dispose();
      }
      buzzerAudio.stop();
    };
  }, []);

  // Update View Mode (Hardware vs Digital Twin)
  useEffect(() => {
    if (!threeRefs.current) return;
    const { hardwareGroup, digitalTwinGroup, camera, controls } = threeRefs.current;

    if (viewMode === 'HARDWARE') {
      if (hardwareGroup) hardwareGroup.visible = true;
      if (digitalTwinGroup) digitalTwinGroup.visible = false;
      camera.position.set(0, 0.42, 0.60);
      controls.target.set(0, 0.015, 0);
    } else {
      if (hardwareGroup) hardwareGroup.visible = false;
      if (digitalTwinGroup) digitalTwinGroup.visible = true;
      camera.position.set(0, 0.55, 0.85);
      controls.target.set(0, 0.03, -0.05);
    }
    controls.update();
  }, [viewMode]);

  // Update LED Emissive Lighting & Actuators
  useEffect(() => {
    if (!threeRefs.current) return;
    const {
      trafficLEDs,
      coinRotorMesh,
      buzzerRipple,
      dtStressMesh1,
      dtStressMesh2,
      dtImpactWave,
      digitalTwinGroup,
    } = threeRefs.current;

    // Traffic LED Emissive Lighting & PointLights
    if (trafficLEDs) {
      const gMat = trafficLEDs.greenMesh.material as THREE.MeshPhysicalMaterial;
      const yMat = trafficLEDs.yellowMesh.material as THREE.MeshPhysicalMaterial;
      const rMat = trafficLEDs.redMesh.material as THREE.MeshPhysicalMaterial;

      // Green LED
      if (telemetry.ledGreen) {
        gMat.emissive.setHex(0x22c55e);
        gMat.emissiveIntensity = 2.5;
        trafficLEDs.greenLight.intensity = 1.0;
      } else {
        gMat.emissive.setHex(0x000000);
        gMat.emissiveIntensity = 0.0;
        trafficLEDs.greenLight.intensity = 0.0;
      }

      // Yellow LED
      if (telemetry.ledYellow) {
        yMat.emissive.setHex(0xeab308);
        yMat.emissiveIntensity = 2.5;
        trafficLEDs.yellowLight.intensity = 1.0;
      } else {
        yMat.emissive.setHex(0x000000);
        yMat.emissiveIntensity = 0.0;
        trafficLEDs.yellowLight.intensity = 0.0;
      }

      // Red LED
      if (telemetry.ledRed) {
        rMat.emissive.setHex(0xef4444);
        rMat.emissiveIntensity = 2.5;
        trafficLEDs.redLight.intensity = 1.0;
      } else {
        rMat.emissive.setHex(0x000000);
        rMat.emissiveIntensity = 0.0;
        trafficLEDs.redLight.intensity = 0.0;
      }
    }

    // Coin Motor Rotor
    if (coinRotorMesh && telemetry.vibrationMotorActive) {
      coinRotorMesh.rotation.z += 0.8;
    }

    // Buzzer Waves
    if (buzzerRipple) {
      const ripMat = buzzerRipple.material as THREE.MeshBasicMaterial;
      if (telemetry.buzzerActive) {
        buzzerRipple.scale.addScalar(0.04);
        if (buzzerRipple.scale.x > 2.0) buzzerRipple.scale.set(0.6, 0.6, 0.6);
        ripMat.opacity = Math.max(0, 1.0 - (buzzerRipple.scale.x - 0.6) / 1.4);
      } else {
        ripMat.opacity = 0;
        buzzerRipple.scale.set(0.6, 0.6, 0.6);
      }
    }

    // Digital Twin Heatmap
    const statusColor =
      telemetry.systemStatus === 'CRITICAL'
        ? 0xef4444
        : telemetry.systemStatus === 'WARNING'
        ? 0xeab308
        : 0x22c55e;

    if (dtStressMesh1) {
      const m = dtStressMesh1.material as THREE.MeshStandardMaterial;
      m.color.setHex(statusColor);
      m.emissive.setHex(statusColor);
      const scale = 1.0 + Math.min(1.2, telemetry.strainMicroStrain / 1000);
      dtStressMesh1.scale.set(scale, 1, scale);
    }

    if (dtStressMesh2) {
      const m = dtStressMesh2.material as THREE.MeshStandardMaterial;
      m.color.setHex(statusColor);
      m.emissive.setHex(statusColor);
      const scale = 1.0 + Math.min(1.2, telemetry.strainMicroStrain / 1050);
      dtStressMesh2.scale.set(scale, 1, scale);
    }

    if (dtImpactWave) {
      const m = dtImpactWave.material as THREE.MeshBasicMaterial;
      if (telemetry.activeScenario !== 'NORMAL' && telemetry.scenarioProgress < 0.9) {
        dtImpactWave.scale.addScalar(0.05);
        if (dtImpactWave.scale.x > 3.0) dtImpactWave.scale.set(0.8, 0.8, 0.8);
        m.opacity = (1.0 - telemetry.scenarioProgress) * 0.9;
      } else {
        m.opacity = 0;
        dtImpactWave.scale.set(0.8, 0.8, 0.8);
      }
    }

    if (digitalTwinGroup) {
      digitalTwinGroup.rotation.z = THREE.MathUtils.degToRad(-telemetry.roll * 0.8);
      digitalTwinGroup.rotation.x = THREE.MathUtils.degToRad(telemetry.pitch * 0.8);
    }
  }, [telemetry]);

  // Highlight Selected Wire
  useEffect(() => {
    if (!threeRefs.current) return;
    const { wireMeshesMap } = threeRefs.current;

    wireMeshesMap.forEach(({ mesh }, wireId) => {
      const mat = mesh.material as THREE.MeshStandardMaterial;
      if (selectedWire && selectedWire.id === wireId) {
        mat.emissive.setHex(0x38bdf8);
        mat.emissiveIntensity = 0.9;
        mesh.scale.set(1.4, 1.4, 1.4);
      } else {
        mat.emissive.setHex(0x000000);
        mat.emissiveIntensity = 0.0;
        mesh.scale.set(1.0, 1.0, 1.0);
      }
    });
  }, [selectedWire]);

  // Focus and select component
  useEffect(() => {
    if (selectedComponent && threeRefs.current) {
      const { groundHighlightMesh, componentsMap } = threeRefs.current;
      const entity = componentsMap.get(selectedComponent.id);
      if (entity && groundHighlightMesh) {
        groundHighlightMesh.position.x = entity.group.position.x;
        groundHighlightMesh.position.z = entity.group.position.z;
        (groundHighlightMesh.material as THREE.MeshBasicMaterial).opacity = 0.6;
      }
    } else if (threeRefs.current?.groundHighlightMesh) {
      (threeRefs.current.groundHighlightMesh.material as THREE.MeshBasicMaterial).opacity = 0;
    }
  }, [selectedComponent]);

  // Sync 3D lock icons visibility whenever lockedComponents state changes
  useEffect(() => {
    if (!threeRefs.current || !lockedComponents) return;
    const { lockIndicatorsMap } = threeRefs.current;
    lockIndicatorsMap.forEach((indicators, compId) => {
      const isLocked = Boolean(lockedComponents[compId]);
      indicators.forEach((ind) => {
        ind.visible = isLocked;
      });
    });
  }, [lockedComponents]);

  // Sync wire geometry when wire routing mode changes (Tight Validated vs Lab Slack)
  useEffect(() => {
    if (routingMode) {
      updateAttachedWires(routingMode);
    }
  }, [routingMode]);

  // Live progressive electrical wire-trace pulse animation
  useEffect(() => {
    if (!threeRefs.current || !isTracingConnections) return;
    const { wireMeshesMap } = threeRefs.current;
    const wireEntries = Array.from(wireMeshesMap.values());
    let step = 0;
    const interval = setInterval(() => {
      wireEntries.forEach(({ mesh }, i) => {
        const mat = mesh.material as THREE.MeshStandardMaterial;
        if (i === step % wireEntries.length) {
          mat.emissive.setHex(0x10b981);
          mat.emissiveIntensity = 2.4;
        } else {
          mat.emissive.setHex(0x000000);
          mat.emissiveIntensity = 0.0;
        }
      });
      step++;
    }, 110);

    return () => {
      clearInterval(interval);
      wireEntries.forEach(({ mesh }) => {
        const mat = mesh.material as THREE.MeshStandardMaterial;
        mat.emissive.setHex(0x000000);
        mat.emissiveIntensity = 0.0;
      });
    };
  }, [isTracingConnections]);

  // Camera Presets
  const setCameraPreset = (preset: 'PERSPECTIVE' | 'TOP' | 'MACRO' | 'LOAD_CELLS') => {
    if (!threeRefs.current) return;
    setActiveCamPreset(preset);
    const { camera, controls } = threeRefs.current;

    if (preset === 'PERSPECTIVE') {
      camera.position.set(0, 0.42, 0.60);
      controls.target.set(0, 0.015, 0);
    } else if (preset === 'TOP') {
      camera.position.set(0, 0.65, 0.005);
      controls.target.set(0, 0, 0);
    } else if (preset === 'MACRO') {
      camera.position.set(0.015, 0.18, 0.22);
      controls.target.set(0.015, 0.011, 0.015);
    } else if (preset === 'LOAD_CELLS') {
      camera.position.set(-0.165, 0.18, 0.16);
      controls.target.set(-0.165, 0.005, -0.01);
    }
    controls.update();
  };

  // MOUSE & POINTER INTERACTION (OrbitControls + Component Dragging)
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!threeRefs.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    );

    threeRefs.current.pointerStart = { x: e.clientX, y: e.clientY };

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, threeRefs.current.camera);

    // If in MOVE mode or left click, check for component picking
    if (interactionMode === 'MOVE' || e.button === 0) {
      const { componentsMap } = threeRefs.current;
      const componentMeshes: THREE.Object3D[] = [];
      componentsMap.forEach((entity) => componentMeshes.push(entity.group));

      const intersects = raycaster.intersectObjects(componentMeshes, true);
      if (intersects.length > 0) {
        let hitMesh: THREE.Object3D | null = intersects[0].object;
        let matchedEntity: ComponentEntity | null = null;

        while (hitMesh) {
          for (const entity of componentsMap.values()) {
            if (entity.group === hitMesh) {
              matchedEntity = entity;
              break;
            }
          }
          if (matchedEntity) break;
          hitMesh = hitMesh.parent;
        }

        if (matchedEntity) {
          const compMeta = components.find((c) => c.id === matchedEntity!.id) || null;
          onSelectComponent(compMeta);
          onSelectWire(null);

          // Check if component is mechanically locked on its axis
          const isLocked = Boolean(lockedComponents?.[matchedEntity.id] ?? true);
          if (isLocked) {
            // Rigid mechanical axis lock! Prevent dragging and show visual feedback
            setLockedToast({
              componentName: matchedEntity.name,
              visible: true,
            });
            return;
          }

          // Disable OrbitControls while dragging component
          threeRefs.current.controls.enabled = false;
          threeRefs.current.isDraggingComponent = true;
          threeRefs.current.draggedComponent = matchedEntity;
          setDraggingCompName(matchedEntity.name);

          threeRefs.current.dragPlane.set(new THREE.Vector3(0, 1, 0), -matchedEntity.group.position.y);
          const planeIntersect = new THREE.Vector3();
          raycaster.ray.intersectPlane(threeRefs.current.dragPlane, planeIntersect);
          threeRefs.current.dragOffset.subVectors(matchedEntity.group.position, planeIntersect);

          if (threeRefs.current.groundHighlightMesh) {
            threeRefs.current.groundHighlightMesh.position.x = matchedEntity.group.position.x;
            threeRefs.current.groundHighlightMesh.position.z = matchedEntity.group.position.z;
            (threeRefs.current.groundHighlightMesh.material as THREE.MeshBasicMaterial).opacity = 0.8;
          }
          return;
        }
      }
    }

    // Check wire selection
    const wireMeshes = Array.from(threeRefs.current.wireMeshesMap.values()).map((w) => w.mesh);
    const wireIntersects = raycaster.intersectObjects(wireMeshes, true);
    if (wireIntersects.length > 0) {
      let wireHit = wireIntersects[0].object;
      while (wireHit && !wireHit.userData?.wire) {
        wireHit = wireHit.parent as THREE.Object3D;
      }
      if (wireHit?.userData?.wire) {
        onSelectWire(wireHit.userData.wire);
        onSelectComponent(null);
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!threeRefs.current || !containerRef.current) return;
    const { isDraggingComponent, draggedComponent } = threeRefs.current;

    if (isDraggingComponent && draggedComponent) {
      const rect = containerRef.current.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, threeRefs.current.camera);

      const intersectPoint = new THREE.Vector3();
      if (raycaster.ray.intersectPlane(threeRefs.current.dragPlane, intersectPoint)) {
        const targetX = intersectPoint.x + threeRefs.current.dragOffset.x;
        const targetZ = intersectPoint.z + threeRefs.current.dragOffset.z;

        // Keep inside ESD mat boundary (-0.24m to 0.24m, -0.16m to 0.16m)
        const clampedX = Math.max(-0.24, Math.min(0.24, targetX));
        const clampedZ = Math.max(-0.16, Math.min(0.16, targetZ));

        draggedComponent.group.position.x = clampedX;
        draggedComponent.group.position.z = clampedZ;

        if (threeRefs.current.groundHighlightMesh) {
          threeRefs.current.groundHighlightMesh.position.x = clampedX;
          threeRefs.current.groundHighlightMesh.position.z = clampedZ;
        }

        // Dynamically update attached wires in real time!
        updateAttachedWires();
      }
    }
  };

  const handlePointerUp = () => {
    if (!threeRefs.current) return;
    if (threeRefs.current.isDraggingComponent) {
      threeRefs.current.isDraggingComponent = false;
      threeRefs.current.draggedComponent = null;
      setDraggingCompName(null);
      // Re-enable OrbitControls
      threeRefs.current.controls.enabled = true;
      if (threeRefs.current.groundHighlightMesh) {
        (threeRefs.current.groundHighlightMesh.material as THREE.MeshBasicMaterial).opacity = 0.3;
      }
    }
  };

  return (
    <div className="relative w-full h-full select-none overflow-hidden bg-[#0a0e17]">
      {/* 3D Canvas Container */}
      <div
        ref={containerRef}
        className={`w-full h-full ${
          draggingCompName
            ? 'cursor-grabbing'
            : interactionMode === 'MOVE'
            ? 'cursor-grab'
            : 'cursor-default'
        }`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      />

      {/* Locked Axis Feedback Toast */}
      {lockedToast?.visible && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 px-4 py-2.5 bg-slate-900/95 border border-cyan-500/70 rounded-xl shadow-2xl backdrop-blur-md text-xs animate-in fade-in slide-in-from-top-2 select-none pointer-events-auto">
          <span className="text-lg text-cyan-400">🔒</span>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-white font-['Chakra_Petch']">{lockedToast.componentName}</span>
            <span className="text-slate-300">is LOCKED on mechanical axis.</span>
          </div>
          {onOpenLockManager && (
            <button
              onClick={onOpenLockManager}
              className="ml-2 px-2.5 py-1 text-[11px] font-semibold text-cyan-300 bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/50 rounded-lg cursor-pointer transition-colors"
            >
              Unlock in Manager
            </button>
          )}
          <button
            onClick={() => setLockedToast(null)}
            className="text-slate-400 hover:text-white ml-1 text-xs cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Floating HUD View Presets & Mode Controls (pointer-events-none on wrapper to allow zoom through) */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 pointer-events-none">
        {/* Interaction Mode Switcher (Move vs Orbit) */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900/90 backdrop-blur-md rounded-lg border border-slate-700/80 shadow-xl pointer-events-auto">
          <button
            onClick={() => setInteractionMode('ORBIT')}
            className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded transition-colors whitespace-nowrap cursor-pointer ${
              interactionMode === 'ORBIT'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
            }`}
          >
            <span>🔄 Orbit Camera Mode</span>
          </button>
          <button
            onClick={() => setInteractionMode('MOVE')}
            className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded transition-colors whitespace-nowrap cursor-pointer ${
              interactionMode === 'MOVE'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
            }`}
          >
            <span>🖐 Drag & Move Mode</span>
          </button>
          <button
            onClick={handleResetPositions}
            title="Reset all components and wires to reference positions"
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors whitespace-nowrap cursor-pointer ml-1 border-l border-slate-700 pl-2"
          >
            <span>↺ Reset Layout</span>
          </button>
        </div>

        {/* Wire Alignment Design Toolbar */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900/95 backdrop-blur-md rounded-lg border border-slate-700/80 shadow-xl pointer-events-auto">
          <span className="px-2 text-[11px] font-bold font-mono tracking-wider text-cyan-400 uppercase">
            Wiring:
          </span>
          <button
            onClick={() => onToggleRoutingMode ? onToggleRoutingMode('ALIGNED_ORTHOGONAL') : updateAttachedWires('ALIGNED_ORTHOGONAL')}
            title="Clean, layered orthogonal Manhattan wiring harness with radiused corners"
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded transition-colors whitespace-nowrap cursor-pointer ${
              routingMode === 'ALIGNED_ORTHOGONAL'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <span>📐 Aligned Orthogonal</span>
            {routingMode === 'ALIGNED_ORTHOGONAL' && (
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            )}
          </button>
          <button
            onClick={() => onToggleRoutingMode ? onToggleRoutingMode('VALIDATED_TIGHT') : updateAttachedWires('VALIDATED_TIGHT')}
            title="Taut direct point-to-point connections"
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded transition-colors whitespace-nowrap cursor-pointer ${
              routingMode === 'VALIDATED_TIGHT'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <span>⚡ Tight Direct</span>
          </button>
          <button
            onClick={() => onToggleRoutingMode ? onToggleRoutingMode('STANDARD_SLACK') : updateAttachedWires('STANDARD_SLACK')}
            title="Realistic laboratory wire sag"
            className={`flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded transition-colors whitespace-nowrap cursor-pointer ${
              routingMode === 'STANDARD_SLACK'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <span>〰 Lab Sag</span>
          </button>
          <button
            onClick={() => {
              handleResetPositions();
              if (onAlignWiring) onAlignWiring();
              updateAttachedWires('ALIGNED_ORTHOGONAL');
            }}
            title="Snap all components to reference positions and align all wire channels"
            className="flex items-center gap-1 px-2 py-1 text-[11px] font-bold text-amber-300 bg-amber-950/80 hover:bg-amber-900 border border-amber-500/60 rounded transition-colors whitespace-nowrap cursor-pointer ml-1"
          >
            <span>✨ Align Wiring Design</span>
          </button>
        </div>

        {/* Lock & Validation Manager Quick Access HUD Button */}
        {onOpenLockManager && (
          <div className="flex items-center gap-2 pointer-events-auto">
            <button
              onClick={onOpenLockManager}
              title="Open Component Lock & Validation Manager"
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-cyan-300 bg-cyan-950/90 hover:bg-cyan-900 border border-cyan-500/60 rounded-lg shadow-xl backdrop-blur-md transition-all cursor-pointer hover:border-cyan-400 active:scale-95"
            >
              <span className="text-sm">🔒</span>
              <span>Component Lock &amp; Validation Manager</span>
              <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-emerald-950 border border-emerald-500/70 text-emerald-300 rounded shadow-sm">
                LOCKED ✓
              </span>
            </button>
          </div>
        )}

        {/* Camera Angles Presets */}
        <div className="flex items-center gap-1 p-1 bg-slate-900/80 backdrop-blur-md rounded-lg border border-slate-800/80 w-fit pointer-events-auto">
          <button
            onClick={() => setCameraPreset('PERSPECTIVE')}
            className={`px-2 py-0.5 text-[11px] font-medium rounded transition-colors whitespace-nowrap cursor-pointer ${
              activeCamPreset === 'PERSPECTIVE'
                ? 'bg-slate-700 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Perspective (Default)
          </button>
          <button
            onClick={() => setCameraPreset('TOP')}
            className={`px-2 py-0.5 text-[11px] font-medium rounded transition-colors whitespace-nowrap cursor-pointer ${
              activeCamPreset === 'TOP'
                ? 'bg-slate-700 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Top View
          </button>
          <button
            onClick={() => setCameraPreset('MACRO')}
            className={`px-2 py-0.5 text-[11px] font-medium rounded transition-colors whitespace-nowrap cursor-pointer ${
              activeCamPreset === 'MACRO'
                ? 'bg-slate-700 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Close-up
          </button>
          <button
            onClick={() => setCameraPreset('LOAD_CELLS')}
            className={`px-2 py-0.5 text-[11px] font-medium rounded transition-colors whitespace-nowrap cursor-pointer ${
              activeCamPreset === 'LOAD_CELLS'
                ? 'bg-slate-700 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            4x Load Cells
          </button>
        </div>

        {/* Active Status Info Banner */}
        {draggingCompName ? (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-cyan-950/90 border border-cyan-500/80 backdrop-blur-md rounded-md text-xs font-mono text-cyan-200 w-fit animate-pulse shadow-lg pointer-events-auto">
            <span>🖐 Moving:</span>
            <span className="font-bold text-white">{draggingCompName}</span>
            <span className="text-cyan-400/80">· Wires rerouting live</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/80 backdrop-blur-md rounded-md border border-slate-700/50 text-xs font-mono text-slate-300 w-fit pointer-events-auto">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Orbit: Left-drag Rotate · Right-drag Pan · Scroll Zoom</span>
          </div>
        )}
      </div>

      {/* Selected Wire Floating Callout Card */}
      {selectedWire && (
        <div className="absolute bottom-6 left-6 z-20 max-w-sm p-4 bg-slate-900/90 backdrop-blur-md rounded-lg border border-cyan-500/50 shadow-2xl animate-in fade-in slide-in-from-bottom-2 pointer-events-auto">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full border border-white/20"
                style={{ backgroundColor: selectedWire.color }}
              />
              <h4 className="text-sm font-semibold text-white">{selectedWire.name}</h4>
            </div>
            <button
              onClick={() => onSelectWire(null)}
              className="text-slate-400 hover:text-white text-xs px-1.5 py-0.5 rounded hover:bg-slate-800 cursor-pointer"
            >
              ✕
            </button>
          </div>
          <div className="space-y-1.5 text-xs text-slate-300 font-mono">
            <div className="flex justify-between border-b border-slate-800 pb-1">
              <span className="text-slate-400">Source:</span>
              <span className="text-cyan-300 font-semibold">{selectedWire.sourceComponent} [{selectedWire.sourcePin}]</span>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-1">
              <span className="text-slate-400">Destination:</span>
              <span className="text-cyan-300 font-semibold">{selectedWire.targetComponent} [{selectedWire.targetPin}]</span>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-1">
              <span className="text-slate-400">Wire Spec:</span>
              <span>{selectedWire.colorName}</span>
            </div>
            <div className="flex justify-between pt-0.5">
              <span className="text-slate-400">Signal:</span>
              <span className="text-emerald-400">{selectedWire.voltageText}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
