import { motion } from "framer-motion";

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
};

const TheoryTab = () => {
  return (
    <div className="container mx-auto max-w-4xl space-y-8 px-6 py-10">
      {/* Section 1: Problem Statement */}
      <motion.div className="card-dashed" {...fadeIn}>
        <span className="technique-badge technique-a">Overview</span>
        <h2 className="mt-4 text-2xl font-bold text-foreground">
          1. Problem Statement
        </h2>
        <p className="mt-4 leading-relaxed text-muted-foreground">
          In analog TV broadcasting, video signals contain a wide range of
          frequencies and require efficient bandwidth utilization while
          maintaining signal quality. Vestigial Sideband (VSB) modulation is
          used instead of conventional AM or SSB modulation.
        </p>
        <p className="mt-3 leading-relaxed text-muted-foreground">
          Consider a TV video signal represented by a combination of two
          frequency components at <strong className="text-foreground">1 kHz</strong> and{" "}
          <strong className="text-foreground">4 kHz</strong>. This signal is transmitted
          using a carrier frequency of <strong className="text-foreground">50 kHz</strong>.
        </p>
      </motion.div>

      {/* Section 2: DSB-SC & SSB */}
      <motion.div className="card-dashed" {...fadeIn} transition={{ delay: 0.1 }}>
        <span className="technique-badge technique-a">Technique A</span>
        <h2 className="mt-4 text-2xl font-bold text-foreground">
          2. DSB-SC & SSB Modulation
        </h2>
        <p className="mt-4 leading-relaxed text-muted-foreground">
          <strong className="text-foreground">DSB-SC (Double Sideband Suppressed Carrier)</strong>{" "}
          multiplies the message signal directly with the carrier, producing both upper and lower
          sidebands without the carrier component. It uses bandwidth = 2f<sub>m</sub>.
        </p>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="card-dashed">
            <h3 className="text-lg font-semibold text-primary">DSB-SC</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              s(t) = m(t) · A<sub>c</sub>cos(2πf<sub>c</sub>t). Transmits{" "}
              <em>both</em> sidebands. Bandwidth = 2f<sub>m</sub>. Simple but
              bandwidth-inefficient.
            </p>
          </div>
          <div className="card-dashed">
            <h3 className="text-lg font-semibold text-accent">SSB</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Uses Hilbert transform to remove one sideband. Bandwidth = f<sub>m</sub>.
              Most bandwidth-efficient but distorts low-frequency components near DC.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Section 3: VSB */}
      <motion.div className="card-dashed" {...fadeIn} transition={{ delay: 0.2 }}>
        <span className="technique-badge technique-b">Technique B</span>
        <h2 className="mt-4 text-2xl font-bold text-foreground">
          3. Vestigial Sideband (VSB)
        </h2>
        <p className="mt-4 leading-relaxed text-muted-foreground">
          VSB transmits one complete sideband plus a small portion (vestige) of the other sideband.
          This preserves low-frequency components that SSB would distort.
        </p>
        <div className="mt-4 card-dashed">
          <p className="font-mono text-sm text-foreground">
            BW<sub>VSB</sub> = f<sub>m</sub> + f<sub>v</sub>
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Where f<sub>v</sub> = vestigial frequency width
          </p>
        </div>
      </motion.div>

      {/* Section 4: Why VSB */}
      <motion.div className="card-dashed" {...fadeIn} transition={{ delay: 0.3 }}>
        <span className="technique-badge technique-b">Key Insight</span>
        <h2 className="mt-4 text-2xl font-bold text-foreground">
          4. Why VSB for TV Broadcasting?
        </h2>
        <ul className="mt-4 space-y-2 text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="mt-1 text-primary">•</span>
            Saves bandwidth compared to AM / DSB-SC
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 text-primary">•</span>
            Allows easier demodulation than SSB
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 text-primary">•</span>
            Preserves low-frequency components critical for video
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 text-primary">•</span>
            Provides better signal quality overall
          </li>
        </ul>
      </motion.div>

      {/* Section 5: Mathematical Formulation */}
      <motion.div className="card-dashed" {...fadeIn} transition={{ delay: 0.4 }}>
        <span className="technique-badge technique-a">Formulation</span>
        <h2 className="mt-4 text-2xl font-bold text-foreground">
          5. Signal Definitions
        </h2>
        <div className="mt-4 space-y-3 font-mono text-sm text-foreground">
          <p>Message: m(t) = cos(2π·1000·t) + cos(2π·4000·t)</p>
          <p>Carrier: c(t) = A<sub>c</sub>·cos(2π·50000·t)</p>
          <p>DSB-SC: s(t) = m(t)·c(t)</p>
          <p>SSB: s(t) = m(t)·cos(2πf<sub>c</sub>t) − m̂(t)·sin(2πf<sub>c</sub>t)</p>
          <p>VSB: LPF&#123; DSB-SC &#125; with cutoff = f<sub>c</sub> + f<sub>v</sub></p>
        </div>
      </motion.div>
    </div>
  );
};

export default TheoryTab;
