# generate_shield_features.py
# SHIELD — Feature Extraction Pipeline
# Generates shield_features.csv from raw sensor data (Pure Python)

import csv
import random
import math
from datetime import datetime, timedelta

# ============================================================
# CONFIG
# ============================================================

random.seed(42)
BASELINE_FREQ = 83.0
WINDOW_SIZE = 50

# ============================================================
# STEP 1: GENERATE RAW SENSOR DATA
# ============================================================

def gauss(mean, std):
    return random.gauss(mean, std)

def generate_normal(n):
    return [{
        'timestamp': (datetime.now() + timedelta(milliseconds=i*10)).isoformat(),
        'sg1': gauss(42, 3), 'sg2': gauss(41, 3),
        'sg3': gauss(38, 2.5), 'sg4': gauss(39, 2.5),
        'sg5': gauss(44, 3), 'sg6': gauss(43, 3),
        'lc1': gauss(25, 0.5), 'lc2': gauss(25, 0.5),
        'imu1': gauss(0.4, 0.05), 'imu2': gauss(0.4, 0.05),
        'temp': gauss(30, 1),
        'condition': 'NORMAL'
    } for i in range(n)]

def generate_watch(n):
    return [{
        'sg1': gauss(105, 4),  # was 95, 6
        'sg2': gauss(102, 4),  # was 92, 6
        'sg3': gauss(96, 3),   # was 86, 5
        'sg4': gauss(98, 3),   # was 88, 5
        'sg5': gauss(108, 4),  # was 98, 6
        'sg6': gauss(106, 4),  # was 96, 6
        'lc1': gauss(25, 0.5), 'lc2': gauss(25, 0.5),
        'imu1': gauss(1.3, 0.06),  # was 1.1, 0.08
        'imu2': gauss(1.2, 0.06),  # was 1.0, 0.08
        'temp': gauss(31, 1),
        'condition': 'WATCH'
    } for i in range(n)]

def generate_inspection(n):
    return [{
        'timestamp': (datetime.now() + timedelta(milliseconds=i*10)).isoformat(),
        'sg1': gauss(180, 15), 'sg2': gauss(175, 15),
        'sg3': gauss(165, 12), 'sg4': gauss(170, 12),
        'sg5': gauss(185, 15), 'sg6': gauss(182, 15),
        'lc1': gauss(25, 0.5), 'lc2': gauss(25, 0.5),
        'imu1': gauss(2.0, 0.2), 'imu2': gauss(1.9, 0.2),
        'temp': gauss(32, 1),
        'condition': 'INSPECTION'
    } for i in range(n)]

# ============================================================
# STEP 2: FEATURE EXTRACTION
# ============================================================

def mean(v): return sum(v) / len(v)

def std(v):
    m = mean(v)
    return math.sqrt(sum((x-m)**2 for x in v) / len(v))

def rms(v): return math.sqrt(sum(x*x for x in v) / len(v))

def peak(v): return max(abs(x) for x in v)

def kurt(v):
    m, s = mean(v), std(v)
    if s == 0: return 0
    return sum(((x-m)/s)**4 for x in v) / len(v) - 3

def dom_freq(v, fs=100):
    crossings = sum(1 for i in range(1, len(v))
                    if (v[i-1] < 0 and v[i] >= 0) or (v[i-1] >= 0 and v[i] < 0))
    dur = len(v) / fs
    return crossings / (2 * dur) if dur > 0 else 0

def extract_features(raw_data, window_size=50):
    features = []
    step = window_size // 2
    for i in range(0, len(raw_data) - window_size, step):
        w = raw_data[i:i+window_size]
        row = {}

        for sg in ['sg1','sg2','sg3','sg4','sg5','sg6']:
            sig = [x[sg] for x in w]
            row[f'{sg}_rms'] = round(rms(sig), 4)
            row[f'{sg}_std'] = round(std(sig), 4)
            row[f'{sg}_peak'] = round(peak(sig), 4)
            row[f'{sg}_kurtosis'] = round(kurt(sig), 4)
            row[f'{sg}_freq_shift'] = round(dom_freq(sig) - BASELINE_FREQ, 4)

        for lc in ['lc1','lc2']:
            sig = [x[lc] for x in w]
            row[f'{lc}_mean'] = round(mean(sig), 4)
            row[f'{lc}_std'] = round(std(sig), 4)

        lc1v = [x['lc1'] for x in w]
        lc2v = [x['lc2'] for x in w]
        row['load_imbalance'] = round(abs(mean(lc1v) - mean(lc2v)), 4)
        row['load_total'] = round(mean(lc1v) + mean(lc2v), 4)

        for imu in ['imu1','imu2']:
            sig = [x[imu] for x in w]
            row[f'{imu}_rms'] = round(rms(sig), 4)
            row[f'{imu}_peak'] = round(peak(sig), 4)
            row[f'{imu}_std'] = round(std(sig), 4)

        tv = [x['temp'] for x in w]
        row['temp_mean'] = round(mean(tv), 4)
        row['temp_delta'] = round(max(tv) - min(tv), 4)

        smeans = [mean([x[sg] for x in w]) for sg in ['sg1','sg2','sg3','sg4','sg5','sg6']]
        row['strain_mean'] = round(mean(smeans), 4)
        row['strain_max'] = round(max(smeans), 4)
        row['strain_std'] = round(std(smeans), 4)
        row['persistence_score'] = round(row['strain_mean'] / 42.0, 4)
        row['severity_score'] = round(row['strain_max'] / 42.0, 4)

        conds = [x['condition'] for x in w]
        row['condition'] = max(set(conds), key=conds.count)
        features.append(row)
    return features

# ============================================================
# MAIN
# ============================================================

print("=" * 60)
print("SHIELD — Feature Extraction")
print("=" * 60)

print("\n[1/3] Generating raw sensor data...")
normal = generate_normal(1500)
watch = generate_watch(1500)   # 2.5× more WATCH
inspection = generate_inspection(1000)  # 2.5× more INSPECTION
raw_data = normal + watch + inspection
print(f"      NORMAL: {len(normal)}, WATCH: {len(watch)}, INSPECTION: {len(inspection)}")

with open('1_data/shield_raw_data.csv', 'w', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=raw_data[0].keys())
    writer.writeheader()
    writer.writerows(raw_data)
print("      Saved: 1_data/shield_raw_data.csv")

print("\n[2/3] Extracting features...")
features = extract_features(raw_data, WINDOW_SIZE)

print("\n[3/3] Saving feature matrix...")
fieldnames = list(features[0].keys())
with open('1_data/shield_features.csv', 'w', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(features)

from collections import Counter
dist = Counter(f['condition'] for f in features)

print("\n" + "=" * 60)
print("✅ shield_features.csv generated!")
print("=" * 60)
print(f"   Rows: {len(features)}")
print(f"   Columns: {len(fieldnames)}")
print(f"   Features: {len(fieldnames) - 1}")
print(f"\n   Distribution:")
for cond, count in dist.items():
    print(f"   {cond:12s}: {count}")
print("\n✅ Done!")