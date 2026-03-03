import { useState } from "react";
import StepContext from "./steps/StepContext";
import StepUseCases from "./steps/StepUseCases";
import StepResults from "./steps/StepResults";
import "./index.css";

const STEPS = ["Kontext", "Use Cases", "Report"];

export default function App() {
  const [step, setStep] = useState(0);
  const [context, setContext] = useState({});
  const [useCases, setUseCases] = useState([]);
  const [results, setResults] = useState([]);

  const next = () => setStep(s => Math.min(s + 1, STEPS.length - 1));
  const back = () => setStep(s => Math.max(s - 1, 0));

  return (
    <div className="app">
      <header className="header">
        <div className="logo">
          <div className="ld r"/><div className="ld o"/><div className="ld g"/>
        </div>
        <div>
          <div className="h-title">KI-Datenampel</div>
          <div className="h-sub">AI Governance · EU AI Act Art. 4</div>
        </div>
        <div className="h-space"/>
        <div className="steps">
          {STEPS.map((s, i) => (
            <button key={s} className={`sp ${i === step ? "active" : ""} ${i < step ? "done" : ""}`}
              onClick={() => i < step && setStep(i)} disabled={i > step}>
              <span className="sp-n">{i < step ? "✓" : i + 1}</span>
              <span className="sp-label">{s}</span>
            </button>
          ))}
        </div>
      </header>

      <main className="main">
        {step === 0 && <StepContext context={context} setContext={setContext} onNext={next}/>}
        {step === 1 && <StepUseCases useCases={useCases} setUseCases={setUseCases} context={context} setResults={setResults} onNext={next} onBack={back}/>}
        {step === 2 && <StepResults results={results} setResults={setResults} context={context} onBack={back}/>}
      </main>

      <footer className="footer">
        <span>KI-Datenampel · k&amp;n edvkonzepte GmbH · Stand 2026</span>
        <span>Kein Rechtsrat · Für interne Governance &amp; Nachweisbarkeit (Art. 4 EU AI Act)</span>
      </footer>
    </div>
  );
}
