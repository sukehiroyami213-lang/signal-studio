import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import {
  generateTimeArray, messageSignal, carrierSignal, dsbSignal, ssbSignal, vsbSignal,
  computeSpectrum, downsampleForChart,
} from "@/lib/signalProcessing";

const STEPS = [
  { label: "Step 1", title: "Config L1/L2", desc: "Use sliders to set carrier frequency and signal components." },
  { label: "Step 2", title: "Add Dropout", desc: "Enable Dropout to set vestige width for VSB filtering." },
  { label: "Step 3", title: "Run Training", desc: 'Click "Simulate" to generate time and frequency plots.' },
  { label: "Step 4", title: "Analyze", desc: "Compare DSB-SC, SSB, and VSB in both domains." },
];

const stepColors = ["hsl(var(--step-1))", "hsl(var(--step-2))", "hsl(var(--step-3))", "hsl(var(--step-4))"];

const SimulatorTab = () => {
  const [f1, setF1] = useState(1000);
  const [f2, setF2] = useState(4000);
  const [fc, setFc] = useState(50000);
  const [vestigeWidth, setVestigeWidth] = useState(3000);
  const [Ac] = useState(10);
  const [simulated, setSimulated] = useState(false);

  const fs = 500000;
  const duration = 0.005;

  const results = useMemo(() => {
    if (!simulated) return null;
    const t = generateTimeArray(duration, fs);
    const m = messageSignal(t, f1, f2);
    const c = carrierSignal(t, Ac, fc);
    const dsb = dsbSignal(m, c);
    const ssb = ssbSignal(t, m, fc);
    const vsb = vsbSignal(dsb, fc, fs, vestigeWidth);

    return {
      message: downsampleForChart(t, m),
      carrier: downsampleForChart(t, c),
      dsb: downsampleForChart(t, dsb),
      ssb: downsampleForChart(t, ssb),
      vsb: downsampleForChart(t, vsb),
      dsbSpectrum: computeSpectrum(dsb, fs),
      ssbSpectrum: computeSpectrum(ssb, fs),
      vsbSpectrum: computeSpectrum(vsb, fs),
    };
  }, [simulated, f1, f2, fc, vestigeWidth, Ac]);

  const handleSimulate = useCallback(() => setSimulated(true), []);

  const spectrumToChart = (spec: { freq: number[]; mag: number[] }) =>
    spec.freq.map((f, i) => ({ freq: f / 1000, mag: spec.mag[i] }));

  return (
    <div className="container mx-auto max-w-6xl px-6 py-10">
      {/* How to use */}
      <motion.div className="card-dashed mb-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h2 className="text-xl font-bold text-foreground">📖 How to use the Simulator</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-4">
          {STEPS.map((s, i) => (
            <div key={i} className="card-dashed">
              <span className="step-badge" style={{ background: `${stepColors[i]}22`, color: stepColors[i] }}>
                {s.label}
              </span>
              <h3 className="mt-3 font-bold text-foreground">{s.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </motion.div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Parameter Tuning */}
        <div className="card-dashed space-y-6">
          <h2 className="text-xl font-bold text-foreground">Parameter Tuning</h2>
          <hr className="border-border" />

          <div>
            <label className="text-sm text-muted-foreground">f₁ - Signal Component 1 (Hz)</label>
            <div className="mt-2 flex items-center gap-4">
              <input type="range" min={100} max={10000} step={100} value={f1}
                onChange={e => { setF1(+e.target.value); setSimulated(false); }}
                className="flex-1 accent-primary" />
              <span className="w-20 rounded bg-secondary px-2 py-1 text-center font-mono text-sm text-foreground">{f1}</span>
            </div>
          </div>

          <div>
            <label className="text-sm text-muted-foreground">f₂ - Signal Component 2 (Hz)</label>
            <div className="mt-2 flex items-center gap-4">
              <input type="range" min={100} max={10000} step={100} value={f2}
                onChange={e => { setF2(+e.target.value); setSimulated(false); }}
                className="flex-1 accent-primary" />
              <span className="w-20 rounded bg-secondary px-2 py-1 text-center font-mono text-sm text-foreground">{f2}</span>
            </div>
          </div>

          <div>
            <label className="text-sm text-muted-foreground">Carrier Frequency f_c (Hz)</label>
            <div className="mt-2 flex items-center gap-4">
              <input type="range" min={10000} max={100000} step={1000} value={fc}
                onChange={e => { setFc(+e.target.value); setSimulated(false); }}
                className="flex-1 accent-primary" />
              <span className="w-20 rounded bg-secondary px-2 py-1 text-center font-mono text-sm text-foreground">{fc}</span>
            </div>
          </div>

          <div className="card-dashed">
            <label className="text-sm text-muted-foreground">Vestige Width f_v (Hz)</label>
            <div className="mt-2 flex items-center gap-4">
              <input type="range" min={500} max={10000} step={500} value={vestigeWidth}
                onChange={e => { setVestigeWidth(+e.target.value); setSimulated(false); }}
                className="flex-1 accent-primary" />
              <span className="w-20 rounded bg-secondary px-2 py-1 text-center font-mono text-sm text-foreground">{vestigeWidth}</span>
            </div>
          </div>

          <button
            onClick={handleSimulate}
            className="w-full rounded-lg bg-primary py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Simulate
          </button>
        </div>

        {/* Time Domain Plots */}
        <div className="card-dashed">
          <h2 className="text-xl font-bold text-foreground">Time Domain Signals</h2>
          {!results ? (
            <p className="mt-8 text-center text-muted-foreground">Click "Simulate" to generate plots</p>
          ) : (
            <div className="mt-4 space-y-6">
              {([
                { data: results.message, label: "Message Signal", color: "#4fc3f7" },
                { data: results.dsb, label: "DSB-SC", color: "#7c4dff" },
                { data: results.ssb, label: "SSB", color: "#ff5252" },
                { data: results.vsb, label: "VSB", color: "#69f0ae" },
              ] as const).map(({ data, label, color }) => (
                <div key={label}>
                  <h3 className="mb-2 text-sm font-semibold text-muted-foreground">{label}</h3>
                  <ResponsiveContainer width="100%" height={120}>
                    <LineChart data={data}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(222,30%,20%)" />
                      <XAxis dataKey="time" tick={{ fontSize: 10, fill: "hsl(215,20%,55%)" }} />
                      <YAxis tick={{ fontSize: 10, fill: "hsl(215,20%,55%)" }} />
                      <Line type="monotone" dataKey="value" stroke={color} dot={false} strokeWidth={1.5} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Frequency Domain */}
      {results && (
        <motion.div className="mt-8 card-dashed" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h2 className="text-xl font-bold text-foreground">Frequency Spectrum</h2>
          <div className="mt-4 grid gap-6 lg:grid-cols-3">
            {([
              { spec: results.dsbSpectrum, label: "DSB-SC Spectrum", color: "#7c4dff" },
              { spec: results.ssbSpectrum, label: "SSB Spectrum", color: "#ff5252" },
              { spec: results.vsbSpectrum, label: "VSB Spectrum", color: "#69f0ae" },
            ] as const).map(({ spec, label, color }) => (
              <div key={label}>
                <h3 className="mb-2 text-sm font-semibold text-muted-foreground">{label}</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={spectrumToChart(spec)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(222,30%,20%)" />
                    <XAxis dataKey="freq" tick={{ fontSize: 10, fill: "hsl(215,20%,55%)" }}
                      label={{ value: "Freq (kHz)", position: "insideBottom", offset: -5, fontSize: 10, fill: "hsl(215,20%,55%)" }} />
                    <YAxis tick={{ fontSize: 10, fill: "hsl(215,20%,55%)" }} />
                    <Tooltip contentStyle={{ background: "hsl(222,47%,11%)", border: "1px solid hsl(222,30%,20%)" }} />
                    <Legend />
                    <Line type="monotone" dataKey="mag" name="Magnitude" stroke={color} dot={false} strokeWidth={1.5} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default SimulatorTab;
