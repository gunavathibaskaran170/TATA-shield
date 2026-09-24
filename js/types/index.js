/* ============================================================
   SHIELD — Type Definitions (JSDoc / TypeScript-style)
   Single source of truth for all domain types.
   Used by JSDoc annotations and runtime validation schemas.
   ============================================================ */

/**
 * @typedef {'SIMULATED' | 'HARDWARE'} DataSource
 * @typedef {'NORMAL' | 'WATCH' | 'INSPECTION_REQUIRED' | 'FAULT'} SensorStatus
 * @typedef {'SG' | 'IMU' | 'LC' | 'DISP' | 'TEMP'} SensorType
 * @typedef {'PASS' | 'WARNING' | 'INSPECTION_REQUIRED' | 'REWORK_REQUIRED' | 'NOT_ASSESSED'} Verdict
 * @typedef {'RULES_V1' | `ML:${string}`} DecisionModel
 * @typedef {'SIMULATED' | 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' | 'RECONNECTING' | 'ERROR'} LinkState

/**
 * @typedef {Object} SensorReading
 * @property {string} sensorId
 * @property {number} timestamp - epoch ms (device or gateway; document which)
 * @property {number} value - primary channel (µε, g, N, mm, °C)
 * @property {Record<string, number>} [channels] - e.g. IMU ax, ay, az, gx, gy, gz
 * @property {string} unit
 * @property {DataSource} source
 * @property {number} quality - 0..1
 * @property {SensorStatus} status
 * @property {number} [seq] - for dropped-packet detection
 */

/**
 * @typedef {Object} DerivedMetrics
 * @property {string} sensorId
 * @property {number} timestamp
 * @property {number|null} expected - null = no calibrated model
 * @property {number|null} residual
 * @property {number|null} rms
 * @property {number|null} peak
 * @property {number|null} trend - slope over window
 * @property {number|null} anomalyScore
 * @property {SensorStatus} state
 */

/**
 * @typedef {Object} QualityDecision
 * @property {Verdict} verdict
 * @property {DecisionModel} model
 * @property {number|null} confidence - null for rule-based → display "Rule-based"
 * @property {string[]} abnormalRegions
 * @property {{name: string, value: number, baseline: number|null, deviation: number|null}[]} contributingFeatures
 * @property {string|null} recommendedInspection - inspection point only; no unsupported repair prescriptions
 * @property {{from: number, to: number}} evidenceWindow
 * @property {string[]} notes
 */

/**
 * @typedef {Object} SensorConfig
 * @property {string} id
 * @property {SensorType} type
 * @property {string} region
 * @property {string} zone
 * @property {string} name
 * @property {number[]} position - [x, y, z] metres
 * @property {number[]} orientation - unit vector of measured direction
 * @property {number[]} surfaceNormal - unit vector of mounting surface
 * @property {string} mechanicalReason
 * @property {string} measurement
 * @property {string} unit
 * @property {Object} gauge - strain gauge specs
 * @property {string} channel
 * @property {string} adc
 * @property {string} calibration
 * @property {string} calibrationDate
 * @property {number} signalQuality - 0..100
 * @property {SensorStatus} health
 * @property {number} baseline
 * @property {number} expected
 * @property {number} k - response coefficient (µε/N for strain)
 * @property {function(): Object} live - returns simulated reading
 * @property {'PHYSICAL_PROTOTYPE' | 'CONCEPT_CONTEXT'} provenance
 * @property {string} mountingNote
 */

/**
 * @typedef {Object} RegionConfig
 * @property {string} id
 * @property {string} name
 * @property {string} zone
 * @property {string} detail
 * @property {number} color
 * @property {THREE.Object3D[]} meshNodes
 * @property {string[]} relatedSensors
 * @property {string[]} neighbours
 */

/**
 * @typedef {Object} TelemetryProvider
 * @property {function(): void} start
 * @property {function(): void} stop
 * @property {function(string|'*', function): function} subscribe
 * @property {function(string|'*', function): function} subscribeDerived
 * @property {function(string): SensorReading|null} getLatest
 * @property {function(string, number): SensorReading[]} getHistory
 * @property {function(): {link: LinkState, source: DataSource, lastPacketAt: number|null, packetRateHz: number, dropped: number}} getConnectionState
 */

/**
 * @typedef {Object} RingBuffer
 * @property {Float64Array} timestamps
 * @property {Float64Array} values
 * @property {number} capacity
 * @property {number} head
 * @property {number} length
 * @property {function(number, number): void} push
 * @property {function(number): {timestamps: number[], values: number[]}} getWindow
 * @property {function(): void} clear
 */

/**
 * @typedef {Object} LayerState
 * @property {boolean} visible
 * @property {number} opacity
 * @property {boolean} isolated
 * @property {boolean} xray
 */

/**
 * @typedef {Object} CameraState
 * @property {THREE.Vector3} position
 * @property {THREE.Vector3} target
 * @property {number} fov
 * @property {boolean} autoRotate
 */

/**
 * @typedef {Object} SelectionState
 * @property {{kind: 'region'|'sensor'|'component'|null, id: string}|null} sel
 */

/**
 * @typedef {Object} ScenarioState
 * @property {string} scenario
 * @property {number} t
 * @property {number} T
 * @property {number} ramp
 * @property {boolean} playing
 * @property {boolean} anomalyOn
 */

/**
 * @typedef {Object} DemoState
 * @property {boolean} active
 * @property {number} step
 * @property {boolean} paused
 */