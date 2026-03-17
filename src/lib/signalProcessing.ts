// Signal processing utilities for VSB/SSB simulation

export function generateTimeArray(duration: number, fs: number): number[] {
  const N = Math.floor(duration * fs);
  const t: number[] = new Array(N);
  for (let i = 0; i < N; i++) t[i] = i / fs;
  return t;
}

export function messageSignal(t: number[], f1: number, f2: number): number[] {
  return t.map(ti => Math.cos(2 * Math.PI * f1 * ti) + Math.cos(2 * Math.PI * f2 * ti));
}

export function carrierSignal(t: number[], Ac: number, fc: number): number[] {
  return t.map(ti => Ac * Math.cos(2 * Math.PI * fc * ti));
}

export function dsbSignal(message: number[], carrier: number[]): number[] {
  return message.map((m, i) => m * carrier[i]);
}

// Simple Hilbert transform approximation using FIR
function hilbertTransform(signal: number[]): number[] {
  const N = signal.length;
  const result = new Array(N).fill(0);
  // Use a windowed FIR Hilbert transformer
  const M = 63; // filter half-length
  for (let n = 0; n < N; n++) {
    let sum = 0;
    for (let k = -M; k <= M; k++) {
      if (k === 0) continue;
      if (k % 2 !== 0) {
        const idx = n - k;
        if (idx >= 0 && idx < N) {
          const h = 2 / (Math.PI * k);
          // Hamming window
          const w = 0.54 - 0.46 * Math.cos(2 * Math.PI * (k + M) / (2 * M));
          sum += signal[idx] * h * w;
        }
      }
    }
    result[n] = sum;
  }
  return result;
}

export function ssbSignal(t: number[], message: number[], fc: number): number[] {
  const mh = hilbertTransform(message);
  return t.map((ti, i) =>
    message[i] * Math.cos(2 * Math.PI * fc * ti) - mh[i] * Math.sin(2 * Math.PI * fc * ti)
  );
}

// Simple lowpass Butterworth-ish filter using moving average cascade
function lowpassFilter(signal: number[], cutoffRatio: number): number[] {
  const windowSize = Math.max(3, Math.round(1 / cutoffRatio));
  let result = [...signal];
  // Apply 3 passes for sharper rolloff
  for (let pass = 0; pass < 3; pass++) {
    const temp = new Array(result.length).fill(0);
    for (let i = 0; i < result.length; i++) {
      let sum = 0;
      let count = 0;
      for (let j = -windowSize; j <= windowSize; j++) {
        const idx = i + j;
        if (idx >= 0 && idx < result.length) {
          sum += result[idx];
          count++;
        }
      }
      temp[i] = sum / count;
    }
    result = temp;
  }
  return result;
}

export function vsbSignal(dsb: number[], fc: number, fs: number, vestigeWidth: number): number[] {
  const cutoff = (fc + vestigeWidth) / (fs / 2);
  return lowpassFilter(dsb, cutoff);
}

// Compute magnitude spectrum (positive frequencies only)
export function computeSpectrum(signal: number[], fs: number): { freq: number[]; mag: number[] } {
  const N = signal.length;
  const halfN = Math.floor(N / 2);

  // DFT with downsampling for performance
  const maxBins = 512;
  const step = Math.max(1, Math.floor(halfN / maxBins));
  const freq: number[] = [];
  const mag: number[] = [];

  for (let k = 0; k < halfN; k += step) {
    let re = 0, im = 0;
    // Use decimated input for speed
    const decimation = Math.max(1, Math.floor(N / 2048));
    for (let n = 0; n < N; n += decimation) {
      const angle = (2 * Math.PI * k * n) / N;
      re += signal[n] * Math.cos(angle);
      im -= signal[n] * Math.sin(angle);
    }
    freq.push((k * fs) / N);
    mag.push(Math.sqrt(re * re + im * im) / (N / decimation));
  }

  return { freq, mag };
}

// Downsample signal for chart display
export function downsampleForChart(
  t: number[],
  signal: number[],
  maxPoints: number = 500
): { time: number; value: number }[] {
  const step = Math.max(1, Math.floor(t.length / maxPoints));
  const data: { time: number; value: number }[] = [];
  for (let i = 0; i < t.length; i += step) {
    data.push({ time: t[i] * 1000, value: signal[i] }); // time in ms
  }
  return data;
}
