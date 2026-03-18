import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area,
} from "recharts";
import {
  generateTimeArray, messageSignal, carrierSignal, dsbSignal, ssbSignal, vsbSignal,
  computeSpectrum, downsampleForChart,
} from "@/lib/signalProcessing";

const STEPS = [
  { label: "Step 1", title: "Set Frequencies", desc: "Adjust f₁, f₂ and carrier frequency using the sliders.", icon: "🎛️" },
  { label: "Step 2", title: "Configure VSB", desc: "Set the vestige bandwidth for VSB filtering.", icon: "📐" },
  { label: "Step 3", title: "Simulate", desc: 'Click "Run Simulation" to compute all signals.', icon: "▶️" },
  { label: "Step 4", title: "Analyze", desc: "Compare DSB-SC, SSB, and VSB in time & frequency.", icon: "📊" },
];

const SIGNAL_CONFIGS = [
  { key: "message", label: "Message Signal m(t)", color: "#4fc3f7", gradient: "url(#gradMessage)" },
  { key: "dsb", label: "DSB-SC Signal", color: "#a78bfa", gradient: "url(#gradDsb)" },
  { key: "ssb", label: "SSB Signal", color: "#f87171", gradient: "url(#gradSsb)" },
  { key: "vsb", label: "VSB Signal", color: "#34d399", gradient: "url(#gradVsb)" },
] as const;

const SPECTRUM_CONFIGS = [
  { key: "dsbSpectrum", label: "DSB-SC Spectrum", color: "#a78bfa" },
  { key: "ssbSpectrum", label: "SSB Spectrum", color: "#f87171" },
  { key: "vsbSpectrum", label: "VSB Spectrum", color: "#34d399" },
] as const;

interface SliderProps {
  label: string;
  sublabel?: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  color?: string;
  onChange: (v: number) => void;
}

