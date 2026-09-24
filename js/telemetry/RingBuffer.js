/* ============================================================
   SHIELD — Ring Buffer (Typed Arrays)
   Fixed-capacity circular buffer for timestamps and values.
   Zero allocations after initialization.
   ============================================================ */

export class RingBuffer {
  /**
   * @param {number} capacity - max samples (e.g., 5 min * maxRate)
   * @param {number} [channels=1] - number of value channels per sample
   */
  constructor(capacity, channels = 1) {
    this.capacity = capacity;
    this.channels = channels;
    this.timestamps = new Float64Array(capacity);
    this.values = new Float64Array(capacity * channels);
    this.head = 0;
    this.length = 0;
  }

  /**
   * Push a sample.
   * @param {number} timestamp - epoch ms
   * @param {number|number[]} value - single value or array of channel values
   */
  push(timestamp, value) {
    this.timestamps[this.head] = timestamp;
    const offset = this.head * this.channels;
    if (Array.isArray(value)) {
      for (let i = 0; i < this.channels && i < value.length; i++) {
        this.values[offset + i] = value[i];
      }
    } else {
      this.values[offset] = value;
    }
    this.head = (this.head + 1) % this.capacity;
    if (this.length < this.capacity) this.length++;
  }

  /**
   * Get a time window (last `windowMs` milliseconds).
   * @param {number} windowMs
   * @returns {{timestamps: number[], values: number[][]}}
   */
  getWindow(windowMs) {
    const now = this.timestamps[(this.head - 1 + this.capacity) % this.capacity];
    const cutoff = now - windowMs;
    const outTs = [];
    const outVals = [];
    for (let i = 0; i < this.length; i++) {
      const idx = (this.head - this.length + i + this.capacity) % this.capacity;
      const ts = this.timestamps[idx];
      if (ts >= cutoff) {
        outTs.push(ts);
        const vals = [];
        const offset = idx * this.channels;
        for (let c = 0; c < this.channels; c++) {
          vals.push(this.values[offset + c]);
        }
        outVals.push(vals);
      }
    }
    return { timestamps: outTs, values: outVals };
  }

  /** Get all samples (oldest first). */
  getAll() {
    const outTs = [];
    const outVals = [];
    for (let i = 0; i < this.length; i++) {
      const idx = (this.head - this.length + i + this.capacity) % this.capacity;
      outTs.push(this.timestamps[idx]);
      const vals = [];
      const offset = idx * this.channels;
      for (let c = 0; c < this.channels; c++) {
        vals.push(this.values[offset + c]);
      }
      outVals.push(vals);
    }
    return { timestamps: outTs, values: outVals };
  }

  /** Get latest sample. */
  getLatest() {
    if (this.length === 0) return null;
    const idx = (this.head - 1 + this.capacity) % this.capacity;
    const vals = [];
    const offset = idx * this.channels;
    for (let c = 0; c < this.channels; c++) {
      vals.push(this.values[offset + c]);
    }
    return { timestamp: this.timestamps[idx], values: vals };
  }

  /** Clear the buffer. */
  clear() {
    this.head = 0;
    this.length = 0;
  }

  /** Current number of samples. */
  size() {
    return this.length;
  }

  /** Check if buffer is full. */
  isFull() {
    return this.length === this.capacity;
  }
}

/* ---- Multi-channel ring buffer for IMU (6 channels) ---- */
export class IMURingBuffer extends RingBuffer {
  constructor(capacity) {
    super(capacity, 6); // ax, ay, az, gx, gy, gz
  }

  push(timestamp, { ax, ay, az, gx, gy, gz }) {
    super.push(timestamp, [ax, ay, az, gx, gy, gz]);
  }

  getLatest() {
    const base = super.getLatest();
    if (!base) return null;
    return {
      timestamp: base.timestamp,
      ax: base.values[0],
      ay: base.values[1],
      az: base.values[2],
      gx: base.values[3],
      gy: base.values[4],
      gz: base.values[5],
    };
  }
}

/* ---- Factory for sensor-specific buffers ---- */
export function createSensorBuffer(sensorType, capacity) {
  switch (sensorType) {
    case 'imu': return new IMURingBuffer(capacity);
    case 'strain':
    case 'load':
    case 'disp':
    case 'temp':
    default: return new RingBuffer(capacity, 1);
  }
}