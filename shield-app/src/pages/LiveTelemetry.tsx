import { useMemo, useState } from 'react';
import {
  ResponsiveContainer, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine,
} from 'recharts';
import { useStore } from '../store/useStore';
import { SENSORS } from '../data/sensors';
import { Card, StatusChip, ProvTag, Seg, pct } from '../ui/kit';
import { PageHeader } from '../ui/PageHeader';

const SIGNAL_HEX: Record<string, string> = {
  strain: '#38d9cf', acceleration: '#4f8cff', temperature: '#ff8b2b', vibration: '#c9b8ff', displacement: '#f2b94e',
};

export function LiveTelemetry() {
  const sensorLive = useStore((s) => s.sensorLive);
  const [sensorId, setSensorId] = useState<string>(() =>
    Object.keys(sensorLive).find((id) => sensorLive[id]) ?? 'S05',
  );
  const [chart, setChart] = useState<'value' | 'anomaly'>('value');

  const live = sensorLive[sensorId];
  const all = SENSORS.map((s) => ({ s, live: sensorLive[s.id] }));

  const valueData = useMemo(() => {
    if (!live) return [];
    return live.trend.map((v, i) => ({ i, value: v }));
  }, [live?.trend, live]);

  const anomalyData = useMemo(() => {
    if (!live) return [];
    return live.trend.map((v, i) => ({ i, baseline: live.sensor.baseline, value: v }));
  }, [live]);

  const heat = (an: number) => (an > 0.66 ? 'var(--red)' : an > 0.33 ? 'var(--amber)' : 'var(--green)');

  return (
    <div className="col" style={{ width: '100%', minHeight: '100%', fontFamily: 'var(--font-sans)' }}>
      <PageHeader
        title="Live Telemetry Stream"
        description="High-frequency sensor channel stream, trend lines, and baseline residual analysis."
        actions={
          <div className="row wrap">
            <select
              value={sensorId}
              onChange={(e) => setSensorId(e.target.value)}
              style={{ width: 240 }}
            >
              {SENSORS.map((s) => <option key={s.id} value={s.id}>{s.id} — {s.name}</option>)}
            </select>
            <Seg
              options={[
                { value: 'value', label: 'Signal' },
                { value: 'anomaly', label: 'Anomaly vs baseline' },
              ]}
              value={chart}
              onChange={setChart}
            />
            <span className="chip st-normal"><span className="dot dot-normal" /> LIVE · Mock stream</span>
          </div>
        }
      />
      <div className="col stack splash-fade" style={{ padding: 16 }}>
        <div className="tiny muted">
          Rolling sensor streams + residual analytics. Feed is swappable mock ↔ MQTT/hardware without any UI change (see Settings).
        </div>

      <div className="grid2">
        {/* ---- chart ---- */}
        <Card title={live ? `${sensorId} · ${live.sensor.name}` : 'Waiting for packets'}>
          {live ? (
            <>
              <div style={{ width: '100%', height: 230 }}>
                <ResponsiveContainer width="100%" height="100%">
                  {chart === 'value' ? (
                    <LineChart data={valueData} margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1d2631" />
                      <XAxis dataKey="i" tick={{ fill: '#7d8ea1', fontSize: 10 }} stroke="#273342" />
                      <YAxis tick={{ fill: '#7d8ea1', fontSize: 10 }} stroke="#273342" domain={['auto', 'auto']} />
                      <Tooltip
                        contentStyle={{ background: '#10151c', border: '1px solid #273342', borderRadius: 6, fontSize: 11, color: '#d7e0ea' }}
                        labelFormatter={(v) => `sample ${v}`}
                      />
                      <ReferenceLine y={live.sensor.baseline} stroke="#f2b94e" strokeDasharray="4 4" label={{ value: 'baseline', fill: '#f2b94e', fontSize: 10, position: 'insideTopRight' }} />
                      <Line
                        type="monotone" dataKey="value" stroke={SIGNAL_HEX[live.sensor.signal] ?? '#38d9cf'}
                        strokeWidth={1.8} dot={false} isAnimationActive={false}
                      />
                    </LineChart>
                  ) : (
                    <AreaChart data={anomalyData} margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
                      <defs>
                        <linearGradient id="anom" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={heat(live.analytics.anomalyScore)} stopOpacity={0.35} />
                          <stop offset="100%" stopColor={heat(live.analytics.anomalyScore)} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1d2631" />
                      <XAxis dataKey="i" tick={{ fill: '#7d8ea1', fontSize: 10 }} stroke="#273342" />
                      <YAxis tick={{ fill: '#7d8ea1', fontSize: 10 }} stroke="#273342" domain={['auto', 'auto']} />
                      <Tooltip
                        contentStyle={{ background: '#10151c', border: '1px solid #273342', borderRadius: 6, fontSize: 11, color: '#d7e0ea' }}
                        labelFormatter={(v) => `sample ${v}`}
                      />
                      <ReferenceLine y={live.sensor.baseline} stroke="#f2b94e" strokeDasharray="4 4" />
                      <Area type="monotone" dataKey="value" stroke={heat(live.analytics.anomalyScore)} strokeWidth={1.6} fill="url(#anom)" isAnimationActive={false} />
                    </AreaChart>
                  )}
                </ResponsiveContainer>
              </div>
              <div className="tiny faint" style={{ marginTop: 6 }}>
                {chart === 'value'
                  ? 'Rolling window of raw packets (48 samples). Amber dashed line = Baseline B commissioning fingerprint (SIMULATED).'
                  : 'Same window overlaid on the baseline — visualises residual deviation. Analytics are MODEL_ESTIMATED.'}
              </div>
            </>
          ) : (
            <div className="panel" style={{ padding: 26, textAlign: 'center', color: 'var(--muted)' }}>
              Waiting for first packet for {sensorId}…
            </div>
          )}
        </Card>

        {/* ---- live reading card ---- */}
        <Card title="Derived analytics (model-estimated)">
          {live ? (
            <div className="col" style={{ gap: 8 }}>
              <div className="grid2">
                <Read k="Value" v={<span className="mono" style={{ fontSize: 20, color: 'var(--cyan)' }}>{live.packet.value.toFixed(live.sensor.signal === 'temperature' ? 1 : 0)} {live.packet.unit}</span>} />
                <Read k="Baseline" v={`${live.sensor.baseline.toFixed(1)} ${live.sensor.unit}`} mono />
              </div>
              <div className="grid2">
                <Read k="Residual" v={pct(live.analytics.residualPercent, 1)} mono />
                <Read k="Anomaly" v={live.analytics.anomalyScore.toFixed(3)} mono />
              </div>
              <div className="grid2">
                <Read k="Persistence" v={live.analytics.persistenceScore.toFixed(3)} mono />
                <Read k="Confidence" v={live.analytics.confidence.toFixed(3)} mono />
              </div>
              <div className="spread">
                <StatusChip state={live.analytics.state} />
                <span className="row" style={{ gap: 6 }}>
                  <ProvTag p={live.analytics.source} />
                  <ProvTag p={live.packet.provenance} />
                </span>
              </div>
              <hr className="rule" />
              <div className="grid2">
                <Read k="Region" v={live.sensor.region} mono />
                <Read k="Signal" v={live.sensor.signal} mono />
              </div>
              <div className="grid2">
                <Read k="Sampling" v={`${live.sensor.samplingHz} Hz`} mono />
                <Read k="Quality" v={live.packet.quality.toFixed(3)} mono />
              </div>
              <Read k="Monitored component" v={live.sensor.componentId} mono />
              <div className="panel" style={{ padding: 8, background: 'var(--bg2)' }}>
                <div className="tiny faint">
                  residual = mean(window) − baseline. persistence = EMA of |residual| normalized. anomaly = 0.42·residual + 0.40·persistence + 0.18·quality heuristic.
                </div>
              </div>
            </div>
          ) : (
            <div className="tiny faint">No packet yet.</div>
          )}
        </Card>
      </div>

      {/* ---- all sensors table ---- */}
      <Card title={`All sensors (${SENSORS.length})`}>
        <div style={{ overflow: 'auto' }}>
          <table className="tbl">
            <thead>
              <tr><th>ID</th><th>Name</th><th>Signal</th><th className="num">Value</th><th className="num">Residual</th><th className="num">Persistence</th><th className="num">Anomaly</th><th>State</th></tr>
            </thead>
            <tbody>
              {all.map(({ s, live }) => (
                <tr
                  key={s.id}
                  style={{ cursor: 'pointer', ...(s.id === sensorId ? { background: '#101f28' } : {}) }}
                  onClick={() => setSensorId(s.id)}
                >
                  <td><span className="mono small" style={{ color: 'var(--cyan)' }}>{s.id}</span></td>
                  <td className="small">{s.name}</td>
                  <td><span className="tiny">{s.signal}</span></td>
                  <td className="num">{
                    live
                      ? <span className="mono">{live.packet.value.toFixed(live.sensor.signal === 'temperature' ? 1 : 1)} {s.unit}</span>
                      : <span className="tiny faint">waiting</span>
                  }</td>
                  <td className="num">{live ? pct(live.analytics.residualPercent, 1) : '—'}</td>
                  <td className="num">{live ? live.analytics.persistenceScore.toFixed(2) : '—'}</td>
                  <td className="num">
                    {live ? (
                      <span className="mono" style={{ color: heat(live.analytics.anomalyScore) }}>{live.analytics.anomalyScore.toFixed(3)}</span>
                    ) : '—'}
                  </td>
                  <td>{live ? <StatusChip state={live.analytics.state} /> : <span className="tiny faint">no data</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="tiny faint" style={{ marginTop: 8 }}>
          Values stream ~4 Hz per sensor (mock). The row you select drives the chart above.
        </div>
      </Card>
      </div>
    </div>
  );
}

function Read({ k, v, mono }: { k: string; v: React.ReactNode; mono?: boolean }) {
  return (
    <div className="panel" style={{ padding: '6px 9px' }}>
      <div className="tiny muted" style={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>{k}</div>
      <div className={'small' + (mono ? ' mono' : '')} style={{ marginTop: 2, color: 'var(--text)' }}>{v}</div>
    </div>
  );
}