const ParamSlider = ({ label, sublabel, value, min, max, step, unit = "Hz", color = "hsl(var(--primary))", onChange }: SliderProps) => (
  <div className="group">
    <div className="mb-2 flex items-baseline justify-between">
      <div>
        <span className="text-sm font-medium text-foreground">{label}</span>
        {sublabel && <span className="ml-2 text-xs text-muted-foreground">{sublabel}</span>}
      </div>
      <div className="flex items-center gap-1.5 rounded-md bg-secondary/80 px-3 py-1">
        <span className="font-mono text-sm font-semibold text-foreground">{value.toLocaleString()}</span>
        <span className="text-xs text-muted-foreground">{unit}</span>
      </div>
    </div>
    <div className="relative">
      <div className="absolute top-1/2 h-1.5 w-full -translate-y-1/2 overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full transition-all duration-150"
          style={{
            width: `${((value - min) / (max - min)) * 100}%`,
            background: `linear-gradient(90deg, ${color}, ${color}88)`,
          }}
        />
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(+e.target.value)}
        className="relative z-10 w-full cursor-pointer appearance-none bg-transparent
          [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none
          [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2
          [&::-webkit-slider-thumb]:border-foreground [&::-webkit-slider-thumb]:bg-foreground
          [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:transition-transform
          [&::-webkit-slider-thumb]:hover:scale-125"
      />
    </div>
    <div className="mt-1 flex justify-between text-[10px] text-muted-foreground/50">
      <span>{min.toLocaleString()}</span>
      <span>{max.toLocaleString()}</span>
    </div>
  </div>
);

const EmptyPlot = () => (
  <div className="flex h-full flex-col items-center justify-center gap-3 py-12 text-center">
    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary/50 text-2xl">
      📈
    </div>
    <p className="text-sm font-medium text-muted-foreground">No signals generated yet</p>
    <p className="text-xs text-muted-foreground/60">Adjust parameters and click "Run Simulation"</p>
  </div>
);

const ZOOM_LEVELS_TIME_MESSAGE = [0.5, 1, 2, 3, 5];
const ZOOM_LEVELS_TIME_MOD = [0.05, 0.1, 0.2, 0.5, 1];
const ZOOM_LEVELS_FREQ = [10, 25, 50, 100, 250];

const SimulatorTab = () => {
  const [f1, setF1] = useState(1000);
  const [f2, setF2] = useState(4000);
  const [fc, setFc] = useState(50000);
  const [vestigeWidth, setVestigeWidth] = useState(3000);
  const [Ac] = useState(10);
  const [simulated, setSimulated] = useState(false);
  const [activeTimePlot, setActiveTimePlot] = useState<number>(0);
  const [timeZoomIdx, setTimeZoomIdx] = useState(2);
  const [freqZoomIdx, setFreqZoomIdx] = useState(4);
  const [spectrumView, setSpectrumView] = useState<"individual" | "overlay">("individual");

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
  const handleParamChange = (setter: (v: number) => void) => (v: number) => {
    setter(v);
    setSimulated(false);
  };

  const spectrumToChart = (spec: { freq: number[]; mag: number[] }) =>
    spec.freq
      .map((f, i) => ({ freq: Math.round(f / 100) / 10, mag: Math.round(spec.mag[i] * 1000) / 1000 }))
      .filter(p => p.freq <= freqZoomMax);

  const gridStroke = "hsl(222,25%,16%)";
  const tickStyle = { fontSize: 10, fill: "hsl(215,20%,45%)" };
  const activeSignalKey = SIGNAL_CONFIGS[activeTimePlot].key;
  const isMessage = activeSignalKey === "message";
  const zoomLevels = isMessage ? ZOOM_LEVELS_TIME_MESSAGE : ZOOM_LEVELS_TIME_MOD;
  const visibleTimeWindowMs = zoomLevels[timeZoomIdx] ?? zoomLevels[2];
  const activeTimeData = results
    ? results[activeSignalKey].filter((point) => point.time <= visibleTimeWindowMs)
    : [];
  const freqZoomMax = ZOOM_LEVELS_FREQ[freqZoomIdx] ?? 250;

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Steps */}
      <motion.div className="mb-8" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {STEPS.map((s, i) => (
            <div
              key={i}
              className="group relative overflow-hidden rounded-xl border border-border/60 bg-card/50 p-4 transition-colors hover:border-primary/30 hover:bg-card"
            >
              <div className="absolute -right-2 -top-2 text-3xl opacity-10 transition-opacity group-hover:opacity-20">
                {s.icon}
              </div>
              <span className="inline-block rounded-full bg-primary/15 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-primary">
                {s.label}
              </span>
              <h3 className="mt-2 text-sm font-bold text-foreground">{s.title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </motion.div>

      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
        {/* Parameter Panel */}
        <motion.div
          className="space-y-1 rounded-xl border border-border/60 bg-card/80 p-5"
          initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-sm">🎛️</div>
            <h2 className="text-lg font-bold text-foreground">Parameters</h2>
          </div>
          <p className="pb-3 text-xs text-muted-foreground">Configure signal and modulation parameters</p>

          <div className="space-y-5">
            <div className="rounded-lg bg-secondary/30 p-4 space-y-5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Signal Components</p>
              <ParamSlider label="f₁" sublabel="Component 1" value={f1} min={100} max={10000} step={100}
                color="#4fc3f7" onChange={handleParamChange(setF1)} />
              <ParamSlider label="f₂" sublabel="Component 2" value={f2} min={100} max={10000} step={100}
                color="#4fc3f7" onChange={handleParamChange(setF2)} />
            </div>

            <div className="rounded-lg bg-secondary/30 p-4 space-y-5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Carrier</p>
              <ParamSlider label="fₓ" sublabel="Carrier Freq" value={fc} min={10000} max={100000} step={1000}
                color="#a78bfa" onChange={handleParamChange(setFc)} />
            </div>

            <div className="rounded-lg border border-dashed border-primary/25 bg-primary/5 p-4 space-y-5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-primary/70">VSB Vestige</p>
              <ParamSlider label="fᵥ" sublabel="Vestige Width" value={vestigeWidth} min={500} max={10000} step={500}
                color="#34d399" onChange={handleParamChange(setVestigeWidth)} />
            </div>
          </div>

          <div className="pt-4">
            <button
              onClick={handleSimulate}
              className="group relative w-full overflow-hidden rounded-xl bg-primary py-3.5 font-bold text-primary-foreground transition-all hover:shadow-lg hover:shadow-primary/25 active:scale-[0.98]"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                <span>▶</span> Run Simulation
              </span>
            </button>
          </div>

          {/* Live info */}
          <div className="pt-3">
            <div className="rounded-lg bg-secondary/30 p-3 text-xs text-muted-foreground space-y-1.5">
              <div className="flex justify-between">
                <span>Message BW</span>
                <span className="font-mono text-foreground">{Math.max(f1, f2).toLocaleString()} Hz</span>
              </div>
              <div className="flex justify-between">
                <span>DSB-SC BW</span>
                <span className="font-mono text-foreground">{(2 * Math.max(f1, f2)).toLocaleString()} Hz</span>
              </div>
              <div className="flex justify-between">
                <span>SSB BW</span>
                <span className="font-mono text-foreground">{Math.max(f1, f2).toLocaleString()} Hz</span>
              </div>
              <div className="flex justify-between">
                <span>VSB BW</span>
                <span className="font-mono font-semibold text-primary">{(Math.max(f1, f2) + vestigeWidth).toLocaleString()} Hz</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Plots area */}
        <motion.div className="space-y-6" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
          {/* Time Domain */}
          <div className="rounded-xl border border-border/60 bg-card/80 p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/15 text-sm">⏱️</div>
                <h2 className="text-lg font-bold text-foreground">Time Domain</h2>
              </div>
              {results && (
                <div className="flex gap-1 rounded-lg bg-secondary/50 p-1">
                  {SIGNAL_CONFIGS.map((s, i) => (
                    <button key={s.key}
                      onClick={() => setActiveTimePlot(i)}
                      className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-all ${
                        activeTimePlot === i
                          ? "bg-card text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {s.label.split(" ")[0]}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {!results ? <EmptyPlot /> : (
              <AnimatePresence mode="wait">
                <motion.div key={activeTimePlot} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full" style={{ background: SIGNAL_CONFIGS[activeTimePlot].color }} />
                      <span className="text-sm font-medium text-foreground">{SIGNAL_CONFIGS[activeTimePlot].label}</span>
                      <span className="rounded-full bg-secondary/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                        0–{visibleTimeWindowMs} ms
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setTimeZoomIdx(i => Math.max(0, i - 1))}
                        disabled={timeZoomIdx === 0}
                        className="flex h-7 w-7 items-center justify-center rounded-md bg-secondary/60 text-xs font-bold text-foreground transition-colors hover:bg-secondary disabled:opacity-30"
                        title="Zoom in"
                      >🔍+</button>
                      <button
                        onClick={() => setTimeZoomIdx(i => Math.min(zoomLevels.length - 1, i + 1))}
                        disabled={timeZoomIdx === zoomLevels.length - 1}
                        className="flex h-7 w-7 items-center justify-center rounded-md bg-secondary/60 text-xs font-bold text-foreground transition-colors hover:bg-secondary disabled:opacity-30"
                        title="Zoom out"
                      >🔍−</button>
                      <button
                        onClick={() => setTimeZoomIdx(2)}
                        className="ml-1 rounded-md bg-secondary/60 px-2 py-1 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                        title="Reset zoom"
                      >Reset</button>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={400}>
                    <AreaChart data={activeTimeData}>
                      <defs>
                        <linearGradient id="gradMessage" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#4fc3f7" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="#4fc3f7" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gradDsb" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="#a78bfa" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gradSsb" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#f87171" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="#f87171" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gradVsb" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#34d399" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                      <XAxis dataKey="time" tick={tickStyle} domain={[0, visibleTimeWindowMs]} type="number"
                        label={{ value: "Time (ms)", position: "insideBottomRight", offset: -5, fontSize: 10, fill: "hsl(215,20%,45%)" }} />
                      <YAxis tick={tickStyle}
                        label={{ value: "Amplitude (V)", angle: -90, position: "insideLeft", offset: 10, fontSize: 10, fill: "hsl(215,20%,45%)" }} />
                      <Tooltip
                        contentStyle={{ background: "hsl(222,47%,9%)", border: "1px solid hsl(222,30%,20%)", borderRadius: "8px", fontSize: 12 }}
                        labelStyle={{ color: "hsl(215,20%,55%)" }}
                      />
                      <Area type="monotone" dataKey="value" stroke={SIGNAL_CONFIGS[activeTimePlot].color}
                        fill={SIGNAL_CONFIGS[activeTimePlot].gradient} strokeWidth={1.5} dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </motion.div>
              </AnimatePresence>
            )}
          </div>

          {/* Frequency Spectrum */}
          <div className="rounded-xl border border-border/60 bg-card/80 p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/15 text-sm">📡</div>
                <h2 className="text-lg font-bold text-foreground">Frequency Spectrum</h2>
              </div>
              <div className="flex items-center gap-2">
                {results && (
                  <>
                    {/* View toggle */}
                    <div className="flex rounded-lg bg-secondary/50 p-0.5">
                      <button
                        onClick={() => setSpectrumView("individual")}
                        className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-all ${
                          spectrumView === "individual" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                        }`}
                      >Individual</button>
                      <button
                        onClick={() => setSpectrumView("overlay")}
                        className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-all ${
                          spectrumView === "overlay" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                        }`}
                      >Overlay</button>
                    </div>
                    {/* Zoom controls */}
                    <span className="text-[10px] text-muted-foreground">0–{freqZoomMax} kHz</span>
                    <button onClick={() => setFreqZoomIdx(i => Math.max(0, i - 1))} disabled={freqZoomIdx === 0}
                      className="flex h-7 w-7 items-center justify-center rounded-md bg-secondary/60 text-xs font-bold text-foreground transition-colors hover:bg-secondary disabled:opacity-30" title="Zoom in">🔍+</button>
                    <button onClick={() => setFreqZoomIdx(i => Math.min(ZOOM_LEVELS_FREQ.length - 1, i + 1))} disabled={freqZoomIdx === ZOOM_LEVELS_FREQ.length - 1}
                      className="flex h-7 w-7 items-center justify-center rounded-md bg-secondary/60 text-xs font-bold text-foreground transition-colors hover:bg-secondary disabled:opacity-30" title="Zoom out">🔍−</button>
                    <button onClick={() => setFreqZoomIdx(4)}
                      className="rounded-md bg-secondary/60 px-2 py-1 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">Reset</button>
                  </>
                )}
              </div>
            </div>

            {!results ? <EmptyPlot /> : spectrumView === "overlay" ? (
              /* Overlay view: all three spectrums on one chart */
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-lg bg-secondary/20 p-3">
                <div className="mb-3 flex flex-wrap items-center gap-4">
                  {SPECTRUM_CONFIGS.map(({ label, color }) => (
                    <div key={label} className="flex items-center gap-1.5">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
                      <span className="text-xs font-medium text-muted-foreground">{label}</span>
                    </div>
                  ))}
                </div>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                    <XAxis dataKey="freq" tick={{ fontSize: 10, fill: "hsl(215,20%,45%)" }} type="number"
                      domain={[0, freqZoomMax]} allowDataOverflow
                      label={{ value: "Frequency (kHz)", position: "insideBottomRight", offset: -5, fontSize: 10, fill: "hsl(215,20%,45%)" }} />
                    <YAxis tick={{ fontSize: 10, fill: "hsl(215,20%,45%)" }}
                      label={{ value: "|X(f)|", angle: -90, position: "insideLeft", offset: 10, fontSize: 10, fill: "hsl(215,20%,45%)" }} />
                    <Tooltip
                      contentStyle={{ background: "hsl(222,47%,9%)", border: "1px solid hsl(222,30%,20%)", borderRadius: "8px", fontSize: 11 }}
                    />
                    {SPECTRUM_CONFIGS.map(({ key, color }) => (
                      <Line key={key} data={spectrumToChart(results[key])} dataKey="mag" stroke={color}
                        strokeWidth={2} dot={false} name={key} type="monotone" />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </motion.div>
            ) : (
              /* Individual view */
              <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-3">
                {SPECTRUM_CONFIGS.map(({ key, label, color }) => (
                  <motion.div key={key} className="rounded-lg bg-secondary/20 p-3"
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="mb-2 flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full" style={{ background: color }} />
                      <span className="text-xs font-semibold text-muted-foreground">{label}</span>
                    </div>
                    <ResponsiveContainer width="100%" height={280}>
                      <AreaChart data={spectrumToChart(results[key])}>
                        <defs>
                          <linearGradient id={`specGrad-${key}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={color} stopOpacity={0.4} />
                            <stop offset="100%" stopColor={color} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                        <XAxis dataKey="freq" tick={{ fontSize: 9, fill: "hsl(215,20%,45%)" }}
                          label={{ value: "Frequency (kHz)", position: "insideBottomRight", offset: -5, fontSize: 9, fill: "hsl(215,20%,45%)" }} />
                        <YAxis tick={{ fontSize: 9, fill: "hsl(215,20%,45%)" }}
                          label={{ value: "|X(f)|", angle: -90, position: "insideLeft", offset: 10, fontSize: 9, fill: "hsl(215,20%,45%)" }} />
                        <Tooltip
                          contentStyle={{ background: "hsl(222,47%,9%)", border: "1px solid hsl(222,30%,20%)", borderRadius: "8px", fontSize: 11 }}
                        />
                        <Area type="monotone" dataKey="mag" stroke={color} fill={`url(#specGrad-${key})`} strokeWidth={1.5} dot={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SimulatorTab;
