import { describe, it, expect } from "vitest";
import {
  generateTimeArray,
  messageSignal,
  carrierSignal,
  dsbSignal,
  ssbSignal,
  vsbSignal,
  computeSpectrum,
  downsampleForChart,
} from "@/lib/signalProcessing";

describe("generateTimeArray", () => {
  it("produces correct length and spacing", () => {
    const t = generateTimeArray(0.001, 10000); // 1 ms at 10 kHz
    expect(t).toHaveLength(10);
    expect(t[0]).toBe(0);
    expect(t[1]).toBeCloseTo(0.0001, 8);
  });
});

describe("messageSignal", () => {
  it("returns sum of two cosines with correct amplitude", () => {
    const t = generateTimeArray(0.001, 10000);
    const m = messageSignal(t, 1000, 2000);
    // At t=0, cos(0)+cos(0)=2
    expect(m[0]).toBeCloseTo(2, 5);
    expect(m).toHaveLength(t.length);
  });
});

describe("carrierSignal", () => {
  it("returns Ac*cos at t=0", () => {
    const t = generateTimeArray(0.001, 100000);
    const c = carrierSignal(t, 10, 50000);
    expect(c[0]).toBeCloseTo(10, 5);
  });
});

describe("dsbSignal", () => {
  it("is product of message and carrier", () => {
    const t = generateTimeArray(0.001, 100000);
    const m = messageSignal(t, 1000, 4000);
    const c = carrierSignal(t, 10, 50000);
    const dsb = dsbSignal(m, c);
    expect(dsb[0]).toBeCloseTo(m[0] * c[0], 5);
    expect(dsb).toHaveLength(t.length);
  });
});

describe("ssbSignal", () => {
  it("produces output of same length as input", () => {
    const t = generateTimeArray(0.005, 500000);
    const m = messageSignal(t, 1000, 4000);
    const ssb = ssbSignal(t, m, 50000);
    expect(ssb).toHaveLength(t.length);
  });
});

describe("vsbSignal", () => {
  it("produces output of same length as input", () => {
    const t = generateTimeArray(0.005, 500000);
    const m = messageSignal(t, 1000, 4000);
    const c = carrierSignal(t, 10, 50000);
    const dsb = dsbSignal(m, c);
    const vsb = vsbSignal(dsb, 50000, 500000, 3000);
    expect(vsb).toHaveLength(t.length);
  });
});

describe("computeSpectrum", () => {
  it("returns freq and mag arrays of equal length", () => {
    const t = generateTimeArray(0.005, 500000);
    const m = messageSignal(t, 1000, 4000);
    const spec = computeSpectrum(m, 500000);
    expect(spec.freq.length).toBe(spec.mag.length);
    expect(spec.freq.length).toBeGreaterThan(0);
    // Frequencies should be non-negative
    expect(spec.freq[0]).toBeGreaterThanOrEqual(0);
  });
});

describe("downsampleForChart", () => {
  it("limits output to maxPoints", () => {
    const t = generateTimeArray(0.005, 500000);
    const m = messageSignal(t, 1000, 4000);
    const data = downsampleForChart(t, m, 100);
    expect(data.length).toBeLessThanOrEqual(100);
    expect(data[0]).toHaveProperty("time");
    expect(data[0]).toHaveProperty("value");
    // Time should be in ms
    expect(data[0].time).toBe(0);
  });
});

describe("DSB spectrum has two sidebands", () => {
  it("shows energy around carrier frequency", () => {
    const fs = 500000;
    const t = generateTimeArray(0.01, fs);
    const m = messageSignal(t, 1000, 4000);
    const c = carrierSignal(t, 10, 50000);
    const dsb = dsbSignal(m, c);
    const spec = computeSpectrum(dsb, fs);

    // Find peak frequency
    const maxMag = Math.max(...spec.mag);
    const peakIdx = spec.mag.indexOf(maxMag);
    const peakFreq = spec.freq[peakIdx];

    // Peak should be in the sideband region around fc (46–54 kHz)
    expect(peakFreq).toBeGreaterThan(40000);
    expect(peakFreq).toBeLessThan(60000);
    // Magnitude should be significant
    expect(maxMag).toBeGreaterThan(0);
  });
});
