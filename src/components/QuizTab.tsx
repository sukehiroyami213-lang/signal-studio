import { useState } from "react";
import { motion } from "framer-motion";

interface Question {
  question: string;
  options: string[];
  correct: number;
}

const questions: Question[] = [
  {
    question: "What is the primary advantage of VSB over DSB-SC?",
    options: [
      "Higher power efficiency",
      "Reduced bandwidth while preserving low-frequency components",
      "Simpler transmitter design",
      "Better noise immunity",
    ],
    correct: 1,
  },
  {
    question: "In VSB modulation, what does the 'vestige' refer to?",
    options: [
      "The carrier signal",
      "A small portion of the suppressed sideband",
      "The entire lower sideband",
      "The modulating signal",
    ],
    correct: 1,
  },
  {
    question: "What is the bandwidth of a VSB signal?",
    options: [
      "2·f_m",
      "f_m",
      "f_m + f_v",
      "f_c + f_m",
    ],
    correct: 2,
  },
  {
    question: "Why is SSB not ideal for analog TV broadcasting?",
    options: [
      "It uses too much bandwidth",
      "It distorts low-frequency components near DC",
      "It requires a very high carrier frequency",
      "It cannot be demodulated",
    ],
    correct: 1,
  },
  {
    question: "What mathematical operation produces the DSB-SC signal?",
    options: [
      "Addition of message and carrier",
      "Multiplication of message and carrier",
      "Convolution of message and carrier",
      "Subtraction of message from carrier",
    ],
    correct: 1,
  },
];

const QuizTab = () => {
  const [currentQ, setCurrentQ] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [finished, setFinished] = useState(false);

  const handleSelect = (idx: number) => {
    if (selected !== null) return;
    setSelected(idx);
    setShowResult(true);
    if (idx === questions[currentQ].correct) {
      setScore(s => s + 1);
    }
    setTimeout(() => {
      if (currentQ < questions.length - 1) {
        setCurrentQ(q => q + 1);
        setSelected(null);
        setShowResult(false);
      } else {
        setFinished(true);
      }
    }, 1500);
  };

  const restart = () => {
    setCurrentQ(0);
    setScore(0);
    setSelected(null);
    setShowResult(false);
    setFinished(false);
  };

  if (finished) {
    return (
      <div className="container mx-auto flex max-w-2xl flex-col items-center px-6 py-20">
        <motion.div className="card-dashed w-full text-center" initial={{ scale: 0.9 }} animate={{ scale: 1 }}>
          <h2 className="text-3xl font-bold text-foreground">Quiz Complete!</h2>
          <p className="mt-4 text-xl text-muted-foreground">
            Your score: <span className="text-primary font-bold">{score}</span> / {questions.length}
          </p>
          <button onClick={restart} className="mt-8 rounded-lg bg-primary px-8 py-3 font-semibold text-primary-foreground hover:bg-primary/90">
            Try Again
          </button>
        </motion.div>
      </div>
    );
  }

  const q = questions[currentQ];

  return (
    <div className="container mx-auto max-w-2xl px-6 py-10">
      <motion.div className="card-dashed" key={currentQ} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="text-center">
          <h2 className="text-3xl font-bold text-foreground">Test Your Knowledge</h2>
          <p className="mt-2 text-muted-foreground">Can you master VSB modulation?</p>
        </div>

        <div className="mt-8 flex items-center justify-between">
          <span className="text-sm font-semibold text-primary">Question {currentQ + 1}/{questions.length}</span>
          <span className="text-sm text-muted-foreground">Score: {score}</span>
        </div>

        <h3 className="mt-4 text-lg font-bold text-foreground">{q.question}</h3>

        <div className="mt-6 space-y-3">
          {q.options.map((opt, i) => {
            let cls = "quiz-option";
            if (showResult && i === q.correct) cls += " quiz-option-correct";
            else if (showResult && i === selected && i !== q.correct) cls += " quiz-option-wrong";

            return (
              <button key={i} onClick={() => handleSelect(i)} className={`${cls} block w-full text-left`}>
                <p className="text-foreground">{opt}</p>
              </button>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};

export default QuizTab;
